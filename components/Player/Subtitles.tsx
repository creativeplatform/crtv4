// Subtitles.tsx
"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import type { CSSProperties } from "react"; // Use named import with `type`
import { FaClosedCaptioning } from "react-icons/fa";
import {
  MediaScopedProps,
  useMediaContext,
  useStore,
} from "@livepeer/react/player";
import { Chunk } from "livepeer/models/components";

import { Subtitles } from "@/lib/sdk/orbisDB/models/AssetMetadata";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormControl } from "@/components/ui/form";

interface SubtitlesContextType {
  subtitles: Subtitles | undefined;
  setSubtitles: (subtitles: Subtitles) => void;
  showSubtitles: boolean;
  toggleSubtitles: () => void;
  language: string;
  setLanguage: (language: string) => void;
}

const SubtitlesContext = createContext<SubtitlesContextType | undefined>(
  undefined
);

export function SubtitlesProvider({ children }: { children: ReactNode }) {
  const [subtitles, setSubtitles] = useState<Subtitles | undefined>(undefined);
  const [showSubtitles, setShowSubtitles] = useState<boolean>(false);
  const [language, setLanguage] = useState<string>("English");

  const toggleSubtitles = () => {
    setShowSubtitles((prev) => !prev);
  };

  return (
    <SubtitlesContext.Provider
      value={{
        subtitles,
        setSubtitles,
        showSubtitles,
        toggleSubtitles,
        language,
        setLanguage,
      }}
    >
      {children}
    </SubtitlesContext.Provider>
  );
}

export function useSubtitles() {
  const context = useContext(SubtitlesContext);
  if (context === undefined) {
    throw new Error("useSubtitles must be used within a SubtitlesProvider");
  }
  return context;
}

export function SubtitlesControl() {
  const { showSubtitles, toggleSubtitles } = useSubtitles();

  return (
    <button
      onClick={toggleSubtitles}
      aria-label={showSubtitles ? "Disable subtitles" : "Enable subtitles"}
      className={`flex h-8 w-8 items-center justify-center rounded-full ${
        showSubtitles
          ? "bg-background text-foreground"
          : "bg-primary text-primary-foreground"
      }`}
    >
      <FaClosedCaptioning className="h-4 w-4" />
    </button>
  );
}

export type LanguageSelectProps = {
  subtitles: Record<string, Chunk>;
};

export function SubtitlesLanguageSelect() {
  const { subtitles, language, setLanguage } = useSubtitles();

  return (
    <div className="flex flex-col gap-2">
      <label
        className="text-xs font-medium text-white/90"
        htmlFor="languageSelect"
      >
        Subtitles Language
      </label>
      <Select onValueChange={(value) => setLanguage(value)}>
        <FormControl>
          <SelectTrigger
            className={`inline-flex h-7 items-center justify-between gap-1 rounded-sm 
            bg-gray-400 px-1 text-xs leading-none outline-none outline-1 outline-transparent/50`}
          >
            <SelectValue
              className="bg-gray-400 px-1 text-xs leading-none outline-none hover:bg-gray-300 active:bg-gray-300"
              placeholder="English"
            />
          </SelectTrigger>
        </FormControl>
        <SelectContent className="overflow-hidden rounded-sm bg-gray-400 outline-none">
          {Object.keys(subtitles as Subtitles).map((language, i) => {
            return (
              <SelectItem
                className="bg-gray-400 px-1 text-xs leading-none outline-none hover:bg-gray-300 active:bg-gray-300"
                value={language}
                key={i}
              >
                {language}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}

export function SubtitlesDisplay({
  __scopeMedia,
  style,
}: MediaScopedProps & { style?: CSSProperties }) {
  const [currentSubtitle, setCurrentSubtitle] = useState<string>("");

  const { subtitles, language, showSubtitles } = useSubtitles();

  const context = useMediaContext("CurrentSource", __scopeMedia);
  const { progress, fullscreen } = useStore(
    context.store,
    ({ progress, fullscreen }) => ({
      progress,
      fullscreen,
    })
  );

  useEffect(() => {
    const updateSubtitle = () => {
      const currentTime = progress ?? 0;
      const languageSubtitles = subtitles?.[language];

      if (!languageSubtitles) {
        setCurrentSubtitle("");
        return;
      }

      const activeSubtitle = languageSubtitles.find(
        (subtitle: Chunk) =>
          currentTime >= subtitle.timestamp[0] &&
          currentTime < subtitle.timestamp[1]
      );

      setCurrentSubtitle(activeSubtitle?.text ?? "");
    };
    updateSubtitle();
  }, [progress, subtitles, language]);

  if (!showSubtitles) return null;

  return (
    <>
      <div
        className="absolute bottom-12 left-0 right-0 text-center"
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          color: "white",
          padding: "8px",
          fontSize: "18px",
          fontWeight: "bold",
          textShadow: "1px 1px 2px black",
        }}
      >
        {currentSubtitle}
      </div>
    </>
  );
}
