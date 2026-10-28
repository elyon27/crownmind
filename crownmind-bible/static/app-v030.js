'use strict';
const $=id=>document.getElementById(id);
const state={book:'genesis',chapter:1,translation:'WEB',books:[],chapters:[],selected:new Map(),request:0,comparison:0,size:21};
function el(tag,text,cls){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;}
async function api(route,params={}){return window.bibleDataApi(route,params);}

function params(){return {book_slug:state.book,chapter:state.chapter,translation:state.translation};}
function stored(key,fallback){try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{return fallback;}}
function save(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true;}catch{$('status').textContent='Browser storage is unavailable. Your changes could not be saved.';return false;}}
function noteKey(){return 'cm-note:'+state.translation+':'+state.book+':'+state.chapter;}
function view(name){document.querySelector('.study').hidden=name!=='read';document.querySelector('.layout').classList.toggle('topics-layout',name!=='read');for(const n of ['read','saved','notes','database','prophecy','topics'])$(n+'View').hidden=n!==name;document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===name));if(name==='saved')bookmarks();if(name==='notes')renderSavedNotes();if(name==='database')database();}
function books(){const list=$('books');list.replaceChildren();let section='';for(const b of state.books.filter(b=>b.name.toLowerCase().includes($('bookFilter').value.toLowerCase()))){if(section!==b.testament){section=b.testament;list.append(el('h3',({OT:'OLD TESTAMENT',NT:'NEW TESTAMENT',DC:'DEUTEROCANON / APOCRYPHA'})[section]));}const btn=el('button',b.name,b.slug===state.book?'active':'');btn.onclick=()=>{state.book=b.slug;state.chapter=1;view('read');load(true);};list.append(btn);}}
async function load(reset=false){$('note').disabled=true;$('saveNote').disabled=true;searchSession=null;$('moreResults').hidden=true;if(!$('translationInfoPanel').hidden)renderTranslationInfo();$('search').value='';const ticket=++state.request;clearVerseSelection();$('verses').replaceChildren();$('status').textContent='Loading scripture…';$('previous').disabled=$('next').disabled=true;try{const available=await api('books',{translation:state.translation});if(ticket!==state.request)return;state.books=available;if(!available.some(b=>b.slug===state.book)){state.book=available[0]?.slug||'genesis';state.chapter=1;}books();$('mode').textContent=state.translation+' · '+available.length+' books';const chapters=await api('chapters',params());if(ticket!==state.request)return;state.chapters=chapters.map(c=>c.chapter_num);if(reset||!state.chapters.includes(state.chapter))state.chapter=state.chapters[0]||1;$('chapter').replaceChildren(...state.chapters.map(n=>{const o=el('option',n);o.value=n;return o;}));$('chapter').value=state.chapter;$('chapter').disabled=!chapters.length;const name=state.books.find(b=>b.slug===state.book)?.name||state.book;$('title').textContent=name+' '+state.chapter;$('note').value=stored(noteKey(),'');$('note').dataset.key=noteKey();$('note').disabled=false;$('saveNote').disabled=false;setNoteStatus($('noteStatus'),$('note').value.trim()?'✓ Saved on this device':'Notes save automatically on this device.', $('note').value.trim()?'saved':'');const [verses,comments]=await Promise.all([api('chapter',params()),api('commentaries',params())]);if(ticket!==state.request)return;$('status').textContent=verses.length?'Showing '+verses.length+' verse entries · '+state.translation+'.':'No text imported for this book and translation.';for(const v of verses){const row=el('div',undefined,'verse');const n=el('button',v.verse_label||v.verse_num);n.setAttribute('aria-label','Select verse '+(v.verse_label||v.verse_num));n.setAttribute('aria-pressed','false');n.onclick=()=>select(v,row);row.dataset.verseKey=selectionKey(v);row.onclick=e=>{if(!e.target.closest('button,a,.verse-commentary'))select(v,row);};row.append(n,el('span',v.verse_text||'[No verse text in the source edition]'));const notes=comments.filter(c=>c.verse_start<=(v.verse_end||v.verse_num)&&c.verse_end>=v.verse_num);if(notes.length)addCommentary(row,v,notes);$('verses').append(row);}const i=state.chapters.indexOf(state.chapter);$('previous').disabled=i<=0;$('next').disabled=i<0||i>=state.chapters.length-1;}catch(e){if(ticket===state.request)$('status').textContent=e.message+' — please retry shortly.';}}
function selectionKey(v){return v.slug+':'+v.chapter_num+':'+v.verse_num+':'+(v.verse_end||v.verse_num);}
function selectedVerses(){return [...state.selected.values()].sort((a,b)=>a.chapter_num-b.chapter_num||a.verse_num-b.verse_num);}
function selectionLabel(verses){if(!verses.length)return 'No verses selected.';return verses[0].name+' '+verses[0].chapter_num+':'+verses.map(v=>v.verse_label||v.verse_num).join(', ');}
function clearVerseSelection(){
 state.comparison++;state.selected.clear();
 document.querySelectorAll('.verse.chosen').forEach(row=>{row.classList.remove('chosen');row.querySelector('button')?.setAttribute('aria-pressed','false');});
 $('bookmark').disabled=true;$('bookmark').textContent='☆ Save bookmarks';$('clearSelection').disabled=true;
 $('selected').textContent='No verses selected.';$('comparisonCount').textContent='';$('comparison').textContent='Select verses to compare.';
}
function select(v,row){
 const key=selectionKey(v),chosen=!state.selected.has(key);
 if(chosen)state.selected.set(key,v);else state.selected.delete(key);
 row?.classList.toggle('chosen',chosen);row?.querySelector('button')?.setAttribute('aria-pressed',String(chosen));
 const verses=selectedVerses();state.comparison++;
 $('selected').textContent=selectionLabel(verses);$('bookmark').disabled=!verses.length;$('clearSelection').disabled=!verses.length;
 $('bookmark').textContent=!verses.length?'☆ Save bookmarks':verses.length===1?'☆ Save bookmark':'☆ Save '+verses.length+' bookmarks';
 $('comparisonCount').textContent=verses.length?' · '+verses.length+' selected':'';
 $('comparison').textContent=verses.length?'Open Translation Comparison to compare your selected verses.':'Select verses to compare.';
 if($('comparisonDetails').open)renderComparison();
}
async function renderComparison(){
 const ticket=++state.comparison,verses=selectedVerses();
 if(!verses.length){$('comparison').textContent='Select verses to compare.';return;}
 $('comparison').textContent='Loading selected verses…';
 try{
  const results=[];
  for(let i=0;i<verses.length;i+=4){
   if(ticket!==state.comparison||!$('comparisonDetails').open)return;
   results.push(...await Promise.all(verses.slice(i,i+4).map(v=>api('compare',{book_slug:v.slug,chapter:v.chapter_num,verse:v.verse_num}))));
  }
  if(ticket!==state.comparison||!$('comparisonDetails').open)return;
  const box=$('comparison');box.replaceChildren();
  const translations=await api('translations');if(ticket!==state.comparison||!$('comparisonDetails').open)return;
  for(const t of translations){
   const section=el('section',undefined,'comparison-translation');section.append(el('h4',t.code+' · '+t.name));
   const seen=new Set();let count=0,missing=[];
   results.forEach((rows,index)=>{
    const matches=rows.filter(x=>x.translation===t.code);
    if(!matches.length)missing.push(verses[index].verse_label||verses[index].verse_num);
    for(const x of matches){const key=x.chapter_num+':'+x.verse_num+':'+(x.verse_end||x.verse_num);if(seen.has(key))continue;seen.add(key);count++;section.append(el('p',x.chapter_num+':'+(x.verse_label||x.verse_num)+' — '+(x.verse_text||'[No verse text in the source edition]')));}
   });
   if(missing.length)section.append(el('p','No matching text for selected verse number'+(missing.length===1?' ':'s ')+missing.join(', ')+'.','muted'));
   box.append(section);
  }
 }catch(e){if(ticket===state.comparison)$('comparison').textContent='Unable to load comparison: '+e.message;}
}
$('comparisonDetails').addEventListener('toggle',()=>{if($('comparisonDetails').open)renderComparison();else state.comparison++;});
$('clearSelection').onclick=clearVerseSelection;
$('backToTop').onclick=()=>{window.scrollTo({top:0,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});document.getElementById('pageTop').focus({preventScroll:true});};

function setNoteStatus(target,message,state=''){target.textContent=message;target.className='note-save-status '+state;}
function verseNoteKey(v){return 'cm-verse-note:'+encodeURIComponent(v.translation)+':'+encodeURIComponent(v.slug)+':'+v.chapter_num+':'+v.verse_num+':'+(v.verse_end||v.verse_num);}
function bookmarks(){
 const list=$('saved');list.replaceChildren();const data=stored('cm-bookmarks',[]);
 if(!data.length)list.textContent='No bookmarks yet. Select a verse while reading to save it.';
 data.forEach((v,i)=>{
  const card=el('div',undefined,'card bookmark-card');card.append(el('p',v.name+' '+v.chapter_num+':'+(v.verse_label||v.verse_num)+' · '+v.translation),el('p',v.verse_text));
  const label=el('label','Notes for this verse','verse-note-label'),note=el('textarea');note.id='verse-note-'+i;note.rows=4;note.placeholder='Write your reflection for this verse…';note.value=stored(verseNoteKey(v),'');label.htmlFor=note.id;
  const status=el('p',note.value.trim()?'✓ Saved on this device':'Notes save automatically on this device.','note-save-status'+(note.value.trim()?' saved':''));status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  const saveNote=el('button','Save verse note');saveNote.type='button';const persist=()=>{const ok=save(verseNoteKey(v),note.value);setNoteStatus(status,ok?'✓ Saved on this device':'Could not save. Check device storage and try again.',ok?'saved':'error');};note.oninput=persist;saveNote.onclick=persist;
  const open=el('button','Open chapter');open.type='button';open.onclick=()=>{state.book=v.slug;state.chapter=v.chapter_num;state.translation=v.translation;$('translation').value=v.translation;view('read');load();};
  const remove=el('button','Remove bookmark');remove.type='button';remove.onclick=()=>{data.splice(i,1);if(save('cm-bookmarks',data))bookmarks();};
  const links=el('button','Verse links');links.type='button';links.onclick=()=>openVerseLinks(v,links);card.append(label,note,saveNote,status,open,links,remove);list.append(card);
 });
}
async function database(){loadCollections();const box=$('database');box.textContent='Checking database…';try{const data=await api('status');box.replaceChildren(...data.map(t=>{const card=el('div',undefined,'card');card.append(el('h2',t.code+' · '+t.name),el('p',t.verse_count.toLocaleString()+' verse entries · '+t.chapter_count.toLocaleString()+' chapters · '+t.book_count+' books · '+t.language),el('p',t.license));return card;}));}catch(e){box.textContent=e.message;}}
$('bookFilter').oninput=books;$('translation').onchange=()=>{state.translation=$('translation').value;load();};$('chapter').onchange=()=>{state.chapter=Number($('chapter').value);load();};
for(const [id,delta] of [['previous',-1],['next',1]])$(id).onclick=()=>{state.chapter=state.chapters[state.chapters.indexOf(state.chapter)+delta];load();};
for(const [id,delta] of [['smaller',-1],['larger',1]])$(id).onclick=()=>{state.size=Math.max(16,Math.min(30,state.size+delta));document.documentElement.style.setProperty('--size',state.size+'px');};
$('theme').onclick=()=>document.body.classList.toggle('dark');document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>view(b.dataset.view));$('refresh').onclick=database;
$('note').oninput=()=>{const ok=save($('note').dataset.key||noteKey(),$('note').value);setNoteStatus($('noteStatus'),ok?'✓ Saved on this device':'Could not save. Check device storage and try again.',ok?'saved':'error');};$('saveNote').onclick=$('note').oninput;
$('bookmark').onclick=()=>{
 const verses=selectedVerses();if(!verses.length)return;
 const data=stored('cm-bookmarks',[]);
 for(const v of verses)if(!data.some(x=>x.slug===v.slug&&x.chapter_num===v.chapter_num&&x.verse_num===v.verse_num&&x.translation===v.translation))data.push(v);
 if(save('cm-bookmarks',data))$('selected').textContent=selectionLabel(verses)+' · Bookmarked';
};
let searchSession=null;
async function searchPage(session){
 if(session.busy)return;
 session.busy=true;$('moreResults').disabled=true;$('status').textContent='Searching… First search downloads this translation’s books; please wait.';
 try{
  const data=await api('search',{q:session.query,translation:session.translation,offset:session.shown,paginated:1});
  if(session!==searchSession||session.ticket!==state.request)return;
  for(const v of data.results){const b=el('button',v.name+' '+v.chapter_num+':'+(v.verse_label||v.verse_num)+' — '+v.verse_text,'result');b.onclick=()=>{state.book=v.slug;state.chapter=v.chapter_num;load();};$('verses').append(b);}
  session.shown+=data.results.length;
  $('status').textContent=session.shown+' / '+data.total+' results shown. Select a result to open its chapter.';
  $('moreResults').hidden=session.shown>=data.total;
 }catch(err){if(session===searchSession){$('status').textContent=err.message;$('moreResults').hidden=false;}}
 finally{session.busy=false;if(session===searchSession)$('moreResults').disabled=false;}
}
$('searchForm').onsubmit=e=>{e.preventDefault();const session={ticket:++state.request,query:$('search').value,translation:state.translation,shown:0,busy:false};searchSession=session;clearVerseSelection();$('verses').replaceChildren();$('moreResults').hidden=true;$('previous').disabled=$('next').disabled=true;searchPage(session);};
$('moreResults').onclick=()=>{if(searchSession)searchPage(searchSession);};

(async()=>{try{const [b,t]=await Promise.all([api('books'),api('translations')]);state.books=b;$('translation').replaceChildren(...t.map(x=>{const o=el('option',x.code+' · '+x.name);o.value=x.code;return o;}));state.translation=t.some(x=>x.code==='WEB')?'WEB':t[0]?.code;$('translation').value=state.translation;await load();}catch(e){$('status').textContent='Cannot connect to the Bible service. Please refresh or try again shortly.';}})();

let infoRequest=0;
async function renderTranslationInfo(){
 const ticket=++infoRequest,code=state.translation;
 $('translationInfoTitle').textContent=code+' · Translation information';
 $('translationInfoBody').textContent='Loading translation information…';
 try{
  const data=await api('translation-info',{translation:code});
  if(ticket!==infoRequest||code!==state.translation)return;
  const t=data[0];if(!t)throw Error('No information available for this translation.');
  $('translationInfoTitle').textContent=t.title||t.name;
  const body=$('translationInfoBody');body.replaceChildren();
  body.append(el('p',t.introduction||t.name),el('p',t.language+' · '+t.book_count+' books · '+t.chapter_count.toLocaleString()+' chapters · '+t.verse_count.toLocaleString()+' verse entries','info-facts'));
  if(t.edition_note)body.append(el('p',t.edition_note));
  body.append(el('p',t.license,'info-facts'),el('p','Includes the complete verse-text dataset. Publisher footnotes, introductions, and original page formatting are not included. This introduction is a summary prepared for CrownMind.','info-facts'));
  if(t.source_url){const link=el('a','Translation source and further information');link.href=t.source_url;link.target='_blank';link.rel='noopener noreferrer';body.append(link);}
 }catch(e){if(ticket===infoRequest)$('translationInfoBody').textContent='Unable to load translation information: '+e.message;}
}
function closeTranslationInfo(){++infoRequest;$('translationInfoPanel').hidden=true;$('translationInfo').setAttribute('aria-expanded','false');$('translationInfo').classList.remove('active');$('translationInfo').focus();}
$('translationInfo').onclick=()=>{if(!$('translationInfoPanel').hidden){closeTranslationInfo();return;}$('translationInfoPanel').hidden=false;$('translationInfo').setAttribute('aria-expanded','true');$('translationInfo').classList.add('active');renderTranslationInfo();};
$('closeTranslationInfo').onclick=closeTranslationInfo;
$('translationInfoPanel').addEventListener('keydown',e=>{if(e.key==='Escape')closeTranslationInfo();});

$('clearSearch').onclick=()=>{load();$('search').focus();};

let prophecyItems=[];
function showProphecies(){
 const q=$('prophecyFilter').value.toLowerCase(),items=prophecyItems.filter(x=>JSON.stringify(x).toLowerCase().includes(q));
 $('prophecyStatus').textContent=items.length+' / '+prophecyItems.length+' connections';
 $('prophecyList').replaceChildren(...items.map(item=>{
  const card=el('details',undefined,'card'),summary=el('summary',item.title+' · '+item.kind);card.append(summary);
  const columns=el('div',undefined,'prophecy-columns');
  for(const [side,label] of [['ot','Old Testament'],['nt','New Testament']]){
   const ref=item[side],box=el('div');box.append(el('h3',label));
   const name=ref.verses[0]?.name||ref.book,reference=name+' '+ref.chapter+':'+ref.start+(ref.end!==ref.start?'–'+ref.end:'');box.append(el('strong',reference));
   for(const v of ref.verses)box.append(el('p',v.verse_num+' '+v.verse_text));
   const link=el('a','Read passage in context ↗');link.href='https://www.biblegateway.com/passage/?search='+encodeURIComponent(reference)+'&version=WEB';link.target='_blank';link.rel='noopener noreferrer';box.append(link);columns.append(box);
  }card.append(columns);if(item.note)card.append(el('p',item.note,'muted'));return card;
 }));
}
$('prophecyFilter').oninput=showProphecies;
(async()=>{try{prophecyItems=await api('prophecies');showProphecies();}catch(e){$('prophecyStatus').textContent='Unable to load connections: '+e.message;}})();

function addCommentary(row,verse,notes){
 const button=el('button','💬','commentary-toggle'),panel=el('div',undefined,'verse-commentary');
 panel.id='commentary-'+verse.translation+'-'+verse.book_id+'-'+verse.chapter_num+'-'+verse.verse_num;panel.hidden=true;
 button.type='button';button.title='Show commentary';button.setAttribute('aria-label','Show commentary for verse '+(verse.verse_label||verse.verse_num));button.setAttribute('aria-expanded','false');button.setAttribute('aria-controls',panel.id);
 let built=false;
 button.onclick=()=>{
  if(!built){for(const note of notes){const card=el('section');card.append(el('h3',note.title),el('p',note.author+' · '+(note.tradition||'Commentary')+' · '+(note.language||'English'),'muted'),el('p',(note.scope||'Verse range')+' · '+verse.name+' '+verse.chapter_num+':'+note.verse_start+(note.verse_end!==note.verse_start?'–'+note.verse_end:''),'muted'),el('p',note.body));
   if(note.source&&/^https?:\/\//.test(note.source)){const link=el('a','Commentary source');link.href=note.source;link.target='_blank';link.rel='noopener noreferrer';card.append(link);}else card.append(el('p',note.source,'muted'));
   panel.append(card);}built=true;}
  panel.hidden=!panel.hidden;button.setAttribute('aria-expanded',String(!panel.hidden));button.title=panel.hidden?'Show commentary':'Hide commentary';
 };
 row.append(button,panel);
}

async function loadCollections(){
 const box=$('commentaryCollections');box.textContent='Loading commentary collection…';
 try{const works=await api('commentary-collections');box.replaceChildren(...works.map(w=>{const card=el('section',undefined,'card');card.append(el('h3',w.title),el('p',w.author+' · '+w.tradition+' · '+w.language),el('p',w.book_count+' books · '+w.chapter_count.toLocaleString()+' chapters · '+w.entry_count.toLocaleString()+' commentary entries'),el('p',w.license,'muted'));const a=el('a','Source and original download');a.href=w.source_url;a.target='_blank';a.rel='noopener noreferrer';card.append(a);return card;}));}catch(e){box.textContent=e.message;}
}

let topicRequest=0,topicCaller=null;
function renderTopicPassage(p,translations,index){
 const group=el('section',undefined,'topic-passage');
 const heading=el('div',undefined,'topic-passage-heading');
 const name=p.verses[0]?.name||p.book;
 const reference=name+' '+p.chapter+':'+p.start+(p.end!==p.start?'–'+p.end:'');
 heading.append(el('h3',reference));
 const label=el('label','Bible version','topic-version-control');
 const select=el('select');select.id='topic-version-'+index;
 select.setAttribute('aria-label','Bible version for '+reference);
 label.htmlFor=select.id;
 for(const t of translations){const option=el('option',t.code+' · '+t.name);option.value=t.code;select.append(option);}
 select.value=translations.some(t=>t.code===state.translation)?state.translation:(translations.find(t=>t.code==='WEB')?.code||translations[0]?.code||'');
 label.append(select);heading.append(label);
 const card=el('section',undefined,'card');card.setAttribute('aria-live','polite');
 function render(){
  const t=translations.find(t=>t.code===select.value);card.replaceChildren();
  if(!t)return;
  card.append(el('h4',t.code+' · '+t.name));
  const verses=p.verses.filter(v=>v.translation===t.code);
  if(!verses.length)card.append(el('p','No matching verse text available in this edition.'));
  for(const v of verses)card.append(el('p',(v.verse_label||v.verse_num)+' '+(v.verse_text||'[No verse text in the source edition]')));
 }
 select.onchange=render;render();group.append(heading,card);return group;
}

async function openTopic(topic,caller){
 topicCaller=caller;const ticket=++topicRequest;$('topicTitle').textContent=topic.title;$('topicContent').textContent='Loading passages…';$('topicNote').textContent=topic.title==='Homosexuality'?'These passages are commonly discussed under this modern topic label. Translation of ancient terms and their application are interpreted differently across Christian traditions.':'';$('topicDialog').showModal();
 try{const data=await api('topic',{id:topic.id});if(ticket!==topicRequest)return;
 if(data.study_note)$('topicNote').textContent=data.study_note;
 $('topicContent').replaceChildren(...data.passages.map((p,i)=>renderTopicPassage(p,data.translations,i)));
 }catch(e){if(ticket===topicRequest)$('topicContent').textContent='Unable to load passages: '+e.message;}
}
$('returnTopics').onclick=()=>$('topicDialog').close();
$('topicDialog').addEventListener('close',()=>{++topicRequest;topicCaller?.focus();});
(async()=>{try{const topics=await api('topics');topics.sort((a,b)=>a.title.localeCompare(b.title,'en',{sensitivity:'base'}));$('topicsGrid').replaceChildren(...topics.map(t=>{const b=el('button',t.title);b.type='button';b.dataset.topic=t.id;b.onclick=()=>openTopic(t,b);return b;}));$('topicsStatus').textContent=topics.length+' topics';}catch(e){$('topicsStatus').textContent=e.message;}})();

// Existing chapter-note keys are retained so previously saved reflections remain available.
let notesRequest=0;
async function renderSavedNotes(){
 const ticket=++notesRequest,list=$('notesList'),status=$('notesStatus');
 list.replaceChildren();status.textContent='Loading saved notes…';
 let entries=[];
 try{
  for(let i=0;i<localStorage.length;i++){
   const key=localStorage.key(i),match=/^cm-note:([^:]+):([^:]+):(\d+)$/.exec(key||'');
   if(!match)continue;
   const text=stored(key,null);
   if(typeof text==='string'&&text.trim())entries.push({key,text,translation:match[1],slug:match[2],chapter:Number(match[3])});
  }
 }catch{status.textContent='Saved notes could not be read. Browser storage may be unavailable.';return;}
 entries.sort((a,b)=>a.translation.localeCompare(b.translation)||a.slug.localeCompare(b.slug)||a.chapter-b.chapter);
 if(!entries.length){status.textContent='No saved notes yet. Add a personal chapter note in Read to see it here.';return;}
 status.textContent=entries.length+' saved '+(entries.length===1?'note':'notes')+'. Loading matching verses…';
 const jobs=entries.map(n=>{
  const card=el('article',undefined,'card saved-note'),title=el('h2',n.slug+' '+n.chapter+' · '+n.translation);
  card.append(title,el('h3','Your note'),el('p',n.text,'saved-note-text'));
  const open=el('button','Open chapter / edit note');open.type='button';
  open.onclick=()=>{state.book=n.slug;state.chapter=n.chapter;state.translation=n.translation;$('translation').value=n.translation;view('read');load();};
  card.append(open,el('h3','Accompanying chapter verses'));
  const verses=el('div','Loading verses…','saved-note-verses');card.append(verses);list.append(card);
  return async()=>{
   try{
    const data=await api('chapter',{translation:n.translation,book_slug:n.slug,chapter:n.chapter});
    if(ticket!==notesRequest)return;
    if(data.length)title.textContent=data[0].name+' '+n.chapter+' · '+n.translation;
    verses.replaceChildren();
    if(!data.length){verses.textContent='No matching chapter text is available in this translation.';return;}
    for(const v of data){const line=el('p');line.append(el('strong',(v.verse_label||v.verse_num)+' '),document.createTextNode(v.verse_text||'[No verse text in the source edition]'));verses.append(line);}
   }catch{if(ticket===notesRequest)verses.textContent='Unable to load these verses. Your saved note is still available. Reopen Notes to retry.';}
  };
 });
 // Keep network and memory use bounded when many chapters have notes.
 for(let i=0;i<jobs.length;i+=4){if(ticket!==notesRequest)return;await Promise.all(jobs.slice(i,i+4).map(job=>job()));}
 if(ticket===notesRequest)status.textContent=entries.length+' saved '+(entries.length===1?'note':'notes')+'.';
}
window.addEventListener('storage',event=>{if((event.key===null||event.key.startsWith('cm-note:'))&&!$('notesView').hidden)renderSavedNotes();});

// Verse links combine a licensed reference index with explicitly labeled study themes.
let verseLinksRequest=0,verseLinksCaller=null,verseLinksAnchor=null;
function passageLabel(ref){return ref.name+' '+ref.chapter+':'+ref.start+(ref.end!==ref.start?'–'+ref.end:'');}
async function openLinkedChapter(ref,translation){
 $('verseLinksDialog').close();state.book=ref.book;state.chapter=ref.chapter;state.translation=translation;$('translation').value=translation;
 $('comparisonDetails').open=false;view('read');const pending=load(),ticket=state.request;await pending;
 if(ticket!==state.request||state.book!==ref.book||state.chapter!==ref.chapter)return;
 const verses=await api('passage',{book_slug:ref.book,chapter:ref.chapter,translation,start:ref.start,end:ref.end});
 if(ticket!==state.request)return;
 let first=null;
 for(const v of verses){const row=[...document.querySelectorAll('.verse')].find(x=>x.dataset.verseKey===selectionKey(v));if(row){select(v,row);first=first||row;}}
 if(first)first.scrollIntoView({block:'center',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
}
function linkedPassage(ref,translation){
 const details=el('details',undefined,'verse-link-item'),summary=el('summary',passageLabel(ref));
 const body=el('div',undefined,'verse-link-body');details.append(summary,body);
 const reasons=el('p',ref.reasons.join(' · '),'muted');body.append(reasons);
 for(const note of ref.notes)body.append(el('p',note,'muted'));
 const text=el('div','Expand to load this passage.','linked-scripture');body.append(text);
 const open=el('button','Open chapter');open.type='button';open.onclick=()=>openLinkedChapter(ref,translation);body.append(open);
 let loaded=false,loading=false;
 details.addEventListener('toggle',async()=>{
  if(!details.open||loaded||loading)return;loading=true;text.textContent='Loading passage…';
  try{
   const verses=await api('passage',{book_slug:ref.book,chapter:ref.chapter,translation,start:ref.start,end:ref.end});text.replaceChildren();
   if(!verses.length)text.textContent='No matching numbered passage in '+translation+'. Select another translation. No replacement text has been substituted.';
   for(const v of verses)text.append(el('p',(v.verse_label||v.verse_num)+' '+(v.verse_text||'[No verse text in the source edition]')));
   loaded=true;
  }catch(e){text.textContent='Unable to load passage: '+e.message+' Close and reopen this passage to retry.';}
  finally{loading=false;}
 });
 return details;
}
function renderVerseLinks(data){
 const target=$('verseLinksContent'),translation=$('verseLinksTranslation').value;target.replaceChildren();
 if(data.themes.length){
  const themes=el('section');themes.append(el('h3','Thematic and spiritual connections'));
  for(const theme of data.themes){const p=el('p');p.append(el('strong',theme.title));if(theme.note)p.append(document.createTextNode(' — '+theme.note));themes.append(p);}target.append(themes);
 }
 for(const [code,name] of [['OT','Old Testament'],['NT','New Testament'],['DC','Deuterocanonical / Apocryphal books']]){
  const refs=data.references.filter(r=>r.testament===code);if(!refs.length)continue;
  const group=el('section');group.append(el('h3',name+' · '+refs.length+' linked passages'));
  for(const ref of refs)group.append(linkedPassage(ref,translation));target.append(group);
 }
 if(!data.references.length)target.append(el('p','No links are indexed for this numbered verse. This does not mean that the passage has no spiritual connections.'));
 $('verseLinksStatus').textContent=data.references.length+' linked passages · '+translation+'. Expand any reference to read it.';
 const attribution=el('p',undefined,'muted');attribution.append(document.createTextNode('Cross-reference index: '));
 const source=el('a','OpenBible.info');source.href=data.source.source_url;source.target='_blank';source.rel='noopener noreferrer';
 const license=el('a',data.source.license);license.href=data.source.license_url;license.target='_blank';license.rel='noopener noreferrer';
 attribution.append(source,document.createTextNode(' · '),license,document.createTextNode('. Book codes converted; ranges split by chapter; duplicate targets merged. Thematic connections are CrownMind study selections.'));target.append(attribution);
}
async function openVerseLinks(v,caller){
 verseLinksCaller=caller;verseLinksAnchor=v;const ticket=++verseLinksRequest;
 $('verseLinksTitle').textContent='Verse links · '+v.name+' '+v.chapter_num+':'+(v.verse_label||v.verse_num)+' · '+v.translation;
 $('verseLinksContent').replaceChildren();$('verseLinksStatus').textContent='Loading verse links…';$('verseLinksTranslation').disabled=true;
 $('verseLinksDialog').showModal();
 try{
  const [data,translations]=await Promise.all([api('verse-links',{book_slug:v.slug,chapter:v.chapter_num,verse:v.verse_num,end:v.verse_end||v.verse_num}),api('translations')]);
  if(ticket!==verseLinksRequest)return;
  const control=$('verseLinksTranslation');control.replaceChildren(...translations.map(t=>{const o=el('option',t.code+' · '+t.name);o.value=t.code;return o;}));
  // KJV is explicit because the reference source uses its numbering convention.
  control.value=translations.some(t=>t.code==='KJV')?'KJV':translations[0].code;control.disabled=false;
  control.onchange=()=>renderVerseLinks(data);renderVerseLinks(data);
 }catch(e){if(ticket===verseLinksRequest)$('verseLinksStatus').textContent='Unable to load verse links: '+e.message+' Close and reopen to retry.';}
}
$('closeVerseLinks').onclick=()=>$('verseLinksDialog').close();
$('verseLinksDialog').addEventListener('close',()=>{++verseLinksRequest;verseLinksCaller?.focus();});
