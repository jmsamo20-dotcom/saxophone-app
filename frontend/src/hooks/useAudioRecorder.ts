"use client";

import { useState, useRef, useCallback } from "react";

interface UseAudioRecorderOptions {
  maxDuration?: number; // seconds, 0 = unlimited
}

interface UseAudioRecorderReturn {
  isRecording: boolean;
  duration: number;
  recordedFile: File | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<File | null>;
  clearRecording: () => void;
  error: string | null;
}

function pickMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "";
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
  ];
  for (const mime of candidates) {
    if (MediaRecorder.isTypeSupported(mime)) return mime;
  }
  return "";
}

function extFromMime(mime: string): string {
  if (mime.includes("webm")) return "webm";
  if (mime.includes("mp4")) return "m4a";
  return "wav";
}

export function useAudioRecorder(
  options: UseAudioRecorderOptions = {}
): UseAudioRecorderReturn {
  const { maxDuration = 0 } = options;

  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [recordedFile, setRecordedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const autoStopRef = useRef<NodeJS.Timeout | null>(null);
  const resolveRef = useRef<((file: File | null) => void) | null>(null);

  const startRecording = useCallback(async () => {
    setError(null);
    setDuration(0);
    setRecordedFile(null);
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      const mimeType = pickMimeType();
      const recorderOptions: MediaRecorderOptions = {};
      if (mimeType) recorderOptions.mimeType = mimeType;

      const mediaRecorder = new MediaRecorder(stream, recorderOptions);

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        if (autoStopRef.current) {
          clearTimeout(autoStopRef.current);
          autoStopRef.current = null;
        }

        const blob = new Blob(chunksRef.current, {
          type: mediaRecorder.mimeType,
        });
        const ext = extFromMime(mediaRecorder.mimeType);
        const file = new File([blob], `recording_${Date.now()}.${ext}`, {
          type: mediaRecorder.mimeType,
        });

        setRecordedFile(file);

        if (resolveRef.current) {
          resolveRef.current(file);
          resolveRef.current = null;
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000);
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);

      if (maxDuration > 0) {
        autoStopRef.current = setTimeout(() => {
          if (
            mediaRecorderRef.current &&
            mediaRecorderRef.current.state === "recording"
          ) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
          }
        }, maxDuration * 1000);
      }
    } catch {
      setError("마이크 권한이 필요해요. 브라우저 권한을 허용해 주세요.");
    }
  }, [maxDuration]);

  const stopRecording = useCallback(async (): Promise<File | null> => {
    return new Promise((resolve) => {
      if (
        !mediaRecorderRef.current ||
        mediaRecorderRef.current.state === "inactive"
      ) {
        resolve(null);
        return;
      }

      resolveRef.current = resolve;
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    });
  }, []);

  const clearRecording = useCallback(() => {
    setRecordedFile(null);
    setDuration(0);
    setError(null);
  }, []);

  return {
    isRecording,
    duration,
    recordedFile,
    startRecording,
    stopRecording,
    clearRecording,
    error,
  };
}
