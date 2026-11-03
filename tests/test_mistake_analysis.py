import unittest
from mistake_analysis import summarize_events

def row(tick=100, **kw):
    return dict(tick=tick,total_rounds_played=1,is_warmup_period=False,**kw)
class Signals(unittest.TestCase):
    def test_overlap_and_self_flash(self):
        b=[row(attacker_steamid='1',user_steamid='2',attacker_team_num=2,user_team_num=2,blind_duration=2),row(164,attacker_steamid='1',user_steamid='2',attacker_team_num=2,user_team_num=2,blind_duration=2),row(attacker_steamid='1',user_steamid='1',attacker_team_num=2,user_team_num=2,blind_duration=5)]
        self.assertEqual(summarize_events([],b,[],'1')['team_blind_seconds'],3)
    def test_trade_and_round_boundary(self):
        d=row(user_steamid='1',attacker_steamid='9',user_team_num=2,attacker_team_num=3)
        trade=row(420,user_steamid='9',attacker_steamid='2',user_team_num=3,attacker_team_num=2)
        self.assertEqual(summarize_events([d,trade],[],[],'1')['traded_deaths'],1)
        trade['total_rounds_played']=2
        self.assertEqual(summarize_events([d,trade],[],[],'1')['traded_deaths'],0)
    def test_flash_matching(self):
        f=row(user_steamid='1',entityid=5)
        b=row(attacker_steamid='1',user_steamid='9',attacker_team_num=2,user_team_num=3,entityid=5,blind_duration=1)
        self.assertEqual(summarize_events([],[b],[f],'1')['flashes_without_enemy_blind'],0)
        b['attacker_team_num']=3
        self.assertEqual(summarize_events([],[b],[f],'1')['flashes_without_enemy_blind'],1)
    def test_empty_denominator(self):
        self.assertIsNone(summarize_events([],[],[],'1')['traded_death_percent'])
if __name__=='__main__':unittest.main()
