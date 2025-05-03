"use client";

import * as React from "react";
import { ChevronsUpDown, Plus, Command } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const PROSPECT_TABS = [
  "details",
  "members",
  "reminders",
  "activities",
] as const;

export function CollegeSwitcher({
  colleges,
}: {
  colleges: {
    id: string;
    name: string;
    email: string;
    logo: React.ElementType;
  }[];
}) {
  const { isMobile, setOpenMobile } = useSidebar();
  const pathname = usePathname();

  // Find active college and tab based on URL
  const { activeCollege, activeTab } = React.useMemo(() => {
    const pathParts = pathname.split("/");
    const isProspectPage = pathParts.includes("prospects");
    if (!isProspectPage) return { activeCollege: null, activeTab: null };

    const collegeIdIndex = pathParts.indexOf("prospects") + 1;
    const collegeId = pathParts[collegeIdIndex];
    const tab = pathParts[collegeIdIndex + 1] as (typeof PROSPECT_TABS)[number];

    return {
      activeCollege: colleges.find((c) => c.id === collegeId) || null,
      activeTab: PROSPECT_TABS.includes(tab) ? tab : "details",
    };
  }, [pathname, colleges]);

  const defaultCollege = {
    id: "",
    name: "EdTracts",
    email: "System",
    logo: Command,
  };

  const currentCollege = activeCollege || defaultCollege;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <currentCollege.logo className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  {currentCollege.name}
                </span>
                <span className="truncate text-xs">{currentCollege.email}</span>
              </div>
              {colleges.length > 0 && <ChevronsUpDown className="ml-auto" />}
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          {colleges.length > 0 && (
            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
              align="start"
              side={isMobile ? "bottom" : "right"}
              sideOffset={4}
            >
              <DropdownMenuLabel className="text-muted-foreground text-xs">
                Colleges
              </DropdownMenuLabel>
              {colleges.map((college, index) => (
                <Link
                  key={college.id}
                  href={`/salesperson/prospects/${college.id}/${
                    activeTab || "details"
                  }`}
                  onClick={() => isMobile && setOpenMobile(false)}
                >
                  <DropdownMenuItem className="gap-2 p-2">
                    <div className="flex size-6 items-center justify-center rounded-md border">
                      <college.logo className="size-3.5 shrink-0" />
                    </div>
                    {college.name}
                    <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
                  </DropdownMenuItem>
                </Link>
              ))}
              <DropdownMenuSeparator />
              <Link href="/salesperson/prospects">
                <DropdownMenuItem className="gap-2 p-2">
                  <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                    <Plus className="size-4" />
                  </div>
                  <div className="text-muted-foreground font-medium">
                    Add college
                  </div>
                </DropdownMenuItem>
              </Link>
            </DropdownMenuContent>
          )}
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
