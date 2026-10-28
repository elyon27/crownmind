'use strict';
window.bibleDataApi=(()=>{
 const cache=new Map();
 async function json(path){
  if(cache.has(path))return cache.get(path);
  const p=fetch('data/'+path,{signal:AbortSignal.timeout(60000)}).then(r=>{if(!r.ok)throw Error('Bible data could not load. Please retry.');return r.json();}).catch(e=>{cache.delete(path);throw e;});
  cache.set(path,p);if(cache.size>30)cache.delete(cache.keys().next().value);return p;
 }
 const book=(t,b)=>json(encodeURIComponent(t)+'/'+encodeURIComponent(b)+'.json');
 async function api(route,p={}){
  const cat=await json('catalog.json'),code=p.translation||'WEB',slug=p.book_slug||'genesis',chapter=Number(p.chapter||1),verse=Number(p.verse||1),available=cat.translationBooks[code]||[];
  const has=(t,b)=>(cat.translationBooks[t]||[]).some(x=>x.slug===b);
  const chapterRows=async(t=code)=>has(t,slug)?(await book(t,slug)).filter(v=>v.chapter_num===chapter):[];
  switch(route){
   case 'books':return p.translation?available:cat.books;
   case 'translations':case 'status':case 'commentary-collections':return cat[route];
   case 'translation-info':return cat.info[code]||[];
   case 'topics':case 'prophecies':return json(route+'.json');
   case 'chapters':return has(code,slug)?[...new Set((await book(code,slug)).map(v=>v.chapter_num))].map(chapter_num=>({chapter_num})):[];
   case 'chapter':return chapterRows();
   case 'verse':return (await chapterRows()).filter(v=>v.verse_num<=verse&&(v.verse_end||v.verse_num)>=verse);
   case 'compare':return (await Promise.all(cat.translations.map(async t=>(await chapterRows(t.code)).filter(v=>v.verse_num<=verse&&(v.verse_end||v.verse_num)>=verse)))).flat();
   case 'commentaries':{
    const work=code==='DRA'?'HAYDOCK':'MHCC';if(!cat.books.some(b=>b.slug===slug))return [];
    const shared=(await json('commentary/'+work+'/'+slug+'.json')).filter(c=>c.chapter_num===chapter);
    const custom=(await json('custom-notes.json')).filter(c=>c.translation===code&&c.slug===slug&&c.chapter_num===chapter);
    return [...custom,...shared.filter(c=>!c.translation)];
   }
   case 'topic':{
    const topic=(await json('topics.json')).find(t=>t.id===p.id);if(!topic)throw Error('Unknown topic');
    const passages=await Promise.all(topic.passages.map(async ref=>({...ref,verses:(await Promise.all(cat.translations.map(async t=>has(t.code,ref.book)?(await book(t.code,ref.book)).filter(v=>v.chapter_num===ref.chapter&&v.verse_num<=ref.end&&(v.verse_end||v.verse_num)>=ref.start):[]))).flat()})));
    return {title:topic.title,study_note:topic.study_note||'',translations:cat.translations,passages};
   }
   case 'passage':return (await chapterRows()).filter(v=>v.verse_num<=Number(p.end||p.start||verse)&&(v.verse_end||v.verse_num)>=Number(p.start||verse));
   case 'verse-links':{
    const end=Number(p.end||verse),matches=ref=>ref.book===slug&&Number(ref.chapter)===chapter&&Number(ref.start)<=end&&Number(ref.end)>=verse;
    const [index,topics,prophecies,source]=await Promise.all([json('cross-references/'+encodeURIComponent(slug)+'.json'),json('topics.json'),json('prophecies.json'),json('cross-references/meta.json')]);
    const refs=new Map();
    const add=(r,reason,note='')=>{
     const meta=cat.books.find(b=>b.slug===r.book);if(!meta)return;
     if(r.book===slug&&Number(r.chapter)===chapter&&Number(r.start)===verse&&Number(r.end)===end)return;
     const key=[r.book,r.chapter,r.start,r.end].join(':');
     if(!refs.has(key))refs.set(key,{...r,name:meta.name,testament:meta.testament,reasons:[],notes:[]});
     const item=refs.get(key);if(!item.reasons.includes(reason))item.reasons.push(reason);if(note&&!item.notes.includes(note))item.notes.push(note);
    };
    for(let v=verse;v<=Math.min(end,verse+1000);v++)for(const row of index[chapter+':'+v]||[])add({book:row[0],chapter:row[1],start:row[2],end:row[3]},'Scripture cross-reference index');
    const themes=topics.filter(t=>t.passages.some(matches));
    for(const t of themes)for(const r of t.passages)add(r,'Shared study theme: '+t.title,t.study_note||'');
    for(const connection of prophecies){
     if(matches(connection.ot))add(connection.nt,connection.kind+': '+connection.title,connection.note||'');
     if(matches(connection.nt))add(connection.ot,connection.kind+': '+connection.title,connection.note||'');
    }
    const order=new Map(cat.books.map((b,i)=>[b.slug,i]));
    return {references:[...refs.values()].sort((a,b)=>order.get(a.book)-order.get(b.book)||a.chapter-b.chapter||a.start-b.start||a.end-b.end),themes:themes.map(t=>({id:t.id,title:t.title,note:t.study_note||''})),source};
   }
   case 'search':{
    const query=String(p.q||'').trim(),offset=Number(p.offset||0);if(query.length<2||query.length>150||!Number.isInteger(offset)||offset<0)throw Error('Enter 2–150 search characters.');
    const fold=s=>s.replace(/[A-Z]/g,c=>c.toLowerCase()),needle=fold(query),key=code+'\0'+query;
    let matches;
    if(api.searchKey===key)matches=api.searchResults;
    else{
     const groups=[];
     for(let i=0;i<available.length;i+=4){groups.push(...await Promise.all(available.slice(i,i+4).map(async b=>(await book(code,b.slug)).filter(v=>fold(v.verse_text||'').includes(needle)))));await new Promise(r=>setTimeout(r,0));}
     matches=groups.flat();api.searchKey=key;api.searchResults=matches;
    }
    return p.paginated?{results:matches.slice(offset,offset+50),total:matches.length}:matches.slice(offset,offset+50);
   }
   default:throw Error('Unknown Bible operation');
  }
 }
 return api;
})();
