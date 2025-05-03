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
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Skeleton className="h-12 w-12" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
      </div>
      <div className="space-y-3">
        <Skeleton className="h-[200px] w-full" />
        <Skeleton className="h-[200px] w-full" />
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
      <div className="mx-auto w-full px-6 py-4">
        <Button
          variant="ghost"
          size="sm"
          className="mb-6 -ml-2 gap-2 text-muted-foreground hover:text-foreground"
          asChild
        >
          <Link href="/salesperson/prospects">
            <ArrowLeft className="h-4 w-4" />
            Back to Prospects
          </Link>
        </Button>

        <Tabs
          value={pathname}
          className="w-full space-y-6"
          onValueChange={handleTabChange}
        >
          <TabsList className="h-[42px] w-full justify-start gap-1 rounded-none border-b border-border bg-transparent p-0">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.name}
                value={tab.href}
                className="relative h-[42px] rounded-none border-b-2 border-transparent bg-transparent px-4 font-medium data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                {tab.name}
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="rounded-lg">
            <Suspense fallback={<LoadingState />}>{children}</Suspense>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
