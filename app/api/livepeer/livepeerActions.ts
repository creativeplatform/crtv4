"use server";

import { Type, InputCreatorIdType } from "livepeer/models/components";
import { fullLivepeer } from "../../../lib/sdk/livepeer/fullClient";
// import { WebhookContext } from "../livepeer/token-gate/route";
// TODO: Replace the following import path with the correct one where WebhookContext is exported
import type { WebhookContext } from "../livepeer/token-gate/lib/access-control-resolver";

export const getLivepeerUploadUrl = async (
  fileName: string,
  creatorAddress: string,
  tokenId?: string,
  contractAddress?: string,
  tokenGated: boolean = false
) => {
  const createAssetBody: {
    name: string;
    storage: {
      ipfs: boolean;
    };
    creatorId: {
      type: InputCreatorIdType;
      value: string;
    };
    playbackPolicy?: {
      type: Type;
      webhookId: string;
      webhookContext: WebhookContext;
    };
  } = {
    name: fileName,
    storage: {
      ipfs: true,
    },
    creatorId: {
      type: InputCreatorIdType?.Unverified,
      value: creatorAddress,
    },
  };

  if (tokenGated) {
    if (!creatorAddress)
      throw new Error("Creator address is required for token gated assets");
    if (!tokenId)
      throw new Error("Token ID is required for token gated assets");
    if (!contractAddress)
      throw new Error(
        "Token contract address is required for token gated assets"
      );

    createAssetBody.playbackPolicy = {
      type: Type.Webhook,
      webhookId: process.env.LIVEPEER_WEBHOOK_ID as string,
      webhookContext: {
        creatorAddress,
        tokenId,
        contractAddress,
      } as WebhookContext,
    };
  }

  const result = await fullLivepeer.asset.create(createAssetBody);

  return result.data;
};

export const getLivepeerAsset = async (livePeerAssetId: string) => {
  const result = await fullLivepeer.asset.get(livePeerAssetId);

  return result.asset;
};

export const getLivepeerPlaybackInfo = async (playbackId: string) => {
  const result = await fullLivepeer.playback.get(playbackId);

  return result.playbackInfo;
};
