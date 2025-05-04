/**
 * @file useFeaturePlaybackSource.ts
 * @description Utility function to fetch the featured video playback source from Livepeer.
 *
 * This function retrieves the playback source for a featured video that's displayed
 * prominently in the application, typically on the home page hero section.
 *
 * The function:
 * 1. Connects to the Livepeer API using the fullLivepeer client
 * 2. Fetches playback information for the configured featured video ID
 * 3. Processes the playback info into a source format compatible with video players
 * 4. Handles errors gracefully by returning an empty array if the fetch fails
 *
 * @requires fullLivepeer client from the Livepeer SDK
 * @requires getSrc from @livepeer/react/external for processing playback info
 * @requires LIVEPEER_FEATURED_PLAYBACK_ID from application context
 *
 * @returns {Promise<Src[]>} A promise that resolves to an array of video sources
 *   compatible with the Livepeer video player. Each source includes properties like:
 *   - type: The MIME type of the video (e.g., 'application/vnd.apple.mpegurl')
 *   - width: The width of the video
 *   - height: The height of the video
 *   - src: The URL of the video stream
 *
 * @example
 * // Fetch the featured video source
 * const featuredSources = await getFeaturedPlaybackSource();
 *
 * // Use with a player component
 * <Player sources={featuredSources} />
 *
 * @dev Notes:
 * - The featured video ID is defined in the application context as LIVEPEER_FEATURED_PLAYBACK_ID
 * - For testing, you can replace the ID with a test video like 'cbd1dw72qst9xmps'
 * - The Livepeer API requires a valid API key configured in the fullLivepeer client
 * - The function returns an empty array instead of throwing errors to prevent UI crashes
 * - Livepeer playback sources typically provide multiple quality options (HLS format)
 */

import { fullLivepeer } from "../../sdk/livepeer/fullClient";
import { getSrc } from "@livepeer/react/external";
import { Src } from "@livepeer/react";
import { LIVEPEER_FEATURED_PLAYBACK_ID } from "../../../context/context";

// You can replace this with your featured video playback ID
// const FEATURED_PLAYBACK_ID = 'cbd1dw72qst9xmps';

export const getFeaturedPlaybackSource = async (): Promise<Src[]> => {
  try {
    console.log(
      "Fetching featured playback source for ID:",
      LIVEPEER_FEATURED_PLAYBACK_ID
    );
    const playbackInfo = await fullLivepeer.playback.get(
      LIVEPEER_FEATURED_PLAYBACK_ID
    );

    if (!playbackInfo?.playbackInfo) {
      console.error("No playback info found for featured video");
      return [];
    }

    const src = getSrc(playbackInfo.playbackInfo) as Src[];

    if (!src || src.length === 0) {
      console.error("No valid sources generated for featured video");
      return [];
    }

    console.log("Successfully fetched featured playback source:", src);
    return src;
  } catch (error) {
    console.error("Error fetching featured playback source:", error);
    return [];
  }
};
