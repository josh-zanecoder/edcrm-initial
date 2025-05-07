import { cn } from "@/lib/utils";
import { BookOpen, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import React, { useEffect, useState } from "react";
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
  onGoogleSignIn?: () => void;
  isGoogleLoading?: boolean;
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
  onGoogleSignIn,
  isGoogleLoading,
  ...props
}: LoginFormProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={cn("flex flex-col gap-4", className)} {...props}>
      <form onSubmit={onSubmit} className="overflow-hidden">
        <div className="flex flex-col gap-4">
          <div
            className={cn(
              "flex flex-col items-center gap-2",
              "[transform:translateY(20px)] opacity-0",
              "transition-[transform,opacity] duration-700 ease-out",
              show && "!transform-none !opacity-100"
            )}
            style={{ transitionDelay: "150ms" }}
          >
            <a
              href="#"
              className="flex flex-col items-center gap-2 font-medium"
            >
              <div className="flex size-8 items-center justify-center rounded-md">
                <BookOpen className="size-6" />
              </div>
              <span className="sr-only">Allure IMA CRM</span>
            </a>
            <h1 className="text-xl font-bold">Welcome to Allure IMA CRM</h1>
          </div>
          <div className="flex flex-col gap-4">
            <div
              className={cn(
                "grid gap-2",
                "[transform:translateY(20px)] opacity-0",
                "transition-[transform,opacity] duration-700 ease-out",
                show && "!transform-none !opacity-100"
              )}
              style={{ transitionDelay: "300ms" }}
            >
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
            <div
              className={cn(
                "[transform:translateY(20px)] opacity-0",
                "transition-[transform,opacity,height] duration-700 ease-out",
                show && "!transform-none !opacity-100",
                isForgotPassword ? "h-[48px]" : "h-[90px]"
              )}
              style={{ transitionDelay: "450ms" }}
            >
              <div className="relative h-full">
                <div
                  className={cn(
                    "absolute inset-0 transition-all duration-500 ease-in-out",
                    !isForgotPassword
                      ? "translate-x-0 opacity-100"
                      : "-translate-x-full opacity-0"
                  )}
                >
                  {!isForgotPassword && (
                    <div className="grid gap-2">
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
                    "absolute inset-0 transition-all duration-500 ease-in-out",
                    isForgotPassword
                      ? "translate-x-0 opacity-100"
                      : "translate-x-full opacity-0"
                  )}
                >
                  {isForgotPassword && (
                    <div className="text-sm text-muted-foreground">
                      Enter your email address and we'll send you a link to
                      reset your password.
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div
              className={cn(
                !isForgotPassword
                  ? "relative min-h-[120px]"
                  : "relative !min-h-[0px]",
                "[transform:translateY(20px)] opacity-0",
                "transition-[transform,opacity] duration-700 ease-out",
                show && "!transform-none !opacity-100"
              )}
              style={{ transitionDelay: "600ms" }}
            >
              <div
                className={cn(
                  "transition-all duration-500 ease-in-out",
                  !isForgotPassword
                    ? "translate-x-0 opacity-100"
                    : "-translate-x-full opacity-0"
                )}
              >
                <div className="flex flex-col space-y-4">
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

                  <div className="relative my-2">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        Or continue with
                      </span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={onGoogleSignIn}
                    disabled={isGoogleLoading}
                  >
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    Sign in with Google
                  </Button>
                </div>
              </div>
              <div
                className={cn(
                  "absolute inset-0 transition-all duration-500 ease-in-out",
                  isForgotPassword
                    ? "translate-x-0 opacity-100"
                    : "translate-x-full opacity-0"
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
      <div
        className={cn(
          "text-center text-sm",
          "[transform:translateY(20px)] opacity-0",
          "transition-[transform,opacity] duration-700 ease-out",
          show && "!transform-none !opacity-100"
        )}
        style={{ transitionDelay: "750ms" }}
      >
        <button
          onClick={() => setIsForgotPassword(!isForgotPassword)}
          className="dark:text-zinc-300 dark:hover:text-zinc-400 text-zinc-700 hover:text-zinc-500 transition-colors duration-200 disabled:opacity-50"
        >
          {!isForgotPassword ? "Forgot your password?" : "Back to login"}
        </button>
      </div>
      <div
        className={cn(
          "text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4",
          "[transform:translateY(20px)] opacity-0",
          "transition-[transform,opacity] duration-700 ease-out",
          show && "!transform-none !opacity-100"
        )}
        style={{ transitionDelay: "900ms" }}
      >
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </div>
    </div>
  );
}
