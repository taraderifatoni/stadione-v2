import "server-only";
import { promises as fs } from "node:fs";
import { referenceIssues, WRITING_STANDARD, WRITING_RULES, type NewsArticle, type ReferenceJournal } from "./news-writing";
export async function readWritingReferences(): Promise<ReferenceJournal> {
  // Persistent runtime file: daily reading updates do not need an app rebuild.
  const path=process.env.STADIONE_EDITORIAL_REFERENCES_FILE || '/opt/stadione-editorial/goal-readings.json';
  return JSON.parse(await fs.readFile(path,'utf8')) as ReferenceJournal;
}
export async function writingReferenceIssues(article: NewsArticle | undefined) {
  try{return referenceIssues(article,await readWritingReferences());}
  catch{return ['Jurnal bacaan Goal tidak dapat dimuat; perbarui referensi editorial harian.'];}
}
export async function writerBrief(genre: "NEWS" | "FEATURE" = "NEWS") {
  const journal=await readWritingReferences();const issues=referenceIssues(undefined,journal);
  if(issues.length)throw new Error(issues.join(" "));
  const references=journal.entries.filter(e=>e.kind===genre).sort((a,b)=>b.read_at.localeCompare(a.read_at)).slice(0,3);
  if(!references.length)throw new Error("Belum ada bacaan Goal untuk genre tulisan ini.");
  return {standard:WRITING_STANDARD,genre,rules:[...WRITING_RULES],references:references.map(e=>({id:e.id,url:e.url,lessons:e.lessons,application:e.application}))};
}
