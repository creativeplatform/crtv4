import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createMultistreamTarget } from "@/services/video-assets";
import type { MultistreamTarget } from "@/services/video-assets";
import { z } from "zod";

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

const multistreamTargetSchema = z.object({
  name: z.string().optional(),
  ingestUrl: z.string().url({ message: "Valid ingest URL required" }),
  streamKey: z.string().min(1, "Stream key is required"),
});

interface MultistreamTargetsFormProps {
  onTargetAdded: (target: MultistreamTarget) => void;
  isStreamActive?: boolean;
  streamId: string;
}

function MultistreamTargetsForm({
  onTargetAdded,
  isStreamActive,
  streamId,
}: MultistreamTargetsFormProps) {
  const [form, setForm] = useState({ name: "", ingestUrl: "", streamKey: "" });
  const [errors, setErrors] = useState<{ [k: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [apiError, setApiError] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
  }

  async function handleAddTarget(e: React.FormEvent) {
    e.preventDefault();
    setSuccess("");
    setApiError("");
    const result = multistreamTargetSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: { [k: string]: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setIsLoading(true);
    const { name, ingestUrl, streamKey } = form;
    const url = ingestUrl.endsWith("/")
      ? ingestUrl + streamKey
      : ingestUrl + "/" + streamKey;
    const apiResult = await createMultistreamTarget({ streamId, name, url });
    setIsLoading(false);
    if (apiResult.target) {
      onTargetAdded({ ...apiResult.target, url });
      setSuccess("Target added successfully.");
      setForm({ name: "", ingestUrl: "", streamKey: "" });
    } else {
      setApiError("Failed to add target. Please try again.");
    }
  }

  return (
    <form className="flex flex-col gap-2" onSubmit={handleAddTarget}>
      {isStreamActive && (
        <div className="text-xs text-yellow-500 mb-2">
          Changes to multistream targets will apply to the next session.
        </div>
      )}
      <Input
        name="name"
        placeholder="Target Name (optional)"
        value={form.name}
        onChange={handleChange}
        className=""
      />
      <Input
        name="ingestUrl"
        placeholder="Ingest URL (e.g. rtmp://...)"
        value={form.ingestUrl}
        onChange={handleChange}
        className={errors.ingestUrl ? "border-red-500" : ""}
      />
      {errors.ingestUrl && (
        <div className="text-xs text-red-500">{errors.ingestUrl}</div>
      )}
      <Input
        name="streamKey"
        placeholder="Stream Key"
        value={form.streamKey}
        onChange={handleChange}
        className={errors.streamKey ? "border-red-500" : ""}
      />
      {errors.streamKey && (
        <div className="text-xs text-red-500">{errors.streamKey}</div>
      )}
      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Adding..." : "Add Target"}
      </Button>
      {success && <div className="text-xs text-green-500">{success}</div>}
      {apiError && <div className="text-xs text-red-500">{apiError}</div>}
    </form>
  );
}

export { MultistreamTargetsForm };
