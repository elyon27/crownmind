"""Bundle OpenBible.info's CC BY cross-reference index for offline study."""
import csv,hashlib,io,json,urllib.request,zipfile
from pathlib import Path
SOURCE_URL='https://a.openbible.info/data/cross-references.zip'
CODES='Gen Exod Lev Num Deut Josh Judg Ruth 1Sam 2Sam 1Kgs 2Kgs 1Chr 2Chr Ezra Neh Esth Job Ps Prov Eccl Song Isa Jer Lam Ezek Dan Hos Joel Amos Obad Jonah Mic Nah Hab Zeph Hag Zech Mal Matt Mark Luke John Acts Rom 1Cor 2Cor Gal Eph Phil Col 1Thess 2Thess 1Tim 2Tim Titus Phlm Heb Jas 1Pet 2Pet 1John 2John 3John Jude Rev'.split()
SLUGS='genesis exodus leviticus numbers deuteronomy joshua judges ruth 1-samuel 2-samuel 1-kings 2-kings 1-chronicles 2-chronicles ezra nehemiah esther job psalms proverbs ecclesiastes song-of-solomon isaiah jeremiah lamentations ezekiel daniel hosea joel amos obadiah jonah micah nahum habakkuk zephaniah haggai zechariah malachi matthew mark luke john acts romans 1-corinthians 2-corinthians galatians ephesians philippians colossians 1-thessalonians 2-thessalonians 1-timothy 2-timothy titus philemon hebrews james 1-peter 2-peter 1-john 2-john 3-john jude revelation'.split()
MAP=dict(zip(CODES,SLUGS))
def export_cross_references(source,target,catalog,archive=None):
 if archive is None:
  req=urllib.request.Request(SOURCE_URL,headers={'User-Agent':'CrownMind-Bible-Library/1.0'})
  with urllib.request.urlopen(req,timeout=90) as response: archive=response.read(10_000_001)
  if len(archive)>10_000_000:raise ValueError('Cross-reference archive too large')
 with zipfile.ZipFile(io.BytesIO(archive)) as z:
  info=z.getinfo('cross_references.txt')
  if info.file_size>60_000_000:raise ValueError('Cross-reference text too large')
  text=z.read(info).decode('utf-8-sig')
 # All source and target numbering is validated against the bundled KJV edition.
 counts={}
 for b in catalog['translationBooks']['KJV']:
  rows=json.loads((target/'data/KJV'/(b['slug']+'.json')).read_text())
  counts[b['slug']]={}
  for v in rows:counts[b['slug']][v['chapter_num']]=max(counts[b['slug']].get(v['chapter_num'],0),v.get('verse_end') or v['verse_num'])
 def parse(r):
  b,c,v=r.split('.');return MAP[b],int(c),int(v)
 def valid(b,c,v):return b in counts and 1<=v<=counts[b].get(c,0)
 index={b['slug']:{} for b in catalog['books']};accepted=0;skipped=0;source_rows=0
 for r in csv.reader(io.StringIO(text),delimiter='\t'):
  if not r or r[0]=='From Verse':continue
  source_rows+=1
  try:
   b,c,v=parse(r[0]);parts=r[1].split('-');tb,tc,tv=parse(parts[0]);eb,ec,ev=parse(parts[-1]);votes=int(r[2])
   if tb!=eb or tc>ec or not valid(b,c,v) or not valid(tb,tc,tv) or not valid(eb,ec,ev):raise ValueError('Unmapped number')
   # Cross-chapter ranges become separate, navigable chapter passages.
   for chapter in range(tc,ec+1):
    start=tv if chapter==tc else 1;end=ev if chapter==ec else counts[tb][chapter]
    if start>end:raise ValueError('Reversed range')
    key=f'{c}:{v}';refs=index[b].setdefault(key,{})
    ident=(tb,chapter,start,end);refs[ident]=max(refs.get(ident,-999999),votes)
   accepted+=1
  except (ValueError,KeyError):skipped+=1
 out=target/'data/cross-references';out.mkdir(parents=True,exist_ok=True)
 link_count=0
 for slug,verses in index.items():
  data={key:[[b,c,s,e,votes] for (b,c,s,e),votes in sorted(refs.items(),key=lambda item:(-item[1],item[0]))] for key,refs in verses.items()}
  link_count+=sum(len(v) for v in data.values())
  (out/(slug+'.json')).write_text(json.dumps(data,ensure_ascii=False,separators=(',',':')))
 meta={'source':'OpenBible.info cross-references, drawing primarily on the Treasury of Scripture Knowledge','source_url':'https://www.openbible.info/labs/cross-references/','license':'CC BY 4.0','license_url':'https://creativecommons.org/licenses/by/4.0/','changes':'Reference codes converted to CrownMind book slugs; cross-chapter ranges split; duplicate targets merged; unavailable numbered references omitted. No Bible text imported from this source.','numbering':'KJV conventional reference numbering; numbering is not remapped for editions such as Douay–Rheims.','source_rows':source_rows,'accepted_source_rows':accepted,'omitted_source_rows':skipped,'indexed_passages':link_count,'archive_sha256':hashlib.sha256(archive).hexdigest(),'source_header':text.splitlines()[0]}
 if source_rows<300000:raise ValueError('Incomplete cross-reference source')
 (out/'meta.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2))
 (target/'sources'/'cross-reference-notice.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2))
 print('Cross-reference index:',accepted,'source rows;',link_count,'chapter passages;',skipped,'unavailable references omitted')
 return meta
