// Operator audience policy; discovery hints never prove current clubs, squads or facts.
const fs=require('node:fs'),path=require('node:path');
const policy=JSON.parse(fs.readFileSync(path.join(__dirname,'../editorial/audience-priorities.json'),'utf8'));
const normalize=s=>' '+String(s||'').normalize('NFKD').replace(/\p{M}/gu,'').toLocaleLowerCase('id-ID').replace(/[^\p{L}\p{N}]+/gu,' ').trim()+' ';
const contains=(text,alias)=>normalize(text).includes(normalize(alias));
const entities=(text,items)=>items.filter(x=>x.aliases.some(a=>contains(text,a)&&!(x.name==='Inter Milan'&&a==='Inter'&&contains(text,'Inter Miami')))).map(x=>x.name);
function assess(subject,context='',pillar=''){
 const text=subject+' '+context;
 if(/tarkam|turnamen kampung|sepak bola gampong|sepak bola amatir/i.test(text)&&!policy.excluded_default_leagues.some(x=>contains(text,x)))return{tier:'COMMUNITY',score:60,allowed:true,matches:[]};
 const domestic=entities(text,policy.domestic_clubs),europe=entities(text,policy.european_clubs);
 const players=entities(text,policy.diaspora_discovery_hints),national=policy.national_team_aliases.some(x=>contains(text,x));
 const explicitDiaspora=/\b(?:pemain|bek|gelandang|penyerang|kiper)\s+(?:timnas|tim nasional)\s+indonesia\b/i.test(text);
 const overseas=/di luar negeri|luar indonesia|liga eropa|belanda|italia|inggris|jerman|spanyol|prancis|australia|\bmls\b|major league soccer/i.test(text)||europe.length>0;
 const diaspora=overseas&&(players.length>0||explicitDiaspora);
 const excluded=policy.excluded_default_leagues.filter(x=>contains(text,x));
 const americanClubs=policy.american_football_club_hints.filter(x=>contains(text,x));
 if(diaspora)return{tier:'DIASPORA',score:100,allowed:true,matches:players.length?players:['Pemain Timnas Indonesia di luar negeri'],verification_required:true};
 if(national)return{tier:'TIMNAS',score:95,allowed:true,matches:['Timnas Indonesia'],verification_required:true};
 if(domestic.length)return{tier:'DOMESTIC_CLUB',score:90,allowed:true,matches:domestic,verification_required:true};
 if(europe.length)return{tier:'EUROPEAN_CLUB',score:80,allowed:true,matches:europe,verification_required:true};
 if(excluded.length||americanClubs.length)return{tier:'AMERICAN_LEAGUE',score:0,allowed:false,matches:[...excluded,...americanClubs],reason:'Liga Amerika bukan pilihan default audiens Stadione; ketersediaan footage tidak mengubah relevansi.'};
 if(/Tarkam|Komunitas/i.test(pillar)||/\btarkam\b|turnamen kampung|sepak bola gampong/i.test(text))return{tier:'COMMUNITY',score:60,allowed:true,matches:[]};
 if(/sepak bola|football|soccer|MLS|liga|Eropa/i.test(pillar))return{tier:'OUT_OF_FOCUS',score:20,allowed:false,matches:[],reason:'Subjek sepak bola belum terkait klub prioritas, Timnas atau pemain Timnas di luar negeri.'};
 return{tier:'OTHER_SPORT',score:50,allowed:true,matches:[]};
}
function packetAudience(packet){
 const a=packet?.article;
 // Sources/footers/caption are not the main subject and cannot whitelist an unrelated story.
 const title=a?.title||packet?.slides?.[0]?.headline||'';
 const context=[a?.dek,a?.paragraphs?.[0]?.text].filter(Boolean).join(' ');
 return assess(title,context,packet?.assignment?.pillar||'');
}
function compatible(a,pillar){
 if(pillar==='Sepak Bola Eropa')return ['EUROPEAN_CLUB','DIASPORA'].includes(a.tier);
 if(pillar==='Sepak Bola Indonesia')return ['DOMESTIC_CLUB','TIMNAS','DIASPORA'].includes(a.tier);
 if(pillar==='Tarkam & Komunitas')return a.tier==='COMMUNITY';
 if(pillar==='Olahraga Indonesia')return ['OTHER_SPORT','TIMNAS'].includes(a.tier);
 return true;
}
function packetIssues(packet){const a=packetAudience(packet);if(!a.allowed)return ['Audience policy: '+a.reason];return compatible(a,packet?.assignment?.pillar||'')?[]:['Audience policy: kandidat tidak sesuai pilar slot; jangan mengganti matriks untuk mengejar footage.'];}
function rankCandidates(items,pillar=''){
 return items.map((item,index)=>({item,index,audience:assess(item.title||item.query||'',item.summary||item.description?.split('\n')[0]||'',pillar)}))
 .filter(x=>x.audience.allowed&&compatible(x.audience,pillar))
 .sort((a,b)=>b.audience.score-a.audience.score||a.index-b.index)
 .map(x=>({...x.item,audience:x.audience}));
}
function defaultQuery(pillar){
 if(pillar==='Sepak Bola Eropa')return policy.european_clubs.map(x=>x.name==='Bayern Muenchen'?'Bayern':x.name==='Ajax Amsterdam'?'Ajax':x.name).join('|');
 if(pillar==='Sepak Bola Indonesia')return [...policy.domestic_clubs.map(x=>x.name),'Timnas Indonesia','Maarten Paes','pemain Timnas Indonesia di luar negeri'].join('|');
 if(pillar==='Olahraga Indonesia')return 'atlet Indonesia bulutangkis voli balap prestasi';
 if(pillar==='Tarkam & Komunitas')return 'turnamen tarkam sepak bola kampung komunitas Indonesia';
 throw Error('Pilar riset tidak dikenali.');
}
module.exports={policy,assess,packetAudience,packetIssues,compatible,rankCandidates,defaultQuery};
