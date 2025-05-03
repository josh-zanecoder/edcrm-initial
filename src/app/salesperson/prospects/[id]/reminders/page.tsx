"use client";

import React, { useState, useEffect } from "react";
import { Reminder, ReminderStatus } from "@/types/reminder";
import AddEditReminderModal from "@/components/salesperson/AddEditReminderModal";
import {
  Bell,
  Clock,
  CheckCircle2,
  Trash2,
  Pencil,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

function formatDate(date: Date | string) {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getStatusVariant(status: ReminderStatus) {
  switch (status) {
    case ReminderStatus.SENT:
      return "default";
    case ReminderStatus.CANCELLED:
      return "destructive";
    default:
      return "secondary";
  }
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function RemindersPage({ params }: PageProps) {
  const resolvedParams = React.use(params);
  const id = resolvedParams.id;
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);

  const fetchReminders = React.useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);

      const response = await fetch(`/api/prospects/${id}/reminders`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch reminders");
      }
      const remindersData = await response.json();
      setReminders(remindersData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      toast.error("Failed to load reminders");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchReminders();
    }
  }, [id, fetchReminders]);

  const handleAddReminder = async (
    reminder: Omit<Reminder, "_id" | "createdAt" | "updatedAt" | "addedBy">
  ) => {
    try {
      const response = await fetch(`/api/prospects/${id}/reminders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...reminder,
          dueDate: reminder.dueDate.toISOString(),
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add reminder");
      }
      setIsModalOpen(false);
      await fetchReminders();
    } catch (err) {
      console.error("Error adding reminder:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to add reminder"
      );
    }
  };

  const handleDeleteReminder = async (reminderId: string) => {
    const loadingToast = toast.loading("Deleting reminder...");
    try {
      const response = await fetch(
        `/api/prospects/${id}/reminders/${reminderId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete reminder");
      }

      setReminders((prevReminders) =>
        prevReminders.filter((reminder) => reminder._id !== reminderId)
      );
      toast.success("Reminder removed successfully", {
        id: loadingToast,
      });
    } catch (err) {
      console.error("Error deleting reminder:", err);
      // toast.error(
      //   err instanceof Error ? err.message : "Failed to delete reminder",
      //   {
      //     id: loadingToast,
      //   }
      // );
      toast.error("Failed to delete reminder", {
        id: loadingToast,
      });
      fetchReminders();
    }
  };

  const handleEditClick = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setIsEditModalOpen(true);
  };

  const handleEditReminder = async (
    reminder: Omit<Reminder, "_id" | "createdAt" | "updatedAt" | "addedBy">
  ) => {
    if (!editingReminder) return;
    try {
      const response = await fetch(
        `/api/prospects/${id}/reminders/${editingReminder._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...reminder,
            dueDate: reminder.dueDate.toISOString(),
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update reminder");
      }

      setIsEditModalOpen(false);
      setEditingReminder(null);
      await fetchReminders();
    } catch (err) {
      console.error("Error updating reminder:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to update reminder"
      );
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-6 w-32" />
          </div>
          <Skeleton className="h-9 w-24" />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card
              key={i}
              className="overflow-hidden border-border/5 bg-card shadow-none"
            >
              <CardHeader className="border-b border-border/5 bg-card p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <Skeleton className="h-5 w-32 mb-2" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 bg-card p-4 pt-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-4 w-full mt-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mx-auto max-w-2xl">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error Loading Reminders</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchReminders}
          className="mt-2"
        >
          Try Again
        </Button>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-medium">Reminders</h1>
        </div>
        <Button onClick={() => setIsModalOpen(true)} size="sm">
          Add Reminder
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {reminders.map((reminder) => (
          <Card
            key={reminder._id}
            className="overflow-hidden border-border/5 bg-card shadow-none"
          >
            <CardHeader className="border-b border-border/5 bg-card p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-medium text-card-foreground">
                    {reminder.title}
                  </h3>
                  <Badge
                    variant={getStatusVariant(reminder.status)}
                    className="mt-1 text-xs font-normal"
                  >
                    {reminder.status}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => handleDeleteReminder(reminder._id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                    onClick={() => handleEditClick(reminder)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 bg-card p-4 pt-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span>Due: {formatDate(reminder.dueDate)}</span>
              </div>
              {reminder.completedAt && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                  <span>Completed: {formatDate(reminder.completedAt)}</span>
                </div>
              )}
              <p className="text-sm text-muted-foreground mt-2">
                {reminder.description}
              </p>
            </CardContent>
          </Card>
        ))}

        {reminders.length === 0 && (
          <Card className="col-span-full border-border/5 bg-card">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Bell className="h-12 w-12 text-primary/20" />
              <h3 className="mt-4 text-base font-medium text-card-foreground">
                No reminders yet
              </h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Get started by adding a new reminder.
              </p>
              <Button onClick={() => setIsModalOpen(true)} size="sm">
                Add First Reminder
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <AddEditReminderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleAddReminder}
        prospectId={id}
      />

      <AddEditReminderModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingReminder(null);
        }}
        onSave={handleEditReminder}
        prospectId={id}
        initialData={editingReminder || undefined}
        mode="edit"
      />
    </div>
  );
}
