"use client";

import { buildAndDownloadZip, StampResult } from "@/lib/zip";

type Props = {
  stamps: StampResult[];
  main: string;
  tab: string;
  requestedCount: number;
};

export default function StampGallery({
  stamps,
  main,
  tab,
  requestedCount,
}: Props) {
  return (
    <div className="card">
      <div className="result-header">
        <div>
          <strong>
            生成結果: {stamps.length} / {requestedCount} 枚
          </strong>
        </div>
        <button
          type="button"
          className="primary-button"
          style={{ width: "auto" }}
          onClick={() =>
            buildAndDownloadZip({ stamps, main, tab, zipName: "line-stamps.zip" })
          }
        >
          ZIPで一括ダウンロード
        </button>
      </div>

      <div className="special-row">
        <div className="special-item">
          <div className="frame">
            <img src={main} alt="メイン画像" width={80} height={80} />
          </div>
          <span>メイン画像 (240×240)</span>
        </div>
        <div className="special-item">
          <div className="frame">
            <img src={tab} alt="タブ画像" width={80} height={62} />
          </div>
          <span>タブ画像 (96×74)</span>
        </div>
      </div>

      <div className="stamp-grid">
        {stamps.map((stamp, i) => (
          <div className="stamp-card" key={i}>
            <div className="frame">
              <img src={stamp.dataUrl} alt={stamp.caption} />
            </div>
            <div className="caption">{stamp.caption}</div>
          </div>
        ))}
      </div>

      <p className="footnote">
        画像サイズ・仕様は LINE Creators Market
        の目安に合わせて自動調整していますが、提出前に必ず最新のガイドラインをご確認ください。
      </p>
    </div>
  );
}
