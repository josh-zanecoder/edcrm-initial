"use client";

import { useState, useEffect } from "react";
import { Member, MemberRole } from "@/types/member";
import { formatPhoneNumber } from "@/utils/formatters";
import { X, Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { toast } from "sonner";

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    member: Omit<Member, "_id" | "createdAt" | "updatedAt" | "addedBy">
  ) => void;
  prospectId: string;
  collegeName: string;
  initialData?: Partial<Member>;
  mode?: "add" | "edit";
}

export default function AddEditMemberModal({
  isOpen,
  onClose,
  onSave,
  prospectId,
  collegeName,
  initialData,
  mode = "add",
}: AddMemberModalProps) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    role: MemberRole.Other,
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
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
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const loadingToast = toast.loading("Saving member...");
    try {
      // Remove formatting before submitting
      const unformattedPhone = formData.phone.replace(/\D/g, "");
      await onSave({
        ...formData,
        phone: unformattedPhone,
        prospectId,
        collegeName,
      });
      toast.success(
        mode === "edit"
          ? "Member updated successfully"
          : "Member added successfully",
        {
          id: loadingToast,
        }
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    if (field === "phone") {
      // Limit to 14 characters (including formatting)
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
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">
              {mode === "edit" ? "Edit Member" : "Add New Member"}
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-background"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleChange("firstName", e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleChange("lastName", e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              placeholder="(XXX) XXX-XXXX"
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select
              value={formData.role}
              onValueChange={(value) => handleChange("role", value)}
              disabled={isLoading}
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
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
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
