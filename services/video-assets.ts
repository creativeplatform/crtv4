"use server";
// services/video-assets.ts

import sql from "@/lib/sdk/neon/neonClient";
import type { VideoAsset } from "@/lib/types/video-asset";

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
  }
) {
  const result = await sql`
    UPDATE video_assets
    SET 
      thumbnailUri = ${data.thumbnailUri},
      status = ${data.status},
      max_supply = ${data.max_supply},
      price = ${data.price},
      royalty_percentage = ${data.royalty_percentage}
    WHERE id = ${id}
    RETURNING *
  `;
  return result[0];
}
