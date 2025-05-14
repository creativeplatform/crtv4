import { Livepeer } from "livepeer";
import { fullLivepeer } from "@/lib/sdk/livepeer/fullClient";

export async function createClip({
  playbackId,
  sessionId,
  startTime,
  endTime,
  name,
}: {
  playbackId: string;
  sessionId: string;
  startTime: number;
  endTime: number;
  name?: string;
}): Promise<{ playbackUrl: string; assetId: string; error?: string }> {
  if (!playbackId || !sessionId || !startTime || !endTime)
    return { playbackUrl: "", assetId: "", error: "Missing required fields" };
  try {
    const result = await fullLivepeer.stream.createClip({
      playbackId,
      startTime,
      endTime,
      name,
      sessionId,
    });
    const playbackUrl = result.data?.asset.playbackUrl ?? "";
    const assetId = result.data?.asset.id ?? "";
    if (!playbackUrl)
      return {
        playbackUrl: "",
        assetId,
        error: "Clip created but playback URL not ready yet.",
      };
    return { playbackUrl, assetId };
  } catch (e: any) {
    return {
      playbackUrl: "",
      assetId: "",
      error: e?.message ?? "Unknown error",
    };
  }
}
