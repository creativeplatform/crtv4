"use client";

import { useEffect, useMemo, useState } from "react";
import type { Account } from "@/lib/types/account";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { UploadAssetRow } from "./UploadedAsset";
import {
  AssetType,
  SourceType,
  CreatorIdType,
  AssetStatusPhase,
  StorageStatusPhase,
  PlaybackPolicyType,
  Profile,
  Encoder,
} from "@/lib/types/asset";

// Replace with your actual fetch function
import { fetchAllAssets } from "@/app/api/livepeer/actions";
import type { Asset } from "@/lib/types/asset";

interface ListUploadedAssetsProps {
  activeAccount: Account;
}

function normalizeAsset(asset: any): Asset {
  return {
    id: asset.id,
    type: asset.type ?? AssetType.Video,
    playbackId: asset.playbackId ?? "",
    playbackUrl: asset.playbackUrl ?? "",
    downloadUrl: asset.downloadUrl ?? "",
    playbackPolicy: {
      type: asset.playbackPolicy?.type ?? PlaybackPolicyType.Public,
      webhookId: asset.playbackPolicy?.webhookId ?? "",
      webhookContext: asset.playbackPolicy?.webhookContext ?? {
        streamerId: "",
      },
      refreshInterval: asset.playbackPolicy?.refreshInterval ?? 0,
      allowedOrigins: asset.playbackPolicy?.allowedOrigins ?? [],
    },
    source: {
      type: asset.source?.type ?? SourceType.Url,
      url: asset.source?.url ?? "",
      gatewayUrl: asset.source?.gatewayUrl ?? "",
      encryption: asset.source?.encryption,
    },
    creatorId: {
      type: asset.creatorId?.type ?? CreatorIdType.Unverified,
      value: asset.creatorId?.value ?? "",
    },
    profiles: Array.isArray(asset.profiles)
      ? asset.profiles.map((p: any) => ({
          width: p.width ?? 0,
          name: p.name ?? "",
          height: p.height ?? 0,
          bitrate: p.bitrate ?? 0,
          quality: p.quality,
          fps: p.fps ?? 0,
          fpsDen: p.fpsDen,
          gop: p.gop,
          profile: p.profile ?? Profile.H264Baseline,
          encoder: p.encoder ?? Encoder.H264,
        }))
      : [],
    storage: {
      ipfs: {
        spec: {
          nftMetadataTemplate:
            asset.storage?.ipfs?.spec?.nftMetadataTemplate ?? undefined,
          nftMetadata: asset.storage?.ipfs?.spec?.nftMetadata ?? {},
        },
        nftMetadata: {
          cid: asset.storage?.ipfs?.nftMetadata?.cid ?? "",
          url: asset.storage?.ipfs?.nftMetadata?.url,
          gatewayUrl: asset.storage?.ipfs?.nftMetadata?.gatewayUrl,
        },
        updatedAt: asset.storage?.ipfs?.updatedAt ?? 0,
      },
      status: {
        phase: asset.storage?.status?.phase ?? StorageStatusPhase.Waiting,
        progress: asset.storage?.status?.progress,
        errorMessage: asset.storage?.status?.errorMessage,
        tasks: {
          pending: asset.storage?.status?.tasks?.pending,
          last: asset.storage?.status?.tasks?.last,
          failed: asset.storage?.status?.tasks?.failed,
        },
      },
    },
    status: {
      phase: asset.status?.phase ?? AssetStatusPhase.Waiting,
      updatedAt: asset.status?.updatedAt ?? 0,
      progress: asset.status?.progress,
      errorMessage: asset.status?.errorMessage,
    },
    name: asset.name ?? "",
    projectId: asset.projectId,
    createdAt: asset.createdAt,
    createdByTokenName: asset.createdByTokenName,
    size: asset.size,
    hash: asset.hash,
    videoSpec: asset.videoSpec,
  };
}

export function ListUploadedAssets({ activeAccount }: ListUploadedAssetsProps) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(function fetchAssetsOnMount() {
    async function fetchAssets() {
      setIsLoading(true);
      setError(null);
      try {
        const allAssets = await fetchAllAssets();
        const normalizedAssets = (
          Array.isArray(allAssets) ? allAssets : []
        ).map(normalizeAsset);
        setAssets(normalizedAssets);
      } catch (err) {
        setError("Failed to load assets. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchAssets();
  }, []);

  const filteredAssets = useMemo(
    function filterByCreator() {
      if (!activeAccount?.address) return [];
      return assets.filter(
        (asset) =>
          asset.creatorId &&
          asset.creatorId.value.toLowerCase() ===
            activeAccount.address.toLowerCase()
      );
    },
    [assets, activeAccount?.address]
  );

  if (error)
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );

  if (isLoading)
    return (
      <div className="flex h-40 items-center justify-center">
        <Skeleton className="h-8 w-1/2" />
      </div>
    );

  if (filteredAssets.length === 0)
    return (
      <div className="flex h-40 items-center justify-center">
        <p className="text-muted-foreground">No videos uploaded yet</p>
      </div>
    );

  return (
    <div className="relative overflow-x-auto rounded-lg border">
      <table
        className="w-full table-auto divide-y divide-border"
        role="grid"
        aria-label="Uploaded Assets"
      >
        <thead>
          <tr className="bg-muted/50">
            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
              S/No.
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
              Name
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
              Created
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
              Updated
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {filteredAssets.map((asset, i) => (
            <UploadAssetRow
              key={`${asset.id}-${asset.createdAt}`}
              asset={asset}
              idx={i}
              activeAccount={activeAccount}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
