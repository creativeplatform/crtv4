"use client";
import { cn } from "@/lib/utils";
import * as React from "react";
import * as Broadcast from "@livepeer/react/broadcast";
import {
  DisableAudioIcon,
  DisableVideoIcon,
  EnableAudioIcon,
  EnableVideoIcon,
  EnterFullscreenIcon,
  ExitFullscreenIcon,
  LoadingIcon,
  OfflineErrorIcon,
  PictureInPictureIcon,
  SettingsIcon,
  StartScreenshareIcon,
  StopIcon,
  StopScreenshareIcon,
} from "@livepeer/react/assets";
import { getIngest } from "@livepeer/react/external";
import { fullLivepeer } from "@/lib/sdk/livepeer/fullClient";
import { toast } from "sonner";
import { Profile, Type } from "livepeer/models/components";
import * as Popover from "@radix-ui/react-popover";
import { CheckIcon, ChevronDownIcon, XIcon } from "lucide-react";
import { useEffect, useRef } from "react";

interface BroadcastProps {
  streamKey: string | null;
}

function BroadcastWithControls({ streamKey }: BroadcastProps) {
  const [isCreatingStream, setIsCreatingStream] = React.useState(false);
  const [streamData, setStreamData] = React.useState<any>(null);
  const settingsButtonRef = React.useRef<HTMLButtonElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  React.useEffect(() => {
    const createStream = async () => {
      if (!streamKey && !isCreatingStream) {
        setIsCreatingStream(true);
        try {
          const result = await fullLivepeer.stream.create({
            name: `Broadcast-${Date.now()}`,
            profiles: [
              {
                width: 854,
                name: "480p",
                height: 480,
                bitrate: 1500000,
                fps: 30,
                fpsDen: 1,
                quality: 23,
                gop: "2",
                profile: Profile.H264Baseline,
              },
            ],
            record: false,
            playbackPolicy: {
              type: Type.Jwt,
            },
          });

          console.log("Stream created:", result);
          setStreamData(result);
          toast.success("Stream created successfully!");
        } catch (error) {
          console.error("Error creating stream:", error);
          toast.error("Failed to create stream. Please try again.");
        } finally {
          setIsCreatingStream(false);
        }
      }
    };

    createStream();
  }, [streamKey, isCreatingStream]);

  useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        streamRef.current = stream;
        // Attach stream to video element, etc.
      } catch (error) {
        // Handle error
      }
    }

    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const ingestUrl = streamData?.ingest?.rtmp?.url || getIngest(streamKey);

  return !ingestUrl ? (
    <BroadcastLoading
      title="Setting up stream"
      description="Please wait while we set up your stream..."
    />
  ) : (
    <div className="scale-120 transform-gpu">
      <Broadcast.Root
        onError={(error) =>
          error?.type === "permissions"
            ? toast.error(
                "You must accept permissions to broadcast. Please try again."
              )
            : null
        }
        aspectRatio={16 / 9}
        ingestUrl={ingestUrl}
      >
        <div className="mx-auto max-w-[576px]">
          <Broadcast.Container className="h-full w-full overflow-hidden rounded-sm bg-gray-950">
            <Broadcast.Video
              title="Live stream"
              className="mx-auto my-auto h-[90%] w-[90%]"
            />

            <Broadcast.LoadingIndicator className="relative h-full w-full">
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <LoadingIcon className="h-8 w-8 animate-spin text-white" />
              </div>
              <BroadcastLoading />
            </Broadcast.LoadingIndicator>

            <Broadcast.ErrorIndicator
              matcher="not-permissions"
              className="absolute inset-0 flex select-none flex-col items-center justify-center 
              gap-4 bg-gray-950 text-center duration-1000 data-[visible=true]:animate-in data-[visible=false]:animate-out 
              data-[visible=false]:fade-out-0 data-[visible=true]:fade-in-0"
            >
              <OfflineErrorIcon className="hidden h-[120px] w-full text-white sm:flex" />
              <div className="flex flex-col gap-1">
                <div className="text-2xl font-bold text-white">
                  Broadcast failed
                </div>
                <div className="text-sm text-white">
                  There was an error with broadcasting - it is retrying in the
                  background.
                </div>
              </div>
            </Broadcast.ErrorIndicator>

            <Broadcast.Controls
              className="flex flex-col-reverse gap-1 bg-gradient-to-b from-black/20 via-black/30 via-80% to-black/60 px-2 py-1.5 duration-1000"
              onTouchStart={(e) => {
                e.preventDefault();
                e.currentTarget.style.opacity = "1";
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
              }}
              style={{ opacity: 1 }}
            >
              <div className="flex justify-between gap-2">
                <div className="flex flex-1 items-center gap-2">
                  <Broadcast.VideoEnabledTrigger className="h-5 w-5 flex-shrink-0 transition hover:scale-110">
                    <Broadcast.VideoEnabledIndicator asChild matcher={false}>
                      <DisableVideoIcon className="h-full w-full text-white" />
                    </Broadcast.VideoEnabledIndicator>
                    <Broadcast.VideoEnabledIndicator asChild matcher={true}>
                      <EnableVideoIcon className="h-full w-full text-white" />
                    </Broadcast.VideoEnabledIndicator>
                  </Broadcast.VideoEnabledTrigger>
                  <Broadcast.AudioEnabledTrigger className="h-5 w-5 flex-shrink-0 transition hover:scale-110">
                    <Broadcast.AudioEnabledIndicator asChild matcher={false}>
                      <DisableAudioIcon className="h-full w-full text-white" />
                    </Broadcast.AudioEnabledIndicator>
                    <Broadcast.AudioEnabledIndicator asChild matcher={true}>
                      <EnableAudioIcon className="h-full w-full text-white" />
                    </Broadcast.AudioEnabledIndicator>
                  </Broadcast.AudioEnabledTrigger>
                </div>
                <div className="flex items-center justify-end gap-2">
                  <Settings
                    ref={settingsButtonRef}
                    className="h-5 w-5 flex-shrink-0 transition hover:scale-110"
                  >
                    <SettingsIcon className="h-full w-full text-white" />
                  </Settings>

                  <Broadcast.ScreenshareTrigger className="h-5 w-5 flex-shrink-0 transition hover:scale-110">
                    <Broadcast.ScreenshareIndicator asChild>
                      <StopScreenshareIcon className="h-full w-full text-white" />
                    </Broadcast.ScreenshareIndicator>
                    <Broadcast.ScreenshareIndicator matcher={false} asChild>
                      <StartScreenshareIcon className="h-full w-full text-white" />
                    </Broadcast.ScreenshareIndicator>
                  </Broadcast.ScreenshareTrigger>

                  <Broadcast.PictureInPictureTrigger className="h-5 w-5 flex-shrink-0 transition hover:scale-110">
                    <PictureInPictureIcon className="h-full w-full text-white" />
                  </Broadcast.PictureInPictureTrigger>

                  <Broadcast.FullscreenTrigger className="h-5 w-5 flex-shrink-0 transition hover:scale-110">
                    <Broadcast.FullscreenIndicator asChild>
                      <ExitFullscreenIcon className="h-full w-full text-white" />
                    </Broadcast.FullscreenIndicator>
                    <Broadcast.FullscreenIndicator matcher={false} asChild>
                      <EnterFullscreenIcon className="h-full w-full text-white" />
                    </Broadcast.FullscreenIndicator>
                  </Broadcast.FullscreenTrigger>
                </div>
              </div>

              <Broadcast.EnabledIndicator
                matcher={false}
                className="flex flex-1 items-center justify-center"
              >
                <Broadcast.EnabledTrigger className="flex items-center justify-center gap-1 rounded-md bg-red-500 px-3 py-1.5 hover:bg-red-700">
                  <EnableVideoIcon className="h-5 w-5 text-white" />
                  <span className="text-xs text-white">Go Live</span>
                </Broadcast.EnabledTrigger>
              </Broadcast.EnabledIndicator>

              <Broadcast.EnabledIndicator asChild>
                <Broadcast.EnabledTrigger
                  className="absolute right-2 top-1 flex items-center justify-center 
                gap-1 rounded-md bg-white/5 px-3 py-1.5 hover:bg-white/10"
                >
                  <StopIcon className="h-5 w-5 text-red-500" />
                  <span className="text-xs text-white">Stop Live</span>
                </Broadcast.EnabledTrigger>
              </Broadcast.EnabledIndicator>
            </Broadcast.Controls>

            <Broadcast.LoadingIndicator asChild matcher={false}>
              <div className="absolute left-1 top-1 flex items-center overflow-hidden rounded-full bg-black/50 px-2 py-1 backdrop-blur">
                <Broadcast.StatusIndicator
                  matcher="live"
                  className="flex items-center gap-1.5"
                >
                  <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
                  <span className="select-none text-xs text-white">LIVE</span>
                </Broadcast.StatusIndicator>

                <Broadcast.StatusIndicator
                  className="flex items-center gap-1.5"
                  matcher="pending"
                >
                  <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-white/80" />
                  <span className="select-none text-xs text-white">
                    PENDING
                  </span>
                </Broadcast.StatusIndicator>

                <Broadcast.StatusIndicator
                  className="flex items-center gap-1.5"
                  matcher="idle"
                >
                  <div className="h-1.5 w-1.5 rounded-full bg-white/80" />
                  <span className="select-none text-xs text-white">IDLE</span>
                </Broadcast.StatusIndicator>
              </div>
            </Broadcast.LoadingIndicator>
          </Broadcast.Container>
        </div>
      </Broadcast.Root>
    </div>
  );
}

export const BroadcastLoading = ({
  title,
  description,
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
}) => (
  <div className="relative flex aspect-video w-full flex-col-reverse gap-2 overflow-hidden rounded-sm bg-white/10 px-2 py-2">
    <div className="flex justify-between">
      <div className="flex items-center gap-1.5">
        <div className="h-5 w-5 animate-pulse overflow-hidden rounded-lg bg-white/5" />
        <div className="h-5 w-14 animate-pulse overflow-hidden rounded-lg bg-white/5" />
      </div>
      <div className="flex items-center gap-1.5">
        <div className="h-5 w-5 animate-pulse overflow-hidden rounded-lg bg-white/5" />
        <div className="h-5 w-5 animate-pulse overflow-hidden rounded-lg bg-white/5" />
      </div>
    </div>
    <div className="h-1.5 w-full animate-pulse overflow-hidden rounded-lg bg-white/5" />
    {title && (
      <div className="absolute inset-8 flex flex-col items-center justify-center gap-1 text-center">
        <span className="text-base font-medium text-white">{title}</span>
        {description && (
          <span className="text-xs text-white">{description}</span>
        )}
      </div>
    )}
  </div>
);

export const Settings = React.forwardRef(
  (
    { className, children }: { className?: string; children?: React.ReactNode },
    ref: React.Ref<HTMLButtonElement> | undefined
  ) => {
    return (
      <Popover.Root>
        <Popover.Trigger ref={ref} asChild>
          <button
            type="button"
            className={className}
            aria-label="Stream settings"
            onClick={(e) => e.stopPropagation()}
          >
            <SettingsIcon className="h-full w-full text-white" />
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            className="w-72 rounded-md border border-white/50 bg-black/80 p-4 shadow-md 
            outline-none backdrop-blur-md data-[state=open]:animate-in data-[state=closed]:animate-out 
            data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 
            data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 
            data-[side=top]:slide-in-from-bottom-2"
            side="top"
            alignOffset={-70}
            align="end"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col gap-3">
              <p className="mb-1 text-base font-medium text-white">
                Stream settings
              </p>

              <div className="flex flex-col gap-2">
                <label
                  className="text-sm font-medium text-white"
                  htmlFor="cameraSource"
                >
                  Camera (&lsquo;c&rsquo; to rotate)
                </label>
                <SourceSelectComposed name="cameraSource" type="videoinput" />
              </div>

              <div className="flex flex-col gap-2">
                <label
                  className="text-sm font-medium text-white"
                  htmlFor="microphoneSource"
                >
                  Microphone (&lsquo;m&rsquo; to rotate)
                </label>
                <SourceSelectComposed
                  name="microphoneSource"
                  type="audioinput"
                />
              </div>
            </div>
            <Popover.Close className="absolute right-2 top-2 inline-flex h-4 w-4 items-center justify-center rounded-full outline-none">
              <XIcon className="h-3 w-3 text-white" />
            </Popover.Close>
            <Popover.Arrow className="fill-white/50" />
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    );
  }
);

export const SourceSelectComposed = React.forwardRef(
  (
    {
      name,
      type,
      className,
    }: { name: string; type: "audioinput" | "videoinput"; className?: string },
    ref: React.Ref<HTMLButtonElement> | undefined
  ) => (
    <Broadcast.SourceSelect name={name} type={type}>
      {(devices) =>
        devices ? (
          <>
            <Broadcast.SelectTrigger
              ref={ref}
              className={cn(
                `flex h-8 w-full items-center justify-between gap-1 overflow-hidden rounded-sm 
                bg-gray-900/80 px-2 py-1.5 text-sm leading-none text-white outline-none outline-1 outline-white/50 
                hover:bg-gray-800/80 disabled:cursor-not-allowed disabled:opacity-70`,
                className
              )}
              aria-label={type === "audioinput" ? "Audio input" : "Video input"}
            >
              <Broadcast.SelectValue
                placeholder={
                  type === "audioinput"
                    ? "Select an audio input"
                    : "Select a video input"
                }
                className="text-white"
              />
              <Broadcast.SelectIcon>
                <ChevronDownIcon className="h-4 w-4 text-white" />
              </Broadcast.SelectIcon>
            </Broadcast.SelectTrigger>
            <Broadcast.SelectPortal>
              <Broadcast.SelectContent className="overflow-hidden rounded-sm border border-white/20 bg-gray-900">
                <Broadcast.SelectViewport className="p-2">
                  <Broadcast.SelectGroup>
                    {devices?.map((device) => (
                      <RateSelectItem
                        key={device.deviceId}
                        value={device.deviceId}
                      >
                        {device.friendlyName}
                      </RateSelectItem>
                    ))}
                  </Broadcast.SelectGroup>
                </Broadcast.SelectViewport>
              </Broadcast.SelectContent>
            </Broadcast.SelectPortal>
          </>
        ) : (
          <span className="text-xs text-white">Error fetching devices</span>
        )
      }
    </Broadcast.SourceSelect>
  )
);

SourceSelectComposed.displayName = "SourceSelectComposed";

const RateSelectItem = React.forwardRef<
  HTMLDivElement,
  Broadcast.SelectItemProps
>(({ children, className, ...props }, forwardedRef) => {
  return (
    <Broadcast.SelectItem
      className={cn(
        `relative flex h-8 select-none items-center rounded-sm pl-[25px] pr-[35px] text-sm leading-none text-white 
        hover:bg-white/10 data-[disabled]:pointer-events-none data-[highlighted]:bg-white/20 data-[disabled]:opacity-50 
        data-[highlighted]:outline-none`,
        className
      )}
      {...props}
      ref={forwardedRef}
    >
      <Broadcast.SelectItemText>{children}</Broadcast.SelectItemText>
      <Broadcast.SelectItemIndicator className="absolute left-0 inline-flex w-[25px] items-center justify-center">
        <CheckIcon className="h-4 w-4 text-white" />
      </Broadcast.SelectItemIndicator>
    </Broadcast.SelectItem>
  );
});

RateSelectItem.displayName = "RateSelectItem";
Settings.displayName = "Settings";

export { BroadcastWithControls as Broadcast };
export default BroadcastWithControls;
