"use client";
import { useEffect } from "react";
import { useUser } from "@account-kit/react";
import { useRouter } from "next/navigation";

function ProfileRedirect() {
  const router = useRouter();
  const user = useUser();

  useEffect(() => {
    if (user?.address) router.replace(`/profile/${user.address}`);
  }, [user, router]);

  return (
    <div className="flex items-center justify-center h-screen text-lg font-medium">
      Loading profile...
    </div>
  );
}

export default ProfileRedirect;
