import {NextResponse} from "next/server";
import {getSessionUser} from "@/lib/auth";
import {createAdminClient} from "@/lib/supabase/admin";
export async function GET(){
 const user=await getSessionUser(),db=createAdminClient();
 const board=await db.rpc("stadione_trivia_leaderboard");
 if(board.error)return NextResponse.json({error:"Poin belum dapat dimuat."},{status:503});
 let points=0,answered=0;
 if(user){
  const score=await db.from("stadione_reader_scores").select("points").eq("user_id",user.id).maybeSingle();
  const answers=await db.from("stadione_trivia_answers").select("question_id",{count:"exact",head:true}).eq("user_id",user.id);
  if(score.error||answers.error)return NextResponse.json({error:"Poin belum dapat dimuat."},{status:503});
  points=score.data?.points||0;answered=answers.count||0;
 }
 return NextResponse.json({logged_in:Boolean(user),points,answered,leaderboard:board.data||[]},{headers:{"Cache-Control":"no-store"}});
}
