'use strict';
const $=id=>document.getElementById(id);
const state={book:'genesis',chapter:1,translation:'WEB',books:[],chapters:[],selected:null,request:0,comparison:0,size:21};
function el(tag,text,cls){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;}
async function api(route,params={}){return window.bibleDataApi(route,params);}

function params(){return {book_slug:state.book,chapter:state.chapter,translation:state.translation};}
function stored(key,fallback){try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{return fallback;}}
function save(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true;}catch{$('status').textContent='Browser storage is unavailable. Your changes could not be saved.';return false;}}
function noteKey(){return 'cm-note:'+state.translation+':'+state.book+':'+state.chapter;}
function view(name){document.querySelector('.study').hidden=name==='topics';document.querySelector('.layout').classList.toggle('topics-layout',name==='topics');for(const n of ['read','saved','database','prophecy','topics'])$(n+'View').hidden=n!==name;document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===name));if(name==='saved')bookmarks();if(name==='database')database();}
function books(){const list=$('books');list.replaceChildren();let section='';for(const b of state.books.filter(b=>b.name.toLowerCase().includes($('bookFilter').value.toLowerCase()))){if(section!==b.testament){section=b.testament;list.append(el('h3',({OT:'OLD TESTAMENT',NT:'NEW TESTAMENT',DC:'DEUTEROCANON / APOCRYPHA'})[section]));}const btn=el('button',b.name,b.slug===state.book?'active':'');btn.onclick=()=>{state.book=b.slug;state.chapter=1;view('read');load(true);};list.append(btn);}}
async function load(reset=false){searchSession=null;$('moreResults').hidden=true;if(!$('translationInfoPanel').hidden)renderTranslationInfo();$('search').value='';const ticket=++state.request;state.comparison++;state.selected=null;$('bookmark').disabled=true;$('comparison').textContent='Select a verse to compare.';$('selected').textContent='No verse selected.';$('verses').replaceChildren();$('status').textContent='Loading scripture…';$('previous').disabled=$('next').disabled=true;try{const available=await api('books',{translation:state.translation});if(ticket!==state.request)return;state.books=available;if(!available.some(b=>b.slug===state.book)){state.book=available[0]?.slug||'genesis';state.chapter=1;}books();$('mode').textContent=state.translation+' · '+available.length+' books';const chapters=await api('chapters',params());if(ticket!==state.request)return;state.chapters=chapters.map(c=>c.chapter_num);if(reset||!state.chapters.includes(state.chapter))state.chapter=state.chapters[0]||1;$('chapter').replaceChildren(...state.chapters.map(n=>{const o=el('option',n);o.value=n;return o;}));$('chapter').value=state.chapter;$('chapter').disabled=!chapters.length;const name=state.books.find(b=>b.slug===state.book)?.name||state.book;$('title').textContent=name+' '+state.chapter;$('note').value=stored(noteKey(),'');$('noteStatus').textContent='Notes stay on this browser.';const [verses,comments]=await Promise.all([api('chapter',params()),api('commentaries',params())]);if(ticket!==state.request)return;$('status').textContent=verses.length?'Showing '+verses.length+' verse entries · '+state.translation+'.':'No text imported for this book and translation.';for(const v of verses){const row=el('div',undefined,'verse');const n=el('button',v.verse_label||v.verse_num);n.setAttribute('aria-label','Study verse '+(v.verse_label||v.verse_num));n.onclick=()=>select(v,row);row.append(n,el('span',v.verse_text||'[No verse text in the source edition]'));const notes=comments.filter(c=>c.verse_start<=(v.verse_end||v.verse_num)&&c.verse_end>=v.verse_num);if(notes.length)addCommentary(row,v,notes);$('verses').append(row);}const i=state.chapters.indexOf(state.chapter);$('previous').disabled=i<=0;$('next').disabled=i<0||i>=state.chapters.length-1;}catch(e){if(ticket===state.request)$('status').textContent=e.message+' — please retry shortly.';}}
async function select(v,row){state.selected=v;const ticket=++state.comparison;document.querySelectorAll('.verse').forEach(x=>x.classList.remove('chosen'));row?.classList.add('chosen');$('selected').textContent=v.name+' '+v.chapter_num+':'+(v.verse_label||v.verse_num);$('bookmark').disabled=false;$('comparison').textContent='Loading…';try{const data=await api('compare',{book_slug:v.slug,chapter:v.chapter_num,verse:v.verse_num});if(ticket!==state.comparison)return;$('comparison').replaceChildren(...data.map(x=>el('p',x.translation+' '+x.chapter_num+':'+(x.verse_label||x.verse_num)+' — '+(x.verse_text||'[No verse text in the source edition]'))));}catch(e){if(ticket===state.comparison)$('comparison').textContent=e.message;}}
function bookmarks(){const list=$('saved');list.replaceChildren();const data=stored('cm-bookmarks',[]);if(!data.length)list.textContent='No bookmarks yet. Select a verse while reading to save it.';data.forEach((v,i)=>{const card=el('div',undefined,'card');card.append(el('p',v.name+' '+v.chapter_num+':'+(v.verse_label||v.verse_num)+' · '+v.translation),el('p',v.verse_text));const open=el('button','Open chapter');open.onclick=()=>{state.book=v.slug;state.chapter=v.chapter_num;state.translation=v.translation;$('translation').value=v.translation;view('read');load();};const remove=el('button','Remove');remove.onclick=()=>{data.splice(i,1);if(save('cm-bookmarks',data))bookmarks();};card.append(open,remove);list.append(card);});}
async function database(){loadCollections();const box=$('database');box.textContent='Checking database…';try{const data=await api('status');box.replaceChildren(...data.map(t=>{const card=el('div',undefined,'card');card.append(el('h2',t.code+' · '+t.name),el('p',t.verse_count.toLocaleString()+' verse entries · '+t.chapter_count.toLocaleString()+' chapters · '+t.book_count+' books · '+t.language),el('p',t.license));return card;}));}catch(e){box.textContent=e.message;}}
$('bookFilter').oninput=books;$('translation').onchange=()=>{state.translation=$('translation').value;load();};$('chapter').onchange=()=>{state.chapter=Number($('chapter').value);load();};
for(const [id,delta] of [['previous',-1],['next',1]])$(id).onclick=()=>{state.chapter=state.chapters[state.chapters.indexOf(state.chapter)+delta];load();};
for(const [id,delta] of [['smaller',-1],['larger',1]])$(id).onclick=()=>{state.size=Math.max(16,Math.min(30,state.size+delta));document.documentElement.style.setProperty('--size',state.size+'px');};
$('theme').onclick=()=>document.body.classList.toggle('dark');document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>view(b.dataset.view));$('refresh').onclick=database;
$('note').oninput=()=>{$('noteStatus').textContent=save(noteKey(),$('note').value)?'Note saved on this browser.':'Note could not be saved.';};$('saveNote').onclick=$('note').oninput;
$('bookmark').onclick=()=>{if(!state.selected)return;const data=stored('cm-bookmarks',[]),v=state.selected;if(!data.some(x=>x.slug===v.slug&&x.chapter_num===v.chapter_num&&x.verse_num===v.verse_num&&x.translation===v.translation))data.push(v);if(save('cm-bookmarks',data))$('selected').textContent=v.name+' '+v.chapter_num+':'+(v.verse_label||v.verse_num)+' · Bookmarked';};
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
$('searchForm').onsubmit=e=>{e.preventDefault();const session={ticket:++state.request,query:$('search').value,translation:state.translation,shown:0,busy:false};searchSession=session;state.comparison++;state.selected=null;$('bookmark').disabled=true;$('selected').textContent='No verse selected.';$('comparison').textContent='Select a verse to compare.';$('verses').replaceChildren();$('moreResults').hidden=true;$('previous').disabled=$('next').disabled=true;searchPage(session);};
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
async function openTopic(topic,caller){
 topicCaller=caller;const ticket=++topicRequest;$('topicTitle').textContent=topic.title;$('topicContent').textContent='Loading passages…';$('topicNote').textContent=topic.title==='Homosexuality'?'These passages are commonly discussed under this modern topic label. Translation of ancient terms and their application are interpreted differently across Christian traditions.':'';$('topicDialog').showModal();
 try{const data=await api('topic',{id:topic.id});if(ticket!==topicRequest)return;
 $('topicContent').replaceChildren(...data.passages.map(p=>{const group=el('section',undefined,'topic-passage');const name=p.verses[0]?.name||p.book;group.append(el('h3',name+' '+p.chapter+':'+p.start+(p.end!==p.start?'–'+p.end:'')));
 for(const t of data.translations){const card=el('section',undefined,'card');card.append(el('h4',t.code+' · '+t.name));const verses=p.verses.filter(v=>v.translation===t.code);if(!verses.length)card.append(el('p','No matching verse text available in this edition.'));for(const v of verses)card.append(el('p',(v.verse_label||v.verse_num)+' '+(v.verse_text||'[No verse text in the source edition]')));group.append(card);}return group;}));
 }catch(e){if(ticket===topicRequest)$('topicContent').textContent='Unable to load passages: '+e.message;}
}
$('returnTopics').onclick=()=>$('topicDialog').close();
$('topicDialog').addEventListener('close',()=>{++topicRequest;topicCaller?.focus();});
(async()=>{try{const topics=await api('topics');topics.sort((a,b)=>a.title.localeCompare(b.title,'en',{sensitivity:'base'}));$('topicsGrid').replaceChildren(...topics.map(t=>{const b=el('button',t.title);b.type='button';b.dataset.topic=t.id;b.onclick=()=>openTopic(t,b);return b;}));$('topicsStatus').textContent=topics.length+' topics';}catch(e){$('topicsStatus').textContent=e.message;}})();
