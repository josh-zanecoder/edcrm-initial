"use client";

import React, { useState, useEffect } from "react";
import { Prospect, CollegeType } from "@/types/prospect";
import { formatAddress, formatPhoneNumber } from "@/utils/formatters";
import { useRouter } from "next/navigation";
import {
  Phone,
  Mail,
  MapPin,
  Globe,
  Building2,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const STATUS_OPTIONS = [
  "New",
  "Contacted",
  "Qualified",
  "Proposal",
  "Negotiation",
  "Closed",
];

const COLLEGE_TYPES = Object.values(CollegeType);

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ProspectDetailsPage({ params }: PageProps) {
  const router = useRouter();
  const resolvedParams = React.use(params);
  const id = resolvedParams.id;
  const [prospect, setProspect] = useState<Prospect | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProspect, setEditedProspect] = useState<Prospect | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchProspect = async () => {
      if (!id) {
        toast.error("Invalid prospect ID");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await fetch(`/api/prospects/${id}/details`, {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch prospect");
        }

        const data = await response.json();
        setProspect(data);
        setEditedProspect(data);
      } catch (error) {
        console.error("Error fetching prospect:", error);
        toast.error(
          error instanceof Error ? error.message : "Failed to fetch prospect"
        );
        setProspect(null);
        setEditedProspect(null);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchProspect();
    }
  }, [id]);

  const handleEdit = () => {
    setIsEditing(true);
    setEditedProspect(prospect);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedProspect(prospect);
  };

  const handleChange = (field: string, value: string | boolean) => {
    if (!editedProspect) return;

    if (field === "phone") {
      const formattedPhone = formatPhoneNumber(value as string);
      setEditedProspect({
        ...editedProspect,
        [field]: formattedPhone,
      });
      return;
    }

    if (field.startsWith("address.")) {
      const addressField = field.split(".")[1];
      setEditedProspect({
        ...editedProspect,
        address: {
          ...editedProspect.address,
          [addressField]: value,
        },
      });
    } else {
      setEditedProspect({
        ...editedProspect,
        [field]: value,
      });
    }
  };

  const handleCollegeTypeToggle = (type: CollegeType) => {
    setEditedProspect((prev) => {
      if (!prev) return prev;
      const types = prev.collegeTypes.includes(type)
        ? prev.collegeTypes.filter((t) => t !== type)
        : [...prev.collegeTypes, type];
      return { ...prev, collegeTypes: types };
    });
  };

  const isValidPhoneNumber = (phone: string): boolean => {
    const phoneRegex = /^\(\d{3}\) \d{3}-\d{4}$/;
    return phoneRegex.test(phone);
  };

  const handleSave = async () => {
    if (!prospect || !editedProspect) return;
    setIsSaving(true);
    const loadingToast = toast.loading("Saving prospect...");

    try {
      const response = await fetch(`/api/prospects/${id}/details`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editedProspect),
      });

      if (response.status === 401) {
        router.push("/login");
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update prospect");
      }

      const updatedProspect = await response.json();
      setProspect(updatedProspect);
      setEditedProspect(updatedProspect);
      setIsEditing(false);
      toast.success("Prospect updated successfully", {
        id: loadingToast,
      });
    } catch (error) {
      console.error("Error updating prospect:", error);
      // toast.error(
      //   error instanceof Error ? error.message : "Failed to update prospect"
      // );
      toast.error("Failed to update prospect", {
        id: loadingToast,
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-7 w-7" />
              <Skeleton className="h-6 w-32" />
            </div>
            <Skeleton className="h-9 w-24" />
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Skeleton className="h-6 w-6" />
                <Skeleton className="h-6 w-32" />
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-9 w-full" />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Right Column */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Skeleton className="h-6 w-6" />
                <Skeleton className="h-6 w-32" />
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-9 w-full" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!prospect || !editedProspect) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground">
            Prospect not found
          </h2>
          <p className="mt-2 text-muted-foreground">
            The requested prospect could not be found.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
      <Card className="mb-4 sm:mb-6">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
          <div className="flex items-center gap-3">
            <Building2 className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
            <CardTitle className="text-lg sm:text-xl">
              Prospect Details
            </CardTitle>
          </div>
          <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2 sm:gap-3">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </>
            ) : (
              <Button
                onClick={handleEdit}
                size="sm"
                className="w-full sm:w-auto"
              >
                Edit Details
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {/* College Details Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              <CardTitle className="text-base sm:text-lg">
                College Details
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-5">
            <div className="space-y-2">
              <Label className="text-sm sm:text-base">College Name</Label>
              {isEditing ? (
                <Input
                  value={editedProspect.collegeName}
                  onChange={(e) => handleChange("collegeName", e.target.value)}
                  placeholder="Enter college name"
                  className="text-sm sm:text-base"
                />
              ) : (
                <p className="text-sm sm:text-base text-foreground">
                  {prospect.collegeName}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm sm:text-base">Phone</Label>
              {isEditing ? (
                <div className="space-y-2">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                    </div>
                    <Input
                      type="tel"
                      value={formatPhoneNumber(editedProspect.phone)}
                      onChange={(e) => handleChange("phone", e.target.value)}
                      className="pl-9 sm:pl-10 text-sm sm:text-base"
                      placeholder="(XXX) XXX-XXXX"
                      maxLength={14}
                    />
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Please enter phone number in format: (XXX) XXX-XXXX
                  </p>
                </div>
              ) : (
                <div className="flex items-center">
                  <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground mr-2" />
                  <span className="text-sm sm:text-base text-foreground">
                    {formatPhoneNumber(prospect.phone)}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm sm:text-base">Email</Label>
              {isEditing ? (
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                  </div>
                  <Input
                    type="email"
                    value={editedProspect.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    className="pl-9 sm:pl-10 text-sm sm:text-base"
                    placeholder="email@example.com"
                  />
                </div>
              ) : (
                <div className="flex items-center">
                  <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground mr-2" />
                  <span className="text-sm sm:text-base text-foreground">
                    {prospect.email}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm sm:text-base">Website</Label>
              {isEditing ? (
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Globe className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                  </div>
                  <Input
                    type="url"
                    value={editedProspect.website}
                    onChange={(e) => handleChange("website", e.target.value)}
                    className="pl-9 sm:pl-10 text-sm sm:text-base"
                    placeholder="https://example.com"
                  />
                </div>
              ) : (
                <div className="flex items-center">
                  <Globe className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground mr-2" />
                  <a
                    href={prospect.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm sm:text-base text-primary hover:underline break-all"
                  >
                    {prospect.website}
                  </a>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Location & Status Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              <CardTitle className="text-base sm:text-lg">
                Location & Status
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-5">
            <div className="space-y-2">
              <Label className="text-sm sm:text-base">Address</Label>
              {isEditing ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      placeholder="City"
                      value={editedProspect.address.city}
                      onChange={(e) =>
                        handleChange("address.city", e.target.value)
                      }
                      className="text-sm sm:text-base"
                    />
                    <Input
                      placeholder="State"
                      value={editedProspect.address.state}
                      onChange={(e) =>
                        handleChange("address.state", e.target.value)
                      }
                      className="text-sm sm:text-base"
                    />
                  </div>
                  <Input
                    placeholder="ZIP Code"
                    value={editedProspect.address.zip}
                    onChange={(e) =>
                      handleChange("address.zip", e.target.value)
                    }
                    className="text-sm sm:text-base"
                  />
                </div>
              ) : (
                <div className="flex items-start">
                  <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground mr-2 mt-0.5" />
                  <div>
                    <p className="text-sm sm:text-base text-foreground">
                      {formatAddress(prospect.address)}
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                      {prospect.county} County
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm sm:text-base">County</Label>
              {isEditing ? (
                <Input
                  value={editedProspect.county}
                  onChange={(e) => handleChange("county", e.target.value)}
                  placeholder="Enter county"
                  className="text-sm sm:text-base"
                />
              ) : (
                <p className="text-sm sm:text-base text-foreground">
                  {prospect.county}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm sm:text-base">Status</Label>
              {isEditing ? (
                <Select
                  value={editedProspect.status}
                  onValueChange={(value) => handleChange("status", value)}
                >
                  <SelectTrigger className="text-sm sm:text-base">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex items-center">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground mr-2" />
                  <Badge variant="secondary" className="text-xs sm:text-sm">
                    {prospect.status}
                  </Badge>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm sm:text-base">College Types</Label>
              {isEditing ? (
                <div className="flex flex-wrap gap-2">
                  {COLLEGE_TYPES.map((type) => (
                    <Button
                      key={type}
                      variant={
                        editedProspect.collegeTypes.includes(
                          type as CollegeType
                        )
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      onClick={() =>
                        handleCollegeTypeToggle(type as CollegeType)
                      }
                      className="text-xs sm:text-sm"
                    >
                      {type}
                    </Button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {prospect.collegeTypes?.map((type) => (
                    <Badge
                      key={type}
                      variant="secondary"
                      className="text-xs sm:text-sm"
                    >
                      {type}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm sm:text-base">BPPE Approval</Label>
              {isEditing ? (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="bppeApproved"
                    checked={editedProspect.bppeApproved}
                    onCheckedChange={(checked) =>
                      handleChange("bppeApproved", checked === true)
                    }
                  />
                  <Label
                    htmlFor="bppeApproved"
                    className="text-sm sm:text-base text-muted-foreground"
                  >
                    BPPE Approved
                  </Label>
                </div>
              ) : (
                <div className="flex items-center">
                  {prospect.bppeApproved ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500 mr-2" />
                      <Badge
                        variant="outline"
                        className="border-emerald-500/20 bg-emerald-500/10 text-emerald-500 text-xs sm:text-sm"
                      >
                        Approved
                      </Badge>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-destructive mr-2" />
                      <Badge
                        variant="outline"
                        className="border-destructive/20 bg-destructive/10 text-destructive text-xs sm:text-sm"
                      >
                        Not Approved
                      </Badge>
                    </>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
