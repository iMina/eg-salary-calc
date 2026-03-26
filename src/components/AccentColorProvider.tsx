"use client";

import { createContext, useContext, useState, useEffect } from "react";

interface AccentColorContextType {
  color: string;
  setColor: (c: string) => void;
  mounted: boolean;
}

const defaultColor = "#4f46e5";

const AccentColorContext = createContext<AccentColorContextType>({
  color: defaultColor,
  setColor: () => {},
  mounted: false,
});

export function AccentColorProvider({ children }: { children: React.ReactNode }) {
  const [color, setColor] = useState<string>(defaultColor);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("app-accent-color");
    if (saved && /^#[0-9A-F]{6}$/i.test(saved)) {
      setColor(saved);
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("app-accent-color", color);
    }
  }, [color, mounted]);

  return (
    <AccentColorContext.Provider value={{ color, setColor, mounted }}>
      {mounted && (
        <style dangerouslySetInnerHTML={{ __html: `
          :root {
            --primary: ${color};
            --ring: ${color};
          }
          .dark {
            --primary: ${color};
            --ring: ${color};
          }
        `}} />
      )}
      {children}
    </AccentColorContext.Provider>
  );
}

export function useAccentColor() {
  return useContext(AccentColorContext);
}
