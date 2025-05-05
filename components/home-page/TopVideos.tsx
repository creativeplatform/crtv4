import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { TrendingPlayer } from "@/components/Player/TrendingPlayer";
import { getDetailPlaybackSource } from "@/lib/hooks/livepeer/useDetailPlaybackSources";
import { Src } from "@livepeer/react";
import { fullLivepeer } from "@/lib/sdk/livepeer/fullClient";
import { toast } from "sonner";
import Link from "next/link";
import { TrendingUpIcon } from "lucide-react";

interface Video {
  playbackId: string;
  assetId: string;
  title: string;
}

const videos: Video[] = [
  {
    playbackId: "4b211g2avwfkpw3f",
    assetId: "4b214949-39ca-4b92-a058-aa54f6338f6b",
    title: "Two Songs Of Kurdistan",
  },
  {
    playbackId: "29f9k3ep6k7uvye5",
    assetId: "29f953ea-b2f9-499b-96df-3ca3efb857d1",
    title: "How Nouns Are Born",
  },
  {
    playbackId: "9477p8y4da3knfr5",
    assetId: "9477a771-19b4-4737-999f-473c75cac5d2",
    title: "G2 - Monster Lyric Video",
  },
  {
    playbackId: "a2b2fcgqx7ghfpxj",
    assetId: "a2b2356d-bb51-46f3-9882-5bde2ec04654",
    title: "DAO Documentary",
  },
  {
    playbackId: "ed401mvzp9c9z8gq",
    assetId: "ed40cc47-3b8a-4b15-81c2-871b5ae54158",
    title: "Creative Podcast Episode 2",
  },
  {
    playbackId: "6461dsqs9qjr1dji",
    assetId: "64616676-8e21-47eb-a7f8-668f4041617b",
    title: "Creative Podcast Episode 1",
  },
  {
    playbackId: "bc628p4ch452mimr",
    assetId: "bc62564f-76a5-4bdf-b125-b5107558ebb5",
    title: "The Rise of Blus: A Nouns Movie",
  },
  {
    playbackId: "0c5bbanq1327kvdw",
    assetId: "7d373c41-ad8f-4aa9-a26f-438e26a29f96",
    title: "DOAC: The ADHD Doctor",
  },
  {
    playbackId: "df2cseikhacfacsq",
    assetId: "df2c123b-1ae3-4da1-ac12-e6585593a9bb",
    title: "NFT.NYC Studio Event",
  },
  {
    playbackId: "2cf3hdfx83kqqucf",
    assetId: "2cf31795-bf64-4cae-862d-4d4d89cbf8cb",
    title: "The Wizard's Hat ⌐◨-◨ Animated Short",
  },
];

export function TopVideos() {
  const [playbackSources, setPlaybackSources] = React.useState<
    Record<string, Src[] | null>
  >({});
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchPlaybackSources = async () => {
      try {
        const sources: Record<string, Src[] | null> = {};
        console.log("Starting to fetch playback sources...");

        for (const video of videos) {
          try {
            console.log(
              `Fetching playback source for video ${video.playbackId}...`
            );

            // First verify the playback ID exists
            const playbackInfo = await fullLivepeer.playback.get(
              video.playbackId
            );
            console.log("Playback info:", playbackInfo);

            if (!playbackInfo?.playbackInfo) {
              console.error(
                `No playback info found for video ${video.playbackId}`
              );
              sources[video.playbackId] = null;
              continue;
            }

            // Then get the playback source
            const src = await getDetailPlaybackSource(video.playbackId);
            console.log(`Playback source for ${video.playbackId}:`, src);

            if (!src || src.length === 0) {
              console.error(
                `No valid source found for video ${video.playbackId}`
              );
              sources[video.playbackId] = null;
              continue;
            }

            sources[video.playbackId] = src;
          } catch (error) {
            console.error(
              `Error fetching playback source for video ${video.playbackId}:`,
              error
            );
            sources[video.playbackId] = null;
          }
        }

        console.log("Final playback sources:", sources);
        setPlaybackSources(sources);
      } catch (error) {
        console.error("Error in fetchPlaybackSources:", error);
        setError("Failed to load videos");
        toast.error("Failed to load videos");
      } finally {
        setLoading(false);
      }
    };

    fetchPlaybackSources();
  }, []);

  if (error) {
    return (
      <div className="mx-auto w-full max-w-7xl py-8">
        <div className="mb-8 text-center">
          <h1 className="mb-4 text-3xl font-bold">
            <span className="animate-pulse">
              <TrendingUpIcon className="inline-block h-10 w-10 text-green-700" />
            </span>
            TRENDING VIDEOS
          </h1>
          <div className="text-red-500">{error}</div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-7xl py-8">
        <div className="mb-8 text-center">
          <h1 className="mb-4 text-3xl font-bold">
            <span className="animate-pulse">
              <TrendingUpIcon className="inline-block h-10 w-10 text-green-700" />
            </span>
            TRENDING VIDEOS
          </h1>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className={[
                "h-[300px] animate-pulse rounded-lg bg-gray-200",
                index > 0 ? "hidden sm:block" : "",
              ].join(" ")}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl py-8">
      <div className="mb-8 text-center">
        <h1 className="mb-4 text-3xl font-bold">
          <span className="animate-pulse">
            <TrendingUpIcon className="inline-block h-10 w-10 text-green-700" />
          </span>{" "}
          TRENDING VIDEOS
        </h1>
      </div>
      <div className="relative mx-auto w-full max-w-7xl">
        <Carousel className="min-w-sm mx-auto w-full max-w-7xl">
          <CarouselContent className="-ml-1">
            {videos.map((video) => (
              <CarouselItem
                key={video.playbackId}
                className="basis-full pl-0 sm:basis-1/2 sm:pl-1 md:basis-1/2 lg:basis-1/3 xl:basis-1/3"
              >
                <div className="group h-full p-1">
                  <Card className="relative h-[300px] w-full overflow-hidden transition-transform duration-200 ease-in-out group-hover:scale-[1.02]">
                    <CardContent className="absolute inset-0 p-0">
                      <TrendingPlayer
                        src={playbackSources[video.playbackId]}
                        title={video.title}
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                        <Link
                          href={`/discover/${video.assetId}`}
                          className="block hover:underline"
                        >
                          <h3 className="line-clamp-2 text-sm font-medium text-white">
                            {video.title}
                          </h3>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="absolute left-0 top-1/2 -translate-y-1/2 transform text-[#EC407A] hover:text-[#EC407A]/80 h-12 w-12" />
          <CarouselNext className="absolute right-0 top-1/2 -translate-y-1/2 transform text-[#EC407A] hover:text-[#EC407A]/80 h-12 w-12" />
        </Carousel>
      </div>
    </div>
  );
}
