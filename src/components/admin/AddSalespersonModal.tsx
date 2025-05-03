"use client";

import { useState, useEffect } from "react";
import { CreateSalespersonInput } from "@/types/salesperson";
import { formatPhoneNumber, unformatPhoneNumber } from "@/utils/formatters";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface AddSalespersonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSalespersonAdded?: () => void;
}

export default function AddSalespersonModal({
  isOpen,
  onClose,
  onSalespersonAdded,
}: AddSalespersonModalProps) {
  const [formData, setFormData] = useState<CreateSalespersonInput>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    password: "Default@123",
    role: "salesperson",
    twilio_number: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<CreateSalespersonInput>>({});
  const [apiError, setApiError] = useState<string | null>(null);

  const handlePhoneChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "phone" | "twilio_number"
  ) => {
    const { value } = e.target;
    const formattedValue = formatPhoneNumber(value);

    setFormData((prev) => ({
      ...prev,
      [field]: formattedValue,
    }));

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === "phone" || name === "twilio_number") {
      handlePhoneChange(e, name as "phone" | "twilio_number");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name as keyof CreateSalespersonInput]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if (apiError) {
      setApiError(null);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<CreateSalespersonInput> = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = "First name is required";
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = "Last name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    const phoneRegex =
      /^\+?1?\s*\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/;

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone is required";
    } else if (!phoneRegex.test(unformatPhoneNumber(formData.phone))) {
      newErrors.phone = "Invalid phone number format";
    }

    if (
      formData.twilio_number &&
      !phoneRegex.test(unformatPhoneNumber(formData.twilio_number))
    ) {
      newErrors.twilio_number = "Invalid Twilio number format";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    if (!validateForm()) {
      if (errors.phone) {
        toast.error("Please enter a valid phone number");
      }
      if (errors.twilio_number) {
        toast.error("Please enter a valid Twilio number");
      }
      toast.error("Please fix the form errors before submitting");
      return;
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading("Creating new salesperson...");

    try {
      const response = await fetch("/api/admin-salespersons/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          phone: unformatPhoneNumber(formData.phone),
          twilio_number: formData.twilio_number
            ? unformatPhoneNumber(formData.twilio_number)
            : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create salesperson");
      }

      toast.success("Salesperson created successfully!", {
        id: loadingToast,
      });

      if (onSalespersonAdded) {
        onSalespersonAdded();
      }

      onClose();
    } catch (error) {
      console.error("Error creating salesperson:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create salesperson",
        {
          id: loadingToast,
        }
      );
      setApiError(
        error instanceof Error ? error.message : "Failed to create salesperson"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Add New Salesperson</DialogTitle>
          <DialogDescription>
            Add a new member to your sales team. They'll receive login
            credentials via email.
          </DialogDescription>
        </DialogHeader>

        {apiError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{apiError}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name</Label>
              <Input
                id="first_name"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                placeholder="John"
                className={cn(errors.first_name && "border-destructive")}
              />
              {errors.first_name && (
                <p className="text-xs text-destructive">{errors.first_name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                placeholder="Doe"
                className={cn(errors.last_name && "border-destructive")}
              />
              {errors.last_name && (
                <p className="text-xs text-destructive">{errors.last_name}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="john@example.com"
              className={cn(errors.email && "border-destructive")}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              placeholder="(555) 123-4567"
              className={cn(errors.phone && "border-destructive")}
            />
            {errors.phone && (
              <p className="text-xs text-destructive">{errors.phone}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="twilio_number">
              Twilio Number
              <span className="text-xs text-muted-foreground ml-2">
                (Optional)
              </span>
            </Label>
            <Input
              id="twilio_number"
              name="twilio_number"
              type="tel"
              value={formData.twilio_number}
              onChange={handleChange}
              placeholder="+1 (555) 123-4567"
              className={cn(errors.twilio_number && "border-destructive")}
            />
            {errors.twilio_number ? (
              <p className="text-xs text-destructive">{errors.twilio_number}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Format: +1XXXXXXXXXX (include country code)
              </p>
            )}
          </div>

          <Alert>
            <AlertDescription>
              New salespersons will receive a default password of{" "}
              <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
                Default@123
              </code>
            </AlertDescription>
          </Alert>

          <div className="flex justify-end gap-3">
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Salesperson"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
