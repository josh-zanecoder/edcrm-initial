"use client";

import React, { useState, useEffect, useRef } from "react";
import { Reminder, ReminderStatus } from "@/types/reminder";
import AddEditReminderModal from "@/components/salesperson/AddEditReminderModal";
import { useRemindersStore } from "@/store/useReminderStore";

import {
  Bell,
  Clock,
  CheckCircle2,
  Trash2,
  Pencil,
  AlertCircle,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const { id } = React.use(params);
  // Track if we've just closed the modal
  const modalJustClosed = useRef(false);

  const {
    reminders,
    isLoading,
    isOperationInProgress,
    preventModalReopen,
    error,
    fetchReminders,
    addReminder,
    editReminder,
    deleteReminder,
    resetPreventModalReopen
  } = useRemindersStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [deleteReminderId, setDeleteReminderId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (id) fetchReminders(id);
  }, [id, fetchReminders]);

  // Critical effect to prevent modal reopening
  useEffect(() => {
    if (preventModalReopen) {
      // Ensure modals stay closed when preventModalReopen is true
      setIsModalOpen(false);
      setIsEditModalOpen(false);
      
      // Use a timeout to reset the flag after UI has settled
      const timer = setTimeout(() => {
        resetPreventModalReopen();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [preventModalReopen, resetPreventModalReopen]);

  const handleAddReminder = async (
    reminderData: Omit<Reminder, "_id" | "createdAt" | "updatedAt" | "addedBy">
  ) => {
    try {
      // Set local ref to prevent reopening
      modalJustClosed.current = true;
      
      await addReminder(id, reminderData);
      return true;
    } catch (error) {
      console.error("Error adding reminder:", error);
      return false;
    }
  };

  const handleEditReminder = async (
    reminderData: Omit<Reminder, "_id" | "createdAt" | "updatedAt" | "addedBy">
  ) => {
    if (!editingReminder) return false;
    
    try {
      // Set local ref to prevent reopening
      modalJustClosed.current = true;
      
      await editReminder(id, editingReminder._id, reminderData);
      return true;
    } catch (error) {
      console.error("Error editing reminder:", error);
      return false;
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteReminderId) return;
    setIsDeleting(true);
    await deleteReminder(id, deleteReminderId);
    setIsDeleting(false);
    setDeleteReminderId(null);
  };

  const handleEditClick = (reminder: Reminder) => {
    if (!isOperationInProgress && !preventModalReopen) {
      setEditingReminder(reminder);
      setIsEditModalOpen(true);
    }
  };
  
  const handleDeleteClick = (reminderId: string) => {
    if (!isOperationInProgress && !preventModalReopen) {
      setDeleteReminderId(reminderId);
    }
  };

  // Clear editing state and ensure modals stay closed
  const handleModalClose = () => {
    if (!isOperationInProgress) {
      setIsModalOpen(false);
      setIsEditModalOpen(false);
      setEditingReminder(null);
    }
  };

  // Open "Add" modal only if safe to do so
  const handleAddClick = () => {
    if (!isOperationInProgress && !preventModalReopen) {
      setIsModalOpen(true);
    }
  };

  if (isLoading && !isOperationInProgress) {
    return (
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mx-auto max-w-2xl m-3 sm:m-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error Loading Reminders</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
        <Button onClick={() => fetchReminders(id)} className="mt-2">
          Try Again
        </Button>
      </Alert>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary" />
          <h1 className="text-lg font-medium">Reminders</h1>
        </div>
        <Button 
          onClick={handleAddClick}
          disabled={isOperationInProgress || preventModalReopen}
        >
          Add Reminder
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {reminders.map((reminder) => (
          <Card key={reminder._id}>
            <CardHeader className="flex justify-between items-start">
              <div>
                <h3 className="font-medium">{reminder.title}</h3>
                <Badge variant={getStatusVariant(reminder.status)}>
                  {reminder.status}
                </Badge>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEditClick(reminder)}
                  disabled={isOperationInProgress || preventModalReopen}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteClick(reminder._id)}
                  disabled={isOperationInProgress || preventModalReopen}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <p>
                <Clock className="inline-block h-4 w-4 mr-1" />
                Due: {formatDate(reminder.dueDate)}
              </p>
              {reminder.completedAt && (
                <p>
                  <CheckCircle2 className="inline-block h-4 w-4 mr-1 text-green-500" />
                  Completed: {formatDate(reminder.completedAt)}
                </p>
              )}
              <p>{reminder.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {reminders.length === 0 && (
        <div className="text-center text-muted-foreground mt-10">
          <p>No reminders found.</p>
          <Button 
            onClick={handleAddClick}
            className="mt-2"
            disabled={isOperationInProgress || preventModalReopen}
          >
            Add Your First Reminder
          </Button>
        </div>
      )}

      {/* Only render the modal when it's actually needed */}
      {(isModalOpen && !preventModalReopen) && (
        <AddEditReminderModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onSave={handleAddReminder}
          prospectId={id}
        />
      )}

      {(isEditModalOpen && !preventModalReopen) && (
        <AddEditReminderModal
          isOpen={isEditModalOpen}
          onClose={handleModalClose}
          onSave={handleEditReminder}
          prospectId={id}
          initialData={editingReminder || undefined}
          mode="edit"
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteReminderId}
        onOpenChange={(open) => !isOperationInProgress && !open && setDeleteReminderId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Reminder</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this reminder? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => setDeleteReminderId(null)}
              disabled={isDeleting || isOperationInProgress}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting || isOperationInProgress}
            >
              {isDeleting ? (
                <Loader2 className="animate-spin mr-2 h-4 w-4" />
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
