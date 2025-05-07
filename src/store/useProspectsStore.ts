import { create } from "zustand";
import axios from "axios";
import { Prospect } from "@/types/prospect";
import { toast } from "sonner";

interface ProspectsState {
  prospects: Prospect[];
  isLoadingProspects: boolean;
  isModalOpen: boolean;
  currentPage: number;
  totalPages: number;
  totalCount: number;
  searchQuery: string;
  progress: number;
  isDeleting: boolean;

  setProspects: (prospects: Prospect[]) => void;
  setIsLoadingProspects: (isLoading: boolean) => void;
  setIsModalOpen: (isOpen: boolean) => void;
  setCurrentPage: (page: number | ((prev: number) => number)) => void;
  setTotalPages: (totalPages: number) => void;
  setTotalCount: (totalCount: number) => void;
  setSearchQuery: (query: string) => void;
  setProgress: (progress: number | ((prev: number) => number)) => void;

  fetchProspects: (userId: string) => Promise<void>;
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
}

const useProspectsStore = create<ProspectsState>((set, get) => ({
  prospects: [],
  isLoadingProspects: true,
  isModalOpen: false,
  currentPage: 1,
  totalPages: 0,
  totalCount: 0,
  searchQuery: "",
  progress: 0,
  isDeleting: false,

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

  fetchProspects: async () => {
    try {
      set({ isLoadingProspects: true });
      const { currentPage, searchQuery } = get();

      const params = {
        page: currentPage,
        limit: 10,
        ...(searchQuery && { search: searchQuery }),
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
      const { data: createdProspect } = await axios.post(
        "/api/prospects",
        newProspect
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
}));

export default useProspectsStore;
