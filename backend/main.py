"""
Movie Box Office Dashboard — FastAPI Backend
Wraps the boxoffice-api==1.2.2 PyPI package (scrapes Box Office Mojo).
"""

from __future__ import annotations

import os
import re
import threading
from datetime import datetime, timedelta
from typing import Any

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

# ──────────────────────────────────────────────────────────────────────────────
# Client initialisation
try:
    from boxoffice_api import BoxOffice  # type: ignore

    OMDB_KEY = os.getenv("OMDB_API_KEY") or None
    if OMDB_KEY:
        bo = BoxOffice(api_key=OMDB_KEY)
        _USE_MOCK = False
        print("[INFO] boxoffice-api initialised successfully. Live scraping enabled.")
    else:
        bo = None
        _USE_MOCK = True
        print("[WARN] No OMDB_API_KEY found. Falling back to mock mode.")
except Exception as exc:
    print(f"[WARN] Could not initialise boxoffice-api: {exc}. Using mock data.")
    bo = None
    _USE_MOCK = True


# Global cache dictionary for storing scraped data at startup
_CACHE = {
    "weekend": None,
    "weekly": None,
    "daily": None,
    "monthly": None,
    "history": {}  # title (lowercase string) -> history response dict
}


# ──────────────────────────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────────────────────────

def _parse_money(value: Any) -> int:
    """Convert strings like '$12,345,678' → 12345678 (int cents omitted)."""
    if isinstance(value, (int, float)):
        return int(value)
    if not value or str(value).strip() in ("-", "N/A", ""):
        return 0
    cleaned = re.sub(r"[^\d]", "", str(value))
    return int(cleaned) if cleaned else 0


def _parse_int(value: Any) -> int:
    if isinstance(value, int):
        return value
    if not value or str(value).strip() in ("-", "N/A", ""):
        return 0
    cleaned = re.sub(r"[^\d]", "", str(value))
    return int(cleaned) if cleaned else 0


def _normalise_row(row: dict, rank_override: int | None = None) -> dict:
    """Normalise a raw boxoffice-api row into a consistent schema."""
    return {
        "rank": rank_override or _parse_int(row.get("rank", row.get("Rank", 0))),
        "title": str(row.get("title", row.get("Title", row.get("Movie", "Unknown")))).strip(),
        "gross": _parse_money(row.get("gross", row.get("Gross", row.get("Daily", 0)))),
        "theaters": _parse_int(row.get("theaters", row.get("Theaters", row.get("Thtrs.", 0)))),
        "avg": _parse_money(row.get("avg", row.get("Avg", row.get("Avg.", 0)))),
        "total_gross": _parse_money(
            row.get("total_gross", row.get("Total Gross", row.get("Cume.", row.get("Domestic Total", 0))))
        ),
        "weeks": _parse_int(row.get("weeks", row.get("Weeks", row.get("Days", 0)))),
        "distributor": str(row.get("distributor", row.get("Distributor", ""))).strip(),
    }


def _dataframe_to_dicts(data: Any) -> list[dict]:
    """Accept a DataFrame or list of dicts and return a list of dicts."""
    if data is None:
        return []
    # pandas DataFrame
    if hasattr(data, "to_dict"):
        return data.to_dict(orient="records")
    if isinstance(data, list):
        return data
    return []


# ──────────────────────────────────────────────────────────────────────────────
# Mock data (August 2026 Sampler)
# ──────────────────────────────────────────────────────────────────────────────

_MOCK_MOVIES = [
    {"rank": 1,  "title": "Spider-Man: Brand New Day",     "gross": 84_500_000, "theaters": 4420, "avg": 19117, "total_gross": 382_000_000, "weeks": 3, "distributor": "Sony"},
    {"rank": 2,  "title": "The Odyssey",                   "gross": 32_100_000, "theaters": 3950, "avg": 8126,  "total_gross": 194_500_000, "weeks": 3, "distributor": "Universal"},
    {"rank": 3,  "title": "The End of Oak Street",          "gross": 28_800_000, "theaters": 3620, "avg": 7955,  "total_gross": 28_800_000,  "weeks": 1, "distributor": "Warner Bros."},
    {"rank": 4,  "title": "PAW Patrol: The Dino Movie",     "gross": 19_400_000, "theaters": 3350, "avg": 5791,  "total_gross": 19_400_000,  "weeks": 1, "distributor": "Paramount"},
    {"rank": 5,  "title": "Insidious: Out of the Further",  "gross": 16_500_000, "theaters": 2890, "avg": 5709,  "total_gross": 16_500_000,  "weeks": 1, "distributor": "Sony"},
    {"rank": 6,  "title": "Mutiny",                         "gross": 10_200_000, "theaters": 2500, "avg": 4080,  "total_gross": 10_200_000,  "weeks": 1, "distributor": "Lionsgate"},
    {"rank": 7,  "title": "Coyote vs. Acme",                "gross": 8_900_000,  "theaters": 2100, "avg": 4238,  "total_gross": 8_900_000,   "weeks": 1, "distributor": "Warner Bros."},
    {"rank": 8,  "title": "The Dog Stars",                  "gross": 6_400_000,  "theaters": 1800, "avg": 3555,  "total_gross": 6_400_000,   "weeks": 1, "distributor": "Disney"},
    {"rank": 9,  "title": "Ember Road",                     "gross": 3_200_000,  "theaters": 1450, "avg": 2206,  "total_gross": 19_800_000,  "weeks": 3, "distributor": "Focus Features"},
    {"rank": 10, "title": "Polar Night",                    "gross": 1_800_000,  "theaters": 950,  "avg": 1894,  "total_gross": 12_400_000,  "weeks": 4, "distributor": "NEON"},
]

def _mock_chart_data(tf: str = "weekend") -> list[dict]:
    multipliers = {
        "weekend": 1.0,
        "weekly": 2.3,
        "daily": 0.18,
        "monthly": 8.5,
    }
    mul = multipliers.get(tf, 1.0)
    return [
        {
            **m,
            "gross": int(m["gross"] * mul),
            "avg": int(m["avg"] * mul),
            "total_gross": int(m["total_gross"] * mul),
        }
        for m in _MOCK_MOVIES
    ]

def _mock_weekend_data() -> list[dict]:
    return _mock_chart_data("weekend")


def _mock_weekly_history(title: str) -> list[dict]:
    """Generate a plausible weekly decay curve for a given movie title."""
    import random, hashlib
    seed = int(hashlib.md5(title.encode()).hexdigest(), 16) % 10000
    random.seed(seed)
    opening = random.randint(20_000_000, 80_000_000)
    rows = []
    gross = opening
    for w in range(1, 9):
        rows.append({
            "week": w,
            "gross": int(gross),
            "theaters": max(500, 4000 - (w - 1) * 400 + random.randint(-100, 100)),
            "avg": int(gross / max(500, 4000 - (w - 1) * 400)),
        })
        gross *= random.uniform(0.45, 0.65)
        if gross < 300_000:
            break
    return rows


# ──────────────────────────────────────────────────────────────────────────────
# FastAPI app
# ──────────────────────────────────────────────────────────────────────────────

app = FastAPI(title="Movie Box Office API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
      "http://localhost:5173", "http://127.0.0.1:5173",
      "http://localhost:5174", "http://127.0.0.1:5174",
      "http://localhost:5175", "http://127.0.0.1:5175",
      "http://localhost:5176", "http://127.0.0.1:5176"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _warm_cache_task():
    global _USE_MOCK
    if _USE_MOCK or bo is None:
        print("[INFO] Mock mode enabled, skipping live cache warm-up.")
        return

    print("[INFO] Warming up box office cache from live scraper in background...")
    # Fetch weekend
    try:
        raw = bo.get_weekend(year=datetime.now().year, week=max(1, int(datetime.now().strftime("%U"))))
        rows = _dataframe_to_dicts(raw)
        movies = [_normalise_row(r, i + 1) for i, r in enumerate(rows)]
        _CACHE["weekend"] = {"source": "live", "year": datetime.now().year, "week": max(1, int(datetime.now().strftime("%U"))), "movies": movies}
        print("[INFO] Cache warmed: weekend data.")
    except Exception as e:
        print(f"[WARN] Failed to warm weekend cache: {e}")

    # Fetch weekly
    try:
        raw = bo.get_weekly(year=datetime.now().year, week=max(1, int(datetime.now().strftime("%U"))))
        rows = _dataframe_to_dicts(raw)
        movies = [_normalise_row(r, i + 1) for i, r in enumerate(rows)]
        _CACHE["weekly"] = {"source": "live", "year": datetime.now().year, "week": max(1, int(datetime.now().strftime("%U"))), "movies": movies}
        print("[INFO] Cache warmed: weekly data.")
    except Exception as e:
        print(f"[WARN] Failed to warm weekly cache: {e}")

    # Fetch daily
    try:
        raw = bo.get_daily(date=(datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d"))
        rows = _dataframe_to_dicts(raw)
        movies = [_normalise_row(r, i + 1) for i, r in enumerate(rows)]
        _CACHE["daily"] = {"source": "live", "date": (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d"), "movies": movies}
        print("[INFO] Cache warmed: daily data.")
    except Exception as e:
        print(f"[WARN] Failed to warm daily cache: {e}")

    # Fetch monthly
    try:
        raw = bo.get_monthly(year=datetime.now().year, month=datetime.now().month)
        rows = _dataframe_to_dicts(raw)
        movies = [_normalise_row(r, i + 1) for i, r in enumerate(rows)]
        _CACHE["monthly"] = {"source": "live", "year": datetime.now().year, "month": datetime.now().month, "movies": movies}
        print("[INFO] Cache warmed: monthly data.")
    except Exception as e:
        print(f"[WARN] Failed to warm monthly cache: {e}")


@app.on_event("startup")
def startup_event():
    """Start cache warming thread on boot."""
    threading.Thread(target=_warm_cache_task, daemon=True).start()


# ── /api/weekend ─────────────────────────────────────────────────────────────

@app.get("/api/weekend")
def get_weekend(
    year: int = Query(default=datetime.now().year),
    week: int = Query(default=max(1, int(datetime.now().strftime("%U")))),
    mock: bool = Query(default=False),
    demo: bool = Query(default=False),
):
    """Weekend box office chart."""
    if mock or demo:
        return {"source": "mock", "year": year, "week": week, "movies": _mock_chart_data("weekend")}

    if _CACHE["weekend"] is not None:
        return _CACHE["weekend"]

    if _USE_MOCK or bo is None:
        res = {"source": "mock", "year": year, "week": week, "movies": _mock_chart_data("weekend")}
        _CACHE["weekend"] = res
        return res

    try:
        raw = bo.get_weekend(year=year, week=week)
        rows = _dataframe_to_dicts(raw)
        movies = [_normalise_row(r, i + 1) for i, r in enumerate(rows)]
        res = {"source": "live", "year": year, "week": week, "movies": movies}
        _CACHE["weekend"] = res
        return res
    except Exception as exc:
        res = {"source": "mock", "year": year, "week": week, "movies": _mock_chart_data("weekend")}
        _CACHE["weekend"] = res
        return res


# ── /api/weekly ──────────────────────────────────────────────────────────────

@app.get("/api/weekly")
def get_weekly(
    year: int = Query(default=datetime.now().year),
    week: int = Query(default=max(1, int(datetime.now().strftime("%U")))),
    mock: bool = Query(default=False),
    demo: bool = Query(default=False),
):
    """Weekly box office chart."""
    if mock or demo:
        return {"source": "mock", "year": year, "week": week, "movies": _mock_chart_data("weekly")}

    if _CACHE["weekly"] is not None:
        return _CACHE["weekly"]

    if _USE_MOCK or bo is None:
        res = {"source": "mock", "year": year, "week": week, "movies": _mock_chart_data("weekly")}
        _CACHE["weekly"] = res
        return res

    try:
        raw = bo.get_weekly(year=year, week=week)
        rows = _dataframe_to_dicts(raw)
        movies = [_normalise_row(r, i + 1) for i, r in enumerate(rows)]
        res = {"source": "live", "year": year, "week": week, "movies": movies}
        _CACHE["weekly"] = res
        return res
    except Exception as exc:
        res = {"source": "mock", "year": year, "week": week, "movies": _mock_chart_data("weekly")}
        _CACHE["weekly"] = res
        return res


# ── /api/daily ───────────────────────────────────────────────────────────────

@app.get("/api/daily")
def get_daily(
    date: str = Query(default=(datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")),
    mock: bool = Query(default=False),
    demo: bool = Query(default=False),
):
    """Daily box office chart. date format: YYYY-MM-DD."""
    if mock or demo:
        return {"source": "mock", "date": date, "movies": _mock_chart_data("daily")}

    if _CACHE["daily"] is not None:
        return _CACHE["daily"]

    if _USE_MOCK or bo is None:
        res = {"source": "mock", "date": date, "movies": _mock_chart_data("daily")}
        _CACHE["daily"] = res
        return res

    try:
        raw = bo.get_daily(date=date)
        rows = _dataframe_to_dicts(raw)
        movies = [_normalise_row(r, i + 1) for i, r in enumerate(rows)]
        res = {"source": "live", "date": date, "movies": movies}
        _CACHE["daily"] = res
        return res
    except Exception as exc:
        res = {"source": "mock", "date": date, "movies": _mock_chart_data("daily")}
        _CACHE["daily"] = res
        return res


# ── /api/monthly ─────────────────────────────────────────────────────────────

@app.get("/api/monthly")
def get_monthly(
    year: int = Query(default=datetime.now().year),
    month: int = Query(default=datetime.now().month),
    mock: bool = Query(default=False),
    demo: bool = Query(default=False),
):
    """Monthly box office chart."""
    if mock or demo:
        return {"source": "mock", "year": year, "month": month, "movies": _mock_chart_data("monthly")}

    if _CACHE["monthly"] is not None:
        return _CACHE["monthly"]

    if _USE_MOCK or bo is None:
        res = {"source": "mock", "year": year, "month": month, "movies": _mock_chart_data("monthly")}
        _CACHE["monthly"] = res
        return res

    try:
        raw = bo.get_monthly(year=year, month=month)
        rows = _dataframe_to_dicts(raw)
        movies = [_normalise_row(r, i + 1) for i, r in enumerate(rows)]
        res = {"source": "live", "year": year, "month": month, "movies": movies}
        _CACHE["monthly"] = res
        return res
    except Exception as exc:
        res = {"source": "mock", "year": year, "month": month, "movies": _mock_chart_data("monthly")}
        _CACHE["monthly"] = res
        return res


# ── /api/movie/history ───────────────────────────────────────────────────────

@app.get("/api/movie/history")
def get_movie_history(
    title: str = Query(..., description="Exact movie title"),
    mock: bool = Query(default=False),
    demo: bool = Query(default=False),
):
    """
    Weekly revenue history for a specific movie (cached).
    """
    if mock or demo:
        return {"source": "mock", "title": title, "history": _mock_weekly_history(title)}

    title_key = title.strip().lower()
    if title_key in _CACHE["history"]:
        return _CACHE["history"][title_key]

    if _USE_MOCK or bo is None:
        res = {"source": "mock", "title": title, "history": _mock_weekly_history(title)}
        _CACHE["history"][title_key] = res
        return res

    try:
        now = datetime.now()
        history: list[dict] = []
        year = now.year
        current_week = int(now.strftime("%U"))

        for w in range(max(1, current_week - 12), current_week + 1):
            try:
                raw = bo.get_weekly(year=year, week=w)
                rows = _dataframe_to_dicts(raw)
                for row in rows:
                    t = str(row.get("title", row.get("Title", row.get("Movie", "")))).strip().lower()
                    if t == title_key:
                        norm = _normalise_row(row)
                        history.append({
                            "week": len(history) + 1,
                            "gross": norm["gross"],
                            "theaters": norm["theaters"],
                            "avg": norm["avg"],
                        })
                        break
            except Exception:
                continue

        if not history:
            # Fallback: synthetic decay
            res = {"source": "mock", "title": title, "history": _mock_weekly_history(title)}
        else:
            res = {"source": "live", "title": title, "history": history}

        _CACHE["history"][title_key] = res
        return res
    except Exception as exc:
        res = {"source": "mock", "title": title, "history": _mock_weekly_history(title)}
        _CACHE["history"][title_key] = res
        return res


# ── /api/health ──────────────────────────────────────────────────────────────

@app.get("/api/health")
def health():
    return {"status": "ok", "mock_mode": _USE_MOCK, "cache_status": {
        "weekend": _CACHE["weekend"] is not None,
        "weekly": _CACHE["weekly"] is not None,
        "daily": _CACHE["daily"] is not None,
        "monthly": _CACHE["monthly"] is not None,
        "cached_histories": list(_CACHE["history"].keys())
    }}
