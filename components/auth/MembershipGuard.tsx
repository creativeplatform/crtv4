"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMembershipVerification } from "@/lib/hooks/unlock/useMembershipVerification";
import { Loader2 } from "lucide-react";
import { createContext, useContext } from "react";
import type { MembershipStatus } from "@/lib/hooks/unlock/useMembershipVerification";

interface MembershipGuardProps {
  children: React.ReactNode;
}

export const MembershipContext = createContext<MembershipStatus | null>(null);

export function MembershipGuard({ children }: MembershipGuardProps) {
  const router = useRouter();
  const membership = useMembershipVerification();
  const { isVerified, hasMembership, isLoading } = membership;

  useEffect(() => {
    console.log("MembershipGuard:", membership);
    if (!isLoading && (!isVerified || !hasMembership)) {
      router.push("/");
    }
  }, [isLoading, isVerified, hasMembership, router, membership]);

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

  return (
    <MembershipContext.Provider value={membership}>
      {children}
    </MembershipContext.Provider>
  );
}
