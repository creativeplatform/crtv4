"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMembershipVerification } from "@/lib/hooks/useMembershipVerification";
import { Loader2 } from "lucide-react";

interface MembershipGuardProps {
  children: React.ReactNode;
}

export function MembershipGuard({ children }: MembershipGuardProps) {
  const router = useRouter();
  const { isVerified, hasMembership, isLoading } = useMembershipVerification();

  useEffect(() => {
    if (!isLoading && (!isVerified || !hasMembership)) {
      router.push("/");
    }
  }, [isLoading, isVerified, hasMembership, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isVerified || !hasMembership) {
    return null;
  }

  return <>{children}</>;
}
