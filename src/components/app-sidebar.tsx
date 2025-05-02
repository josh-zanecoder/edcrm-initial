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
import axios from "axios";
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
  const [data, setData] = useState<SidebarData>({
    user: defaultUser,
    navMain: salesPersonNavItems || adminNavItems,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userDataResponse, collegesResponse] = await Promise.all([
          axios.get("/api/auth/authenticated"),
          axios.get("/api/colleges"),
        ]);

        const userRole = userDataResponse.data.userData.role;
        const userData = userDataResponse.data.userData;
        const colleges = collegesResponse.data.colleges;

        if (userData.firstName && userData.lastName) {
          defaultUser.name = userData.firstName + " " + userData.lastName;
        } else if (userData.firstName) {
          defaultUser.name = userData.firstName;
        } else if (userData.lastName) {
          defaultUser.name = userData.lastName;
        } else {
          defaultUser.name = userData.displayName;
        }

        defaultUser.email = userData.email;
        defaultUser.avatar = userData.avatar;

        console.log("colleges", colleges);
        console.log("userRole", userRole);
        console.log("userData", userData);

        if (userRole === "salesperson") {
          setData({
            user: defaultUser,
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
            user: defaultUser,
            navMain: adminNavItems,
          });
        }
      } catch (error) {
        console.error("Error fetching sidebar data:", error);
        // Fallback to default data
        setData({
          user: defaultUser,
          navMain: defaultNavItems,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <SidebarSkeleton />;
  }

  return (
    <Sidebar collapsible="icon" {...props}>
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
