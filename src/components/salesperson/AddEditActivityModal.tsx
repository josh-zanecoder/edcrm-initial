import { useState, useEffect } from "react";
import { Activity, ActivityType, ActivityStatus } from "@/types/activity";
import { X, Loader2, CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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

export default function AddActivityModal({
  isOpen,
  onClose,
  onSave,
  prospectId,
  initialData,
  mode = "add",
}: AddActivityModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: ActivityType.TASK,
    status: ActivityStatus.PENDING,
    dueDate: new Date(),
    isActive: true,
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
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
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const loadingToast = toast.loading("Saving activity...");
    try {
      await onSave({
        ...formData,
        dueDate: formData.dueDate,
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
          <DialogTitle className="text-xl font-semibold">
            {mode === "edit" ? "Edit Activity" : "Add New Activity"}
          </DialogTitle>
          <DialogDescription>
            {mode === "edit"
              ? "Update the activity details below."
              : "Fill in the activity details below."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              placeholder="Enter activity title"
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
              placeholder="Enter activity description"
              rows={4}
              required
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
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
                  {Object.values(ActivityType).map((type) => (
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
                  {Object.values(ActivityStatus).map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.dueDate && "text-muted-foreground"
                    )}
                    disabled={isLoading}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.dueDate ? (
                      format(formData.dueDate, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.dueDate}
                    onSelect={(date: Date | undefined) => {
                      if (date) {
                        setFormData((prev) => ({ ...prev, dueDate: date }));
                      }
                    }}
                    disabled={(date: Date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
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
                "Add Activity"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
