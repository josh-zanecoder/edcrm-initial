import { useState, useEffect } from "react";
import { Reminder, ReminderType, ReminderStatus } from "@/types/reminder";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import React from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AddReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    reminder: Omit<Reminder, "_id" | "createdAt" | "updatedAt" | "addedBy">
  ) => Promise<boolean>;
  prospectId: string;
  initialData?: Partial<Reminder>;
  mode?: "add" | "edit";
}

const ReadOnlyInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>((props, ref) => <input {...props} ref={ref} readOnly />);

export default function AddReminderModal({
  isOpen,
  onClose,
  onSave,
  prospectId,
  initialData,
  mode = "add",
}: AddReminderModalProps) {
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    type: ReminderType;
    status: ReminderStatus;
    dueDate: Date | null;
    isActive: boolean;
  }>({
    title: "",
    description: "",
    type: ReminderType.EMAIL,
    status: ReminderStatus.PENDING,
    dueDate: new Date(),
    isActive: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Only reset form when the modal is actually opened
  useEffect(() => {
    if (isOpen) {
      setHasSubmitted(false);

      if (initialData) {
        setFormData({
          title: initialData.title || "",
          description: initialData.description || "",
          type: initialData.type || ReminderType.EMAIL,
          status: initialData.status || ReminderStatus.PENDING,
          dueDate: initialData.dueDate
            ? new Date(initialData.dueDate)
            : new Date(),
          isActive: initialData.isActive ?? true,
        });
      } else {
        setFormData({
          title: "",
          description: "",
          type: ReminderType.EMAIL,
          status: ReminderStatus.PENDING,
          dueDate: new Date(),
          isActive: true,
        });
      }
    }
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);
    setHasSubmitted(true);
    const loadingToast = toast.loading("Saving reminder...");

    try {
      // Call the save function and wait for result
      const success = await onSave({
        ...formData,
        dueDate: formData.dueDate ?? new Date(),
        prospectId,
      });

      // Show appropriate toast based on result
      if (success) {
        toast.success(
          mode === "edit"
            ? "Reminder updated successfully"
            : "Reminder added successfully",
          { id: loadingToast }
        );

        // Only close the modal if successful
        onClose();
      } else {
        toast.error(
          mode === "edit"
            ? "Failed to update reminder"
            : "Failed to add reminder",
          { id: loadingToast }
        );
      }
    } catch (error) {
      console.error("Error saving reminder:", error);
      toast.error(
        mode === "edit"
          ? "Failed to update reminder"
          : "Failed to add reminder",
        { id: loadingToast }
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Custom handler for modal open change
  const handleOpenChange = (open: boolean) => {
    if (!open && !isLoading && !hasSubmitted) {
      onClose();
    }
  };

  // Return null if modal shouldn't be open
  // This is an additional safeguard against unwanted rendering
  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg sm:text-xl font-semibold">
              {mode === "edit" ? "Edit Reminder" : "Add New Reminder"}
            </DialogTitle>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 pt-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm sm:text-base">
              Title
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              placeholder="Enter reminder title"
              required
              disabled={isLoading}
              className="text-sm sm:text-base"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm sm:text-base">
              Description
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Enter reminder description"
              rows={3}
              required
              disabled={isLoading}
              className="text-sm sm:text-base w-full max-w-full break-all whitespace-pre-wrap resize-none overflow-x-hidden"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label htmlFor="type" className="text-sm sm:text-base">
                Type
              </Label>
              <Select
                value={formData.type}
                onValueChange={(value) => handleChange("type", value)}
                disabled={isLoading}
              >
                <SelectTrigger className="text-sm sm:text-base">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(ReminderType).map((type) => (
                    <SelectItem
                      key={type}
                      value={type}
                      className="text-sm sm:text-base"
                    >
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status" className="text-sm sm:text-base">
                Status
              </Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleChange("status", value)}
                disabled={isLoading}
              >
                <SelectTrigger className="text-sm sm:text-base">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(ReminderStatus).map((status) => (
                    <SelectItem
                      key={status}
                      value={status}
                      className="text-sm sm:text-base"
                    >
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm sm:text-base">Due Date and Time</Label>
              <DatePicker
                selected={formData.dueDate}
                onChange={(date) =>
                  setFormData((prev) => ({ ...prev, dueDate: date }))
                }
                minDate={new Date()}
                placeholderText="Pick a date and time"
                showTimeSelect
                timeIntervals={15}
                timeCaption="Time"
                dateFormat="Pp"
                disabled={isLoading}
                className="w-full text-sm sm:text-base rounded-md border border-input bg-transparent px-3 py-1 shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                popperPlacement="top-start"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4">
            <Button
              variant="outline"
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="w-full sm:w-auto text-sm sm:text-base"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto text-sm sm:text-base"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {mode === "edit" ? "Saving..." : "Adding..."}
                </>
              ) : mode === "edit" ? (
                "Save Changes"
              ) : (
                "Add Reminder"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
