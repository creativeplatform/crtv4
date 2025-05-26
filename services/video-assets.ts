"use server";
// services/video-assets.ts

import sql from "@/lib/sdk/neon/neonClient";
import type { VideoAsset } from "@/lib/types/video-asset";
import { fullLivepeer } from "@/lib/sdk/livepeer/fullClient";

export async function createVideoAsset(
  data: Omit<VideoAsset, "id" | "created_at" | "updated_at">
) {
  const result = await sql`
    INSERT INTO video_assets (
      title, asset_id, category, location, playback_id, description,
      creator_id, status, thumbnail_url, duration, price, max_supply
    ) VALUES (
      ${data.title}, ${data.asset_id}, ${data.category}, ${data.location},
      ${data.playback_id}, ${data.description},
      ${data.creator_id}, ${data.status}, ${data.thumbnailUri},
      ${data.duration}, ${data.price}, ${data.max_supply}
    )
    RETURNING *
  `;
  return result[0];
}

export async function getVideoAssetById(id: number) {
  const result = await sql`
    SELECT * FROM video_assets WHERE id = ${id}
  `;
  return result[0];
}

export async function updateVideoAssetMintingStatus(
  id: number,
  mintingData: {
    token_id: string;
    contract_address: string;
    mint_transaction_hash: string;
  }
) {
  const result = await sql`
    UPDATE video_assets
    SET 
      is_minted = true,
      token_id = ${mintingData.token_id},
      contract_address = ${mintingData.contract_address},
      mint_transaction_hash = ${mintingData.mint_transaction_hash},
      minted_at = CURRENT_TIMESTAMP,
      status = 'minted'
    WHERE id = ${id}
    RETURNING *
  `;
  return result[0];
}

export async function updateVideoAsset(
  id: number,
  data: {
    thumbnailUri: string;
    status: string;
    max_supply: number | null;
    price: number | null;
    royalty_percentage: number | null;
    metadata_uri?: string | null;
  }
) {
  const result = await sql`
    UPDATE video_assets
    SET 
      thumbnailUri = ${data.thumbnailUri},
      status = ${data.status},
      max_supply = ${data.max_supply},
      price = ${data.price},
      royalty_percentage = ${data.royalty_percentage},
      metadata_uri = ${data.metadata_uri}
    WHERE id = ${id}
    RETURNING *
  `;
  return result[0];
}

export interface MultistreamTarget {
  id?: string;
  name?: string;
  url?: string; // Not in SDK, but we use it for UI
  createdAt?: number;
  userId?: string;
  disabled?: boolean;
}

export interface CreateMultistreamTargetParams {
  streamId: string;
  name: string;
  url: string;
  profile?: string;
  videoOnly?: boolean;
}

export interface CreateMultistreamTargetResult {
  target?: MultistreamTarget;
  error?: string;
}

export async function createMultistreamTarget({
  streamId,
  name,
  url,
  profile = "720p0",
  videoOnly = false,
}: CreateMultistreamTargetParams): Promise<CreateMultistreamTargetResult> {
  if (!streamId || !name || !url)
    return { error: "Missing streamId, name, or URL" };
  try {
    const target = await fullLivepeer.stream.addMultistreamTarget(
      {
        profile,
        videoOnly,
        spec: { name, url },
      },
      streamId
    );
    if (!target) return { error: "Failed to create multistream target" };
    return { target: { ...target, url } };
  } catch (e) {
    return { error: "Failed to create multistream target" };
  }
}

export interface ListMultistreamTargetsResult {
  targets?: MultistreamTarget[];
  error?: string;
}

export async function listMultistreamTargets(): Promise<ListMultistreamTargetsResult> {
  try {
    const targets = await fullLivepeer.multistream.getAll();
    if (!Array.isArray(targets))
      return { error: "Failed to fetch multistream targets" };
    return { targets: targets as MultistreamTarget[] };
  } catch (e) {
    return { error: "Failed to fetch multistream targets" };
  }
}

export interface DeleteMultistreamTargetParams {
  id: string;
}

export interface DeleteMultistreamTargetResult {
  success: boolean;
  error?: string;
}

export async function deleteMultistreamTarget({
  id,
}: DeleteMultistreamTargetParams): Promise<DeleteMultistreamTargetResult> {
  if (!id) return { success: false, error: "Missing target ID" };
  try {
    await fullLivepeer.multistream.delete(id);
    return { success: true };
  } catch (e) {
    return { success: false, error: "Failed to delete multistream target" };
  }
}
