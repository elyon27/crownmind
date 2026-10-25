"""CrownMind production WSGI application; scripture database is read-only."""
import json, os, sqlite3
from contextlib import contextmanager
from pathlib import Path
from flask import Flask, request, jsonify, send_from_directory
ROOT=Path(__file__).resolve().parent
DB=Path(os.environ.get('BIBLE_DB',str(ROOT/'data'/'bible.db'))).resolve()
app=Flask(__name__,static_folder=None)
app.config['MAX_CONTENT_LENGTH']=1024
@contextmanager
def connect():
    c=sqlite3.connect(DB.as_uri()+'?mode=ro',uri=True,timeout=5)
    c.row_factory=sqlite3.Row
    c.execute('PRAGMA query_only=ON')
    # Bound expensive queries in public requests.
    import time
    deadline=time.monotonic()+8
    c.set_progress_handler(lambda: int(time.monotonic()>deadline),10000)
    try: yield c
    finally: c.close()
if not DB.is_file(): raise RuntimeError('Missing data/bible.db')
with connect() as c: c.execute('SELECT verse_label,verse_end FROM verses LIMIT 1')
def reply(obj,status=200): return jsonify(obj),status
@app.after_request
def headers(response):
    response.headers['Cache-Control']='no-store'
    response.headers['X-Content-Type-Options']='nosniff'
    response.headers['Referrer-Policy']='strict-origin-when-cross-origin'
    response.headers['Content-Security-Policy']="default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'self' https://crownmind.net https://www.crownmind.net"
    return response
@app.get('/healthz')
def health():
    with connect() as c: c.execute('SELECT 1 FROM translations LIMIT 1').fetchone()
    return jsonify(status='ok',version='v024')
@app.get('/')
@app.get('/index.html')
def index(): return send_from_directory(ROOT/'public','index.html')
@app.get('/<asset>')
def asset(asset):
    if asset not in {'app-v024.js','style-v024.css'}: return reply({'error':'Not found'},404)
    return send_from_directory(ROOT/'public',asset)
@app.get('/api/<endpoint>')
def api(endpoint):
    if len(request.query_string)>2048: return reply({'success':False,'error':'Query too long'},400)
    get=lambda k,d='':request.args.get(k,d)
    try:
        with connect() as c:
            def rows(sql,args=()): return [dict(r) for r in c.execute(sql,args)]
            code=get('translation','WEB'); slug=get('book_slug','genesis')
            if request.path=='/api/books':
                data=rows('SELECT b.* FROM books b WHERE EXISTS (SELECT 1 FROM verses v WHERE v.book_id=b.id AND v.translation=?) ORDER BY b.sort_order',(get('translation'),)) if get('translation') else rows('SELECT * FROM books ORDER BY sort_order')
            elif request.path=='/api/translation-info':
                metadata=json.loads((ROOT/'data'/'translation-info.json').read_text(encoding='utf-8'))
                data=rows('SELECT t.*,count(v.verse_num) verse_count,count(DISTINCT v.book_id) book_count,count(DISTINCT CAST(v.book_id AS TEXT)||char(58)||CAST(v.chapter_num AS TEXT)) chapter_count FROM translations t LEFT JOIN verses v ON t.code=v.translation WHERE t.code=? GROUP BY t.code',(code,))
                for item in data: item.update(metadata.get(item['code'],{}))
            elif request.path=='/api/commentaries':
                data=rows('SELECT c.* FROM commentaries c JOIN books b ON b.id=c.book_id WHERE translation=? AND b.slug=? AND chapter_num=? ORDER BY verse_start,id',(code,slug,int(get('chapter','1'))))
                work='HAYDOCK' if code=='DRA' else 'MHCC'
                if c.execute('SELECT 1 FROM translations WHERE code=?',(code,)).fetchone():
                    data+=rows('SELECT e.id,e.book_id,e.chapter_num,e.verse_start,e.verse_end,e.body,e.scope,w.title,w.author,w.source_url AS source,w.tradition,w.language FROM commentary_entries e JOIN commentary_works w ON w.id=e.work_id JOIN books b ON b.id=e.book_id WHERE e.work_id=? AND b.slug=? AND e.chapter_num=? ORDER BY e.verse_start,e.id',(work,slug,int(get('chapter','1'))))
            elif request.path=='/api/commentary-collections':
                data=rows('SELECT w.*,count(e.id) entry_count,count(DISTINCT e.book_id) book_count,count(DISTINCT e.book_id||char(58)||e.chapter_num) chapter_count FROM commentary_works w JOIN commentary_entries e ON e.work_id=w.id GROUP BY w.id')

            elif request.path=='/api/topics':
                data=json.loads((ROOT/'data'/'topics.json').read_text(encoding='utf-8'))
            elif request.path=='/api/topic':
                topics=json.loads((ROOT/'data'/'topics.json').read_text(encoding='utf-8'))
                topic=next((t for t in topics if t['id']==get('id')),None)
                if not topic: raise ValueError('Unknown topic')
                data={'title':topic['title'],'translations':rows('SELECT * FROM translations ORDER BY code'),'passages':[]}
                for ref in topic['passages']:
                    verses=rows('SELECT b.name,b.slug,v.* FROM verses v JOIN books b ON b.id=v.book_id WHERE b.slug=? AND chapter_num=? AND verse_num<=? AND COALESCE(verse_end,verse_num)>=? ORDER BY translation,verse_num',(ref['book'],ref['chapter'],ref['end'],ref['start']))
                    data['passages'].append(dict(ref,verses=verses))
            elif request.path=='/api/prophecies':
                data=json.loads((ROOT/'data'/'prophecy-links.json').read_text(encoding='utf-8'))
                for item in data:
                    for side in ['ot','nt']:
                        ref=item[side]
                        ref['verses']=rows('SELECT b.name,v.chapter_num,v.verse_num,v.verse_text FROM verses v JOIN books b ON b.id=v.book_id WHERE v.translation=? AND b.slug=? AND v.chapter_num=? AND v.verse_num BETWEEN ? AND ? ORDER BY v.verse_num',('WEB',ref['book'],ref['chapter'],ref['start'],ref['end']))
            elif request.path=='/api/translations': data=rows('SELECT * FROM translations ORDER BY code')
            elif request.path=='/api/status': data=rows('SELECT t.*,count(v.verse_num) verse_count,count(DISTINCT v.book_id) book_count,count(DISTINCT CAST(v.book_id AS TEXT)||char(58)||CAST(v.chapter_num AS TEXT)) chapter_count FROM translations t LEFT JOIN verses v ON t.code=v.translation GROUP BY t.code')
            elif request.path=='/api/chapters': data=rows('SELECT DISTINCT chapter_num FROM verses JOIN books ON books.id=book_id WHERE slug=? AND translation=? ORDER BY chapter_num',(slug,code))
            elif request.path in ['/api/chapter','/api/verse','/api/compare']:
                chapter=int(get('chapter','1')); verse=int(get('verse','1'))
                if chapter<1 or verse<1: raise ValueError('Chapter and verse must be positive')
                sql='SELECT b.name,b.slug,v.* FROM verses v JOIN books b ON b.id=v.book_id WHERE b.slug=? AND chapter_num=?'; args=[slug,chapter]
                if request.path!='/api/compare': sql+=' AND translation=?'; args.append(code)
                if request.path!='/api/chapter': sql+=' AND verse_num<=? AND COALESCE(verse_end,verse_num)>=?'; args.extend([verse,verse])
                data=rows(sql+' ORDER BY translation,verse_num',args)
            elif request.path=='/api/search':
                term=get('q').strip(); offset=int(get('offset','0'))
                if not 2<=len(term)<=150 or offset<0: raise ValueError('Enter 2–150 search characters; offset must be nonnegative')
                term=term.replace('\\','\\\\').replace('%','\\%').replace('_','\\_')
                data=rows("SELECT b.name,b.slug,v.* FROM verses v JOIN books b ON b.id=v.book_id WHERE translation=? AND verse_text LIKE ? ESCAPE '\\' ORDER BY b.sort_order,chapter_num,verse_num LIMIT 50 OFFSET ?",(code,'%'+term+'%',offset))
                if get('paginated')=='1':
                    total=c.execute("SELECT COUNT(*) FROM verses WHERE translation=? AND verse_text LIKE ? ESCAPE '\\'",(code,'%'+term+'%')).fetchone()[0]
                    data={'results':data,'total':total}
            else: return reply({'error':'Unknown endpoint'},404)
            return reply({'success':True,'data':data})
    except ValueError as e: return reply({'success':False,'error':str(e)},400)
    except sqlite3.Error: return reply({'success':False,'error':'Database unavailable; check server configuration'},500)
