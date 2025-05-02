import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useMembershipVerification,
  type MembershipDetails,
} from "../../lib/hooks/unlock/useMembershipVerification";
import { LoginWithEthereumButton } from "@/components/auth/LoginWithEthereumButton";
import { LockKeyhole, ShieldCheck, ShieldX, AlertTriangle } from "lucide-react";
import {
  LOCK_ADDRESSES,
  type LockAddressValue,
} from "../../lib/sdk/unlock/services";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface MembershipSectionProps {
  className?: string;
}

const MEMBERSHIP_NAMES: Record<LockAddressValue, string> = {
  [LOCK_ADDRESSES.BASE_CREATIVE_PASS]: "Creative Pass",
  [LOCK_ADDRESSES.BASE_CREATIVE_PASS_2]: "Creative Pass Plus",
  [LOCK_ADDRESSES.BASE_CREATIVE_PASS_3]: "Creative Pass Pro",
} as const;

const ERROR_MESSAGES: Record<string, string> = {
  LOCK_NOT_FOUND: "Unable to verify membership. Please try again later.",
  BALANCE_CHECK_ERROR:
    "Unable to check membership status. Please try again later.",
  MEMBERSHIP_CHECK_ERROR: "Error verifying membership. Please try again later.",
  INVALID_ADDRESS: "Invalid wallet address. Please reconnect your wallet.",
  NO_VALID_ADDRESS: "Please connect your wallet to verify membership.",
  PROVIDER_ERROR: "Network connection error. Please try again later.",
  LOCK_FETCH_ERROR:
    "Unable to fetch membership details. Basic verification will continue.",
  DEFAULT: "An error occurred while verifying membership.",
};

export function MembershipSection({ className }: MembershipSectionProps) {
  const { isVerified, hasMembership, isLoading, error, membershipDetails } =
    useMembershipVerification();

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

  if (error) {
    const errorMessage = ERROR_MESSAGES[error.code] || ERROR_MESSAGES.DEFAULT;
    return (
      <div className="p-4 space-y-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
        <LoginWithEthereumButton />
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
            window.open("https://memberships.creativeplatform.xyz", "_blank");
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
            .filter(({ isValid }: MembershipDetails) => isValid)
            .map(({ name, address, lock }: MembershipDetails) => (
              <div
                key={address}
                className="flex items-center justify-between text-xs"
              >
                <span className="text-muted-foreground">
                  {MEMBERSHIP_NAMES[address]}
                </span>
                <span className="font-medium">
                  {lock?.name || "Active"}
                  {lock?.expirationDuration && (
                    <span className="ml-1 text-muted-foreground">
                      (Expires:{" "}
                      {new Date(
                        lock.expirationDuration * 1000
                      ).toLocaleDateString()}
                      )
                    </span>
                  )}
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
