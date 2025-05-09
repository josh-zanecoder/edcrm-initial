import { create } from "zustand";
import axios from "axios";
import { Member } from "@/types/member";

interface MembersState {
  members: Member[];
  collegeName: string;
  isLoading: boolean;
  isOperationInProgress: boolean;
  error: string | null;
  fetchMembers: (prospectId: string) => Promise<void>;
  addMember: (
    prospectId: string,
    member: Omit<Member, "_id" | "createdAt" | "updatedAt" | "addedBy">
  ) => Promise<void>;
  updateMember: (
    prospectId: string,
    memberId: string,
    member: Omit<Member, "_id" | "createdAt" | "updatedAt" | "addedBy">
  ) => Promise<void>;
  deleteMember: (prospectId: string, memberId: string) => Promise<void>;
}

export const useMembersStore = create<MembersState>((set, get) => ({
  members: [],
  collegeName: "",
  isLoading: false,
  isOperationInProgress: false,
  error: null,

  fetchMembers: async (prospectId) => {
    // Don't set isLoading if we're in the middle of another operation
    if (!get().isOperationInProgress) {
      set({ isLoading: true, error: null });
    }
    try {
      const [prospectRes, membersRes] = await Promise.all([
        axios.get(`/api/prospects/${prospectId}/details`),
        axios.get(`/api/prospects/${prospectId}/members`),
      ]);

      set({
        collegeName: prospectRes.data.collegeName,
        members: membersRes.data,
        isLoading: false,
      });
    } catch (err: any) {
      set({
        error: err.response?.data?.error || "Failed to fetch members",
        isLoading: false,
      });
    }
  },

  addMember: async (prospectId, member) => {
    set({ isOperationInProgress: true });
    try {
      await axios.post(`/api/prospects/${prospectId}/members`, member);
      await get().fetchMembers(prospectId);
    } finally {
      set({ isOperationInProgress: false });
    }
  },

  updateMember: async (prospectId, memberId, member) => {
    set({ isOperationInProgress: true });
    try {
      await axios.put(`/api/prospects/${prospectId}/members/${memberId}`, member);
      await get().fetchMembers(prospectId);
    } finally {
      set({ isOperationInProgress: false });
    }
  },

  deleteMember: async (prospectId, memberId) => {
    set({ isOperationInProgress: true });
    try {
      await axios.delete(`/api/prospects/${prospectId}/members/${memberId}`);
      set((state) => ({
        members: state.members.filter((m) => m._id !== memberId),
      }));
    } finally {
      set({ isOperationInProgress: false });
    }
  },
}));
