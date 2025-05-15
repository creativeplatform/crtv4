"use client";

import { Broadcast, createStreamViaProxy } from "@/components/Live/Broadcast";
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
import { useParams } from "next/navigation";
import { ClipCreator } from "@/components/Live/ClipCreator";
import { LivestreamThumbnail } from "@/components/Live/LivestreamThumbnail";
import { getThumbnailUrl } from "@/services/livepeer-thumbnails";

export default function LivePage() {
  const { isConnected } = useOrbisContext();
  const [multistreamTargets, setMultistreamTargets] = useState<
    MultistreamTarget[]
  >([]);
  const [isLoadingTargets, setIsLoadingTargets] = useState(false);
  const { address: streamId } = useParams();
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [thumbnailError, setThumbnailError] = useState<string | null>(null);
  const [thumbnailLoading, setThumbnailLoading] = useState(false);
  const [streamKey, setStreamKey] = useState<string | null>(null);
  const [isCreatingStream, setIsCreatingStream] = useState(false);
  const [streamCreateError, setStreamCreateError] = useState<string | null>(
    null
  );

  useEffect(() => {
    async function fetchTargets() {
      setIsLoadingTargets(true);
      const result = await listMultistreamTargets();
      setIsLoadingTargets(false);
      if (result.targets) setMultistreamTargets(result.targets);
    }
    fetchTargets();
  }, []);

  useEffect(() => {
    async function fetchThumbnail() {
      if (!streamId) return;
      setThumbnailLoading(true);
      setThumbnailError(null);
      const res = (await getThumbnailUrl({
        playbackId: Array.isArray(streamId) ? streamId[0] : streamId,
      })) as import("@/lib/types/actions").ActionResponse<{
        thumbnailUrl: string;
      }>;
      if (res.success && res.data?.thumbnailUrl)
        setThumbnailUrl(res.data.thumbnailUrl);
      else setThumbnailError(res.error || "Thumbnail not found");
      setThumbnailLoading(false);
    }
    fetchThumbnail();
  }, [streamId]);

  function handleTargetAdded(target: MultistreamTarget) {
    setMultistreamTargets((prev) => [...prev, target]);
  }

  function handleTargetRemoved(id: string) {
    setMultistreamTargets((prev) => prev.filter((t) => t.id !== id));
  }

  async function handleCreateStream() {
    setIsCreatingStream(true);
    setStreamCreateError(null);
    try {
      const result = await createStreamViaProxy({
        name: `Broadcast-${Date.now()}`,
        profiles: [
          {
            name: "480p",
            width: 854,
            height: 480,
            bitrate: 1_000_000,
            fps: 30,
            fpsDen: 1,
            quality: 23,
            gop: "2",
            profile: "H264Baseline",
          },
          {
            name: "720p",
            width: 1280,
            height: 720,
            bitrate: 2_500_000,
            fps: 30,
            fpsDen: 1,
            quality: 23,
            gop: "2",
            profile: "H264Baseline",
          },
          {
            name: "1080p",
            width: 1920,
            height: 1080,
            bitrate: 4_500_000,
            fps: 30,
            fpsDen: 1,
            quality: 23,
            gop: "2",
            profile: "H264Baseline",
          },
        ],
        record: false,
        playbackPolicy: { type: "jwt" },
        multistream: {
          targets: multistreamTargets
            .filter((t) => t.id)
            .map((t) => ({ id: t.id, profile: "source" })),
        },
      });
      if (result.streamKey) setStreamKey(result.streamKey);
      else if (result.stream?.streamKey) setStreamKey(result.stream.streamKey);
      else setStreamCreateError("Stream key not found in response");
    } catch (e) {
      setStreamCreateError("Failed to create stream");
    } finally {
      setIsCreatingStream(false);
    }
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
            {thumbnailLoading ? (
              <div className="flex items-center justify-center h-40 text-gray-400">
                Loading thumbnail...
              </div>
            ) : thumbnailError ? (
              <div className="flex items-center justify-center h-40 text-red-400">
                {thumbnailError}
              </div>
            ) : thumbnailUrl ? (
              <LivestreamThumbnail thumbnailUrl={thumbnailUrl} />
            ) : null}
            {!streamKey ? (
              <div className="flex flex-col items-center justify-center my-8">
                <button
                  onClick={handleCreateStream}
                  disabled={isCreatingStream}
                  className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                >
                  {isCreatingStream ? "Creating Stream..." : "Create Stream"}
                </button>
                {streamCreateError && (
                  <div className="text-red-500 mt-2">{streamCreateError}</div>
                )}
              </div>
            ) : (
              <Broadcast streamKey={streamKey} />
            )}
            <ClipCreator
              playbackId={process.env.NEXT_PUBLIC_PLAYBACK_ID as string}
              sessionId={process.env.NEXT_PUBLIC_SESSION_ID as string}
            />
            <div className="mt-4 border-t border-white/20 pt-3 max-w-[576px] mx-auto">
              <p className="mb-2 text-sm font-semibold">Multistream Targets</p>
              <MultistreamTargetsForm
                streamId={Array.isArray(streamId) ? streamId[0] : streamId}
                onTargetAdded={handleTargetAdded}
              />
              {isLoadingTargets ? (
                <div className="text-xs mt-2">Loading targets...</div>
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
