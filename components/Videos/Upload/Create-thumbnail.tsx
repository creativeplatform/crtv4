"use client";
import {
  getLivepeerAsset,
  getLivepeerPlaybackInfo,
} from "@/app/api/livepeer/assetUploadActions";
import { Player } from "@/components/Player/Player";
import { Button } from "@/components/ui/button";
import { Src } from "@livepeer/react";
import { getSrc } from "@livepeer/react/external";
import { Asset, PlaybackInfo } from "livepeer/models/components";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useInterval } from "@/lib/hooks/useInterval";
import CreateThumbnailForm from "./CreateThumbnailForm";
import { toast } from "sonner";
import { NFTConfig } from "@/lib/types/video-asset";
import { Skeleton } from "@/components/ui/skeleton";

type CreateThumbnailProps = {
  livePeerAssetId: string | undefined;
  thumbnailUri?: string;
  onComplete: (data: {
    thumbnailUri: string;
    nftConfig?: {
      isMintable: boolean;
      maxSupply: number;
      price: number;
      royaltyPercentage: number;
    };
  }) => void;
};

export default function CreateThumbnail({
  livePeerAssetId,
  thumbnailUri,
  onComplete,
}: CreateThumbnailProps) {
  const router = useRouter();
  const [livepeerAssetData, setLivepeerAssetData] = useState<Asset>();
  const [livepeerPlaybackData, setLivepeerPlaybackData] =
    useState<PlaybackInfo>();
  const [selectedThumbnail, setSelectedThumbnail] = useState<string>();
  const [nftConfig, setNFTConfig] = useState<NFTConfig | undefined>(undefined);

  useInterval(
    () => {
      if (livePeerAssetId) {
        getLivepeerAsset(livePeerAssetId)
          .then((data) => {
            setLivepeerAssetData(data);
            if (data?.status?.phase === "failed") {
              toast.error(
                "Video transcoding failed: " + data.status.errorMessage
              );
              return false;
            }
          })
          .catch((e) => {
            console.error("Error retrieving livepeer asset:", e);
            toast.error(e?.message || "Error retrieving video status");
          });
      }
    },
    livepeerAssetData?.status?.phase !== "ready" &&
      livepeerAssetData?.status?.phase !== "failed"
      ? 5000
      : null
  );

  useEffect(() => {
    if (
      livepeerAssetData?.status?.phase === "ready" &&
      livepeerAssetData.playbackId
    ) {
      getLivepeerPlaybackInfo(livepeerAssetData.playbackId).then((data) => {
        setLivepeerPlaybackData(data);
      });
    }
  }, [livepeerAssetData]);

  const handleBack = () => {
    router.back();
  };

  const handleComplete = (thumbnailUri: string, nftConfig?: NFTConfig) => {
    if (livepeerAssetData) {
      setSelectedThumbnail(thumbnailUri);
      onComplete({
        thumbnailUri: selectedThumbnail as string,
        nftConfig: nftConfig,
      });
    } else {
      toast.error("Video data not found. Please try again.");
    }
  };

  const handleSubmit = () => {
    if (selectedThumbnail) {
      onComplete({
        thumbnailUri: selectedThumbnail,
        nftConfig: nftConfig,
      });
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
      <div className="my-6 text-center">
        <h4 className="text-2xl font-bold">Almost Done...</h4>
      </div>
      <div className="my-4">
        <h3 className="text-lg">
          Video Transcoding: {String(livepeerAssetData?.status?.phase)}
        </h3>
      </div>
      {livepeerAssetData?.status?.phase !== "ready" && (
        <div className="my-6">
          <Skeleton className="w-full aspect-video rounded-lg" />
        </div>
      )}
      {livepeerAssetData?.status?.phase === "ready" && livepeerPlaybackData && (
        <div className="my-6">
          <Player
            title={livepeerAssetData.name}
            assetId={livepeerAssetData.id}
            src={getSrc(livepeerPlaybackData) as Src[]}
          />
        </div>
      )}

      <div className="my-5">
        <div className="mx-auto my-4">
          <h3 className="text-xl font-bold">Generate a Thumbnail</h3>
        </div>
        <CreateThumbnailForm
          onSelectThumbnailImages={(thumbnailUri: string) => {
            handleComplete(thumbnailUri);
          }}
        />
      </div>

      <div className="flex items-center justify-center gap-3">
        <Button
          disabled={livepeerAssetData?.status?.phase === "processing"}
          onClick={handleBack}
        >
          Back
        </Button>
        <Button
          disabled={
            !selectedThumbnail || livepeerAssetData?.status?.phase !== "ready"
          }
          onClick={handleSubmit}
        >
          Submit
        </Button>
      </div>
    </div>
  );
}
