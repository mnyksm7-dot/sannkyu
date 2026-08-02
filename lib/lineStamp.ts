// LINE Creators Market のスタンプ仕様（2024年時点のガイドラインを参考にした目安値）。
// 提出前に必ず LINE Creators Market の最新規定を確認してください。
export const STAMP_MAX_SIZE = { width: 370, height: 320 };
export const MAIN_IMAGE_SIZE = { width: 240, height: 240 };
export const TAB_IMAGE_SIZE = { width: 96, height: 74 };

export const STAMP_COUNT_OPTIONS = [8, 16, 24, 32, 40] as const;
export type StampCount = (typeof STAMP_COUNT_OPTIONS)[number];

// 各スタンプの「お題」。表情・ポーズ・シーンのバリエーションを与えて
// 1枚の元画像から複数カットを生成するためのプリセット。
// count に応じて先頭から必要な数だけ使用する。
export const STAMP_PRESETS: { emotion: string; caption: string }[] = [
  { emotion: "満面の笑顔で喜んでいる", caption: "やった！" },
  { emotion: "手を振って挨拶している", caption: "おはよう" },
  { emotion: "深くお辞儀している", caption: "ありがとう" },
  { emotion: "涙を流して泣いている", caption: "ごめんね" },
  { emotion: "怒って頬を膨らませている", caption: "もう！" },
  { emotion: "驚いて目を見開いている", caption: "えっ！？" },
  { emotion: "眠そうにあくびしている", caption: "おやすみ" },
  { emotion: "親指を立てて自信満々な顔", caption: "OK!" },
  { emotion: "頬を赤らめてハートを飛ばしている", caption: "大好き" },
  { emotion: "困った顔で頭をかいている", caption: "うーん…" },
  { emotion: "ガッツポーズで張り切っている", caption: "がんばる！" },
  { emotion: "考え込んで首をかしげている", caption: "なるほど" },
  { emotion: "拍手して祝福している", caption: "おめでとう" },
  { emotion: "ぐったり疲れて座り込んでいる", caption: "つかれた…" },
  { emotion: "誇らしげに胸を張っている", caption: "まかせて！" },
  { emotion: "小さくガッカリしてうなだれている", caption: "残念…" },
  { emotion: "ウインクして片目をつぶっている", caption: "よろしく♪" },
  { emotion: "両手を大きく広げて驚喜している", caption: "すごい！" },
  { emotion: "スマホを見て笑っている", caption: "了解！" },
  { emotion: "口に指を当ててお願いしている", caption: "おねがい！" },
  { emotion: "頬杖をついて退屈そうにしている", caption: "ひま〜" },
  { emotion: "力こぶを作って張り切っている", caption: "やるぞ！" },
  { emotion: "小さくお辞儀して謝っている", caption: "すみません" },
  { emotion: "花丸を掲げて褒めている", caption: "さすが！" },
  { emotion: "両手でバツ印を作っている", caption: "だめ！" },
  { emotion: "キラキラした目で見つめている", caption: "いいね！" },
  { emotion: "布団にくるまって眠っている", caption: "zzz…" },
  { emotion: "汗をかいて焦っている", caption: "たいへん！" },
  { emotion: "口を大きく開けて笑っている", caption: "わらった" },
  { emotion: "ハートの目でうっとりしている", caption: "きゅん♡" },
  { emotion: "拳を握って応援している", caption: "ファイト！" },
  { emotion: "手を合わせてお祈りしている", caption: "たのむ！" },
  { emotion: "頬に手を当てて照れている", caption: "てれる〜" },
  { emotion: "腕を組んで得意げにしている", caption: "当然でしょ" },
  { emotion: "コーヒーを飲んで一息ついている", caption: "ひとやすみ" },
  { emotion: "びっくりして飛び上がっている", caption: "うそでしょ！？" },
  { emotion: "指でハートマークを作っている", caption: "love" },
  { emotion: "小走りで急いでいる", caption: "いそげ！" },
  { emotion: "満足げにうなずいている", caption: "よし！" },
  { emotion: "手を大きく振って別れを惜しんでいる", caption: "またね！" },
];

export function getPresetsForCount(count: number) {
  return STAMP_PRESETS.slice(0, count);
}

export function buildStampPrompt(
  emotion: string,
  caption: string,
  characterDescription?: string
) {
  const base = characterDescription?.trim()
    ? `アップロードされた画像のキャラクター（${characterDescription.trim()}）`
    : "アップロードされた画像のキャラクター";

  return [
    `${base}を、LINEスタンプ向けのシンプルでかわいいイラストに変換してください。`,
    `ポーズ・表情: ${emotion}。`,
    `画面内に大きく太いフチ文字（白フチ＋濃い色の縁取り）で「${caption}」という短い日本語テキストを読みやすく配置してください。`,
    "背景は完全に透明にしてください。太めの輪郭線のある、はっきりとしたスタンプ風のデザインにしてください。",
    "キャラクターの見た目（色・特徴）は元画像から一貫させてください。",
    "画像の端はキャラクターやテキストが切れないよう余白を保ってください。",
  ].join("\n");
}
