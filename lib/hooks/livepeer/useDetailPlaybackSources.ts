import { fullLivepeer } from "@/lib/sdk/livepeer/fullClient";
import { getSrc } from "@livepeer/react/external";
import { Src } from "@livepeer/react";

export const getDetailPlaybackSource = async (
  id: string
): Promise<Src[] | null> => {
  try {
    console.log("[getDetailPlaybackSource] Fetching for ID:", id);
    const res = await fullLivepeer.playback.get(id);
    console.log("[getDetailPlaybackSource] Playback info:", res?.playbackInfo);
    const src = getSrc(res?.playbackInfo) as Src[];
    console.log("[getDetailPlaybackSource] Generated sources:", src);
    if (!src?.length) {
      console.error(
        "[getDetailPlaybackSource] No valid sources generated for ID:",
        id
      );
      return null;
    }
    return src;
  } catch (error) {
    console.error(
      "[getDetailPlaybackSource] Error fetching playback source for ID:",
      id,
      error
    );
    return null;
  }
};
