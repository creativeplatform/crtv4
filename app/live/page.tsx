"use client";

import { Broadcast } from "@/components/Live/Broadcast";
import { useOrbisContext } from "@/context/OrbisContext";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Slash, VideoIcon } from "lucide-react";
import { FaExclamationTriangle } from "react-icons/fa";
import { MembershipGuard } from "@/middleware/MembershipGuard";

export default function LivePage() {
  const { isConnected } = useOrbisContext();

  if (!isConnected) {
    return (
      <MembershipGuard>
        <div className="min-h-screen p-6">
          <Alert variant="destructive">
            <FaExclamationTriangle className="h-4 w-4" />
            <AlertTitle>Authentication Required</AlertTitle>
            <AlertDescription>
              Please connect your wallet to access the live streaming feature.
            </AlertDescription>
          </Alert>
        </div>
      </MembershipGuard>
    );
  }

  return (
    <MembershipGuard>
      <div className="min-h-screen p-6">
        <div className="mb-8 rounded-lg bg-white p-8 shadow-md">
          <h1 className="mb-6 flex items-center justify-center gap-2 text-center text-4xl font-bold text-red-600">
            <VideoIcon className="h-10 w-10" />
            <span>LIVE</span>
          </h1>
          <p className="mb-8 text-center text-gray-600">THE STAGE IS YOURS</p>
        </div>
        <div className="my-5 p-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">
                  <span role="img" aria-label="home">
                    🏠
                  </span>{" "}
                  Home
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator>
                <Slash />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                <BreadcrumbLink>
                  <BreadcrumbPage>Live</BreadcrumbPage>
                </BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div>
          <Broadcast streamKey={"24dc-z32j-qafy-yskq"} />
        </div>
      </div>
    </MembershipGuard>
  );
}
