'use strict';
// VOID RUNNER feature layer: scoring/combos/ranks, menus, modes, achievements, daily challenge, difficulty.
// Talks to game.js through emit() hooks and by wrapping a few of its functions.
const FT={};
// ================= 1. SCORE, COMBO, RANK =================
const PTS={drone:100,weaver:100,kami:120,gun:300,rock:50,crawler:150,flyer:150,turret:250,brute:3000,boss:5000,chaser:400,coin:50};
const LINEPTS=[0,400,1000,1800,3000];
const PLAYING=s=>s==='space'||s==='plat'||s==='hack'||s==='evade';
function comboT(){return G&&G.mode==='hack'?14:3;}
function sc(){if(!G)return null;if(!G.sc)G.sc={score:0,combo:0,best:0,ct:0,dmg:0,pot:0,pops:[],kills:0};return G.sc;}
function mult(c){return Math.min(4,1+Math.floor(c/4)*0.5);}
function addPts(base,x,y,plat){const s=sc();s.combo++;s.best=Math.max(s.best,s.combo);s.ct=comboT();const m=mult(s.combo),v=Math.round(base*m*diffK().score);s.score+=v;
 if(x!==undefined&&s.pops.length<24)s.pops.push({x,y,v,t:0.8,plat});emit('score',s);}
function parTime(L){const g=G;if(L.t==='space')return(g.waves&&g.waves.len||40)+75;if(L.t==='plat')return Math.round(g.cols*16/115*1.7+45);if(L.t==='hack')return g.target*10+20;return 75;}
function rankOf(r){const s=r.ratio>=1.5?2:r.ratio>=0.8?1:0,d=r.dmg===0?2:r.dmg<=2?1:0,t=r.time<=r.par?1:0,p=s+d+t;return p>=5?'S':p>=3?'A':p>=2?'B':'C';}
const RCOL={S:'#ffd23a',A:'#9aff5a',B:'#5ab0ff',C:'#a08ab0'};
HOOKS.push((n,a)=>{if(!G)return;const s=sc();
 if(n==='start'){s.t0=G.t||0;if(G.mode==='plat')for(const e of G.ens)s.pot+=PTS[e.k]||100;if(G.mode==='hack')s.pot=G.target*600;if(G.mode==='evade'){s.pot=G.items.filter(i=>i.k==='c').length*PTS.coin+800;}}
 else if(n==='spawn'){s.pot+=PTS[a.k]||100;}
 else if(n==='kill'){s.kills++;if(a.k==='boss')s.pot+=PTS.boss;addPts(PTS[a.k]||100,a.x,a.y,a.plat);}
 else if(n==='coin'){addPts(PTS.coin);}
 else if(n==='lines'){addPts(LINEPTS[Math.min(4,a)]);}
 else if(n==='hurt'){s.dmg++;s.combo=0;s.ct=0;}
 else if(n==='clear'){const L=a;if(L.final&&!FT.noSave)S.done=1;const time=(G.t||0)-(s.t0||0),res={score:s.score,best:s.best,dmg:s.dmg,time,par:parTime(L),ratio:s.pot?s.score/s.pot:1};res.rank=rankOf(res);FT.last=res;
  if(!FT.noSave){S.best=S.best||{};const o=S.best[curLvl];const RV={S:4,A:3,B:2,C:1};if(!o||RV[res.rank]>RV[o.r]||(res.rank===o.r&&res.score>o.s))S.best[curLvl]={r:res.rank,s:Math.max(res.score,o?o.s:0)};else o.s=Math.max(o.s,res.score);}}
 else if(n==='overlay'){if(PLAYING(state))scoreHUD(a);}});
function scoreHUD(dt){const s=sc();if(!s)return;s.ct=Math.max(0,s.ct-dt);if(s.ct<=0&&s.combo){s.combo=0;}
 const sx=G.mode==='hack'?W/2:W/2;txt(String(s.score).padStart(7,'0'),sx,5,'#dfe8ff',8);
 if(s.combo>=2){const m=mult(s.combo),c=m>=3?'#ffd23a':m>=2?'#ffa03a':'#9aff5a';txt(s.combo+' CHAIN  X'+m.toFixed(1),sx,15,c,7);ctx.fillStyle='#1a2040';ctx.fillRect(sx-24,24,48,2);ctx.fillStyle=c;ctx.fillRect(sx-24,24,48*s.ct/comboT(),2);}
 const cam=G.mode==='plat'?Math.round(G.cam):0;for(const p of s.pops){p.t-=dt;p.y-=18*dt;if(p.t>0){ctx.globalAlpha=Math.min(1,p.t*2);txt('+'+p.v,p.x-(p.plat?cam:0),p.y-10,'#ffe08a',7);ctx.globalAlpha=1;}}s.pops=s.pops.filter(p=>p.t>0);}
function fmtT(t){t=Math.max(0,Math.round(t));return Math.floor(t/60)+':'+String(t%60).padStart(2,'0');}
// cleared screen with the rank breakdown (replaces the original panel)
drawClear=function(dt){stT+=dt;ctx.fillStyle='rgba(0,0,0,0.55)';ctx.fillRect(0,0,W,H);const L=LV[curLvl]||{t:'space'},r=FT.last||{score:0,best:0,dmg:0,time:0,par:0,rank:'C'};
 panel(20,110,W-40,232,'#9aff5a');
 txt(FT.title||(L.t==='space'?'SECTOR CLEARED':L.t==='hack'?'LOCK CRACKED':L.t==='evade'?'ESCAPED':'AREA SECURED'),W/2,126,'#9aff5a',14);
 const rk=r.rank,sz=stT>0.3?34:34+(0.3-stT)*80;txt(rk,W/2+70,170,RCOL[rk],sz);txt('RANK',W/2+70,206,'#56607e',7);
 const row=(l,v,y,c='#dfe8ff')=>{txt(l,40,y,'#8aa0d0',8,'left');txt(v,150,y,c,8,'right');};
 row('SCORE',r.score,156);row('BEST CHAIN',r.best,170);row('TIME',fmtT(r.time)+' / '+fmtT(r.par),184,r.time<=r.par?'#9aff5a':'#ffa03a');row('HITS TAKEN',r.dmg,198,r.dmg?'#ffa03a':'#9aff5a');
 if(clearInfo){txt('Collected '+clearInfo.got+' CR + '+clearInfo.bonus+' bonus',W/2,230,'#ffd23a',8);txt('Total: '+S.cr+' CR',W/2,244,'#fff',8);}
 const b=S.best&&S.best[curLvl];if(b&&!FT.noSave)txt('Best on this chapter: '+b.r+'  '+b.s,W/2,262,'#8aa0d0',7);
 if(FT.extraClear)FT.extraClear();
 const go=()=>{if(stT<0.8)return;if(FT.afterClear){FT.afterClear();return;}if(L.final){S.ng=1;S.lvl=0;save();state='win';stT=0;}else state='shop';};
 if(stT>0.8&&(T*2|0)%2)txt('TAP TO CONTINUE',W/2,318,'#8aa0d0',8);anyTap=go;defaultAct=go;};
// ================= MENUS =================
let chScroll=0;
function goChapters(){state='chapters';}
HOOKS.push((n,dt)=>{if(n!=='draw:chapters')return;ctx.fillStyle='#060814';ctx.fillRect(0,0,W,H);stars(dt,0.3);txt('CHAPTERS',W/2,14,'#5ab0ff',14);
 const open=Math.max(S.lvl,S.done?LV.length:0);panel(8,36,W-16,392,'#2a3a6a');
 LV.forEach((L,i)=>{const y=44+i*29,ok=i<=Math.min(open,LV.length-1),b=S.best&&S.best[i];
  if(ok){btn('',14,y,W-28,26,()=>goStory(i),'#3a5a9a');txt((i+1)+'. '+L.name,22,y+5,'#dfe8ff',8,'left');txt(L.t==='space'?'FLIGHT':L.t==='hack'?'HACK':L.t==='evade'?'EVADE':'ON FOOT',22,y+15,'#56607e',7,'left');
   if(b){txt(b.r,W-34,y+7,RCOL[b.r],12);txt(String(b.s),W-50,y+10,'#8aa0d0',7,'right');}else txt('-',W-34,y+9,'#3a4466',9);}
  else{ctx.fillStyle='#0a0d1a';ctx.fillRect(14,y,W-28,26);txt((i+1)+'. LOCKED',22,y+9,'#3a4466',8,'left');}});
 btn('BACK',10,440,80,26,()=>{state='title';},'#8aa0d0');defaultAct=()=>{state='title';};});
FT.menu=[];// extra title buttons registered by later features: [label,fn,col,visible()]
drawTitle=function(dt){ctx.fillStyle='#05060f';ctx.fillRect(0,0,W,H);stars(dt,2);
 txt('VOID',W/2,60,'#5ab0ff',34);txt('RUNNER',W/2,98,'#ff6a3a',30);txt('THE LANTERN CHRONICLE',W/2,136,'#8aa0d0',8);
 {const fi=(T*20|0)%4,ty=184+Math.sin(T*2)*4,sh=FT.shipArt?FT.shipArt():ART.ship;blit(ART.flame[fi],W/2-24,ty+26,16,30);blit(ART.flame[(fi+2)%4],W/2+8,ty+26,16,30);draw(sh[2],W/2,ty,4);}
 [[40,'drone'],[90,'weaver'],[180,'gun'],[230,'kami']].forEach(([x,k],i)=>draw(ART.en[k][((T*8)|0)&3],x,248+Math.sin(T*2+i)*5,2));
 const cont=S.lvl>0||S.done;btn(cont?'CONTINUE - CH '+(Math.min(S.lvl,LV.length-1)+1):'START',30,290,210,30,cont?()=>{state='shop';}:newGame,'#9aff5a');
 const items=[['NEW GAME',newGame,'#5ab0ff'],['CHAPTERS',goChapters,'#5ab0ff'],...FT.menu.filter(m=>!m[3]||m[3]()).map(m=>m.slice(0,3))];
 if(!cont)items.shift();items.forEach((m,i)=>btn(m[0],30+(i%2)*107,326+Math.floor(i/2)*30,103,26,m[1],m[2]));
 const ry=326+Math.ceil(items.length/2)*30;btn('SOUND: '+(S.sound?'ON':'OFF'),30,ry,103,22,()=>{S.sound=S.sound?0:1;save();},'#8aa0d0');btn('GFX: '+(RQ===1?'LOW':'HIGH'),137,ry,103,22,()=>{S.q=RQ===1?'hi':'lo';save();location.reload();},'#8aa0d0');
 if(FT.titleExtra)FT.titleExtra(ry+26);
 txt(S.ng?'NEW GAME+ ACTIVE':'',W/2,274,'#ffd23a',7);
 txt(hasTouch?'Best in portrait':'Keys: arrows, Space/Z jump, X fire, Up/Down aim',W/2,468,'#3a4466',7);
 defaultAct=cont?()=>{state='shop';}:newGame;};
function diffK(){return FT.diff?FT.diff():{score:1};}
// test hooks
VR.score=()=>{const s=sc();return s&&{score:s.score,combo:s.combo,best:s.best,dmg:s.dmg,pot:s.pot,kills:s.kills};};
VR.last=()=>FT.last;VR.best=()=>S.best||{};VR.rankOf=r=>rankOf(r);VR.go=s=>{state=s;};
FT.secrets=[];HOOKS.push((n,a)=>{if(n==='secret')FT.secrets.push(a);if(n==='start')FT.secrets=[];});
VR.secrets=()=>FT.secrets;VR.upgr=()=>({sg:S.sg,hull:S.hull,fg:S.fg,armor:S.armor,speed:S.speed,shield:S.shield,jet:S.jet});
// ================= TOASTS =================
FT.toasts=[];function toast(msg,col='#9aff5a',icon){FT.toasts.push({msg,col,icon,t:2.8});}
HOOKS.push((n,a)=>{if(n==='toast')toast(a);else if(n==='overlay'){const q=FT.toasts[0];if(!q)return;q.t-=a||0.016;const k=Math.min(1,q.t*3,(2.8-q.t)*4),y=Math.round(-26+k*56);
 const w=Math.min(W-20,tw(q.msg,7)+28);panel(W/2-w/2,y,w,22,q.col);txt(q.msg,W/2,y+8,q.col,7);if(q.t<=0)FT.toasts.shift();}});
VR.toasts=()=>FT.toasts.map(t=>t.msg);
