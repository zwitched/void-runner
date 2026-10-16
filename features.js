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
