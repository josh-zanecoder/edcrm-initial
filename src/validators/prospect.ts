import { z } from "zod";
import { CollegeType } from "@/types/prospect";

// User schema
export const userSchema = z.object({
  _id: z.string().regex(/^[a-f\d]{24}$/i, "Invalid Mongo ObjectId"),
  id: z.string(),
  email: z.string().email(),
  role: z.string(),
});

// Address schema
export const addressSchema = z.object({
  city: z.string(),
  state: z.string(),
  zip: z.string(),
});

// Prospect schema with additional validations
export const prospectSchema = z.object({
  collegeName: z.string(),
  phone: z
    .string()
    .regex(/^\d{10}$/, "Phone number must be exactly 10 digits")
    .refine((val) => val.length === 10, {
      message: "Phone number must be at least 10 digits",
    }),
  email: z
    .string()
    .email("Invalid email format")
    .refine((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), {
      message: "Invalid email format",
    }),
  address: addressSchema,
  county: z.string(),
  website: z
    .string()
    .url("Invalid URL format")
    .refine((url) => url.startsWith("http://") || url.startsWith("https://"), {
      message: "Website must start with http:// or https://",
    }),
  collegeTypes: z
    .array(z.enum([...(Object.values(CollegeType) as [string, ...string[]])]))
    .min(1, "At least one college type must be selected"),
  bppeApproved: z.boolean().default(false),
  status: z.enum([
    "New",
    "Contacted",
    "Qualified",
    "Proposal",
    "Negotiation",
    "Closed",
  ]),
  lastContact: z.coerce.date(),
  addedBy: userSchema,
  assignedTo: userSchema,
});
