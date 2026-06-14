"""
Extractor de PERFIL (camada 1) — lê connected_channels do Postgres, busca o perfil
de cada canal na TikHub e grava em channel_profiles. Idempotente (upsert por channel_id).

Uso:
  DATABASE_URL=postgres://...  python extract.py [--tenant org_xxx]
TIKHUB_API_KEY vem do .env local. Só perfil por enquanto (limpo/estável);
listas de vídeos/posts são o próximo passo.
"""
import json, os, re, sys, time, pathlib, urllib.request, urllib.error, urllib.parse
import psycopg2
import psycopg2.extras

ROOT = pathlib.Path(__file__).parent
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
DB = os.environ.get("DATABASE_URL") or os.environ.get("DATABASE_POSTGRES_URL")

# ── TikHub client ──────────────────────────────────────────────
def call(path, retries=3):
    """GET na TikHub. 400 'please retry' é transiente (e não cobra) → retenta."""
    url = BASE + path
    for attempt in range(retries):
        req = urllib.request.Request(url, headers={"Authorization": f"Bearer {KEY}", "User-Agent": "laplace-extractor"})
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                return r.status, json.loads(r.read())
        except urllib.error.HTTPError as e:
            try: body = json.loads(e.read())
            except Exception: body = {}
            if e.code == 400 and attempt < retries - 1:
                time.sleep(1.5); continue
            return e.code, body
        except Exception as e:
            return -1, {"message": str(e)}
    return 400, {}

# ── helpers de normalização (defensivos) ───────────────────────
def pick(d, *paths):
    for p in paths:
        cur = d; ok = True
        for part in p.split("."):
            if isinstance(cur, dict) and part in cur: cur = cur[part]
            else: ok = False; break
        if ok and cur not in (None, ""): return cur
    return None

def to_int(v):
    """ '4.58K subscribers' -> 4580 ; '424 videos' -> 424 ; 1234 -> 1234 """
    if v is None: return None
    if isinstance(v, (int, float)): return int(v)
    s = str(v).strip().lower().replace(",", "")
    m = re.search(r"([\d.]+)\s*([km])?", s)
    if not m: return None
    n = float(m.group(1)); mult = {"k": 1e3, "m": 1e6}.get(m.group(2), 1)
    return int(n * mult)

# ── normalizadores por plataforma ──────────────────────────────
def norm_youtube(data):
    return {
        "external_id": pick(data, "channel_id"),
        "display_name": pick(data, "title"),
        "headline": pick(data, "description"),
        "followers": to_int(pick(data, "subscriber_count")),
        "content_count": to_int(pick(data, "video_count")),
        "avatar_url": pick(data, "avatar.0.url") or (data.get("avatar", [{}])[0].get("url") if isinstance(data.get("avatar"), list) and data["avatar"] else None),
    }

def norm_linkedin(data):
    return {
        "external_id": pick(data, "urn", "id", "public_identifier"),
        "display_name": pick(data, "full_name") or " ".join(filter(None, [pick(data, "first_name"), pick(data, "last_name")])),
        "headline": pick(data, "headline"),
        "followers": to_int(pick(data, "follower_count", "followers_count", "num_followers")),
        "content_count": None,
        "avatar_url": pick(data, "profile_picture", "profile_picture_url", "avatar"),
    }

def norm_instagram(data):
    u = data.get("user", data) if isinstance(data, dict) else {}
    return {
        "external_id": pick(u, "pk", "id", "pk_id"),
        "display_name": pick(u, "full_name", "username"),
        "headline": pick(u, "biography"),
        "followers": to_int(pick(u, "follower_count", "edge_followed_by.count")),
        "content_count": to_int(pick(u, "media_count", "edge_owner_to_timeline_media.count")),
        "avatar_url": pick(u, "profile_pic_url_hd", "profile_pic_url"),
    }

def fetch_profile(platform, handle):
    """Retorna (norm_dict, raw_data) ou (None, erro)."""
    h = urllib.parse.quote(handle, safe="@")
    if platform == "youtube":
        s, d = call(f"/api/v1/youtube/web/get_channel_info?channel_id={h}")
        if s == 200 and d.get("data"): return norm_youtube(d["data"]), d["data"]
    elif platform == "linkedin":
        s, d = call(f"/api/v1/linkedin/web/get_user_profile?username={h}")
        if s == 200 and d.get("data"): return norm_linkedin(d["data"]), d["data"]
    elif platform == "instagram":
        s, d = call(f"/api/v1/instagram/v1/fetch_user_info_by_username?username={h}")
        if s == 200 and d.get("data"): return norm_instagram(d["data"]), d["data"]
    else:
        return None, {"error": f"plataforma sem extrator: {platform}"}
    return None, {"http": s, "msg": (d.get("message") or (d.get("detail") or {}).get("message"))}

# ── main ───────────────────────────────────────────────────────
def main():
    tenant = None
    if "--tenant" in sys.argv: tenant = sys.argv[sys.argv.index("--tenant") + 1]
    if not KEY: sys.exit("Falta TIKHUB_API_KEY")
    if not DB: sys.exit("Falta DATABASE_URL")

    conn = psycopg2.connect(DB)
    conn.autocommit = True
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    q = "SELECT id, tenant_id, platform, handle FROM connected_channels WHERE status='active'"
    params = []
    if tenant: q += " AND tenant_id = %s"; params = [tenant]
    cur.execute(q, params)
    channels = cur.fetchall()
    print(f"{len(channels)} canal(is) ativo(s) para extrair.\n")

    for ch in channels:
        norm, raw = fetch_profile(ch["platform"], ch["handle"])
        if not norm:
            print(f"  ✗ {ch['platform']:9} {ch['handle']:28} -> {raw}")
            continue
        cur.execute(
            """INSERT INTO channel_profiles
                 (tenant_id, channel_id, platform, external_id, display_name, headline,
                  followers, content_count, avatar_url, raw, fetched_at)
               VALUES (%(tenant_id)s, %(channel_id)s, %(platform)s, %(external_id)s,
                  %(display_name)s, %(headline)s, %(followers)s, %(content_count)s,
                  %(avatar_url)s, %(raw)s::jsonb, now())
               ON CONFLICT (channel_id) DO UPDATE SET
                  external_id=EXCLUDED.external_id, display_name=EXCLUDED.display_name,
                  headline=EXCLUDED.headline, followers=EXCLUDED.followers,
                  content_count=EXCLUDED.content_count, avatar_url=EXCLUDED.avatar_url,
                  raw=EXCLUDED.raw, fetched_at=now()""",
            {"tenant_id": ch["tenant_id"], "channel_id": ch["id"], "platform": ch["platform"],
             "raw": json.dumps(raw, ensure_ascii=False), **norm},
        )
        print(f"  ✓ {ch['platform']:9} {ch['handle']:28} -> {norm['display_name']!r}"
              f"  followers={norm['followers']}  conteudo={norm['content_count']}")

    cur.close(); conn.close()
    print("\nPronto. Snapshots gravados em channel_profiles.")

if __name__ == "__main__":
    main()
