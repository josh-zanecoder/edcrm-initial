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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-6 w-40" />
          </div>
          <Skeleton className="h-9 w-24" />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card
              key={i}
              className="overflow-hidden border-border/5 bg-card shadow-none"
            >
              <CardHeader className="border-b border-border/5 bg-card p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div>
                      <Skeleton className="h-5 w-32 mb-2" />
                      <Skeleton className="h-5 w-20" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-8" />
                </div>
              </CardHeader>
              <CardContent className="space-y-2 bg-card p-4 pt-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-48" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-32" />
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
      <Alert variant="destructive" className="mx-auto max-w-2xl">
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users2 className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-medium">College Staff Members</h1>
        </div>
        <Button onClick={() => setIsModalOpen(true)} size="sm">
          Add Member
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {members.map((member) => (
          <Card
            key={member._id}
            className="overflow-hidden border-border/5 bg-card shadow-none"
          >
            <CardHeader className="border-b border-border/5 bg-card p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="border border-border/5 bg-primary/10 text-sm text-primary">
                      {getInitials(member.firstName, member.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-sm font-medium text-card-foreground">
                      {member.firstName} {member.lastName}
                    </h3>
                    <Badge
                      variant="secondary"
                      className="mt-1 text-xs font-normal"
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
                      className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                    >
                      <span className="sr-only">Open menu</span>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => handleEditClick(member)}
                      className="gap-2"
                    >
                      <Pencil className="h-4 w-4" />
                      Edit Member
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDeleteMember(member._id)}
                      className="gap-2 text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete Member
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 bg-card p-4 pt-3">
              <a
                href={`mailto:${member.email}`}
                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary"
              >
                <Mail className="h-3.5 w-3.5" />
                {member.email}
              </a>
              <a
                href={`tel:${member.phone}`}
                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary"
              >
                <Phone className="h-3.5 w-3.5" />
                {displayPhone(member.phone)}
              </a>
            </CardContent>
          </Card>
        ))}

        {members.length === 0 && (
          <Card className="col-span-full border-border/5 bg-card">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users2 className="h-12 w-12 text-primary/20" />
              <h3 className="mt-4 text-base font-medium text-card-foreground">
                No members yet
              </h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Get started by adding college staff members.
              </p>
              <Button onClick={() => setIsModalOpen(true)} size="sm">
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
