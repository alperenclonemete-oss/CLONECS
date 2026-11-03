import os,tempfile,unittest
from unittest.mock import patch
from fastapi import FastAPI
from fastapi.testclient import TestClient
import account_store as store
import lineup_admin as a

class AdminTests(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory()
  self.patches=[patch.object(store,'DB_PATH',os.path.join(self.tmp.name,'test.db')),patch.object(store,'DATABASE_URL',''),patch.object(a,'DATABASE_URL',''),patch.object(a,'get_user_for_session',side_effect=lambda token: {'steam_id':a.OWNER_STEAM} if token=='owner' else {'steam_id':'different','username':'_CLONE_'} if token=='imposter' else None),patch.object(a,'persistent_storage_configured',return_value=True),patch.dict(os.environ,{'LINEUP_ADMIN_ENABLED':'true','LINEUP_ADMIN_STEAM_IDS':a.OWNER_STEAM,'PUBLIC_BASE_URL':'http://testserver'})]
  for p in self.patches:p.start()
  a.init_lineups(); app=FastAPI();app.include_router(a.router);self.c=TestClient(app)
  self.headers={'X-Lineup-Editor':'1','Origin':'http://testserver'}
  self.item=dict(id='example',map='mirage',title='Test',type='smoke',team='T',x=10,y=20,tx=30,ty=40)
 def tearDown(self):
  self.c.close()
  for p in reversed(self.patches):p.stop()
  self.tmp.cleanup()
 def owner(self):self.c.cookies.set('cs2coach_session','owner')
 def save(self):return self.c.put('/api/lineup-admin/drafts/example',json=self.item,headers=self.headers)
 def test_auth_and_csrf(self):
  self.assertEqual(self.c.get('/api/lineup-admin/access').json(),{'admin':False})
  self.assertEqual(self.save().status_code,403)
  self.c.cookies.set('cs2coach_session','imposter');self.assertEqual(self.save().status_code,403)
  self.owner();self.assertEqual(self.c.get('/admin/lineups').status_code,200)
  self.assertEqual(self.c.put('/api/lineup-admin/drafts/example',json=self.item).status_code,403)
  self.headers['Origin']='https://evil.test';self.assertEqual(self.save().status_code,403)
 def test_draft_publish_and_hide(self):
  self.owner();self.assertEqual(self.save().status_code,200)
  self.assertEqual(self.c.get('/api/lineups/overrides').json()['items'],[])
  self.assertEqual(self.c.post('/api/lineup-admin/publish/example',headers=self.headers).status_code,200)
  self.item['title']='Changed';self.save()
  self.assertEqual(self.c.get('/api/lineups/overrides').json()['items'][0]['title'],'Test')
  self.item['hidden']=True;self.save();self.c.post('/api/lineup-admin/publish/example',headers=self.headers)
  self.assertTrue(self.c.get('/api/lineups/overrides').json()['items'][0]['hidden'])
 def test_video_privacy_range_and_limits(self):
  self.owner();h={**self.headers,'Content-Type':'video/mp4'};body=b'\x00\x00\x00\x18ftypisom'+b'0'*20
  self.assertEqual(self.c.post('/api/lineup-admin/video',content=b'invalid',headers=h).status_code,415)
  with patch.object(a,'MAX_VIDEO',8):self.assertEqual(self.c.post('/api/lineup-admin/video',content=body,headers=h).status_code,413)
  r=self.c.post('/api/lineup-admin/video',content=body,headers=h);self.assertEqual(r.status_code,200);url=r.json()['url']
  self.c.cookies.clear();self.assertEqual(self.c.get(url).status_code,403)
  self.owner();self.item['video']=url;self.save();self.c.post('/api/lineup-admin/publish/example',headers=self.headers)
  self.c.cookies.clear();r=self.c.get(url,headers={'Range':'bytes=4-7'});self.assertEqual(r.status_code,206);self.assertEqual(r.content,b'ftyp')
  self.assertEqual(self.c.get(url,headers={'Range':'bytes=999-'}).status_code,416)
 def test_invalid_coordinates_and_shutdown(self):
  self.owner();self.item['x']=101;self.assertEqual(self.save().status_code,422)
  self.item['x']=10
  with patch.dict(os.environ,{'LINEUP_ADMIN_ENABLED':'false'}):self.assertEqual(self.save().status_code,403)
  with patch.object(a,'persistent_storage_configured',return_value=False):self.assertEqual(self.save().status_code,503)
if __name__=='__main__':unittest.main()
