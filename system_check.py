#!/usr/bin/env python3
"""
The Artist Engine — deep system check + mastering benchmarks.

Usage (from repo root):
  backend\\cognee_env\\Scripts\\python.exe system_check.py
  backend\\cognee_env\\Scripts\\python.exe system_check.py --base-url http://127.0.0.1:8001
  backend\\cognee_env\\Scripts\\python.exe system_check.py --skip-worker --skip-api

Prints markdown tables suitable for pasting into chat.
"""

from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys
import tempfile
import time
import traceback
from pathlib import Path

ROOT = Path(__file__).resolve().parent
BACKEND = ROOT / "backend"
TEMP = BACKEND / "temp"
PROD_URL = "https://the-artist-engine-zbl1.onrender.com"

# Keep uploads/masters practical for free-tier Render + laptop browsers
MAX_UPLOAD_MB = 80


def hr(title: str) -> None:
    print()
    print(f"## {title}")
    print()


def ok(msg: str) -> str:
    return f"PASS | {msg}"


def fail(msg: str) -> str:
    return f"FAIL | {msg}"


def warn(msg: str) -> str:
    return f"WARN | {msg}"


def check_import(name: str) -> tuple[bool, str]:
    try:
        mod = __import__(name)
        ver = getattr(mod, "__version__", "?")
        return True, f"{name} {ver}"
    except Exception as e:
        return False, f"{name}: {type(e).__name__}: {e}"


def synth_wav(path: Path, seconds: float = 8.0, sr: int = 44100, stereo: bool = True, seed: int = 42) -> Path:
    """Write a synthetic stereo mix rich enough for Matchering analysis.

    Pure sines can fail Matchering's spectral matcher; add noise, detune, and
    amplitude modulation so reference-match mode is reliable in CI.
    """
    import numpy as np
    import soundfile as sf

    rng = np.random.default_rng(seed)
    n = int(sr * seconds)
    t = np.linspace(0, seconds, n, endpoint=False)
    # broadband-ish "mix": bass + mid + high + noise + AM
    left = 0.22 * np.sin(2 * np.pi * 98 * t)
    left += 0.16 * np.sin(2 * np.pi * 220 * t + 0.1)
    left += 0.12 * np.sin(2 * np.pi * 554 * t)
    left += 0.09 * np.sin(2 * np.pi * 1760 * t)
    left += 0.06 * np.sin(2 * np.pi * 4200 * t)
    left += 0.04 * rng.standard_normal(n)
    left *= 0.85 + 0.15 * np.sin(2 * np.pi * 2.5 * t)
    env = np.minimum(1.0, t * 8) * np.minimum(1.0, (seconds - t) * 8)
    left = np.clip(left * env, -0.95, 0.95).astype(np.float32)
    if stereo:
        right = 0.20 * np.sin(2 * np.pi * 110 * t)
        right += 0.14 * np.sin(2 * np.pi * 330 * t)
        right += 0.10 * np.sin(2 * np.pi * 880 * t)
        right += 0.08 * np.sin(2 * np.pi * 2500 * t)
        right += 0.05 * rng.standard_normal(n)
        right *= 0.85 + 0.15 * np.sin(2 * np.pi * 1.7 * t + 0.5)
        right = np.clip(right * env, -0.95, 0.95).astype(np.float32)
        data = np.stack([left, right], axis=1)
    else:
        data = left
    path.parent.mkdir(parents=True, exist_ok=True)
    sf.write(str(path), data, sr, subtype="PCM_16")
    return path


def peak_rss_mb() -> float | None:
    try:
        import psutil  # type: ignore

        return psutil.Process(os.getpid()).memory_info().rss / (1024 * 1024)
    except Exception:
        return None


def run_worker_benchmarks() -> list[dict]:
    """Run matcher_worker.py on synthetic (and optional fixture) audio."""
    sys.path.insert(0, str(BACKEND))
    from audio_meters import measure_audio  # noqa: WPS433

    py = sys.executable
    worker = BACKEND / "matcher_worker.py"
    results: list[dict] = []

    with tempfile.TemporaryDirectory(prefix="engine_bench_") as td:
        td_path = Path(td)
        # Different seeds so target ≠ reference (Matchering can fail on identical files)
        short_t = synth_wav(td_path / "target_8s.wav", seconds=8.0, seed=1)
        short_r = synth_wav(td_path / "ref_8s.wav", seconds=8.0, seed=2)
        med_t = synth_wav(td_path / "target_90s.wav", seconds=90.0, seed=3)
        med_r = synth_wav(td_path / "ref_90s.wav", seconds=90.0, seed=4)

        # Prefer real fixtures when present and non-tiny
        fixture_t = TEMP / "test_target.wav"
        fixture_r = TEMP / "test_ref.wav"
        cases: list[tuple[str, Path, Path | None, list[str]]] = [
            ("pure_8s", short_t, None, ["50", "50", "50", "50"]),
            ("ref_8s", short_t, short_r, ["50", "55", "45", "60"]),
            ("pure_8s_lufs14", short_t, None, ["50", "50", "50", "50", "--lufs=-14"]),
            ("ref_8s_knobs", short_t, short_r, ["65", "70", "60", "55", "--warmth=55", "--presence=60", "--ref_influence=80"]),
            ("pure_90s", med_t, None, ["50", "50", "50", "50"]),
            ("ref_90s", med_t, med_r, ["50", "50", "50", "50"]),
        ]
        if fixture_t.exists() and fixture_t.stat().st_size > 10_000:
            cases.append(
                (
                    "fixture_pure",
                    fixture_t,
                    None,
                    ["50", "50", "50", "50"],
                )
            )
            if fixture_r.exists() and fixture_r.stat().st_size > 1000:
                cases.append(
                    (
                        "fixture_ref",
                        fixture_t,
                        fixture_r,
                        ["50", "50", "50", "50"],
                    )
                )

        for name, target, ref, args in cases:
            out = td_path / f"out_{name}.wav"
            ref_arg = str(ref) if ref else "NONE"
            cmd = [
                py,
                str(worker),
                str(target),
                ref_arg,
                str(out),
                *args,
            ]
            # Run from backend so relative imports/cwd match production
            rss_before = peak_rss_mb()
            t0 = time.perf_counter()
            try:
                proc = subprocess.run(
                    cmd,
                    cwd=str(BACKEND),
                    capture_output=True,
                    text=True,
                    timeout=600,
                )
            except subprocess.TimeoutExpired:
                results.append(
                    {
                        "case": name,
                        "ok": False,
                        "sec": 600,
                        "exit": -1,
                        "error": "timeout>600s",
                    }
                )
                continue
            elapsed = time.perf_counter() - t0
            rss_after = peak_rss_mb()

            row: dict = {
                "case": name,
                "ok": proc.returncode == 0 and out.exists(),
                "sec": round(elapsed, 2),
                "exit": proc.returncode,
                "out_mb": round(out.stat().st_size / (1024 * 1024), 3) if out.exists() else 0,
                "rss_delta_mb": (
                    round(rss_after - rss_before, 1)
                    if rss_before is not None and rss_after is not None
                    else None
                ),
            }
            if proc.returncode != 0:
                err = (proc.stderr or proc.stdout or "")[-400:]
                row["error"] = err.replace("\n", " ")[:300]
            elif out.exists():
                m = measure_audio(out)
                row.update(
                    {
                        "lufs": m.get("lufs_integrated"),
                        "true_peak_db": m.get("true_peak_db"),
                        "crest_db": m.get("crest_factor_db"),
                        "duration_s": m.get("duration_sec"),
                        "sr": m.get("sample_rate"),
                    }
                )
            results.append(row)
            status = "OK" if row["ok"] else "FAIL"
            print(f"  [{status}] {name}: {row['sec']}s exit={row['exit']}")

    return results


def print_bench_table(rows: list[dict]) -> None:
    headers = [
        "case",
        "ok",
        "sec",
        "out_mb",
        "lufs",
        "true_peak_db",
        "duration_s",
        "rss_delta_mb",
    ]
    print("| " + " | ".join(headers) + " |")
    print("| " + " | ".join(["---"] * len(headers)) + " |")
    for r in rows:
        print(
            "| "
            + " | ".join(str(r.get(h, "")) for h in headers)
            + " |"
        )


def probe_env() -> list[str]:
    lines: list[str] = []
    lines.append(f"python: {sys.version.split()[0]} @ {sys.executable}")
    lines.append(f"cwd: {os.getcwd()}")
    lines.append(f"backend: {BACKEND} exists={BACKEND.exists()}")

    for mod in (
        "matchering",
        "pedalboard",
        "soundfile",
        "numpy",
        "resampy",
        "pyloudnorm",
        "fastapi",
        "uvicorn",
        "pydub",
    ):
        good, msg = check_import(mod)
        lines.append(ok(msg) if good else fail(msg))

    ffmpeg = shutil.which("ffmpeg")
    lines.append(ok(f"ffmpeg: {ffmpeg}") if ffmpeg else fail("ffmpeg not on PATH"))

    TEMP.mkdir(parents=True, exist_ok=True)
    usage = shutil.disk_usage(str(TEMP))
    free_gb = usage.free / (1024**3)
    lines.append(
        ok(f"disk free {free_gb:.1f} GB at temp/")
        if free_gb > 1
        else warn(f"disk free only {free_gb:.1f} GB")
    )

    # Optional fixture inventory
    fixtures = list(TEMP.glob("test_*.wav")) + list(TEMP.glob("LIVE_*.wav"))
    lines.append(f"fixtures in temp/: {len(list(TEMP.glob('*.wav')))} wav files")
    if fixtures:
        lines.append(ok(f"named fixtures: {', '.join(p.name for p in fixtures[:6])}"))

    return lines


def http_get(url: str, headers: dict | None = None, timeout: float = 60.0) -> tuple[int, float, str]:
    import urllib.request
    import urllib.error

    req = urllib.request.Request(url, headers=headers or {}, method="GET")
    t0 = time.perf_counter()
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            body = resp.read(8000).decode("utf-8", errors="replace")
            return resp.status, time.perf_counter() - t0, body
    except urllib.error.HTTPError as e:
        body = e.read(2000).decode("utf-8", errors="replace")
        return e.code, time.perf_counter() - t0, body
    except Exception as e:
        return 0, time.perf_counter() - t0, f"{type(e).__name__}: {e}"


def http_json(
    method: str,
    url: str,
    data: dict | None = None,
    headers: dict | None = None,
    timeout: float = 60.0,
) -> tuple[int, float, any]:
    import urllib.request
    import urllib.error

    body = None
    hdrs = {"Accept": "application/json", **(headers or {})}
    if data is not None:
        body = json.dumps(data).encode("utf-8")
        hdrs["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=body, headers=hdrs, method=method)
    t0 = time.perf_counter()
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            raw = resp.read().decode("utf-8", errors="replace")
            try:
                return resp.status, time.perf_counter() - t0, json.loads(raw)
            except Exception:
                return resp.status, time.perf_counter() - t0, raw
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8", errors="replace")
        try:
            payload = json.loads(raw)
        except Exception:
            payload = raw
        return e.code, time.perf_counter() - t0, payload
    except Exception as e:
        return 0, time.perf_counter() - t0, f"{type(e).__name__}: {e}"


def multipart_master(
    base: str,
    token: str | None,
    target: Path,
    ref: Path | None,
    timeout: float = 300.0,
) -> tuple[int, float, str]:
    """POST /api/master with multipart form (stdlib only)."""
    import uuid
    import urllib.request
    import urllib.error

    boundary = f"----EngineBoundary{uuid.uuid4().hex}"
    parts: list[bytes] = []

    def add_field(name: str, value: str) -> None:
        parts.append(
            (
                f"--{boundary}\r\n"
                f'Content-Disposition: form-data; name="{name}"\r\n\r\n'
                f"{value}\r\n"
            ).encode()
        )

    def add_file(name: str, path: Path, filename: str) -> None:
        parts.append(
            (
                f"--{boundary}\r\n"
                f'Content-Disposition: form-data; name="{name}"; filename="{filename}"\r\n'
                f"Content-Type: audio/wav\r\n\r\n"
            ).encode()
        )
        parts.append(path.read_bytes())
        parts.append(b"\r\n")

    add_file("target", target, target.name)
    if ref:
        add_file("reference", ref, ref.name)
    add_field("sub", "50")
    add_field("air", "55")
    add_field("snap", "45")
    add_field("width", "50")
    add_field("output_format", "wav")
    parts.append(f"--{boundary}--\r\n".encode())
    body = b"".join(parts)

    headers = {
        "Content-Type": f"multipart/form-data; boundary={boundary}",
        "Content-Length": str(len(body)),
    }
    if token:
        headers["Authorization"] = f"Bearer {token}"

    req = urllib.request.Request(f"{base.rstrip('/')}/api/master", data=body, headers=headers, method="POST")
    t0 = time.perf_counter()
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            data = resp.read(64)  # peek
            size_hint = resp.headers.get("Content-Length", f">={len(data)}")
            mode = resp.headers.get("X-Master-Mode", "?")
            meters = resp.headers.get("X-Master-Meters", "")[:120]
            return (
                resp.status,
                time.perf_counter() - t0,
                f"mode={mode} bytes~{size_hint} meters={meters}",
            )
    except urllib.error.HTTPError as e:
        raw = e.read(1500).decode("utf-8", errors="replace")
        return e.code, time.perf_counter() - t0, raw[:400]
    except Exception as e:
        return 0, time.perf_counter() - t0, f"{type(e).__name__}: {e}"


def api_smoke(base_url: str, auth_open: bool = False) -> list[dict]:
    rows: list[dict] = []
    base = base_url.rstrip("/")

    # system-status (no auth)
    code, sec, body = http_get(f"{base}/api/system-status", timeout=90)
    rows.append(
        {
            "endpoint": "GET /api/system-status",
            "status": code,
            "sec": round(sec, 2),
            "note": str(body)[:160].replace("\n", " "),
        }
    )

    token = None
    if not auth_open:
        # try register a unique bench user
        email = f"bench_{int(time.time())}@localhost.test"
        code, sec, payload = http_json(
            "POST",
            f"{base}/api/auth/register",
            {"name": "Bench", "email": email, "password": "BenchTest123!"},
            timeout=30,
        )
        rows.append(
            {
                "endpoint": "POST /api/auth/register",
                "status": code,
                "sec": round(sec, 2),
                "note": str(payload)[:120],
            }
        )
        if isinstance(payload, dict) and payload.get("token"):
            token = payload["token"]
        else:
            code, sec, payload = http_json(
                "POST",
                f"{base}/api/auth/login",
                {"email": email, "password": "BenchTest123!"},
            )
            if isinstance(payload, dict):
                token = payload.get("token")

    headers = {"Authorization": f"Bearer {token}"} if token else {}

    code, sec, body = http_get(f"{base}/api/me", headers=headers, timeout=20)
    rows.append(
        {
            "endpoint": "GET /api/me",
            "status": code,
            "sec": round(sec, 2),
            "note": str(body)[:120],
        }
    )

    # free presets (often public)
    code, sec, body = http_get(f"{base}/api/free/presets", headers=headers, timeout=20)
    rows.append(
        {
            "endpoint": "GET /api/free/presets",
            "status": code,
            "sec": round(sec, 2),
            "note": str(body)[:80],
        }
    )

    # CRM
    code, sec, body = http_get(f"{base}/api/crm/state", headers=headers, timeout=20)
    rows.append(
        {
            "endpoint": "GET /api/crm/state",
            "status": code,
            "sec": round(sec, 2),
            "note": str(body)[:80],
        }
    )

    # Master pure (short synth)
    with tempfile.TemporaryDirectory() as td:
        tpath = synth_wav(Path(td) / "api_target.wav", seconds=6.0, seed=11)
        rpath = synth_wav(Path(td) / "api_ref.wav", seconds=6.0, seed=22)
        code, sec, note = multipart_master(base, token, tpath, None)
        rows.append(
            {
                "endpoint": "POST /api/master pure",
                "status": code,
                "sec": round(sec, 2),
                "note": note[:160],
            }
        )
        code, sec, note = multipart_master(base, token, tpath, rpath)
        rows.append(
            {
                "endpoint": "POST /api/master ref",
                "status": code,
                "sec": round(sec, 2),
                "note": note[:160],
            }
        )

    return rows


def print_api_table(rows: list[dict]) -> None:
    print("| endpoint | status | sec | note |")
    print("| --- | --- | --- | --- |")
    for r in rows:
        note = str(r.get("note", "")).replace("|", "/")[:120]
        print(f"| {r['endpoint']} | {r['status']} | {r['sec']} | {note} |")


def probe_render() -> list[str]:
    lines: list[str] = []
    # cold-ish first hit
    code1, sec1, body1 = http_get(f"{PROD_URL}/api/system-status", timeout=120)
    code2, sec2, body2 = http_get(f"{PROD_URL}/api/system-status", timeout=60)
    lines.append(f"hit1 status={code1} latency={sec1:.2f}s")
    lines.append(f"hit2 status={code2} latency={sec2:.2f}s (warm)")
    try:
        data = json.loads(body2) if body2.startswith("{") else json.loads(body1)
        lines.append(
            f"engine={data.get('engine')} key_verified={data.get('key_verified')} "
            f"auth_required={data.get('auth_required')}"
        )
        lines.append(f"founding_limits={data.get('founding_limits')}")
        free = data.get("free_data") or {}
        lines.append(f"free_data={json.dumps(free)}")
    except Exception:
        lines.append(f"body snippet: {(body2 or body1)[:300]}")
    return lines


def main() -> int:
    parser = argparse.ArgumentParser(description="Artist Engine system check")
    parser.add_argument("--base-url", default=os.getenv("ENGINE_API", "http://127.0.0.1:8001"))
    parser.add_argument("--skip-worker", action="store_true")
    parser.add_argument("--skip-api", action="store_true")
    parser.add_argument("--skip-render", action="store_true")
    parser.add_argument("--skip-frontend", action="store_true")
    args = parser.parse_args()

    print("# The Artist Engine — System Check Report")
    print(f"_generated {time.strftime('%Y-%m-%d %H:%M:%S')}_")
    print(f"_max recommended upload: {MAX_UPLOAD_MB} MB_")

    hr("1. Environment")
    for line in probe_env():
        print(f"- {line}")

    worker_rows: list[dict] = []
    if not args.skip_worker:
        hr("2. Mastering worker benchmarks")
        print("Running matcher_worker cases (synthetic 8s / 90s + fixtures if present)...")
        try:
            worker_rows = run_worker_benchmarks()
            print_bench_table(worker_rows)
        except Exception:
            print(fail("worker benchmarks crashed:"))
            traceback.print_exc()

    if not args.skip_render:
        hr("3. Production Render probe")
        print(f"URL: `{PROD_URL}`")
        for line in probe_render():
            print(f"- {line}")

    api_rows: list[dict] = []
    if not args.skip_api:
        hr("4. Local API smoke")
        print(f"Base: `{args.base_url}`")
        # quick ping
        code, sec, _ = http_get(f"{args.base_url.rstrip('/')}/api/system-status", timeout=5)
        if code == 0:
            print(warn(f"Local API not reachable ({sec:.2f}s). Start with:"))
            print("```")
            print("cd backend")
            print("..\\backend\\cognee_env\\Scripts\\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8001")
            print("```")
        else:
            try:
                api_rows = api_smoke(args.base_url)
                print_api_table(api_rows)
            except Exception:
                print(fail("API smoke crashed:"))
                traceback.print_exc()

    if not args.skip_frontend:
        hr("5. Frontend build")
        pkg = ROOT / "frontend" / "package.json"
        if not pkg.exists():
            print(fail("frontend/package.json missing"))
        else:
            # Only verify node_modules present; full build is slow — run if node available
            node = shutil.which("node")
            npm = shutil.which("npm")
            if not node or not npm:
                print(warn("node/npm not on PATH — skip build"))
            else:
                print("Running `npm run build` (may take a minute)...")
                t0 = time.perf_counter()
                proc = subprocess.run(
                    ["npm", "run", "build"],
                    cwd=str(ROOT / "frontend"),
                    capture_output=True,
                    text=True,
                    timeout=300,
                    shell=True,
                )
                elapsed = time.perf_counter() - t0
                if proc.returncode == 0:
                    print(ok(f"frontend build {elapsed:.1f}s"))
                else:
                    print(fail(f"frontend build failed ({elapsed:.1f}s)"))
                    print((proc.stderr or proc.stdout or "")[-800:])

    hr("6. OSS stack decision")
    print(
        "- **Keep Matchering 2.0 + Pedalboard + ffmpeg loudnorm** — best open-source "
        "automated reference-mastering stack embeddable in Python APIs."
    )
    print(
        "- Alternatives (Audacity, free VSTs, browser loudness tools, LANDR) are either "
        "manual, closed, or lack reference matching. **No swap.**"
    )

    hr("7. Equipment guidance (laptop users)")
    print(
        f"- **Min:** modern laptop, 8 GB RAM, Chrome/Edge, stable Wi‑Fi; "
        f"upload mix as WAV/FLAC **under {MAX_UPLOAD_MB} MB** (not multi‑GB project dumps)."
    )
    print(
        "- **Better:** 16 GB RAM if using waveform/spectrogram; solid network for 40–80 MB uploads."
    )
    print(
        "- **Server (ops):** Render with **≥1–2 GB RAM** for full-song reference matchering; ffmpeg on PATH; "
        "persistent disk for auth DB."
    )
    print(
        "- Mastering runs **on the server**, not the laptop CPU — laptop mainly needs upload + browser playback."
    )

    # Summary exit code
    hard_fail = False
    for line in probe_env():
        if line.startswith("FAIL"):
            hard_fail = True
    if worker_rows and not any(r.get("ok") for r in worker_rows):
        hard_fail = True

    hr("Summary")
    pure = next((r for r in worker_rows if r.get("case") == "pure_8s"), None)
    ref = next((r for r in worker_rows if r.get("case") == "ref_8s"), None)
    if pure:
        print(f"- Pure 8s master: {'PASS' if pure.get('ok') else 'FAIL'} in {pure.get('sec')}s")
    if ref:
        print(f"- Ref 8s master: {'PASS' if ref.get('ok') else 'FAIL'} in {ref.get('sec')}s")
    print(f"- Overall: {'ISSUES FOUND' if hard_fail else 'CORE CHECKS OK'}")
    return 1 if hard_fail else 0


if __name__ == "__main__":
    raise SystemExit(main())
