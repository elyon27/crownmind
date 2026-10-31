import hashlib, sqlite3
from pathlib import Path
from app import app, connect, DB
client=app.test_client()
def data(path):
 r=client.get('/api/'+path); assert r.status_code==200,(path,r.status_code,r.data[:100]); assert r.json['success']; return r.json['data']
before=hashlib.sha256(DB.read_bytes()).hexdigest()
assert client.get('/healthz').json['status']=='ok'
assert client.get('/').status_code==200
for asset in ['app-v023.js','style-v023.css']: assert client.get('/'+asset).status_code==200
for path in ['/data/bible.db','/server.py','/../data/bible.db','/.env']:
 assert client.get(path).status_code==404,path
assert client.post('/api/translations').status_code==405
assert client.get('/api/search?q=x').status_code==400
assert client.get('/api/chapter?chapter=bad').status_code==400
assert client.get('/api/topic?id=missing').status_code==400
translations=data('translations'); assert len(translations)==9
for t in translations:
 code=t['code']; assert data('chapter?translation='+code+'&book_slug=genesis&chapter=1')
 assert data('translation-info?translation='+code)
 assert data('commentaries?translation='+code+'&book_slug=genesis&chapter=1')
assert len(data('compare?book_slug=john&chapter=3&verse=16'))==9
first=data('search?translation=WEB&q=love&paginated=1'); second=data('search?translation=WEB&q=love&paginated=1&offset=50')
assert len(first['results'])==50 and first['total']>50 and first['results']!=second['results']
assert len(data('topics'))==50
for topic in data('topics'): assert data('topic?id='+topic['id'])['passages']
assert len(data('prophecies'))==50
assert len(data('commentary-collections'))==2
assert len(data('status'))==9
with connect() as c:
 try: c.execute('DELETE FROM translations'); raise AssertionError('Write allowed')
 except sqlite3.OperationalError: pass
assert hashlib.sha256(DB.read_bytes()).hexdigest()==before
# Exercise a prefix-stripping reverse proxy mount.
from werkzeug.middleware.dispatcher import DispatcherMiddleware
from werkzeug.test import Client
from werkzeug.wrappers import Response
mounted=Client(DispatcherMiddleware(Response('missing',404),{'/bible':app}),Response)
for route in ['/bible/','/bible/app-v023.js','/bible/api/translations']:
 assert mounted.get(route).status_code==200,route
print('PASS: nine translations, commentary, 50 topics, prophecy, search paging, read-only database, blocked private files, subpath routing.')
