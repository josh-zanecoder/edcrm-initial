import { create } from "zustand";
import { toast } from "sonner";
import {
  Salesperson,
  CreateSalespersonInput,
  UpdateSalespersonInput,
} from "@/types/salesperson";
import { unformatPhoneNumber } from "@/utils/formatters";
import axios from "axios";

interface SalespersonStore {
  salespersons: Salesperson[];
  isLoading: boolean;
  error: string | null;
  searchTerm: string;
  statusFilter: string;
  isModalOpen: boolean;
  deletePersonId: string | null;
  isDeleting: boolean;

  setSalespersons: (salespersons: Salesperson[]) => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setSearchTerm: (searchTerm: string) => void;
  setStatusFilter: (status: string) => void;
  setIsModalOpen: (isOpen: boolean) => void;
  setDeletePersonId: (id: string | null) => void;
  setIsDeleting: (isDeleting: boolean) => void;

  fetchSalespersons: () => Promise<void>;
  addSalesperson: (formData: CreateSalespersonInput) => Promise<void>;
  deleteSalesperson: () => Promise<void>;
  updateSalesperson: (
    id: string,
    formData: UpdateSalespersonInput
  ) => Promise<void>;

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

  setSalespersons: (salespersons) => set({ salespersons }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setSearchTerm: (searchTerm) => set({ searchTerm }),
  setStatusFilter: (statusFilter) => set({ statusFilter }),
  setIsModalOpen: (isModalOpen) => set({ isModalOpen }),
  setDeletePersonId: (deletePersonId) => set({ deletePersonId }),
  setIsDeleting: (isDeleting) => set({ isDeleting }),

  fetchSalespersons: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await axios.get("/api/admin/admin-salespersons");
      set({ salespersons: Array.isArray(data) ? data : [] });
    } catch (error: any) {
      console.error("Error fetching salespersons:", error);
      set({ error: error.message || "Failed to load salespersons" });
      set({ salespersons: [] });
    } finally {
      set({ isLoading: false });
    }
  },

  addSalesperson: async (formData) => {
    const loadingToast = toast.loading("Creating new salesperson...");
    try {
      const { data } = await axios.post("/api/admin/admin-salespersons", {
        ...formData,
        phone: unformatPhoneNumber(formData.phone),
        twilio_number: formData.twilio_number
          ? unformatPhoneNumber(formData.twilio_number)
          : null,
      });

      toast.success("Salesperson created successfully!", { id: loadingToast });
      set({ isModalOpen: false });
      await get().fetchSalespersons();
    } catch (error: any) {
      console.error("Error creating salesperson:", error);
      toast.error(
        error.response?.data?.error || "Failed to create salesperson",
        {
          id: loadingToast,
        }
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
      await axios.delete(`/api/admin/admin-salespersons/${deletePersonId}`);

      set((state) => ({
        salespersons: state.salespersons.filter(
          (person) => person.id !== deletePersonId
        ),
      }));

      toast.success(
        `${deletedPerson?.first_name} ${deletedPerson?.last_name} has been deleted successfully`,
        { id: loadingToast }
      );
    } catch (error: any) {
      console.error("Error deleting salesperson:", error);
      toast.error(
        error.response?.data?.error || "Failed to delete salesperson",
        {
          id: loadingToast,
        }
      );
    } finally {
      set({ isDeleting: false, deletePersonId: null });
    }
  },

  updateSalesperson: async (id, formData) => {
    const loadingToast = toast.loading("Updating salesperson...");

    try {
      await axios.patch(`/api/admin/admin-salespersons/${id}`, {
        ...formData,
        phone: formData.phone ? unformatPhoneNumber(formData.phone) : undefined,
        twilio_number: formData.twilio_number
          ? unformatPhoneNumber(formData.twilio_number)
          : undefined,
      });

      toast.success("Salesperson updated successfully!", { id: loadingToast });
      await get().fetchSalespersons();
    } catch (error: any) {
      console.error("Error updating salesperson:", error);
      toast.error(
        error.response?.data?.error || "Failed to update salesperson",
        {
          id: loadingToast,
        }
      );
      throw error;
    }
  },

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
