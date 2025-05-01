import { Button } from "@/components/ui/button";
import { useMembershipVerification } from "@/hooks/useMembershipVerification";
import { LoginWithEthereumButton } from "@/components/auth/LoginWithEthereumButton";
import { Loader2, LockKeyhole, ShieldCheck, ShieldX } from "lucide-react";
import { useUser, useSmartAccountClient } from "@account-kit/react";

interface MembershipSectionProps {
  className?: string;
}

const MEMBERSHIP_NAMES = {
  "0xf7c4cd399395d80f9d61fde833849106775269c6": "Creative Pass",
  "0x13b818daf7016b302383737ba60c3a39fef231cf": "Creative Pass Plus",
  "0x9c3744c96200a52d05a630d4aec0db707d7509be": "Creative Pass Pro",
} as const;

export function MembershipSection({ className }: MembershipSectionProps) {
  const { isVerified, hasMembership, isLoading, error, membershipDetails } =
    useMembershipVerification();
  const user = useUser();
  const { client: accountKitClient } = useSmartAccountClient({});

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-2">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // If using Account Kit but no SCA yet, show buy membership
  if (user && !user?.type && !accountKitClient?.account?.address) {
    return (
      <div className="px-2 py-2 space-y-2">
        <div className="flex items-center gap-2 text-sm text-yellow-500">
          <LockKeyhole className="h-4 w-4" />
          <span>No active membership</span>
        </div>
        <Button
          className="w-full bg-black hover:bg-gray-900 text-white"
          onClick={() => {
            window.location.href = "https://memberships.creativeplatform.xyz";
          }}
        >
          Get Membership
        </Button>
      </div>
    );
  }

  if (!isVerified) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ShieldX className="h-4 w-4" />
          <span>Not verified</span>
        </div>
        <LoginWithEthereumButton />
      </div>
    );
  }

  if (!hasMembership) {
    return (
      <div className="px-2 py-2 space-y-2">
        <div className="flex items-center gap-2 text-sm text-yellow-500">
          <LockKeyhole className="h-4 w-4" />
          <span>No active membership</span>
        </div>
        <Button
          className="w-full bg-black hover:bg-gray-900 text-white"
          onClick={() => {
            window.location.href = "https://memberships.creativeplatform.xyz";
          }}
        >
          Get Membership
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2 text-sm text-emerald-500">
        <ShieldCheck className="h-4 w-4" />
        <span>Verified Member</span>
      </div>
      {membershipDetails && membershipDetails.length > 0 && (
        <div className="space-y-2">
          {membershipDetails
            .filter(({ balance }) => balance > BigInt(0))
            .map(({ lockAddress, balance }) => (
              <div
                key={lockAddress}
                className="flex items-center justify-between text-xs"
              >
                <span className="text-muted-foreground">
                  {
                    MEMBERSHIP_NAMES[
                      lockAddress as keyof typeof MEMBERSHIP_NAMES
                    ]
                  }
                </span>
                <span className="font-medium">
                  {balance.toString()}{" "}
                  {balance === BigInt(1) ? "pass" : "passes"}
                </span>
              </div>
            ))}
        </div>
      )}
      <div className="text-xs text-muted-foreground">
        Access to premium features unlocked
      </div>
    </div>
  );
}
