"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

interface LayoutProps {
  children: React.ReactElement;
  params: Promise<{ id: string }>;
}

function LoadingState() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center space-x-3 sm:space-x-4">
        <Skeleton className="h-10 w-10 sm:h-12 sm:w-12" />
        <div className="space-y-1.5 sm:space-y-2">
          <Skeleton className="h-3.5 sm:h-4 w-[200px] sm:w-[250px]" />
          <Skeleton className="h-3.5 sm:h-4 w-[150px] sm:w-[200px]" />
        </div>
      </div>
      <div className="space-y-2 sm:space-y-3">
        <Skeleton className="h-[150px] sm:h-[200px] w-full" />
        <Skeleton className="h-[150px] sm:h-[200px] w-full" />
      </div>
    </div>
  );
}

export default function ProspectLayout({ children, params }: LayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const resolvedParams = React.use(params);
  const id = resolvedParams.id;

  const tabs = [
    { name: "Details", href: `/salesperson/prospects/${id}/details` },
    { name: "Members", href: `/salesperson/prospects/${id}/members` },
    { name: "Reminders", href: `/salesperson/prospects/${id}/reminders` },
    { name: "Activities", href: `/salesperson/prospects/${id}/activities` },
  ];

  const handleTabChange = (value: string) => {
    router.push(value);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full px-3 sm:px-6 py-3 sm:py-4">
        <Button
          variant="ghost"
          size="sm"
          className="mb-4 sm:mb-6 -ml-1 sm:-ml-2 gap-1 sm:gap-2 text-muted-foreground hover:text-foreground h-9 sm:h-10"
          asChild
        >
          <Link href="/salesperson/prospects">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm sm:text-base">Back to Prospects</span>
          </Link>
        </Button>

        <Tabs
          value={pathname}
          className="w-full space-y-4 sm:space-y-6"
          onValueChange={handleTabChange}
        >
          <div className="sm:border-b sm:border-border">
            <TabsList className="grid grid-cols-2 sm:flex sm:flex-row gap-1 sm:gap-0 rounded-none bg-transparent p-0 h-auto sm:h-[42px] w-full justify-between">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.name}
                  value={tab.href}
                  className="relative h-[38px] sm:h-[42px] rounded-md sm:rounded-none border sm:border-0 border-border sm:border-b-2 border-transparent data-[state=active]:border-primary bg-transparent px-2 sm:px-4 text-sm sm:text-base font-medium data-[state=active]:bg-primary/5 sm:data-[state=active]:bg-transparent data-[state=active]:border-primary sm:data-[state=active]:border-primary data-[state=active]:shadow-none sm:flex-1 text-center"
                >
                  {tab.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          <div className="rounded-lg">
            <Suspense fallback={<LoadingState />}>{children}</Suspense>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
