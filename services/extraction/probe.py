"""
Probe TikHub real responses to lock the normalizers.
Chama endpoints-chave, salva os JSONs em samples/ e imprime o shape do `data`.
Stdlib only — roda sem pip install.  Uso:  python3 probe.py
"""
import json, os, pathlib, urllib.request, urllib.error

ROOT = pathlib.Path(__file__).parent
SAMPLES = ROOT / "samples"; SAMPLES.mkdir(exist_ok=True)
BASE = "https://api.tikhub.io"


def load_env():
    f = ROOT / ".env"
    if f.exists():
        for line in f.read_text().splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())


load_env()
KEY = os.environ.get("TIKHUB_API_KEY", "")


def shape(x):
    if isinstance(x, dict):
        return "{ " + ", ".join(list(x.keys())[:24]) + (" …" if len(x) > 24 else "") + " }"
    if isinstance(x, list):
        return f"[{len(x)}] " + (shape(x[0]) if x else "")
    if isinstance(x, str):
        return f"str({x[:40]!r}…)" if len(x) > 40 else f"str({x!r})"
    return type(x).__name__


def call(path, name):
    url = BASE + path
    req = urllib.request.Request(
        url, headers={"Authorization": f"Bearer {KEY}", "User-Agent": "laplace-probe"}
    )
    try:
        with urllib.request.urlopen(req, timeout=45) as r:
            body, status = r.read().decode(), r.status
    except urllib.error.HTTPError as e:
        body, status = e.read().decode(), e.code
    except Exception as e:
        print(f"\n[{name}] ERROR {e}")
        return
    try:
        data = json.loads(body)
    except Exception:
        print(f"\n[{name}] http={status} non-json: {body[:300]}")
        return
    (SAMPLES / f"{name}.json").write_text(json.dumps(data, ensure_ascii=False, indent=2))
    print(f"\n[{name}] http={status} code={data.get('code')} msg={data.get('message')}")
    d = data.get("data")
    print(f"   data = {shape(d)}")
    if isinstance(d, dict):
        for k, v in list(d.items())[:30]:
            print(f"     - {k}: {shape(v)}")
    elif isinstance(d, list) and d and isinstance(d[0], dict):
        print(f"     item[0] = {shape(d[0])}")


print("KEY present:", bool(KEY), "| len:", len(KEY))
# Instagram — perfil por username (param confirmado: username)
call("/api/v1/instagram/v1/fetch_user_info_by_username?username=natgeo", "ig_user_natgeo")
# YouTube — vídeos do canal V2 (channel_id aceita @handle)
call("/api/v1/youtube/web/get_channel_videos_v2?channel_id=@mkbhd", "yt_channel_videos")
# YouTube — info de vídeo (param confirmado: video_id)
call("/api/v1/youtube/web/get_video_info?video_id=dQw4w9WgXcQ", "yt_video_info")
print("\nSamples salvos em:", SAMPLES)
