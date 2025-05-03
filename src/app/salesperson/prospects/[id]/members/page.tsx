"use client";

import React, { useState, useEffect } from "react";
import { Member } from "@/types/member";
import AddEditMemberModal from "@/components/salesperson/AddEditMemberModal";
import {
  Users2,
  Mail,
  Phone,
  Trash2,
  Pencil,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

function displayPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

function getInitials(firstName: string, lastName: string) {
  return `${firstName[0]}${lastName[0]}`.toUpperCase();
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function MembersPage({ params }: PageProps) {
  const resolvedParams = React.use(params);
  const id = resolvedParams.id;
  const [members, setMembers] = useState<Member[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [collegeName, setCollegeName] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  const fetchMembers = React.useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);

      // Fetch prospect details first to get the college name
      const prospectResponse = await fetch(`/api/prospects/${id}/details`);
      if (!prospectResponse.ok) {
        throw new Error("Failed to fetch prospect details");
      }
      const prospectData = await prospectResponse.json();
      setCollegeName(prospectData.collegeName);

      // Fetch members
      const membersResponse = await fetch(`/api/prospects/${id}/members`);
      if (!membersResponse.ok) {
        const errorData = await membersResponse.json();
        throw new Error(errorData.error || "Failed to fetch members");
      }
      const membersData = await membersResponse.json();
      setMembers(membersData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      toast.error("Failed to load members");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchMembers();
    }
  }, [id, fetchMembers]);

  const handleAddMember = async (
    member: Omit<Member, "_id" | "createdAt" | "updatedAt" | "addedBy">
  ) => {
    try {
      const response = await fetch(`/api/prospects/${id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(member),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add member");
      }
      setIsModalOpen(false);
      await fetchMembers();
    } catch (err) {
      console.error("Error adding member:", err);
      toast.error(err instanceof Error ? err.message : "Failed to add member");
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    const loadingToast = toast.loading("Deleting member...");
    try {
      const response = await fetch(`/api/prospects/${id}/members/${memberId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete member");
      }

      // Optimistically update the UI
      setMembers((prevMembers) =>
        prevMembers.filter((member) => member._id !== memberId)
      );
      toast.success("Member removed successfully", {
        id: loadingToast,
      });
    } catch (err) {
      console.error("Error deleting member:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to delete member"
      );
      // Refresh the list to ensure consistency
      fetchMembers();
    }
  };

  const handleEditClick = (member: Member) => {
    setEditingMember(member);
    setIsEditModalOpen(true);
  };

  const handleEditMember = async (
    member: Omit<Member, "_id" | "createdAt" | "updatedAt" | "addedBy">
  ) => {
    if (!editingMember) return;
    try {
      const response = await fetch(
        `/api/prospects/${id}/members/${editingMember._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(member),
        }
      );

      const responseData = await response.json();

      if (!response.ok) {
        console.error("Update failed:", responseData);
        throw new Error(responseData.error || "Failed to update member");
      }

      setIsEditModalOpen(false);
      setEditingMember(null);
      await fetchMembers();
    } catch (err) {
      console.error("Error updating member:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to update member"
      );
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 sm:h-5 w-4 sm:w-5" />
            <Skeleton className="h-5 sm:h-6 w-32 sm:w-40" />
          </div>
          <Skeleton className="h-8 sm:h-9 w-20 sm:w-24" />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card
              key={i}
              className="overflow-hidden border-border/5 bg-card shadow-none"
            >
              <CardHeader className="border-b border-border/5 bg-card p-3 sm:p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Skeleton className="h-7 w-7 sm:h-8 sm:w-8 rounded-full" />
                    <div>
                      <Skeleton className="h-4 sm:h-5 w-28 sm:w-32 mb-1.5 sm:mb-2" />
                      <Skeleton className="h-4 sm:h-5 w-16 sm:w-20" />
                    </div>
                  </div>
                  <Skeleton className="h-7 w-7 sm:h-8 sm:w-8" />
                </div>
              </CardHeader>
              <CardContent className="space-y-2 bg-card p-3 sm:p-4 pt-2 sm:pt-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
                  <Skeleton className="h-3.5 sm:h-4 w-40 sm:w-48" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
                  <Skeleton className="h-3.5 sm:h-4 w-28 sm:w-32" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mx-auto max-w-2xl m-3 sm:m-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error Loading Members</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchMembers}
          className="mt-2"
        >
          Try Again
        </Button>
      </Alert>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users2 className="h-4 sm:h-5 w-4 sm:w-5 text-primary" />
          <h1 className="text-base sm:text-lg font-medium">
            College Staff Members
          </h1>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          size="sm"
          className="h-8 sm:h-9"
        >
          Add Member
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
        {members.map((member) => (
          <Card
            key={member._id}
            className="overflow-hidden border-border/5 bg-card shadow-none"
          >
            <CardHeader className="border-b border-border/5 bg-card p-2.5 sm:p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className="border border-border/5 bg-primary/10 text-[11px] sm:text-sm text-primary">
                      {getInitials(member.firstName, member.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <h3 className="text-sm font-medium text-card-foreground truncate pr-2">
                      {member.firstName} {member.lastName}
                    </h3>
                    <Badge
                      variant="secondary"
                      className="mt-0.5 text-[10px] sm:text-xs font-normal max-w-full truncate"
                    >
                      {member.role}
                    </Badge>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 flex-shrink-0 p-0 hover:bg-primary/10 hover:text-primary ml-2"
                    >
                      <span className="sr-only">Open menu</span>
                      <Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[160px]">
                    <DropdownMenuItem
                      onClick={() => handleEditClick(member)}
                      className="gap-2"
                    >
                      <Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span className="text-xs sm:text-sm">Edit Member</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDeleteMember(member._id)}
                      className="gap-2 text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span className="text-xs sm:text-sm">Delete Member</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="space-y-1.5 sm:space-y-2 bg-card p-2.5 sm:p-4">
              <a
                href={`mailto:${member.email}`}
                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary truncate"
              >
                <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">{member.email}</span>
              </a>
              <a
                href={`tel:${member.phone}`}
                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary"
              >
                <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                {displayPhone(member.phone)}
              </a>
            </CardContent>
          </Card>
        ))}

        {members.length === 0 && (
          <Card className="col-span-full border-border/5 bg-card">
            <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12">
              <Users2 className="h-10 w-10 sm:h-12 sm:w-12 text-primary/20" />
              <h3 className="mt-3 sm:mt-4 text-sm sm:text-base font-medium text-card-foreground">
                No members yet
              </h3>
              <p className="mb-3 sm:mb-4 text-xs sm:text-sm text-center text-muted-foreground max-w-[240px]">
                Get started by adding college staff members.
              </p>
              <Button
                onClick={() => setIsModalOpen(true)}
                size="sm"
                className="h-9"
              >
                Add First Member
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <AddEditMemberModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleAddMember}
        prospectId={id}
        collegeName={collegeName}
      />

      <AddEditMemberModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingMember(null);
        }}
        onSave={handleEditMember}
        prospectId={id}
        collegeName={collegeName}
        initialData={editingMember || undefined}
        mode="edit"
      />
    </div>
  );
}
