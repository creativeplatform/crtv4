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
import { MembershipGuard } from "@/components/auth/MembershipGuard";
import { ProfilePageGuard } from "@/components/UserProfile/UserProfile";
import { MultistreamTargetsForm } from "@/components/Live/multicast/MultistreamTargetsForm";
import { MultistreamTargetsList } from "@/components/Live/multicast/MultistreamTargetList";
import { useState, useEffect } from "react";
import {
  listMultistreamTargets,
  MultistreamTarget,
} from "@/services/video-assets";

export default function LivePage() {
  const { isConnected } = useOrbisContext();
  const [multistreamTargets, setMultistreamTargets] = useState<
    MultistreamTarget[]
  >([]);
  const [isLoadingTargets, setIsLoadingTargets] = useState(false);

  useEffect(() => {
    async function fetchTargets() {
      setIsLoadingTargets(true);
      const result = await listMultistreamTargets();
      setIsLoadingTargets(false);
      if (result.targets) setMultistreamTargets(result.targets);
    }
    fetchTargets();
  }, []);

  function handleTargetAdded(target: MultistreamTarget) {
    setMultistreamTargets((prev) => [...prev, target]);
  }

  function handleTargetRemoved(id: string) {
    setMultistreamTargets((prev) => prev.filter((t) => t.id !== id));
  }

  if (!isConnected) {
    return (
      <ProfilePageGuard>
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
      </ProfilePageGuard>
    );
  }

  return (
    <ProfilePageGuard>
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
            <Broadcast
              streamKey={process.env.NEXT_PUBLIC_STREAM_KEY as string}
            />
            <div className="mt-4 border-t border-white/20 pt-3 max-w-[576px] mx-auto">
              <p className="mb-2 text-sm font-semibold text-white">
                Multistream Targets
              </p>
              <MultistreamTargetsForm onTargetAdded={handleTargetAdded} />
              {isLoadingTargets ? (
                <div className="text-xs text-white mt-2">
                  Loading targets...
                </div>
              ) : (
                <>
                  <MultistreamTargetsList
                    targets={multistreamTargets}
                    onTargetRemoved={handleTargetRemoved}
                  />
                  {multistreamTargets.length === 0 && (
                    <div className="text-xs text-gray-400 mt-2">
                      No multistream targets configured. Your stream will only
                      be available on this platform.
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </MembershipGuard>
    </ProfilePageGuard>
  );
}
