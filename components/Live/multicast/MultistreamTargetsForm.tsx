import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { createMultistreamTarget } from "@/services/video-assets";
import type { MultistreamTarget } from "@/services/video-assets";

const PLATFORMS = [
  {
    label: "YouTube",
    value: "youtube",
    rtmp: "rtmp://a.rtmp.youtube.com/live2/",
  },
  { label: "Twitch", value: "twitch", rtmp: "rtmp://live.twitch.tv/app/" },
  {
    label: "Facebook",
    value: "facebook",
    rtmp: "rtmp://live-api-s.facebook.com:80/rtmp/",
  },
  {
    label: "Twitter",
    value: "twitter",
    rtmp: "rtmp://media.rtmp.twitter.com:1935/rtmp/",
  },
  // Add more as needed
];

interface MultistreamTargetsFormProps {
  onTargetAdded: (target: MultistreamTarget) => void;
}

function MultistreamTargetsForm({
  onTargetAdded,
}: MultistreamTargetsFormProps) {
  const [platform, setPlatform] = useState("youtube");
  const [streamKey, setStreamKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleAddTarget(e: React.FormEvent) {
    e.preventDefault();
    if (!streamKey) return;
    setIsLoading(true);
    const rtmpUrl =
      PLATFORMS.find((p) => p.value === platform)?.rtmp + streamKey;
    const result = await createMultistreamTarget({
      name: platform,
      url: rtmpUrl,
    });
    setIsLoading(false);
    if (result.target) onTargetAdded({ ...result.target, url: rtmpUrl });
    // Optionally handle error
  }

  return (
    <form className="flex flex-col gap-2" onSubmit={handleAddTarget}>
      <Select value={platform} onValueChange={setPlatform}>
        {PLATFORMS.map((p) => (
          <option key={p.value} value={p.value}>
            {p.label}
          </option>
        ))}
      </Select>
      <Input
        placeholder="Stream Key"
        value={streamKey}
        onChange={(e) => setStreamKey(e.target.value)}
      />
      <Button type="submit" disabled={isLoading || !streamKey}>
        Add Target
      </Button>
    </form>
  );
}

export { MultistreamTargetsForm };
