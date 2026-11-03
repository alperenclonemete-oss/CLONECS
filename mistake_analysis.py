"""Review signals, not automatic judgments of tactical mistakes. CS2 ticks: 64/s."""
from collections import defaultdict


def summarize_events(deaths, blinds, flashes, steam_id):
    sid = str(steam_id)
    live = lambda r: r.get('is_warmup_period') is False and r.get('total_rounds_played') is not None
    deaths = sorted([r for r in deaths if live(r)], key=lambda r: r['tick'])
    blinds = [r for r in blinds if live(r)]
    flashes = [r for r in flashes if live(r)]
    enemy = lambda r: r.get('attacker_team_num') in (2, 3) and r.get('user_team_num') in (2, 3) and r['attacker_team_num'] != r['user_team_num']
    own_deaths = [r for r in deaths if str(r.get('user_steamid')) == sid and enemy(r)]
    traded = sum(any(x['total_rounds_played'] == r['total_rounds_played'] and 0 < x['tick'] - r['tick'] <= 320 and str(x.get('user_steamid')) == str(r.get('attacker_steamid')) and x.get('attacker_team_num') == r['user_team_num'] and str(x.get('attacker_steamid')) != sid for x in deaths) for r in own_deaths)
    intervals = defaultdict(list)
    for r in blinds:
        if str(r.get('attacker_steamid')) == sid and str(r.get('user_steamid')) != sid and r.get('attacker_team_num') in (2, 3) and r.get('attacker_team_num') == r.get('user_team_num'):
            duration = float(r.get('blind_duration') or 0)
            if duration > 0:
                intervals[(r['total_rounds_played'], str(r.get('user_steamid')))].append((r['tick'] / 64, r['tick'] / 64 + duration))
    seconds = 0
    for spans in intervals.values():
        start = end = None
        for a, b in sorted(spans):
            if end is None: start, end = a, b
            elif a <= end: end = max(end, b)
            else: seconds += end - start; start, end = a, b
        if end is not None: seconds += end - start
    own_flashes = [r for r in flashes if str(r.get('user_steamid')) == sid]
    empty = sum(not any(str(b.get('attacker_steamid')) == sid and b.get('entityid') == r.get('entityid') and b['total_rounds_played'] == r['total_rounds_played'] and abs(b['tick'] - r['tick']) <= 64 and enemy(b) and float(b.get('blind_duration') or 0) > 0 for b in blinds) for r in own_flashes)
    return {'version': 1, 'status': 'available', 'team_blind_seconds': round(seconds, 2), 'traded_deaths': traded, 'eligible_deaths': len(own_deaths), 'traded_death_percent': round(traded / len(own_deaths) * 100, 1) if own_deaths else None, 'flashes_thrown': len(own_flashes), 'flashes_without_enemy_blind': empty, 'other_utility_waste': None, 'trade_window_seconds': 5}


def analyze_mistakes(parser, steam_id):
    try:
        frames = {}
        required = {'player_death': {'attacker_steamid','user_steamid','attacker_team_num','user_team_num'}, 'player_blind': {'attacker_steamid','user_steamid','attacker_team_num','user_team_num','blind_duration','entityid'}, 'flashbang_detonate': {'user_steamid','entityid'}}
        for event, fields in required.items():
            df = parser.parse_event(event, player=['team_num'], other=['total_rounds_played','is_warmup_period'])
            if not fields.union({'tick','total_rounds_played','is_warmup_period'}).issubset(df.columns):
                return {'version': 1, 'status': 'unavailable'}
            frames[event] = df.to_dict('records')
        return summarize_events(frames['player_death'], frames['player_blind'], frames['flashbang_detonate'], steam_id)
    except Exception:
        return {'version': 1, 'status': 'unavailable'}
