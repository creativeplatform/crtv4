"use client";

import { MembershipGuard } from "@/middleware/MembershipGuard";
import { useUser } from "@account-kit/react";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import makeBlockie from "ethereum-blockies-base64";
import { useMembershipVerification } from "@/lib/hooks/useMembershipVerification";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { Loader2 } from "lucide-react";

export default function ProfilePage() {
  const user = useUser();
  const { isLoading, hasMembership, membershipDetails } =
    useMembershipVerification();

  return (
    <MembershipGuard>
      <div className="container mx-auto py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Avatar className="h-20 w-20">
              <AvatarImage
                src={makeBlockie(user?.address || "0x")}
                alt="Profile avatar"
              />
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold">My Profile</h1>
              <p className="text-sm text-muted-foreground">{user?.address}</p>
            </div>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>My Memberships</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : !hasMembership ? (
                  <div className="text-center text-muted-foreground p-8">
                    No active memberships found
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {membershipDetails
                      ?.filter((membership) => membership.isValid)
                      .map((membership) => (
                        <Card
                          key={membership.address}
                          className="overflow-hidden"
                        >
                          {membership.lock?.image ? (
                            <div className="relative aspect-video">
                              <Image
                                src={membership.lock.image}
                                alt={membership.lock?.name || "Membership NFT"}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="aspect-video bg-muted" />
                          )}
                          <CardContent className="p-4">
                            <h3 className="font-semibold">
                              {membership.lock?.name || "Creative Pass"}
                            </h3>
                            {membership.lock?.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {membership.lock.description}
                              </p>
                            )}
                            {membership.lock?.expirationDuration && (
                              <p className="text-xs text-muted-foreground mt-2">
                                Expires:{" "}
                                {new Date(
                                  membership.lock.expirationDuration * 1000
                                ).toLocaleDateString()}
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MembershipGuard>
  );
}
