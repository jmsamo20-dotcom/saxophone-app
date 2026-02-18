"use client";

import { useAppStore } from "@/store/useAppStore";
import { InputMode } from "@/lib/types";
import FileUpload from "./FileUpload";
import MicRecorder from "./MicRecorder";
import YouTubeInput from "./YouTubeInput";

interface AudioInputProps {
  onFileSelected: (file: File) => void;
  onConvert: (file: File) => void;
  disabled?: boolean;
  wavOnly?: boolean;
}

const TABS: { key: InputMode; label: string; icon: string }[] = [
  { key: "file", label: "파일 업로드", icon: "📁" },
  { key: "record", label: "마이크 녹음", icon: "🎤" },
  { key: "youtube", label: "YouTube", icon: "▶" },
];

export default function AudioInput({ onFileSelected, onConvert, disabled, wavOnly }: AudioInputProps) {
  const { inputMode, setInputMode } = useAppStore();

  return (
    <div className="space-y-4">
      {/* Tab buttons */}
      <div className="flex border-b border-gray-200">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setInputMode(tab.key)}
            className={`
              flex-1 py-3 px-4 text-center font-medium transition-colors
              min-h-[48px] text-base
              ${inputMode === tab.key
                ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }
            `}
          >
            <span className="mr-1.5">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="pt-2">
        {inputMode === "file" && (
          <FileUpload onFileSelected={onFileSelected} disabled={disabled} wavOnly={wavOnly} />
        )}
        {inputMode === "record" && (
          <MicRecorder onRecordingComplete={onFileSelected} disabled={disabled} />
        )}
        {inputMode === "youtube" && (
          <YouTubeInput onConvert={onConvert} disabled={disabled} wavOnly={wavOnly} />
        )}
      </div>
    </div>
  );
}
