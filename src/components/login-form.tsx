import { cn } from "@/lib/utils";
import { BookOpen, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import React from "react";
import { Loader2 } from "lucide-react";

interface LoginFormProps extends React.ComponentProps<"div"> {
  email: string;
  password: string;
  isLoading: boolean;
  showPassword: boolean;
  onEmailChange: (email: string) => void;
  onPasswordChange: (password: string) => void;
  onShowPasswordToggle: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onPasswordReset: (e: React.MouseEvent) => void;
  isResettingPassword: boolean;
  isForgotPassword: boolean;
  setIsForgotPassword: (isForgotPassword: boolean) => void;
}

export function LoginForm({
  className,
  email,
  password,
  isLoading,
  showPassword,
  onEmailChange,
  onPasswordChange,
  onShowPasswordToggle,
  onSubmit,
  onPasswordReset,
  isResettingPassword,
  isForgotPassword,
  setIsForgotPassword,
  ...props
}: LoginFormProps) {
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form onSubmit={onSubmit} className="overflow-hidden">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2">
            <a
              href="#"
              className="flex flex-col items-center gap-2 font-medium"
            >
              <div className="flex size-8 items-center justify-center rounded-md">
                <BookOpen className="size-6" />
              </div>
              <span className="sr-only">Edtracts CRM</span>
            </a>
            <h1 className="text-xl font-bold">Welcome to Edtracts CRM</h1>
          </div>
          <div className="flex flex-col gap-6">
            <div className="grid gap-3">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="text"
                placeholder="m@example.com"
                value={email}
                onChange={(e) => onEmailChange(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="relative">
              <div
                className={cn(
                  "transition-all duration-300 transform",
                  !isForgotPassword
                    ? "translate-x-0"
                    : "-translate-x-full opacity-0 absolute inset-0"
                )}
              >
                {!isForgotPassword && (
                  <div className="grid gap-3">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => onPasswordChange(e.target.value)}
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        onClick={onShowPasswordToggle}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div
                className={cn(
                  "transition-all duration-300 transform",
                  isForgotPassword
                    ? "translate-x-0"
                    : "translate-x-full opacity-0 absolute inset-0"
                )}
              >
                {isForgotPassword && (
                  <div className="text-sm text-muted-foreground mb-3">
                    Enter your email address and we'll send you a link to reset
                    your password.
                  </div>
                )}
              </div>
            </div>
            <div className="relative">
              <div
                className={cn(
                  "transition-all duration-300 transform",
                  !isForgotPassword
                    ? "translate-x-0"
                    : "-translate-x-full opacity-0 absolute inset-0"
                )}
              >
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign in"
                  )}
                </Button>
              </div>
              <div
                className={cn(
                  "transition-all duration-300 transform",
                  isForgotPassword
                    ? "translate-x-0"
                    : "translate-x-full opacity-0 absolute inset-0"
                )}
              >
                <Button
                  type="submit"
                  variant="default"
                  className="w-full"
                  onClick={onPasswordReset}
                  disabled={isResettingPassword}
                >
                  {isResettingPassword ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending reset link...
                    </>
                  ) : (
                    "Reset Password"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </form>
      <div className="text-center text-sm">
        <button
          onClick={() => setIsForgotPassword(!isForgotPassword)}
          className="dark:text-zinc-300 dark:hover:text-zinc-400 text-zinc-700 hover:text-zinc-500 transition-colors duration-200 disabled:opacity-50"
        >
          {!isForgotPassword ? "Forgot your password?" : "Back to login"}
        </button>
      </div>
      <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </div>
    </div>
  );
}
