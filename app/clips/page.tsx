"use client";

import { MembershipGuard } from "@/components/auth/MembershipGuard";
import { ProfilePageGuard } from "@/components/UserProfile/UserProfile";
import DaydreamEmbed from "@/components/Daydream/DaydreamEmbed";

export default function ClipsPage() {
  return (
    <ProfilePageGuard>
      <MembershipGuard>
        <div className="container mx-auto py-8">
          <h1 className="text-3xl font-bold mb-6">
            Daydream
            <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full align-middle">
              Beta
            </span>
          </h1>
          <DaydreamEmbed />
        </div>
      </MembershipGuard>
    </ProfilePageGuard>
  );
}
