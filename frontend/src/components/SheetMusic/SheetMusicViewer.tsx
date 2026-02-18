"use client";

import { useEffect, useRef } from "react";
import { useSheetMusic } from "@/hooks/useSheetMusic";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface SheetMusicViewerProps {
  musicxml: string;
}

export default function SheetMusicViewer({ musicxml }: SheetMusicViewerProps) {
  const { containerRef, isLoading, error, pageCount, initAndRender } = useSheetMusic();
  const prevXmlRef = useRef<string | null>(null);

  useEffect(() => {
    // musicxml이 변경되었을 때만 렌더링 (중복 호출 방지)
    if (musicxml && musicxml !== prevXmlRef.current) {
      prevXmlRef.current = musicxml;
      initAndRender(musicxml);
    }
  }, [musicxml, initAndRender]);

  return (
    <div className="space-y-2">
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size={32} />
          <span className="ml-3 text-gray-500">악보를 렌더링하는 중...</span>
        </div>
      )}
      {error && <p className="text-red-500 text-sm text-center">{error}</p>}
      <div
        id="sheet-music-container"
        ref={containerRef}
        className="w-full bg-white rounded-lg overflow-auto [&_.sheet-page]:mb-4 [&_svg]:w-full [&_svg]:h-auto"
      />
      {pageCount > 0 && !isLoading && (
        <p className="text-xs text-gray-400 text-center print-hidden">{pageCount}페이지</p>
      )}
    </div>
  );
}
