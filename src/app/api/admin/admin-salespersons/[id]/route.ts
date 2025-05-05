import { NextResponse } from "next/server";
import { SalesPersonModel } from "@/models/SalesPerson";
import { UserModel } from "@/models/User";
import connectToMongoDB from "@/lib/mongoose";
import { adminAuth } from "@/lib/firebase-admin";
import { UpdateSalespersonInput } from "@/types/salesperson";

// Helper function to validate updates
const validateUpdates = (updates: UpdateSalespersonInput) => {
  const errors: string[] = [];

  if (updates.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updates.email)) {
    errors.push("Invalid email format");
  }

  if (updates.phone && !/^\+?[1-9]\d{1,14}$/.test(updates.phone)) {
    errors.push("Invalid phone number format");
  }

  if (
    updates.twilio_number &&
    !/^\+?[1-9]\d{1,14}$/.test(updates.twilio_number)
  ) {
    errors.push("Invalid Twilio number format");
  }

  if (updates.first_name && updates.first_name.trim() === "") {
    errors.push("First name cannot be empty");
  }

  if (updates.last_name && updates.last_name.trim() === "") {
    errors.push("Last name cannot be empty");
  }

  if (updates.status && !["active", "inactive"].includes(updates.status)) {
    errors.push("Invalid status value");
  }

  return errors;
};

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToMongoDB();
    const { id } = await params;

    // Find the salesperson first to get their Firebase UID
    const salesperson = await SalesPersonModel.findById(id);

    if (!salesperson) {
      return NextResponse.json(
        { error: "Salesperson not found" },
        { status: 404 }
      );
    }

    // Delete the user from Firebase Auth
    if (salesperson.firebase_uid) {
      try {
        await adminAuth.deleteUser(salesperson.firebase_uid);
      } catch (firebaseError) {
        console.error("Error deleting Firebase user:", firebaseError);
        // If the Firebase user doesn't exist, we can still proceed with MongoDB deletion
        if ((firebaseError as any)?.errorInfo?.code !== "auth/user-not-found") {
          throw firebaseError;
        }
      }

      // Delete the user from Users collection
      await UserModel.findOneAndDelete({
        firebase_uid: salesperson.firebase_uid,
      });
    }

    // Delete from MongoDB SalesPerson collection
    await SalesPersonModel.findByIdAndDelete(id);

    return NextResponse.json({ message: "Salesperson deleted successfully" });
  } catch (error) {
    console.error("Error deleting salesperson:", error);
    return NextResponse.json(
      { error: "Failed to delete salesperson" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToMongoDB();
    const { id } = await params;
    const updates: UpdateSalespersonInput = await request.json();

    // Validate updates
    const validationErrors = validateUpdates(updates);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: validationErrors.join(", ") },
        { status: 400 }
      );
    }

    // Find the salesperson first to get their current data
    const salesperson = await SalesPersonModel.findById(id);
    if (!salesperson) {
      return NextResponse.json(
        { error: "Salesperson not found" },
        { status: 404 }
      );
    }

    // If email is being updated, we need to update Firebase Auth as well
    if (updates.email && updates.email !== salesperson.email) {
      try {
        await adminAuth.updateUser(salesperson.firebase_uid, {
          email: updates.email,
        });
        // Update the user in Users collection
        await UserModel.findOneAndUpdate(
          { firebase_uid: salesperson.firebase_uid },
          { email: updates.email }
        );
      } catch (firebaseError) {
        console.error("Error updating Firebase user:", firebaseError);
        return NextResponse.json(
          { error: "Failed to update email. It may already be in use." },
          { status: 400 }
        );
      }
    }

    // If password is provided, update it in Firebase Auth
    if (updates.password) {
      try {
        await adminAuth.updateUser(salesperson.firebase_uid, {
          password: updates.password,
        });
      } catch (firebaseError) {
        console.error("Error updating password:", firebaseError);
        return NextResponse.json(
          { error: "Failed to update password" },
          { status: 400 }
        );
      }
    }

    // Update MongoDB document
    // Remove password from updates as it's already handled in Firebase
    const { password, ...mongoUpdates } = updates;

    const updatedSalesperson = await SalesPersonModel.findByIdAndUpdate(
      id,
      { $set: mongoUpdates },
      { new: true, runValidators: true }
    );

    if (!updatedSalesperson) {
      return NextResponse.json(
        { error: "Failed to update salesperson" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: "Salesperson updated successfully",
      data: {
        id: updatedSalesperson._id,
        first_name: updatedSalesperson.first_name,
        last_name: updatedSalesperson.last_name,
        email: updatedSalesperson.email,
        phone: updatedSalesperson.phone,
        status: updatedSalesperson.status,
        role: updatedSalesperson.role,
        joinDate: updatedSalesperson.joinDate,
      },
    });
  } catch (error) {
    console.error("Error updating salesperson:", error);
    return NextResponse.json(
      { error: "Failed to update salesperson" },
      { status: 500 }
    );
  }
}
