export function getFirebaseAuthErrorMessage(error: any): string {
  const rawCode =
    error?.response?.data?.error || error?.code || error?.message || "";
  const code = typeof rawCode === "string" ? rawCode.toLowerCase() : "";

  console.log("Firebase Error Code:", code);

  if (code.includes("auth/user-not-found"))
    return "No account found with this email";
  if (code.includes("auth/wrong-password")) return "Invalid password";
  if (code.includes("auth/invalid-email")) return "Invalid email format";
  if (code.includes("auth/too-many-requests"))
    return "Too many failed attempts. Please try again later";
  if (code.includes("auth/invalid-credential"))
    return "Invalid email or password";
  if (code.includes("not authorized"))
    return "Account not authorized. Please contact administrator";

  return "Sign in failed. Please try again";
}
