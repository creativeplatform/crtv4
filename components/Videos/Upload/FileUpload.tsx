"use client";
import React, { useState } from "react";
import { toast } from "sonner";
import { CopyIcon } from "lucide-react";
import { getLivepeerUploadUrl } from "@/app/api/livepeer/assetUploadActions";
import * as tus from "tus-js-client";
import PreviewVideo from "./PreviewVideo";
import { useUser } from "@account-kit/react";
import { userToAccount } from "@/lib/types/account";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Subtitles,
  Chunk,
} from "../../../lib/sdk/orbisDB/models/AssetMetadata";
import JsGoogleTranslateFree from "@kreisler/js-google-translate-free";
import { getLivepeerAudioToText } from "@/app/api/livepeer/audioToText";
import Link from "next/link";

const truncateUri = (uri: string): string => {
  if (uri.length <= 30) return uri;
  return uri.slice(0, 15) + "..." + uri.slice(-15);
};

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text).then(() => {
    toast("IPFS URI Copied!");
  });
};

interface FileUploadProps {
  onFileSelect: (file: File | null) => void;
  onFileUploaded: (fileUrl: string) => void;
  onSubtitlesUploaded: (subtitlesUri?: string) => void;
  onPressNext?: (livepeerAsset: any) => void;
  onPressBack?: () => void;
  metadata?: any;
  newAssetTitle?: string;
}

const translateText = async (
  text: string,
  language: string
): Promise<string> => {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_THIRDWEB_AUTH_DOMAIN || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/livepeer/subtitles/translation`, {
      method: "POST",
      body: JSON.stringify({
        text: text,
        source: "English",
        target: language,
      }),
    });

    const data = await res.json();

    console.log("Translation response:", data);

    return data.response;
  } catch (error) {
    console.error("Translation error:", error);
    return text; // Fallback to original text if translation fails
  }
};

async function translateSubtitles(data: {
  chunks: Chunk[];
}): Promise<Subtitles> {
  const subtitles: Subtitles = {
    English: data.chunks,
  };

  const languages = ["Chinese", "German", "Spanish"];

  // Create a single Promise.all for all language translations to reduce nested mapping
  const translationPromises = languages.map(async (language) => {
    try {
      // Skip translation for English
      if (language === "English") return null;
      console.log("Translating to:", language);
      // Perform translations concurrently for each chunk
      const translatedChunks = await Promise.all(
        data.chunks.map(async (chunk, i) => {
          const to =
            language === "Chinese" ? "zh" : language === "German" ? "de" : "es";
          const translation = await JsGoogleTranslateFree.translate({
            to,
            text: chunk.text,
          }); // a
          const arr = {
            text: translation,
            timestamp: chunk.timestamp,
          };
          console.log("Translated chunk " + i + ":", arr);
          return arr;
        })
      );

      console.log("Translated chunks:", translatedChunks);

      return { [language]: translatedChunks };
    } catch (error) {
      console.error("Error translating subtitles:", error);
      return {};
    }
  });

  // Filter out null results and combine translations
  const translations = await Promise.all(translationPromises);
  const languageTranslations = translations.filter(Boolean);

  console.log("translations:", translations);
  console.log("Language translations:", languageTranslations);

  // Merge translations efficiently
  return languageTranslations
    .filter(
      (translation): translation is { [key: string]: Chunk[] } =>
        translation !== null
    )
    .reduce(
      (acc, curr) => ({
        ...acc,
        ...curr,
      }),
      subtitles
    );
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  onFileUploaded,
  onSubtitlesUploaded,
  onPressNext,
  onPressBack,
  metadata,
  newAssetTitle,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadedUri, setUploadedUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [uploadComplete, setUploadComplete] = useState<boolean>(false);
  const [uploadState, setUploadState] = useState<
    "idle" | "loading" | "complete"
  >("idle");
  const [subtitleProcessingComplete, setSubtitleProcessingComplete] =
    useState<boolean>(false);

  const [livepeerAsset, setLivepeerAsset] = useState<any>();

  const user = useUser();
  const account = userToAccount(user);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
    onFileSelect(file);
    console.log("Selected file:", file?.name);
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      setError("Please select a file to upload.");
      return;
    }

    setError(null);
    setUploadState("loading");
    setProgress(0);

    try {
      console.log("Start upload #1");

      const uploadRequestResult = await getLivepeerUploadUrl(
        newAssetTitle || selectedFile.name || "new file name",
        account?.address || "anonymous"
      );

      setLivepeerAsset(uploadRequestResult?.asset);

      const tusUpload = new tus.Upload(selectedFile, {
        endpoint: uploadRequestResult?.tusEndpoint,
        metadata: {
          filename: selectedFile.name,
          filetype: "video/*",
        },
        uploadSize: selectedFile.size,
        onError(err: any) {
          console.error("Error uploading file:", err);
          setError("Failed to upload file. Please try again.");
          setUploadState("idle");
        },
        onProgress(bytesUploaded, bytesTotal) {
          const percentage = Math.round((bytesUploaded / bytesTotal) * 100);
          setProgress(percentage);
        },
        onSuccess() {
          console.log("Upload completed");
          setUploadComplete(true);
          setUploadState("complete");
          if (uploadRequestResult?.asset?.id)
            onFileUploaded(uploadRequestResult.asset.id);
          else setError("Upload succeeded but asset ID is missing.");
        },
      });

      tusUpload.start();
    } catch (err) {
      console.error("Error uploading file:", err);
      setError("Failed to upload file. Please try again.");
      setUploadState("idle");
    }
  };

  const handleAudioToText = async () => {
    if (!livepeerAsset?.id) {
      console.error("No asset ID available");
      return;
    }

    try {
      const data = await getLivepeerAudioToText(livepeerAsset.id);
      console.log("Audio to text data:", data);

      if (data?.chunks) {
        const subtitles = await translateSubtitles(data);
        console.log("Translated subtitles:", subtitles);

        // Store subtitles in IPFS
        const subtitlesBlob = new Blob([JSON.stringify(subtitles)], {
          type: "application/json",
        });
        const subtitlesFile = new File([subtitlesBlob], "subtitles.json", {
          type: "application/json",
        });

        // Upload to IPFS using Livepeer's API
        const formData = new FormData();
        formData.append("file", subtitlesFile);

        const response = await fetch("/api/livepeer/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Failed to upload subtitles to IPFS");
        }

        const { ipfsHash } = await response.json();
        const subtitlesUri = `ipfs://${ipfsHash}`;

        onSubtitlesUploaded(subtitlesUri);
        setSubtitleProcessingComplete(true);
      }
    } catch (error) {
      console.error("Error processing audio to text:", error);
      toast.error("Failed to process audio to text");
    }
  };

  if (!account) {
    return (
      <div className="text-center">
        <p>Please connect your wallet to upload videos</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-white">
      <div className="mx-auto flex min-h-[calc(100vh-200px)] max-w-4xl flex-col px-4 py-8">
        <div className="flex-1 rounded-lg bg-white p-6 shadow-lg sm:p-8">
          <h1 className="mb-8 text-center text-2xl font-semibold text-gray-900">
            Upload A File
          </h1>

          <div className="mx-auto max-w-2xl space-y-8">
            {/* File Input */}
            <div className="space-y-2">
              <label
                htmlFor="file-upload"
                className="block text-sm font-medium text-gray-700"
              >
                Choose A File To Upload:
              </label>
              <input
                type="file"
                id="file-upload"
                accept="video/*"
                className="file:border-1 block w-full rounded-lg border border-gray-200 text-sm text-[#EC407A] 
                file:mr-4 file:cursor-pointer file:rounded-full file:border-0 file:bg-white file:px-4 file:py-2 file:text-sm 
                file:font-semibold file:text-[#EC407A] hover:file:bg-gray-50"
                data-testid="file-upload-input"
                onChange={handleFileChange}
              />
            </div>

            {/* Selected File Section */}
            {selectedFile && (
              <div className="space-y-8">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-500">
                    Selected File
                  </p>
                  <p className="mt-1 text-base text-gray-900">
                    {selectedFile.name}
                  </p>
                </div>

                {/* Video Preview */}
                <div className="overflow-hidden rounded-lg border border-gray-200">
                  <PreviewVideo video={selectedFile} />
                </div>

                {/* Upload Controls */}
                <div className="flex flex-col items-center space-y-4">
                  {uploadState === "idle" ? (
                    <button
                      onClick={handleFileUpload}
                      disabled={!selectedFile}
                      className={`${
                        !selectedFile
                          ? "cursor-not-allowed bg-[#D63A6A] opacity-50"
                          : "bg-[#EC407A] hover:bg-[#D63A6A]"
                      } w-full max-w-xs rounded-lg px-6 py-3 font-semibold text-white shadow-sm transition-colors sm:w-auto`}
                      data-testid="file-input-upload-button"
                    >
                      Upload File
                    </button>
                  ) : (
                    <div className="w-full max-w-md space-y-2">
                      <Progress
                        value={progress}
                        max={100}
                        className="h-2 w-full overflow-hidden rounded-full bg-gray-100"
                      >
                        <div
                          className="h-full bg-[#EC407A] transition-all duration-500 ease-in-out"
                          style={{ width: `${progress}%` }}
                        />
                      </Progress>
                      <p className="text-center text-sm text-gray-600">
                        {uploadState === "complete"
                          ? "Upload Complete!"
                          : `${progress}% uploaded`}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="rounded-lg bg-red-50 p-4">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Success Message */}
            {uploadedUri && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <p className="flex items-center gap-2 text-sm text-green-700">
                  <span>File uploaded successfully! IPFS URI:</span>
                  <Link
                    href={uploadedUri}
                    target="_blank"
                    className="text-green-600 underline hover:text-green-800"
                  >
                    {truncateUri(uploadedUri)}
                  </Link>
                  <button
                    onClick={() => copyToClipboard(uploadedUri)}
                    className="inline-flex items-center gap-1 rounded-md p-1 text-green-600 hover:bg-green-100 hover:text-green-800"
                  >
                    <CopyIcon className="h-4 w-4" />
                    <span className="text-xs">Copy</span>
                  </button>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="mt-6 flex items-center justify-center gap-3">
          {onPressBack && (
            <Button
              variant="outline"
              disabled={uploadState === "loading"}
              onClick={onPressBack}
              className="min-w-[100px]"
            >
              Back
            </Button>
          )}
          {onPressNext && (
            <Button
              disabled={
                uploadState !== "complete" || !subtitleProcessingComplete
              }
              onClick={() => {
                if (livepeerAsset) {
                  onPressNext(livepeerAsset);
                } else {
                  alert("Missing livepeer asset");
                }
              }}
              data-testid="file-input-next"
              className="min-w-[100px]"
            >
              Next
            </Button>
          )}
        </div>

        {uploadComplete && !subtitleProcessingComplete && (
          <div className="mt-4">
            <Button
              onClick={handleAudioToText}
              disabled={uploadState === "loading"}
              className="w-full"
            >
              Process Subtitles
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;
