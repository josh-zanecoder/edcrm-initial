import { create } from "zustand";
import { toast } from "sonner";
import {
  Salesperson,
  CreateSalespersonInput,
  UpdateSalespersonInput,
} from "@/types/salesperson";
import { unformatPhoneNumber } from "@/utils/formatters";

interface SalespersonStore {
  salespersons: Salesperson[];
  isLoading: boolean;
  error: string | null;
  searchTerm: string;
  statusFilter: string;
  isModalOpen: boolean;
  deletePersonId: string | null;
  isDeleting: boolean;

  // Actions
  setSalespersons: (salespersons: Salesperson[]) => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setSearchTerm: (searchTerm: string) => void;
  setStatusFilter: (status: string) => void;
  setIsModalOpen: (isOpen: boolean) => void;
  setDeletePersonId: (id: string | null) => void;
  setIsDeleting: (isDeleting: boolean) => void;

  // Async Actions
  fetchSalespersons: () => Promise<void>;
  addSalesperson: (formData: CreateSalespersonInput) => Promise<void>;
  deleteSalesperson: () => Promise<void>;
  updateSalesperson: (
    id: string,
    formData: UpdateSalespersonInput
  ) => Promise<void>;

  // Computed
  filteredSalespersons: () => Salesperson[];
}

const useSalespersonStore = create<SalespersonStore>((set, get) => ({
  salespersons: [],
  isLoading: true,
  error: null,
  searchTerm: "",
  statusFilter: "all",
  isModalOpen: false,
  deletePersonId: null,
  isDeleting: false,

  // Actions
  setSalespersons: (salespersons) => set({ salespersons }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setSearchTerm: (searchTerm) => set({ searchTerm }),
  setStatusFilter: (statusFilter) => set({ statusFilter }),
  setIsModalOpen: (isModalOpen) => set({ isModalOpen }),
  setDeletePersonId: (deletePersonId) => set({ deletePersonId }),
  setIsDeleting: (isDeleting) => set({ isDeleting }),

  // Async Actions
  fetchSalespersons: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch("/api/admin/admin-salespersons");
      if (!response.ok) {
        throw new Error("Failed to fetch salespersons");
      }
      const data = await response.json();
      set({ salespersons: Array.isArray(data) ? data : [] });
    } catch (error) {
      console.error("Error fetching salespersons:", error);
      set({ error: "Failed to load salespersons" });
      set({ salespersons: [] });
    } finally {
      set({ isLoading: false });
    }
  },

  addSalesperson: async (formData: CreateSalespersonInput) => {
    const loadingToast = toast.loading("Creating new salesperson...");

    try {
      const response = await fetch("/api/admin/admin-salespersons", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          phone: unformatPhoneNumber(formData.phone),
          twilio_number: formData.twilio_number
            ? unformatPhoneNumber(formData.twilio_number)
            : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create salesperson");
      }

      toast.success("Salesperson created successfully!", { id: loadingToast });
      set({ isModalOpen: false });

      await get().fetchSalespersons();
    } catch (error) {
      console.error("Error creating salesperson:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create salesperson",
        { id: loadingToast }
      );
      throw error;
    }
  },

  deleteSalesperson: async () => {
    const { deletePersonId, salespersons } = get();
    if (!deletePersonId) return;

    set({ isDeleting: true });
    const loadingToast = toast.loading("Deleting salesperson...");
    const deletedPerson = salespersons.find(
      (person) => person.id === deletePersonId
    );

    try {
      const response = await fetch(
        `/api/admin/admin-salespersons/${deletePersonId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete salesperson");
      }

      set((state) => ({
        salespersons: state.salespersons.filter(
          (person) => person.id !== deletePersonId
        ),
      }));

      toast.success(
        `${deletedPerson?.first_name} ${deletedPerson?.last_name} has been deleted successfully`,
        { id: loadingToast }
      );
    } catch (error) {
      console.error("Error deleting salesperson:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete salesperson",
        { id: loadingToast }
      );
    } finally {
      set({ isDeleting: false, deletePersonId: null });
    }
  },

  updateSalesperson: async (id: string, formData: UpdateSalespersonInput) => {
    const loadingToast = toast.loading("Updating salesperson...");

    try {
      const response = await fetch(`/api/admin/admin-salespersons/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          phone: formData.phone
            ? unformatPhoneNumber(formData.phone)
            : undefined,
          twilio_number: formData.twilio_number
            ? unformatPhoneNumber(formData.twilio_number)
            : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update salesperson");
      }

      toast.success("Salesperson updated successfully!", { id: loadingToast });

      // Refresh the salespersons list
      await get().fetchSalespersons();
    } catch (error) {
      console.error("Error updating salesperson:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update salesperson",
        { id: loadingToast }
      );
      throw error;
    }
  },

  // Computed
  filteredSalespersons: () => {
    const { salespersons, searchTerm, statusFilter } = get();
    return salespersons.filter((person) => {
      const fullName = `${person.first_name} ${person.last_name}`.toLowerCase();
      const matchesSearch =
        fullName.includes(searchTerm.toLowerCase()) ||
        person.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || person.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  },
}));

export default useSalespersonStore;
