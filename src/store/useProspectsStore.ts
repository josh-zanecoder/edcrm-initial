import { create } from "zustand";
import axios from "axios";
import { toast } from "sonner";
import { prospectSchema } from "@/validators/prospect"; // Import Zod schema
import { z } from "zod";
import { Prospect, CollegeType } from "@/types/prospect";
import { formatPhoneNumber, unformatPhoneNumber } from "@/utils/formatters";

// Constants moved from the page component
export const STATUS_OPTIONS = [
  "New",
  "Contacted",
  "Qualified",
  "Proposal",
  "Negotiation",
  "Closed",
];

export const COLLEGE_TYPES = Object.values(CollegeType);

interface ProspectsState {
  // List view state
  prospects: Prospect[];
  isLoadingProspects: boolean;
  isModalOpen: boolean;
  currentPage: number;
  totalPages: number;
  totalCount: number;
  searchQuery: string;
  progress: number;
  isDeleting: boolean;

  // Detail view state
  currentProspect: Prospect | null;
  isLoadingDetail: boolean;
  isEditing: boolean;
  editedProspect: Prospect | null;
  isSaving: boolean;
  lastError: string | null;

  // List view actions
  setProspects: (prospects: Prospect[]) => void;
  setIsLoadingProspects: (isLoading: boolean) => void;
  setIsModalOpen: (isOpen: boolean) => void;
  setCurrentPage: (page: number | ((prev: number) => number)) => void;
  setTotalPages: (totalPages: number) => void;
  setTotalCount: (totalCount: number) => void;
  setSearchQuery: (query: string) => void;
  setProgress: (progress: number | ((prev: number) => number)) => void;

  fetchProspects: (userId?: string) => Promise<void>;
  addProspect: (
    newProspect: Omit<
      Prospect,
      "id" | "createdAt" | "updatedAt" | "addedBy" | "assignedTo"
    >,
    fetchColleges: () => Promise<void>
  ) => Promise<void>;
  deleteProspect: (
    prospectId: string,
    fetchColleges: () => Promise<void>
  ) => Promise<void>;
  startProgressTimer: () => () => void;

  // Detail view actions
  fetchProspectDetail: (id: string) => Promise<void>;
  startEditing: () => void;
  cancelEditing: () => void;
  handleChange: (field: string, value: string | boolean) => void;
  handleCollegeTypeToggle: (type: CollegeType) => void;
  saveProspect: (id: string) => Promise<void>;
  resetDetailState: () => void;
  clearError: () => void;
}

const useProspectsStore = create<ProspectsState>((set, get) => ({
  // List view state
  prospects: [],
  isLoadingProspects: true,
  isModalOpen: false,
  currentPage: 1,
  totalPages: 0,
  totalCount: 0,
  searchQuery: "",
  progress: 0,
  isDeleting: false,

  // Detail view state
  currentProspect: null,
  isLoadingDetail: true,
  isEditing: false,
  editedProspect: null,
  isSaving: false,
  lastError: null,

  // List view actions
  setProspects: (prospects) => set({ prospects }),
  setIsLoadingProspects: (isLoading) => set({ isLoadingProspects: isLoading }),
  setIsModalOpen: (isOpen) => set({ isModalOpen: isOpen }),
  setCurrentPage: (page) =>
    set((state) => ({
      currentPage: typeof page === "function" ? page(state.currentPage) : page,
    })),
  setTotalPages: (totalPages) => set({ totalPages }),
  setTotalCount: (totalCount) => set({ totalCount }),
  setSearchQuery: (query) =>
    set(() => ({ searchQuery: query, currentPage: 1 })),
  setProgress: (progress) =>
    set((state) => ({
      progress:
        typeof progress === "function" ? progress(state.progress) : progress,
    })),

  fetchProspects: async (userId) => {
    try {
      set({ isLoadingProspects: true });
      const { currentPage, searchQuery } = get();

      const params = {
        page: currentPage,
        limit: 10,
        ...(searchQuery && { search: searchQuery }),
        ...(userId && { userId }),
      };

      const { data } = await axios.get("/api/prospects", { params });

      set({
        prospects: data.prospects,
        totalPages: data.totalPages,
        totalCount: data.totalCount,
      });
    } catch (error) {
      console.error("Error fetching prospects:", error);
    } finally {
      set({ isLoadingProspects: false });
    }
  },

  addProspect: async (newProspect, fetchColleges) => {
    const loadingToast = toast.loading("Saving prospect...");

    try {
      // Create a copy of the prospect data to modify
      const prospectToSave = { ...newProspect };

      // Unformat phone number before saving if it exists
      if (prospectToSave.phone) {
        prospectToSave.phone = unformatPhoneNumber(prospectToSave.phone);
      }

      const { data: createdProspect } = await axios.post(
        "/api/prospects",
        prospectToSave // Directly sending the prospectToSave without validation
      );

      set((state) => ({
        prospects: [...state.prospects, createdProspect],
        isModalOpen: false,
      }));

      toast.success("Prospect added successfully", {
        id: loadingToast,
      });

      await fetchColleges();
    } catch (error: any) {
      const message =
        error?.response?.data?.details ||
        error?.response?.data?.error ||
        "Failed to create prospect";

      console.error("Error creating prospect:", error);
      toast.error(message, { id: loadingToast });
    }
  },

  deleteProspect: async (prospectId, fetchColleges) => {
    if (!prospectId) {
      toast.error("Invalid prospect ID");
      return;
    }

    set({ isDeleting: true });
    const loadingToast = toast.loading("Deleting prospect...");

    const targetProspect = get().prospects.find((p) => p.id === prospectId);
    console.log(
      `Attempting to delete prospect: ${targetProspect?.collegeName} (ID: ${prospectId})`
    );

    try {
      await axios.delete(`/api/prospects/${prospectId}`);

      set((state) => ({
        prospects: state.prospects.filter((p) => p.id !== prospectId),
      }));

      toast.success(
        `Prospect ${targetProspect?.collegeName || ""} deleted successfully`,
        {
          id: loadingToast,
        }
      );

      await fetchColleges();
    } catch (error: any) {
      const message =
        error?.response?.data?.details ||
        error?.response?.data?.error ||
        "Failed to delete prospect";

      console.error("Error deleting prospect:", error);
      toast.error(`Delete failed: ${message}`, {
        id: loadingToast,
        duration: 5000,
      });
    } finally {
      set({ isDeleting: false });
    }
  },

  startProgressTimer: () => {
    const timer = setInterval(() => {
      set((state) => {
        if (state.progress >= 95) {
          clearInterval(timer);
          return { progress: 95 };
        }
        return { progress: state.progress + 10 };
      });
    }, 50);

    return () => clearInterval(timer);
  },

  // Detail view actions
  fetchProspectDetail: async (id) => {
    if (!id) {
      toast.error("Invalid prospect ID");
      set({ isLoadingDetail: false });
      return;
    }

    try {
      set({ isLoadingDetail: true, lastError: null });

      const response = await fetch(`/api/prospects/${id}/details`, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch prospect");
      }

      const data = await response.json();
      set({
        currentProspect: data,
        editedProspect: data,
      });
    } catch (error) {
      console.error("Error fetching prospect:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch prospect";
      toast.error(errorMessage);
      set({
        currentProspect: null,
        editedProspect: null,
        lastError: errorMessage,
      });
    } finally {
      set({ isLoadingDetail: false });
    }
  },

  startEditing: () => {
    set((state) => ({
      isEditing: true,
      editedProspect: state.currentProspect,
      lastError: null,
    }));
  },

  cancelEditing: () => {
    set((state) => ({
      isEditing: false,
      editedProspect: state.currentProspect,
      lastError: null,
    }));
  },

  handleChange: (field, value) => {
    set((state) => {
      if (!state.editedProspect) return state;

      if (field === "phone") {
        const formattedPhone = formatPhoneNumber(value as string);
        return {
          editedProspect: {
            ...state.editedProspect,
            [field]: formattedPhone,
          },
        };
      }

      if (field.startsWith("address.")) {
        const addressField = field.split(".")[1];
        return {
          editedProspect: {
            ...state.editedProspect,
            address: {
              ...state.editedProspect.address,
              [addressField]: value,
            },
          },
        };
      }

      return {
        editedProspect: {
          ...state.editedProspect,
          [field]: value,
        },
      };
    });
  },

  handleCollegeTypeToggle: (type) => {
    set((state) => {
      if (!state.editedProspect) return state;

      const types = state.editedProspect.collegeTypes.includes(type)
        ? state.editedProspect.collegeTypes.filter((t) => t !== type)
        : [...state.editedProspect.collegeTypes, type];

      return {
        editedProspect: {
          ...state.editedProspect,
          collegeTypes: types,
        },
      };
    });
  },

  saveProspect: async (id) => {
    const { currentProspect, editedProspect } = get();
    if (!currentProspect || !editedProspect) return;

    set({ isSaving: true, lastError: null });
    const loadingToast = toast.loading("Saving prospect...");

    try {
      // Create a copy of the prospect data to modify
      const prospectToSave = { ...editedProspect };

      // Unformat phone number before saving if it exists
      if (prospectToSave.phone) {
        prospectToSave.phone = unformatPhoneNumber(prospectToSave.phone);
      }

      const response = await fetch(`/api/prospects/${id}/details`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(prospectToSave),
      });

      if (response.status === 401) {
        // Will handle redirection in the component
        const errorMessage = "Session expired. Please log in again.";
        set({ lastError: errorMessage });
        toast.error(errorMessage, {
          id: loadingToast,
        });
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();

        // Extract the specific error details from the response
        let errorMessage = "Failed to update prospect";

        if (Array.isArray(errorData.details)) {
          // Handle array of validation error messages
          errorMessage = errorData.details
            .map((err: any) => err.message || err.msg || "Unknown error")
            .join(", ");
        } else if (errorData.details && typeof errorData.details === "string") {
          // If details is a string message
          errorMessage = errorData.details;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (typeof errorData === "string") {
          errorMessage = errorData;
        }

        set({ lastError: errorMessage });
        toast.error(errorMessage, {
          id: loadingToast,
        });
        return;
      }

      const updatedProspect = await response.json();
      set({
        currentProspect: updatedProspect,
        editedProspect: updatedProspect,
        isEditing: false,
        lastError: null,
      });

      toast.success("Prospect updated successfully", {
        id: loadingToast,
      });
    } catch (error: any) {
      console.error("Error updating prospect:", error);

      // Extract error message from various possible error formats
      let errorMessage = "Failed to update prospect";

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error.response?.data) {
        const { data } = error.response;
        if (data.error) errorMessage = data.error;
        else if (data.details) errorMessage = data.details;
        else if (data.message) errorMessage = data.message;
        else if (typeof data === "string") errorMessage = data;
      }

      set({ lastError: errorMessage });
      toast.error(errorMessage, {
        id: loadingToast,
      });
    } finally {
      set({ isSaving: false });
    }
  },

  resetDetailState: () => {
    set({
      currentProspect: null,
      editedProspect: null,
      isEditing: false,
      isLoadingDetail: true,
      isSaving: false,
      lastError: null,
    });
  },

  clearError: () => {
    set({ lastError: null });
  },
}));

export default useProspectsStore;
