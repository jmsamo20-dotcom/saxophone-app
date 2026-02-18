export type TranspositionKey = "concert" | "alto_eb" | "tenor_bb";

export type InputMode = "file" | "record" | "youtube";

export interface ConvertResponse {
  job_id: string;
  download_urls: {
    musicxml: string;
    midi: string;
  };
  metadata: {
    note_count: number;
    duration_seconds: number;
    pitch_range: {
      lowest: number;
      highest: number;
    };
    transposition: string;
    tempo_bpm?: number;
    simplified?: boolean;
    warnings?: string[];
  };
}

export interface AppState {
  // Input
  inputMode: InputMode;
  setInputMode: (mode: InputMode) => void;

  // Settings
  transposition: TranspositionKey;
  setTransposition: (t: TranspositionKey) => void;
  simplify: boolean;
  setSimplify: (s: boolean) => void;
  tempoEnabled: boolean;
  setTempoEnabled: (v: boolean) => void;
  tempoBpm: number;
  setTempoBpm: (v: number) => void;

  // Processing state
  isProcessing: boolean;
  progress: number;
  progressMessage: string;
  setProcessing: (isProcessing: boolean, progress?: number, message?: string) => void;

  // Result
  result: ConvertResponse | null;
  setResult: (result: ConvertResponse | null) => void;

  // Error
  error: string | null;
  setError: (error: string | null) => void;

  // Reset
  reset: () => void;
}
