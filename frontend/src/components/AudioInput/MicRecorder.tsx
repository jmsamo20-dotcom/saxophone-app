"use client";

import { useAudioRecorder } from "@/hooks/useAudioRecorder";

interface MicRecorderProps {
  onRecordingComplete: (file: File) => void;
  disabled?: boolean;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function MicRecorder({ onRecordingComplete, disabled }: MicRecorderProps) {
  const { isRecording, duration, startRecording, stopRecording, error } = useAudioRecorder();

  const handleToggle = async () => {
    if (isRecording) {
      const file = await stopRecording();
      if (file) {
        onRecordingComplete(file);
      }
    } else {
      await startRecording();
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 py-6">
      <button
        onClick={handleToggle}
        disabled={disabled}
        className={`
          w-24 h-24 rounded-full flex items-center justify-center
          transition-all transform active:scale-95
          ${isRecording
            ? "bg-red-600 hover:bg-red-700 animate-pulse shadow-lg shadow-red-300"
            : "bg-red-500 hover:bg-red-600 shadow-md"
          }
          ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        `}
      >
        {isRecording ? (
          <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="6" width="12" height="12" rx="2" />
          </svg>
        ) : (
          <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
          </svg>
        )}
      </button>

      <div className="text-center">
        {isRecording ? (
          <>
            <p className="text-red-600 font-semibold text-lg">{formatTime(duration)}</p>
            <p className="text-sm text-gray-500">녹음 중... 정지 버튼을 누르세요</p>
          </>
        ) : (
          <p className="text-gray-600">버튼을 눌러 녹음을 시작하세요</p>
        )}
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
}
