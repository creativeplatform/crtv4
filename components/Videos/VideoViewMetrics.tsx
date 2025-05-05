"use client";
import React, { useState, useEffect } from "react";
import { fetchAllViews } from "@/app/api/livepeer/views";

interface VideoViewMetricsProps {
  playbackId: string;
}

const VideoViewMetrics: React.FC<VideoViewMetricsProps> = ({ playbackId }) => {
  const [viewMetrics, setViewMetrics] = useState<{
    playbackId: string;
    viewCount: number;
    playtimeMins: number;
    legacyViewCount: number;
  } | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchViewMetrics() {
      try {
        const result = await fetchAllViews(playbackId);
        if (result) {
          setViewMetrics(result);
        } else {
          setError("Failed to fetch view metrics");
        }
      } catch (err) {
        setError((err as Error).message || "Failed to fetch view metrics");
      } finally {
        setLoading(false);
      }
    }

    fetchViewMetrics();
  }, [playbackId]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div>
      <h3>Views: {viewMetrics?.viewCount ?? "0"}</h3>
    </div>
  );
};

export default VideoViewMetrics;
