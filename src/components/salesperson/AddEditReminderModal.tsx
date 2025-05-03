import { useState, useEffect } from "react";
import { Reminder, ReminderType, ReminderStatus } from "@/types/reminder";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";

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
  ) => void;
  prospectId: string;
  initialData?: Partial<Reminder>;
  mode?: "add" | "edit";
}

export default function AddReminderModal({
  isOpen,
  onClose,
  onSave,
  prospectId,
  initialData,
  mode = "add",
}: AddReminderModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: ReminderType.EMAIL,
    status: ReminderStatus.PENDING,
    dueDate: new Date().toISOString().split("T")[0],
    isActive: true,
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || "",
        description: initialData.description || "",
        type: initialData.type || ReminderType.EMAIL,
        status: initialData.status || ReminderStatus.PENDING,
        dueDate: initialData.dueDate
          ? new Date(initialData.dueDate).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        isActive: initialData.isActive ?? true,
      });
    } else {
      setFormData({
        title: "",
        description: "",
        type: ReminderType.EMAIL,
        status: ReminderStatus.PENDING,
        dueDate: new Date().toISOString().split("T")[0],
        isActive: true,
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);
    const loadingToast = toast.loading("Saving reminder...");

    try {
      await onSave({
        ...formData,
        dueDate: new Date(formData.dueDate),
        prospectId,
      });
      toast.success(
        mode === "edit"
          ? "Reminder updated successfully"
          : "Reminder added successfully",
        {
          id: loadingToast,
        }
      );
    } catch (error) {
      toast.error(
        mode === "edit"
          ? "Failed to update reminder"
          : "Failed to add reminder",
        {
          id: loadingToast,
        }
      );
      console.error("Error saving reminder:", error);
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">
              {mode === "edit" ? "Edit Reminder" : "Add New Reminder"}
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
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              rows={4}
              required
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => handleChange("type", value)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(ReminderType).map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleChange("status", value)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(ReminderStatus).map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date</Label>
            <Input
              type="date"
              id="dueDate"
              value={formData.dueDate}
              onChange={(e) => handleChange("dueDate", e.target.value)}
              required
              disabled={isLoading}
            />
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
                "Add Reminder"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
