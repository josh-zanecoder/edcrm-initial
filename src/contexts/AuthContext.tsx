"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { AuthState, AuthContextType, LoginCredentials } from "@/types/auth";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import axios from "axios";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    error: null,
  });
  const router = useRouter();

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      try {
        setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

        const response = await axios.post("/api/auth/login", credentials);

        if (response.status !== 200) {
          throw new Error(response.data.error || "Authentication failed");
        }

        const data = response.data;

        if (!data.user) {
          throw new Error("Invalid response format");
        }

        const userData = {
          uid: data.user.uid,
          email: data.user.email,
          displayName: data.user.displayName,
          firstName: data.user.firstName,
          lastName: data.user.lastName,
          token: data.user.token,
          role: data.user.role,
          id: data.user.id,
          twilioNumber: data.user.twilioNumber,
          redirectTo: data.user.redirectTo,
        };

        // Set state before navigation
        setAuthState({
          user: userData,
          isLoading: false,
          error: null,
        });

        // Store user data and token in cookies
        document.cookie = `user=${JSON.stringify(
          userData
        )}; path=/; max-age=86400; SameSite=Strict`; // 24 hours
        document.cookie = `token=${data.user.token}; path=/; max-age=86400; SameSite=Strict`; // 24 hours

        // Use setTimeout to ensure state is updated before navigation
        setTimeout(() => {
          router.push(data.user.redirectTo);
        }, 100);
      } catch (error: unknown) {
        setAuthState({
          user: null,
          isLoading: false,
          error: error instanceof Error ? error.message : "Failed to login",
        });
        throw error;
      }
    },
    [router]
  );

  const google = useCallback(async () => {
    try {
      console.log("Starting Google sign-in process...");
      setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

      const provider = new GoogleAuthProvider();
      console.log("Google provider initialized");

      let result;
      try {
        result = await signInWithPopup(auth, provider);
      } catch (error: any) {
        if (error?.code === "auth/popup-closed-by-user") {
          setAuthState({
            user: null,
            isLoading: false,
            error: null,
          });
          return Promise.reject({ code: "auth/popup-closed-by-user" });
        }
        throw error;
      }

      console.log("Google popup result:", {
        email: result.user.email,
        uid: result.user.uid,
      });

      try {
        console.log("Checking user in MongoDB:", result.user.uid);
        const response = await axios.post(
          `${window.location.origin}/api/auth/google/check`,
          {
            uid: result.user.uid,
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
            validateStatus: (status) => status < 500, // Accept all responses except 500s
          }
        );
        console.log("MongoDB check response:", response.data);

        const checkUserResponse = response.data;

        if (!checkUserResponse?.exists) {
          await auth.signOut();
          setAuthState({
            user: null,
            isLoading: false,
            error:
              checkUserResponse?.error ||
              "This email is not registered. Please use your registered email address or contact your administrator.",
          });
          router.push("/login");
          return Promise.reject(
            new Error(
              checkUserResponse?.error ||
                "This email is not registered. Please use your registered email address or contact your administrator."
            )
          );
        }

        console.log("Getting Firebase token");
        const firebaseToken = await result.user.getIdToken();
        console.log("Firebase token received");

        const userData = {
          uid: result.user.uid,
          email: result.user.email,
          displayName:
            result.user.displayName || result.user.email?.split("@")[0] || null,
          firstName: checkUserResponse.firstName || null,
          lastName: checkUserResponse.lastName || null,
          token: firebaseToken,
          role: checkUserResponse.role || "user",
          id: checkUserResponse.id || null,
          twilioNumber: checkUserResponse.twilioNumber || null,
          redirectTo:
            checkUserResponse.role === "admin"
              ? "/admin/dashboard"
              : "/salesperson/dashboard",
        };

        setAuthState({
          user: userData,
          isLoading: false,
          error: null,
        });

        document.cookie = `user=${JSON.stringify(
          userData
        )}; path=/; max-age=86400; SameSite=Strict`;
        document.cookie = `token=${firebaseToken}; path=/; max-age=86400; SameSite=Strict`;

        setTimeout(() => {
          router.push(userData.redirectTo);
        }, 100);
      } catch (error) {
        console.error("Error in MongoDB check or token generation:", error);
        await auth.signOut();
        if (axios.isAxiosError(error) && error.response) {
          setAuthState({
            user: null,
            isLoading: false,
            error: error.response.data.error || "Authentication failed",
          });
        } else {
          setAuthState({
            user: null,
            isLoading: false,
            error: "An unexpected error occurred",
          });
        }
        router.push("/login");
        return Promise.reject(error);
      }
    } catch (error: unknown) {
      console.error("Google sign-in error:", error);
      setAuthState({
        user: null,
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to login with Google",
      });
      router.push("/login");
      return Promise.reject(error);
    }
  }, [router]);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      // Clear cookies
      document.cookie = "user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      setAuthState({
        user: null,
        isLoading: false,
        error: null,
      });
      router.push("/login");
    } catch (error: unknown) {
      setAuthState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Failed to logout",
      }));
    }
  }, [router]);

  const verifySession = useCallback(async () => {
    try {
      const userCookie = document.cookie
        .split("; ")
        .find((row) => row.startsWith("user="));
      const tokenCookie = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="));

      if (!userCookie || !tokenCookie) {
        throw new Error("No session found");
      }

      const user = JSON.parse(decodeURIComponent(userCookie.split("=")[1]));
      const token = decodeURIComponent(tokenCookie.split("=")[1]);

      if (!user || !token) {
        throw new Error("Invalid session data");
      }

      const response = await fetch("/api/auth/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, user }),
      });

      if (!response.ok) {
        const errorData = await response.json();

        // If token is expired, try to refresh it
        if (errorData.error === "Token has expired") {
          // Get a new token from Firebase
          const newToken = await auth.currentUser?.getIdToken(true);
          if (newToken) {
            // Update the token in cookies
            document.cookie = `token=${newToken}; path=/; max-age=86400; SameSite=Strict`;

            // Retry verification with new token
            const retryResponse = await fetch("/api/auth/verify", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ token: newToken, user }),
            });

            if (!retryResponse.ok) {
              throw new Error("Failed to refresh token");
            }

            const retryData = await retryResponse.json();
            return retryData.user;
          }
        }

        throw new Error(errorData.error || "Session invalid");
      }

      const data = await response.json();

      if (!data.valid || !data.user) {
        throw new Error("Invalid session data");
      }

      // Update cookies with fresh data
      document.cookie = `user=${JSON.stringify(
        data.user
      )}; path=/; max-age=86400; SameSite=Strict`;
      document.cookie = `token=${data.user.token}; path=/; max-age=86400; SameSite=Strict`;

      return data.user;
    } catch (error) {
      // Clear cookies on error
      document.cookie = "user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      throw error;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      try {
        const verifiedUser = await verifySession();
        if (verifiedUser && isMounted) {
          setAuthState({
            user: verifiedUser,
            isLoading: false,
            error: null,
          });
        } else if (isMounted) {
          setAuthState({
            user: null,
            isLoading: false,
            error: null,
          });
          router.push("/login");
        }
      } catch (error) {
        if (isMounted) {
          setAuthState({
            user: null,
            isLoading: false,
            error:
              error instanceof Error
                ? error.message
                : "Failed to restore session",
          });
          router.push("/login");
        }
      }
    };

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [verifySession, router]);

  // Prevent flash of loading state
  // if (authState.isLoading) {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center">
  //       <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
  //     </div>
  //   );
  // }

  const resetPassword = async (email: string) => {
    return sendPasswordResetEmail(auth, email, {
      url: `${window.location.origin}/login`, // Redirect URL after password reset
    });
  };

  const value = {
    ...authState,
    login,
    logout,
    google,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
