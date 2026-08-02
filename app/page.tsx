"use client";

import { useState } from "react";
import ImageDropzone from "@/components/ImageDropzone";
import CountSelector from "@/components/CountSelector";
import StampGallery from "@/components/StampGallery";
import { StampResult } from "@/lib/zip";

type GenerateResponse = {
  stamps: StampResult[];
  main: string;
  tab: string;
  requestedCount: number;
  generatedCount: number;
  errors: string[];
};

export default function Page() {
  const [file, setFile] = useState<File | null>(null);
  const [count, setCount] = useState(8);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateResponse | null>(null);

  async function handleSubmit() {
    if (!file) {
      setError("画像を選択してください。");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("count", String(count));
      formData.append("characterDescription", description);

      const res = await fetch("/api/generate", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "生成に失敗しました。");
      }

      setResult(data);
      if (data.errors?.length) {
        setError(
          `一部のスタンプ生成に失敗しました（${data.errors.length}件）。生成できたものだけ表示しています。`
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "不明なエラーが発生しました。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <div className="header">
        <span className="badge">BETA</span>
      </div>
      <h1>LINEスタンプ自動生成</h1>
      <p className="subtitle">
        画像を1枚アップロードすると、AIが表情・ポーズ違いのLINEスタンプ画像セットを自動生成します。
      </p>

      <div className="card">
        <div className="field">
          <label>元になる画像</label>
          <ImageDropzone file={file} onChange={setFile} />
        </div>

        <div className="field">
          <label>生成するスタンプ数</label>
          <CountSelector value={count} onChange={setCount} />
        </div>

        <div className="field">
          <label>キャラクターの特徴（任意）</label>
          <input
            type="text"
            placeholder="例: 茶色い柴犬、丸メガネの男の子 など"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="hint">
            AIに伝えたい特徴があれば入力してください。空欄でもOKです。
          </div>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={handleSubmit}
          disabled={loading || !file}
        >
          {loading ? "生成中..." : "スタンプを生成する"}
        </button>
        {loading && (
          <p className="progress-note">
            {count}枚生成しています。1〜数分かかる場合があります。
          </p>
        )}
      </div>

      {error && <div className="error-box">{error}</div>}

      {result && (
        <StampGallery
          stamps={result.stamps}
          main={result.main}
          tab={result.tab}
          requestedCount={result.requestedCount}
        />
      )}
    </main>
  );
}
