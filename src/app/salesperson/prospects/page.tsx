"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { Prospect } from "@/types/prospect";
import AddProspectModal from "@/components/salesperson/AddProspectModal";
import {
  formatAddress,
  formatPhoneNumber,
  formatWebsite,
} from "@/utils/formatters";
import { useCallStore } from "@/store/useCallStore";
import { useDebouncedCallback } from "use-debounce";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { Plus, Phone, Mail, MapPin, Globe, User, Search } from "lucide-react";
import { toast } from "react-hot-toast";
import { Progress } from "@/components/ui/progress";
import { useUserStore } from "@/store/useUserStore";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { MoreHorizontal } from "lucide-react";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Trash2 } from "lucide-react";

// Utility function to remove special characters from phone number
const unformatPhoneNumber = (phone: string) => {
  return phone.replace(/[^\d+]/g, "");
};

export default function ProspectsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [isLoadingProspects, setIsLoadingProspects] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { makeCall, isCalling } = useCallStore();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [progress, setProgress] = useState(0);
  const fetchColleges = useUserStore((state) => state.fetchColleges);

  // Define callbacks using useCallback
  const handleRowClick = useCallback(
    (prospectId: string) => {
      router.push(`/salesperson/prospects/${prospectId}/details`);
    },
    [router]
  );

  const debouncedSearch = useDebouncedCallback((query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  }, 300);

  // Move all useEffects here
  useEffect(() => {
    if (!isLoading && (!user || user.role !== "salesperson")) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    const fetchProspects = async () => {
      try {
        setIsLoadingProspects(true);
        const searchParams = new URLSearchParams({
          page: currentPage.toString(),
          limit: "10",
        });

        if (searchQuery) {
          searchParams.append("search", searchQuery);
        }

        const response = await fetch(
          `/api/prospects?${searchParams.toString()}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch prospects");
        }
        const data = await response.json();
        setProspects(data.prospects);
        setTotalPages(data.totalPages);
        setTotalCount(data.totalCount);
      } catch (error) {
        console.error("Error fetching prospects:", error);
      } finally {
        setIsLoadingProspects(false);
      }
    };

    if (user) {
      fetchProspects();
    }
  }, [user, currentPage, searchQuery]);

  useEffect(() => {
    if (isLoading) {
      const timer = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 95) {
            clearInterval(timer);
            return 95;
          }
          return prev + 10;
        });
      }, 50);
      return () => clearInterval(timer);
    }
  }, [isLoading]);

  const handleAddProspect = async (
    newProspect: Omit<
      Prospect,
      "id" | "createdAt" | "updatedAt" | "addedBy" | "assignedTo"
    >
  ) => {
    const loadingToast = toast.loading("Saving prospect...");
    try {
      const response = await fetch("/api/prospects/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newProspect),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || "Failed to create prospect");
      }

      const createdProspect = await response.json();
      setProspects((prev) => [...prev, createdProspect]);
      setIsModalOpen(false);
      toast.success("Prospect added successfully", {
        id: loadingToast,
      });
      await fetchColleges();
    } catch (error) {
      console.error("Error creating prospect:", error);
      // TODO: Show error notification
      alert(
        error instanceof Error ? error.message : "Failed to create prospect"
      );
    }
  };

  const handleMakeCall = (prospect: Prospect) => {
    makeCall({
      To: `+1${unformatPhoneNumber(prospect.phone)}`,
      CallerId: `+1${unformatPhoneNumber(user?.twilioNumber || "")}`,
      UserId: user?.uid ?? "",
      ProspectId: prospect.id,
    });
  };

  const handleSendEmail = (prospect: Prospect) => {
    const subject = `Regarding ${prospect.collegeName}`;
    const body = `Hello,\n\nI hope this email finds you well. I wanted to reach out regarding ${prospect.collegeName}.\n\nBest regards,\n${prospect.assignedTo.email}`;

    const mailtoLink = `mailto:${prospect.email}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;

    // Open in a new tab to avoid navigation issues
    window.open(mailtoLink, "_blank");
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 w-[200px]">
          <Progress value={progress} className="w-full" />
          <p className="text-sm text-muted-foreground">Loading prospects...</p>
        </div>
      </div>
    );
  }

  // Render null state
  if (!user) {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "New":
        return "bg-gray-100 text-gray-800";
      case "Contacted":
        return "bg-blue-100 text-blue-800";
      case "Qualified":
        return "bg-green-100 text-green-800";
      case "Proposal":
        return "bg-purple-100 text-purple-800";
      case "Negotiation":
        return "bg-yellow-100 text-yellow-800";
      case "Closed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Prospects
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage and track your prospects
          </p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          size="sm"
          className="w-full sm:w-auto"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Prospect
        </Button>
      </div>

      {/* Search Input */}
      <div className="flex items-center space-x-2 pb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search prospects..."
            onChange={(e) => debouncedSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {isLoadingProspects ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-5"></TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>College Name</TableHead>
                  <TableHead className="hidden sm:table-cell">
                    Contact
                  </TableHead>
                  <TableHead className="hidden md:table-cell">
                    Location
                  </TableHead>
                  <TableHead className="hidden md:table-cell">BPPE</TableHead>
                  <TableHead className="hidden sm:table-cell text-right">
                    Last Contact
                  </TableHead>
                  <TableHead className="w-8"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[1, 2, 3].map((i) => (
                  <TableRow key={i}>
                    <TableCell className="w-5">
                      <Skeleton className="h-4 w-4" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-[200px]" />
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-right">
                      <Skeleton className="h-4 w-16 ml-auto" />
                    </TableCell>
                    <TableCell className="w-8">
                      <Skeleton className="h-4 w-4" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden sm:block">
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table className="min-w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-5"></TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>College Name</TableHead>
                        <TableHead className="hidden sm:table-cell">
                          Contact
                        </TableHead>
                        <TableHead className="hidden md:table-cell">
                          Location
                        </TableHead>
                        <TableHead className="hidden md:table-cell">
                          BPPE
                        </TableHead>
                        <TableHead className="hidden sm:table-cell text-right">
                          Last Contact
                        </TableHead>
                        <TableHead className="w-8"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {prospects.map((prospect) => (
                        <TableRow
                          key={prospect.id}
                          className="cursor-pointer hover:bg-accent/50 transition-colors"
                          onClick={() => handleRowClick(prospect.id)}
                        >
                          <TableCell className="w-5"></TableCell>
                          <TableCell>
                            <Badge variant="outline">{prospect.status}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {prospect.collegeName}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {prospect.email}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="hover:text-primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMakeCall(prospect);
                              }}
                              disabled={isCalling}
                            >
                              {formatPhoneNumber(prospect.phone)}
                            </Button>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <div className="flex flex-col">
                              <span>{formatAddress(prospect.address)}</span>
                              <span className="text-sm text-muted-foreground">
                                {prospect.county} County
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <Badge
                              variant={
                                prospect.bppeApproved
                                  ? "outline"
                                  : "destructive"
                              }
                              className={
                                prospect.bppeApproved
                                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
                                  : ""
                              }
                            >
                              {prospect.bppeApproved
                                ? "Approved"
                                : "Not Approved"}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-right">
                            {new Date(
                              prospect.lastContact
                            ).toLocaleDateString()}
                          </TableCell>
                          <TableCell
                            className="w-8"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 p-0"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Open menu</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRowClick(prospect.id);
                                  }}
                                >
                                  <User className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMakeCall(prospect);
                                  }}
                                >
                                  <Phone className="mr-2 h-4 w-4" />
                                  Call
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSendEmail(prospect);
                                  }}
                                >
                                  <Mail className="mr-2 h-4 w-4" />
                                  Send Email
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive">
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {prospects.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Search className="h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">
                      No results found
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Try adjusting your search terms
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Mobile Card View */}
          <div className="sm:hidden space-y-3">
            {prospects.map((prospect) => (
              <Card
                key={prospect.id}
                className="cursor-pointer hover:bg-accent/50 transition-colors p-2"
              >
                <CardHeader className="pb-1 px-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle
                        className="hover:text-primary cursor-pointer text-base"
                        onClick={() =>
                          router.push(
                            `/salesperson/prospects/${prospect.id}/details`
                          )
                        }
                      >
                        {prospect.collegeName}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {prospect.collegeTypes.join(", ")}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="text-xs py-0.5 px-2">
                      {prospect.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 px-2 pb-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 hover:text-primary text-xs"
                        onClick={() => handleMakeCall(prospect)}
                        disabled={isCalling}
                      >
                        {formatPhoneNumber(prospect.phone)}
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{prospect.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{formatAddress(prospect.address)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={prospect.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline break-all"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {formatWebsite(prospect.website)}
                      </a>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>Assigned to {prospect.assignedTo.email}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 pt-2">
                    <Badge
                      variant={
                        prospect.bppeApproved ? "default" : "destructive"
                      }
                      className={
                        prospect.bppeApproved
                          ? "bg-green-100 text-green-800 text-xs"
                          : "text-xs"
                      }
                    >
                      {prospect.bppeApproved
                        ? "BPPE Approved"
                        : "Not BPPE Approved"}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full"
                      onClick={() => handleRowClick(prospect.id)}
                    >
                      View
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full"
                      onClick={() => handleMakeCall(prospect)}
                      disabled={isCalling}
                    >
                      Call
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      <AddProspectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleAddProspect}
      />

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-sm text-muted-foreground">
          {totalCount === 0 ? (
            <>Showing 0 results</>
          ) : (
            <>
              Showing{" "}
              <span className="font-medium">{(currentPage - 1) * 10 + 1}</span>{" "}
              to{" "}
              <span className="font-medium">
                {Math.min(currentPage * 10, totalCount)}
              </span>{" "}
              of <span className="font-medium">{totalCount}</span> results
            </>
          )}
        </div>
        <div className="flex flex-wrap gap-2 justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          {[...Array(totalPages)].map((_, i) => (
            <Button
              key={i + 1}
              variant={currentPage === i + 1 ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentPage(i + 1)}
            >
              {i + 1}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setCurrentPage((page) => Math.min(totalPages, page + 1))
            }
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
