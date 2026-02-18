import { API_BASE_URL } from "./constants";
import { ConvertResponse, TranspositionKey } from "./types";

const CONVERT_TIMEOUT_MS = 5 * 60 * 1000; // 5분

export async function convertAudio(params: {
  file?: File;
  youtubeUrl?: string;
  transposition: TranspositionKey;
  simplify: boolean;
  tempoBpm?: number;
}): Promise<ConvertResponse> {
  const formData = new FormData();

  if (params.file) {
    formData.append("audio_file", params.file);
  }
  if (params.youtubeUrl) {
    formData.append("youtube_url", params.youtubeUrl);
  }
  formData.append("transposition", params.transposition);
  formData.append("simplify", String(params.simplify));

  if (params.tempoBpm !== undefined) {
    formData.append("tempo_bpm", String(params.tempoBpm));
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CONVERT_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE_URL}/api/convert`, {
      method: "POST",
      body: formData,
      signal: controller.signal,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "알 수 없는 오류" }));
      throw new Error(error.detail || `서버 오류 (${response.status})`);
    }

    return response.json();
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error("서버 응답 시간이 초과되었습니다. 더 짧은 녹음으로 다시 시도해 주세요.");
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export function getDownloadUrl(jobId: string, format: "musicxml" | "midi"): string {
  return `${API_BASE_URL}/api/download/${jobId}/${format}`;
}

export async function fetchMusicXML(jobId: string): Promise<string> {
  const url = getDownloadUrl(jobId, "musicxml");
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("악보 데이터를 불러올 수 없습니다.");
  }
  return response.text();
}

export async function checkHealth(): Promise<{ status: string; ffmpeg: boolean }> {
  const response = await fetch(`${API_BASE_URL}/api/health`);
  return response.json();
}
