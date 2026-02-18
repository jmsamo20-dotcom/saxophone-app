"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { ACCEPTED_AUDIO_TYPES, MAX_FILE_SIZE_MB } from "@/lib/constants";

interface FileUploadProps {
  onFileSelected: (file: File) => void;
  disabled?: boolean;
  wavOnly?: boolean;
}

export default function FileUpload({ onFileSelected, disabled, wavOnly }: FileUploadProps) {
  const [showFfmpegGuide, setShowFfmpegGuide] = useState(false);

  const acceptTypes = wavOnly
    ? { "audio/wav": [".wav"] }
    : ACCEPTED_AUDIO_TYPES;

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFileSelected(acceptedFiles[0]);
      }
    },
    [onFileSelected]
  );

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: acceptTypes,
    maxSize: MAX_FILE_SIZE_MB * 1024 * 1024,
    multiple: false,
    disabled,
  });

  return (
    <div>
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
          transition-colors
          ${isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"}
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3">
          <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 8l3-3m0 0l3 3m-3-3v12m-4 4h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
          <div>
            <p className="text-lg font-medium text-gray-700">
              {isDragActive ? "여기에 놓으세요!" : "오디오 파일을 드래그하거나 클릭하세요"}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {wavOnly ? (
                <>WAV (최대 {MAX_FILE_SIZE_MB}MB)</>
              ) : (
                <>WAV, MP3, OGG, FLAC, M4A (최대 {MAX_FILE_SIZE_MB}MB)</>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* WAV-only badge + FFmpeg guide */}
      {wavOnly && (
        <div className="mt-2 flex items-center gap-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            WAV만 지원
          </span>
          <button
            type="button"
            onClick={() => setShowFfmpegGuide(true)}
            className="text-xs text-blue-600 hover:text-blue-800 underline"
          >
            MP3도 사용하고 싶어요
          </button>
        </div>
      )}

      {fileRejections.length > 0 && (
        <p className="text-red-500 text-sm mt-2">
          {fileRejections[0].errors[0]?.message || "파일을 사용할 수 없습니다."}
        </p>
      )}

      {/* FFmpeg 설치 안내 모달 */}
      {showFfmpegGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-3">
              MP3 등 다른 형식을 사용하려면
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              FFmpeg를 설치하면 MP3, OGG, FLAC, M4A 파일도 변환할 수 있습니다.
            </p>

            <div className="space-y-3 text-sm">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="font-medium text-gray-700 mb-1">방법 1: Chocolatey (추천)</p>
                <p className="text-gray-600">
                  1. 관리자 권한 명령 프롬프트 열기<br />
                  2. <code className="bg-gray-200 px-1 rounded">choco install ffmpeg</code> 입력<br />
                  3. 이 앱의 백엔드 서버 재시작
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <p className="font-medium text-gray-700 mb-1">방법 2: 수동 설치</p>
                <p className="text-gray-600">
                  1. 검색: <strong>&quot;ffmpeg windows download&quot;</strong><br />
                  2. ffmpeg.exe를 다운로드하여 PATH에 추가<br />
                  3. 이 앱의 백엔드 서버 재시작
                </p>
              </div>

              <p className="text-xs text-gray-400">
                Chocolatey 미설치 시: &quot;chocolatey install windows&quot; 검색
              </p>
            </div>

            <button
              onClick={() => setShowFfmpegGuide(false)}
              className="mt-4 w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors min-h-[48px]"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
