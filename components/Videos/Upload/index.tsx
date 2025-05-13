"use client";

import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FaExclamationTriangle } from "react-icons/fa";

import { toast } from "sonner";
import { useAccount } from "@account-kit/react";
import { Asset } from "livepeer/models/components";

import { StepperFormValues } from "@/lib/types/hook-stepper";
import { useOrbisContext } from "@/lib/sdk/orbisDB/context";
import StepperIndicator from "@/components/Videos/Upload/Stepper-Indicator";
import FileUpload from "@/components/Videos/Upload/FileUpload";
import CreateInfo from "@/components/Videos/Upload/Create-info";
import CreateThumbnailWrapper from "@/components/Videos/Upload/CreateThumbnailWrapper";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { TVideoMetaForm } from "@/components/Videos/Upload/Create-info";
import {
  AssetMetadata,
  createAssetMetadata,
} from "@/lib/sdk/orbisDB/models/AssetMetadata";
import { stack } from "@/lib/sdk/stack/stackClient";
import { db } from "@/lib/sdk/orbisDB/client";
import {
  updateVideoAssetMintingStatus,
  updateVideoAsset,
} from "@/services/video-assets";
import { createVideoAsset } from "@/services/video-assets";
import type { VideoAsset } from "@/lib/types/video-asset";
import { useUniversalAccount } from "@/lib/hooks/accountkit/useUniversalAccount";

const HookMultiStepForm = () => {
  const [activeStep, setActiveStep] = useState(1);
  const [erroredInputName, setErroredInputName] = useState("");

  const methods = useForm<StepperFormValues>({
    mode: "onTouched",
  });

  const [metadata, setMetadata] = useState<TVideoMetaForm>();
  const [livepeerAsset, setLivepeerAsset] = useState<Asset>();
  const [subtitlesUri, setSubtitlesUri] = useState<string>();
  const [thumbnailUri, setThumbnailUri] = useState<string>();
  const [dbAssetId, setDbAssetId] = useState<number | null>(null);
  const [videoAsset, setVideoAsset] = useState<VideoAsset | null>(null);
  const { isConnected } = useOrbisContext();

  const { address, type, loading } = useUniversalAccount();

  const router = useRouter();

  const {
    trigger,
    handleSubmit,
    setError,
    formState: { isSubmitting, errors },
  } = methods;

  // focus errored input on submit
  useEffect(() => {
    const erroredInputElement =
      document.getElementsByName(erroredInputName)?.[0];
    if (erroredInputElement instanceof HTMLInputElement) {
      erroredInputElement.focus();
      setErroredInputName("");
    }
  }, [erroredInputName]);

  const handleCreateInfoSubmit = (data: TVideoMetaForm) => {
    setMetadata(data);
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  return (
    <>
      <StepperIndicator activeStep={activeStep} />
      {errors.root?.formError && (
        <Alert variant="destructive" className="mt-[28px]">
          <FaExclamationTriangle className="h-4 w-4" />
          <AlertTitle>Form Error</AlertTitle>
          <AlertDescription>{errors.root?.formError?.message}</AlertDescription>
        </Alert>
      )}
      <div className={activeStep === 1 ? "block" : "hidden"}>
        <CreateInfo onPressNext={handleCreateInfoSubmit} />
      </div>
      <div className={activeStep === 2 ? "block" : "hidden"}>
        <FileUpload
          newAssetTitle={metadata?.title}
          metadata={metadata}
          onFileSelect={(file) => {}}
          onFileUploaded={(videoUrl: string) => {}}
          onSubtitlesUploaded={(subtitlesUri?: string) => {
            setSubtitlesUri(subtitlesUri);
          }}
          onPressBack={() =>
            setActiveStep((prevActiveStep) => prevActiveStep - 1)
          }
          onPressNext={(livepeerAsset: any) => {
            setLivepeerAsset(livepeerAsset);
            // Create the video asset in the database and store its ID
            createVideoAsset({
              title: metadata?.title || "",
              asset_id: livepeerAsset.id,
              category: metadata?.category || "",
              location: metadata?.location || "",
              playback_id: livepeerAsset.playbackId || "",
              description: metadata?.description || "",
              creator_id: address || "",
              status: "draft",
              thumbnailUri: "",
              duration: livepeerAsset.duration || null,
              views_count: 0,
              likes_count: 0,
              is_minted: false,
              token_id: null,
              contract_address: null,
              minted_at: null,
              mint_transaction_hash: null,
              royalty_percentage: null,
              price: null,
              max_supply: null,
              current_supply: 0,
              metadata_uri: null,
              attributes: null,
            }).then((dbAsset) => {
              setVideoAsset(dbAsset as VideoAsset);
              setActiveStep((prevActiveStep) => prevActiveStep + 1);
            });
          }}
        />
      </div>
      <div className={activeStep === 3 ? "block" : "hidden"}>
        <CreateThumbnailWrapper
          livePeerAssetId={livepeerAsset?.id}
          thumbnailUri={thumbnailUri}
          onComplete={async (data: {
            thumbnailUri: string;
            nftConfig?: {
              isMintable: boolean;
              maxSupply: number;
              price: number;
              royaltyPercentage: number;
            };
          }) => {
            setThumbnailUri(data.thumbnailUri);

            if (!livepeerAsset || !metadata) {
              throw new Error(
                "Error saving assetMetadata: Missing asset metadata"
              );
            }

            if (!address) {
              toast.error("Wallet address is required to track points.");
              return;
            }

            try {
              // Update the video asset with thumbnail and NFT config using videoAsset.id
              await updateVideoAsset(videoAsset?.id as number, {
                thumbnailUri: data.thumbnailUri,
                status: data.nftConfig?.isMintable ? "mintable" : "published",
                max_supply: data.nftConfig?.maxSupply || null,
                price: data.nftConfig?.price || null,
                royalty_percentage: data.nftConfig?.royaltyPercentage || null,
              });

              // Award points for uploading a video
              await stack.track("video_upload", {
                account: address,
                points: 10,
              });

              const points = await stack.getPoints(address as string);
              toast.success("Video uploaded successfully!", {
                description: `You earned 10 points! Your total balance is now ${points} points.`,
              });

              router.push("/discover");
            } catch (error) {
              console.error("Failed to complete video upload:", error);
              toast.error("Failed to complete video upload", {
                description:
                  "Your video was uploaded but we couldn't save all information.",
              });
            }
          }}
        />
      </div>
    </>
  );
};

export default HookMultiStepForm;
