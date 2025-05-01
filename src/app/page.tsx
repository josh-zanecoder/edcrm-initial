"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      router.push("/login");
    } else {
      // Redirect based on user role
      router.push(user.role === "admin" ? "/admin" : "/salesperson");
    }
  }, [user, router]);

  return null; // Return null while redirecting
}
