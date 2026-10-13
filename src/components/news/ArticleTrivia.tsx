"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {C} from "@/lib/design";
type Question={id:string;question:string;options:string[]};
type Result={correct:boolean;points_earned:number;total_points:number;explanation:string;correct_choice:number;already_answered:boolean};
type Score={logged_in:boolean;points:number;leaderboard:{rank:number;display_name:string;points:number}[]};
export default function ArticleTrivia({articleId,slug,count}:{articleId:string;slug:string;count:number}){
 const [score,setScore]=useState<Score|null>(null),[stage,setStage]=useState<"IDLE"|"CAPTCHA"|"QUIZ"|"DONE">("IDLE");
 const [challenge,setChallenge]=useState<{session_id:string;left:number;right:number}|null>(null),[sum,setSum]=useState(""),[trap,setTrap]=useState("");
 const [questions,setQuestions]=useState<Question[]>([]),[index,setIndex]=useState(0),[choice,setChoice]=useState<number|null>(null),[result,setResult]=useState<Result|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState("");
 async function refreshScore(){const r=await fetch("/api/news/trivia/score",{cache:"no-store"});if(r.ok)setScore(await r.json());}
 useEffect(()=>{let active=true;fetch("/api/news/trivia/score",{cache:"no-store"}).then(async r=>{if(!r.ok)throw Error("Trivia belum dapat dimuat. Coba kembali nanti.");return r.json();}).then(data=>{if(active)setScore(data);}).catch(e=>{if(active)setError(e.message);});return ()=>{active=false;};},[]);
 async function request(body:Record<string,unknown>){
  const r=await fetch("/api/news/"+articleId+"/trivia",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)}),data=await r.json();
  if(!r.ok)throw new Error(data.error||"Belum berhasil. Coba kembali.");
  return data;
 }
 async function begin(){
  setBusy(true);setError("");
  try{const data=await request({action:"challenge"});setChallenge(data);setSum("");setTrap("");setStage("CAPTCHA");}catch(e){setError(e instanceof Error?e.message:"Trivia belum tersedia.");}finally{setBusy(false);}
 }
 async function start(event:React.FormEvent){
  event.preventDefault();if(!challenge)return;setBusy(true);setError("");
  try{const data=await request({action:"start",session_id:challenge.session_id,sum:Number(sum),honeypot:trap});setQuestions(data.questions);setIndex(0);setChoice(null);setResult(null);setStage(data.questions.length?"QUIZ":"DONE");}catch(e){setError(e instanceof Error?e.message:"Verifikasi belum berhasil.");}finally{setBusy(false);}
 }
 async function answer(){
  if(choice===null||!challenge||!questions[index])return;setBusy(true);setError("");
  try{const data=await request({action:"answer",session_id:challenge.session_id,question_id:questions[index].id,choice});setResult(data);setScore(s=>s?{...s,points:data.total_points}:s);await refreshScore();}catch(e){setError(e instanceof Error?e.message:"Jawaban belum tersimpan.");}finally{setBusy(false);}
 }
 const button={padding:"12px 18px",borderRadius:10,border:0,background:C.primary,color:"#fff",fontWeight:700,cursor:"pointer",opacity:busy?0.6:1};
 if(!count)return null;
 return <section aria-labelledby="trivia-title" style={{marginTop:36,padding:22,border:"1px solid "+C.border,borderRadius:16,background:C.surface}}>
  <div style={{fontSize:11,fontWeight:800,color:C.primaryLight,letterSpacing:1}}>TRIVIA STADIONE</div>
  <h2 id="trivia-title" style={{fontSize:23,color:C.text,margin:"8px 0"}}>Sudah baca? Uji pengetahuanmu.</h2>
  <p style={{color:C.textSec,fontSize:14,lineHeight:1.6,margin:"0 0 18px"}}>{count} soal dari artikel ini. Jawaban benar memberi 1 poin. Setiap soal dihitung sekali dan poin tersimpan di akunmu.</p>
  {score?.logged_in?<p style={{color:C.text,fontWeight:700}}>Poinmu: {score.points}</p>:null}
  {stage==="IDLE"?(score===null?<p style={{color:C.textMuted}}>{error?"Trivia sedang tidak tersedia.":"Memuat trivia…"}</p>:score.logged_in?
   <button disabled={busy} onClick={begin} style={button}>Mulai trivia</button>:
   <Link href={"/login?redirect="+encodeURIComponent("/news/"+slug)} style={{...button,display:"inline-block",textDecoration:"none"}}>Masuk untuk mulai</Link>):null}
  {stage==="CAPTCHA"&&challenge?<form onSubmit={start}>
   <label htmlFor={"verify-"+articleId} style={{display:"block",color:C.text,fontWeight:600,marginBottom:10}}>Verifikasi singkat: {challenge.left} + {challenge.right} = ?</label>
   <input id={"verify-"+articleId} aria-label="Jawaban verifikasi" type="number" inputMode="numeric" autoComplete="off" required min={0} max={20} value={sum} onChange={e=>setSum(e.target.value)} style={{width:110,padding:12,marginRight:10,borderRadius:9,border:"1px solid "+C.border,color:C.text,background:C.elevated}}/>
   <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" value={trap} onChange={e=>setTrap(e.target.value)} style={{position:"absolute",left:-10000,width:1,height:1}}/>
   <button type="submit" disabled={busy||!sum} style={button}>Mulai</button>
  </form>:null}
  {stage==="QUIZ"&&questions[index]?<div>
   <p style={{color:C.textMuted,fontSize:12}}>Soal {index+1} dari {questions.length}</p>
   <h3 style={{fontSize:17,lineHeight:1.55,color:C.text,margin:"8px 0 16px"}}>{questions[index].question}</h3>
   <div style={{display:"grid",gap:10}}>{questions[index].options.map((option,i)=><button key={i} type="button" disabled={busy||!!result} aria-pressed={choice===i} onClick={()=>setChoice(i)} style={{padding:"13px 15px",textAlign:"left",borderRadius:10,border:"1px solid "+(result?.correct_choice===i?C.primaryLight:choice===i?C.primaryLight:C.border),color:C.text,background:choice===i?C.primary+"22":C.elevated,lineHeight:1.5,cursor:result?"default":"pointer"}}>{String.fromCharCode(65+i)}. {option}</button>)}</div>
   {!result?<button disabled={busy||choice===null} onClick={answer} style={{...button,marginTop:16}}>Kirim jawaban</button>:<div aria-live="polite" style={{marginTop:18,color:C.textSec,lineHeight:1.6}}>
    <strong style={{color:C.text}}>{result.correct?"Benar!":"Belum tepat."} {result.points_earned?"+1 poin":result.already_answered?"Poin soal ini sudah dihitung sebelumnya.":"0 poin"}</strong>
    <p style={{fontSize:14}}>{result.explanation}</p>
    <button onClick={()=>{if(index+1<questions.length){setIndex(index+1);setChoice(null);setResult(null);}else setStage("DONE");}} style={button}>{index+1<questions.length?"Soal berikutnya":"Lihat hasil"}</button>
   </div>}
  </div>:null}
  {stage==="DONE"?<p role="status" style={{color:C.text,fontWeight:700}}>Trivia artikel ini selesai. Total poinmu {score?.points||0}. Baca artikel lainnya untuk mengumpulkan poin lagi.</p>:null}
  {error?<div role="alert" style={{marginTop:14,color:C.danger,fontSize:14}}>{error}{stage!=="IDLE"?<button onClick={begin} disabled={busy} style={{...button,display:"block",marginTop:10}}>Verifikasi ulang</button>:null}</div>:null}
  {!!score?.leaderboard.length?<div style={{marginTop:26,borderTop:"1px solid "+C.border,paddingTop:18}}>
   <h3 style={{fontSize:16,color:C.text,margin:"0 0 12px"}}>Peringkat pembaca</h3>
   <ol style={{margin:0,padding:0,listStyle:"none"}}>{score.leaderboard.map(row=><li key={row.rank} style={{display:"flex",gap:10,padding:"8px 0",fontSize:13,color:C.textSec}}><span>{row.rank}.</span><span style={{flex:1}}>{row.display_name}</span><strong>{row.points} poin</strong></li>)}</ol>
  </div>:null}
 </section>;
}
