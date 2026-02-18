"use client";

import { API_BASE_URL } from "@/lib/constants";
import { getDownloadUrl } from "@/lib/api";
import Button from "@/components/ui/Button";

interface DownloadButtonsProps {
  jobId: string;
  availableFormats: {
    musicxml: string;
    midi: string;
  };
}

export default function DownloadButtons({ jobId, availableFormats }: DownloadButtonsProps) {
  const handleDownload = (format: "musicxml" | "midi") => {
    const serverPath = availableFormats[format];
    const url = serverPath
      ? `${API_BASE_URL}${serverPath}`
      : getDownloadUrl(jobId, format);
    window.open(url, "_blank");
  };

  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="flex flex-wrap gap-3 print-hidden">
      <Button onClick={handlePrintPDF} size="lg">
        📄 PDF 저장 (인쇄)
      </Button>
      <Button onClick={() => handleDownload("musicxml")} variant="secondary">
        🎼 MusicXML
      </Button>
      <Button onClick={() => handleDownload("midi")} variant="secondary">
        🎹 MIDI
      </Button>
    </div>
  );
}
