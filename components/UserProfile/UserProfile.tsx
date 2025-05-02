"use client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NextPage } from "next";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useContext } from "react";
import { base } from "viem/chains";
import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  type PublicClient,
  type WalletClient,
  type Account,
} from "viem";
import { useUser } from "@account-kit/react";
import { userToAccount } from "@/lib/types/account";
import { ListUploadedAssets } from "@/components/UserProfile/list-uploaded-assets/ListUploadedAssets";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import MemberCard from "./MemberCard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FaExclamationTriangle } from "react-icons/fa";
import { Button } from "../ui/button";
import { useProfile } from "./useProfile";
import {
  MembershipGuard,
  MembershipContext,
} from "@/components/auth/MembershipGuard";
import type { MembershipDetails } from "@/lib/hooks/unlock/useMembershipVerification";

function useServerMembership(address?: string) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address) return;
    setLoading(true);
    fetch("/api/membership", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address }),
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.error) setError(res.error);
        else setData(res.memberships);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [address]);

  return { data, loading, error };
}

function ProfilePageGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const activeAccount = useUser();
  const account = userToAccount(activeAccount);

  useEffect(() => {
    if (!account?.address && typeof window !== "undefined") router.replace("/");
  }, [account?.address, router]);

  if (!account?.address) return null;
  return <>{children}</>;
}

const ProfilePage: NextPage = () => {
  const { user } = useParams();
  const [transferAddress, setTransferAddress] = useState("");
  const [lendingAddress, setLendingAddress] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const activeAccount = useUser();
  const account = userToAccount(activeAccount);

  const {
    memberData,
    nftData,
    balance,
    points,
    isLoading,
    handleRenewMembership,
    handleCancelMembership,
    ownedIds,
  } = useProfile(account);

  const membership = useContext(MembershipContext);
  const {
    isLoading: membershipLoading,
    error: membershipError,
    membershipDetails,
    walletAddress,
    walletType,
  } = membership || {};

  const {
    data: memberships,
    loading,
    error: serverMembershipError,
  } = useServerMembership(walletAddress);

  // Find the first valid membership
  const validMembership = (
    membershipDetails as MembershipDetails[] | undefined
  )?.find((m: MembershipDetails) => m.isValid);

  // Setup Viem clients
  const publicClient = createPublicClient({
    chain: base,
    transport: http(
      `https://base-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`
    ),
  }) as PublicClient;

  const walletClient =
    typeof window !== "undefined"
      ? (createWalletClient({
          chain: base,
          transport: custom(window.ethereum),
        }) as WalletClient)
      : null;

  const contractAddress = "0xf7c4cd399395d80f9d61fde833849106775269c6";

  const [result, setResult] = useState<any>(null);

  if (loading) return <div>Loading...</div>;
  if (serverMembershipError)
    return <div className="text-destructive">{serverMembershipError}</div>;
  if (!memberships) return <div>No membership data</div>;

  return (
    <ProfilePageGuard>
      <MembershipGuard>
        <div className="container mx-auto px-4 py-8">
          <Tabs defaultValue="Membership" className="w-full">
            <TabsList className="flex h-10 items-center justify-start space-x-1 rounded-lg bg-muted p-1">
              <TabsTrigger
                value="Membership"
                className="flex-shrink-0 rounded-t-lg px-4 py-2 text-sm font-medium"
              >
                Membership
              </TabsTrigger>
              <TabsTrigger
                value="Uploads"
                className="flex-shrink-0 rounded-t-lg px-4 py-2 text-sm font-medium"
              >
                Uploads
              </TabsTrigger>
              <TabsTrigger
                value="Revenue"
                className="flex-shrink-0 rounded-t-lg px-4 py-2 text-sm font-medium"
              >
                Revenue
              </TabsTrigger>
            </TabsList>

            <div className="mt-6">
              <TabsContent value="Membership">
                <Card>
                  <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl">Membership</CardTitle>
                    <CardDescription>
                      Manage your membership status and details
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {membershipLoading && <div>Loading membership...</div>}
                    {membershipError && (
                      <div className="text-destructive">
                        {membershipError.message}
                      </div>
                    )}
                    {!membershipLoading && !membershipError && (
                      <MemberCard
                        member={{ address: walletAddress }}
                        nft={validMembership?.lock}
                        balance={"0"}
                        points={0}
                      />
                    )}
                  </CardContent>
                  <CardFooter className="flex flex-wrap gap-2">
                    {/* Add membership actions here if needed */}
                  </CardFooter>
                </Card>
              </TabsContent>

              <TabsContent value="Uploads">
                <Card>
                  <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl">Upload Content</CardTitle>
                    <CardDescription>
                      Share your videos with the community
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Link
                      href={`/profile/${walletAddress}/upload`}
                      className={`inline-flex items-center rounded-md bg-primary px-4 py-2 
                      text-sm font-medium text-primary-foreground hover:bg-primary/90`}
                    >
                      Upload New Video
                    </Link>
                    <div className="mt-6">
                      {walletAddress && (
                        <ListUploadedAssets
                          activeAccount={{
                            address: walletAddress,
                            type: walletType ?? "eoa",
                          }}
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="Revenue">
                <Card>
                  <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl">Revenue</CardTitle>
                    <CardDescription>
                      Track your earnings and revenue streams
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* Revenue content will be implemented later */}
                    <Alert>
                      <FaExclamationTriangle className="h-4 w-4" />
                      <AlertTitle>Coming Soon</AlertTitle>
                      <AlertDescription>
                        Revenue tracking features are under development
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </MembershipGuard>
    </ProfilePageGuard>
  );
};

export default ProfilePage;

export { ProfilePageGuard };
