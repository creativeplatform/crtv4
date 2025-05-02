"use client";
import { useEffect, useState } from "react";
import { Player } from "@/components/Player/Player";
import { Asset } from "livepeer/models/components";
import { fullLivepeer } from "@/lib/sdk/livepeer/fullClient";

export default function VideoDetailsPage({
  params,
}: {
  params: { slug: string };
}) {
  // const [videoDetails, setVideoDetails] = useState();
  const [asset, setAsset] = useState<any>();
  const [isLoading, setIsLoading] = useState(false);
  const [assetLoading, setAssetLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchVideoDetails = async () => {
      setIsLoading(true);
      try {
        await fetchAssetDetails(asset?.assetId);
      } catch (err) {
        setError("Failed to load video data");
        console.error(err);
      }
      setIsLoading(false);
    };

    fetchVideoDetails();
  }, [asset?.assetId, params.slug]);

  const fetchAssetDetails = async (asset: Asset) => {
    setAssetLoading(true);
    try {
      const assetData = await fullLivepeer?.asset.get(`${asset.id}`);
      //console.log('Asset By Id', assetData.asset?.id);
      setAsset(assetData);
    } catch (err) {
      setError("Failed to load asset data");
      console.error(err);
    }
    setAssetLoading(false);
  };

  return (
    <main>
      <h1 className="p-4">Video Detail Page</h1>
      <div className="p-4">Slug: {params.slug}</div>
      {isLoading || assetLoading ? (
        <div>Loading...</div>
      ) : error ? (
        <div style={{ color: "red.500" }}>{error}</div>
      ) : (
        <div className="container max-w-md">
          <h1 className="md my-4">{asset}</h1>
          {asset && <Player src={asset.playbackId} title={asset?.name} />}
        </div>
      )}
    </main>
  );
}
