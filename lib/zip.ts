import JSZip from "jszip";
import { saveAs } from "file-saver";

export type StampResult = {
  caption: string;
  emotion: string;
  dataUrl: string;
};

function dataUrlToBase64(dataUrl: string): string {
  const comma = dataUrl.indexOf(",");
  return comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
}

function pad(n: number, width: number): string {
  return String(n).padStart(width, "0");
}

export async function buildAndDownloadZip(params: {
  stamps: StampResult[];
  main: string;
  tab: string;
  zipName?: string;
}) {
  const { stamps, main, tab, zipName = "line-stamps.zip" } = params;
  const zip = new JSZip();
  const stampsFolder = zip.folder("stickers");

  stamps.forEach((stamp, i) => {
    stampsFolder?.file(
      `${pad(i + 1, 2)}_${stamp.caption}.png`,
      dataUrlToBase64(stamp.dataUrl),
      { base64: true }
    );
  });

  zip.file("main.png", dataUrlToBase64(main), { base64: true });
  zip.file("tab.png", dataUrlToBase64(tab), { base64: true });

  const blob = await zip.generateAsync({ type: "blob" });
  saveAs(blob, zipName);
}
