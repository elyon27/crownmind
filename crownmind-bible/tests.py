import unittest,json,threading,urllib.request,xml.etree.ElementTree as ET
from collections import Counter
import server
class CompleteBibles(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  server.initialize();server.Handler.log_message=lambda *args:None
  cls.http=server.ThreadingHTTPServer(('127.0.0.1',0),server.Handler);threading.Thread(target=cls.http.serve_forever,daemon=True).start();cls.url='http://127.0.0.1:'+str(cls.http.server_port)
 @classmethod
 def tearDownClass(cls):cls.http.shutdown();cls.http.server_close()
 def get(self,path):return json.load(urllib.request.urlopen(self.url+path))['data']
 def test_all_source_records(self):
  codes={b['source_code']:i+1 for i,b in enumerate(json.loads((server.ROOT/'data/books.json').read_text(encoding='utf-8')))}
  with server.connect() as c:
   for code,filename in [('WEB','eng-web'),('KJV','eng-kjv'),('ASV','eng-asv'),('BSB','engbsb'),('DRA','engDRA'),('YLT','engylt'),('DBY','engDBY'),('RV','eng-rv')]:
    source=ET.parse(server.ROOT/f'data/{filename}_vpl.xml').getroot()
    actual=c.execute('SELECT book_id,chapter_num,verse_label,verse_text FROM verses WHERE translation=?',(code,)).fetchall()
    self.assertEqual(Counter((codes[v.get('b')],int(v.get('c')),v.get('v'),''.join(v.itertext()).strip()) for v in source),Counter(tuple(v) for v in actual))
   self.assertEqual(c.execute('PRAGMA integrity_check').fetchone()[0],'ok');self.assertEqual(list(c.execute('PRAGMA foreign_key_check')),[])
 def test_tagalog_source(self):
  data=json.loads((server.ROOT/'data/tagalog-1905-source.json').read_text(encoding='utf-8'))
  expected=[(b['nr'],ch['chapter'],v['verse'],v['text'].strip()) for b in data['books'] for ch in b['chapters'] for v in ch['verses']]
  with server.connect() as c:
   actual=[tuple(r) for r in c.execute("SELECT book_id,chapter_num,verse_num,verse_text FROM verses WHERE translation='ADB1905' ORDER BY book_id,chapter_num,verse_num")]
  self.assertEqual(sorted(expected),actual)
  self.assertTrue(self.get('/api/search?translation=ADB1905&q=pagibig'))
  self.assertEqual(self.get('/api/verse?translation=ADB1905')[0]['verse_text'],'Nang pasimula ay nilikha ng Dios ang langit at ang lupa.')
  self.assertTrue(self.get('/api/verse?translation=ADB1905&book_slug=revelation&chapter=22&verse=21'))
 def test_every_chapter(self):
  for code,totalbooks,totalchapters,totalverses in [('WEB',81,1402,38058),('KJV',80,1362,36822),('ASV',66,1189,31102),('BSB',66,1189,31086),('DRA',73,1334,35811),('YLT',66,1189,31102),('DBY',66,1189,31099),('RV',80,1362,36878),('ADB1905',66,1189,31102)]:
   books=self.get('/api/books?translation='+code);self.assertEqual(len(books),totalbooks);count=0;total=0
   for b in books:
    prefix='?translation='+code+'&book_slug='+b['slug'];chapters=self.get('/api/chapters'+prefix);self.assertTrue(chapters)
    for ch in chapters:
     data=self.get('/api/chapter'+prefix+'&chapter='+str(ch['chapter_num']));self.assertTrue(data)
     self.assertTrue(all(v['slug']==b['slug'] and v['chapter_num']==ch['chapter_num'] and v['translation']==code for v in data));total+=len(data);count+=1
   self.assertEqual((count,total),(totalchapters,totalverses))
 def test_comparison_search_and_canon(self):
  self.assertEqual({v['translation'] for v in self.get('/api/compare?book_slug=john&chapter=3&verse=16')},{'KJV','WEB','ASV','BSB','DRA','YLT','DBY','RV','ADB1905'})
  self.assertTrue(all(v['translation']=='KJV' for v in self.get('/api/search?translation=KJV&q=begotten')))
  self.assertTrue(self.get('/api/verse?translation=KJV&book_slug=revelation&chapter=22&verse=21'))
  rv=self.get('/api/search?translation=RV&q=begotten');self.assertTrue(rv);self.assertTrue(all(v['translation']=='RV' for v in rv))
  self.assertTrue(self.get('/api/verse?translation=RV&book_slug=revelation&chapter=22&verse=21'))
  self.assertEqual(self.get('/api/verse?translation=RV&book_slug=sirach&chapter=11&verse=16')[0]['verse_label'],'15-16')
  dby=self.get('/api/search?translation=DBY&q=only-begotten');self.assertTrue(dby);self.assertTrue(all(v['translation']=='DBY' for v in dby))
  self.assertTrue(self.get('/api/verse?translation=DBY&book_slug=revelation&chapter=22&verse=21'))
  ylt=self.get('/api/search?translation=YLT&q=age-during');self.assertTrue(ylt);self.assertTrue(all(v['translation']=='YLT' for v in ylt))
  self.assertTrue(self.get('/api/verse?translation=YLT&book_slug=revelation&chapter=22&verse=21'))
  dra=self.get('/api/search?translation=DRA&q=charity');self.assertTrue(dra);self.assertTrue(all(v['translation']=='DRA' for v in dra))
  self.assertTrue(self.get('/api/chapter?translation=DRA&book_slug=daniel&chapter=14'))
  self.assertTrue(self.get('/api/chapter?translation=DRA&book_slug=esther&chapter=16'))
  self.assertTrue(self.get('/api/verse?translation=DRA&book_slug=revelation&chapter=22&verse=21'))
  bsb=self.get('/api/search?translation=BSB&q=one%20and%20only');self.assertTrue(bsb);self.assertTrue(all(v['translation']=='BSB' for v in bsb))
  self.assertTrue(self.get('/api/verse?translation=BSB&book_slug=revelation&chapter=22&verse=21'))
  results=self.get('/api/search?translation=ASV&q=Jehovah');self.assertTrue(results);self.assertTrue(all(v['translation']=='ASV' for v in results))
  self.assertTrue(self.get('/api/verse?translation=ASV&book_slug=revelation&chapter=22&verse=21'))
  self.assertEqual(self.get('/api/chapter?translation=ASV&book_slug=tobit'),[])
  self.assertTrue(self.get('/api/chapter?translation=KJV&book_slug=susanna'))
  self.assertEqual(self.get('/api/chapter?translation=WEB&book_slug=susanna'),[])
  self.assertEqual(self.get('/api/verse?book_slug=4-maccabees&chapter=8&verse=29')[0]['verse_label'],'28-29')
  self.assertEqual({s['code']:s['verse_count'] for s in self.get('/api/status')},{'WEB':38058,'KJV':36822,'ASV':31102,'BSB':31086,'DRA':35811,'YLT':31102,'DBY':31099,'RV':36878,'ADB1905':31102})
if __name__=='__main__':unittest.main()
