"""Verify curated study content against the generated reading data."""
from pathlib import Path
import json
ROOT=Path(__file__).resolve().parents[1]/'dist/bible/data'
def read(name):return json.loads((ROOT/name).read_text())
topics=read('topics.json');prophecies=read('prophecies.json');assert len(topics)==72;assert len(prophecies)==72
assert len({x['id'] for x in topics})==72;assert len({x['title'].casefold() for x in topics})==72
cache={}
def check(p):
 key=p['book']
 if key not in cache:cache[key]=read('WEB/'+key+'.json')
 for n in range(p['start'],p['end']+1):assert any(v['chapter_num']==p['chapter'] and v['verse_num']<=n<=(v.get('verse_end') or v['verse_num']) for v in cache[key]),p
for topic in topics:
 assert len(topic['passages'])==7,topic['title']
 assert len({tuple(p[k] for k in ['book','chapter','start','end']) for p in topic['passages']})==7,topic['title']
 for passage in topic['passages']:check(passage)
for p in prophecies:
 for side in ['ot','nt']:check(p[side]);assert p[side]['verses'],p['title']
meta=read('cross-references/meta.json');assert meta['accepted_source_rows']>300000
assert read('cross-references/genesis.json')['1:2']
print('Verified: 72 topics, 504 passages, 72 OT/NT connections, cross-reference index and valid WEB references')
