import unittest, asyncio, time
from unittest.mock import patch
import httpx
import server_routes as s
class DirectoryTests(unittest.IsolatedAsyncioTestCase):
    def test_addresses(self):
        for value in ['127.0.0.1:27015','10.0.0.1:2','1.1.1.1:65536','1.1.1.1:0','1.1.1.1:27015;quit','x:27015']:
            self.assertIsNone(s.address(value))
        self.assertEqual(s.address('1.1.1.1:27015'),'1.1.1.1:27015')
    def test_cs2_only(self):
        row=dict(id_games=2,ip='1.1.1.1',port=27015,mode='DM',num=1,location='test',players=3,maxplayers=12)
        data={'data':{'modules':{'servers_locations':{'data':[]},'servers':{'data':{'servers':{'1':{'DM':{'':[dict(row,id_games=1)]}},'2':{'DM':{'':[row,dict(row,id_games=1,port=27016)]}}}}}}}}
        self.assertEqual(len(s.normalize('cybershoke',data)),1)
    def test_new_providers(self):
        row=dict(Game='cs2',Address='1.1.1.1:27015',Mode='dm;single_all_weapons',MapName='de_dust2',NumPlayersLive=3,MaxPlayers=10)
        self.assertEqual(len(s.normalize('pracc',[row,dict(row,Game='csgo',Address='1.1.1.1:27016')])),1)
        xp=dict(IP='1.1.1.1',Port=27015,CurrentMap='de_mirage',GameModeID=7,Online=2,TotalSlots=10)
        rows=s.normalize('xplay',{'serversList':[xp,xp,dict(xp,IP='127.0.0.1')]})
        self.assertEqual(len(rows),1);self.assertEqual(rows[0]['mode'],'Retake')
    async def test_failure_retains_then_expires(self):
        s._cache={'warmup':{'servers':[{'stale':False,'address':'1.1.1.1:27015'}],'updatedAt':time.time(),'stale':False}}
        async def fail(request): return httpx.Response(503)
        async with httpx.AsyncClient(transport=httpx.MockTransport(fail)) as c:
            await s.refresh(c,'warmup')
        self.assertTrue(s._cache['warmup']['stale'])
        s._checked=time.monotonic()
        result=await s.server_directory()
        self.assertTrue(result['servers'][0]['stale'])
        s._cache['warmup']['updatedAt']=time.time()-86401
        self.assertEqual((await s.server_directory())['servers'][0]['map'],'')
        s._cache['warmup']['updatedAt']=time.time()-30*86400-1
        self.assertEqual((await s.server_directory())['servers'],[])
if __name__=='__main__':unittest.main()