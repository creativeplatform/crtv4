"use client";

import { MembershipGuard } from "@/components/auth/MembershipGuard";
import { ProfilePageGuard } from "@/components/UserProfile/UserProfile";

export default function UploadPage() {
  return (
    <ProfilePageGuard>
      <MembershipGuard>
        <div className="container mx-auto py-8">
          <h1 className="text-3xl font-bold mb-6">Upload Content</h1>
          {/* Upload form will go here */}
        </div>
      </MembershipGuard>
    </ProfilePageGuard>
  );
}
