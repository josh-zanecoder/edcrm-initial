import { create } from "zustand";
import axios from "axios";
import { Activity } from "@/types/activity";
import { toast } from "sonner";

interface ActivityInput
  extends Omit<Activity, "_id" | "createdAt" | "updatedAt" | "addedBy"> {}

interface ActivitiesState {
  activities: Activity[];
  isLoading: boolean;
  isOperationInProgress: boolean; // Flag to track operations
  preventModalReopen: boolean; // Flag to prevent modal reopening
  error: string | null;
  fetchActivities: (prospectId: string) => Promise<void>;
  addActivity: (prospectId: string, activity: ActivityInput) => Promise<void>;
  editActivity: (
    prospectId: string,
    activityId: string,
    activity: ActivityInput
  ) => Promise<void>;
  deleteActivity: (prospectId: string, activityId: string) => Promise<void>;
  resetPreventModalReopen: () => void; // Method to reset the prevention flag
}

export const useActivitiesStore = create<ActivitiesState>((set, get) => ({
  activities: [],
  isLoading: true,
  isOperationInProgress: false,
  preventModalReopen: false,
  error: null,

  fetchActivities: async (prospectId) => {
    try {
      // Only set loading if we're not in the middle of an operation
      if (!get().isOperationInProgress) {
        set({ isLoading: true, error: null });
      }
      
      const { data } = await axios.get(
        `/api/prospects/${prospectId}/activities`
      );
      set((state) => ({
        activities: data,
        isLoading: false,
        // Keep preventModalReopen true during the refresh
        preventModalReopen: state.preventModalReopen
      }));
    } catch (err: any) {
      const message = err?.response?.data?.error || "Failed to load activities";
      set({ error: message, isLoading: false });
      toast.error(message);
    }
  },

  addActivity: async (prospectId, activity) => {
    set({ isOperationInProgress: true, preventModalReopen: true });
    
    try {
      await axios.post(`/api/prospects/${prospectId}/activities`, {
        ...activity,
        dueDate: new Date(activity.dueDate).toISOString(),
      });
      
      // Update local state before resetting operation flags
      await get().fetchActivities(prospectId);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to add activity");
      // Reset on error
      set({ isOperationInProgress: false });
    } finally {
      // Keep preventModalReopen true but mark operation as complete
      set({ isOperationInProgress: false });
    }
  },

  editActivity: async (prospectId, activityId, activity) => {
    set({ isOperationInProgress: true, preventModalReopen: true });
    
    try {
      await axios.put(`/api/prospects/${prospectId}/activities/${activityId}`, {
        ...activity,
        dueDate: new Date(activity.dueDate).toISOString(),
      });
      
      // Update local state before resetting operation flags
      await get().fetchActivities(prospectId);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to update activity");
      // Reset on error
      set({ isOperationInProgress: false });
    } finally {
      // Keep preventModalReopen true but mark operation as complete
      set({ isOperationInProgress: false });
    }
  },

  deleteActivity: async (prospectId, activityId) => {
    set({ isOperationInProgress: true });
    const loadingToast = toast.loading("Deleting activity...");
    
    try {
      await axios.delete(
        `/api/prospects/${prospectId}/activities/${activityId}`
      );
      set((state) => ({
        activities: state.activities.filter((a) => a._id !== activityId),
        isOperationInProgress: false
      }));
      toast.success("Activity removed successfully", { id: loadingToast });
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to delete activity", {
        id: loadingToast,
      });
      await get().fetchActivities(prospectId);
      set({ isOperationInProgress: false });
    }
  },
  
  // Method to reset the prevention flag once we're sure the UI has settled
  resetPreventModalReopen: () => {
    set({ preventModalReopen: false });
  }
}));
