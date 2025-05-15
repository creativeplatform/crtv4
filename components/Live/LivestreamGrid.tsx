"use client";

import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { Stream } from "livepeer/models/components";
import { VideoCardSkeleton } from "../Videos/VideoCardSkeleton";
import { LivestreamThumbnail } from "./LivestreamThumbnail";
import { getThumbnailUrl } from "@/services/livepeer-thumbnails";

async function fetchStreamsFromApi(): Promise<Stream[]> {
  const res = await fetch("/api/livepeer");
  if (!res.ok) throw new Error("Failed to fetch streams");
  return res.json();
}

export default function LivestreamGrid() {
  const [streams, setStreams] = useState<Stream[]>([]);
  const [loading, setLoading] = useState(true);
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchStreams = async () => {
      try {
        const result = await fetchStreamsFromApi();
        // Only include streams that are currently active
        const activeStreams = (result ?? []).filter(
          (stream) => stream.isActive === true
        );
        const mappedStreams =
          activeStreams.map((stream) => ({
            ...stream,
            name: stream.name || `Stream ${stream.id}`,
          })) ?? [];
        setStreams(mappedStreams);
        setLoading(false);
        mappedStreams.forEach(async (stream) => {
          if (!stream.playbackId || !stream.id) return;
          const res = (await getThumbnailUrl({
            playbackId: stream.playbackId,
          })) as import("@/lib/types/actions").ActionResponse<{
            thumbnailUrl: string;
          }>;
          if (res.success && res.data?.thumbnailUrl) {
            setThumbnails((prev) => ({
              ...prev,
              [String(stream.id)]: res.data!.thumbnailUrl,
            }));
          }
        });
      } catch (error) {
        console.error("Error fetching streams:", error);
        setLoading(false);
      }
    };
    fetchStreams();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <VideoCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (streams.length === 0) {
    return (
      <div className="py-8 text-center text-gray-500">
        No active livestreams at the moment
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {streams.map((stream) => (
        <Link key={stream.id} href={`/watch/${stream.playbackId}`}>
          <Card className="overflow-hidden transition-shadow hover:shadow-lg">
            <div className="relative aspect-video bg-gray-100">
              {thumbnails?.[String(stream.id)] ? (
                <LivestreamThumbnail
                  thumbnailUrl={thumbnails[String(stream.id)]}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-gray-400">
                  Loading thumbnail...
                </div>
              )}
              <div className="absolute right-2 top-2 rounded-full bg-red-500 px-2 py-1 text-xs text-white">
                LIVE
              </div>
            </div>
            <div className="p-4">
              <h3 className="truncate font-semibold">{stream.name}</h3>
              <p className="text-sm text-gray-500">
                Started{" "}
                {stream.createdAt
                  ? new Date(stream.createdAt).toLocaleDateString()
                  : "Unknown date"}
              </p>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}
