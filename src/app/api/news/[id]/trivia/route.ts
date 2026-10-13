import {NextRequest,NextResponse} from "next/server";
import {getSessionUser} from "@/lib/auth";
import {createAdminClient} from "@/lib/supabase/admin";
import {ensureArticleTrivia,publicTriviaQuestions} from "@/lib/cms/trivia-store";
const json=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{"Cache-Control":"no-store"}});
export async function POST(request:NextRequest,{params}:{params:Promise<{id:string}>}) {
 if(Number(request.headers.get("content-length")||0)>8192)return json({error:"Permintaan terlalu besar."},413);
 const {id}=await params;
 if(!/^[a-f0-9-]{36}$/i.test(id))return json({error:"Artikel tidak ditemukan."},404);
 let origin:string;try{origin=new URL(request.headers.get("origin")||"").hostname;}catch{return json({error:"Permintaan tidak valid."},403);}
 if(!["stadione.pro","www.stadione.pro"].includes(origin))return json({error:"Permintaan tidak valid."},403);
 const user=await getSessionUser();if(!user)return json({error:"Masuk ke akun untuk mengumpulkan poin."},401);
 let input:Record<string,unknown>;try{input=await request.json();if(!input||typeof input!=="object"||Array.isArray(input))throw Error();}catch{return json({error:"Permintaan tidak valid."},400);}
 const db=createAdminClient();
 try{
  const article=await db.from("stadione_content_items").select("id,title,body,excerpt,editorial_meta").eq("id",id).eq("kind","ARTICLE").eq("status","PUBLISHED").maybeSingle();
  if(article.error||!article.data||article.data.editorial_meta?.cms_deleted_at)return json({error:"Artikel tidak tersedia."},404);
  if(input.action==="challenge"){
   const questions=await ensureArticleTrivia(article.data);if(!questions.length)return json({error:"Trivia artikel belum tersedia."},409);
   const r=await db.rpc("issue_stadione_trivia_session",{p_user:user.id,p_article:id});if(r.error)throw Error("Verifikasi belum dapat dimulai.");
   return json(r.data,r.data?.error?(r.data.code==="RATE_LIMIT"?429:409):200);
  }
  if(typeof input.session_id!=="string"||!/^[a-f0-9-]{36}$/i.test(input.session_id))return json({error:"Verifikasi tidak valid."},400);
  const session=await db.from("stadione_trivia_sessions").select("id").eq("id",input.session_id).eq("user_id",user.id).eq("article_id",id).maybeSingle();
  if(session.error||!session.data)return json({error:"Verifikasi tidak ditemukan."},404);
  if(input.action==="start"){
   if(!Number.isInteger(input.sum)||typeof input.honeypot!=="string"||String(input.honeypot).length>100)return json({error:"Jawaban verifikasi tidak valid."},400);
   const r=await db.rpc("start_stadione_trivia_session",{p_user:user.id,p_session:input.session_id,p_sum:input.sum,p_honeypot:input.honeypot});if(r.error)throw Error("Verifikasi belum dapat diperiksa.");
   if(r.data?.error)return json(r.data,409);
   const questions=await ensureArticleTrivia(article.data),answers=await db.from("stadione_trivia_answers").select("question_id").eq("user_id",user.id).eq("article_id",id);
   if(answers.error)throw Error("Riwayat trivia belum dapat dimuat.");
   return json({ok:true,questions:publicTriviaQuestions(questions,(answers.data||[]).map(x=>x.question_id))});
  }
  if(input.action==="answer"){
   if(typeof input.question_id!=="string"||!/^q[1-3]$/.test(input.question_id)||!Number.isInteger(input.choice)||Number(input.choice)<0||Number(input.choice)>3)return json({error:"Pilihan jawaban tidak valid."},400);
   // Use a pseudonym for public rankings; never publish account email or an implicit real name.
   const name="Pembaca "+user.id.replaceAll("-","").slice(0,6).toUpperCase();
   const r=await db.rpc("answer_stadione_article_trivia",{p_user:user.id,p_session:input.session_id,p_question:input.question_id,p_choice:input.choice,p_name:name});
   if(r.error)throw Error("Jawaban belum dapat disimpan.");
   return json(r.data,r.data?.error?409:200);
  }
  return json({error:"Aksi tidak dikenal."},400);
 }catch(e){return json({error:e instanceof Error?e.message:"Trivia belum tersedia."},503);}
}
