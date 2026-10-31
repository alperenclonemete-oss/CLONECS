import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

temp = tempfile.TemporaryDirectory(dir=Path(__file__).parent)
os.environ['DATABASE_URL'] = ''
os.environ['APP_DATABASE_PATH'] = str(Path(temp.name) / 'test.sqlite3')
from cryptography.fernet import Fernet
os.environ['MATCH_TRACKING_KEY'] = Fernet.generate_key().decode()
from account_store import init_database, connection, db_cursor, create_user, create_session, link_steam_account
from match_tracking import init_tracking, connect_tracking, tracking_status, disconnect_tracking, cipher
from match_worker import poll_tracking, process_one, validate_demo_url
from match_analysis import analyze
from fastapi import FastAPI
from fastapi.testclient import TestClient
from match_routes import router

CODE = 'CSGO-GADqf-jjyJ8-cSP2r-smZRo-TO2xK'
NEXT = 'CSGO-aaaaa-bbbbb-ccccc-ddddd-eeeee'
AUTH = 'ABCD-ABCDE-ABCD'


class TrackingTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        init_database(); init_tracking()
        cls.a = create_user('test_one', 'long_password_123')['user_id']
        cls.b = create_user('test_two', 'long_password_123')['user_id']
        link_steam_account(cls.a, '76561199158267709', 'CLONE', '')
        link_steam_account(cls.b, '76561198265366770', 'Fixture', '')
        cls.app = FastAPI();cls.app.include_router(router)

    def setUp(self):
        with connection() as conn, db_cursor(conn) as cur:
            cur.execute('DELETE FROM cs2_matches');cur.execute('DELETE FROM cs2_tracking')

    def test_encrypt_isolate_and_dedupe(self):
        connect_tracking(self.a, '76561199158267709', AUTH, CODE)
        connect_tracking(self.a, '76561199158267709', AUTH, CODE)
        state=tracking_status(self.a,'76561199158267709')
        self.assertEqual(len(state['matches']),1)
        self.assertEqual(tracking_status(self.b,'76561198265366770')['matches'],[])
        with connection() as conn, db_cursor(conn) as cur:
            cur.execute('SELECT auth_cipher FROM cs2_tracking'); encrypted=cur.fetchone()['auth_cipher']
        self.assertNotIn(AUTH,encrypted);self.assertEqual(cipher().decrypt(encrypted.encode()).decode(),AUTH)
        self.assertNotIn('auth_cipher',str(state))

    def test_api_requires_login_and_linked_account(self):
        client=TestClient(self.app)
        self.assertEqual(client.get('/api/cs2/tracking').status_code,401)
        client.cookies.set('cs2coach_session',create_session(self.a))
        self.assertEqual(client.post('/api/cs2/tracking',json={'auth_code':AUTH,'share_code':'bad'}).status_code,400)
        self.assertEqual(client.post('/api/cs2/tracking',json={'auth_code':AUTH,'share_code':CODE}).status_code,200)
        self.assertEqual(client.delete('/api/cs2/tracking').status_code,200)
        self.assertIsNone(client.get('/api/cs2/tracking').json()['tracking'])

    def test_cursor_and_queue_advance_atomically(self):
        import httpx
        connect_tracking(self.a,'76561199158267709',AUTH,CODE)
        responses=[httpx.Response(200,json={'result':{'nextcode':NEXT}},request=httpx.Request('GET','https://example.com')),httpx.Response(202)]
        with patch('match_worker.httpx.get',side_effect=responses),patch.dict(os.environ,{'STEAM_API_KEY':'test'}):poll_tracking()
        state=tracking_status(self.a,'76561199158267709')
        self.assertEqual(len(state['matches']),2);self.assertEqual(state['tracking']['status'],'active')

    def test_failure_does_not_drop_job(self):
        connect_tracking(self.a,'76561199158267709',AUTH,CODE)
        with patch('match_worker.resolve_demo',side_effect=RuntimeError('secret must not leak')):self.assertTrue(process_one())
        item=tracking_status(self.a,'76561199158267709')['matches'][0]
        self.assertEqual(item['status'],'retry');self.assertNotIn('secret',item['error'])

    def test_reject_non_valve_downloads(self):
        for url in ['http://127.0.0.1/x.dem.bz2','https://replay1.valve.net.evil.com/x.dem.bz2','https://replay1.valve.net:3000/x.dem.bz2']:
            with self.assertRaises(ValueError):validate_demo_url(url)
        self.assertEqual(validate_demo_url('http://replay1.valve.net/730/x.dem.bz2'),'http://replay1.valve.net/730/x.dem.bz2')

    def test_real_demo_and_wrong_player(self):
        fixture=Path(__file__).with_name('fixture.dem')
        if not fixture.exists():self.skipTest('Set up upstream fixture.dem to run parser integration test')
        result=analyze(str(fixture),'76561198265366770')
        self.assertEqual(result['kills'],11);self.assertEqual(result['deaths'],4)
        self.assertEqual(result['hs_percent'],72.73);self.assertEqual(result['adr'],116.3)
        with self.assertRaises(ValueError):analyze(str(fixture),'76561199158267709')


if __name__=='__main__':unittest.main()
