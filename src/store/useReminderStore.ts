import { create } from "zustand";
import axios from "axios";
import { Reminder } from "@/types/reminder";
import { toast } from "sonner";

interface ReminderInput
  extends Omit<
    Reminder,
    "_id" | "createdAt" | "updatedAt" | "addedBy" | "prospectId"
  > {}

interface RemindersState {
  reminders: Reminder[];
  isLoading: boolean;
  isOperationInProgress: boolean;
  preventModalReopen: boolean; // Flag to prevent modal reopening after operations
  error: string | null;
  fetchReminders: (prospectId: string) => Promise<void>;
  addReminder: (prospectId: string, reminder: ReminderInput) => Promise<void>;
  editReminder: (
    prospectId: string,
    reminderId: string,
    reminder: ReminderInput
  ) => Promise<void>;
  deleteReminder: (prospectId: string, reminderId: string) => Promise<void>;
  resetPreventModalReopen: () => void; // Reset prevention flag after modal operations
}

export const useRemindersStore = create<RemindersState>((set, get) => ({
  reminders: [],
  isLoading: true,
  isOperationInProgress: false,
  preventModalReopen: false, // Initialize prevention flag
  error: null,

  fetchReminders: async (prospectId) => {
    try {
      // Only set loading if we're not in the middle of an operation
      if (!get().isOperationInProgress) {
        set({ isLoading: true, error: null });
      }
      
      const { data } = await axios.get(
        `/api/prospects/${prospectId}/reminders`
      );
      set((state) => ({
        reminders: data,
        isLoading: false,
        // Keep preventModalReopen true during the refresh after add/edit
        preventModalReopen: state.preventModalReopen
      }));
    } catch (err: any) {
      const message = err?.response?.data?.error || "Failed to load reminders";
      set({ error: message, isLoading: false });
      toast.error(message);
    }
  },

  addReminder: async (prospectId, reminder) => {
    set({ isOperationInProgress: true, preventModalReopen: true });
    
    try {
      await axios.post(`/api/prospects/${prospectId}/reminders`, {
        ...reminder,
        dueDate: new Date(reminder.dueDate).toISOString(),
      });
      
      // Update local state before resetting operation flags
      await get().fetchReminders(prospectId);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to add reminder");
      // Reset on error
      set({ isOperationInProgress: false });
    } finally {
      // Keep preventModalReopen true but mark operation as complete
      set({ isOperationInProgress: false });
    }
  },

  editReminder: async (prospectId, reminderId, reminder) => {
    set({ isOperationInProgress: true, preventModalReopen: true });
    
    try {
      await axios.put(`/api/prospects/${prospectId}/reminders/${reminderId}`, {
        ...reminder,
        dueDate: new Date(reminder.dueDate).toISOString(),
      });
      
      // Update local state before resetting operation flags
      await get().fetchReminders(prospectId);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to update reminder");
      // Reset on error
      set({ isOperationInProgress: false });
    } finally {
      // Keep preventModalReopen true but mark operation as complete
      set({ isOperationInProgress: false });
    }
  },

  deleteReminder: async (prospectId, reminderId) => {
    set({ isOperationInProgress: true });
    const loadingToast = toast.loading("Deleting reminder...");
    
    try {
      await axios.delete(
        `/api/prospects/${prospectId}/reminders/${reminderId}`
      );
      set((state) => ({
        reminders: state.reminders.filter((r) => r._id !== reminderId),
        isOperationInProgress: false
      }));
      toast.success("Reminder removed successfully", { id: loadingToast });
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to delete reminder", {
        id: loadingToast,
      });
      await get().fetchReminders(prospectId);
      set({ isOperationInProgress: false });
    }
  },
  
  // Method to reset the prevention flag once we're sure the UI has settled
  resetPreventModalReopen: () => {
    set({ preventModalReopen: false });
  }
}));
