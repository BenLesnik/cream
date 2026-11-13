"use client";

import { Loader2, RotateCw } from "lucide-react";
import { useSearch } from "@/store/search";
import { useSettings } from "@/store/settings";
import { Button, Kbd, Switch } from "../ui/primitives";

export function SearchAreaToggle() {
  const pending = useSearch((s) => s.pendingBounds);
  const loading = useSearch((s) => s.loading);
  const drawing = useSearch((s) => s.drawing);
  const polygon = useSearch((s) => s.polygon);
  const searchAsMove = useSettings((s) => s.searchAsMove);
  const set = useSettings((s) => s.set);

  if (drawing) return null;

  return (
    <div className="pointer-events-none absolute inset-x-0 top-3 z-10 flex justify-center">
      {pending && !searchAsMove && !polygon ? (
        <Button
          variant="primary"
          className="pointer-events-auto rounded-full shadow-md"
          onClick={() => useSearch.getState().commitPending()}
        >
          <RotateCw size={14} /> Search this area
        </Button>
      ) : polygon ? null : (
        <label className="pointer-events-auto flex h-9 cursor-pointer items-center gap-2.5 rounded-full border border-line bg-surface/95 pl-3 pr-2 text-[13px] font-medium shadow-md backdrop-blur">
          {loading ? <Loader2 size={14} className="animate-spin text-muted" /> : null}
          Search as I move the map
          <Switch checked={searchAsMove} onCheckedChange={(v) => set("searchAsMove", v)} label="Search as I move the map" />
        </label>
      )}
    </div>
  );
}

export function DrawHelper() {
  const drawing = useSearch((s) => s.drawing);
  if (!drawing) return null;
  return (
    <div className="pointer-events-none absolute inset-x-0 top-3 z-10 flex justify-center px-16">
      <div className="pointer-events-auto flex items-center gap-3 rounded-xl border border-line bg-surface px-3 py-2 shadow-lg animate-pop-in">
        <div className="text-[13px]">
          <div className="font-medium">Draw your search area</div>
          <div className="text-[12px] text-muted">
            Click to add points, click the first point or press <Kbd>Enter</Kbd> to finish. <Kbd>⌫</Kbd> undo
          </div>
        </div>
        <Button size="sm" variant="ghost" onClick={() => useSearch.getState().setDrawing(false)}>
          Cancel
        </Button>
        <Button size="sm" variant="primary" onClick={() => window.dispatchEvent(new Event("kerb:finish-draw"))}>
          Done
        </Button>
      </div>
    </div>
  );
}
