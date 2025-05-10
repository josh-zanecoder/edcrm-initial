"use client";

import { useState, useEffect } from "react";
import { Member, MemberRole } from "@/types/member";
import { formatPhoneNumber } from "@/utils/formatters";
import { X, Loader2, Mail, Phone, User } from "lucide-react";
import { toast } from "sonner";
import { useMembersStore } from "@/store/useMemberStore";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  prospectId: string;
  initialData?: Partial<Member>;
  mode?: "add" | "edit";
}

export default function AddEditMemberModal({
  isOpen,
  onClose,
  prospectId,
  initialData,
  mode = "add",
}: AddMemberModalProps) {
  // Get store actions and state
  const { collegeName, addMember, updateMember } = useMembersStore();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    role: MemberRole.Other,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<typeof formData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Only reset form data when modal is opened
    if (isOpen) {
      if (initialData) {
        setFormData({
          firstName: initialData.firstName || "",
          lastName: initialData.lastName || "",
          phone: initialData.phone ? formatPhoneNumber(initialData.phone) : "",
          email: initialData.email || "",
          role: initialData.role || MemberRole.Other,
        });
      } else {
        setFormData({
          firstName: "",
          lastName: "",
          phone: "",
          email: "",
          role: MemberRole.Other,
        });
      }
      setErrors({});
      setIsSubmitting(false);
    }
  }, [initialData, isOpen]);

  const validateForm = () => {
    const newErrors: Partial<typeof formData> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\(\d{3}\) \d{3}-\d{4}$/;

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }
    if (!formData.phone) {
      newErrors.phone = "Phone number is required";
    } else if (!phoneRegex.test(formData.phone)) {
      newErrors.phone = "Invalid phone format";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the form errors before submitting");
      return;
    }

    // Set submitting state to true to prevent unwanted modal closing/reopening
    setIsSubmitting(true);
    setIsLoading(true);

    const loadingToast = toast.loading("Saving member...");
    try {
      const unformattedPhone = formData.phone.replace(/\D/g, "");
      const memberData = {
        ...formData,
        phone: unformattedPhone,
        prospectId,
        collegeName,
      };

      if (mode === "edit" && initialData?._id) {
        await updateMember(prospectId, initialData._id, memberData);
      } else {
        await addMember(prospectId, memberData);
      }

      toast.success(
        mode === "edit"
          ? "Member updated successfully"
          : "Member added successfully",
        { id: loadingToast }
      );

      // Only close the modal after operations are complete
      onClose();
    } catch (error) {
      toast.error(
        mode === "edit" ? "Failed to update member" : "Failed to add member",
        { id: loadingToast }
      );
      console.error("Error saving member:", error);
      // Reset submitting state on error
      setIsSubmitting(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    if (field === "phone") {
      if (value.replace(/\D/g, "").length <= 10) {
        setFormData((prev) => ({
          ...prev,
          [field]: formatPhoneNumber(value),
        }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
    if (errors[field as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // If form is submitting, don't let the Dialog close on escape or overlay click
  const handleOpenChange = (open: boolean) => {
    if (!isSubmitting && !isLoading) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {mode === "edit" ? "Edit Member" : "Add New Member"}
          </DialogTitle>
          <DialogDescription>
            {mode === "edit"
              ? "Update the member details below."
              : "Fill in the member details below."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleChange("firstName", e.target.value)}
                  placeholder="John"
                  className={cn(
                    "pl-9",
                    errors.firstName && "border-destructive"
                  )}
                  required
                  disabled={isLoading || isSubmitting}
                />
              </div>
              {errors.firstName && (
                <p className="text-xs text-destructive">{errors.firstName}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleChange("lastName", e.target.value)}
                  placeholder="Doe"
                  className={cn(
                    "pl-9",
                    errors.lastName && "border-destructive"
                  )}
                  required
                  disabled={isLoading || isSubmitting}
                />
              </div>
              {errors.lastName && (
                <p className="text-xs text-destructive">{errors.lastName}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="john@example.com"
                className={cn("pl-9", errors.email && "border-destructive")}
                required
                disabled={isLoading || isSubmitting}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="(XXX) XXX-XXXX"
                className={cn("pl-9", errors.phone && "border-destructive")}
                required
                disabled={isLoading || isSubmitting}
              />
            </div>
            {errors.phone && (
              <p className="text-xs text-destructive">{errors.phone}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select
              value={formData.role}
              onValueChange={(value) => handleChange("role", value)}
              disabled={isLoading || isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(MemberRole).map((role) => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              type="button"
              onClick={onClose}
              disabled={isLoading || isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || isSubmitting}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {mode === "edit" ? "Saving..." : "Adding..."}
                </>
              ) : mode === "edit" ? (
                "Save Changes"
              ) : (
                "Add Member"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
