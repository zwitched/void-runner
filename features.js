'use strict';
// VOID RUNNER feature layer: scoring/combos/ranks, menus, modes, achievements, daily challenge, difficulty.
// Talks to game.js through emit() hooks and by wrapping a few of its functions.
const FT={};
// ================= 7a. ENGINE FAILURE chapters (inserted into the campaign, old saves remapped) =================
const ENG_LV=[[5,{t:'engine',d:1,name:'ENGINE FAILURE',planet:'#d06a3a',bg:['#0c0612','#2a1018'],story:["OTT: Bad news. The main drive just quit on me.","MARA: Quit how?","OTT: Coughing, smoking, the usual. I can give you short kicks on the lift jets and that's about it.","MARA: And gravity does the rest.","OTT: There's an old repair dock past the freighter wrecks. Tap for a kick, drop through the gaps, and try not to touch anything.","MARA: I never touch anything."]}],
 [9,{t:'engine',d:2,name:'COLD DRIFT',planet:'#7a5ad0',bg:['#04060f','#140a2a'],story:["OTT: The Shear knocked the drive out again. Same cough as last time.","MARA: You said the dock fixed it.","OTT: I said mostly.","FENN: There's a survey station in the strut field ahead. Its dock still answers pings.","MARA: Short kicks, then. Through a field of girders.","OTT: The gaps are smaller out here. Sorry in advance."]}]];
for(const [i,L] of ENG_LV)LV.splice(i,0,L);
// insert chapters for a save version step: positions are final indices after insertion; remaps saves on version ver-1
function insertChapters(ver,list){const n0=LV.length;for(const [i,L] of list)LV.splice(i,0,L);const ins=new Set(list.map(q=>q[0])),map=[];for(let i=0;i<LV.length;i++)if(!ins.has(i))map.push(i);
 FT.remaps=FT.remaps||{};FT.remaps[ver]=map;if((S.v|0)===ver-1){const k=S.lvl|0;S.lvl=k>0?map[k-1]+1:0;if(S.best){const nb={};for(const i in S.best)nb[map[+i]]=S.best[i];S.best=nb;}S.v=ver;save();}}
function remapOld(i){return i<5?i:i<8?i+1:i+2;}// old chapter index -> new index
FT.remap=remapOld;
if((S.v|0)===3){const k=S.lvl|0;S.lvl=k>0?remapOld(k-1)+1:0;if(S.best){const nb={};for(const i in S.best)nb[remapOld(+i)]=S.best[i];S.best=nb;}S.v=4;save();}
// ---- v7 chapters ----
const BOARD_LV={t:'board',d:2,name:'HOLLOW CUTTER',sky:['#0a0614','#2a0a2a'],
 inner:{name:'CUTTER INTERIOR',ceil:1,bgType:3,pal:['#4a2a3e','#22121e','#c0607a'],bg:['#08040a','#2a0a1c']},
 story:["FENN: Something's been on your tail since Oruun. Small, fast, Hollow.","OTT: It's a cutter. They strip wrecks for parts.","MARA: Then it knows where the good wrecks are.","OTT: Shoot out its engines and I can latch on. There'll be a map of the Shear sitting in its core.","MARA: So I go inside a Hollow ship.","OTT: Briefly. Ideally."]};
insertChapters(5,[[7,BOARD_LV]]);
// ================= 1. SCORE, COMBO, RANK =================
const PTS={drone:100,weaver:100,kami:120,gun:300,rock:50,crawler:150,flyer:150,turret:250,brute:3000,boss:5000,chaser:400,coin:50};
const LINEPTS=[0,400,1000,1800,3000];
const PLAYING=s=>s==='space'||s==='plat'||s==='hack'||s==='evade'||s==='engine';
function comboT(){return G&&G.mode==='hack'?14:3;}
function sc(){if(!G)return null;if(!G.sc)G.sc={score:0,combo:0,best:0,ct:0,dmg:0,pot:0,pops:[],kills:0};return G.sc;}
function mult(c){return Math.min(4,1+Math.floor(c/4)*0.5);}
function addPts(base,x,y,plat){const s=sc();s.combo++;s.best=Math.max(s.best,s.combo);s.ct=comboT();const m=mult(s.combo),v=Math.round(base*m*diffK().score);s.score+=v;
 if(x!==undefined&&s.pops.length<24)s.pops.push({x,y,v,t:0.8,plat});emit('score',s);}
function parTime(L){const g=G;if(L.t==='space')return(g.waves&&g.waves.len||40)+75;if(L.t==='plat')return Math.round(g.cols*16/115*1.7+45);if(L.t==='hack')return g.target*10+20;if(L.t==='engine')return Math.round(g.goal/g.v0)+8;if(L.t==='board')return 150+30*L.d;if(L.t==='stealth')return 120;if(L.t==='turret')return Math.round((g.need||70)+40);return 75;}
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
 txt(FT.title||(L.t==='space'?'SECTOR CLEARED':L.t==='hack'?'LOCK CRACKED':L.t==='evade'?'ESCAPED':L.t==='engine'?'DOCKED':L.t==='board'?'CUTTER GUTTED':L.t==='stealth'?'IN AND OUT':L.t==='turret'?'AIRLOCK HELD':'AREA SECURED'),W/2,126,'#9aff5a',14);
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
 const open=Math.max(S.lvl,S.done?LV.length:0);panel(8,34,W-16,402,'#2a3a6a');
 LV.forEach((L,i)=>{const y=40+i*26,ok=i<=Math.min(open,LV.length-1),b=S.best&&S.best[i];
  if(ok){btn('',14,y,W-28,24,()=>goStory(i),'#3a5a9a');txt((i+1)+'. '+L.name,22,y+4,'#dfe8ff',8,'left');txt(L.t==='space'?'FLIGHT':L.t==='hack'?'HACK':L.t==='evade'?'EVADE':L.t==='engine'?'ENGINE':L.t==='board'?'BOARDING':L.t==='stealth'?'STEALTH':L.t==='turret'?'DEFENSE':'ON FOOT',22,y+14,'#56607e',7,'left');
   if(b){txt(b.r,W-34,y+6,RCOL[b.r],12);txt(String(b.s),W-50,y+9,'#8aa0d0',7,'right');}else txt('-',W-34,y+8,'#3a4466',9);}
  else{ctx.fillStyle='#0a0d1a';ctx.fillRect(14,y,W-28,24);txt((i+1)+'. LOCKED',22,y+8,'#3a4466',8,'left');}});
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
// ================= 3. LOADOUTS + SECONDARY WEAPONS =================
const SEC={bomb:{n:'BOMB',d:'Blast that hurts everything on screen and wipes nearby shots.',cd:22,col:'#ffa03a'},emp:{n:'EMP',d:'Wipes every enemy shot and freezes small ships.',cd:18,col:'#5ad0ff'}};
const SECCOST=[150,250,400];
function secCD(){return SEC[S.sec||'bomb'].cd-3*(S.secLv||0);}
FT.shipArt=()=>ART.ships[S.ship|0];
const SECB=[226,432,40,40];
function fireSec(){if(!G||G.mode!=='space'||G.dead||G.endT)return false;if((G.secT||0)>0)return false;const k=S.sec||'bomb',lv=S.secLv||0,p=G.p;G.secT=secCD();G.secUses=(G.secUses||0)+1;emit('secondary',k);
 if(k==='bomb'){const dm=6+3*lv;for(const e of G.en)if(e.y>-10)G.bul.push({x:e.x,y:e.y,vx:0,vy:-1,dm,l:0.1,hits:[],c:'#ffa03a'});if(G.boss){const b=G.boss,a=b.art;G.bul.push({x:b.x+(a.cx/2-a.W/4),y:b.y+(a.cy/2-a.H/4),vx:0,vy:-1,dm:10+5*lv,l:0.1,hits:[],c:'#ffa03a'});}
  G.eb=G.eb.filter(u=>Math.hypot(u.x-p.x,u.y-p.y)>150);boom(p.x,p.y-60,40,FIRE);G.fx.push({x:p.x,y:p.y,ring:1,l:0.4,R:400});G.shake=0.5;SFX.big();}
 else{const n=G.eb.length;G.eb=[];for(const e of G.en)e.stun=2.5+lv*0.8;G.fx.push({x:p.x,y:p.y,ring:1,l:0.4,R:600});for(let i=0;i<30;i++){const a=i/30*7;G.fx.push({x:p.x,y:p.y,vx:Math.cos(a)*260,vy:Math.sin(a)*260,l:.5,c:'#9ae8ff'});}tone(200,1600,.3,'sawtooth',.06);noise(.3,.12,4000);G.empCleared=(G.empCleared||0)+n;}
 return true;}
{const _pd=ptrDown;ptrDown=function(id,e){_pd(id,e);const q=ptrs[id];if(q&&state==='space'&&q.x>=SECB[0]-6&&q.y>=SECB[1]-6&&q.x<=SECB[0]+SECB[2]+4){q.nodrag=1;fireSec();}};}
{const _ok=onKey;onKey=function(c){if(state==='space'&&(c==='KeyB'||c==='KeyC'||c==='KeyV')){fireSec();return;}_ok(c);};}
HOOKS.push((n,dt)=>{if(n!=='overlay'||state!=='space'||!G)return;G.secT=Math.max(0,(G.secT||0)-dt);const k=S.sec||'bomb',c=SEC[k].col,rd=G.secT<=0,b=SECB;
 blit(uiArt(b[2],b[3],c,'btn',0),b[0],b[1],b[2],b[3]);txt(SEC[k].n,b[0]+b[2]/2,b[1]+11,rd?c:'#4a5a7a',7);txt(hasTouch?'TAP':'B',b[0]+b[2]/2,b[1]+23,'#56607e',7);
 if(!rd){ctx.fillStyle='#16203e';ctx.fillRect(b[0]+5,b[1]+b[3]-7,b[2]-10,3);ctx.fillStyle=c;ctx.fillRect(b[0]+5,b[1]+b[3]-7,(b[2]-10)*(1-G.secT/secCD()),3);}else if((T*3|0)%2){ctx.strokeStyle=c;ctx.strokeRect(b[0]-1.5,b[1]-1.5,b[2]+3,b[3]+3);}});
HOOKS.push((n)=>{if(n==='start'&&G&&G.mode==='space')G.secT=4;});
// hangar: loadout screen
{const _ds=drawShop;drawShop=function(dt){_ds(dt);const ys=BTN.find(b=>b.w===80&&b.h===22);const y=ys?ys.y:420;btn('LOADOUT: '+loadout().n,96,y,164,22,()=>{state='loadout';},'#ffa03a');};}
HOOKS.push((n,dt)=>{if(n!=='draw:loadout')return;ctx.fillStyle='#060814';ctx.fillRect(0,0,W,H);ctx.fillStyle='#0c1228';for(let y=0;y<H;y+=8)ctx.fillRect(0,y,W,1);
 txt('LOADOUT',W/2,12,'#ffa03a',16);txt('CREDITS: '+S.cr,W/2,34,'#ffd23a',9);
 LOADOUTS.forEach((L,i)=>{const y=50+i*86,sel=(S.ship|0)===i;panel(8,y,W-16,80,sel?'#9aff5a':'#2a3a6a');const fi=(T*20|0)%4;blit(ART.flame[fi],34-12,y+46,8,15);blit(ART.flame[(fi+2)%4],34+4,y+46,8,15);draw(ART.ships[i][2],34,y+34,2);
  txt(L.n,64,y+8,sel?'#9aff5a':'#dfe8ff',10,'left');wrap(L.d,W-150,7).forEach((ln,j)=>txt(ln,64,y+22+j*10,'#8aa0d0',7,'left'));
  const st=[['SPD',L.spd],['HULL',1+L.hull/4],['FIRE',1/L.rate],['DMG',L.dm/1.5]];st.forEach(([k,v],j)=>{txt(k,64+j*40,y+50,'#56607e',7,'left');ctx.fillStyle='#1a2040';ctx.fillRect(64+j*40,y+60,34,3);ctx.fillStyle=sel?'#9aff5a':'#5ab0ff';ctx.fillRect(64+j*40,y+60,Math.min(34,34*v*0.7),3);});
  if(!sel)btn('SELECT',W-82,y+8,64,22,()=>{S.ship=i;save();SFX.buy();},'#5ab0ff');else txt('IN USE',W-50,y+14,'#9aff5a',8);});
 const y=312;panel(8,y,W-16,104,'#ffa03a');txt('SECONDARY',18,y+8,'#ffa03a',9,'left');
 ['bomb','emp'].forEach((k,i)=>{const sel=(S.sec||'bomb')===k;btn(SEC[k].n,18+i*80,y+22,74,24,()=>{S.sec=k;save();SFX.buy();},sel?'#9aff5a':'#5ab0ff');});
 wrap(SEC[S.sec||'bomb'].d,W-40,7).forEach((ln,j)=>txt(ln,18,y+54+j*10,'#8aa0d0',7,'left'));
 const lv=S.secLv||0;txt('LEVEL',180,y+28,'#56607e',7,'left');for(let i=0;i<3;i++){ctx.fillStyle=i<lv?'#9aff5a':'#262c44';ctx.fillRect(212+i*9,y+28,7,7);}
 txt('Recharge '+secCD()+'s',18,y+78,'#56607e',7,'left');const c=SECCOST[lv];btn(lv>=3?'MAX':'UPGRADE '+c+' CR',150,y+72,104,24,()=>{if(lv<3&&S.cr>=c){S.cr-=c;S.secLv=lv+1;save();SFX.buy();}},'#ffd23a',lv>=3||S.cr<c);
 btn('BACK',10,440,80,26,()=>{state='shop';},'#8aa0d0');defaultAct=()=>{state='shop';};});
VR.loadout=()=>({ship:S.ship|0,sec:S.sec||'bomb',lv:S.secLv||0,cd:G&&G.secT,mh:G&&G.p&&G.p.mhp});VR.fireSec=()=>fireSec();
VR.setS=o=>{Object.assign(S,o);save();};
// ================= 4. BOSS RUSH + ENDLESS (unlocked after the campaign) =================
const SPACE_LV=LV.map((L,i)=>L.t==='space'?i:-1).filter(i=>i>=0);
function today(){const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
function hsAdd(k,s,extra){S.hs=S.hs||{};const t=S.hs[k]=S.hs[k]||[];t.push(Object.assign({s,d:today()},extra||{}));t.sort((a,b)=>b.s-a.s);t.length=Math.min(t.length,5);save();return t.findIndex(e=>e.s===s);}
function clearRun(){FT.run=null;FT.noSave=false;FT.afterClear=null;FT.title=null;}
{const _gs=goStory;goStory=function(i){clearRun();_gs(i);};const _ng=newGame;newGame=function(){clearRun();_ng();};}
function rushStage(){const R=FT.run,i=SPACE_LV[R.i];const keepLvl=S.lvl;startLevel(i);S.lvl=keepLvl;G.waves.list=[];G.t=G.waves.len+1;G.en=[];if(R.i>0){G.p.hp=Math.min(G.p.mhp,R.hp+1);}FT.title='BOSS '+(R.i+1)+' OF '+SPACE_LV.length+' DOWN';}
function startRush(){clearRun();FT.run={mode:'rush',i:0,score:0,t0:T};FT.noSave=true;FT.afterClear=()=>{const R=FT.run;R.score+=FT.last?FT.last.score:0;R.hp=G.p.hp;R.i++;if(R.i>=SPACE_LV.length){R.done=1;R.rank=hsAdd('rush',R.score,{t:Math.round(T-R.t0)});emit('rushdone',R);state='runover';stT=0;}else rushStage();};rushStage();emit('modestart','rush');}
function startEndless(){clearRun();FT.run={mode:'endless',cyc:0,t0:T};FT.noSave=true;const keep=S.lvl;startLevel(0);S.lvl=keepLvl0(keep);G.endless=1;emit('modestart','endless');}
function keepLvl0(k){return k;}
{const _sb=spawnBoss;spawnBoss=function(){if(G&&G.endless){const R=FT.run;R.cyc++;if(R.cyc%3===0){const d=Math.min(4,1+Math.floor(R.cyc/3));G.L=LV[SPACE_LV[d-1]];_sb();return;}endlessWaves();return;}_sb();};}
function endlessWaves(){const R=FT.run,d=Math.min(5,1+Math.floor(R.cyc/2));G.d=d+Math.floor(R.cyc/6);G.waves=makeWaves({d:Math.min(4,d),final:0});G.t=0;G.cycle=R.cyc;toast('Wave '+(R.cyc+1)+' incoming','#ffa03a');}
{const _lc=levelClear;levelClear=function(){if(G&&G.endless){G.boss=null;G.endT=0;emit('kill',{x:W/2,y:80,k:'boss'});endlessWaves();state='space';return;}_lc();};}
{const _fl=failLevel;failLevel=function(){if(FT.run){const R=FT.run,s=(R.score||0)+(sc()?sc().score:0);R.final=s;R.rank=R.mode==='daily'?-1:hsAdd(R.mode,s,{t:Math.round(T-R.t0),w:R.cyc||R.i});emit('runover',R);state='runover';stT=0;return;}_fl();};}
HOOKS.push((n,dt)=>{if(n!=='draw:runover')return;stT+=dt;if(G)drawMode(0);BTN=[];ctx.fillStyle='rgba(0,0,10,0.72)';ctx.fillRect(0,0,W,H);const R=FT.run||{};const s=R.final!==undefined?R.final:R.score;
 panel(20,100,W-40,300,'#ffa03a');txt(R.mode==='rush'?(R.done?'RUSH COMPLETE':'RUSH OVER'):R.mode==='daily'?'DAILY RUN OVER':'RUN OVER',W/2,116,'#ffa03a',14);txt('SCORE '+s,W/2,140,'#fff',10);
 if(R.rank>=0)txt(R.rank===0?'New best!':'Rank '+(R.rank+1)+' on this table',W/2,156,'#9aff5a',8);hsTable(R.mode==='daily'?'daily:'+today():R.mode,40,176);
 btn('AGAIN',40,334,90,26,()=>{R.mode==='rush'?startRush():R.mode==='daily'?FT.startDaily():startEndless();},'#9aff5a');btn('MODES',140,334,90,26,()=>{clearRun();state='modes';},'#5ab0ff');defaultAct=()=>{clearRun();state='modes';};});
function hsTable(k,x,y){const t=(S.hs&&S.hs[k])||[];txt('LOCAL BEST',x,y,'#8aa0d0',7,'left');for(let i=0;i<5;i++){const e=t[i];txt((i+1)+'.',x,y+14+i*11,'#56607e',7,'left');txt(e?String(e.s):'---',x+70,y+14+i*11,e?'#dfe8ff':'#3a4466',7,'right');if(e)txt(e.d,x+150,y+14+i*11,'#56607e',7,'right');if(e&&e.w!==undefined)txt((k==='rush'?'B':'W')+e.w,x+186,y+14+i*11,'#56607e',7,'right');}}
FT.unlocked=()=>!!S.done||!!S.dbg;
FT.menu.push(['MODES',()=>{state='modes';},'#ffa03a']);
HOOKS.push((n,dt)=>{if(n!=='draw:modes')return;ctx.fillStyle='#060814';ctx.fillRect(0,0,W,H);stars(dt,1);txt('EXTRA MODES',W/2,14,'#ffa03a',14);const ok=FT.unlocked();
 const card=(y,title,desc,k,go,open)=>{panel(8,y,W-16,122,open?'#ffa03a':'#2a3a6a');txt(title,18,y+8,open?'#ffa03a':'#56607e',10,'left');wrap(desc,W-110,7).forEach((l,j)=>txt(l,18,y+22+j*9,'#8aa0d0',7,'left'));hsTable(k,18,y+50);if(open)btn('PLAY',W-80,y+6,64,22,go,'#9aff5a');else txt('LOCKED',W-48,y+13,'#56607e',8);};
 card(34,'BOSS RUSH','Every space boss back to back. A little hull comes back between fights.','rush',startRush,ok);
 card(160,'ENDLESS','Waves keep coming and keep getting meaner. A boss shows up every third wave.','endless',startEndless,ok);
 if(FT.modesExtra)FT.modesExtra();
 if(!ok)txt('Rush and Endless open up once the campaign is done.',W/2,420,'#ffd23a',7);
 btn('BACK',10,440,80,26,()=>{state='title';},'#8aa0d0');defaultAct=()=>{state='title';};});
VR.unlock=()=>{S.dbg=1;save();};VR.rush=()=>startRush();VR.endless=()=>startEndless();VR.run=()=>FT.run&&Object.assign({},FT.run);VR.hs=()=>S.hs||{};
window.FT=FT;
// ================= 5. HACK + MAZE VARIETY =================
// Hack: the Hollow fights back by shoving garbage rows in from the bottom, and some fragments carry a
// special cell. Clear a row with a FREEZE cell to stop the trace for a while, or a COLUMN cell to wipe its column.
HCOL.G='#5a6078';
const GB_GAP=d=>Math.max(9,16-2*d);
function hGarbage(H,hole){if(!H||H.mode!=='hack'||H.dead||H.won)return false;
 for(let x=0;x<HW;x++)if(H.b[x]){hfail(H,'STACK OVERFLOW');return false;}
 if(hole===undefined)hole=Math.floor(Math.random()*HW);
 H.b=H.b.slice(HW).concat(Array.from({length:HW},(_,x)=>x===hole?0:'G'));
 const sp={};for(const i in H.spc){const j=+i-HW;if(j>=0)sp[j]=H.spc[i];}H.spc=sp;
 const p=H.p;if(p){let n=0;while(!hfits(H,p.k,p.r,p.x,p.y)&&n++<3)p.y--;}
 H.shake=0.2;H.gbN=(H.gbN||0)+1;tone(110,70,.18,'sawtooth',.05);noise(.12,.08,900);emit('garbage',hole);return true;}
{const _hs=hspawn;hspawn=function(H,k){_hs(H,k);if(H.p&&!H.dead){H.spawnN=(H.spawnN||0)+1;if(H.spawnN%6===0&&!H.noSpecial)H.p.sp={i:Math.floor(Math.random()*4),k:H.spawnN%12===0?'X':'F'};}};}
{const _hl=hlock;hlock=function(H){const p=H.p;if(p&&p.sp){const c=hcells(p)[p.sp.i];if(c&&c[1]>=0){H.spc=H.spc||{};H.spc[c[1]*HW+c[0]]=p.sp.k;}}_hl(H);};}
{const _hf=hfinishClear;hfinishClear=function(H){const rows=H.clearing.rows.slice(),sp=H.spc||{},cols=[];let fr=0;
 for(const i in sp){const y=Math.floor(i/HW);if(rows.includes(y)){if(sp[i]==='F')fr++;else cols.push(i%HW);delete sp[i];}}
 const moved={};for(const i in sp){const y=Math.floor(i/HW),x=i%HW,dn=rows.filter(r=>r>y).length;moved[(y+dn)*HW+x]=sp[i];}H.spc=moved;
 _hf(H);
 if(fr){H.freeze=(H.freeze||0)+6*fr;toast('TRACE FROZEN','#5ad0ff');tone(1200,300,.3,'triangle',.06);emit('special','F');}
 for(const x of cols){let n=0;for(let y=0;y<HH;y++){if(H.b[y*HW+x]){n++;for(let i=0;i<3;i++)H.fx.push({x:HX+x*HC+6,y:HY+y*HC+6,vx:rnd(-30,30),vy:rnd(-90,-20),l:.5,c:'#ffd23a',s:2});}H.b[y*HW+x]=0;delete H.spc[y*HW+x];}runCr+=n;toast('COLUMN WIPED','#ffd23a');noise(.2,.1,3000);emit('special','X');}};}
{const _uh=updHack;updHack=function(dt){const H=G;if(H.freeze>0&&!H.dead&&!H.won){H.freeze=Math.max(0,H.freeze-dt);H.trace+=dt;}
 if(H.gbT===undefined)H.gbT=GB_GAP(H.d)+6;
 if(!H.dead&&!H.won&&!H.clearing&&H.p&&!H.noGarbage){H.gbT-=dt;if(H.gbT<=0){H.gbT=GB_GAP(H.d);hGarbage(H);}}
 _uh(dt);};}
function spIcon(k,x,y){if(k==='F'){ctx.fillStyle='#e8fbff';ctx.fillRect(x+5,y+2,2,8);ctx.fillRect(x+2,y+5,8,2);ctx.fillStyle='#5ad0ff';ctx.fillRect(x+3,y+3,2,2);ctx.fillRect(x+7,y+7,2,2);ctx.fillRect(x+7,y+3,2,2);ctx.fillRect(x+3,y+7,2,2);}
 else{ctx.fillStyle='#ffd23a';ctx.fillRect(x+5,y+1,2,10);ctx.fillRect(x+3,y+2,6,2);ctx.fillRect(x+3,y+8,6,2);ctx.fillStyle='#fff6c0';ctx.fillRect(x+5,y+5,2,2);}}
HOOKS.push((n,dt)=>{if(n!=='overlay'||state!=='hack'||!G||G.mode!=='hack')return;const H=G,pul=(H.t*4|0)%2;
 for(const i in (H.spc||{})){const x=i%HW,y=Math.floor(i/HW);if(H.clearing&&H.clearing.rows.includes(y))continue;spIcon(H.spc[i],HX+x*HC,HY+y*HC);}
 if(H.p&&H.p.sp){const c=hcells(H.p)[H.p.sp.i];if(c&&c[1]>=0){spIcon(H.p.sp.k,HX+c[0]*HC,HY+c[1]*HC);if(pul){ctx.strokeStyle='#fff';ctx.strokeRect(HX+c[0]*HC+.5,HY+c[1]*HC+.5,HC-1,HC-1);}}}
 const RX=HX+HW*HC+14,RW=W-RX-6,gt=Math.max(0,H.gbT||0),warn=gt<3;
 txt('HOLLOW',RX+8,HY+224,warn&&pul?'#ffffff':'#c05aff',7,'left');txt(Math.ceil(gt)+'s',RX+RW-8,HY+224,'#c05aff',7,'right');bar(RX+8,HY+233,RW-16,3,1-gt/GB_GAP(H.d),'#c05aff','#1a0a2a');
 if(warn&&!H.dead&&!H.won){ctx.fillStyle=pul?'rgba(192,90,255,0.35)':'rgba(192,90,255,0.15)';ctx.fillRect(HX,HY+HH*HC-3,HW*HC,3);}
 if(H.freeze>0)txt('FROZEN '+H.freeze.toFixed(1),RX+RW-8,HY+196,'#5ad0ff',7,'right');});
// Maze: keycards must be picked up before the door will open, and some floor tiles give way once you've walked over them.
const KEYCOL=['#ffd23a','#5ad0ff','#ff5ae0'];
function mazeOK(H,tx,ty,extraWall){const save=H.g[extraWall];H.g[extraWall]=1;const d=ebfs(H,tx,ty,true);H.g[extraWall]=save;
 if(d[EDOOR[1]*EW+EDOOR[0]]<0)return false;for(const k of H.kc)if(!k.got&&d[k.y*EW+k.x]<0)return false;
 for(const e of H.en){if(e.tx+e.ty*EW===extraWall||e.nx+e.ny*EW===extraWall)return false;if(d[e.ty*EW+e.tx]<0)return false;}return true;}
{const _ie=initEvade;initEvade=function(L){_ie(L);const H=G,r=rng(4242+L.d*13),dist=ebfs(H,ESTART[0],ESTART[1],false),nk=Math.min(3,1+H.d);H.kc=[];H.cr={};
 const far=[];for(let y=1;y<EH-1;y++)for(let x=1;x<EW-1;x++)if(!H.g[y*EW+x]&&dist[y*EW+x]>=6)far.push([x,y]);
 for(let i=0;i<nk&&far.length;i++){let bi=0,bs=-1;for(let j=0;j<far.length;j++){const [x,y]=far[j];let m=99;for(const k of H.kc)m=Math.min(m,Math.abs(k.x-x)+Math.abs(k.y-y));const s=(H.kc.length?m:dist[y*EW+x])+r()*3;if(s>bs){bs=s;bi=j;}}
  const [x,y]=far.splice(bi,1)[0];H.kc.push({x,y,i});H.items=H.items.filter(it=>it.x!==x||it.y!==y);}
 const cand=[];for(let y=1;y<EH-1;y++)for(let x=1;x<EW-1;x++){if(H.g[y*EW+x]||dist[y*EW+x]<3)continue;if(H.kc.some(k=>k.x===x&&k.y===y))continue;if(Math.abs(x-EDOOR[0])+Math.abs(y-EDOOR[1])<3)continue;if(H.en.some(e=>e.hx===x&&e.hy===y))continue;cand.push(y*EW+x);}
 const nc=4+2*H.d;for(let i=0;i<nc&&cand.length;i++){const idx=cand.splice(Math.floor(r()*cand.length),1)[0];H.cr[idx]={s:0,t:0};}};}
{const _ue=updEvade;updEvade=function(dt){const H=G,p=H.p;if(H.kc&&!H.dead&&!H.won){const [tx,ty]=etile(p);
  for(const k of H.kc)if(!k.got&&k.x===tx&&k.y===ty){k.got=1;H.keysGot=(H.keysGot||0)+1;[660,990,1320].forEach((f,i)=>tone(f,f,.07,'square',.05,i*.05));const left=H.kc.filter(q=>!q.got).length;toast(left?'KEYCARD ('+(H.kc.length-left)+'/'+H.kc.length+')':'ALL KEYCARDS','#ffd23a');emit('keycard',left);}
  const need=H.kc.some(k=>!k.got);if(need&&!H.unlocked&&H.lockT-dt<=0)H.lockT=dt+0.0001;
  const here=ty*EW+tx;for(const i in H.cr){const c=H.cr[i];
   if(c.s===0&&+i===here)c.s=1;else if(c.s===1&&+i!==here){c.s=2;c.t=1.1;tone(180,120,.06,'square',.03);}
   else if(c.s===2){c.t-=dt;if(c.t<=0){const busy=+i===here||(p.moving&&p.ny*EW+p.nx===+i);if(!busy&&mazeOK(H,tx,ty,+i)){H.g[+i]=1;c.s=3;H.shake=0.12;noise(.15,.08,600);emit('collapse',+i);}else if(!busy&&!mazeOK(H,tx,ty,+i)){c.s=4;}else c.t=0.2;}}}}
 _ue(dt);};}
HOOKS.push((n,dt)=>{if(n!=='overlay'||state!=='evade'||!G||G.mode!=='evade'||!G.kc)return;const H=G;
 for(const i in H.cr){const c=H.cr[i],x=EOX+(i%EW)*ETS,y=EOY+Math.floor(i/EW)*ETS;
  if(c.s===3){ctx.fillStyle='#000';ctx.fillRect(x,y,ETS,ETS);ctx.fillStyle='#1a1d30';ctx.fillRect(x,y,ETS,2);ctx.fillRect(x,y,2,ETS);ctx.fillStyle='#06060c';ctx.fillRect(x+3,y+3,ETS-6,ETS-6);continue;}
  const sh=c.s===2&&(H.t*20|0)%2?1:0;ctx.fillStyle=c.s>=2?'#4a3a5a':'#262a44';ctx.fillRect(x+3+sh,y+4,4,1);ctx.fillRect(x+6+sh,y+5,1,4);ctx.fillRect(x+7+sh,y+9,5,1);ctx.fillRect(x+11+sh,y+3,1,4);ctx.fillRect(x+3,y+11,3,1);
  if(c.s===2){ctx.fillStyle='rgba(255,60,90,'+(0.25+0.2*Math.sin(H.t*30))+')';ctx.fillRect(x+1,y+1,ETS-2,ETS-2);}}
 for(const k of H.kc){if(k.got)continue;const x=EOX+k.x*ETS+3,y=EOY+k.y*ETS+4+Math.round(Math.sin(H.t*3+k.i));glow(x+5,y+4,6,KEYCOL[k.i],0.25);ctx.fillStyle='#0a0c18';ctx.fillRect(x-1,y-1,12,10);ctx.fillStyle=KEYCOL[k.i];ctx.fillRect(x,y,10,8);ctx.fillStyle='#0a0c18';ctx.fillRect(x+1,y+2,4,3);ctx.fillStyle='#fff';ctx.fillRect(x+6,y+1,3,1);ctx.fillRect(x+6,y+5,3,1);}
 const left=H.kc.filter(k=>!k.got).length;
 txt('KEYCARDS',EOX,EOY+EH*ETS+2,left?'#ffd23a':'#9aff5a',7,'left');H.kc.forEach((k,j)=>{ctx.fillStyle=k.got?KEYCOL[k.i]:'#262a44';ctx.fillRect(EOX+60+j*14,EOY+EH*ETS+3,10,7);});
 if(left&&!H.unlocked&&H.lockT<0.01)txt('FIND THE KEYCARDS',EOX+EW*ETS,EOY+EH*ETS+2,(H.t*3|0)%2?'#ffd23a':'#ff9ab0',7,'right');});
VR.s5={garbage:h=>hGarbage(G,h),H:()=>G,spc:()=>Object.assign({},G.spc||{}),setSp:(i,k)=>{G.p.sp={i,k};},noGarbage:v=>{G.noGarbage=v;},
 kc:()=>G.kc&&G.kc.map(k=>({x:k.x,y:k.y,got:!!k.got})),cr:()=>JSON.parse(JSON.stringify(G.cr||{})),wall:i=>G.g[i],mazeOK:i=>{const [tx,ty]=etile(G.p);return mazeOK(G,tx,ty,i);}};
// ================= 6a. DIFFICULTY =================
const DIFF=[{n:'EASY',dmg:0.5,hp:0.75,spd:0.85,time:1.3,score:0.75,col:'#9aff5a'},{n:'NORMAL',dmg:1,hp:1,spd:1,time:1,score:1,col:'#5ab0ff'},{n:'HARD',dmg:2,hp:1.35,spd:1.15,time:0.8,score:1.5,col:'#ff5a5a'}];
function diffIdx(){if(FT.run&&FT.run.mode==='daily')return 1;return S.diff===undefined?1:S.diff;}
FT.diff=()=>DIFF[diffIdx()];
{const _h=hurt;hurt=function(){if(!G||!G.p){_h();return;}const p=G.p,h0=p.hp;_h();if(p.hp<h0){const k=FT.diff();
  if(k.dmg>1&&p.hp>0){p.hp-=1;if(p.hp<=0){G.dead=1.4;if(G.mode==='space')boom(p.x,p.y,40,FIRE);SFX.big();}}
  else if(k.dmg<1){G.ezHit=(G.ezHit||0)+1;if(G.ezHit%2===0&&p.hp>0)p.hp+=1;}}};}
HOOKS.push((n,a)=>{const k=FT.diff();if(n==='spawn'&&a&&a.hp){a.hp=Math.max(1,Math.round(a.hp*k.hp));}
 else if(n==='start'&&G){if(G.mode==='plat')for(const e of G.ens)e.hp=Math.max(1,Math.round(e.hp*k.hp));
  if(G.mode==='hack'){G.trace=Math.round(G.trace*k.time);G.traceMax=G.trace;}
  if(G.mode==='evade'){G.lockT=Math.round(G.lockT/k.time);G.lockMax=G.lockT;}G.diffN=DIFF.indexOf(k);}
 else if(n==='overlay'&&G&&G.eb&&(state==='space'||state==='plat')&&k.spd!==1)for(const b of G.eb)if(!b._ds){b._ds=1;if(b.vx!==undefined){b.vx*=k.spd;b.vy*=k.spd;}}});
{const _sb=spawnBoss;spawnBoss=function(){_sb();if(G.boss&&!G.boss._ds){const k=FT.diff();G.boss._ds=1;G.boss.hp=Math.round(G.boss.hp*k.hp);G.boss.mhp=G.boss.hp;}};}
{const _hg=hgrav;hgrav=function(H){return _hg(H)/FT.diff().spd;};}
{const _em=emove;emove=function(H,m,dt,spd,ch){_em(H,m,dt,m===H.p?spd:spd*FT.diff().spd,ch);};}
FT.titleExtra=y=>{const d=FT.diff();btn('DIFFICULTY: '+d.n,30,y,210,22,()=>{S.diff=(diffIdx()+1)%3;save();SFX.buy();},d.col);};
// ================= 6b. DAILY CHALLENGE =================
const RAND0=Math.random;
function dateHash(s){let h=2166136261;for(const c of s){h^=c.charCodeAt(0);h=Math.imul(h,16777619)>>>0;}return h;}
function dailyLv(d){const pool=LV.map((L,i)=>L.final?-1:i).filter(i=>i>=0);return pool[dateHash(d||today())%pool.length];}
{const _cr=clearRun;clearRun=function(){Math.random=RAND0;_cr();};}
FT.startDaily=function(){clearRun();const d=today(),lv=dailyLv(d);FT.run={mode:'daily',key:'daily:'+d,lv,t0:T,date:d};FT.noSave=true;Math.random=rng(dateHash(d)^0x5eed);
 FT.title='DAILY DONE';FT.afterClear=()=>{const R=FT.run;R.score=FT.last?FT.last.score:0;R.final=R.score;R.done=1;R.rank=hsAdd(R.key,R.score,{t:Math.round(T-R.t0),r:FT.last&&FT.last.rank});Math.random=RAND0;emit('dailydone',R);state='runover';stT=0;};
 const keep=S.lvl;startLevel(lv);S.lvl=keep;emit('modestart','daily');};
FT.modesExtra=()=>{const d=today(),L=LV[dailyLv(d)],y=286;panel(8,y,W-16,122,'#9aff5a');txt('DAILY CHALLENGE',18,y+8,'#9aff5a',10,'left');
 wrap('New chapter every day, always on Normal. Today: '+L.name+'.',W-110,7).forEach((l,j)=>txt(l,18,y+22+j*9,'#8aa0d0',7,'left'));hsTable("daily:"+d,18,y+50);btn('PLAY',W-80,y+6,64,22,FT.startDaily,'#9aff5a');};
FT.menu.push(['DAILY',()=>FT.startDaily(),'#9aff5a']);
// ================= 6c. ACHIEVEMENTS =================
const ACH=[
 ['first','FIRST CONTACT','Destroy your first enemy.'],['chain10','ON A ROLL','Build a 10 chain.'],['chain25','UNSTOPPABLE','Build a 25 chain.'],
 ['rankS','TOP MARKS','Get an S rank on any chapter.'],['rankA5','STEADY HANDS','Get A or better on five chapters.'],['clean','UNTOUCHED','Clear a chapter without getting hit.'],
 ['quad','FOUR AT ONCE','Burn four rows in one go.'],['freeze','COLD TRACE','Freeze the trace with a special cell.'],['column','STRAIGHT DOWN','Wipe a column with a special cell.'],
 ['keys','KEY HOLDER','Pick up every keycard in a maze.'],['dash','QUICK FEET','Dash 20 times.'],['wall','WALL RUNNER','Wall jump 10 times.'],
 ['secret','NOSY','Find a hidden room.'],['sec10','BIG RED BUTTON','Use your secondary 10 times.'],['ships','TEST PILOT','Clear a chapter with each ship.'],
 ['done','LANTERN LIT','Finish the campaign.'],['rush','GAUNTLET','Finish a boss rush.'],['wave5','STILL HERE','Reach wave 5 in endless.'],
 ['daily','DAILY DRIVER','Finish a daily challenge.'],['hard','HARD WAY','Clear a chapter on Hard.'],['rich','SAVINGS','Have 2000 credits at once.'],['upg','FULLY KITTED','Max out your secondary.']];
function unlockA(id){S.ach=S.ach||{};if(S.ach[id])return false;S.ach[id]=Date.now();save();const a=ACH.find(q=>q[0]===id);toast('UNLOCKED: '+(a?a[1]:id),'#ffd23a');tone(784,784,.08,'square',.05);tone(1175,1175,.12,'square',.05,.08);return true;}
function stat(k,n=1){S.st=S.st||{};S.st[k]=(S.st[k]||0)+n;return S.st[k];}
HOOKS.push((n,a)=>{switch(n){
 case 'kill':unlockA('first');break;
 case 'score':if(a.combo>=10)unlockA('chain10');if(a.combo>=25)unlockA('chain25');break;
 case 'lines':if(a>=4)unlockA('quad');break;
 case 'special':unlockA(a==='F'?'freeze':'column');break;
 case 'keycard':if(a===0)unlockA('keys');break;
 case 'dash':if(stat('dash')>=20)unlockA('dash');break;
 case 'walljump':if(stat('wj')>=10)unlockA('wall');break;
 case 'secret':unlockA('secret');break;
 case 'secondary':if(stat('sec')>=10)unlockA('sec10');break;
 case 'rushdone':unlockA('rush');break;
 case 'dailydone':unlockA('daily');break;
 case 'clear':{const r=FT.last;if(!r)break;if(r.rank==='S')unlockA('rankS');if(r.dmg===0)unlockA('clean');if(diffIdx()===2&&!(FT.run&&FT.run.mode==='daily'))unlockA('hard');
  S.shipsUsed=(S.shipsUsed||0)|(1<<(S.ship|0));if(S.shipsUsed===7)unlockA('ships');
  const nA=Object.values(S.best||{}).filter(b=>b.r==='S'||b.r==='A').length;if(nA>=5)unlockA('rankA5');if(S.done)unlockA('done');break;}
 case 'overlay':if(S.cr>=2000)unlockA('rich');if((S.secLv||0)>=3)unlockA('upg');if(FT.run&&FT.run.mode==='endless'&&FT.run.cyc>=4)unlockA('wave5');break;}});
let achPage=0;FT.menu.push(['AWARDS',()=>{achPage=0;state='achievements';},'#ffd23a']);
HOOKS.push((n,dt)=>{if(n!=='draw:achievements')return;ctx.fillStyle='#060814';ctx.fillRect(0,0,W,H);stars(dt,0.3);const got=S.ach||{},nGot=ACH.filter(a=>got[a[0]]).length;
 txt('AWARDS',W/2,12,'#ffd23a',14);txt(nGot+' / '+ACH.length+' UNLOCKED',W/2,32,'#8aa0d0',7);const per=11,pages=Math.ceil(ACH.length/per);
 ACH.slice(achPage*per,achPage*per+per).forEach((a,i)=>{const y=44+i*34,ok=!!got[a[0]];panel(8,y,W-16,30,ok?'#ffd23a':'#2a3a6a');
  ctx.fillStyle=ok?'#ffd23a':'#1a2040';ctx.fillRect(16,y+8,14,14);ctx.fillStyle=ok?'#fff6c0':'#2a3458';ctx.fillRect(19,y+11,8,8);if(ok){ctx.fillStyle='#8a5a10';ctx.fillRect(21,y+13,4,4);}
  txt(a[1],38,y+6,ok?'#ffd23a':'#8aa0d0',8,'left');txt(a[2],38,y+18,ok?'#dfe8ff':'#56607e',7,'left');});
 if(pages>1){btn('<',W-130,440,40,26,()=>{achPage=(achPage+pages-1)%pages;},'#5ab0ff');txt((achPage+1)+'/'+pages,W-70,449,'#8aa0d0',8);btn('>',W-50,440,40,26,()=>{achPage=(achPage+1)%pages;},'#5ab0ff');}
 btn('BACK',10,440,80,26,()=>{state='title';},'#8aa0d0');defaultAct=()=>{state='title';};});
VR.ach=()=>Object.assign({},S.ach||{});VR.ACH=()=>ACH.map(a=>a[0]);VR.unlockA=id=>unlockA(id);VR.diff=()=>FT.diff();VR.daily=()=>FT.startDaily();VR.dailyLv=d=>dailyLv(d);VR.today=()=>today();
// ================= 7b. ENGINE FAILURE mode =================
// Side view. The drive is dead, so gravity pulls you down and each tap fires a short lift-jet kick.
// Thread the gaps in struts, wreckage and debris until you reach the repair dock.
const EN={top:34,bot:420,sx:80,r:5,grav:600,kick:-210,vmax:360,gw:26,space:160};
function engCourse(seed,d,goal,v0){const r=rng(seed),gates=[],coins=[];let x=W+60,prev=(EN.top+EN.bot)/2;
 while(x<goal-200){const prog=x/goal,gap=Math.max(92,128-10*(d-1)-14*prog),kind=['strut','wreck','debris'][Math.floor(r()*3)],amp=d>=2&&kind==='debris'?12:0,lo=Math.max(EN.top+gap/2+16+amp,prev-90),hi=Math.min(EN.bot-gap/2-16-amp,prev+120);
  const cy=lo+r()*(hi-lo);
  gates.push({x,cy,gap,kind,amp,ph:r()*6,seed:Math.floor(r()*1e6)});
  if(r()<0.55)coins.push({x:x+EN.gw/2,y:cy+(r()-0.5)*gap*0.4});
  if(r()<0.35){const ny=(cy+prev)/2;coins.push({x:x-EN.space/2,y:ny});}
  prev=cy;x+=Math.max(EN.space,1.5*v0*(1+0.15*prog))+Math.floor(r()*20);}
 return {gates,coins};}
function gateY(E,g){return g.cy+(g.amp?g.amp*Math.sin(E.t*2+g.ph):0);}
function engNew(seed,d,spdK,hp){const goal=1800+800*d,v0=(95+10*d)*spdK,c=engCourse(seed,d,goal,v0);
 return {mode:'engine',d,t:0,goal,v0,v:v0,dist:0,y:(EN.top+EN.bot)/2,vy:0,ready:true,hp,mhp:hp,inv:0,gates:c.gates,coins:c.coins,passed:0,got:0,dead:0,won:0,fx:[],cough:1.5,kickT:0};}
function engKick(E){if(E.dead||E.won)return false;E.ready=false;E.vy=EN.kick;E.kickT=0.12;return true;}
function engHitGate(E,g,y){const gx=g.x-E.dist;if(EN.sx+EN.r<gx||EN.sx-EN.r>gx+EN.gw)return false;const c=gateY(E,g);return y-EN.r<c-g.gap/2||y+EN.r>c+g.gap/2;}
// one physics step; returns event list so the game layer can add sound and score
function engStep(E,dt){const ev=[];if(E.dead||E.won)return ev;E.t+=dt;E.inv=Math.max(0,E.inv-dt);E.kickT=Math.max(0,E.kickT-dt);
 if(E.ready){E.y=(EN.top+EN.bot)/2+Math.sin(E.t*3)*6;return ev;}
 E.v=E.v0*(1+0.15*Math.min(1,E.dist/E.goal));E.dist+=E.v*dt;E.vy=Math.min(EN.vmax,E.vy+EN.grav*dt);E.y+=E.vy*dt;
 let hit=E.y-EN.r<EN.top||E.y+EN.r>EN.bot;
 for(const g of E.gates){if(!g.passed&&g.x+EN.gw<E.dist+EN.sx-EN.r){g.passed=1;E.passed++;ev.push(['gate',g]);}if(!hit&&engHitGate(E,g,E.y))hit=true;}
 for(const c of E.coins)if(!c.got&&Math.abs(c.x-E.dist-EN.sx)<10&&Math.abs(c.y-E.y)<11){c.got=1;E.got++;ev.push(['coin',c]);}
 if(hit&&E.inv<=0){E.hp--;if(E.hp<=0){E.dead=1.3;ev.push(['crash']);}else{E.inv=1.2;E.vy=EN.kick*0.8;E.y=Math.max(EN.top+12,Math.min(EN.bot-12,E.y));ev.push(['bump']);}}
 if(!E.dead&&E.dist>=E.goal){E.won=1.4;ev.push(['dock']);}
 return ev;}
// autopilot used by the fairness tests: aims for the middle of the next gap
function engPilot(E){const nx=E.gates.find(g=>g.x+EN.gw>E.dist+EN.sx-EN.r-2);const ty=nx?gateY(E,nx)+6:(EN.top+EN.bot)/2;return E.ready||(E.y>ty&&E.vy>-60);}
function engSim(seed,d,spdK,maxT=200){const E=engNew(seed,d,spdK,1);let t=0;while(t<maxT&&!E.dead&&!E.won){if(engPilot(E))engKick(E);engStep(E,1/60);t+=1/60;}return {won:!!E.won,dead:!!E.dead,dist:Math.round(E.dist),goal:E.goal,gates:E.gates.length,passed:E.passed,t:Math.round(t)};}
function engCheck(E){const out=[];let p=null;for(const g of E.gates){if(g.gap<92)out.push('gap');if(g.cy-g.gap/2-g.amp<EN.top+10||g.cy+g.gap/2+g.amp>EN.bot-10)out.push('edge');if(p){if(g.cy-p.cy<-90||g.cy-p.cy>120)out.push('jump');if(g.x-p.x<EN.space)out.push('space');}p=g;}return out;}
function initEngine(L,i){curLvl=i;runCr=0;const k=FT.diff(),d=L.d+(S.ng?1:0),hp=diffIdx()===0?2:1;
 const seed=FT.run&&FT.run.mode==='daily'?Math.floor(Math.random()*1e9):(7000+i*131+(FT.retry=(FT.retry||0)+1)*17);
 G=engNew(seed,d,k.spd,hp);G.L=L;G.p={hp:G.hp,mhp:G.mhp,inv:0};G.stars=[];for(let j=0;j<60;j++)G.stars.push({x:Math.random()*W,y:EN.top+Math.random()*(EN.bot-EN.top),z:1+Math.floor(Math.random()*3)});
 state='engine';stT=0;emit('start',L);G.sc&&(G.sc.pot=G.gates.length*PTS.gate+G.coins.length*PTS.coin);}
PTS.gate=100;
{const _sl=startLevel;startLevel=function(i){const L=LV[i];if(L&&L.t==='engine'){initEngine(L,i);return;}_sl(i);};}
{const _go=goStory;goStory=function(i){FT.retry=0;_go(i);};}
function engThrust(){if(state!=='engine'||!G||G.mode!=='engine')return;if(engKick(G)){tone(260,520,.05,'square',.04);for(let j=0;j<6;j++)G.fx.push({x:EN.sx-9,y:G.y+3,vx:rnd(-90,-30),vy:rnd(10,70),l:rnd(.15,.3),c:j%2?'#ffd23a':'#ff6a3a',s:2});}}
{const _pd=ptrDown;ptrDown=function(id,e){_pd(id,e);const q=ptrs[id];if(q&&state==='engine'&&!(q.x>236&&q.y<26))engThrust();};}
{const _ok=onKey;onKey=function(c){if(state==='engine'&&c==='KeyH'){FT.hitbox=!FT.hitbox;return;}if(state==='engine'&&(c==='Space'||c==='ArrowUp'||c==='KeyW')){engThrust();return;}_ok(c);};}
function updEngine(dt){const E=G;for(const f of E.fx){f.x+=f.vx*dt;f.y+=f.vy*dt;f.l-=dt;if(f.smoke){f.s+=dt*6;}}E.fx=E.fx.filter(f=>f.l>0);
 if(E.dead){E.dead-=dt;if(E.dead<=0){E.dead=0;failLevel();}return;}
 if(E.won){E.won-=dt;E.dock=(E.dock||0)+dt;if(E.won<=0){E.won=0;levelClear();}return;}
 if(E.auto&&engPilot(E))engThrust();const ev=engStep(E,dt);G.p.hp=E.hp;G.p.inv=E.inv;
 for(const [k,o] of ev){if(k==='gate'){addPts(PTS.gate,EN.sx+20,gateY(E,o)-o.gap/2+10);tone(660,660,.04,'square',.03);}
  else if(k==='coin'){runCr+=1;SFX.coin();emit('coin',o);}
  else if(k==='crash'){SFX.big();E.shake=0.4;for(let j=0;j<26;j++)E.fx.push({x:EN.sx,y:E.y,vx:rnd(-160,160),vy:rnd(-160,120),l:rnd(.3,.8),c:FIRE[j%FIRE.length],s:2});emit('hurt');}
  else if(k==='bump'){SFX.hurt();E.shake=0.25;emit('hurt');}
  else if(k==='dock'){SFX.win();emit('dock');}}
 // engine sputter: a steady smoke trail plus a random cough with a little pop
 if(!E.ready&&Math.random()<dt*24)E.fx.push({x:EN.sx-10,y:E.y+2,vx:-E.v*0.5+rnd(-10,10),vy:rnd(-12,4),l:rnd(.5,.9),c:Math.random()<.5?'#3a3c4a':'#565a6a',s:2,smoke:1});
 E.cough-=dt;if(E.cough<=0){E.cough=rnd(1.2,2.6);noise(.07,.07,700);tone(140,70,.06,'square',.03);for(let j=0;j<5;j++)E.fx.push({x:EN.sx-10,y:E.y+2,vx:rnd(-80,-30),vy:rnd(-30,30),l:rnd(.4,.7),c:j<2?'#ff9a3a':'#24262e',s:3,smoke:1});}
 E.shake=Math.max(0,(E.shake||0)-dt);}
// ---- art ----
const ENGSHIP=(()=>{const c=document.createElement('canvas');c.width=48;c.height=26;const x=c.getContext('2d'),P=(col,a,b,w,h)=>{x.fillStyle=col;x.fillRect(a,b,w,h);};
 P('#1a1e2e',4,9,38,10);P('#8a9aba',6,8,32,8);P('#c8d4ec',8,8,26,3);P('#5a6a8a',6,14,34,4);P('#e8f0ff',30,9,10,3);P('#3a4a6a',40,11,6,4);P('#5ab0ff',26,5,9,4);P('#bfe8ff',28,5,4,2);P('#1a1e2e',25,4,11,1);
 P('#ff6a3a',12,6,8,2);P('#ff6a3a',10,18,14,2);P('#3a4a6a',10,20,16,3);P('#2a3046',2,10,4,8);P('#ff9a3a',0,12,2,4);P('#5a6a8a',14,3,8,3);P('#8a9aba',14,2,6,1);return c;})();
function drawEngShip(E,x,y){ctx.save();ctx.translate(x,y);ctx.rotate(Math.max(-0.45,Math.min(0.7,E.vy/520)));if(E.kickT>0){glow(-10,4,6,'#ffa03a',0.5);ctx.fillStyle='#ffd23a';ctx.fillRect(-9,4,4,4);ctx.fillStyle='#ff6a3a';ctx.fillRect(-7,8,3,4);}
 ctx.drawImage(ENGSHIP,-12,-7,24,13);ctx.restore();}
function drawColumn(g,x,y0,y1,end){const h=y1-y0;if(h<=0)return;const w=EN.gw,r=rng(g.seed+(end>0?7:3));
 if(g.kind==='strut'){ctx.fillStyle='#22304a';ctx.fillRect(x,y0,w,h);ctx.fillStyle='#8a9aba';ctx.fillRect(x,y0,2,h);ctx.fillRect(x+w-2,y0,2,h);ctx.fillStyle='#5a6a8a';
  for(let yy=y0+(end>0?0:h%18);yy<y1-2;yy+=18){for(let k=0;k<16;k+=2){if(yy+k<y0||yy+k+2>y1)continue;ctx.fillRect(x+4+k*(w-8)/16,yy+k,2,2);ctx.fillRect(x+w-6-k*(w-8)/16,yy+k,2,2);}if(yy>=y0)ctx.fillRect(x+4,yy,w-8,1);}
  const ey=end>0?y1-8:y0;ctx.fillStyle='#3a4a6a';ctx.fillRect(x,ey,w,8);for(let k=0;k<w;k+=6){ctx.fillStyle='#ffd23a';ctx.fillRect(x+k,ey+2,3,4);}ctx.fillStyle=(T*2|0)%2?'#ff3a6a':'#5a1020';ctx.fillRect(x+w/2-1,end>0?y1-11:y0+8,2,3);}
 else if(g.kind==='wreck'){ctx.fillStyle='#4a2a22';ctx.fillRect(x,y0,w,h);for(let yy=y0;yy<y1;yy+=14){ctx.fillStyle=r()<.5?'#6a3a2a':'#5a3226';ctx.fillRect(x+1,yy+1,w-2,12);ctx.fillStyle='#8a5a3a';ctx.fillRect(x+1,yy+1,w-2,1);ctx.fillStyle='#2a1810';ctx.fillRect(x+3,yy+5,2,2);ctx.fillRect(x+w-5,yy+5,2,2);if(r()<.3){ctx.fillStyle='#1a0e0a';ctx.fillRect(x+6+r()*10,yy+3,5,6);}}
  ctx.fillStyle='#4a2a22';const ey=end>0?y1:y0;for(let k=0;k<w;k+=4){const t=2+Math.floor(r()*5);ctx.fillRect(x+k,end>0?ey:ey-t,4,t);}ctx.fillStyle='#ff9a3a';if((T*6+g.seed)%7<1)ctx.fillRect(x+w/2,end>0?y1+2:y0-4,1,2);}
 else{ctx.fillStyle='#24242f';ctx.fillRect(x,y0,w,h);for(let yy=y0;yy<y1-3;yy+=9){for(let k=0;k<3;k++){const cx=x+2+k*8+r()*2,cy=yy+r()*3,s=Math.min(5+r()*5,x+w-1-cx,y1-1-cy);if(s<2)continue;ctx.fillStyle='#2e2e3e';ctx.fillRect(cx-1,cy-1,s+2,s+2);ctx.fillStyle=r()<.5?'#4a4a5a':'#56566a';ctx.fillRect(cx,cy,s,s);ctx.fillStyle='#7a7a90';ctx.fillRect(cx,cy,s,1);}}for(let k=0;k<w+8;k+=5){const t=2+Math.floor(r()*4);ctx.fillStyle='#3a3a4c';ctx.fillRect(x-4+k,end>0?y1-1:y0-t+1,4,t);}}}
function drawEngine(dt){const E=G,L=E.L||{bg:['#0c0612','#2a1018'],planet:'#d06a3a'};const gr=ctx.createLinearGradient(0,0,0,H);gr.addColorStop(0,L.bg[0]);gr.addColorStop(1,L.bg[1]);ctx.fillStyle=gr;ctx.fillRect(0,0,W,H);
 const sp=E.ready?20:E.v;for(const s of E.stars){if(dt)s.x-=sp*0.04*s.z*s.z*dt;if(s.x<0){s.x=W;s.y=EN.top+Math.random()*(EN.bot-EN.top);}ctx.fillStyle=s.z===3?'#fff':s.z===2?'#8aa0d0':'#44507a';ctx.fillRect(s.x|0,s.y|0,s.z===3?2:1,1);}
 {const px=200-E.dist*0.02,py=140;ctx.fillStyle=L.planet;ctx.globalAlpha=0.35;ctx.beginPath();ctx.arc(px,py,60,0,7);ctx.fill();ctx.globalAlpha=0.25;ctx.fillStyle='#000';ctx.beginPath();ctx.arc(px+18,py-10,58,0,7);ctx.fill();ctx.globalAlpha=1;}
 ctx.save();if(E.shake)ctx.translate(rnd(-1,1)*E.shake*8,rnd(-1,1)*E.shake*8);
 // ceiling wreck band and debris floor
 ctx.fillStyle='#10121e';ctx.fillRect(0,20,W,EN.top-20);for(let k=-((E.dist*0.9)%24);k<W;k+=24){ctx.fillStyle='#22283c';ctx.fillRect(k,EN.top-6,22,6);ctx.fillStyle='#3a4466';ctx.fillRect(k,EN.top-6,22,1);}
 ctx.fillStyle='#0a0a14';ctx.fillRect(0,EN.bot,W,H-EN.bot);for(let k=-((E.dist)%30);k<W+30;k+=30){const hh=4+((Math.floor((E.dist+k)/30)*37)%7);ctx.fillStyle='#262838';ctx.fillRect(k,EN.bot,18,hh);ctx.fillStyle='#3a3c50';ctx.fillRect(k,EN.bot,18,1);ctx.fillStyle='#1a1c28';ctx.fillRect(k+16,EN.bot,12,hh-2);}
 // dock
 const dx=E.goal-E.dist+EN.sx+30;if(dx<W+60){ctx.fillStyle='#1a2a3a';ctx.fillRect(dx,EN.top,W,EN.bot-EN.top);ctx.fillStyle='#04060c';ctx.fillRect(dx,170,W,110);ctx.fillStyle='#3a5a7a';ctx.fillRect(dx,166,W,4);ctx.fillRect(dx,280,W,4);
  for(let k=0;k<6;k++){ctx.fillStyle=((T*6|0)+k)%6===0?'#9aff5a':'#2a5a3a';ctx.fillRect(dx+6+k*14,172,6,2);ctx.fillRect(dx+6+k*14,276,6,2);}ctx.fillStyle='#8a9aba';ctx.fillRect(dx-3,EN.top,3,136);ctx.fillRect(dx-3,284,3,EN.bot-284);txt('DOCK',dx+30,150,'#9aff5a',8);}
 drawGates(E);
 for(const c of E.coins)if(!c.got){const x=c.x-E.dist;if(x>-10&&x<W+10)drawCoin(x,c.y,E.t,c.x);}
 drawFx(E.fx.filter(f=>f.smoke));
 if(!E.dead&&!(E.inv>0&&(E.t*20|0)%2)){const sx=E.won?EN.sx+(E.dock||0)*60:EN.sx,sy=E.won?E.y+((225-E.y)*Math.min(1,(E.dock||0)*1.5)):E.y;drawEngShip(E,sx,sy);}
 drawFx(E.fx.filter(f=>!f.smoke));ctx.restore();
 // HUD
 hudTop('HULL',E.hp,E.mhp);txt('CR '+(S.cr+runCr),236,6,'#ffd23a',8,'right');
 ctx.fillStyle='rgba(4,6,16,0.8)';ctx.fillRect(0,EN.bot+18,W,30);const pr=Math.min(1,E.dist/E.goal);txt('REPAIR DOCK',8,EN.bot+22,'#9aff5a',7,'left');txt(Math.max(0,Math.round((E.goal-E.dist)/10))+' m',W-8,EN.bot+22,'#9aff5a',7,'right');
 bar(8,EN.bot+34,W-16,4,pr,'#9aff5a','#0a2a1a');draw&&0;ctx.fillStyle='#fff';ctx.fillRect(8+(W-16)*pr-1,EN.bot+32,2,8);
 if(E.ready){panel(30,300,W-60,46,'#ffd23a');txt(hasTouch?'TAP ANYWHERE FOR A KICK':'SPACE OR UP FOR A KICK',W/2,310,'#ffd23a',8);txt('Gravity does the rest. Reach the dock.',W/2,326,'#8aa0d0',7);}
 if(E.t<4&&!E.ready)txt('CHAPTER '+(curLvl+1)+': '+(E.L?E.L.name:''),W/2,60,'#fff',9);
 if(E.dead)txt('HULL BREACH',W/2,200,'#ff3a6a',12);if(E.won)txt('DOCKING',W/2,200,'#9aff5a',12);
 txt(hasTouch?'Tap anywhere to fire the lift jets':'Space / Up for the lift jets',8,470,'#56607e',7,'left');
 pauseBtn();}
function drawGates(E){for(const g of E.gates){const sx=g.x-E.dist;if(sx<-40||sx>W+10)continue;const c=gateY(E,g);drawColumn(g,sx,EN.top,c-g.gap/2,1);drawColumn(g,sx,c+g.gap/2,EN.bot,-1);}}
function engColliders(E){const o=[];for(const g of E.gates){const gx=g.x-E.dist;if(gx>W||gx+EN.gw<0)continue;const c=gateY(E,g);o.push([gx,EN.top,EN.gw,c-g.gap/2-EN.top],[gx,c+g.gap/2,EN.gw,EN.bot-(c+g.gap/2)]);}return o;}
function drawHitboxes(E){ctx.strokeStyle='#ff2a2a';ctx.lineWidth=1;for(const [x,y,w,h] of engColliders(E))ctx.strokeRect(x+.5,y+.5,w-1,h-1);ctx.strokeStyle='#ffff3a';ctx.strokeRect(0.5,EN.top+.5,W-1,EN.bot-EN.top-1);ctx.strokeStyle='#3aff6a';ctx.beginPath();ctx.arc(EN.sx,E.y,EN.r,0,7);ctx.stroke();ctx.fillStyle='#3aff6a';for(const c of E.coins)if(!c.got){const x=c.x-E.dist;if(x>-10&&x<W+10)ctx.fillRect(x-1,c.y-1,2,2);}txt('HITBOXES ON (H)',W-8,470,'#ff2a2a',7,'right');}
FT.hitbox=false;
// draw only the obstacles into an offscreen layer (same code as the real frame) so tests can compare against colliders
function engLayer(E){const c=document.createElement('canvas');c.width=W;c.height=H;const sv=ctx;ctx=c.getContext('2d');try{drawGates(E);}finally{ctx=sv;}return c.getContext('2d').getImageData(0,0,W,H).data;}
function engAudit(seeds,frames){const bad=[];let pts=0,crashes=0,crashOk=0;
 for(let s=1;s<=seeds;s++){const d=1+s%3,E=engNew(s*7717,d,1,1);E.ready=false;const r=rng(s);let f=0;
  while(f<frames&&!E.dead&&!E.won){if(r()<0.09)engKick(E);const y0=E.y;engStep(E,1/60);f++;
   if(f%7===0||E.dead){const px=engLayer(E),A=(x,y)=>{x=Math.floor(x);y=Math.floor(y);return x<0||y<0||x>=W||y>=H?0:px[(y*W+x)*4+3];};
    for(const [x,y,w,h] of engColliders(E))for(let yy=y+0.5;yy<y+h;yy+=3)for(let xx=Math.max(0,x+0.5);xx<Math.min(W,x+w);xx+=3){pts++;if(!A(xx,yy)){bad.push({s,f,x:xx,y:yy});if(bad.length>20)return {pts,bad,crashes,crashOk};}}
    if(E.dead){crashes++;const y=E.y;if(y-EN.r<EN.top||y+EN.r>EN.bot){crashOk++;}else{let ok=false;for(const [x,yy,w,h] of engColliders(E)){const cx=Math.max(x,Math.min(EN.sx,x+w-0.01)),cy=Math.max(yy,Math.min(y,yy+h-0.01));if(Math.hypot(cx-EN.sx,cy-y)<=EN.r+0.01&&A(cx,cy))ok=true;}if(ok)crashOk++;else bad.push({s,f,crash:1,y});}}}}}
 return {pts,bad,crashes,crashOk};}
HOOKS.push((n,dt)=>{if(n==='draw:engine'&&G&&G.mode==='engine'){updEngine(dt);drawEngine(dt);if(FT.hitbox)drawHitboxes(G);}});
{const _dm=drawMode;drawMode=function(dt){if(G&&G.mode==='engine'){drawEngine(0);return;}_dm(dt);};}
ACH.push(['engine','LIMPED HOME','Reach a repair dock with a dead drive.'],['engine0','FEATHER TOUCH','Dock without a scratch on Hard.']);
HOOKS.push((n,a)=>{if(n==='clear'&&a&&a.t==='engine'){unlockA('engine');if(diffIdx()===2&&FT.last&&FT.last.dmg===0)unlockA('engine0');}});
VR.eng={H:()=>G,audit:(s,f)=>engAudit(s,f),hitbox:v=>{FT.hitbox=v===undefined?!FT.hitbox:!!v;return FT.hitbox;},colliders:()=>engColliders(G),kick:()=>engThrust(),sim:(s,d,k)=>engSim(s,d,k||1),check:(s,d)=>{const E=engNew(s,d,1,1);return engCheck(E);},course:(s,d)=>{const E=engNew(s,d,1,1);return E.gates.map(g=>({x:g.x,cy:g.cy,gap:g.gap,amp:g.amp}));},
 step:(n,thrust)=>{const E=engNew(1,1,1,1);E.ready=false;E.gates=[];const ys=[];for(let i=0;i<n;i++){if(thrust&&i===0)engKick(E);engStep(E,1/60);ys.push([E.y,E.vy]);}return ys;},
 hitTest:(gx,cy,gap,y)=>{const E=engNew(1,1,1,1);E.dist=0;return engHitGate(E,{x:gx,cy,gap,amp:0},y);},idx:()=>LV.map((L,i)=>L.t==='engine'?i:-1).filter(i=>i>=0)};
{const _b=VR.boss,_k=VR.kill;VR.boss=()=>{if(G&&G.mode==='engine'){G.ready=false;G.auto=1;G.dist=Math.max(G.dist,G.goal-140);G.gates=G.gates.filter(g=>g.x<G.dist);return;}_b();};
 VR.kill=()=>{if(G&&G.mode==='engine'){G.ready=false;G.gates=[];G.dist=G.goal;return;}_k();};}
// ================= v7-1. BOARDING =================
// Space phase: a Hollow cutter shows up instead of a boss. Its three engine pods take damage, the hull soaks shots.
// With all pods out the Kestrel docks on its own and the chapter carries on inside the ship, ending at the reactor core.
const CUT=(()=>{const c=document.createElement('canvas');c.width=400;c.height=150;const x=c.getContext('2d');const P=(col,a,b,w,h)=>{x.fillStyle=col;x.fillRect(a,b,w,h);};
 x.fillStyle='#1a0a1e';x.beginPath();x.moveTo(200,148);x.lineTo(150,96);x.lineTo(30,70);x.lineTo(12,40);x.lineTo(80,30);x.lineTo(150,8);x.lineTo(250,8);x.lineTo(320,30);x.lineTo(388,40);x.lineTo(370,70);x.lineTo(250,96);x.closePath();x.fill();
 x.fillStyle='#3a1a3a';x.beginPath();x.moveTo(200,138);x.lineTo(156,92);x.lineTo(40,66);x.lineTo(26,44);x.lineTo(84,36);x.lineTo(154,16);x.lineTo(246,16);x.lineTo(316,36);x.lineTo(374,44);x.lineTo(360,66);x.lineTo(244,92);x.closePath();x.fill();
 for(let k=0;k<9;k++){const yy=24+k*12;P('#5a2a4e',160+k*2,yy,80-k*4,3);}for(let k=0;k<6;k++){P('#24101e',60+k*24,48+k*2,14,4);P('#24101e',326-k*24,48+k*2,14,4);}
 P('#ff3a6a',196,40,8,40);P('#ffb0c8',198,44,4,30);P('#7a2a5a',120,60,160,3);for(let k=0;k<5;k++){P('#ff5a8a',110+k*45,68,6,3);}
 x.fillStyle='#ff3a6a';x.beginPath();x.arc(200,118,7,0,7);x.fill();return c;})();
function cutterNew(d){const k=FT.diff().hp,hp=Math.round((16+6*d)*k);return {x:W/2,y:-70,ty:96,t:0,ft:2,hp0:hp,pods:[{dx:-84,dy:4,hp,mhp:hp},{dx:84,dy:4,hp,mhp:hp},{dx:0,dy:30,hp,mhp:hp}],state:'fight',dock:0};}
function cutterHull(c,x,y){const lx=x-c.x,ly=y-c.y;return Math.abs(lx)<95&&ly>-35&&ly<12-Math.abs(lx)*0.15||Math.abs(lx)<26&&ly>-35&&ly<40;}
function updCutter(dt){const c=G.cutter,p=G.p;c.t+=dt;if(c.y<c.ty)c.y=Math.min(c.ty,c.y+50*dt);c.x=W/2+Math.sin(c.t*0.5)*(c.state==='fight'?30:0);
 const live=c.pods.filter(q=>q.hp>0);
 if(c.state==='fight'){
  for(const u of G.bul){if(u.dead)continue;for(const q of live){if(Math.hypot(u.x-(c.x+q.dx),u.y-(c.y+q.dy))<13){q.hp-=u.dm||1;q.fl=0.06;u.dead=1;spark(u.x,u.y,0);SFX.hit();break;}}
   if(!u.dead&&cutterHull(c,u.x,u.y)){u.dead=1;spark(u.x,u.y,0);}}
  for(const q of c.pods)if(q.hp<=0&&!q.down){q.down=1;boom(c.x+q.dx,c.y+q.dy,30,FIRE);SFX.big();G.shake=0.4;emit('kill',{x:c.x+q.dx,y:c.y+q.dy,k:'pod'});toast(c.pods.some(z=>z.hp>0)?'ENGINE POD DOWN':'ALL ENGINES DOWN','#ffa03a');}
  if(c.y>=c.ty-1){c.ft-=dt;if(c.ft<=0){const n=live.length;c.ft=Math.max(0.9,2.2-0.25*G.d)*(n===1?0.7:1);aimed({x:c.x-40,y:c.y+10},n===1?3:1,110+G.d*10);aimed({x:c.x+40,y:c.y+10},1,110+G.d*10);}}
  if(cutterHull(c,p.x,p.y)&&p.inv<=0)hurt();
  if(!c.pods.some(q=>q.hp>0)){c.state='dock';G.eb=[];G.en=[];emit('podsdown');}}
 else if(c.state==='dock'){c.dock+=dt;p.inv=Math.max(p.inv,0.5);const tx=c.x,ty=c.y+60,k=Math.min(1,dt*2);p.x+=(tx-p.x)*k;p.y+=(ty-p.y)*k;if(Math.random()<dt*20)G.fx.push({x:c.x+rnd(-90,90),y:c.y+rnd(-20,20),vx:rnd(-20,20),vy:rnd(-30,10),l:.6,c:'#565a6a'});
  if(c.dock>2.4)c.go=1;}}
function drawCutter(){const c=G.cutter;ctx.drawImage(CUT,c.x-100,c.y-56,200,75);
 for(const q of c.pods){const x=c.x+q.dx,y=c.y+q.dy;if(q.hp>0){glow(x,y,10+Math.sin(G.t*14)*2,'#ff9a3a',0.5);ctx.fillStyle=q.fl>0?'#ffffff':'#3a1a2a';ctx.fillRect(x-9,y-7,18,14);ctx.fillStyle='#ff6a3a';ctx.fillRect(x-6,y-4,12,8);ctx.fillStyle='#ffd23a';ctx.fillRect(x-3,y-2,6,4);q.fl=Math.max(0,(q.fl||0)-1/60);bar(x-10,y-13,20,2,q.hp/q.mhp,'#ffa03a','#2a1010');}
  else{ctx.fillStyle='#120a10';ctx.fillRect(x-9,y-7,18,14);if((G.t*8|0)%3===0)ctx.fillStyle='#ff9a3a',ctx.fillRect(x-2+rnd(-3,3),y-2,2,2);}}
 if(c.state==='dock'){txt('ENGINES DOWN. DOCKING',W/2,200,'#9aff5a',9);const a=Math.max(0,(c.dock-1.6)/0.8);if(a>0){ctx.fillStyle='rgba(0,0,0,'+Math.min(1,a)+')';ctx.fillRect(0,0,W,H);}}
 else if(c.t<4)txt('SHOOT OUT ITS ENGINE PODS',W/2,200,'#ffa03a',8);}
function boardInside(){const L=LV[curLvl],d=L.d+(S.ng?1:0),sc0=G.sc,keepCr=runCr,secT=G.secT;const IL=Object.assign({t:'plat',d:L.d},L.inner);
 initPlat(IL);runCr=keepCr;G.sc=sc0;G.boardIn=1;G.fadeIn=1;G.L=IL;
 const b=G.brute,A=G.arena,k=FT.diff().hp;b.k='core';b.w=34;b.h=46;b.x=A.sx-b.w/2;b.y=A.gy*TS-b.h;b.vx=0;b.hp=b.mhp=Math.round((30+18*d)*k);b.ft=1.5;
 b.upd=(e,dt,dx,dy)=>{e.vy=0;e.vx=0;e.ft-=dt;if(Math.abs(dx)<230&&e.ft<=0){e.ft=Math.max(1.1,2.4-0.3*d);const n=8+2*d,o=e.t;for(let i=0;i<n;i++){const a=o+i/n*Math.PI*2,s=80+d*8;G.eb.push({x:e.x+e.w/2,y:e.y+14,vx:Math.cos(a)*s,vy:Math.sin(a)*s});}tone(180,90,.12,'sawtooth',.04);}};
 b.draw=(e,cam)=>{const x=e.x-cam,y=e.y,pu=0.5+0.5*Math.sin(G.t*4);ctx.fillStyle='#2a1420';ctx.fillRect(x-4,y+e.h-8,e.w+8,8);ctx.fillStyle='#3a1a2a';ctx.fillRect(x,y,e.w,e.h-8);ctx.fillStyle='#5a2a44';ctx.fillRect(x+2,y,4,e.h-8);ctx.fillRect(x+e.w-6,y,4,e.h-8);
  glow(x+e.w/2,y+16,14+pu*4,'#ff3a6a',0.4);ctx.fillStyle=e.fl>0?'#ffffff':'#ff3a6a';ctx.fillRect(x+9,y+6,e.w-18,20);ctx.fillStyle='#ffb0c8';ctx.fillRect(x+13,y+10+pu*3,e.w-26,8);for(let k2=0;k2<4;k2++){ctx.fillStyle='#7a2a5a';ctx.fillRect(x+4,y+30+k2*3,e.w-8,1);}
  bar(x-3,y-8,e.w+6,3,e.hp/e.mhp,'#ff3a6a');if(!G.coreSeen&&Math.abs(G.p.x-e.x)<200){G.coreSeen=1;toast('THE CORE. BREAK IT','#ff5a8a');}};
 toast('INSIDE THE CUTTER. FIND THE CORE','#ff5a8a');emit('boardin');}
PTS.pod=800;PTS.core=4000;
{const _sl=startLevel;startLevel=function(i){const L=LV[i];if(L&&L.t==='board'){curLvl=i;runCr=0;initSpace(L);G.board=1;stT=0;emit('start',L);return;}_sl(i);};}
{const _gs=goStory;goStory=function(i){_gs(i);const L=LV[i];if(L&&L.t==='board')setTimeout(()=>{ART.boss(L.d,false);setTimeout(()=>ART.space(Math.min(5,L.d),RQ),60);},60);};}
{const _sb=spawnBoss;spawnBoss=function(){if(G&&G.board){if(!G.cutter){G.cutter=cutterNew(G.d);toast('HOLLOW CUTTER','#ff5a8a');}return;}_sb();};}
HOOKS.push((n,dt)=>{if(n==='drawspace'&&G&&G.cutter&&G.mode==='space'){if(dt&&state==='space')updCutter(dt);drawCutter();}
 else if(n==='secondary'&&G&&G.cutter&&G.cutter.state==='fight'&&a_bomb()){const lv=S.secLv||0;for(const q of G.cutter.pods)if(q.hp>0){q.hp-=10+5*lv;}}
 else if(n==='overlay'&&G&&G.cutter&&G.cutter.go&&state==='space'){G.cutter.go=0;boardInside();}
 else if(n==='overlay'&&G&&G.fadeIn>0&&state==='plat'){ctx.fillStyle='rgba(0,0,0,'+Math.min(1,G.fadeIn)+')';ctx.fillRect(0,0,W,H);G.fadeIn-=dt*1.2;}});
function a_bomb(){return (S.sec||'bomb')==='bomb';}
{const _b=VR.boss,_k=VR.kill;VR.boss=()=>{if(G&&G.board&&G.mode==='space'){G.t=G.waves.len+1;G.waves.list=[];G.en=[];return;}_b();};
 VR.kill=()=>{if(G&&G.board&&G.cutter&&G.mode==='space'){for(const q of G.cutter.pods)q.hp=0;return;}_k();};}
ACH.push(['board','UNINVITED','Board a Hollow ship and break its core.']);
HOOKS.push((n,a)=>{if(n==='kill'&&a&&a.k==='core')unlockA('board');});
VR.board={cut:()=>G.cutter&&{state:G.cutter.state,pods:G.cutter.pods.map(q=>q.hp),x:G.cutter.x,y:G.cutter.y},hull:(x,y)=>cutterHull(G.cutter,x,y),inside:()=>!!G.boardIn,core:()=>G.brute&&{k:G.brute.k,hp:G.brute.hp,x:G.brute.x,y:G.brute.y,dead:!!G.brute.dead}};
VR.ix=n=>LV.findIndex(L=>L.name===n);
