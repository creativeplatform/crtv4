"use client";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Avatar, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { cn } from "../../lib/utils";
import { Player } from "@/components/Player/Player";
import { Asset } from "livepeer/models/components";
import Link from "next/link";
import { Src } from "@livepeer/react";
import makeBlockie from "ethereum-blockies-base64";
import VideoViewMetrics from "./VideoViewMetrics";
import { useVideo } from "@/context/VideoContext";
import { useRef, useEffect } from "react";

interface VideoCardProps {
  asset: Asset;
  playbackSources: Src[] | null;
}

const VideoCard: React.FC<VideoCardProps> = ({ asset, playbackSources }) => {
  const { currentPlayingId, setCurrentPlayingId } = useVideo();
  const playerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const player = playerRef.current;
    const videoElement = player?.querySelector("video");
    if (
      videoElement &&
      !videoElement.paused &&
      currentPlayingId !== asset?.id
    ) {
      try {
        videoElement.pause();
      } catch (error) {
        console.error("Error pausing video:", error);
      }
    }

    return () => {
      const videoElement = player?.querySelector("video");
      if (videoElement && !videoElement.paused) {
        try {
          videoElement.pause();
          if (currentPlayingId === asset?.id) {
            setCurrentPlayingId(null);
          }
        } catch (error) {
          console.error("Error cleaning up video:", error);
        }
      }
    };
  }, [currentPlayingId, asset?.id, setCurrentPlayingId]);

  const handlePlay = () => {
    try {
      setCurrentPlayingId(asset?.id || null);
    } catch (error) {
      console.error("Error setting current playing ID:", error);
    }
  };

  // Early return if asset is not provided or invalid
  if (!asset) {
    console.warn("VideoCard: No asset provided");
    return null;
  }

  // Early return if asset is not ready
  if (asset.status?.phase !== "ready") {
    console.debug(
      `VideoCard: Asset ${asset.id} not ready, status: ${asset.status?.phase}`
    );
    return null;
  }

  const address = asset.creatorId?.value as string;
  if (!address) {
    console.warn(`VideoCard: No creator address for asset ${asset.id}`);
    return null;
  }

  const shortenAddress = (addr: string) => {
    if (!addr) return "";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="mx-auto" ref={playerRef}>
      <Card key={asset?.id} className={cn("w-[360px] overflow-hidden")}>
        <div className="mx-auto flex-1 flex-wrap">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Avatar>
                <AvatarImage
                  src={makeBlockie(address)}
                  className="h-10 w-10 rounded-full"
                />
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-medium">
                  {shortenAddress(address)}
                </span>
                <span className="text-xs text-gray-500">
                  {shortenAddress(address)}
                </span>
              </div>
            </div>
          </CardHeader>
        </div>
        <Player
          src={playbackSources}
          assetId={asset?.id}
          title={asset?.name}
          onPlay={handlePlay}
        />
        <CardContent>
          <div className="my-2 flex items-center justify-between">
            <Badge
              className={asset.status?.phase === "ready" ? "black" : "white"}
            >
              {asset?.status?.phase}
            </Badge>
            <VideoViewMetrics playbackId={asset.playbackId || ""} />
          </div>
          <div className="mt-6 grid grid-flow-row auto-rows-max space-y-3 overflow-hidden">
            <CardTitle>
              <Link href={`/discover/${asset.id}`} passHref>
                <h1
                  className="max-w-full overflow-hidden text-ellipsis 
                whitespace-nowrap text-xl font-bold hover:text-orange-500 focus:text-orange-500"
                >
                  {asset?.name}
                </h1>
              </Link>
            </CardTitle>
            <CardDescription className="text-xl" color={"brand.300"}>
              <span className="text-xs">
                {asset?.createdAt
                  ? new Date(asset.createdAt).toLocaleDateString()
                  : ""}
              </span>
            </CardDescription>
          </div>
        </CardContent>
        <hr className="mb-5" />
        <CardFooter className="mx-auto flex items-center justify-center">
          {asset?.status?.phase === "ready" ? (
            <div className="flex space-x-10">
              <Button
                className="flex-1 cursor-pointer hover:scale-125"
                aria-label={`Buy ${asset?.name}`}
                variant="ghost"
              >
                Buy
              </Button>
              <Link
                href={`/discover/${encodeURIComponent(asset?.id)}`}
                passHref
              >
                <Button
                  className="flex-1 cursor-pointer hover:scale-125"
                  aria-label={`Comment on ${asset?.name}`}
                  variant="ghost"
                >
                  Comment
                </Button>
              </Link>
              <Button
                className="flex-1 cursor-pointer hover:scale-125"
                aria-label={`Share ${asset?.name}`}
                variant="ghost"
              >
                Share
              </Button>
            </div>
          ) : null}
        </CardFooter>
      </Card>
    </div>
  );
};

export default VideoCard;
