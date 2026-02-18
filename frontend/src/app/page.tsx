"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/useAppStore";
import { convertAudio, checkHealth } from "@/lib/api";
import AudioInput from "@/components/AudioInput/AudioInput";
import AdvancedSettings from "@/components/Settings/AdvancedSettings";
import ProgressBar from "@/components/ui/ProgressBar";
import ErrorMessage from "@/components/ui/ErrorMessage";
import Button from "@/components/ui/Button";

export default function HomePage() {
  const router = useRouter();
  const {
    inputMode,
    transposition,
    simplify,
    tempoEnabled,
    tempoBpm,
    isProcessing,
    progress,
    progressMessage,
    error,
    setProcessing,
    setResult,
    setError,
    reset,
  } = useAppStore();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [wavOnly, setWavOnly] = useState(false);

  // 페이지 진입 시 이전 결과 클리어
  useState(() => { reset(); });

  // Health check: FFmpeg 상태 확인
  useEffect(() => {
    checkHealth()
      .then((data) => {
        if (!data.ffmpeg) setWavOnly(true);
      })
      .catch(() => {
        setWavOnly(true);
      });
  }, []);

  const handleFileSelected = (file: File) => {
    setSelectedFile(file);
    setError(null);
  };

  const handleConvert = async (file?: File) => {
    setError(null);

    if (!file) {
      setError("오디오 파일을 선택해 주세요.");
      return;
    }

    setProcessing(true, 10, "오디오 분석 준비 중...");

    try {
      setProcessing(true, 30, "음높이 인식 중...");

      const result = await convertAudio({
        file,
        transposition,
        simplify,
        tempoBpm: tempoEnabled ? tempoBpm : undefined,
      });

      setProcessing(true, 90, "악보 생성 완료!");
      setResult(result);

      setTimeout(() => {
        setProcessing(false);
        router.push("/result");
      }, 500);
    } catch (err) {
      setProcessing(false);
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
    }
  };

  const handleFileConvert = () => {
    if (selectedFile) {
      handleConvert(selectedFile);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center py-4">
        <p className="text-gray-600 text-lg">
          색소폰 연주 음원을 넣으면 악보를 만들어 드립니다
        </p>
      </div>

      {/* Audio Input */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <AudioInput
          onFileSelected={handleFileSelected}
          onConvert={handleConvert}
          disabled={isProcessing}
          wavOnly={wavOnly}
        />

        {/* 파일 선택 정보 (YouTube 탭이 아닐 때만 표시) */}
        {selectedFile && !isProcessing && inputMode !== "youtube" && (
          <div className="mt-4 flex items-center justify-between bg-blue-50 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <span className="text-blue-600">🎵</span>
              <span className="text-sm font-medium text-blue-800">{selectedFile.name}</span>
              <span className="text-xs text-blue-500">
                ({(selectedFile.size / 1024 / 1024).toFixed(1)}MB)
              </span>
            </div>
            <Button onClick={handleFileConvert} size="lg">
              악보 만들기
            </Button>
          </div>
        )}
      </div>

      {/* Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="w-full px-6 py-4 flex items-center justify-between text-left"
        >
          <span className="font-medium text-gray-700">설정</span>
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${showSettings ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {showSettings && (
          <div className="px-6 pb-6">
            <AdvancedSettings />
          </div>
        )}
      </div>

      {/* Processing */}
      {isProcessing && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <ProgressBar progress={progress} message={progressMessage} />
        </div>
      )}

      {/* Error */}
      {error && (
        <ErrorMessage message={error} onDismiss={() => setError(null)} />
      )}
    </div>
  );
}
