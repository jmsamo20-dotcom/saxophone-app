import { create } from "zustand";
import { AppState, ConvertResponse, InputMode, TranspositionKey } from "@/lib/types";

const SESSION_KEY = "sax_result";

function saveToSession(result: ConvertResponse) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(result));
  } catch {
    // sessionStorage 접근 불가 시 무시
  }
}

function loadFromSession(): ConvertResponse | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // SSR 또는 접근 불가 시
  }
  return null;
}

function clearSession() {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // 무시
  }
}

export const useAppStore = create<AppState>((set) => ({
  // Input
  inputMode: "file" as InputMode,
  setInputMode: (mode) => set({ inputMode: mode, error: null }),

  // Settings
  transposition: "concert" as TranspositionKey,
  setTransposition: (transposition) => set({ transposition }),
  simplify: false,
  setSimplify: (simplify) => set({ simplify }),
  tempoEnabled: false,
  setTempoEnabled: (tempoEnabled) => set({ tempoEnabled }),
  tempoBpm: 120,
  setTempoBpm: (tempoBpm) => set({ tempoBpm }),

  // Processing
  isProcessing: false,
  progress: 0,
  progressMessage: "",
  setProcessing: (isProcessing, progress = 0, message = "") =>
    set({ isProcessing, progress, progressMessage: message }),

  // Result
  result: null,
  setResult: (result) => {
    if (result) {
      saveToSession(result);
    } else {
      clearSession();
    }
    set({ result });
  },

  // Error
  error: null,
  setError: (error) => set({ error }),

  // Reset
  reset: () => {
    clearSession();
    set({
      isProcessing: false,
      progress: 0,
      progressMessage: "",
      result: null,
      error: null,
    });
  },
}));

// 클라이언트에서 sessionStorage 복원 (hydration)
if (typeof window !== "undefined") {
  const stored = loadFromSession();
  if (stored) {
    useAppStore.setState({ result: stored });
  }
}
