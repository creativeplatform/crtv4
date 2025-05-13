// components/live/multistream/MultistreamTargetsList.tsx
import { Button } from "@/components/ui/button";
import {
  deleteMultistreamTarget,
  MultistreamTarget,
} from "@/services/video-assets";

interface MultistreamTargetsListProps {
  targets: MultistreamTarget[];
  onTargetRemoved: (id: string) => void;
}

function MultistreamTargetsList({
  targets,
  onTargetRemoved,
}: MultistreamTargetsListProps) {
  async function handleRemove(id?: string) {
    if (!id) return;
    const result = await deleteMultistreamTarget({ id });
    if (result.success) onTargetRemoved(id);
    // Optionally handle error
  }

  return (
    <ul className="flex flex-col gap-2">
      {targets.map((target) => (
        <li key={target.id} className="flex items-center justify-between">
          <span>
            {target.name}{" "}
            <span className="text-xs text-gray-400">{target.url}</span>
          </span>
          <Button variant="destructive" onClick={() => handleRemove(target.id)}>
            Remove
          </Button>
        </li>
      ))}
    </ul>
  );
}

export { MultistreamTargetsList };
