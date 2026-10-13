#!/usr/bin/env node
// Read-only catalog research. Never edits CMS, credentials, slots or Meta posts.
const fs=require("node:fs"),path=require("node:path"),load=require("./cms-load.cjs");
(async()=>{
 const args=process.argv.slice(2),arg=k=>args[args.indexOf(k)+1];
 if(!args.includes("--output")||!arg("--output"))throw Error("Use --output /private/music-pool.json [--query title-or-artist]");
 const output=arg("--output");if(fs.existsSync(output))throw Error("Output exists; preserve the earlier music research.");
 const pool=await load("src/lib/cms/reel-music.ts").getReelMusicPool(args.includes("--query")?arg("--query"):undefined);
 fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(pool,null,2));
 console.log(JSON.stringify({...pool,tracks:pool.tracks.map(({preview_url,...track})=>track)}));
})().catch(e=>{console.error(e.message);process.exitCode=1});
