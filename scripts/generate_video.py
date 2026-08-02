"""ffmpegで1枚の画像からKen Burns風のスライドショー動画(Reels用)を作る。無料・追加API不要。"""
import subprocess

DURATION_SECONDS = 8
FPS = 30
WIDTH = 1080
HEIGHT = 1920


def generate_video(image_path: str, out_path: str) -> str:
    frames = DURATION_SECONDS * FPS
    vf = (
        f"scale={WIDTH * 2}:{HEIGHT * 2},"
        f"zoompan=z='min(zoom+0.0015,1.3)':d={frames}:s={WIDTH}x{HEIGHT}:fps={FPS},"
        "format=yuv420p"
    )
    cmd = [
        "ffmpeg", "-y",
        "-loop", "1",
        "-i", image_path,
        "-vf", vf,
        "-t", str(DURATION_SECONDS),
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        out_path,
    ]
    subprocess.run(cmd, check=True)
    return out_path
