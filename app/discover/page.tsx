import VideoCardGrid from "@/components/Videos/VideoCardGrid";
import LivestreamGrid from "@/components/Live/LivestreamGrid";
import OrbisVideoCardGrid from "@/components/Live/LivestreamGrid";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Slash } from "lucide-react";

const AllVideosContent: React.FC = () => {
  return (
    <div className="min-h-screen p-6">
      <div className="mb-8 rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-6 text-center text-4xl font-bold text-gray-800">
          Discover Amazing Videos
        </h1>
        <p className="mb-8 text-center text-gray-600">
          Explore our collection of creative videos from talented creators
          worldwide. Find something inspiring and share it with your friends!
        </p>
      </div>
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
              <BreadcrumbLink>
                <BreadcrumbPage>Discover</BreadcrumbPage>
              </BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Live Streams Section */}
      <div className="mb-8">
        <h2 className="mb-4 text-2xl font-bold">Live Now</h2>
        <LivestreamGrid />
      </div>

      {/* Videos Section */}
      <div>
        <h2 className="my-4 text-2xl font-bold">New Videos</h2>
        <VideoCardGrid />
      </div>
      {/*Orbis Videos Section */}
      <div>
        <h2 className="my-4 text-2xl font-bold">All Videos</h2>
        <OrbisVideoCardGrid />
      </div>
    </div>
  );
};

export default AllVideosContent;
