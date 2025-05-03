import axios from "axios";
import { create } from "zustand";
import { UserStore } from "@/types/user";

export const useUserStore = create<UserStore>((set) => ({
  userRole: null,
  colleges: [],
  userData: null,
  getUser: async () => {
    try {
      const [userDataResponse, collegesResponse] = await Promise.all([
        axios.get("/api/auth/authenticated"),
        axios.get("/api/colleges"),
      ]);
      set({
        userRole: userDataResponse.data.userData.role,
        colleges: collegesResponse.data.colleges,
        userData: userDataResponse.data.userData,
      });
    } catch (error) {
      console.error("Error fetching user data:", error);
      if (axios.isAxiosError(error)) {
        console.error("API Error details:", {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          config: {
            url: error.config?.url,
            method: error.config?.method,
          },
        });
      }
    }
  },
  fetchColleges: async () => {
    const res = await axios.get("/api/colleges");
    set({ colleges: res.data.colleges });
  },
}));
