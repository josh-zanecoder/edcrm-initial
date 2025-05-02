// components/ui/loader.tsx
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-10 w-10",
  };

  const LoaderContent = () => (
    <>
      <Loader2 className={cn("animate-spin text-primary", sizeClasses[size])} />
      {message && (
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
      )}
    </>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-100 flex flex-col items-center justify-center bg-background/70 backdrop-blur-sm">
        <LoaderContent />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <LoaderContent />
    </div>
  );
}
