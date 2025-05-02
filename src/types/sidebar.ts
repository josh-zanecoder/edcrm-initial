import { LucideIcon } from "lucide-react";

export interface User {
  name: string;
  email: string;
  avatar: string;
}

export interface College {
  id: string;
  name: string;
  email: string;
  logo: React.ElementType;
}

export interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
}

export interface SidebarData {
  user: User;
  colleges?: College[];
  navMain: NavItem[];
}
