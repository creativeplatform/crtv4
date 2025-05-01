"use client";

import { MembershipGuard } from "@/middleware/MembershipGuard";

export default function LivePage() {
  return (
    <MembershipGuard>
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Live Streaming</h1>
        {/* Live streaming interface will go here */}
      </div>
    </MembershipGuard>
  );
}
