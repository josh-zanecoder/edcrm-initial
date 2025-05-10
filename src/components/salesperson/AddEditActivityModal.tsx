import { useState, useEffect } from "react";
import { Activity, ActivityType, ActivityStatus } from "@/types/activity";
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
  DialogDescription,
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
import { cn } from "@/lib/utils";

interface AddActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    activity: Omit<Activity, "_id" | "createdAt" | "updatedAt" | "addedBy">
  ) => Promise<void>;
  prospectId: string;
  initialData?: Partial<Activity>;
  mode?: "add" | "edit";
}

const ReadOnlyInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>((props, ref) => <input {...props} ref={ref} readOnly />);

export default function AddActivityModal({
  isOpen,
  onClose,
  onSave,
  prospectId,
  initialData,
  mode = "add",
}: AddActivityModalProps) {
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    type: ActivityType;
    status: ActivityStatus;
    dueDate: Date | null;
    isActive: boolean;
  }>({
    title: "",
    description: "",
    type: ActivityType.TASK,
    status: ActivityStatus.PENDING,
    dueDate: new Date(),
    isActive: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Only reset form data when the modal is opened, not when closing
  useEffect(() => {
    if (isOpen) {
      setHasSubmitted(false);

      if (initialData) {
        setFormData({
          title: initialData.title || "",
          description: initialData.description || "",
          type: initialData.type || ActivityType.TASK,
          status: initialData.status || ActivityStatus.PENDING,
          dueDate: initialData.dueDate
            ? new Date(initialData.dueDate)
            : new Date(),
          isActive: initialData.isActive ?? true,
        });
      } else {
        setFormData({
          title: "",
          description: "",
          type: ActivityType.TASK,
          status: ActivityStatus.PENDING,
          dueDate: new Date(),
          isActive: true,
        });
      }
    }
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setHasSubmitted(true); // Set submitted flag to prevent unwanted modal state changes
    const loadingToast = toast.loading("Saving activity...");

    try {
      await onSave({
        ...formData,
        dueDate: formData.dueDate ?? new Date(),
        prospectId,
      });
      toast.success(
        mode === "edit"
          ? "Activity updated successfully"
          : "Activity added successfully",
        {
          id: loadingToast,
        }
      );
      // Close modal only after successful operation
      onClose();
    } catch (error) {
      toast.error(
        mode === "edit"
          ? "Failed to update activity"
          : "Failed to add activity",
        {
          id: loadingToast,
        }
      );
      console.error("Error saving activity:", error);
    } finally {
      setIsLoading(false);
      // Don't reset hasSubmitted here - only reset when the modal is reopened
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Prevent closing during submission
  const handleOpenChange = (open: boolean) => {
    if (!hasSubmitted && !isLoading) {
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
          <DialogTitle className="text-lg sm:text-xl font-semibold">
            {mode === "edit" ? "Edit Activity" : "Add New Activity"}
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            {mode === "edit"
              ? "Update the activity details below."
              : "Fill in the activity details below."}
          </DialogDescription>
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
              placeholder="Enter activity title"
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
              placeholder="Enter activity description"
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
                  {Object.values(ActivityType).map((type) => (
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
                  {Object.values(ActivityStatus).map((status) => (
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
                "Add Activity"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
