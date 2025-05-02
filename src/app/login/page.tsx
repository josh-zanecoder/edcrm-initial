"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { LoginForm } from "@/components/login-form";
import { toast } from "sonner";
import { getFirebaseAuthErrorMessage } from "@/lib/firebaseErrors";
import { ThemeToggle } from "@/components/theme-toggle";
import Loader from "@/components/ui/loader";
// import toast from "react-hot-toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const router = useRouter();
  const { login, resetPassword } = useAuth();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Add password reset handler
  const handlePasswordReset = async (e: React.MouseEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error("Please enter your email address");
      return;
    } else if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    try {
      setIsResettingPassword(true);
      await resetPassword(email);
      toast.success("Password reset link sent to your email");
      setIsForgotPassword(false);
    } catch (error: any) {
      if (error?.message?.includes("auth/user-not-found")) {
        toast.error("No account found with this email");
      } else {
        toast.error("Failed to send reset link. Please try again");
        console.error("Password reset error:", error);
      }
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!email || !password) {
        toast.error("Please enter both email and password");
        return;
      } else if (!emailRegex.test(email)) {
        toast.error("Please enter a valid email address");
        return;
      }
      await login({ email, password });
      setIsRedirecting(true);
      toast.success("Successfully signed in!");
    } catch (error: any) {
      console.log(error);
      const message = getFirebaseAuthErrorMessage(error);
      toast.error(message);
      console.log("Login error:", message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="relative flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
        {isRedirecting && <Loader message="Redirecting..." size="md" />}
        {/* Dark Mode Toggle */}
        <div className="absolute right-20 top-12 z-10">
          <ThemeToggle />
        </div>

        {/* Background Patterns */}
        <div className="absolute inset-0">
          {/* Small dots */}
          <div className="absolute inset-0 bg-[radial-gradient(#64748b_1px,transparent_1px)] dark:bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-[0.15] dark:opacity-5" />
          {/* Medium dots */}
          <div className="absolute inset-0 bg-[radial-gradient(#64748b_1.5px,transparent_1.5px)] dark:bg-[radial-gradient(#e5e7eb_1.5px,transparent_1.5px)] [background-size:32px_32px] opacity-[0.1] dark:opacity-5" />
          {/* Large dots */}
          <div className="absolute inset-0 bg-[radial-gradient(#64748b_2px,transparent_2px)] dark:bg-[radial-gradient(#e5e7eb_2px,transparent_2px)] [background-size:48px_48px] opacity-[0.08] dark:opacity-5" />
        </div>

        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-sky-100/50 dark:bg-blue-500/20 blur-3xl" />
          <div className="absolute -right-20 -bottom-20 h-72 w-72 rounded-full bg-violet-100/50 dark:bg-indigo-500/20 blur-3xl" />
          <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-rose-100/50 dark:bg-purple-500/20 blur-3xl" />
        </div>

        {/* Main Content */}
        <div className="relative w-full max-w-sm rounded-lg border bg-white/80 p-8 shadow-lg backdrop-blur-sm dark:bg-card/60">
          <LoginForm
            email={email}
            password={password}
            isLoading={isLoading}
            showPassword={showPassword}
            onEmailChange={setEmail}
            onPasswordChange={setPassword}
            onShowPasswordToggle={() => setShowPassword(!showPassword)}
            onSubmit={handleSubmit}
            onPasswordReset={handlePasswordReset}
            isResettingPassword={isResettingPassword}
            isForgotPassword={isForgotPassword}
            setIsForgotPassword={setIsForgotPassword}
          />
        </div>
      </div>
    </>
  );
}
