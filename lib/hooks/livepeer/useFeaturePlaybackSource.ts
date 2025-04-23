import { fullLivepeer } from "../../sdk/livepeer/fullClient";
import { getSrc } from "@livepeer/react/external";
import { Src } from "@livepeer/react";
import { LIVEPEER_FEATURED_PLAYBACK_ID } from "../../../context/context";

// You can replace this with your featured video playback ID
// const FEATURED_PLAYBACK_ID = 'cbd1dw72qst9xmps';

export const getFeaturedPlaybackSource = async (): Promise<Src[]> => {
  try {
    const playbackInfo = await fullLivepeer.playback.get(
      LIVEPEER_FEATURED_PLAYBACK_ID
    );
    const src = getSrc(playbackInfo?.playbackInfo) as Src[];
    return src;
  } catch (error) {
    console.error("Error fetching featured playback source:", error);
    return [];
  }
};
