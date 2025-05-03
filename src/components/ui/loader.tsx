// components/ui/loader.tsx
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface LoaderProps {
  size?: "sm" | "md" | "lg";
  fullPage?: boolean;
  message?: string;
}

export default function Loader({
  size = "md",
  fullPage = true,
  message,
}: LoaderProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    return () => setIsVisible(false);
  }, []);

  const sizeClasses = {
    sm: "h-5 w-5",
    md: "h-8 w-8 sm:h-10 sm:w-10",
    lg: "h-10 w-10 sm:h-12 sm:w-12",
  };

  const LoaderContent = () => (
    <>
      <Loader2 className={cn("animate-spin text-primary", sizeClasses[size])} />
      {message && (
        <p className="mt-3 text-sm sm:text-base text-muted-foreground animate-in fade-in slide-in-from-bottom-2 duration-300">
          {message}
        </p>
      )}
    </>
  );

  if (fullPage) {
    return (
      <div
        className={cn(
          "fixed inset-0 z-100 flex flex-col items-center justify-center bg-background/70 backdrop-blur-sm p-6",
          "animate-in fade-in zoom-in-95 duration-300",
          "data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95",
          !isVisible && "opacity-0"
        )}
        data-state={isVisible ? "open" : "closed"}
      >
        <img
          src="/images/loader-logo.gif"
          alt="logo"
          className={cn(
            "w-[80%] sm:w-[25%] md:w-[20%] lg:w-[15%] max-w-[300px]",
            "animate-in fade-in zoom-in-95 duration-500",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95"
          )}
          data-state={isVisible ? "open" : "closed"}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-4 sm:p-6",
        "animate-in fade-in zoom-in-95 duration-300",
        "data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95",
        !isVisible && "opacity-0"
      )}
      data-state={isVisible ? "open" : "closed"}
    >
      <img
        src="/images/loader-logo.gif"
        alt="logo"
        className={cn(
          "w-[80%] sm:w-[25%] md:w-[20%] lg:w-[15%] max-w-[300px]",
          "animate-in fade-in zoom-in-95 duration-500",
          "data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95"
        )}
        data-state={isVisible ? "open" : "closed"}
      />
    </div>
  );
}
