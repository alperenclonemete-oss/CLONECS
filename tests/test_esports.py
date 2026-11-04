import os
import unittest
from unittest.mock import patch
import httpx
import esports_routes as er

class ProviderTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        er._cache.clear(); er._calls.clear(); er._cooldown=0
        self.env=patch.dict(os.environ,{'PANDASCORE_TOKEN':'test-secret-token'})
        self.env.start()
    async def asyncTearDown(self): self.env.stop()
    async def test_missing_token_makes_no_request(self):
        with patch.dict(os.environ,{'PANDASCORE_TOKEN':''}):
            self.assertEqual((await er.matches('running'))['status'],'setup')
    async def test_auth_cache_and_stale(self):
        calls=[]
        async def send(client,url,**kw):
            calls.append(kw)
            return httpx.Response(200,json=[{'id':1,'name':'Fixture'}])
        with patch.object(httpx.AsyncClient,'get',send):
            first=await er.provider('/csgo/matches/running')
            self.assertEqual(await er.provider('/csgo/matches/running'),first)
        self.assertEqual(len(calls),1)
        self.assertEqual(calls[0]['headers']['Authorization'],'Bearer test-secret-token')
        self.assertNotIn('token',calls[0]['params'])
        self.assertNotIn('test-secret-token',str(first))
        er._cache[('/csgo/matches/running',1)]['expires']=0
        async def fail(*a,**kw): return httpx.Response(503,text='private upstream message')
        with patch.object(httpx.AsyncClient,'get',fail):
            stale=await er.provider('/csgo/matches/running')
        self.assertTrue(stale['stale']);self.assertEqual(stale['updated_at'],first['updated_at'])
        self.assertNotIn('private upstream',str(stale))
    async def test_plan_and_global_rate_limit(self):
        async def forbidden(*a,**kw):return httpx.Response(403)
        with patch.object(httpx.AsyncClient,'get',forbidden):
            self.assertEqual((await er.provider('/csgo/matches/1/games'))['status'],'plan')
        async def limit(*a,**kw):return httpx.Response(429)
        with patch.object(httpx.AsyncClient,'get',limit):
            self.assertEqual((await er.provider('/csgo/matches/past'))['status'],'limit')
        with patch.object(httpx.AsyncClient,'get',side_effect=AssertionError('Must back off')):
            self.assertEqual((await er.provider('/csgo/matches/upcoming'))['status'],'limit')

if __name__=='__main__':unittest.main()
