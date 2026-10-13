#!/usr/bin/env node
// Register reviewed factual trivia separately from published CMS bodies/approval digests.
const fs=require("node:fs"),load=require("./cms-load.cjs");
(async()=>{
 const [articleId,file]=process.argv.slice(2);if(!/^[a-f0-9-]{36}$/i.test(articleId)||!file)throw Error("Use article-id reviewed-questions.json");
 const questions=JSON.parse(fs.readFileSync(file)),policy=load("src/lib/cms/article-trivia.ts"),issues=policy.triviaQuestionIssues(questions);
 if(issues.length)throw Error(issues.join(" "));
 const db=load("src/lib/supabase/admin.ts").createAdminClient(),r=await db.from("stadione_content_items").select("id,title,body,excerpt").eq("id",articleId).eq("kind","ARTICLE").eq("status","PUBLISHED").single();if(r.error)throw Error("Published article not found.");
 const normalize=s=>s.replace(/<[^>]*>/g," ").replace(/&quot;/g,'"').replace(/\s+/g," ").toLowerCase().trim(),text=normalize(r.data.body||"");
 if(questions.some(q=>!text.includes(normalize(q.explanation))||!normalize(q.explanation).includes(normalize(q.options[q.answer]))))throw Error("Every correct option and explanation must match the published article.");
 const old=await db.from("stadione_article_quizzes").select("article_id").eq("article_id",articleId).maybeSingle();if(old.error)throw old.error;if(old.data)throw Error("Quiz already exists; do not rotate questions or reset earned points.");
 const inserted=await db.from("stadione_article_quizzes").insert({article_id:articleId,source_digest:policy.triviaArticleDigest(r.data),questions});if(inserted.error)throw inserted.error;
 console.log(JSON.stringify({article_id:articleId,questions:questions.length,cms_body_changed:false,schedules_changed:false}));
})().catch(e=>{console.error(e.message);process.exitCode=1});
