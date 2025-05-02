import { fullLivepeer } from "@/lib/sdk/livepeer/fullClient";
import { getSrc } from "@livepeer/react/external";
import { Src } from "@livepeer/react";

export const getDetailPlaybackSource = async (
  id: string
): Promise<Src[] | null> => {
  try {
    console.log("Fetching detailed playback sources for ID:", id);
    const res = await fullLivepeer.playback.get(id);

    if (!res?.playbackInfo) {
      console.error("No playback info found for ID:", id);
      return null;
    }

    console.log("Playback info:", res.playbackInfo);
    const src = getSrc(res.playbackInfo) as Src[];
    console.log("Generated sources:", src);

    if (!src?.length) {
      console.error("No valid sources generated for ID:", id);
      return null;
    }

    return src;
  } catch (error) {
    console.error("Error fetching playback source:", error);
    return null;
  }
};
