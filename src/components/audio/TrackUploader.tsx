"use client";

import { useLanguage } from "@/components/LanguageProvider";

import { memo, useRef, useState, type DragEvent } from "react";

type TrackUploaderProps = {
  onFiles: (files: File[]) => void;
  loading: boolean;
};

export const TrackUploader = memo(function TrackUploader({ onFiles, loading }: TrackUploaderProps) {
  const { t } = useLanguage();
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);
  const [dragging, setDragging] = useState(false);

  const handleDragEnter = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    dragDepth.current += 1;
    setDragging(true);
  };
  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setDragging(false);
  };
  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    dragDepth.current = 0;
    setDragging(false);
    onFiles(Array.from(event.dataTransfer.files));
  };

  return (
    <div
      className="tape-loader"
      data-dragging={dragging}
      data-loading={loading}
      onDragEnter={handleDragEnter}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        aria-label={t.upload.load}
        accept=".wav,.mp3,audio/wav,audio/mpeg"
        multiple
        onChange={(event) => {
          onFiles(Array.from(event.currentTarget.files ?? []));
          event.currentTarget.value = "";
        }}
      />
      <div className="loader-slot" aria-hidden="true"><span /></div>
      <div>
        <span>{loading ? t.upload.reading : t.upload.input}</span>
        <strong>{dragging ? t.upload.release : t.upload.drop}</strong>
        <small>{t.upload.formats}</small>
      </div>
      <button type="button" onClick={() => inputRef.current?.click()} disabled={loading}>
        {loading ? t.upload.busy : t.upload.load}
      </button>
    </div>
  );
});
