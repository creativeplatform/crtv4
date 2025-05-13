import { Asset } from "livepeer/models/components";
import VideoDetails from "@/components/Videos/VideoDetails";
import { fetchAssetId } from "@/app/api/livepeer/actions";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Slash } from "lucide-react";
// import { ViewsComponent } from "@/components/Player/ViewsComponent";
import VideoViewMetrics from "@/components/Videos/VideoViewMetrics";

type VideoDetailsPageProps = {
  params: {
    id: string;
  };
};

const fetchAssetData = async (id: string): Promise<Asset | null> => {
  try {
    const response = await fetchAssetId(id);

    if (response?.asset) {
      return response.asset;
    }

    return null;
  } catch (error) {
    console.error("Error fetching asset:", error);
    return null;
  }
};

export default async function VideoDetailsPage({
  params,
}: VideoDetailsPageProps) {
  const assetData: Asset | null = await fetchAssetData(params.id);

  if (!assetData) {
    return <div>Asset not found</div>;
  }

  return (
    <div className="container max-w-7xl content-center">
      <div className="my-5 p-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">
                <span role="img" aria-label="home">
                  🏠
                </span>{" "}
                Home
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <Slash />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbLink href="/discover">Discover</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <Slash />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbLink>
                <BreadcrumbPage>{assetData?.name}</BreadcrumbPage>
              </BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="py-10">
        <VideoDetails asset={assetData} />
        {/* Metrics components */}
        {assetData.playbackId && (
          <div className="flex gap-4 items-center mb-6">
            {/* <ViewsComponent playbackId={assetData.playbackId} /> */}
            <VideoViewMetrics playbackId={assetData.playbackId} />
          </div>
        )}
      </div>
    </div>
  );
}
