"use client";

import { useRef, useState } from "react";

type Props = {
  file: File | null;
  onChange: (file: File | null) => void;
};

export default function ImageDropzone({ file, onChange }: Props) {
  const [dragging, setDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(next: File | null) {
    onChange(next);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(next ? URL.createObjectURL(next) : null);
  }

  return (
    <div
      className={`dropzone${dragging ? " dragging" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const dropped = e.dataTransfer.files?.[0];
        if (dropped) handleFile(dropped);
      }}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
      />
      {previewUrl ? (
        <>
          <img src={previewUrl} alt="プレビュー" className="dropzone-preview" />
          <div>{file?.name}</div>
          <div className="hint">クリックまたはドラッグ&ドロップで画像を変更</div>
        </>
      ) : (
        <>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🖼️</div>
          <div>ここに画像をドラッグ&ドロップ、またはクリックして選択</div>
          <div className="hint">PNG / JPEG / WebP、10MBまで</div>
        </>
      )}
    </div>
  );
}
