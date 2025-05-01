"use client";

import { MembershipGuard } from "@/middleware/MembershipGuard";
import { useUser } from "@account-kit/react";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import makeBlockie from "ethereum-blockies-base64";

export default function ProfilePage() {
  const user = useUser();

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

          {/* Profile content will go here */}
        </div>
      </div>
    </MembershipGuard>
  );
}
