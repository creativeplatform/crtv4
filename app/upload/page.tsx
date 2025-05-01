"use client";

import { MembershipGuard } from "@/middleware/MembershipGuard";

export default function UploadPage() {
  return (
    <MembershipGuard>
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Upload Content</h1>
        {/* Upload form will go here */}
      </div>
    </MembershipGuard>
  );
}
