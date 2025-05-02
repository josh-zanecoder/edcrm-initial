"use client";

import { Fragment } from "react";
import { Menu, Transition } from "@headlessui/react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Clock } from "lucide-react";
import { ThemeToggle } from "../theme-toggle";
import { SidebarTrigger } from "../ui/sidebar";

export default function SalespersonNavbar() {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-4 px-4 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b border-border">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="-ml-1" />
        <div className="flex items-center gap-2">
          <span className="text-xl font-semibold tracking-tight">EdTracts</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
      </div>
    </header>
  );
}
