// components/ThemeToggle/toggleComponent.tsx
"use client";
import { MoonIcon, SunIcon } from "@radix-ui/react-icons";
import { useTheme } from "next-themes"; // Corrected import
import { Button } from "../ui/button";
import { useEffect, useState } from "react";

const ThemeToggleComponent = () => {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null; // Prevent hydration errors
  }
  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      {resolvedTheme === "dark" ? (
        <SunIcon className="h-[1.2rem] w-[1.2rem]" />
      ) : (
        <MoonIcon className="h-[1.2rem] w-[1.2rem]" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
};

export default ThemeToggleComponent;
