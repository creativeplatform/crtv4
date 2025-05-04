import * as helpers from "@/lib/helpers";
import Link from "next/link";
import type { Asset } from "@/lib/types/asset";
import type { Account } from "@/lib/types/account";

interface UploadAssetRowProps {
  idx: number;
  activeAccount: Account;
  asset: Asset;
}

export function UploadAssetRow({
  idx,
  activeAccount,
  asset,
}: UploadAssetRowProps) {
  if (!activeAccount) return null;

  return (
    <tr key={asset.id} className="text-[16px] hover:bg-muted/50">
      <td className="border border-slate-700 px-4 py-1">{idx + 1}</td>
      <td className="border border-slate-700 px-4 py-1">
        <Link
          href={`/discover/${asset.id}`}
          className="text-primary hover:text-primary/80 hover:underline"
        >
          {helpers.titleCase(
            asset.name.length > 12 ? asset.name.slice(0, 9) + "..." : asset.name
          )}
        </Link>
      </td>
      <td className="border border-slate-700 px-4 py-1">
        {helpers.parseTimestampToDate(Number(asset.createdAt))}
      </td>
      <td className="border border-slate-700 px-4 py-1">
        {helpers.parseTimestampToDate(asset.status?.updatedAt ?? 0)}
      </td>
    </tr>
  );
}

// --- static content and interfaces ---

// If you need to export the interface for use elsewhere:
