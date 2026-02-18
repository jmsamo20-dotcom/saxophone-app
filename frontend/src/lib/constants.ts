import { TranspositionKey } from "./types";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const TRANSPOSITION_OPTIONS: {
  key: TranspositionKey;
  label: string;
  description: string;
}[] = [
  { key: "concert", label: "Concert C", description: "원음 그대로" },
  { key: "alto_eb", label: "Alto Eb", description: "알토 색소폰용" },
  { key: "tenor_bb", label: "Tenor Bb", description: "테너 색소폰용" },
];

export const MAX_FILE_SIZE_MB = 50;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const ACCEPTED_AUDIO_TYPES: Record<string, string[]> = {
  "audio/wav": [".wav"],
  "audio/mpeg": [".mp3"],
  "audio/ogg": [".ogg"],
  "audio/flac": [".flac"],
  "audio/mp4": [".m4a"],
  "audio/webm": [".webm"],
};
