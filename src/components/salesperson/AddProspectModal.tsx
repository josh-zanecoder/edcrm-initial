"use client";

import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { useState, useEffect } from "react";
import { Prospect, CollegeType } from "@/types/prospect";
import { formatPhoneNumber } from "@/utils/formatters";
import { X, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog as ShadDialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface AddProspectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    prospect: Omit<
      Prospect,
      "id" | "createdAt" | "updatedAt" | "addedBy" | "assignedTo"
    >
  ) => void;
}

const initialFormState = {
  collegeName: "",
  phone: "",
  email: "",
  address: {
    city: "",
    state: "",
    zip: "",
  },
  county: "",
  website: "",
  collegeTypes: [] as CollegeType[],
  bppeApproved: false,
  status: "New" as const,
  lastContact: new Date().toISOString().split("T")[0],
};

export default function AddProspectModal({
  isOpen,
  onClose,
  onSave,
}: AddProspectModalProps) {
  const [formData, setFormData] = useState(initialFormState);
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValidPhoneNumber = (phone: string): boolean => {
    const phoneRegex = /^\(\d{3}\) \d{3}-\d{4}$/;
    return phoneRegex.test(phone);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);
    const loadingToast = toast.loading("Saving prospect...");

    // Validate phone number before submitting
    if (!isValidPhoneNumber(formData.phone)) {
      toast.error(
        "Please enter a valid phone number in format (XXX) XXX-XXXX",
        {
          id: loadingToast,
        }
      );
      return;
    }

    try {
      await onSave(formData);
      // Reset form to initial state
      setFormData(initialFormState);
      // Close modal
      onClose();
      toast.success("Prospect added successfully", {
        id: loadingToast,
      });
    } catch (error) {
      toast.error("Failed to add prospect. Please try again.", {
        id: loadingToast,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    if (name === "phone") {
      const formattedPhone = formatPhoneNumber(value);
      setFormData((prev) => ({
        ...prev,
        [name]: formattedPhone,
      }));
      return;
    }

    if (name.startsWith("address.")) {
      const field = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        address: {
          ...prev.address,
          [field]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]:
          type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
      }));
    }
  };

  const handleTypeToggle = (type: CollegeType) => {
    setFormData((prev) => ({
      ...prev,
      collegeTypes: prev.collegeTypes.includes(type)
        ? prev.collegeTypes.filter((t) => t !== type)
        : [...prev.collegeTypes, type],
    }));
  };

  // Add useEffect to reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData(initialFormState);
      setIsTypeDropdownOpen(false);
    }
  }, [isOpen]);

  return (
    <ShadDialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Prospect</DialogTitle>
          <DialogDescription>
            Fill in the details below to add a new prospect to your list.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="collegeName">College Name</Label>
              <Input
                id="collegeName"
                name="collegeName"
                value={formData.collegeName}
                onChange={handleChange}
                placeholder="Enter college name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>College Types</Label>
              <Popover
                open={isTypeDropdownOpen}
                onOpenChange={setIsTypeDropdownOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={isTypeDropdownOpen}
                    className="w-full justify-between"
                  >
                    <span className="truncate">
                      {formData.collegeTypes.length > 0
                        ? formData.collegeTypes.join(", ")
                        : "Select college types..."}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                  <Command>
                    <CommandInput placeholder="Search college types..." />
                    <CommandEmpty>No college type found.</CommandEmpty>
                    <CommandGroup>
                      {Object.values(CollegeType).map((type) => (
                        <CommandItem
                          key={type}
                          onSelect={() => handleTypeToggle(type)}
                          className="flex items-center gap-2"
                        >
                          <Checkbox
                            checked={formData.collegeTypes.includes(type)}
                            className="h-4 w-4"
                          />
                          {type}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
              {formData.collegeTypes.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {formData.collegeTypes.map((type) => (
                    <Badge
                      key={type}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => handleTypeToggle(type)}
                    >
                      {type}
                      <X className="ml-1 h-3 w-3" />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="(555) 123-4567"
                maxLength={14}
                required
                className={cn(
                  formData.phone &&
                    !isValidPhoneNumber(formData.phone) &&
                    "border-destructive"
                )}
              />
              {formData.phone && !isValidPhoneNumber(formData.phone) && (
                <p className="text-xs text-destructive">
                  Please enter a valid phone number in format (XXX) XXX-XXXX
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="example@college.edu"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address.city">City</Label>
              <Input
                id="address.city"
                name="address.city"
                value={formData.address.city}
                onChange={handleChange}
                placeholder="Enter city"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address.state">State</Label>
              <Input
                id="address.state"
                name="address.state"
                value={formData.address.state}
                onChange={handleChange}
                placeholder="Enter state"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address.zip">ZIP Code</Label>
              <Input
                id="address.zip"
                name="address.zip"
                value={formData.address.zip}
                onChange={handleChange}
                placeholder="Enter ZIP code"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="county">County</Label>
              <Input
                id="county"
                name="county"
                value={formData.county}
                onChange={handleChange}
                placeholder="Enter county"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                name="website"
                type="url"
                value={formData.website}
                onChange={handleChange}
                placeholder="https://example.com"
                required
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="bppeApproved"
                name="bppeApproved"
                checked={formData.bppeApproved}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({
                    ...prev,
                    bppeApproved: checked as boolean,
                  }))
                }
              />
              <Label htmlFor="bppeApproved" className="text-sm font-normal">
                BPPE Approved
              </Label>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={onClose}
              type="button"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Prospect"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </ShadDialog>
  );
}
