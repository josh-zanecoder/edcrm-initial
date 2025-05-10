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
import {
  signInWithPopup,
  GoogleAuthProvider,
  linkWithCredential,
  linkWithPopup,
  fetchSignInMethodsForEmail,
  EmailAuthProvider,
  signInWithEmailAndPassword,
  reauthenticateWithCredential,
  signInWithRedirect,
  onAuthStateChanged,
  getRedirectResult,
} from "firebase/auth";
import { toast } from "react-hot-toast";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Store credentials temporarily
let storedCredentials: { email: string; password: string } | null = null;

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
        // Store credentials before login
        storedCredentials = {
          email: credentials.email,
          password: credentials.password,
        };

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

        // Store user data and token in cookies with secure flags
        const cookieOptions = {
          path: "/",
          maxAge: 86400, // 24 hours
          sameSite: "Strict" as const,
          secure: process.env.NODE_ENV === "production",
        };

        document.cookie = `user=${encodeURIComponent(
          JSON.stringify(userData)
        )}; path=${cookieOptions.path}; max-age=${
          cookieOptions.maxAge
        }; SameSite=${cookieOptions.sameSite}${
          cookieOptions.secure ? "; Secure" : ""
        }`;
        document.cookie = `token=${encodeURIComponent(data.user.token)}; path=${
          cookieOptions.path
        }; max-age=${cookieOptions.maxAge}; SameSite=${cookieOptions.sameSite}${
          cookieOptions.secure ? "; Secure" : ""
        }`;

        // Use setTimeout to ensure state is updated before navigation
        setTimeout(() => {
          router.push(data.user.redirectTo);
        }, 100);
      } catch (error: unknown) {
        // Clear stored credentials on error
        storedCredentials = null;
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
      setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));
      const provider = new GoogleAuthProvider();

      // Use popup for Google sign-in
      const result = await signInWithPopup(auth, provider);
      console.log("Popup result:", result);

      if (result) {
        const user = result.user;

        console.log("Checking user in MongoDB...");
        const response = await axios.post(
          `${window.location.origin}/api/auth/google/check`,
          {
            uid: user.uid,
            email: user.email,
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
            validateStatus: (status) => status < 500,
          }
        );
        console.log("MongoDB check response:", response.data);

        const checkUserData = response.data;
        if (!checkUserData?.exists) {
          console.log("User not found in MongoDB, signing out...");
          await auth.signOut();
          setAuthState({
            user: null,
            isLoading: false,
            error:
              checkUserData?.error ||
              "This email is not registered. Please use your registered email address or contact your administrator.",
          });
          router.push("/login");
          return;
        }

        console.log("Getting Firebase token...");
        const firebaseToken = await user.getIdToken();
        const userData = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email?.split("@")[0] || null,
          firstName: checkUserData.firstName || null,
          lastName: checkUserData.lastName || null,
          token: firebaseToken,
          role: checkUserData.role || "user",
          id: checkUserData.id || null,
          twilioNumber: checkUserData.twilioNumber || null,
          redirectTo:
            checkUserData.role === "admin"
              ? "/admin/dashboard"
              : "/salesperson/dashboard",
          photoURL: user.photoURL || null,
        };
        console.log("User data prepared:", userData);

        // Set state and cookies first
        setAuthState({
          user: userData,
          isLoading: false,
          error: null,
        });

        // Store user data and token in cookies with secure flags
        const cookieOptions = {
          path: "/",
          maxAge: 86400, // 24 hours
          sameSite: "Strict" as const,
          secure: process.env.NODE_ENV === "production",
        };

        document.cookie = `user=${encodeURIComponent(
          JSON.stringify(userData)
        )}; path=${cookieOptions.path}; max-age=${
          cookieOptions.maxAge
        }; SameSite=${cookieOptions.sameSite}${
          cookieOptions.secure ? "; Secure" : ""
        }`;
        document.cookie = `token=${encodeURIComponent(firebaseToken)}; path=${
          cookieOptions.path
        }; max-age=${cookieOptions.maxAge}; SameSite=${cookieOptions.sameSite}${
          cookieOptions.secure ? "; Secure" : ""
        }`;

        // Show success toast
        toast.success("Successfully signed in!");

        console.log("Redirecting to:", userData.redirectTo);
        // Use setTimeout to ensure state is updated before navigation
        setTimeout(() => {
          router.push(userData.redirectTo);
        }, 100);
      }
    } catch (error: any) {
      console.error("Error in Google sign-in:", error);
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
      await axios.post("/api/auth/logout");
      // Clear cookies with secure flags
      const clearCookieOptions = {
        path: "/",
        expires: "Thu, 01 Jan 1970 00:00:00 GMT",
        sameSite: "Strict" as const,
        secure: process.env.NODE_ENV === "production",
      };

      document.cookie = `user=; path=${clearCookieOptions.path}; expires=${
        clearCookieOptions.expires
      }; SameSite=${clearCookieOptions.sameSite}${
        clearCookieOptions.secure ? "; Secure" : ""
      }`;
      document.cookie = `token=; path=${clearCookieOptions.path}; expires=${
        clearCookieOptions.expires
      }; SameSite=${clearCookieOptions.sameSite}${
        clearCookieOptions.secure ? "; Secure" : ""
      }`;
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

      const response = await axios.post("/api/auth/verify", {
        token,
        user,
      });

      if (response.status !== 200) {
        const errorData = response.data;

        // If token is expired, try to refresh it
        if (errorData.error === "Token has expired") {
          // Get a new token from Firebase
          const newToken = await auth.currentUser?.getIdToken(true);
          if (newToken) {
            // Update the token in cookies
            document.cookie = `token=${newToken}; path=/; max-age=86400; SameSite=Strict`;

            // Retry verification with new token
            const retryResponse = await axios.post("/api/auth/verify", {
              token: newToken,
              user,
            });

            if (retryResponse.status !== 200) {
              throw new Error("Failed to refresh token");
            }

            const retryData = retryResponse.data;
            return retryData.user;
          }
        }

        throw new Error(errorData.error || "Session invalid");
      }

      const data = response.data;

      if (!data.valid || !data.user) {
        throw new Error("Invalid session data");
      }

      // Update cookies with fresh data
      const cookieOptions = {
        path: "/",
        maxAge: 86400, // 24 hours
        sameSite: "Strict" as const,
        secure: process.env.NODE_ENV === "production",
      };

      document.cookie = `user=${encodeURIComponent(
        JSON.stringify(data.user)
      )}; path=${cookieOptions.path}; max-age=${
        cookieOptions.maxAge
      }; SameSite=${cookieOptions.sameSite}${
        cookieOptions.secure ? "; Secure" : ""
      }`;
      document.cookie = `token=${encodeURIComponent(data.user.token)}; path=${
        cookieOptions.path
      }; max-age=${cookieOptions.maxAge}; SameSite=${cookieOptions.sameSite}${
        cookieOptions.secure ? "; Secure" : ""
      }`;

      return data.user;
    } catch (error) {
      // Only clear cookies if it's not a token refresh attempt
      if (!(error instanceof Error && error.message === "Token has expired")) {
        // Clear cookies with secure flags
        const clearCookieOptions = {
          path: "/",
          expires: "Thu, 01 Jan 1970 00:00:00 GMT",
          sameSite: "Strict" as const,
          secure: process.env.NODE_ENV === "production",
        };

        document.cookie = `user=; path=${clearCookieOptions.path}; expires=${
          clearCookieOptions.expires
        }; SameSite=${clearCookieOptions.sameSite}${
          clearCookieOptions.secure ? "; Secure" : ""
        }`;
        document.cookie = `token=; path=${clearCookieOptions.path}; expires=${
          clearCookieOptions.expires
        }; SameSite=${clearCookieOptions.sameSite}${
          clearCookieOptions.secure ? "; Secure" : ""
        }`;
      }
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
          // Only redirect to login if we're not already on the login page
          if (!window.location.pathname.includes("/login")) {
            router.push("/login");
          }
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
          // Only redirect to login if we're not already on the login page
          if (!window.location.pathname.includes("/login")) {
            router.push("/login");
          }
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
