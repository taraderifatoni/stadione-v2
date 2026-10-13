import "server-only";
import {createAdminClient} from "@/lib/supabase/admin";
import {articleTrivia,triviaArticleDigest,triviaQuestionIssues,type TriviaArticle,type TriviaQuestion} from "./article-trivia";
export async function ensureArticleTrivia(article:TriviaArticle & {id:string}) {
 const db=createAdminClient();
 const old=await db.from("stadione_article_quizzes").select("questions").eq("article_id",article.id).maybeSingle();
 if(old.error)throw new Error("Trivia belum dapat dimuat.");
 if(old.data)return old.data.questions as TriviaQuestion[];
 const questions=articleTrivia(article);if(triviaQuestionIssues(questions).length)return [];
 const insert=await db.from("stadione_article_quizzes").upsert({article_id:article.id,source_digest:triviaArticleDigest(article),questions},{onConflict:"article_id",ignoreDuplicates:true});
 if(insert.error)throw new Error("Trivia belum dapat disimpan.");
 // An editor's concurrent curated quiz wins; never rotate questions to earn points twice.
 const stored=await db.from("stadione_article_quizzes").select("questions").eq("article_id",article.id).single();
 if(stored.error)throw new Error("Trivia belum dapat dimuat.");
 return stored.data.questions as TriviaQuestion[];
}
export function publicTriviaQuestions(questions:TriviaQuestion[],answered:string[]) {
 return questions.filter(x=>!answered.includes(x.id)).map(({id,question,options})=>({id,question,options}));
}
