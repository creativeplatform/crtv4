"use client";

import { MembershipGuard } from "@/components/auth/MembershipGuard";
import { ProfilePageGuard } from "@/components/UserProfile/UserProfile";

export default function ClipsPage() {
  return (
    <ProfilePageGuard>
      <MembershipGuard>
        <div className="container mx-auto py-8">
          <h1 className="text-3xl font-bold mb-6">My Clips</h1>
          {/* Clips gallery will go here */}
        </div>
      </MembershipGuard>
    </ProfilePageGuard>
  );
}
