import {createHash} from "node:crypto";
export type TriviaQuestion={id:string;question:string;options:string[];answer:number;explanation:string};
export type TriviaArticle={title:string;body:string|null;excerpt:string|null};
const plain=(s:string)=>s.replace(/<script[\s\S]*?<\/script>/gi,"").replace(/<[^>]+>/g," ").replace(/&quot;/g,'"').replace(/&amp;/g,"&").replace(/&#39;/g,"'").replace(/\s+/g," ").trim();
export const triviaArticleDigest=(a:TriviaArticle)=>createHash("sha256").update(JSON.stringify([a.title,a.excerpt,a.body])).digest("hex");
export function articleTrivia(a:TriviaArticle):TriviaQuestion[] {
 const text=plain(a.body || a.excerpt || ""), sentences=text.match(/[^.!?]+[.!?]*/g)?.map(s=>s.trim()).filter(s=>s.length>=45&&s.length<=380)||[];
 const questions:TriviaQuestion[]=[], used=new Set<string>();
 const candidates=[
  {re:/\b(?:satu minggu|sepekan|seminggu)\b/i,others:["Dua hari","Dua minggu","Satu bulan"]},
  {re:/\b\d{1,2}\s+(?:Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember)\b/i,others:["1 Januari","2 Februari","3 Maret","4 April"]},
  {re:/\b\d{1,2}[–-]\d{1,2}\b/,others:["0–0","1–0","2–1","3–2"]},
  {re:/\b(?:Erick Thohir|John Herdman|Luka Menalo|Marten Paes|Irfan Bachdim|Anthony Gordon|Lamine Yamal|Shin Tae-yong)\b/i,others:["Cristiano Ronaldo","Lionel Messi","Kylian Mbappé","Harry Kane"]},
  {re:/\b(?:Persib|Persija|Persebaya|PSS Sleman|Arsenal|Chelsea|Liverpool|Ajax)\b/i,others:["Juventus","AS Roma","Bayern München","PSG"]},
 ];
 for(const candidate of candidates){
  const sentence=sentences.find(s=>candidate.re.test(s));if(!sentence)continue;
  const match=sentence.match(candidate.re);if(!match||used.has(sentence))continue;
  const correct=match[0],wrong=candidate.others.filter(x=>x.toLowerCase().replace(/[–-]/g,"-")!==correct.toLowerCase().replace(/[–-]/g,"-")).slice(0,3);
  if(wrong.length!==3)continue;
  const index=parseInt(createHash("sha256").update(a.title+sentence).digest("hex").slice(0,2),16)%4,options=[...wrong];options.splice(index,0,correct);
  questions.push({id:"q"+(questions.length+1),question:'Lengkapi fakta berikut: “'+sentence.replace(correct,"_____")+'”',options,answer:index,explanation:sentence});
  used.add(sentence);if(questions.length===3)break;
 }
 // Every supported fallback is an exact sentence from the article, not an invented statistic.
 if(!questions.length&&sentences[0]){
  const sentence=sentences[0],words=sentence.match(/\b[A-Za-zÀ-ÿ]{6,}\b/g)||[],correct=words.at(-1);
  if(correct){const options=[correct,"keberuntungan","perjalanan","perubahan"].filter((x,i,all)=>all.indexOf(x)===i);if(options.length===4)questions.push({id:"q1",question:'Lengkapi kalimat dalam artikel: “'+sentence.replace(correct,"_____")+'”',options,answer:0,explanation:sentence});}
 }
 return questions;
}
export function triviaQuestionIssues(questions:TriviaQuestion[]) {
 if(!Array.isArray(questions)||questions.length<1||questions.length>3)return ["Trivia membutuhkan 1–3 soal."];
 return questions.flatMap((q,i)=>q.id!=="q"+(i+1)||!q.question?.trim()||q.options?.length!==4||new Set(q.options).size!==4||
 !Number.isInteger(q.answer)||q.answer<0||q.answer>3||!q.explanation?.trim()?["Soal trivia tidak valid."]:[]);
}
