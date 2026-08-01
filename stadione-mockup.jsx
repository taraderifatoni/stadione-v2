import { useState } from "react";
import { Search, Home, Calendar, Dumbbell, GraduationCap, User, Bell, Menu, X, ChevronRight, ChevronLeft, MapPin, Star, Clock, CreditCard, Users, BarChart3, Settings, Shield, Tag, Building2, LogOut, Plus, Filter, Check, AlertCircle, TrendingUp, ArrowUpRight, ArrowDownRight, DollarSign, Activity, Zap, Eye, Edit, Trash2, Phone, Mail, UserPlus, FileText, Printer, RefreshCw, ChevronDown } from "lucide-react";

const C = {
  bg: "#0D0D0D", surface: "#1A1816", elevated: "#242220", border: "#2E2C28",
  primary: "#84102D", primaryLight: "#A51A3A", primaryDark: "#5C0B1F",
  accent: "#B5AC8A", accentMuted: "#837D5E",
  text: "#F5F0E8", textSec: "#B5AC8A", textMuted: "#6B6558",
  success: "#2E7D32", successBg: "#1B3A1D", warning: "#E65100", warningBg: "#3A2200",
  danger: "#C62828", dangerBg: "#3A1515",
};

const screens = {
  public: ["home","venue","booking","bookingSlot","fitness","fitnessPlan","academy","academyReport","profile","login","register","notifications"],
  admin: ["adminDash","adminVenues","adminBookings","adminMembers","adminAcademy","adminStaff","adminReports","adminSettings"],
  pos: ["posMain","posShift","posWalkin","posInvoice"],
};

const allScreenNames = {
  home:"Beranda", venue:"Detail Venue", booking:"Booking", bookingSlot:"Pilih Slot",
  fitness:"Fitness", fitnessPlan:"Pilih Plan", academy:"Akademi", academyReport:"Raport",
  profile:"Profil", login:"Masuk", register:"Daftar", notifications:"Notifikasi",
  adminDash:"Dashboard", adminVenues:"Kelola Venue", adminBookings:"Kelola Booking",
  adminMembers:"Kelola Member", adminAcademy:"Kelola Akademi", adminStaff:"Kelola Staff",
  adminReports:"Laporan", adminSettings:"Pengaturan",
  posMain:"POS Kasir", posShift:"Shift", posWalkin:"Walk-in Booking", posInvoice:"Invoice",
};

const Badge = ({children, color = C.primary, bg}) => (
  <span style={{fontSize:11, fontWeight:600, padding:"3px 8px", borderRadius:6, background: bg || color+"22", color: color === C.primary ? C.primaryLight : color, letterSpacing:0.3}}>{children}</span>
);

const StatusDot = ({color}) => <span style={{width:8,height:8,borderRadius:4,background:color,display:"inline-block"}} />;

const Card = ({children, style, onClick}) => (
  <div onClick={onClick} style={{background:C.surface, borderRadius:14, padding:16, border:`1px solid ${C.border}`, cursor: onClick ? "pointer":"default", transition:"transform 0.15s", ...style}}>{children}</div>
);

const StatCard = ({icon:Icon, label, value, trend, color}) => (
  <Card style={{flex:1, minWidth:0}}>
    <div style={{display:"flex", alignItems:"center", gap:6, marginBottom:8}}>
      <div style={{width:28,height:28,borderRadius:8,background:(color||C.primary)+"18",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <Icon size={14} color={color||C.primaryLight} />
      </div>
      <span style={{fontSize:11,color:C.textMuted,letterSpacing:0.3}}>{label}</span>
    </div>
    <div style={{fontSize:20,fontWeight:700,color:C.text}}>{value}</div>
    {trend && <div style={{fontSize:11,color: trend > 0 ? "#4CAF50" : C.danger, marginTop:4, display:"flex", alignItems:"center", gap:2}}>
      {trend > 0 ? <ArrowUpRight size={12}/> : <ArrowDownRight size={12}/>} {Math.abs(trend)}%
    </div>}
  </Card>
);

const Input = ({label, placeholder, type="text", icon:Icon}) => (
  <div style={{marginBottom:14}}>
    {label && <label style={{fontSize:12,color:C.textSec,marginBottom:6,display:"block"}}>{label}</label>}
    <div style={{position:"relative"}}>
      {Icon && <Icon size={16} color={C.textMuted} style={{position:"absolute",left:12,top:12}} />}
      <input type={type} placeholder={placeholder} style={{width:"100%",padding: Icon ? "10px 12px 10px 36px":"10px 12px",background:C.elevated,border:`1px solid ${C.border}`,borderRadius:10,color:C.text,fontSize:14,outline:"none",boxSizing:"border-box"}} />
    </div>
  </div>
);

const Btn = ({children, primary, full, small, onClick, style:s}) => (
  <button onClick={onClick} style={{padding: small?"8px 14px":"12px 20px", borderRadius:10, border: primary?"none":`1px solid ${C.border}`, background: primary ? C.primary:"transparent", color: primary ? "#fff":C.text, fontSize: small?12:14, fontWeight:600, cursor:"pointer", width: full?"100%":"auto", transition:"all 0.15s", display:"flex",alignItems:"center",justifyContent:"center",gap:6, ...s}}>
    {children}
  </button>
);

const ListItem = ({icon:Icon, title, sub, right, onClick, iconBg}) => (
  <div onClick={onClick} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 0",borderBottom:`1px solid ${C.border}11`,cursor: onClick?"pointer":"default"}}>
    {Icon && <div style={{width:40,height:40,borderRadius:12,background:iconBg||C.primary+"18",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
      <Icon size={18} color={iconBg ? C.text : C.primaryLight} />
    </div>}
    <div style={{flex:1,minWidth:0}}>
      <div style={{fontSize:14,fontWeight:500,color:C.text}}>{title}</div>
      {sub && <div style={{fontSize:12,color:C.textMuted,marginTop:2}}>{sub}</div>}
    </div>
    {right || <ChevronRight size={16} color={C.textMuted} />}
  </div>
);

const TabBar = ({tabs, active, onChange}) => (
  <div style={{display:"flex",gap:0,borderBottom:`1px solid ${C.border}`,marginBottom:16}}>
    {tabs.map(t => (
      <button key={t} onClick={()=>onChange(t)} style={{flex:1,padding:"10px 0",fontSize:13,fontWeight: active===t?600:400,color: active===t?C.text:C.textMuted,background:"none",border:"none",borderBottom: active===t?`2px solid ${C.primaryLight}`:"2px solid transparent",cursor:"pointer",transition:"all 0.15s"}}>{t}</button>
    ))}
  </div>
);

const BottomNav = ({active, onChange}) => {
  const items = [
    {id:"home",icon:Home,label:"Beranda"},
    {id:"booking",icon:Calendar,label:"Booking"},
    {id:"fitness",icon:Dumbbell,label:"Fitness"},
    {id:"academy",icon:GraduationCap,label:"Akademi"},
    {id:"profile",icon:User,label:"Profil"},
  ];
  return (
    <div style={{display:"flex",background:C.surface,borderTop:`1px solid ${C.border}`,padding:"6px 0 10px"}}>
      {items.map(it => (
        <button key={it.id} onClick={()=>onChange(it.id)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2,background:"none",border:"none",cursor:"pointer",padding:4}}>
          <it.icon size={20} color={active===it.id?C.primaryLight:C.textMuted} strokeWidth={active===it.id?2.5:1.5} />
          <span style={{fontSize:10,fontWeight:active===it.id?600:400,color:active===it.id?C.primaryLight:C.textMuted}}>{it.label}</span>
        </button>
      ))}
    </div>
  );
};

const TopBar = ({title, left, right, sub}) => (
  <div style={{padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",background:C.bg}}>
    <div style={{display:"flex",alignItems:"center",gap:10}}>
      {left}
      <div>
        <div style={{fontSize:16,fontWeight:700,color:C.text,letterSpacing:-0.3}}>{title}</div>
        {sub && <div style={{fontSize:11,color:C.textMuted}}>{sub}</div>}
      </div>
    </div>
    <div style={{display:"flex",alignItems:"center",gap:8}}>{right}</div>
  </div>
);

// ===== PUBLIC SCREENS =====

const HomeScreen = ({go}) => (
  <div>
    <TopBar title="Stadione" left={<div style={{width:32,height:32,borderRadius:10,background:C.primary,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:800,color:"#fff"}}>S</div>}
      right={<><div onClick={()=>go("notifications")} style={{position:"relative",cursor:"pointer"}}><Bell size={20} color={C.textSec}/><span style={{position:"absolute",top:-2,right:-2,width:8,height:8,borderRadius:4,background:C.primaryLight}} /></div><div onClick={()=>go("profile")} style={{width:30,height:30,borderRadius:10,background:C.accentMuted+"44",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><User size={14} color={C.accent}/></div></>} />
    <div style={{padding:"0 16px 16px"}}>
      <div style={{background:`linear-gradient(135deg, ${C.primary} 0%, ${C.primaryDark} 100%)`,borderRadius:16,padding:24,marginBottom:20,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-20,right:-20,width:100,height:100,borderRadius:50,background:"#fff08",}} />
        <div style={{fontSize:22,fontWeight:800,color:"#fff",marginBottom:6,lineHeight:1.2}}>Temukan venue{"\n"}olahraga terbaik</div>
        <div style={{fontSize:13,color:"#fff9",marginBottom:16}}>Booking, membership, dan akademi</div>
        <div style={{display:"flex",alignItems:"center",gap:8,background:"#fff15",borderRadius:10,padding:"10px 14px"}}>
          <Search size={16} color="#fff8" />
          <span style={{fontSize:13,color:"#fff6"}}>Cari venue atau olahraga...</span>
        </div>
      </div>
      <div style={{display:"flex",gap:8,marginBottom:20,overflowX:"auto",paddingBottom:4}}>
        {["Semua","Futsal","Basket","Badminton","Gym","Renang"].map((t,i) => (
          <span key={t} style={{padding:"8px 16px",borderRadius:20,background: i===0?C.primary:C.surface,color: i===0?"#fff":C.textSec,fontSize:12,fontWeight:500,whiteSpace:"nowrap",border: i===0?"none":`1px solid ${C.border}`,cursor:"pointer"}}>{t}</span>
        ))}
      </div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
        <span style={{fontSize:15,fontWeight:700,color:C.text}}>Venue terdekat</span>
        <span style={{fontSize:12,color:C.primaryLight,cursor:"pointer"}}>Lihat semua</span>
      </div>
      {[
        {name:"Kenari Football Area",loc:"Yogyakarta",sport:"Futsal",rating:"4.8",price:"120rb"},
        {name:"Iron Gym Sleman",loc:"Sleman",sport:"Gym",rating:"4.6",price:"150rb/bln"},
        {name:"Champion Badminton",loc:"Yogyakarta",sport:"Badminton",rating:"4.7",price:"80rb"},
        {name:"AquaSport Center",loc:"Sleman",sport:"Renang",rating:"4.5",price:"200rb/bln"},
      ].map((v,i) => (
        <Card key={i} onClick={()=>go("venue")} style={{marginBottom:10}}>
          <div style={{display:"flex",gap:12}}>
            <div style={{width:72,height:72,borderRadius:12,background:C.elevated,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <Building2 size={24} color={C.textMuted} />
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"start"}}>
                <div style={{fontSize:14,fontWeight:600,color:C.text}}>{v.name}</div>
                <div style={{display:"flex",alignItems:"center",gap:3}}><Star size={12} color="#FFB300" fill="#FFB300"/><span style={{fontSize:12,fontWeight:600,color:C.accent}}>{v.rating}</span></div>
              </div>
              <div style={{fontSize:12,color:C.textMuted,marginTop:3,display:"flex",alignItems:"center",gap:4}}><MapPin size={11}/>{v.loc}</div>
              <div style={{display:"flex",alignItems:"center",gap:6,marginTop:8}}>
                <Badge>{v.sport}</Badge>
                <span style={{fontSize:12,fontWeight:600,color:C.accent}}>Rp {v.price}</span>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  </div>
);

const VenueScreen = ({go}) => {
  const [tab,setTab] = useState("Info");
  return <div>
    <TopBar title="Kenari Football Area" sub="Yogyakarta" left={<ChevronLeft size={20} color={C.text} onClick={()=>go("home")} style={{cursor:"pointer"}} />} right={<Bell size={20} color={C.textSec}/>} />
    <div style={{padding:"0 16px 16px"}}>
      <div style={{height:160,borderRadius:14,background:C.elevated,marginBottom:16,display:"flex",alignItems:"center",justifyContent:"center"}}>
        <Building2 size={40} color={C.textMuted} />
      </div>
      <div style={{display:"flex",gap:8,marginBottom:16}}>
        <Btn primary full onClick={()=>go("booking")}><Calendar size={16}/>Booking</Btn>
        <Btn full onClick={()=>go("fitness")}><Dumbbell size={16}/>Membership</Btn>
      </div>
      <TabBar tabs={["Info","Fasilitas","Ulasan"]} active={tab} onChange={setTab} />
      {tab==="Info" && <>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}><MapPin size={16} color={C.primaryLight}/><span style={{fontSize:13,color:C.textSec}}>Jl. Kenari No. 12, Yogyakarta</span></div>
          <div style={{display:"flex",alignItems:"center",gap:10}}><Clock size={16} color={C.primaryLight}/><span style={{fontSize:13,color:C.textSec}}>08:00 - 22:00 (Setiap hari)</span></div>
          <div style={{display:"flex",alignItems:"center",gap:10}}><Phone size={16} color={C.primaryLight}/><span style={{fontSize:13,color:C.textSec}}>0274-123456</span></div>
        </div>
        <div style={{marginTop:16}}>
          <div style={{fontSize:14,fontWeight:600,color:C.text,marginBottom:8}}>Lapangan tersedia</div>
          {["Lap. Futsal A (Vinyl)","Lap. Futsal B (Rumput Sintetis)","Lap. Basket (Indoor)"].map((c,i)=>(
            <Card key={i} style={{marginBottom:8,padding:12}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div><div style={{fontSize:13,fontWeight:500,color:C.text}}>{c}</div><div style={{fontSize:11,color:C.textMuted,marginTop:2}}>Rp 120.000/jam</div></div>
                <Badge color="#4CAF50" bg={C.successBg}>Tersedia</Badge>
              </div>
            </Card>
          ))}
        </div>
      </>}
    </div>
  </div>;
};

const BookingScreen = ({go}) => (
  <div>
    <TopBar title="Booking lapangan" left={<ChevronLeft size={20} color={C.text} onClick={()=>go("venue")} style={{cursor:"pointer"}} />} />
    <div style={{padding:"0 16px 16px"}}>
      <div style={{fontSize:13,color:C.textMuted,marginBottom:12}}>Pilih lapangan</div>
      {["Lap. Futsal A","Lap. Futsal B","Lap. Basket"].map((c,i)=>(
        <Card key={i} onClick={()=>go("bookingSlot")} style={{marginBottom:10}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{fontSize:14,fontWeight:600,color:C.text}}>{c}</div>
              <div style={{fontSize:12,color:C.textMuted,marginTop:2}}>{i<2?"Futsal · Vinyl":"Basket · Indoor"}</div>
              <div style={{fontSize:13,fontWeight:600,color:C.accent,marginTop:6}}>Rp {i<2?"120":"150"}.000<span style={{fontWeight:400,color:C.textMuted}}>/jam</span></div>
            </div>
            <ChevronRight size={18} color={C.textMuted} />
          </div>
        </Card>
      ))}
    </div>
  </div>
);

const BookingSlotScreen = ({go}) => {
  const [sel,setSel] = useState(null);
  const days = ["Sen","Sel","Rab","Kam","Jum","Sab","Min"];
  const dates = [28,29,30,31,1,2,3];
  const slots = ["08:00","09:00","10:00","11:00","13:00","14:00","15:00","16:00","17:00","19:00","20:00","21:00"];
  const booked = [2,4,7,9];
  return <div>
    <TopBar title="Pilih slot" sub="Lap. Futsal A" left={<ChevronLeft size={20} color={C.text} onClick={()=>go("booking")} style={{cursor:"pointer"}} />} />
    <div style={{padding:"0 16px 16px"}}>
      <div style={{display:"flex",gap:0,marginBottom:16}}>
        {days.map((d,i)=>(
          <button key={i} style={{flex:1,padding:"8px 0",display:"flex",flexDirection:"column",alignItems:"center",gap:4,background: i===3?C.primary:"transparent",borderRadius:10,border:"none",cursor:"pointer"}}>
            <span style={{fontSize:11,color: i===3?"#fff9":C.textMuted}}>{d}</span>
            <span style={{fontSize:15,fontWeight: i===3?700:400,color: i===3?"#fff":C.text}}>{dates[i]}</span>
          </button>
        ))}
      </div>
      <div style={{fontSize:13,color:C.textMuted,marginBottom:10}}>Slot tersedia — 31 Juli 2026</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
        {slots.map((s,i)=>{
          const isBooked = booked.includes(i);
          const isSel = sel===i;
          return <button key={i} disabled={isBooked} onClick={()=>setSel(i)} style={{padding:"12px 8px",borderRadius:10,border: isSel?`2px solid ${C.primaryLight}`:`1px solid ${isBooked?C.border+"44":C.border}`,background: isSel?C.primary+"22":isBooked?C.elevated+"44":"transparent",color: isBooked?C.textMuted+"66":isSel?C.primaryLight:C.text,fontSize:13,fontWeight:isSel?600:400,cursor: isBooked?"not-allowed":"pointer",opacity: isBooked?0.4:1}}>{s}</button>;
        })}
      </div>
      {sel!==null && <div style={{marginTop:20}}>
        <Card style={{background:C.elevated}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><span style={{fontSize:13,color:C.textMuted}}>Lapangan</span><span style={{fontSize:13,color:C.text}}>Futsal A</span></div>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><span style={{fontSize:13,color:C.textMuted}}>Waktu</span><span style={{fontSize:13,color:C.text}}>{slots[sel]} - {slots[sel]?.replace(/(\d+)/,(m)=>String(+m+1))}:00</span></div>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}><span style={{fontSize:13,color:C.textMuted}}>Total</span><span style={{fontSize:15,fontWeight:700,color:C.accent}}>Rp 120.000</span></div>
          <Btn primary full>Bayar sekarang</Btn>
        </Card>
      </div>}
    </div>
  </div>;
};

const FitnessScreen = ({go}) => {
  const [tab,setTab] = useState("Plans");
  return <div>
    <TopBar title="Fitness & studio" left={<ChevronLeft size={20} color={C.text} onClick={()=>go("home")} style={{cursor:"pointer"}} />} right={<Bell size={20} color={C.textSec}/>} />
    <div style={{padding:"0 16px 16px"}}>
      <Card style={{background:`linear-gradient(135deg, ${C.primary}44 0%, ${C.primaryDark}44 100%)`,border:`1px solid ${C.primary}44`,marginBottom:16}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <Badge color="#4CAF50" bg={C.successBg}>Aktif</Badge>
            <div style={{fontSize:16,fontWeight:700,color:C.text,marginTop:8}}>Gold Member</div>
            <div style={{fontSize:12,color:C.textMuted,marginTop:2}}>Berlaku hingga 15 Agu 2026</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:11,color:C.textMuted}}>Visit tersisa</div>
            <div style={{fontSize:24,fontWeight:800,color:C.accent}}>18</div>
          </div>
        </div>
      </Card>
      <TabBar tabs={["Plans","Kunjungan","Reward"]} active={tab} onChange={setTab} />
      {tab==="Plans" && <>
        {[
          {name:"Bronze",price:"150",feat:["Akses gym","1 kelas/minggu"],color:"#CD7F32"},
          {name:"Silver",price:"300",feat:["Akses gym","Unlimited kelas","10% diskon booking"],color:"#C0C0C0"},
          {name:"Gold",price:"500",feat:["Semua Silver","Guest pass/bulan","20% diskon"],color:"#FFD700",current:true},
          {name:"Platinum",price:"800",feat:["Semua Gold","Priority booking","Free treatment"],color:C.accent},
        ].map((p,i)=>(
          <Card key={i} onClick={()=>go("fitnessPlan")} style={{marginBottom:10, border: p.current?`2px solid ${C.primaryLight}`:`1px solid ${C.border}`}}>
            {p.current && <div style={{fontSize:10,fontWeight:700,color:C.primaryLight,marginBottom:6,letterSpacing:1}}>PAKET AKTIF</div>}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"start"}}>
              <div>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <div style={{width:10,height:10,borderRadius:5,background:p.color}} />
                  <span style={{fontSize:15,fontWeight:700,color:C.text}}>{p.name}</span>
                </div>
                <div style={{marginTop:8}}>
                  {p.feat.map((f,j)=><div key={j} style={{fontSize:12,color:C.textMuted,display:"flex",alignItems:"center",gap:6,marginTop:3}}><Check size={12} color="#4CAF50"/>{f}</div>)}
                </div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:18,fontWeight:700,color:C.accent}}>Rp {p.price}rb</div>
                <div style={{fontSize:11,color:C.textMuted}}>/bulan</div>
              </div>
            </div>
          </Card>
        ))}
      </>}
      {tab==="Kunjungan" && <>
        <div style={{display:"flex",gap:10,marginBottom:16}}>
          <StatCard icon={Activity} label="Bulan ini" value="12" color="#4CAF50" />
          <StatCard icon={TrendingUp} label="Total" value="86" color={C.primaryLight} />
        </div>
        {[{date:"31 Jul",time:"07:15"},{date:"30 Jul",time:"16:30"},{date:"28 Jul",time:"08:00"},{date:"26 Jul",time:"07:45"}].map((v,i)=>(
          <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:`1px solid ${C.border}11`}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}><Check size={14} color="#4CAF50"/><span style={{fontSize:13,color:C.text}}>{v.date} 2026</span></div>
            <span style={{fontSize:13,color:C.textMuted}}>{v.time}</span>
          </div>
        ))}
      </>}
      {tab==="Reward" && <>
        <Card style={{textAlign:"center",marginBottom:16,background:C.elevated}}>
          <div style={{fontSize:11,color:C.textMuted}}>Total poin</div>
          <div style={{fontSize:32,fontWeight:800,color:C.accent,margin:"4px 0"}}>860</div>
          <div style={{fontSize:12,color:C.textMuted}}>Tukar dengan reward</div>
        </Card>
        {["Diskon booking 20% — 200 poin","Upgrade tier 1 bulan — 500 poin","Merchandise — 300 poin"].map((r,i)=>(
          <Card key={i} style={{marginBottom:8,padding:12}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:13,color:C.text}}>{r}</span>
              <Btn small primary>Tukar</Btn>
            </div>
          </Card>
        ))}
      </>}
    </div>
  </div>;
};

const FitnessPlanScreen = ({go}) => (
  <div>
    <TopBar title="Gold membership" left={<ChevronLeft size={20} color={C.text} onClick={()=>go("fitness")} style={{cursor:"pointer"}} />} />
    <div style={{padding:"0 16px 16px"}}>
      <div style={{textAlign:"center",padding:"24px 0"}}>
        <div style={{width:56,height:56,borderRadius:28,background:"#FFD70033",margin:"0 auto 12px",display:"flex",alignItems:"center",justifyContent:"center"}}><Star size={24} color="#FFD700" fill="#FFD700"/></div>
        <div style={{fontSize:22,fontWeight:800,color:C.text}}>Gold</div>
        <div style={{fontSize:28,fontWeight:800,color:C.accent,marginTop:4}}>Rp 500.000<span style={{fontSize:14,fontWeight:400,color:C.textMuted}}>/bulan</span></div>
      </div>
      <Card style={{marginBottom:16}}>
        <div style={{fontSize:13,fontWeight:600,color:C.text,marginBottom:10}}>Benefit</div>
        {["Akses gym unlimited","Unlimited kelas group","1 guest pass/bulan","20% diskon booking lapangan","Prioritas antrian"].map((b,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0"}}><Check size={14} color="#4CAF50"/><span style={{fontSize:13,color:C.textSec}}>{b}</span></div>
        ))}
      </Card>
      <Btn primary full>Daftar sekarang</Btn>
      <div style={{textAlign:"center",fontSize:12,color:C.textMuted,marginTop:10}}>Pembayaran melalui DOKU</div>
    </div>
  </div>
);

const AcademyScreen = ({go}) => {
  const [tab,setTab] = useState("Program");
  return <div>
    <TopBar title="Akademi" left={<ChevronLeft size={20} color={C.text} onClick={()=>go("home")} style={{cursor:"pointer"}} />} />
    <div style={{padding:"0 16px 16px"}}>
      <TabBar tabs={["Program","Jadwal","Raport"]} active={tab} onChange={setTab} />
      {tab==="Program" && <>
        {[
          {name:"U-10 Development",sport:"Sepakbola",coach:"Coach Andi",students:15,price:"350"},
          {name:"U-14 Elite",sport:"Sepakbola",coach:"Coach Budi",students:12,price:"500"},
          {name:"Junior Tennis",sport:"Tenis",coach:"Coach Maya",students:8,price:"450"},
        ].map((p,i)=>(
          <Card key={i} style={{marginBottom:10}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"start",marginBottom:8}}>
              <div>
                <div style={{fontSize:15,fontWeight:600,color:C.text}}>{p.name}</div>
                <div style={{fontSize:12,color:C.textMuted,marginTop:2}}>{p.sport} · {p.coach}</div>
              </div>
              <Badge>{p.sport}</Badge>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{display:"flex",alignItems:"center",gap:4}}><Users size={13} color={C.textMuted}/><span style={{fontSize:12,color:C.textMuted}}>{p.students} murid</span></div>
              <span style={{fontSize:14,fontWeight:600,color:C.accent}}>Rp {p.price}rb/bln</span>
            </div>
          </Card>
        ))}
      </>}
      {tab==="Jadwal" && <>
        {["Senin","Selasa","Rabu","Kamis","Jumat"].map((d,i)=>(
          <div key={i} style={{marginBottom:12}}>
            <div style={{fontSize:12,fontWeight:600,color:C.textMuted,marginBottom:6}}>{d}</div>
            <Card style={{padding:12}}>
              <div style={{display:"flex",justifyContent:"space-between"}}>
                <div><div style={{fontSize:13,fontWeight:500,color:C.text}}>U-{10+i*2} {i<3?"Development":"Elite"}</div><div style={{fontSize:11,color:C.textMuted}}>Coach {["Andi","Budi","Maya","Andi","Budi"][i]}</div></div>
                <div style={{textAlign:"right"}}><div style={{fontSize:13,color:C.accent}}>1{5+i}:00-1{7+i}:00</div><div style={{fontSize:11,color:C.textMuted}}>Lap. Futsal A</div></div>
              </div>
            </Card>
          </div>
        ))}
      </>}
      {tab==="Raport" && <>
        <div style={{fontSize:13,color:C.textMuted,marginBottom:12}}>Raport anak Anda</div>
        {["Juli 2026","Juni 2026","Mei 2026"].map((p,i)=>(
          <Card key={i} onClick={()=>go("academyReport")} style={{marginBottom:10}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <div style={{fontSize:14,fontWeight:500,color:C.text}}>Raport {p}</div>
                <div style={{fontSize:12,color:C.textMuted,marginTop:2}}>Ahmad — U-14 Elite</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:18,fontWeight:700,color: i===0?"#4CAF50":C.accent}}>{(3.8-i*0.3).toFixed(1)}</div>
                <Badge color={i===0?"#4CAF50":C.textMuted} bg={i===0?C.successBg:C.elevated}>{i===0?"Published":"Draft"}</Badge>
              </div>
            </div>
          </Card>
        ))}
      </>}
    </div>
  </div>;
};

const AcademyReportScreen = ({go}) => {
  const cats = [
    {name:"Teknik dasar",weight:30,items:[{n:"Dribbling",s:4},{n:"Passing",s:3},{n:"Shooting",s:4},{n:"First touch",s:3}]},
    {name:"Fisik",weight:25,items:[{n:"Kecepatan",s:4},{n:"Daya tahan",s:3},{n:"Kekuatan",s:3}]},
    {name:"Taktik",weight:20,items:[{n:"Posisi",s:4},{n:"Keputusan",s:3},{n:"Kerjasama",s:4}]},
    {name:"Mental",weight:25,items:[{n:"Disiplin",s:5},{n:"Semangat",s:4},{n:"Kepemimpinan",s:3}]},
  ];
  return <div>
    <TopBar title="Raport Juli 2026" sub="Ahmad — U-14 Elite" left={<ChevronLeft size={20} color={C.text} onClick={()=>go("academy")} style={{cursor:"pointer"}} />} />
    <div style={{padding:"0 16px 16px"}}>
      <Card style={{textAlign:"center",marginBottom:16,background:C.elevated}}>
        <div style={{fontSize:11,color:C.textMuted}}>Nilai total</div>
        <div style={{fontSize:36,fontWeight:800,color:"#4CAF50"}}>3.8</div>
        <div style={{fontSize:12,color:C.textMuted}}>dari 5.0</div>
        <div style={{display:"flex",justifyContent:"center",gap:4,marginTop:8}}>
          {[1,2,3,4,5].map(i=><Star key={i} size={16} color={i<=4?"#FFB300":C.textMuted} fill={i<=4?"#FFB300":"none"}/>)}
        </div>
      </Card>
      {cats.map((cat,ci)=>(
        <Card key={ci} style={{marginBottom:10}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <span style={{fontSize:13,fontWeight:600,color:C.text}}>{cat.name}</span>
            <span style={{fontSize:11,color:C.textMuted}}>Bobot {cat.weight}%</span>
          </div>
          {cat.items.map((it,ii)=>(
            <div key={ii} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0"}}>
              <span style={{fontSize:13,color:C.textSec}}>{it.n}</span>
              <div style={{display:"flex",gap:3}}>
                {[1,2,3,4,5].map(v=>(
                  <div key={v} style={{width:20,height:20,borderRadius:4,background: v<=it.s?C.primaryLight:C.border,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color: v<=it.s?"#fff":C.textMuted,fontWeight:600}}>{v}</div>
                ))}
              </div>
            </div>
          ))}
        </Card>
      ))}
      <Card style={{marginBottom:10}}>
        <div style={{fontSize:13,fontWeight:600,color:C.text,marginBottom:6}}>Catatan coach</div>
        <div style={{fontSize:12,color:C.textSec,lineHeight:1.6}}>Ahmad menunjukkan progres yang sangat baik di bulan Juli. Teknik dribbling dan decision making meningkat signifikan. Perlu lebih fokus pada kekuatan fisik dan akurasi passing.</div>
      </Card>
      <div style={{display:"flex",gap:8}}>
        <div style={{flex:1,textAlign:"center",padding:12,background:C.elevated,borderRadius:10}}>
          <div style={{fontSize:11,color:C.textMuted,marginBottom:4}}>Coach</div>
          <div style={{fontSize:20,color:C.primaryLight,fontStyle:"italic",fontFamily:"cursive"}}>Andi</div>
          <div style={{fontSize:10,color:C.textMuted}}>30 Jul 2026</div>
        </div>
        <div style={{flex:1,textAlign:"center",padding:12,background:C.elevated,borderRadius:10}}>
          <div style={{fontSize:11,color:C.textMuted,marginBottom:4}}>Direktur</div>
          <div style={{fontSize:20,color:C.primaryLight,fontStyle:"italic",fontFamily:"cursive"}}>Rudi</div>
          <div style={{fontSize:10,color:C.textMuted}}>31 Jul 2026</div>
        </div>
      </div>
    </div>
  </div>;
};

const ProfileScreen = ({go}) => (
  <div>
    <TopBar title="Profil" />
    <div style={{padding:"0 16px 16px"}}>
      <div style={{textAlign:"center",padding:"20px 0"}}>
        <div style={{width:72,height:72,borderRadius:24,background:C.primary,margin:"0 auto 12px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,fontWeight:800,color:"#fff"}}>T</div>
        <div style={{fontSize:18,fontWeight:700,color:C.text}}>Tara Derifatoni</div>
        <div style={{fontSize:13,color:C.textMuted}}>tara@example.com</div>
      </div>
      <Card style={{marginBottom:16}}>
        <div style={{display:"flex",justifyContent:"space-around",textAlign:"center"}}>
          <div><div style={{fontSize:20,fontWeight:700,color:C.accent}}>24</div><div style={{fontSize:11,color:C.textMuted}}>Booking</div></div>
          <div style={{width:1,background:C.border}} />
          <div><div style={{fontSize:20,fontWeight:700,color:C.accent}}>86</div><div style={{fontSize:11,color:C.textMuted}}>Check-in</div></div>
          <div style={{width:1,background:C.border}} />
          <div><div style={{fontSize:20,fontWeight:700,color:C.accent}}>860</div><div style={{fontSize:11,color:C.textMuted}}>Poin</div></div>
        </div>
      </Card>
      {[
        {icon:CreditCard,label:"Riwayat pembayaran"},{icon:Calendar,label:"Booking aktif"},
        {icon:Users,label:"Anak saya (akademi)"},{icon:Bell,label:"Pengaturan notifikasi"},
        {icon:Settings,label:"Pengaturan akun"},{icon:Shield,label:"Privasi & keamanan"},
      ].map((item,i)=><ListItem key={i} icon={item.icon} title={item.label} />)}
      <div style={{marginTop:16}}>
        <Btn full style={{color:C.danger,borderColor:C.danger+"44"}}><LogOut size={16}/>Keluar</Btn>
      </div>
    </div>
  </div>
);

const LoginScreen = ({go}) => (
  <div>
    <div style={{padding:"40px 24px 24px"}}>
      <div style={{textAlign:"center",marginBottom:32}}>
        <div style={{width:56,height:56,borderRadius:16,background:C.primary,margin:"0 auto 16px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,fontWeight:900,color:"#fff"}}>S</div>
        <div style={{fontSize:24,fontWeight:800,color:C.text}}>Selamat datang</div>
        <div style={{fontSize:14,color:C.textMuted,marginTop:4}}>Masuk ke akun Stadione</div>
      </div>
      <Input label="Email" placeholder="nama@email.com" icon={Mail} />
      <Input label="Kata sandi" placeholder="Masukkan kata sandi" type="password" />
      <div style={{textAlign:"right",marginBottom:20}}><span style={{fontSize:12,color:C.primaryLight,cursor:"pointer"}}>Lupa kata sandi?</span></div>
      <Btn primary full>Masuk</Btn>
      <div style={{textAlign:"center",marginTop:16,fontSize:13,color:C.textMuted}}>
        Belum punya akun? <span style={{color:C.primaryLight,cursor:"pointer"}} onClick={()=>go("register")}>Daftar</span>
      </div>
    </div>
  </div>
);

const RegisterScreen = ({go}) => (
  <div>
    <div style={{padding:"24px"}}>
      <ChevronLeft size={20} color={C.text} onClick={()=>go("login")} style={{cursor:"pointer",marginBottom:16}} />
      <div style={{fontSize:22,fontWeight:800,color:C.text,marginBottom:4}}>Buat akun</div>
      <div style={{fontSize:13,color:C.textMuted,marginBottom:24}}>Daftar untuk mulai booking</div>
      <Input label="Nama lengkap" placeholder="Nama Anda" icon={User} />
      <Input label="Email" placeholder="nama@email.com" icon={Mail} />
      <Input label="No. telepon" placeholder="08xxxxxxxxxx" icon={Phone} />
      <Input label="Kata sandi" placeholder="Min. 8 karakter" type="password" />
      <Btn primary full style={{marginTop:8}}>Daftar</Btn>
      <div style={{textAlign:"center",marginTop:16,fontSize:13,color:C.textMuted}}>
        Sudah punya akun? <span style={{color:C.primaryLight,cursor:"pointer"}} onClick={()=>go("login")}>Masuk</span>
      </div>
    </div>
  </div>
);

const NotificationsScreen = ({go}) => (
  <div>
    <TopBar title="Notifikasi" left={<ChevronLeft size={20} color={C.text} onClick={()=>go("home")} style={{cursor:"pointer"}} />} right={<span style={{fontSize:12,color:C.primaryLight,cursor:"pointer"}}>Tandai semua</span>} />
    <div style={{padding:"0 16px 16px"}}>
      {[
        {type:"booking",title:"Booking dikonfirmasi",body:"Lap. Futsal A, 15:00-16:00",time:"1m",unread:true},
        {type:"raport",title:"Raport Juli diterbitkan",body:"Ahmad — U-14 Elite",time:"2j",unread:true},
        {type:"membership",title:"Membership akan expired",body:"Gold — 3 hari lagi",time:"1h",unread:true},
        {type:"payment",title:"Pembayaran berhasil",body:"Booking #BK-2607 — Rp 120.000",time:"2h",unread:false},
        {type:"booking",title:"Reminder booking besok",body:"Lap. Basket, 10:00-12:00",time:"5h",unread:false},
      ].map((n,i)=>(
        <div key={i} style={{display:"flex",gap:12,padding:"14px 0",borderBottom:`1px solid ${C.border}11`,opacity: n.unread?1:0.6}}>
          {n.unread && <div style={{width:8,height:8,borderRadius:4,background:C.primaryLight,marginTop:6,flexShrink:0}} />}
          {!n.unread && <div style={{width:8,flexShrink:0}} />}
          <div style={{flex:1}}>
            <div style={{display:"flex",justifyContent:"space-between"}}>
              <span style={{fontSize:14,fontWeight: n.unread?600:400,color:C.text}}>{n.title}</span>
              <span style={{fontSize:11,color:C.textMuted}}>{n.time}</span>
            </div>
            <div style={{fontSize:12,color:C.textMuted,marginTop:2}}>{n.body}</div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ===== ADMIN SCREENS =====

const AdminDashScreen = ({go}) => (
  <div>
    <TopBar title="Dashboard" sub="Kenari Football Area" left={<Menu size={20} color={C.text}/>} right={<Bell size={20} color={C.textSec}/>} />
    <div style={{padding:"0 16px 16px"}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
        <StatCard icon={Calendar} label="Booking hari ini" value="18" trend={12} />
        <StatCard icon={DollarSign} label="Revenue" value="2.1jt" trend={8} color="#4CAF50" />
        <StatCard icon={Users} label="Member aktif" value="142" trend={5} color={C.accent} />
        <StatCard icon={GraduationCap} label="Murid" value="45" trend={-2} color="#FFB300" />
      </div>
      <div style={{fontSize:14,fontWeight:600,color:C.text,marginBottom:10}}>Aksi cepat</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
        {[
          {icon:Calendar,label:"Booking",go:"adminBookings"},
          {icon:Users,label:"Member",go:"adminMembers"},
          {icon:GraduationCap,label:"Akademi",go:"adminAcademy"},
          {icon:BarChart3,label:"Laporan",go:"adminReports"},
        ].map((a,i)=>(
          <Card key={i} onClick={()=>go(a.go)} style={{textAlign:"center",padding:14}}>
            <a.icon size={20} color={C.primaryLight} style={{margin:"0 auto 6px"}} />
            <div style={{fontSize:12,fontWeight:500,color:C.text}}>{a.label}</div>
          </Card>
        ))}
      </div>
      <div style={{fontSize:14,fontWeight:600,color:C.text,marginBottom:10}}>Booking terbaru</div>
      {[
        {name:"Andi Setiawan",court:"Futsal A",time:"15:00-16:00",status:"confirmed"},
        {name:"Budi Hartono",court:"Basket",time:"17:00-19:00",status:"pending"},
        {name:"Walk-in Guest",court:"Futsal B",time:"20:00-21:00",status:"paid"},
      ].map((b,i)=>(
        <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:`1px solid ${C.border}11`}}>
          <div><div style={{fontSize:13,fontWeight:500,color:C.text}}>{b.name}</div><div style={{fontSize:11,color:C.textMuted}}>{b.court} · {b.time}</div></div>
          <Badge color={b.status==="confirmed"?"#4CAF50":b.status==="pending"?"#FFB300":C.accent} bg={b.status==="confirmed"?C.successBg:b.status==="pending"?C.warningBg:C.elevated}>{b.status}</Badge>
        </div>
      ))}
    </div>
  </div>
);

const AdminVenuesScreen = ({go}) => (
  <div>
    <TopBar title="Kelola venue" left={<ChevronLeft size={20} color={C.text} onClick={()=>go("adminDash")} style={{cursor:"pointer"}} />} right={<Plus size={20} color={C.primaryLight}/>} />
    <div style={{padding:"0 16px 16px"}}>
      <Input placeholder="Cari venue..." icon={Search} />
      {[
        {name:"Kenari Football Area",city:"Yogyakarta",status:"active",domains:["Booking","Membership"]},
        {name:"Iron Gym Sleman",city:"Sleman",status:"active",domains:["Membership"]},
        {name:"Champion Arena",city:"Sleman",status:"pending",domains:["Booking","Akademi"]},
      ].map((v,i)=>(
        <Card key={i} style={{marginBottom:10}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"start",marginBottom:8}}>
            <div>
              <div style={{fontSize:14,fontWeight:600,color:C.text}}>{v.name}</div>
              <div style={{fontSize:12,color:C.textMuted,marginTop:2}}>{v.city}</div>
            </div>
            <StatusDot color={v.status==="active"?"#4CAF50":"#FFB300"} />
          </div>
          <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{v.domains.map(d=><Badge key={d}>{d}</Badge>)}</div>
        </Card>
      ))}
    </div>
  </div>
);

const AdminBookingsScreen = ({go}) => {
  const [view,setView] = useState("list");
  return <div>
    <TopBar title="Kelola booking" left={<ChevronLeft size={20} color={C.text} onClick={()=>go("adminDash")} style={{cursor:"pointer"}} />} right={<Filter size={18} color={C.textSec}/>} />
    <div style={{padding:"0 16px 16px"}}>
      <div style={{display:"flex",gap:6,marginBottom:14}}>
        {["list","calendar"].map(v=>(
          <button key={v} onClick={()=>setView(v)} style={{padding:"6px 14px",borderRadius:8,border:`1px solid ${view===v?C.primaryLight:C.border}`,background: view===v?C.primary+"22":"transparent",color: view===v?C.primaryLight:C.textMuted,fontSize:12,cursor:"pointer"}}>{v==="list"?"Daftar":"Kalender"}</button>
        ))}
      </div>
      {view==="list" ? <>
        <div style={{display:"flex",gap:10,marginBottom:14}}>
          <StatCard icon={Calendar} label="Hari ini" value="18" />
          <StatCard icon={Clock} label="Pending" value="3" color="#FFB300" />
        </div>
        {[
          {id:"BK-3107-001",name:"Andi Setiawan",court:"Futsal A",date:"31 Jul",time:"15:00-16:00",amount:"120rb",status:"confirmed"},
          {id:"BK-3107-002",name:"Lisa Permata",court:"Basket",date:"31 Jul",time:"17:00-19:00",amount:"300rb",status:"paid"},
          {id:"BK-3107-003",name:"Walk-in",court:"Futsal B",date:"31 Jul",time:"20:00-21:00",amount:"120rb",status:"pending"},
          {id:"BK-3007-001",name:"Rudi Hartono",court:"Futsal A",date:"30 Jul",time:"08:00-10:00",amount:"240rb",status:"completed"},
        ].map((b,i)=>(
          <Card key={i} style={{marginBottom:8,padding:12}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"start",marginBottom:6}}>
              <div><div style={{fontSize:13,fontWeight:500,color:C.text}}>{b.name}</div><div style={{fontSize:11,color:C.textMuted}}>{b.id}</div></div>
              <Badge color={b.status==="confirmed"?"#4CAF50":b.status==="paid"?C.accent:b.status==="pending"?"#FFB300":C.textMuted}
                bg={b.status==="confirmed"?C.successBg:b.status==="pending"?C.warningBg:C.elevated}>{b.status}</Badge>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:C.textMuted}}>
              <span>{b.court} · {b.date} · {b.time}</span>
              <span style={{color:C.accent,fontWeight:600}}>Rp {b.amount}</span>
            </div>
          </Card>
        ))}
      </> : <Card>
        <div style={{fontSize:13,fontWeight:600,color:C.text,marginBottom:12}}>Juli 2026</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:0,textAlign:"center"}}>
          {["S","S","R","K","J","S","M"].map((d,i)=><div key={i} style={{fontSize:11,color:C.textMuted,padding:6}}>{d}</div>)}
          {Array.from({length:35},(_, i)=>{
            const day = i-2;
            const hasBooking = [1,3,5,8,10,12,15,17,19,22,24,26,28,29,30].includes(day);
            return <div key={i} style={{padding:4}}>
              {day>0 && day<=31 && <div style={{width:28,height:28,borderRadius:8,background: day===31?C.primary:hasBooking?C.primary+"22":"transparent",color: day===31?"#fff":C.text,fontSize:12,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto",position:"relative"}}>
                {day}
                {hasBooking && day!==31 && <div style={{position:"absolute",bottom:1,width:4,height:4,borderRadius:2,background:C.primaryLight}} />}
              </div>}
            </div>;
          })}
        </div>
      </Card>}
    </div>
  </div>;
};

const AdminMembersScreen = ({go}) => (
  <div>
    <TopBar title="Kelola member" left={<ChevronLeft size={20} color={C.text} onClick={()=>go("adminDash")} style={{cursor:"pointer"}} />} right={<Plus size={20} color={C.primaryLight}/>} />
    <div style={{padding:"0 16px 16px"}}>
      <Input placeholder="Cari member..." icon={Search} />
      <div style={{display:"flex",gap:10,marginBottom:14}}>
        <StatCard icon={Users} label="Total aktif" value="142" color="#4CAF50" />
        <StatCard icon={AlertCircle} label="Expired" value="8" color={C.danger} />
      </div>
      {[
        {name:"Sari Dewi",plan:"Gold",visits:18,exp:"15 Agu",status:"active"},
        {name:"Bambang S.",plan:"Silver",visits:12,exp:"22 Jul",status:"expired"},
        {name:"Citra L.",plan:"Platinum",visits:25,exp:"30 Sep",status:"active"},
        {name:"Dian P.",plan:"Bronze",visits:5,exp:"1 Agu",status:"frozen"},
      ].map((m,i)=>(
        <Card key={i} style={{marginBottom:8,padding:12}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"start"}}>
            <div style={{display:"flex",gap:10,alignItems:"center"}}>
              <div style={{width:36,height:36,borderRadius:12,background:C.primary+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:600,color:C.primaryLight}}>{m.name[0]}</div>
              <div>
                <div style={{fontSize:13,fontWeight:500,color:C.text}}>{m.name}</div>
                <div style={{fontSize:11,color:C.textMuted}}>{m.plan} · {m.visits} visit · exp {m.exp}</div>
              </div>
            </div>
            <Badge color={m.status==="active"?"#4CAF50":m.status==="expired"?C.danger:"#FFB300"}
              bg={m.status==="active"?C.successBg:m.status==="expired"?C.dangerBg:C.warningBg}>{m.status}</Badge>
          </div>
        </Card>
      ))}
    </div>
  </div>
);

const AdminAcademyScreen = ({go}) => (
  <div>
    <TopBar title="Kelola akademi" left={<ChevronLeft size={20} color={C.text} onClick={()=>go("adminDash")} style={{cursor:"pointer"}} />} right={<Plus size={20} color={C.primaryLight}/>} />
    <div style={{padding:"0 16px 16px"}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:16}}>
        {[{l:"Program",v:"3"},{l:"Coach",v:"4"},{l:"Murid",v:"45"}].map((s,i)=>(
          <Card key={i} style={{textAlign:"center",padding:10}}><div style={{fontSize:18,fontWeight:700,color:C.accent}}>{s.v}</div><div style={{fontSize:11,color:C.textMuted}}>{s.l}</div></Card>
        ))}
      </div>
      <div style={{fontSize:14,fontWeight:600,color:C.text,marginBottom:10}}>Murid terdaftar</div>
      {[
        {name:"Ahmad R.",program:"U-14 Elite",att:"92%",score:"3.8"},
        {name:"Bintang S.",program:"U-10 Dev",att:"88%",score:"3.5"},
        {name:"Cinta A.",program:"Junior Tennis",att:"95%",score:"4.1"},
        {name:"Dafa M.",program:"U-14 Elite",att:"78%",score:"3.2"},
      ].map((s,i)=>(
        <Card key={i} style={{marginBottom:8,padding:12}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{fontSize:13,fontWeight:500,color:C.text}}>{s.name}</div>
              <div style={{fontSize:11,color:C.textMuted}}>{s.program} · Kehadiran {s.att}</div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:16,fontWeight:700,color:C.accent}}>{s.score}</div>
              <div style={{fontSize:10,color:C.textMuted}}>Nilai</div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  </div>
);

const AdminStaffScreen = ({go}) => (
  <div>
    <TopBar title="Kelola staff" left={<ChevronLeft size={20} color={C.text} onClick={()=>go("adminDash")} style={{cursor:"pointer"}} />} right={<UserPlus size={18} color={C.primaryLight}/>} />
    <div style={{padding:"0 16px 16px"}}>
      {[
        {name:"Budi Santoso",role:"Manager",email:"budi@email.com",status:"active"},
        {name:"Siti Aminah",role:"Staff",email:"siti@email.com",status:"active"},
        {name:"Coach Andi",role:"Coach",email:"andi@email.com",status:"active"},
        {name:"Dewi R.",role:"Staff",email:"dewi@email.com",status:"invited"},
      ].map((s,i)=>(
        <Card key={i} style={{marginBottom:8,padding:12}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{display:"flex",gap:10,alignItems:"center"}}>
              <div style={{width:36,height:36,borderRadius:12,background:C.accentMuted+"33",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:600,color:C.accent}}>{s.name[0]}</div>
              <div>
                <div style={{fontSize:13,fontWeight:500,color:C.text}}>{s.name}</div>
                <div style={{fontSize:11,color:C.textMuted}}>{s.email}</div>
              </div>
            </div>
            <div style={{textAlign:"right"}}>
              <Badge color={s.role==="Manager"?C.accent:s.role==="Coach"?"#4CAF50":C.textMuted}>{s.role}</Badge>
              {s.status==="invited" && <div style={{fontSize:10,color:"#FFB300",marginTop:4}}>Pending</div>}
            </div>
          </div>
        </Card>
      ))}
      <Btn full primary style={{marginTop:12}}><UserPlus size={16}/>Undang staff baru</Btn>
    </div>
  </div>
);

const AdminReportsScreen = ({go}) => (
  <div>
    <TopBar title="Laporan" left={<ChevronLeft size={20} color={C.text} onClick={()=>go("adminDash")} style={{cursor:"pointer"}} />} />
    <div style={{padding:"0 16px 16px"}}>
      <div style={{display:"flex",gap:6,marginBottom:14}}>
        {["Harian","Mingguan","Bulanan"].map((t,i)=>(
          <button key={t} style={{flex:1,padding:"8px 0",borderRadius:8,border:`1px solid ${i===0?C.primaryLight:C.border}`,background: i===0?C.primary+"22":"transparent",color: i===0?C.primaryLight:C.textMuted,fontSize:12,cursor:"pointer"}}>{t}</button>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
        <StatCard icon={DollarSign} label="Revenue" value="28.5jt" trend={12} color="#4CAF50" />
        <StatCard icon={Calendar} label="Booking" value="342" trend={8} />
        <StatCard icon={Users} label="New member" value="23" trend={15} color={C.accent} />
        <StatCard icon={Activity} label="Check-in" value="1.2rb" trend={-3} color="#FFB300" />
      </div>
      <Card style={{marginBottom:16}}>
        <div style={{fontSize:13,fontWeight:600,color:C.text,marginBottom:12}}>Revenue bulanan</div>
        <div style={{display:"flex",alignItems:"flex-end",gap:6,height:100}}>
          {[40,55,45,68,72,85,92].map((h,i)=>(
            <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
              <div style={{width:"100%",height:h,borderRadius:4,background: i===6?C.primaryLight:C.primary+"44",transition:"height 0.3s"}} />
              <span style={{fontSize:9,color:C.textMuted}}>{["Jan","Feb","Mar","Apr","Mei","Jun","Jul"][i]}</span>
            </div>
          ))}
        </div>
      </Card>
      <div style={{fontSize:14,fontWeight:600,color:C.text,marginBottom:10}}>Top lapangan</div>
      {["Futsal A — 142 booking","Basket — 98 booking","Futsal B — 87 booking"].map((t,i)=>(
        <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:`1px solid ${C.border}11`}}>
          <div style={{width:24,height:24,borderRadius:8,background:C.primary+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:C.primaryLight}}>{i+1}</div>
          <span style={{fontSize:13,color:C.text,flex:1}}>{t}</span>
        </div>
      ))}
    </div>
  </div>
);

const AdminSettingsScreen = ({go}) => (
  <div>
    <TopBar title="Pengaturan" left={<ChevronLeft size={20} color={C.text} onClick={()=>go("adminDash")} style={{cursor:"pointer"}} />} />
    <div style={{padding:"0 16px 16px"}}>
      <div style={{fontSize:13,color:C.textMuted,marginBottom:10}}>Venue</div>
      {[{icon:Building2,label:"Info venue"},{icon:Clock,label:"Jam operasional"},{icon:CreditCard,label:"Harga lapangan"},{icon:Tag,label:"Promo & diskon"}].map((s,i)=>
        <ListItem key={i} icon={s.icon} title={s.label} />)}
      <div style={{fontSize:13,color:C.textMuted,marginBottom:10,marginTop:16}}>Pembayaran</div>
      {[{icon:CreditCard,label:"DOKU konfigurasi"},{icon:DollarSign,label:"Platform fee"}].map((s,i)=>
        <ListItem key={i} icon={s.icon} title={s.label} />)}
      <div style={{fontSize:13,color:C.textMuted,marginBottom:10,marginTop:16}}>Sistem</div>
      {[{icon:Bell,label:"Template notifikasi"},{icon:Shield,label:"Role & permission"},{icon:FileText,label:"Syarat & ketentuan"}].map((s,i)=>
        <ListItem key={i} icon={s.icon} title={s.label} />)}
    </div>
  </div>
);

// ===== POS SCREENS =====

const PosMainScreen = ({go}) => (
  <div>
    <TopBar title="POS kasir" sub="Shift aktif · Siti Aminah" left={<div style={{width:32,height:32,borderRadius:10,background:C.primary,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:"#fff"}}>POS</div>} right={<Settings size={18} color={C.textSec} onClick={()=>go("posShift")} style={{cursor:"pointer"}} />} />
    <div style={{padding:"0 16px 16px"}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
        <StatCard icon={DollarSign} label="Kas masuk" value="1.8jt" color="#4CAF50" />
        <StatCard icon={Calendar} label="Transaksi" value="12" color={C.primaryLight} />
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
        <Card onClick={()=>go("posWalkin")} style={{textAlign:"center",padding:20,cursor:"pointer"}}>
          <Calendar size={28} color={C.primaryLight} style={{margin:"0 auto 8px"}} />
          <div style={{fontSize:14,fontWeight:600,color:C.text}}>Walk-in booking</div>
          <div style={{fontSize:11,color:C.textMuted}}>Buat booking baru</div>
        </Card>
        <Card style={{textAlign:"center",padding:20}}>
          <Users size={28} color="#4CAF50" style={{margin:"0 auto 8px"}} />
          <div style={{fontSize:14,fontWeight:600,color:C.text}}>Check-in</div>
          <div style={{fontSize:11,color:C.textMuted}}>Member check-in</div>
        </Card>
        <Card style={{textAlign:"center",padding:20}}>
          <CreditCard size={28} color={C.accent} style={{margin:"0 auto 8px"}} />
          <div style={{fontSize:14,fontWeight:600,color:C.text}}>Pembayaran</div>
          <div style={{fontSize:11,color:C.textMuted}}>Terima pembayaran</div>
        </Card>
        <Card onClick={()=>go("posInvoice")} style={{textAlign:"center",padding:20,cursor:"pointer"}}>
          <FileText size={28} color="#FFB300" style={{margin:"0 auto 8px"}} />
          <div style={{fontSize:14,fontWeight:600,color:C.text}}>Invoice</div>
          <div style={{fontSize:11,color:C.textMuted}}>Cetak struk</div>
        </Card>
      </div>
      <div style={{fontSize:14,fontWeight:600,color:C.text,marginBottom:10}}>Transaksi hari ini</div>
      {[
        {id:"INV-260731-001",type:"Booking",amount:"120rb",method:"QRIS",time:"14:30"},
        {id:"INV-260731-002",type:"Membership",amount:"500rb",method:"Transfer",time:"13:15"},
        {id:"INV-260731-003",type:"Booking",amount:"240rb",method:"Cash",time:"10:00"},
      ].map((t,i)=>(
        <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:`1px solid ${C.border}11`}}>
          <div><div style={{fontSize:13,fontWeight:500,color:C.text}}>{t.type}</div><div style={{fontSize:11,color:C.textMuted}}>{t.id} · {t.method}</div></div>
          <div style={{textAlign:"right"}}><div style={{fontSize:13,fontWeight:600,color:C.accent}}>Rp {t.amount}</div><div style={{fontSize:10,color:C.textMuted}}>{t.time}</div></div>
        </div>
      ))}
    </div>
  </div>
);

const PosShiftScreen = ({go}) => (
  <div>
    <TopBar title="Shift" left={<ChevronLeft size={20} color={C.text} onClick={()=>go("posMain")} style={{cursor:"pointer"}} />} />
    <div style={{padding:"0 16px 16px"}}>
      <Card style={{background:C.elevated,marginBottom:16}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div><Badge color="#4CAF50" bg={C.successBg}>Shift aktif</Badge><div style={{fontSize:14,fontWeight:600,color:C.text,marginTop:6}}>Siti Aminah</div></div>
          <div style={{textAlign:"right"}}><div style={{fontSize:11,color:C.textMuted}}>Dibuka</div><div style={{fontSize:13,color:C.text}}>08:00</div></div>
        </div>
        <div style={{borderTop:`1px solid ${C.border}`,paddingTop:12}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><span style={{fontSize:12,color:C.textMuted}}>Kas awal</span><span style={{fontSize:12,color:C.text}}>Rp 200.000</span></div>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><span style={{fontSize:12,color:C.textMuted}}>Cash masuk</span><span style={{fontSize:12,color:"#4CAF50"}}>+ Rp 860.000</span></div>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><span style={{fontSize:12,color:C.textMuted}}>Cash keluar</span><span style={{fontSize:12,color:C.danger}}>- Rp 120.000</span></div>
          <div style={{display:"flex",justifyContent:"space-between",borderTop:`1px solid ${C.border}`,paddingTop:8}}><span style={{fontSize:13,fontWeight:600,color:C.text}}>Kas saat ini</span><span style={{fontSize:13,fontWeight:700,color:C.accent}}>Rp 940.000</span></div>
        </div>
      </Card>
      <Btn full style={{borderColor:C.danger+"66",color:C.danger}}>Tutup shift</Btn>
      <div style={{fontSize:14,fontWeight:600,color:C.text,marginTop:20,marginBottom:10}}>Riwayat shift</div>
      {["30 Jul — 08:00-17:00 — Siti","29 Jul — 08:00-16:00 — Budi","28 Jul — 10:00-18:00 — Siti"].map((s,i)=>(
        <div key={i} style={{padding:"10px 0",borderBottom:`1px solid ${C.border}11`,fontSize:13,color:C.textSec,display:"flex",justifyContent:"space-between"}}>
          <span>{s}</span>
          {i===1 && <Badge color={C.danger} bg={C.dangerBg}>Selisih</Badge>}
        </div>
      ))}
    </div>
  </div>
);

const PosWalkinScreen = ({go}) => (
  <div>
    <TopBar title="Walk-in booking" left={<ChevronLeft size={20} color={C.text} onClick={()=>go("posMain")} style={{cursor:"pointer"}} />} />
    <div style={{padding:"0 16px 16px"}}>
      <Input label="Nama pelanggan (opsional)" placeholder="Walk-in guest" />
      <div style={{marginBottom:14}}>
        <label style={{fontSize:12,color:C.textSec,marginBottom:6,display:"block"}}>Pilih lapangan</label>
        <div style={{display:"flex",gap:8}}>
          {["Futsal A","Futsal B","Basket"].map((c,i)=>(
            <button key={c} style={{flex:1,padding:"10px 8px",borderRadius:10,border:`1px solid ${i===0?C.primaryLight:C.border}`,background: i===0?C.primary+"22":"transparent",color: i===0?C.primaryLight:C.textMuted,fontSize:12,cursor:"pointer"}}>{c}</button>
          ))}
        </div>
      </div>
      <div style={{display:"flex",gap:8}}>
        <div style={{flex:1}}><Input label="Mulai" placeholder="15:00" /></div>
        <div style={{flex:1}}><Input label="Selesai" placeholder="16:00" /></div>
      </div>
      <Card style={{background:C.elevated,marginBottom:16}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><span style={{fontSize:13,color:C.textMuted}}>Harga</span><span style={{fontSize:13,color:C.text}}>Rp 120.000</span></div>
        <div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:13,fontWeight:600,color:C.text}}>Total</span><span style={{fontSize:15,fontWeight:700,color:C.accent}}>Rp 120.000</span></div>
      </Card>
      <div style={{marginBottom:14}}>
        <label style={{fontSize:12,color:C.textSec,marginBottom:6,display:"block"}}>Metode pembayaran</label>
        <div style={{display:"flex",gap:8}}>
          {["Cash","QRIS","Transfer","Split"].map((m,i)=>(
            <button key={m} style={{flex:1,padding:"10px 4px",borderRadius:10,border:`1px solid ${i===0?C.primaryLight:C.border}`,background: i===0?C.primary+"22":"transparent",color: i===0?C.primaryLight:C.textMuted,fontSize:11,cursor:"pointer",fontWeight:500}}>{m}</button>
          ))}
        </div>
      </div>
      <Btn primary full>Konfirmasi & cetak struk</Btn>
    </div>
  </div>
);

const PosInvoiceScreen = ({go}) => (
  <div>
    <TopBar title="Invoice" left={<ChevronLeft size={20} color={C.text} onClick={()=>go("posMain")} style={{cursor:"pointer"}} />} />
    <div style={{padding:"0 16px 16px"}}>
      <Card style={{background:"#fff",color:"#111",borderRadius:12,padding:20}}>
        <div style={{textAlign:"center",borderBottom:"1px dashed #ddd",paddingBottom:12,marginBottom:12}}>
          <div style={{fontSize:16,fontWeight:800,color:"#111"}}>KENARI FOOTBALL AREA</div>
          <div style={{fontSize:11,color:"#888",marginTop:2}}>Jl. Kenari No. 12, Yogyakarta</div>
          <div style={{fontSize:11,color:"#888"}}>Telp: 0274-123456</div>
        </div>
        <div style={{fontSize:11,color:"#888",marginBottom:8}}>
          <div>No: INV-260731-001</div>
          <div>Tanggal: 31 Jul 2026 14:30</div>
          <div>Kasir: Siti Aminah</div>
        </div>
        <div style={{borderTop:"1px dashed #ddd",borderBottom:"1px dashed #ddd",padding:"8px 0",marginBottom:8}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:13,color:"#111",marginBottom:4}}>
            <span>Booking Futsal A</span><span>Rp 120.000</span>
          </div>
          <div style={{fontSize:11,color:"#888"}}>31 Jul 2026 · 15:00-16:00 (1 jam)</div>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:14,fontWeight:700,color:"#111",marginBottom:4}}>
          <span>TOTAL</span><span>Rp 120.000</span>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#888",marginBottom:12}}>
          <span>Metode</span><span>QRIS</span>
        </div>
        <div style={{textAlign:"center",fontSize:11,color:"#aaa",borderTop:"1px dashed #ddd",paddingTop:8}}>Terima kasih!</div>
      </Card>
      <div style={{display:"flex",gap:8,marginTop:16}}>
        <Btn full><Printer size={16}/>Cetak</Btn>
        <Btn full><Mail size={16}/>Kirim</Btn>
      </div>
    </div>
  </div>
);

// ===== MAIN APP =====
export default function StadioneMockup() {
  const [screen, setScreen] = useState("home");
  const [section, setSection] = useState("public");
  const go = (s) => { setScreen(s); if(screens.public.includes(s)) setSection("public"); else if(screens.admin.includes(s)) setSection("admin"); else setSection("pos"); };

  const renderScreen = () => {
    const props = {go};
    const map = {
      home:<HomeScreen {...props}/>, venue:<VenueScreen {...props}/>, booking:<BookingScreen {...props}/>,
      bookingSlot:<BookingSlotScreen {...props}/>, fitness:<FitnessScreen {...props}/>, fitnessPlan:<FitnessPlanScreen {...props}/>,
      academy:<AcademyScreen {...props}/>, academyReport:<AcademyReportScreen {...props}/>,
      profile:<ProfileScreen {...props}/>, login:<LoginScreen {...props}/>, register:<RegisterScreen {...props}/>,
      notifications:<NotificationsScreen {...props}/>,
      adminDash:<AdminDashScreen {...props}/>, adminVenues:<AdminVenuesScreen {...props}/>,
      adminBookings:<AdminBookingsScreen {...props}/>, adminMembers:<AdminMembersScreen {...props}/>,
      adminAcademy:<AdminAcademyScreen {...props}/>, adminStaff:<AdminStaffScreen {...props}/>,
      adminReports:<AdminReportsScreen {...props}/>, adminSettings:<AdminSettingsScreen {...props}/>,
      posMain:<PosMainScreen {...props}/>, posShift:<PosShiftScreen {...props}/>,
      posWalkin:<PosWalkinScreen {...props}/>, posInvoice:<PosInvoiceScreen {...props}/>,
    };
    return map[screen] || <HomeScreen {...props}/>;
  };

  const sectionColors = {public: C.primaryLight, admin: C.accent, pos: "#4CAF50"};

  return (
    <div style={{fontFamily:"-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",maxWidth:900,margin:"0 auto",padding:"0 16px"}}>
      {/* Section Selector */}
      <div style={{display:"flex",gap:0,marginBottom:16,borderRadius:12,overflow:"hidden",border:`1px solid ${C.border}`,background:C.surface}}>
        {[
          {id:"public",label:"Publik",icon:"📱",screens:screens.public},
          {id:"admin",label:"Admin",icon:"⚙️",screens:screens.admin},
          {id:"pos",label:"POS",icon:"🧾",screens:screens.pos},
        ].map(s=>(
          <button key={s.id} onClick={()=>{setSection(s.id);setScreen(s.screens[0]);}} style={{flex:1,padding:"12px 8px",background: section===s.id?C.primary:"transparent",color: section===s.id?"#fff":C.textMuted,border:"none",fontSize:13,fontWeight:600,cursor:"pointer",transition:"all 0.15s"}}>
            <span style={{marginRight:4}}>{s.icon}</span>{s.label}
          </button>
        ))}
      </div>

      {/* Screen Navigator */}
      <div style={{display:"flex",gap:6,marginBottom:16,overflowX:"auto",paddingBottom:4}}>
        {screens[section].map(s=>(
          <button key={s} onClick={()=>setScreen(s)} style={{padding:"6px 12px",borderRadius:8,background: screen===s?sectionColors[section]+"22":"transparent",border:`1px solid ${screen===s?sectionColors[section]:C.border}`,color: screen===s?sectionColors[section]:C.textMuted,fontSize:11,whiteSpace:"nowrap",cursor:"pointer",fontWeight: screen===s?600:400}}>
            {allScreenNames[s]}
          </button>
        ))}
      </div>

      {/* Phone Frame */}
      <div style={{display:"flex",justifyContent:"center"}}>
        <div style={{width:375,background:C.bg,borderRadius:32,border:`3px solid ${C.border}`,overflow:"hidden",position:"relative",boxShadow:`0 20px 60px ${C.bg}88`}}>
          {/* Status Bar */}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 20px",fontSize:12,color:C.textMuted}}>
            <span style={{fontWeight:600}}>9:41</span>
            <div style={{display:"flex",gap:4,alignItems:"center"}}>
              <div style={{width:16,height:10,borderRadius:2,border:`1px solid ${C.textMuted}`,position:"relative"}}><div style={{width:10,height:6,borderRadius:1,background:C.textMuted,position:"absolute",top:1,left:1}} /></div>
            </div>
          </div>

          {/* Screen Content */}
          <div style={{height:680,overflowY:"auto",overflowX:"hidden"}}>
            {renderScreen()}
          </div>

          {/* Bottom Nav (public only) */}
          {section === "public" && !["login","register"].includes(screen) && (
            <BottomNav active={screen} onChange={go} />
          )}
        </div>
      </div>

      {/* Color Palette Reference */}
      <div style={{marginTop:24,padding:16,background:C.surface,borderRadius:12,border:`1px solid ${C.border}`}}>
        <div style={{fontSize:13,fontWeight:600,color:C.text,marginBottom:10}}>Design tokens</div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {[
            {name:"Cherry Red",hex:C.primary},{name:"Primary Light",hex:C.primaryLight},
            {name:"Dusty Accent",hex:C.accent},{name:"Sandy Taupe",hex:C.accentMuted},
            {name:"Background",hex:C.bg},{name:"Surface",hex:C.surface},
            {name:"Elevated",hex:C.elevated},{name:"Text",hex:C.text},
          ].map(c=>(
            <div key={c.name} style={{display:"flex",alignItems:"center",gap:6}}>
              <div style={{width:20,height:20,borderRadius:6,background:c.hex,border:`1px solid ${C.border}`}} />
              <div><div style={{fontSize:11,color:C.text}}>{c.name}</div><div style={{fontSize:10,color:C.textMuted}}>{c.hex}</div></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
