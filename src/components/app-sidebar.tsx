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
import { useUserStore } from "@/store/useUserStore";
import { useEffect, useState } from "react";
import { SidebarData } from "@/types/sidebar";
import { SidebarSkeleton } from "@/components/ui/sidebar-skeleton";
const salesPersonNavItems = [
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
];

const adminNavItems = [
  {
    title: "Dashboard",
    url: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Sales Team",
    url: "/admin/salespersons",
    icon: Users,
  },
];

const defaultNavItems = [
  {
    title: "",
    url: "#",
    icon: LayoutDashboard,
  },
];

const defaultUser = {
  name: "EdTracts",
  email: "m@example.com",
  avatar: "/avatars/shadcn.jpg",
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { userRole, colleges, userData, getUser } = useUserStore();
  const [data, setData] = useState<SidebarData>({
    user: defaultUser,
    navMain: salesPersonNavItems || adminNavItems,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUser();
  }, [getUser]);

  useEffect(() => {
    const updateSidebarData = async () => {
      try {
        const updatedUser = {
          name:
            userData?.firstName && userData?.lastName
              ? `${userData.firstName} ${userData.lastName}`
              : userData?.firstName ||
                userData?.lastName ||
                userData?.displayName ||
                defaultUser.name,
          email: userData?.email || defaultUser.email,
          avatar: userData?.avatar || defaultUser.avatar,
        };

        if (userRole === "salesperson") {
          setData({
            user: updatedUser,
            colleges: colleges.map((college: any) => ({
              id: college.id,
              name: college.name,
              email: college.email || "",
              logo: Command as React.ElementType,
            })),
            navMain: salesPersonNavItems,
          });
        } else if (userRole === "admin") {
          setData({
            user: updatedUser,
            navMain: adminNavItems,
          });
        } else {
          setData({
            user: updatedUser,
            navMain: defaultNavItems,
          });
        }
      } catch (error) {
        console.error("Error fetching sidebar data:", error);
        setData({
          user: defaultUser,
          navMain: defaultNavItems,
        });
      } finally {
        setLoading(false);
      }
    };

    updateSidebarData();
  }, [userRole, colleges, userData]);

  if (loading) {
    return <SidebarSkeleton />;
  }

  return (
    <Sidebar variant="inset" collapsible="icon" {...props}>
      <SidebarHeader>
        <CollegeSwitcher colleges={data.colleges ?? []} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
