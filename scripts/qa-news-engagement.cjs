const assert=require("node:assert/strict"),load=require("./cms-load.cjs");
const news=load("src/lib/cms/public-news.ts"),trivia=load("src/lib/cms/article-trivia.ts"),store=load("src/lib/cms/trivia-store.ts");
const blocks=news.articleBlocks('<h2>Opening</h2><p>First fact.</p><h2>Context</h2><p>Second fact.</p><h2>Response</h2><p>Third fact.</p><p>Last fact.</p>');
const reel={type:"instagram",url:"https://www.instagram.com/reel/Dec8AuRFLi5/",embedUrl:news.instagramEmbed("https://www.instagram.com/reel/Dec8AuRFLi5/")};
const composed=news.blocksWithReel(blocks,reel);assert.equal(composed.filter(x=>x.type==="instagram").length,1);assert.equal(composed.findIndex(x=>x.type==="instagram"),4);
assert.deepEqual(composed.filter(x=>x.type!=="instagram"),blocks);assert.deepEqual(news.blocksWithReel(composed,reel),composed);assert.deepEqual(news.blocksWithReel(blocks,null),blocks);
for(const bad of ["https://evil.test/reel/id/","javascript:alert(1)","https://instagram.com.evil.test/reel/id/"])assert.equal(news.instagramEmbed(bad),null);
const article={id:"a",title:"Persib suporter",body:"Persib and Persija",excerpt:"",category:"Sepak Bola Indonesia",slug:"a",assets:[],published_at:null};
const candidates=[{...article,id:"b",slug:"b",title:"Persija suporter",body:""},{...article,id:"c",slug:"c",title:"Ajax",body:"",category:"Eropa"},article,{...article,id:"d",slug:"d",title:"Persib",body:""}];
const related=news.relatedArticles(article,candidates);assert.deepEqual(related.map(x=>x.id),["b","d","c"]);assert.equal(new Set(related.map(x=>x.id)).size,3);
const a={title:"Poin klub terancam",excerpt:"",body:'<p>Erick Thohir memberi operator liga dan klub kesempatan satu minggu untuk memastikan keamanan suporter.</p><p>Rombongan Persib diserang di Batang pada 11 Oktober setelah melakukan perjalanan pulang dari pertandingan.</p>'};
const q=trivia.articleTrivia(a);assert.ok(q.length>=2&&q.length<=3);assert.deepEqual(trivia.triviaQuestionIssues(q),[]);
for(const x of q){assert.equal(x.options.length,4);assert.ok(x.explanation.includes(x.options[x.answer]));}
assert.deepEqual(trivia.articleTrivia(a),q);assert.notEqual(trivia.triviaArticleDigest(a),trivia.triviaArticleDigest({...a,body:a.body+" changed"}));
const publicQuestions=store.publicTriviaQuestions(q,[q[0].id]);assert.equal(publicQuestions.length,q.length-1);assert.ok(publicQuestions.every(x=>!("answer" in x)&&!("explanation" in x)));
assert.deepEqual(trivia.articleTrivia({title:"No facts",body:null,excerpt:null}),[]);
console.log(JSON.stringify({ok:true,checks:["reel_middle_without_body_change","embed_once","embed_url_host","related_topics_exclude_self","fact_based_questions","stable_ids","answers_hidden_until_attempt"],live_data_mutated:false}));
