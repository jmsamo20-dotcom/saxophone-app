"use client";

import { useState } from "react";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import Button from "@/components/ui/Button";

interface YouTubeInputProps {
  onConvert: (file: File) => void;
  disabled?: boolean;
  wavOnly?: boolean;
}

const MAX_DURATION = 300;

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function YouTubeInput({
  onConvert,
  disabled,
  wavOnly,
}: YouTubeInputProps) {
  const [url, setUrl] = useState("");
  const {
    isRecording,
    duration,
    recordedFile,
    startRecording,
    stopRecording,
    clearRecording,
    error: recorderError,
  } = useAudioRecorder({ maxDuration: MAX_DURATION });

  const videoId = extractVideoId(url);
  const ffmpegUnavailable = wavOnly === true;

  const handleToggleRecording = async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  };

  const handleConvert = () => {
    if (recordedFile) {
      onConvert(recordedFile);
    }
  };

  const handleReset = () => {
    clearRecording();
  };

  // Derived state
  const isIdle = !isRecording && !recordedFile;
  const isRecorded = !isRecording && recordedFile !== null;

  return (
    <div className="space-y-4">
      {/* URL Input */}
      <input
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="YouTube URL을 붙여넣으세요"
        className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base
                   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        disabled={disabled || isRecording}
      />

      {/* YouTube Embed Preview */}
      {videoId && (
        <div className="rounded-lg overflow-hidden aspect-video max-w-md mx-auto">
          <iframe
            width="100%"
            height="100%"
            src={`https://www.youtube.com/embed/${videoId}?playsinline=1`}
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="rounded-lg"
          />
        </div>
      )}

      {/* Guidance */}
      {videoId && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm space-y-1">
          <p className="text-yellow-800 font-semibold">사용 방법</p>
          <p className="text-yellow-700">
            1. 아래 녹음 버튼을 누르세요
          </p>
          <p className="text-yellow-700">
            2. 위 영상에서 <strong>▶ 재생</strong>을 직접 누르세요
          </p>
          <p className="text-yellow-700">
            3. 원하는 부분이 끝나면 녹음을 정지하세요
          </p>
          <p className="text-yellow-600 mt-2">
            스피커로 재생해야 녹음이 잘 돼요 (이어폰 비추천)
          </p>
          <p className="text-yellow-600">
            소리가 작으면 악보가 잘 안 나올 수 있어요. 볼륨을 올려 주세요.
          </p>
          <p className="text-yellow-600">
            최대 5분까지 녹음 가능 (권장: 1~3분)
          </p>
        </div>
      )}

      {/* FFmpeg Warning */}
      {ffmpegUnavailable && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-700 text-sm font-medium">
            이 기능은 FFmpeg 설치가 필요합니다 (PC 서버에 설치).
          </p>
        </div>
      )}

      {/* Recording Controls */}
      {videoId && !ffmpegUnavailable && (
        <div className="flex flex-col items-center gap-3 py-4">
          {/* Record / Stop Toggle Button */}
          {(isIdle || isRecording) && (
            <>
              <button
                onClick={handleToggleRecording}
                disabled={disabled}
                className={`
                  w-20 h-20 rounded-full flex items-center justify-center
                  transition-all transform active:scale-95
                  ${
                    isRecording
                      ? "bg-red-600 hover:bg-red-700 animate-pulse shadow-lg shadow-red-300"
                      : "bg-red-500 hover:bg-red-600 shadow-md"
                  }
                  ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                `}
              >
                {isRecording ? (
                  /* Stop icon */
                  <svg
                    className="w-8 h-8 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <rect x="6" y="6" width="12" height="12" rx="2" />
                  </svg>
                ) : (
                  /* Record icon */
                  <svg
                    className="w-8 h-8 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <circle cx="12" cy="12" r="8" />
                  </svg>
                )}
              </button>

              {isRecording ? (
                <div className="text-center">
                  <p className="text-red-600 font-semibold text-lg">
                    {formatTime(duration)}
                  </p>
                  <p className="text-sm text-gray-700 font-medium">
                    유튜브에서 ▶ 재생을 눌러주세요
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    최대 {Math.floor(MAX_DURATION / 60)}분 후 자동 정지
                  </p>
                </div>
              ) : (
                <p className="text-gray-600 text-sm">녹음 시작</p>
              )}
            </>
          )}

          {/* After Recording: Convert Button */}
          {isRecorded && recordedFile && (
            <div className="w-full space-y-3">
              <div className="flex items-center justify-center gap-2 text-green-700 bg-green-50 rounded-lg p-3">
                <span>녹음 완료</span>
                <span className="text-sm text-green-600">
                  ({formatTime(duration)} /{" "}
                  {(recordedFile.size / 1024).toFixed(0)}KB)
                </span>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleReset}
                  variant="secondary"
                  size="md"
                  className="flex-1"
                  disabled={disabled}
                >
                  다시 녹음
                </Button>
                <Button
                  onClick={handleConvert}
                  disabled={disabled}
                  size="lg"
                  className="flex-[2]"
                >
                  악보 만들기
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {recorderError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-600 text-sm">{recorderError}</p>
        </div>
      )}
    </div>
  );
}
