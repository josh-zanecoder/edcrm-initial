"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Member, MemberRole } from "@/types/member";
import AddEditMemberModal from "@/components/salesperson/AddEditMemberModal";
import { useMembersStore } from "@/store/useMemberStore";
import {
  Users2,
  Mail,
  Phone,
  Trash2,
  Pencil,
  AlertCircle,
  Search,
  Filter,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const { id } = React.use(params);

  const {
    members,
    collegeName,
    isLoading,
    isOperationInProgress,
    error,
    fetchMembers,
    deleteMember,
  } = useMembersStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all"); // Changed default to "all" instead of empty string

  useEffect(() => {
    if (id) fetchMembers(id);
  }, [id, fetchMembers]);

  // Prevent operation state changes from affecting modal state
  useEffect(() => {
    if (isOperationInProgress) {
      // Block any modal changes when an operation is in progress
      return;
    }
  }, [isOperationInProgress]);

  // Filter members based on search term and selected role
  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      const fullName = `${member.firstName} ${member.lastName}`.toLowerCase();
      const matchesSearch =
        searchTerm === "" ||
        fullName.includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase());

      // Changed to check for "all" instead of empty string
      const matchesRole =
        selectedRole === "all" || member.role === selectedRole;

      return matchesSearch && matchesRole;
    });
  }, [members, searchTerm, selectedRole]);

  const handleDeleteMember = async (memberId: string) => {
    const loadingToast = toast.loading("Deleting member...");
    try {
      await deleteMember(id, memberId);
      toast.success("Member removed", { id: loadingToast });
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to delete member", {
        id: loadingToast,
      });
    }
  };

  const handleEditClick = (member: Member) => {
    setEditingMember(member);
    setIsEditModalOpen(true);
  };

  // Handle modal close with awareness of operation state
  const handleAddModalClose = () => {
    if (!isOperationInProgress) {
      setIsModalOpen(false);
    }
  };

  const handleEditModalClose = () => {
    if (!isOperationInProgress) {
      setIsEditModalOpen(false);
      setEditingMember(null);
    }
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedRole("all"); // Changed to "all" instead of empty string
  };

  if (isLoading && !isOperationInProgress) {
    return (
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Skeleton loading UI */}
        {/* (Keeping the same loading UI) */}
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
          onClick={() => fetchMembers(id)}
          className="mt-2"
        >
          Try Again
        </Button>
      </Alert>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* Header with title and add button */}
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
          disabled={isOperationInProgress}
        >
          Add Member
        </Button>
      </div>

      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0 rounded-full"
              onClick={() => setSearchTerm("")}
              title="Clear search"
            >
              <X className="h-3.5 w-3.5" />
              <span className="sr-only">Clear search</span>
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger className="w-[160px]">
              <div className="flex items-center gap-2">
                <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                <SelectValue placeholder="Filter by role" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {/* Changed value from empty string to "all" */}
              <SelectItem value="all">All Roles</SelectItem>
              {Object.values(MemberRole).map((role) => (
                <SelectItem key={role} value={role}>
                  {role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(searchTerm || selectedRole !== "all") && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              className="text-xs"
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Filter summary */}
      {(searchTerm || selectedRole !== "all") && (
        <div className="text-xs text-muted-foreground">
          Showing {filteredMembers.length} of {members.length} members
          {selectedRole !== "all" && (
            <span>
              {" "}
              with role:{" "}
              <Badge variant="outline" className="ml-1">
                {selectedRole}
              </Badge>
            </span>
          )}
          {searchTerm && (
            <span>
              {" "}
              matching:{" "}
              <Badge variant="outline" className="ml-1">
                {searchTerm}
              </Badge>
            </span>
          )}
        </div>
      )}

      {/* Members Grid */}
      <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredMembers.map((member) => (
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
                <div className="flex items-center space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 rounded-full hover:bg-primary/10"
                    onClick={() => handleEditClick(member)}
                    disabled={isOperationInProgress}
                    title="Edit member"
                  >
                    <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="sr-only">Edit member</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 rounded-full hover:bg-red-500/10"
                    onClick={() => handleDeleteMember(member._id)}
                    disabled={isOperationInProgress}
                    title="Delete member"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-red-500/80" />
                    <span className="sr-only">Delete member</span>
                  </Button>
                </div>
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
                <span>{displayPhone(member.phone)}</span>
              </a>
            </CardContent>
          </Card>
        ))}

        {/* No members state */}
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
                disabled={isOperationInProgress}
              >
                Add First Member
              </Button>
            </CardContent>
          </Card>
        )}

        {/* No results from search */}
        {members.length > 0 && filteredMembers.length === 0 && (
          <Card className="col-span-full border-border/5 bg-card">
            <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12">
              <Search className="h-10 w-10 sm:h-12 sm:w-12 text-primary/20" />
              <h3 className="mt-3 sm:mt-4 text-sm sm:text-base font-medium text-card-foreground">
                No matching members
              </h3>
              <p className="mb-3 sm:mb-4 text-xs sm:text-sm text-center text-muted-foreground max-w-[280px]">
                No members match your current search and filter criteria.
              </p>
              <Button
                onClick={handleResetFilters}
                variant="outline"
                size="sm"
                className="h-9"
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add Member Modal */}
      <AddEditMemberModal
        isOpen={isModalOpen}
        onClose={handleAddModalClose}
        prospectId={id}
        mode="add"
      />

      {/* Edit Member Modal */}
      <AddEditMemberModal
        isOpen={isEditModalOpen}
        onClose={handleEditModalClose}
        prospectId={id}
        initialData={editingMember || undefined}
        mode="edit"
      />
    </div>
  );
}
