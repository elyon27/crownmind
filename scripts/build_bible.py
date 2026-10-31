"""Export the read-only Bible as static data and preserve the Institute site."""
import sys,json,shutil,sqlite3
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];SOURCE=ROOT/'crownmind-bible';OUT=ROOT/'dist'
sys.path.insert(0,str(SOURCE))
from app import app
from build_verse_links import export_cross_references

def build():
 if OUT.exists():shutil.rmtree(OUT)
 OUT.mkdir()
 for p in ROOT.iterdir():
  if p.name.startswith('.') or p.name in {'dist','scripts','crownmind-bible','bible','node_modules','netlify.toml','BIBLE-INTEGRATION.md','android'}:continue
  if p.is_dir():shutil.copytree(p,OUT/p.name)
  elif p.suffix.lower() in {'.html','.xml','.txt','.json','.ico','.png','.svg','.webmanifest'}:shutil.copy2(p,OUT/p.name)
 target=OUT/'bible';shutil.copytree(SOURCE/'static',target);data=target/'data';data.mkdir()
 client=app.test_client()
 def api(route,**params):
  r=client.get('/api/'+route,query_string=params);assert r.status_code==200,(route,r.status_code);return r.json['data']
 def emit(path,obj):
  p=data/path;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(obj,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
 cat={key:api(key) for key in ['books','translations','status','commentary-collections']}
 cat['info']={t['code']:api('translation-info',translation=t['code']) for t in cat['translations']}
 cat['translationBooks']={t['code']:api('books',translation=t['code']) for t in cat['translations']}
 emit(Path('catalog.json'),cat)
 for key in ['topics','prophecies']:emit(Path(key+'.json'),api(key))
 c=sqlite3.connect((SOURCE/'data/bible.db').resolve().as_uri()+'?mode=ro',uri=True);c.row_factory=sqlite3.Row;total=0
 for t in cat['translations']:
  code=t['code']
  for b in cat['translationBooks'][code]:
   verses=[dict(r) for r in c.execute('SELECT b.name,b.slug,v.* FROM verses v JOIN books b ON b.id=v.book_id WHERE translation=? AND book_id=? ORDER BY chapter_num,verse_num',(code,b['id']))]
   emit(Path(code)/(b['slug']+'.json'),verses);total+=len(verses)
 # Commentary is shared between editions; export once per collection and book.
 for code in ['WEB','DRA']:
  work='HAYDOCK' if code=='DRA' else 'MHCC'
  for b in cat['books']:
   notes=[]
   for ch in api('chapters',translation=code,book_slug=b['slug']):notes.extend(api('commentaries',translation=code,book_slug=b['slug'],chapter=ch['chapter_num']))
   emit(Path('commentary')/work/(b['slug']+'.json'),notes)
 # Translation-specific custom notes, if any, are exported separately.
 emit(Path('custom-notes.json'),[dict(r) for r in c.execute('SELECT c.*,b.slug FROM commentaries c JOIN books b ON b.id=c.book_id')])
 notices=target/'sources';notices.mkdir()
 for pattern in ['*source-notice*','*manifest.json']:
  for p in (SOURCE/'data').glob(pattern):shutil.copy2(p,notices/p.name)
 export_cross_references(SOURCE,target,cat)
 c.close();emit(Path('build.json'),{'version':'v032','verse_entries':total,'translations':len(cat['translations'])});print('Built static Bible:',total,'verses')
if __name__=='__main__':build()

