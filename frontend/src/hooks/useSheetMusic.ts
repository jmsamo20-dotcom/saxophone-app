"use client";

import { useState, useRef, useCallback } from "react";

interface UseSheetMusicReturn {
  containerRef: React.RefObject<HTMLDivElement | null>;
  isLoading: boolean;
  error: string | null;
  pageCount: number;
  initAndRender: (musicxml: string) => Promise<void>;
}

export function useSheetMusic(): UseSheetMusicReturn {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const tkRef = useRef<any>(null);

  const initAndRender = useCallback(async (musicxml: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Lazy-load verovio WASM (only on client)
      if (!tkRef.current) {
        const verovio = await import("verovio");
        const tk = new verovio.toolkit();
        tkRef.current = tk;
      }

      const tk = tkRef.current;
      const container = containerRef.current;
      if (!container) {
        setError("렌더링 컨테이너를 찾을 수 없습니다.");
        setIsLoading(false);
        return;
      }

      // Set options based on container width
      const width = container.clientWidth || 900;
      tk.setOptions({
        pageWidth: Math.round(width * 2.5),
        scale: 40,
        adjustPageHeight: true,
        footer: "none",
        header: "none",
      });

      if (!tk.loadData(musicxml)) {
        setError("MusicXML을 로드할 수 없습니다.");
        setIsLoading(false);
        return;
      }

      const pages = tk.getPageCount();
      setPageCount(pages);

      // Render all pages into container
      let html = "";
      for (let i = 1; i <= pages; i++) {
        html += `<div class="sheet-page">${tk.renderToSVG(i)}</div>`;
      }
      container.innerHTML = html;
    } catch {
      setError("악보 렌더링 엔진을 로드할 수 없습니다.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { containerRef, isLoading, error, pageCount, initAndRender };
}
