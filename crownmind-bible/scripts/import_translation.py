"""Usage: python scripts/import_translation.py path/to/translation.json"""
import sys,json
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from server import initialize,connect

def run(path):
    data=json.loads(Path(path).read_text(encoding='utf-8'))
    t=data['translation']; verses=data['verses']
    for k in ('code','name','language','license'):
        if not isinstance(t[k],str) or not t[k].strip(): raise ValueError('Missing translation '+k)
    if not verses: raise ValueError('No verses supplied')
    initialize()
    with connect() as c:
        books={r['slug']:r['id'] for r in c.execute('SELECT id,slug FROM books')}; records=[]; seen=set()
        for v in verses:
            ch,vn=v['chapter'],v['verse']; text=v['text']; slug=v['book_slug']
            if type(ch)!=int or type(vn)!=int or ch<1 or vn<1 or not isinstance(text,str) or not text.strip(): raise ValueError('Invalid verse')
            key=(slug,ch,vn)
            if key in seen: raise ValueError('Duplicate reference '+str(key))
            seen.add(key); records.append((t['code'],books[slug],ch,vn,text))
        c.execute('INSERT INTO translations VALUES(?,?,?,?) ON CONFLICT(code) DO UPDATE SET name=excluded.name,language=excluded.language,license=excluded.license',tuple(t[k] for k in ('code','name','language','license')))
        c.executemany('INSERT INTO verses(translation,book_id,chapter_num,verse_num,verse_text) VALUES(?,?,?,?,?) ON CONFLICT(translation,book_id,chapter_num,verse_num) DO UPDATE SET verse_text=excluded.verse_text,verse_label=NULL,verse_end=NULL',records)
    print(f'Imported {len(records)} verses into {t["code"]}. Existing unrelated verses preserved.')
if __name__=='__main__': run(sys.argv[1])
