"use client";
import { useState } from "react";
import { createClip } from "@/services/livepeer-clips";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function ClipCreator({ playbackId, sessionId }: ClipCreatorProps) {
  const [name, setName] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ClipResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCreateClip() {
    setIsLoading(true);
    setError(null);
    setResult(null);
    const start = Number(startTime);
    const end = Number(endTime);
    if (!playbackId || !sessionId || !start || !end || end <= start) {
      setError(
        "Please provide valid playbackId, sessionId, start, and end times."
      );
      setIsLoading(false);
      return;
    }
    const res = await createClip({
      playbackId,
      sessionId,
      startTime: start,
      endTime: end,
      name,
    });
    if (res.error) setError(res.error);
    else setResult(res);
    setIsLoading(false);
  }

  return (
    <div className="w-full max-w-3xl mx-auto my-4 px-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <Input
          placeholder="Clip name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1"
        />
        <Input
          placeholder="Start (ms)"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          type="number"
          className="flex-1"
        />
        <Input
          placeholder="End (ms)"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          type="number"
          className="flex-1"
        />
        <Button
          onClick={handleCreateClip}
          disabled={isLoading}
          className="w-full sm:w-auto"
        >
          Create Clip
        </Button>
      </div>
      {error && (
        <Alert variant="destructive" className="mt-2">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {result?.playbackUrl && (
        <Alert className="mt-2">
          <AlertTitle>Clip Created!</AlertTitle>
          <AlertDescription>
            <video
              src={result.playbackUrl}
              controls
              className="w-full max-w-xs rounded shadow"
              style={{ aspectRatio: "16/9" }}
            />
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

interface ClipCreatorProps {
  playbackId: string;
  sessionId: string;
}

interface ClipResult {
  playbackUrl: string;
  assetId: string;
  error?: string;
}
