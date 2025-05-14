"use client";
import { useEffect } from "react";
import { useUser } from "@account-kit/react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";

function UploadRedirect() {
  const router = useRouter();
  const user = useUser();

  useEffect(() => {
    if (user?.address) router.replace(`/upload/${user.address}`);
  }, [user, router]);

  return (
    <div className="flex items-center justify-center h-screen text-lg font-medium">
      <Skeleton className="w-full h-full" />
    </div>
  );
}

export default UploadRedirect;
