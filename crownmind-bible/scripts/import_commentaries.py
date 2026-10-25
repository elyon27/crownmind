"""Import edition-specific verse commentary from an authorized JSON file."""
import json,sqlite3,sys
from pathlib import Path
root=Path(__file__).resolve().parents[1]
items=json.loads(Path(sys.argv[1]).read_text(encoding='utf-8'))
with sqlite3.connect(root/'data/bible.db') as c:
 c.execute('PRAGMA foreign_keys=ON')
 for item in items:
  book=c.execute('SELECT id FROM books WHERE slug=?',(item['book_slug'],)).fetchone()
  if not book: raise ValueError('Unknown book: '+item['book_slug'])
  if not item['body'].strip(): raise ValueError('Empty commentary')
  c.execute('INSERT INTO commentaries(translation,book_id,chapter_num,verse_start,verse_end,title,author,source,body) VALUES(?,?,?,?,?,?,?,?,?)',(item['translation'],book[0],item['chapter'],item['verse_start'],item['verse_end'],item['title'],item['author'],item['source'],item['body']))
print('Imported',len(items),'commentaries')
