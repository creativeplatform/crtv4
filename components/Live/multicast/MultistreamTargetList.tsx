// components/live/multistream/MultistreamTargetsList.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  deleteMultistreamTarget,
  MultistreamTarget,
} from "@/services/video-assets";

function MultistreamTargetsList({
  targets,
  onTargetRemoved,
}: MultistreamTargetsListProps) {
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function handleRemove(id: string) {
    setError("");
    setRemovingId(id);
    const result = await deleteMultistreamTarget({ id });
    setRemovingId(null);
    if (result.success) onTargetRemoved(id);
    else setError("Failed to remove target. Please try again.");
  }

  function parseUrl(url: string) {
    // Split into ingestUrl and streamKey
    const lastSlash = url.lastIndexOf("/");
    if (lastSlash === -1) return { ingestUrl: url, streamKey: "" };
    return {
      ingestUrl: url.slice(0, lastSlash),
      streamKey: url.slice(lastSlash + 1),
    };
  }

  return (
    <ul className="flex flex-col gap-2">
      {targets.map((target) => {
        if (!target.id) return null;
        const { ingestUrl, streamKey } = parseUrl(target?.url || "");
        return (
          <li
            key={target.id}
            className="flex flex-col md:flex-row md:items-center md:justify-between border rounded p-2 bg-white/5"
          >
            <div className="flex-1">
              <div className="font-semibold text-white">
                {target.name || (
                  <span className="italic text-gray-400">(No name)</span>
                )}
              </div>
              <div className="text-xs text-gray-300 break-all">
                <span className="font-mono">{ingestUrl}</span>
              </div>
              <div className="text-xs text-gray-400 break-all">
                Stream Key: <span className="font-mono">{streamKey}</span>
              </div>
            </div>
            <Button
              variant="destructive"
              onClick={() => handleRemove(target.id as string)}
              disabled={removingId === target.id}
              className="mt-2 md:mt-0 md:ml-4"
              aria-label="Remove multistream target"
            >
              {removingId === target.id ? "Removing..." : "Remove"}
            </Button>
          </li>
        );
      })}
      {error && <div className="text-xs text-red-500 mt-2">{error}</div>}
    </ul>
  );
}

export { MultistreamTargetsList };

// --- static content and interfaces ---

interface MultistreamTargetsListProps {
  targets: MultistreamTarget[];
  onTargetRemoved: (id: string) => void;
}
