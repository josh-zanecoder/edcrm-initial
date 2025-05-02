"use client";

import { useState } from "react";
import SalespersonSidebar from "@/components/salesperson/SalespersonSidebar";
import SalespersonNavbar from "@/components/salesperson/SalespersonNavbar";
import { Clock } from "@/components/clock";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

export default function SalespersonLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="min-h-screen bg-white dark:bg-black">
          <div className="flex flex-col flex-1">
            <SalespersonNavbar />

            <main className="flex-1">
              <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  {children}
                </div>
              </div>
            </main>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
