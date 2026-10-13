"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {C} from "@/lib/design";
export default function ReaderPoints(){
 const [stats,setStats]=useState<{logged_in:boolean;points:number;answered:number}|null>(null);
 useEffect(()=>{fetch("/api/news/trivia/score",{cache:"no-store"}).then(r=>r.ok?r.json():null).then(setStats).catch(()=>{});},[]);
 if(!stats?.logged_in)return null;
 return <div style={{padding:18,marginBottom:16,borderRadius:14,border:"1px solid "+C.border,background:C.surface}}>
  <div style={{fontSize:12,color:C.textMuted}}>Poin pembaca Stadione</div>
  <div style={{fontSize:30,fontWeight:800,color:C.primaryLight,margin:"4px 0"}}>{stats.points} <span style={{fontSize:14,color:C.textSec}}>poin</span></div>
  <p style={{fontSize:13,color:C.textSec,margin:"0 0 12px"}}>{stats.answered} soal sudah dijawab. Setiap jawaban benar memberi 1 poin.</p>
  <Link href="/news" style={{fontSize:13,color:C.primaryLight,textDecoration:"none",fontWeight:700}}>Baca berita dan kumpulkan poin →</Link>
 </div>;
}
