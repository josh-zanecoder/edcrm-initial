"use client";

import * as React from "react";
import { LayoutDashboard, Users, Command } from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { CollegeSwitcher } from "@/components/college-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  colleges: [
    {
      name: "MIT",
      email: "mit@example.com",
      logo: Command,
    },
    {
      name: "Harvard",
      email: "harvard@example.com",
      logo: Command,
    },
    {
      name: "Yale",
      email: "yale@example.com",
      logo: Command,
    },
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "/salesperson/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Prospects",
      url: "/salesperson/prospects",
      icon: Users,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <CollegeSwitcher colleges={data.colleges} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        {/* <NavProjects projects={data.projects} /> */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
