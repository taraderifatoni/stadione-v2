#!/usr/bin/env node
const fs=require('node:fs'),load=require('./cms-load.cjs');
const {journalIssues}=load('src/lib/cms/news-writing.ts');
try {
  const file=process.argv[2] || 'editorial/goal-readings.json',journal=JSON.parse(fs.readFileSync(file,'utf8'));
  const issues=journalIssues(journal);if(issues.length)throw Error(issues.join('\n'));
  console.log(JSON.stringify({ok:true,file,entries:journal.entries.length,latest_read_at:journal.entries.map(e=>e.read_at).sort().at(-1)}));
}catch(e){console.error(e.message);process.exitCode=1;}
