// Routine illustrated assignments. Additional and protected content remain untouched.
const START='2026-11-02';
function requiresIllustration(item){
 const m=item.editorial_meta||{};
 if(!['DRAFT','PENDING_REVIEW'].includes(item.status)||m.cms_deleted_at||item.archived_at||m.additional===true||m.is_additional===true)return false;
 if(m.required_visual_mode==='illustration')return true;
 const match=String(m.plan_key||'').match(/^(\d{4}-\d{2}-\d{2}):(mon|wed|mid)-pm$/);
 if(!match||match[1]<START)return false;
 const day=new Date(match[1]+'T12:00:00Z').getUTCDay();
 return day===(match[2]==='mon'?1:3);
}
function illustrationIssues(input,item){
 if(!requiresIllustration(item))return[];
 if(input.format!=='REEL')return['ILLUSTRATION_REQUIRED: slot ini wajib Reel ilustrasi. Jangan ganti ke carousel; laporkan hambatan.'];
 if(!input.packet?.media?.illustration_reel)return['ILLUSTRATION_REQUIRED: packet harus memuat media.illustration_reel, bukan footage biasa.'];
 return[];
}
async function renderPacket(media,packet,format){
 if(format==='CAROUSEL')return media.renderCarousel(packet);
 if(format!=='REEL')throw Error('Format produksi tidak dikenal');
 return [await (packet.media?.illustration_reel?media.renderIllustrationReel(packet):media.renderReel(packet))];
}
function classifyProductionResult(result){
 if(result.skipped)return 'SKIPPED';
 if(result.state==='AUTO_SCHEDULED')return 'AUTO_SCHEDULED';
 if(result.state==='READY_FOR_REVIEW')return 'READY_FOR_REVIEW';
 throw Error('Produksi tertahan: '+result.state+' '+(result.issues||[]).join('; '));
}
module.exports={requiresIllustration,illustrationIssues,renderPacket,classifyProductionResult};
