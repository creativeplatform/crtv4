"use client";

import { useEffect, useState } from "react";
import { fetchAllViews } from "@/app/api/livepeer/views";
import { EyeIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ViewsComponentProps {
  playbackId: string;
}

interface ViewMetrics {
  playbackId: string;
  viewCount: number;
  playtimeMins: number;
  legacyViewCount: number;
}

export const ViewsComponent: React.FC<ViewsComponentProps> = ({
  playbackId,
}) => {
  const [viewMetrics, setViewMetrics] = useState<ViewMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchViewMetrics() {
      if (!playbackId) {
        setError("No playback ID provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const result = await fetchAllViews(playbackId);
        if (result) {
          setViewMetrics(result);
        } else {
          setError("Failed to fetch view metrics");
        }
      } catch (err) {
        setError((err as Error).message || "Failed to fetch view metrics");
        console.error("Error fetching view metrics:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchViewMetrics();
  }, [playbackId]);

  if (loading) {
    return (
      <div className="flex items-center gap-1 text-sm text-gray-400">
        <EyeIcon className="h-4 w-4" />
        <Skeleton className="h-4 w-16 bg-slate-300" />
      </div>
    );
  }

  if (error || !viewMetrics) {
    return (
      <div className="flex items-center gap-1 text-sm text-gray-400">
        <EyeIcon className="h-4 w-4" />
        <span>0 views</span>
      </div>
    );
  }

  const totalViews =
    (viewMetrics.viewCount ?? 0) + (viewMetrics.legacyViewCount ?? 0);

  return (
    <div className="flex items-center gap-1 text-sm text-gray-200">
      <EyeIcon className="h-4 w-4" />
      <span>{totalViews.toLocaleString()} views</span>
    </div>
  );
};
