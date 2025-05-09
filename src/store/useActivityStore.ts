import { create } from "zustand";
import axios from "axios";
import { Activity } from "@/types/activity";
import { toast } from "sonner";

interface ActivityInput
  extends Omit<Activity, "_id" | "createdAt" | "updatedAt" | "addedBy"> {}

interface ActivitiesState {
  activities: Activity[];
  isLoading: boolean;
  error: string | null;
  fetchActivities: (prospectId: string) => Promise<void>;
  addActivity: (prospectId: string, activity: ActivityInput) => Promise<void>;
  editActivity: (
    prospectId: string,
    activityId: string,
    activity: ActivityInput
  ) => Promise<void>;
  deleteActivity: (prospectId: string, activityId: string) => Promise<void>;
}

export const useActivitiesStore = create<ActivitiesState>((set, get) => ({
  activities: [],
  isLoading: true,
  error: null,

  fetchActivities: async (prospectId) => {
    try {
      set({ isLoading: true, error: null });
      const { data } = await axios.get(
        `/api/prospects/${prospectId}/activities`
      );
      set({ activities: data });
    } catch (err: any) {
      const message = err?.response?.data?.error || "Failed to load activities";
      set({ error: message });
      toast.error(message);
    } finally {
      set({ isLoading: false });
    }
  },

  addActivity: async (prospectId, activity) => {
    try {
      await axios.post(`/api/prospects/${prospectId}/activities`, {
        ...activity,
        dueDate: new Date(activity.dueDate).toISOString(),
      });
      await get().fetchActivities(prospectId);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to add activity");
    }
  },

  editActivity: async (prospectId, activityId, activity) => {
    try {
      await axios.put(`/api/prospects/${prospectId}/activities/${activityId}`, {
        ...activity,
        dueDate: new Date(activity.dueDate).toISOString(),
      });
      await get().fetchActivities(prospectId);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to update activity");
    }
  },

  deleteActivity: async (prospectId, activityId) => {
    const loadingToast = toast.loading("Deleting activity...");
    try {
      await axios.delete(
        `/api/prospects/${prospectId}/activities/${activityId}`
      );
      set((state) => ({
        activities: state.activities.filter((a) => a._id !== activityId),
      }));
      toast.success("Activity removed successfully", { id: loadingToast });
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to delete activity", {
        id: loadingToast,
      });
      await get().fetchActivities(prospectId);
    }
  },
}));
