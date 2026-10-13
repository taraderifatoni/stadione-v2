const assert=require("node:assert/strict"),load=require("./cms-load.cjs"),{NextRequest}=require("next/server");
const auth=load("src/lib/auth.ts"),admin=load("src/lib/supabase/admin.ts"),route=load("src/app/api/news/[id]/trivia/route.ts"),scoreRoute=load("src/app/api/news/trivia/score/route.ts");
const id="00000000-0000-4000-9000-000000001213",user="00000000-0000-4000-9000-000000001211",session="00000000-0000-4000-9000-000000001214";
let logged=false,calls=[],dbReads=[];
auth.getSessionUser=async()=>logged?{id:user}:null;
const questions=[{id:"q1",question:"Deadline?",options:["one","two","three","four"],answer:0,explanation:"One week."}];
admin.createAdminClient=()=>({from(name){const filters=[];dbReads.push({name,filters});const q={select(){return q},eq(k,v){filters.push([k,v]);return q},maybeSingle:async()=>({data:name==="stadione_content_items"?{id,title:"Article",body:"A fact.",excerpt:null,editorial_meta:{}}:name==="stadione_article_quizzes"?{questions}:name==="stadione_reader_scores"?{points:2}:{id:session},error:null}),then(resolve){return Promise.resolve({data:[],count:2,error:null}).then(resolve)}};return q;},rpc:async(name,args)=>{calls.push({name,args});return{data:name==="stadione_trivia_leaderboard"?[]:name==="start_stadione_trivia_session"?{ok:true,article_id:id}:{correct:true,points_earned:1,total_points:2},error:null};}});
async function post(body,origin="https://stadione.pro"){
 const req=new NextRequest("https://stadione.pro/api/news/"+id+"/trivia",{method:"POST",headers:{"Content-Type":"application/json",...(origin?{origin}:{})},body:JSON.stringify(body)});
 const res=await route.POST(req,{params:Promise.resolve({id})});return{status:res.status,body:await res.json()};
}
(async()=>{
 let r=await post({action:"challenge"});assert.equal(r.status,401);assert.equal(dbReads.length,0);
 logged=true;r=await post({action:"challenge"},"https://evil.test");assert.equal(r.status,403);assert.equal(calls.length,0);
 r=await post({action:"answer",session_id:session,question_id:"q1",choice:4});assert.equal(r.status,400);assert.equal(calls.length,0);
 r=await post({action:"answer",session_id:session,question_id:"q1",choice:0,user_id:"spoof",points:9999});
 assert.equal(r.status,200);assert.equal(calls.at(-1).args.p_user,user);assert.equal("p_points" in calls.at(-1).args,false);assert.ok(dbReads.some(x=>x.name==="stadione_trivia_sessions"&&x.filters.some(([k,v])=>k==="user_id"&&v===user)));
 r=await post({action:"start",session_id:session,sum:5,honeypot:""});assert.equal(r.status,200);assert.equal(r.body.questions.length,1);assert.ok(!("answer" in r.body.questions[0]));assert.ok(!("explanation" in r.body.questions[0]));
 r=await post({action:"start",session_id:session,sum:"5",honeypot:""});assert.equal(r.status,400);
 logged=false;let res=await scoreRoute.GET();let body=await res.json();assert.equal(body.logged_in,false);assert.equal(body.points,0);
 logged=true;res=await scoreRoute.GET();body=await res.json();assert.equal(body.points,2);assert.equal(body.answered,2);assert.equal("user_id" in body,false);
 console.log(JSON.stringify({ok:true,checks:["unauthenticated_no_db","origin_gate","invalid_choice","server_auth_identity","client_points_ignored","session_account_binding","no_answer_leak","numeric_captcha","account_score"]}));
})().catch(e=>{console.error(e);process.exitCode=1});
