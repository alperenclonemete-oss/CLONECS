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
        self.assertEqual((await s.server_directory())['servers'],[])
if __name__=='__main__':unittest.main()