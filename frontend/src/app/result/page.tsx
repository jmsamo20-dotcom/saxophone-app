"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useAppStore } from "@/store/useAppStore";
import { fetchMusicXML } from "@/lib/api";
import DownloadButtons from "@/components/SheetMusic/DownloadButtons";
import Button from "@/components/ui/Button";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ErrorMessage from "@/components/ui/ErrorMessage";

const SheetMusicViewer = dynamic(
  () => import("@/components/SheetMusic/SheetMusicViewer"),
  { ssr: false }
);

export default function ResultPage() {
  const router = useRouter();
  const { result, reset } = useAppStore();

  const [musicxml, setMusicxml] = useState<string | null>(null);
  const [loadingXml, setLoadingXml] = useState(false);
  const [xmlError, setXmlError] = useState<string | null>(null);

  // result가 없으면 홈으로
  useEffect(() => {
    if (!result) {
      router.replace("/");
    }
  }, [result, router]);

  // result.job_id가 있으면 MusicXML을 서버에서 fetch
  useEffect(() => {
    if (!result?.job_id) return;

    let cancelled = false;
    setLoadingXml(true);
    setXmlError(null);

    fetchMusicXML(result.job_id)
      .then((xml) => {
        if (!cancelled) setMusicxml(xml);
      })
      .catch((err) => {
        if (!cancelled) setXmlError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoadingXml(false);
      });

    return () => { cancelled = true; };
  }, [result?.job_id]);

  if (!result) {
    return null;
  }

  const handleNewConversion = () => {
    reset();
    router.push("/");
  };

  const warnings = result.metadata.warnings ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between print-hidden">
        <div>
          <h2 className="text-xl font-bold text-gray-800">악보 미리보기</h2>
          <p className="text-sm text-gray-500 mt-1">
            {result.metadata.note_count}개 음표 · 이조: {result.metadata.transposition}
            {result.metadata.tempo_bpm && ` · ${result.metadata.tempo_bpm} BPM`}
          </p>
        </div>
        <Button onClick={handleNewConversion} variant="secondary">
          새로 변환하기
        </Button>
      </div>

      {/* Quality Warnings */}
      {warnings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 print-hidden">
          <div className="flex gap-2">
            <span className="text-yellow-600 text-lg leading-none">&#9888;</span>
            <div className="space-y-1">
              {warnings.map((w, i) => (
                <p key={i} className="text-sm text-yellow-800">{w}</p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Download Buttons */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 print-hidden">
        <DownloadButtons jobId={result.job_id} availableFormats={result.download_urls} />
      </div>

      {/* Sheet Music Preview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 print-sheet">
        {loadingXml && (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size={32} />
            <span className="ml-3 text-gray-500">악보 데이터를 불러오는 중...</span>
          </div>
        )}
        {xmlError && <ErrorMessage message={xmlError} />}
        {musicxml && <SheetMusicViewer musicxml={musicxml} />}
      </div>
    </div>
  );
}
