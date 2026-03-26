"use client";

import { useAccentColor } from "./AccentColorProvider";
import { Palette } from "lucide-react";

// Four preset accent colors
const PRESETS = ["#4f46e5", "#10b981", "#f43f5e", "#f59e0b"];

export function ColorPicker() {
  const { color, setColor, mounted } = useAccentColor();

  if (!mounted) return null;

  return (
    <div className="fixed bottom-6 right-24 z-50 flex items-center bg-card/80 backdrop-blur-md shadow-xl border border-border/50 rounded-full p-2 gap-2 transition-all">
      <div className="flex items-center gap-2 pl-2 pr-1">
        <Palette size={18} className="text-muted-foreground mr-1" />
        
        {PRESETS.map((preset) => (
          <button
            key={preset}
            onClick={() => setColor(preset)}
            className={`w-8 h-8 rounded-full transition-all border-2 box-content ${
              color.toLowerCase() === preset.toLowerCase() ? "border-foreground scale-110 shadow-md" : "border-transparent hover:scale-110"
            }`}
            style={{ backgroundColor: preset }}
            aria-label={`Select color ${preset}`}
          />
        ))}
        
        {/* Custom Color Input disguised as a rainbow wheel */}
        <div className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-border ml-2 flex items-center justify-center transition-all hover:scale-110 hover:border-foreground"
             style={{ background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)' }}>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="absolute inset-0 w-16 h-16 -top-2 -left-2 cursor-pointer opacity-0"
            aria-label="Custom color picker"
          />
        </div>
      </div>
    </div>
  );
}
