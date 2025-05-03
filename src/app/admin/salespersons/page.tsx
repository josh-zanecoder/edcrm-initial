"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import AddSalespersonModal from "@/components/admin/AddSalespersonModal";
import { Salesperson } from "@/types/salesperson";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Plus, User, Phone, Calendar } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function SalespersonsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [salespersons, setSalespersons] = useState<Salesperson[]>([]);
  const [isLoadingSalespersons, setIsLoadingSalespersons] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSalespersons = async () => {
      try {
        const response = await fetch("/api/admin-salespersons");
        if (!response.ok) {
          throw new Error("Failed to fetch salespersons");
        }
        const data = await response.json();
        setSalespersons(data);
      } catch (error) {
        console.error("Error fetching salespersons:", error);
        setError("Failed to load salespersons");
      } finally {
        setIsLoadingSalespersons(false);
      }
    };

    fetchSalespersons();
  }, []);

  const filteredSalespersons = salespersons.filter((person) => {
    const fullName = `${person.first_name} ${person.last_name}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchTerm.toLowerCase()) ||
      person.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || person.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="space-y-4 sm:space-y-6 p-3 sm:p-6">
        {/* Header Skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-8 sm:h-9 w-64" />
          <Skeleton className="h-5 sm:h-6 w-48" />
        </div>

        {/* Controls Skeleton */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Skeleton className="h-10 w-full sm:w-[300px]" />
          <Skeleton className="h-10 w-full sm:w-[140px]" />
          <Skeleton className="h-10 w-full sm:w-[150px]" />
        </div>

        {/* Table Skeleton */}
        <Card className="border-none bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-lg border"
                >
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-[140px]" />
                      <Skeleton className="h-3 w-[180px]" />
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6 w-full sm:w-auto">
                    <Skeleton className="h-5 w-[120px]" />
                    <Skeleton className="h-6 w-[80px]" />
                    <Skeleton className="h-5 w-[100px]" />
                    <Skeleton className="h-8 w-[100px] ml-auto" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="h-full space-y-6 p-8 pt-6">
      <div className="flex flex-col space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Sales Team</h1>
        <p className="text-muted-foreground">Manage your sales team members</p>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="flex-1 relative w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto whitespace-nowrap"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Salesperson
        </Button>
      </div>

      <Card className="border-none bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <CardContent className="p-0">
          {isLoadingSalespersons ? (
            <div className="p-4 sm:p-6">
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-lg border"
                  >
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <Skeleton className="h-9 w-9 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-[140px]" />
                        <Skeleton className="h-3 w-[180px]" />
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6 w-full sm:w-auto">
                      <Skeleton className="h-5 w-[120px]" />
                      <Skeleton className="h-6 w-[80px]" />
                      <Skeleton className="h-5 w-[100px]" />
                      <Skeleton className="h-8 w-[100px] ml-auto" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : error ? (
            <div className="flex h-[450px] items-center justify-center">
              <div className="text-center">
                <p className="text-sm text-destructive">{error}</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => window.location.reload()}
                >
                  Try Again
                </Button>
              </div>
            </div>
          ) : filteredSalespersons.length === 0 ? (
            <div className="flex h-[450px] items-center justify-center">
              <div className="text-center">
                <User className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                <p className="mt-2 text-sm text-muted-foreground">
                  No salespersons found
                </p>
              </div>
            </div>
          ) : (
            <div className="hidden sm:block">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Join Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSalespersons.map((person) => (
                    <TableRow
                      key={person.id}
                      className="cursor-pointer hover:bg-muted/50"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center ring-1 ring-border">
                            <span className="text-xs font-medium text-primary">
                              {person.first_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="space-y-0.5">
                            <div className="font-medium">
                              {person.first_name} {person.last_name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {person.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{person.phone}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            person.status === "active" ? "default" : "secondary"
                          }
                          className={
                            person.status === "active"
                              ? "bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25"
                              : "bg-muted hover:bg-muted/80"
                          }
                        >
                          {person.status.charAt(0).toUpperCase() +
                            person.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>
                            {new Date(person.joinDate).toLocaleDateString()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            router.push(`/admin/salespersons/${person.id}`)
                          }
                          className="hover:bg-primary/10 hover:text-primary"
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Mobile View */}
          {!isLoadingSalespersons &&
            !error &&
            filteredSalespersons.length > 0 && (
              <div className="block sm:hidden space-y-4">
                {filteredSalespersons.map((person) => (
                  <div
                    key={person.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-lg border cursor-pointer hover:bg-muted/50"
                    onClick={() =>
                      router.push(`/admin/salespersons/${person.id}`)
                    }
                  >
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center ring-1 ring-border">
                        <span className="text-xs font-medium text-primary">
                          {person.first_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="space-y-0.5 flex-1">
                        <div className="font-medium">
                          {person.first_name} {person.last_name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {person.email}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6 w-full sm:w-auto">
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{person.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>
                          {new Date(person.joinDate).toLocaleDateString()}
                        </span>
                      </div>
                      <Badge
                        variant={
                          person.status === "active" ? "default" : "secondary"
                        }
                        className={
                          person.status === "active"
                            ? "w-fit bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25"
                            : "w-fit bg-muted hover:bg-muted/80"
                        }
                      >
                        {person.status.charAt(0).toUpperCase() +
                          person.status.slice(1)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
        </CardContent>
      </Card>

      <AddSalespersonModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
