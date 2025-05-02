"use client";
import React, { useEffect, useState } from "react";
import { Asset } from "livepeer/models/components";
import { fetchAllAssets } from "@/app/api/livepeer/actions";
import VideoCard from "@/components/Videos/VideoCard";
import { Src } from "@livepeer/react";
import { getDetailPlaybackSource } from "@/lib/hooks/livepeer/useDetailPlaybackSources";
import { VideoCardSkeleton } from "./VideoCardSkeleton";

const VideoCardGrid: React.FC = () => {
  const [playbackSources, setPlaybackSources] = useState<
    (Asset & { detailedSrc: Src[] | null })[] | null
  >(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSources = async () => {
      try {
        setLoading(true);
        setError(null);

        // Function to fetch assets with retries
        const fetchAssetsWithRetry = async (retries = 3): Promise<Asset[]> => {
          try {
            const response = await fetchAllAssets();
            if (!response || !Array.isArray(response)) {
              throw new Error("Invalid response format");
            }
            return response;
          } catch (err) {
            if (retries > 0) {
              console.warn(
                `Retrying asset fetch. Attempts remaining: ${retries - 1}`
              );
              await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second before retry
              return fetchAssetsWithRetry(retries - 1);
            }
            throw err;
          }
        };

        // Function to fetch playback source with retries
        const fetchPlaybackSourceWithRetry = async (
          playbackId: string,
          retries = 3
        ): Promise<Src[] | null> => {
          try {
            const detailedSrc = await getDetailPlaybackSource(playbackId);
            return detailedSrc;
          } catch (err) {
            if (retries > 0) {
              console.warn(
                `Retrying playback source fetch for ${playbackId}. Attempts remaining: ${
                  retries - 1
                }`
              );
              await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second before retry
              return fetchPlaybackSourceWithRetry(playbackId, retries - 1);
            }
            console.error(
              `Failed to fetch playback source for ${playbackId} after all retries:`,
              err
            );
            return null;
          }
        };

        // Fetch all assets with retry mechanism
        const assets = await fetchAssetsWithRetry();

        // Only process assets that are ready for playback
        const readyAssets = assets.filter(
          (asset) => asset.status?.phase === "ready" && asset.playbackId
        );

        // Fetch detailed playback sources for each ready asset
        const detailedPlaybackSources = await Promise.all(
          readyAssets.map(async (asset: Asset) => {
            const detailedSrc = await fetchPlaybackSourceWithRetry(
              asset.playbackId!
            );
            return { ...asset, detailedSrc };
          })
        );

        // Filter out assets with failed playback sources
        const validPlaybackSources = detailedPlaybackSources.filter(
          (source) => source.detailedSrc !== null
        );

        console.log(
          "[VideoCardGrid] Valid playback sources:",
          validPlaybackSources
        );

        if (validPlaybackSources.length === 0) {
          setError("No valid videos available at the moment.");
          return;
        }

        setPlaybackSources(validPlaybackSources);
      } catch (err) {
        console.error("Error fetching playback sources:", err);
        setError("Failed to load videos. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchSources();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <VideoCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[200px] items-center justify-center rounded-lg bg-red-50 p-4 text-red-800">
        <p>{error}</p>
      </div>
    );
  }

  if (!playbackSources || playbackSources.length === 0) {
    return (
      <div className="flex min-h-[200px] items-center justify-center rounded-lg bg-gray-50 p-4">
        <p>No videos available at the moment. Please check back later.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {playbackSources.map((asset) => (
        <VideoCard
          key={asset.id}
          asset={asset}
          playbackSources={asset.detailedSrc}
        />
      ))}
    </div>
  );
};

export default VideoCardGrid;
