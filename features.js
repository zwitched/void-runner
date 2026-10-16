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
{const _fl=failLevel;failLevel=function(){if(FT.run){const R=FT.run,s=(R.score||0)+(sc()?sc().score:0);R.final=s;R.rank=hsAdd(R.mode,s,{t:Math.round(T-R.t0),w:R.cyc||R.i});emit('runover',R);state='runover';stT=0;return;}_fl();};}
HOOKS.push((n,dt)=>{if(n!=='draw:runover')return;stT+=dt;if(G)drawMode(0);BTN=[];ctx.fillStyle='rgba(0,0,10,0.72)';ctx.fillRect(0,0,W,H);const R=FT.run||{};const s=R.final!==undefined?R.final:R.score;
 panel(20,100,W-40,300,'#ffa03a');txt(R.mode==='rush'?(R.done?'RUSH COMPLETE':'RUSH OVER'):R.mode==='daily'?'DAILY RUN OVER':'RUN OVER',W/2,116,'#ffa03a',14);txt('SCORE '+s,W/2,140,'#fff',10);
 if(R.rank>=0)txt(R.rank===0?'New best!':'Rank '+(R.rank+1)+' on this table',W/2,156,'#9aff5a',8);hsTable(R.mode==='daily'?'daily:'+today():R.mode,40,176);
 btn('AGAIN',40,334,90,26,()=>{R.mode==='rush'?startRush():R.mode==='daily'?FT.startDaily():startEndless();},'#9aff5a');btn('MODES',140,334,90,26,()=>{clearRun();state='modes';},'#5ab0ff');defaultAct=()=>{clearRun();state='modes';};});
function hsTable(k,x,y){const t=(S.hs&&S.hs[k])||[];txt('LOCAL BEST',x,y,'#8aa0d0',7,'left');for(let i=0;i<5;i++){const e=t[i];txt((i+1)+'.',x,y+14+i*12,'#56607e',7,'left');txt(e?String(e.s):'---',x+70,y+14+i*12,e?'#dfe8ff':'#3a4466',7,'right');if(e)txt(e.d,x+150,y+14+i*12,'#56607e',7,'right');if(e&&e.w!==undefined)txt((k==='rush'?'B':'W')+e.w,x+186,y+14+i*12,'#56607e',7,'right');}}
FT.unlocked=()=>!!S.done||!!S.dbg;
FT.menu.push(['MODES',()=>{state='modes';},'#ffa03a']);
HOOKS.push((n,dt)=>{if(n!=='draw:modes')return;ctx.fillStyle='#060814';ctx.fillRect(0,0,W,H);stars(dt,1);txt('EXTRA MODES',W/2,14,'#ffa03a',14);const ok=FT.unlocked();
 const card=(y,title,desc,k,go)=>{panel(8,y,W-16,128,ok?'#ffa03a':'#2a3a6a');txt(title,18,y+8,ok?'#ffa03a':'#56607e',10,'left');wrap(desc,W-110,7).forEach((l,j)=>txt(l,18,y+22+j*9,'#8aa0d0',7,'left'));hsTable(k,18,y+54);if(ok)btn('PLAY',W-80,y+6,64,22,go,'#9aff5a');};
 card(36,'BOSS RUSH','Every space boss back to back. A little hull comes back between fights.','rush',startRush);
 card(170,'ENDLESS','Waves keep coming and keep getting meaner. A boss shows up every third wave.','endless',startEndless);
 if(!ok){txt('Finish the campaign to unlock these.',W/2,306,'#ffd23a',8);}
 if(FT.modesExtra)FT.modesExtra();
 btn('BACK',10,440,80,26,()=>{state='title';},'#8aa0d0');defaultAct=()=>{state='title';};});
VR.unlock=()=>{S.dbg=1;save();};VR.rush=()=>startRush();VR.endless=()=>startEndless();VR.run=()=>FT.run&&Object.assign({},FT.run);VR.hs=()=>S.hs||{};
window.FT=FT;
