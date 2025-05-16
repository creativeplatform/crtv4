import { z } from "zod";
import { createSafeActionClient } from "next-safe-action";
import type { ActionResponse } from "@/lib/types/actions";

const actionClient = createSafeActionClient();

const getThumbnailUrlSchema = z.object({
  playbackId: z.string().min(1),
});

export async function getThumbnailUrl({ playbackId }: { playbackId: string }) {
  const res = await fetch(
    `/api/livepeer/playback-info?playbackId=${playbackId}`
  );
  if (!res.ok)
    return {
      success: false,
      error:
        "Playback info not found. Make sure the stream is active and live.",
    } as ActionResponse;

  const data = await res.json();
  const thumbnailSource = data?.meta?.source?.find(
    (src: any) => src.type === "image/png" && src.hrn === "Thumbnail (PNG)"
  );

  if (!thumbnailSource?.url)
    return {
      success: false,
      error: "Thumbnail URL not found",
    } as ActionResponse;

  return {
    success: true,
    data: { thumbnailUrl: thumbnailSource.url },
  } as ActionResponse<{ thumbnailUrl: string }>;
}
