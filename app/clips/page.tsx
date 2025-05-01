"use client";

import { MembershipGuard } from "@/middleware/MembershipGuard";

export default function ClipsPage() {
  return (
    <MembershipGuard>
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">My Clips</h1>
        {/* Clips gallery will go here */}
      </div>
    </MembershipGuard>
  );
}
