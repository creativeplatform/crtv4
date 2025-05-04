import { Chunk } from "livepeer/models/components";
import * as z from "zod";
import type { Account } from "@/lib/types/account";
export type AssetData = {
  id: string;
  name: string;
  description?: string;
  video?: Asset;
  playbackInfo?: PlaybackInfo;
  views?: Views;
  details?: MintDetails;
  currency?: Currency;
};

export type Asset = {
  id: string;
  type: AssetType; // Changed from optional to required
  playbackId: string; // Made required
  playbackUrl: string; // Made required
  downloadUrl: string; // Made required
  playbackPolicy: {
    type: PlaybackPolicyType; // Ensure this matches the enum
    webhookId: string; // Made required
    webhookContext: {
      streamerId: string; // Made required
    };
    refreshInterval: number; // Made required
    allowedOrigins: string[]; // Changed from tuple to array
  };
  source: {
    type: SourceType; // Ensure this matches the enum
    url: string; // Made required
    gatewayUrl: string; // Made required
    encryption?: Record<string, unknown>; // Optional
  };
  creatorId: {
    type: CreatorIdType; // Ensure this matches the enum
    value: string; // Made required
  };
  profiles: Array<{
    width: number; // Made required
    name: string; // Made required
    height: number; // Made required
    bitrate: number; // Made required
    quality?: number; // Optional
    fps: number; // Made required
    fpsDen?: number; // Optional
    gop?: string; // Optional
    profile: Profile; // Ensure this matches the enum
    encoder: Encoder; // Ensure this matches the enum
  }>;
  storage: {
    ipfs: {
      spec: {
        nftMetadataTemplate: TemplateType; // Ensure this matches the enum
        nftMetadata: Record<string, unknown>; // Made required
      };
      nftMetadata: {
        cid: string; // Made required
        url?: string; // Optional
        gatewayUrl?: string; // Optional
      };
      updatedAt: number; // Made required
    };
    status: {
      phase: StorageStatusPhase; // Ensure this matches the enum
      progress?: number; // Optional
      errorMessage?: string; // Optional
      tasks: {
        pending?: string; // Optional
        last?: string; // Optional
        failed?: string; // Optional
      };
    };
  };
  status: {
    phase: AssetStatusPhase; // Ensure this matches the enum
    updatedAt: number; // Made required
    progress?: number; // Optional
    errorMessage?: string; // Optional
  };
  name: string; // Made required
  projectId?: string; // Optional
  createdAt?: number; // Optional
  createdByTokenName?: string; // Optional
  size?: number; // Optional
  hash?: Array<{
    hash: string; // Made required
    algorithm: string; // Made required
  }> | null; // Optional
  videoSpec?: {
    format: string; // Made required
    duration: number; // Made required
    bitrate: number; // Made required
    tracks: Array<{
      type: AssetType; // Ensure this matches the enum
      codec: string; // Made required
      startTime?: number; // Optional
      duration?: number; // Optional
      bitrate?: number; // Optional
      width?: number; // Optional
      height?: number; // Optional
      pixelFormat?: string; // Optional
      fps?: number; // Optional
      channels?: number; // Optional
      sampleRate?: number; // Optional
      bitDepth?: number; // Optional
    }>;
  };
};

export type PlaybackInfo = {
  type: PlaybackType;
  meta: {
    live?: number;
    playbackPolicy?: {
      type: string;
      webhookId: string;
      webhookContext: {
        streamerId: string;
      };
      refreshInterval: number;
      allowedOrigins: [string];
    };
    source: [
      {
        hrn: "MP4";
        type: "html5/video/mp4";
        url: "https://asset-cdn.lp-playback.monster/hls/1bde4o2i6xycudoy/static360p0.mp4";
        size: 494778;
        width: 204;
        height: 360;
        bitrate: 449890;
      }
    ];
    dvrPlayback?: [
      {
        hrn: MetaSourceHrn;
        type: string;
        url: string;
        error: string;
      }
    ];
    attestation?: {
      id: string;
      primaryType: string;
      domain: {
        name: string;
        version: string;
      };
      message: {
        video: string;
        attestations: [
          {
            role: string;
            address: string;
          }
        ];
        signer: string;
        timestamp: number;
      };
      signature: string;
      createdAt: number;
      signatureType: MetaAttSigType;
      storage: {
        ipfs: {
          updatedAt: number;
          cid: string;
          url: string;
          gatewayUrl: string;
        };
        status: {
          phase: MetaAttStorageStatusPhase;
          progress: number;
          errorMessage: string;
          tasks: {
            pending: string;
            last: string;
            failed: string;
          };
        };
      };
    };
  };
};

export enum AssetType {
  Video = "video",
  Audio = "audio",
}

export enum SourceType {
  Url = "url",
  Recording = "recording",
  DirectUpload = "directUpload",
  Clip = "clip",
}

export enum CreatorIdType {
  Unverified = "unverified",
}

export enum TemplateType {
  File = "file",
  Player = "player",
}

export enum StorageStatusPhase {
  Waiting = "waiting",
  Processing = "processing",
  Ready = "ready",
  Failed = "failed",
  Reverted = "reverted",
}

export enum AssetStatusPhase {
  Uploading = "uploading",
  Waiting = "waiting",
  Processing = "processing",
  Ready = "ready",
  Failed = "failed",
  Deleting = "deleting",
  Deleted = "deleted",
}

export type Views = {
  playbackId: string;
  dStorageUrl: string;
  viewCount: number;
  playtimeMins: number;
};

export type MintDetails = {
  nFTAmountToMint: number;
  pricePerNFT: number;
};

export enum Currency {
  USDC = "USDC",
  ETH = "ETH",
}

export enum PlaybackType {
  Live = "live",
  Vod = "vod",
  Recording = "recording",
}

export enum MetaSourceHrn {
  HLS = "HLS (TS)",
  MP4 = "MP4",
  WebRTC = "WebRTC (H264)",
  FLV = "FLV (H264)",
  Thumbnail = "Thumbnail (JPEG)",
  Thumbnails = "Thumbnails",
}

export enum MetaAttSigType {
  EIP712 = "eip712",
  FLOW = "flow",
}

export enum MetaAttStorageStatusPhase {
  Waiting = "waiting",
  Ready = "ready",
  Processing = "processing",
  Failed = "failed",
  Reverted = "reverted",
}

export type UploadAssetData = {
  name: string;
  staticMp4?: boolean;
  playbackPolicy?: {
    type: PlaybackPolicyType;
    webhookId?: string;
    webhookContext?: Record<string, unknown>;
    refreshInterval?: number;
  };
  creatorId?: {
    type: string;
    value: string;
  };
  storage?: {
    ipfs?: {
      spec?: null;
    };
  };
  url?: string;
  encryption?: {
    encryptedKey: string;
  };
  c2pa?: boolean;
  profiles?: Array<{
    width?: number;
    name?: string;
    height?: number;
    bitrate?: number;
    quality?: number;
    fps?: number;
    fpsDen?: number;
    gop?: string;
    profile?: Profile;
    encoder?: Encoder;
  }>;
  targetSegmentSizesSecs?: number;
};

export enum PlaybackPolicyType {
  Public = "public",
  Jwt = "jwt",
  Webhook = "webhook",
}

export enum Profile {
  H264Baseline = "H264Baseline",
  H264Main = "H264Main",
  H264High = "H264High",
  H264ConstrainedHigh = "H264ConstrainedHigh",
}

export enum Encoder {
  H264 = "H.264",
  HEVC = "HEVC",
  VP8 = "VP8",
  VP9 = "VP9",
}

const MAX_FILESIZE = 1073741824;
const ACCEPTED_VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/mov",
  "video/flv",
  "video/avi",
];

export const createAssetSchema = z.object({
  asset: z
    .custom<File>()
    .refine((file) => file, "Video file must be provided.")
    .refine(
      (file) => file.size <= MAX_FILESIZE,
      "Video file must be less than 1GB."
    )
    .refine(
      (files) => ACCEPTED_VIDEO_TYPES.includes(files?.type),
      ".mp4, .webm, .ogg, .flv, .avi and .mov files are accepted."
    ),
  name: z.string().max(100),
  description: z.string().max(1000),
  creatorId: z.string().max(100),
});

export type CreateAssetType = z.infer<typeof createAssetSchema>;

export type SubtitleResponse = {
  text: string;
  chunks?: Chunk[];
};

export interface UploadAssetRowProps {
  idx: number;
  activeAccount: Account;
  asset: Asset;
}
