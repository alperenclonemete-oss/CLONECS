"""Parse a CS2 demo in a disposable worker process, never in the web process."""
import json
import math
import sys


def number(value):
    try:
        value = float(value)
        return value if math.isfinite(value) and value >= 0 else None
    except (ValueError, TypeError):
        return None


def analyze(path, steam_id):
    from demoparser2 import DemoParser
    parser = DemoParser(path)
    header = parser.parse_header()
    ends = parser.parse_event("round_end")
    if ends.empty:
        raise ValueError("Demo içinde tamamlanmış round bulunamadı.")
    tick = int(ends["tick"].max())
    fields = ["kills_total", "deaths_total", "assists_total", "headshot_kills_total", "damage_total", "total_rounds_played"]
    frame = parser.parse_ticks(fields, ticks=[tick])
    player = frame[frame["steamid"].astype(str) == str(steam_id)]
    if player.empty:
        raise ValueError("Bağlı Steam hesabı bu demonun son skor tablosunda yok.")
    row = player.iloc[-1]
    values = {key: number(row.get(key)) for key in fields}
    kills, deaths, hs, rounds = (values[k] for k in ("kills_total", "deaths_total", "headshot_kills_total", "total_rounds_played"))
    ratio = lambda a, b, factor=1: round(a / b * factor, 2) if a is not None and b and b > 0 else None
    return {"map": header.get("map_name"), "steam_id": str(steam_id), "name": str(row.get("name", "")),
            "kills": kills, "deaths": deaths, "assists": values["assists_total"], "headshots": hs,
            "rounds": rounds, "kd": ratio(kills, deaths), "hs_percent": ratio(hs, kills, 100),
            "adr": ratio(values["damage_total"], rounds), "damage": values["damage_total"],
            "premier_rating": None, "competitive_rank": None,
            "source": "CS2 demo · son round skor tablosu", "parser_version": "0.42.1",
            "note": "Değerler demonun kapsadığı skor tablosudur; kesik demo tam maç olmayabilir. Rank verisi bu analizden çıkarılmıyor."}


if __name__ == "__main__":
    try:
        print(json.dumps(analyze(sys.argv[1], sys.argv[2]), ensure_ascii=False, allow_nan=False))
    except Exception:
        print(json.dumps({"error": "Demo çözümlenemedi veya bağlı oyuncu skor tablosunda bulunamadı."}))
        sys.exit(1)
