'use strict';
// VOID RUNNER - original HTML5 pixel game. All art drawn in code. No external assets.
const W=270,H=480,HEIGHT_=480;
const cv=document.getElementById('c');let ctx=cv.getContext('2d');
// Render scale: High = 2x internal pixel density (540x960 backing store, logical 270x480 game space); Low = 1x.
const RQ=(()=>{try{return JSON.parse(localStorage.getItem('voidrunner.save.v1')||'{}').q==='lo'?1:2;}catch(e){return 2;}})();
cv.width=W*RQ;cv.height=H*RQ;
function cnv(w,h){const c=document.createElement('canvas');c.width=Math.ceil(w*RQ);c.height=Math.ceil(h*RQ);c.r=RQ;const x=c.getContext('2d');x.imageSmoothingEnabled=false;x.scale(RQ,RQ);return [c,x];}
function blit(c,x,y,w,h){ctx.drawImage(c,x,y,w===undefined?c.width/(c.r||1):w,h===undefined?c.height/(c.r||1):h);}
function fit(){const s=Math.min(innerWidth/W,innerHeight/H);const k=s>=2?Math.floor(s):s;cv.style.width=W*k+'px';cv.style.height=H*k+'px';}
addEventListener('resize',fit);fit();
const rnd=(a,b)=>a+Math.random()*(b-a),ri=(a,b)=>Math.floor(rnd(a,b+1)),clamp=(v,a,b)=>v<a?a:v>b?b:v;
function rng(seed){let s=(seed>>>0)||1;return()=>{s^=s<<13;s>>>=0;s^=s>>>17;s^=s<<5;s>>>=0;return s/4294967296;};}
const hasTouch=('ontouchstart' in window)||navigator.maxTouchPoints>0;

// ---------- sprites ----------
const PAL={a:'#e8f4ff',b:'#5ab0ff',c:'#2a5cff',d:'#ff6a3a',e:'#ffd23a',f:'#7a7a9a',g:'#3a3a5a',h:'#ff3a6a',i:'#9aff5a',j:'#3aaa3a',k:'#9a5cff',l:'#6a2aaa',m:'#ffffff',n:'#202030',o:'#aa5a2a',p:'#f0b890',q:'#b8785a',r:'#3a2418',s:'#d8642a'};
function spr(rows){const h=rows.length,w=rows[0].length,c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');rows.forEach((r,j)=>[...r].forEach((ch,i)=>{const p=PAL[ch];if(p){x.fillStyle=p;x.fillRect(i,j,1,1);}}));return c;}
function refine(c,ol='#0a0a14'){const w=c.width,h=c.height,s=c.getContext('2d').getImageData(0,0,w,h).data,o=document.createElement('canvas');o.width=w+2;o.height=h+2;const x=o.getContext('2d'),img=x.createImageData(w+2,h+2),d=img.data;
 const A=(i,j)=>i>=0&&j>=0&&i<w&&j<h&&s[(j*w+i)*4+3]>0,oc=[parseInt(ol.slice(1,3),16),parseInt(ol.slice(3,5),16),parseInt(ol.slice(5,7),16)];
 for(let j=-1;j<=h;j++)for(let i=-1;i<=w;i++){const k=((j+1)*(w+2)+(i+1))*4;if(A(i,j)){const q=(j*w+i)*4;let f=1;if(!A(i,j-1)||!A(i-1,j))f=1.35;else if(!A(i,j+1)||!A(i+1,j))f=0.62;else if(j>h*0.6)f=0.85;d[k]=Math.min(255,s[q]*f+(f>1?18:0));d[k+1]=Math.min(255,s[q+1]*f+(f>1?18:0));d[k+2]=Math.min(255,s[q+2]*f+(f>1?18:0));d[k+3]=255;}
  else if(A(i-1,j)||A(i+1,j)||A(i,j-1)||A(i,j+1)){d[k]=oc[0];d[k+1]=oc[1];d[k+2]=oc[2];d[k+3]=255;}}
 x.putImageData(img,0,0);return o;}
function epx(c){const w=c.width,h=c.height,s=new Uint32Array(c.getContext('2d').getImageData(0,0,w,h).data.buffer),o=document.createElement('canvas');o.width=w*2;o.height=h*2;const x=o.getContext('2d'),im=x.createImageData(w*2,h*2),d=new Uint32Array(im.data.buffer);
 const P=(i,j)=>i<0||j<0||i>=w||j>=h?0:s[j*w+i];
 for(let j=0;j<h;j++)for(let i=0;i<w;i++){const p=P(i,j),A=P(i,j-1),B=P(i+1,j),C=P(i-1,j),D=P(i,j+1);let a=p,b=p,cc=p,dd=p;
  if(C===A&&C!==D&&A!==B)a=A;if(A===B&&A!==C&&B!==D)b=B;if(D===C&&D!==B&&C!==A)cc=C;if(B===D&&B!==A&&D!==C)dd=D;
  const k=(2*j)*(2*w)+2*i;d[k]=a;d[k+1]=b;d[k+2*w]=cc;d[k+2*w+1]=dd;}
 x.putImageData(im,0,0);return o;}
function hd(c){const w=c.width,h=c.height,x=c.getContext('2d'),im=x.getImageData(0,0,w,h),d=im.data;const A=(i,j)=>i>=0&&j>=0&&i<w&&j<h&&d[(j*w+i)*4+3]>0;const out=new Uint8ClampedArray(d);
 for(let j=0;j<h;j++)for(let i=0;i<w;i++){const k=(j*w+i)*4;if(!d[k+3])continue;let f=1.08-0.22*(j/h);if(!A(i,j-2)||!A(i-2,j))f+=0.12;if(!A(i,j+2)||!A(i+2,j))f-=0.14;f+=((i+j)&1)?0.03:-0.03;
  if(f>1){const t=(f-1)*0.6;out[k]=d[k]+(255-d[k])*t;out[k+1]=d[k+1]+(255-d[k+1])*t;out[k+2]=d[k+2]+(255-d[k+2])*t;}else{out[k]=d[k]*f;out[k+1]=d[k+1]*f;out[k+2]=d[k+2]*f;}}
 im.data.set(out);x.putImageData(im,0,0);return c;}
function hi(raw,ol){if(RQ===1)return refine(raw,ol);const c=refine(hd(epx(raw)),ol);c.r=2;return c;}
function whiteOf(c){const d=document.createElement('canvas');d.width=c.width;d.height=c.height;const x=d.getContext('2d');x.drawImage(c,0,0);x.globalCompositeOperation='source-in';x.fillStyle='#fff';d.r=c.r;x.fillRect(0,0,d.width,d.height);return d;}
// temporary weapon power-ups (stack on top of shop upgrades)
const PU={spread:{n:'SPREAD',c:'#ffd23a',g:["e...e",".e.e.","..e..","..e..","..e.."]},rapid:{n:'RAPID',c:'#5ad0ff',g:["..b..",".bbb.","b.b.b","..b..","..b.."]},laser:{n:'LASER',c:'#7affff',g:["..m..","..m..","..m..","..m..","..m.."]},homing:{n:'HOMING',c:'#9aff5a',g:[".i.i.","iiiii",".iii.","..i..","..e.."]},
 shotgun:{n:'SHOTGUN',c:'#ffa03a',g:["e.e.e",".eee.","..e..","..f..","..f.."]},prapid:{n:'RAPID',c:'#5ad0ff',g:["b.b..",".b.b.","..b.b",".b.b.","b.b.."]},stun:{n:'FLICKER',c:'#5ad0ff',g:['b.b.b','.bmb.','bmmmb','.bmb.','b.b.b']},surge:{n:'SURGE',c:'#9aff5a',g:['..i..','.iii.','i.i.i','..i..','..i..']},
 plasma:{n:'PLASMA',c:'#9a5cff',g:[".kkk.","kmmmk","kmmmk","kmmmk",".kkk."]}};
for(const k in PU)PU[k].img=ART.pickup(PU[k].c,PU[k].g);
const PU_SPACE=['spread','rapid','laser','homing'],PU_FOOT=['shotgun','prapid','plasma'],PU_DUR=12;
function puIcon(x,y,k,t,life){if(life<2&&(t*8|0)%2)return;const c=PU[k].c,r=7+Math.sin(t*6)*1.5;ctx.fillStyle='#0a0c18';ctx.fillRect(x-7,y-7,14,14);ctx.strokeStyle=c;ctx.lineWidth=1;ctx.strokeRect(Math.round(x-r)+.5,Math.round(y-r)+.5,Math.round(r*2)-1,Math.round(r*2)-1);draw(PU[k].img[(t*8|0)&3],x,y,2);}
function puDrop(arr,x,y,chance,pool){if(Math.random()<chance)arr.push({x,y,k:'pu',w:pool[ri(0,pool.length-1)],life:8,vx:rnd(-15,15),vy:20,v:0});}
function givePU(w){G.pu={k:w,t:PU_DUR};[880,1320,1760].forEach((f,i)=>tone(f,f,.08,'square',.05,i*.05));}
function puHUD(y){if(!G.pu)return;const P=PU[G.pu.k];txt(P.n,4,y,P.c,7,'left');bar(46,y+1,60,5,G.pu.t/PU_DUR,P.c);}
function draw(img,x,y,s=2,flip=false){const w=img.width*s/(img.r||1),h=img.height*s/(img.r||1);if(flip){ctx.save();ctx.translate(Math.round(x),0);ctx.scale(-1,1);ctx.drawImage(img,-w/2,Math.round(y-h/2),w,h);ctx.restore();}else ctx.drawImage(img,Math.round(x-w/2),Math.round(y-h/2),w,h);}

// ---------- audio ----------
let AC=null,master=null,NB=null;
function initAudio(){if(AC){if(AC.state==='suspended')AC.resume();return;}try{AC=new(window.AudioContext||window.webkitAudioContext)();master=AC.createGain();master.gain.value=0.5;master.connect(AC.destination);}catch(e){AC=null;}}
function tone(f,f2,d,type,v,delay=0){if(!AC||!S.sound)return;const t=AC.currentTime+delay,o=AC.createOscillator(),g=AC.createGain();o.type=type;o.frequency.setValueAtTime(f,t);o.frequency.exponentialRampToValueAtTime(Math.max(20,f2),t+d);g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(0.0001,t+d);o.connect(g);g.connect(master);o.start(t);o.stop(t+d+0.02);}
function noise(d,v,f=1000){if(!AC||!S.sound)return;if(!NB){NB=AC.createBuffer(1,AC.sampleRate,AC.sampleRate);const a=NB.getChannelData(0);for(let i=0;i<a.length;i++)a[i]=Math.random()*2-1;}const s=AC.createBufferSource();s.buffer=NB;const fl=AC.createBiquadFilter();fl.type='lowpass';fl.frequency.value=f;const g=AC.createGain(),t=AC.currentTime;g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(0.0001,t+d);s.connect(fl);fl.connect(g);g.connect(master);s.start(t);s.stop(t+d);}
const SFX={shoot:()=>tone(900,300,.06,'square',.02),hit:()=>tone(300,120,.05,'square',.03),boom:()=>noise(.35,.22,800),big:()=>{noise(.9,.4,500);tone(120,30,.8,'sawtooth',.1);},hurt:()=>{tone(200,60,.2,'sawtooth',.12);noise(.15,.15,2000);},coin:()=>{tone(1200,1200,.04,'square',.03);tone(1800,1800,.07,'square',.03,.04);},jump:()=>tone(300,700,.12,'square',.04),buy:()=>[523,659,784,1046].forEach((f,i)=>tone(f,f,.1,'square',.05,i*.07)),select:()=>tone(660,880,.06,'square',.04),pshoot:()=>tone(1300,500,.05,'square',.025),win:()=>[392,523,659,784,1046].forEach((f,i)=>tone(f,f,.18,'square',.06,i*.12))};
let musT=0,musStep=0;const BASS=[45,45,57,45,48,48,60,48,43,43,55,43,50,50,62,52];const mtof=m=>440*Math.pow(2,(m-69)/12);
function music(dt){if(!AC||!S.sound)return;musT-=dt;if(musT<-0.5)musT=0;if(musT>0)return;musT+=0.16;const play=state==='space'||state==='plat'||state==='hack'||state==='evade';const n=BASS[musStep%16]+(Math.floor(musStep/64)%2?(play?3:2):0);tone(mtof(n),mtof(n),.14,'triangle',.05);if(play){if(musStep%4===2)noise(.04,.04,6000);if(musStep%8===0)tone(mtof(n+24),mtof(n+24),.1,'square',.012);}musStep++;}

// ---------- save ----------
const SKEY='voidrunner.save.v1';const DEF={dec:0,v:3,cr:0,lvl:0,sg:1,hull:1,shield:0,speed:1,fg:1,armor:1,jet:0,sound:1,ng:0};
let S;function load(){try{S=Object.assign({},DEF,JSON.parse(localStorage.getItem(SKEY)||'{}'));}catch(e){S=Object.assign({},DEF);}}
function save(){try{localStorage.setItem(SKEY,JSON.stringify(S));}catch(e){}}
load();if(S.v!==3){if(S.v!==2&&S.lvl>0)S.lvl=[0,2,3,4,6,7,9,10][S.lvl]||0;if(S.lvl>0)S.lvl=[0,1,2,4,5,6,7,8,9,11,12][S.lvl]||0;S.v=3;save();}
const SHOP=[['SHIP',[['sg','BLASTER','More guns, faster fire',5,60],['hull','HULL','+2 ship hull',5,50],['shield','DEFLECTOR','Regen shield',4,80],['speed','THRUSTERS','Faster ship',4,50]]],
 ['SUIT',[['fg','PULSE RIFLE','On-foot firepower',5,60],['armor','ARMOR','+2 suit health',5,50],['jet','JETPACK','Hold jump: hover',4,70]]],
 ['HACK',[['dec','DECRYPTER','Slower fall, +preview, +time',3,60]]]];
const cost=it=>it[4]*(S[it[0]]+1);

// ---------- story / levels ----------
const LV=[
{t:'space',d:1,name:'KESTREL BELT',sky:['#07061a','#1a0a30'],story:["FENN (DISPATCH): Mara, you up? The Kestrel relay just dropped off the board.","MARA: I'm up. I'm also off shift.","FENN: You're the only courier out there carrying a Lantern key. So, congratulations.","OTT (NAV COMPUTER): Contacts ahead. No shipyard I know builds hulls like that.","MARA: Shoot first, file the report later.","OTT: When they blow, some leave glowing cores. Grab one and your guns go weird for about twelve seconds."]},
{t:'hack',d:1,name:'ASTER-9 AIRLOCK',story:["OTT: Aster-9's airlock is sealed from the inside. There's Hollow code all over the lock.","MARA: Can you open it?","OTT: I can slice it into fragments. You stack them. Fill a row and it burns out of the lock.","MARA: That's a weird way to pick a lock.","OTT: It's a weird lock. Don't let the stack hit the top, and watch the trace meter. If it runs out, they know we're here."]},
{t:'plat',d:1,name:'ASTER-9 STATION',ceil:1,pal:['#3a4a6a','#22304a','#8a9aba'],bg:['#0b1020','#18223a'],story:["OTT: Aster-9's docking ring is dark. Life support's on. Barely.","MARA: Anyone home?","OTT: Something is. It's on the ceiling.","FENN: The station keeps a chart that goes all the way to the rift. Get it and get out.","OTT: Your suit can run their cores too. Shotgun, rapid, plasma. They don't last.","MARA: Nothing good does."]},
{t:'evade',d:1,name:'CHART VAULT',pal:['#3a4a6a','#22304a','#8a9aba'],story:["OTT: The chart's in the vault. Bad news. There's a Hollow damper running in there.","MARA: Meaning?","OTT: Meaning your rifle won't fire. At all.","MARA: Great. What's in there with me?","OTT: Three of them. The vault door's on a timer lock. Keep moving till it opens, then get out the top.","FENN: Grab anything shiny on the way. Some of it flickers their field."]},
{t:'space',d:2,name:'CINDER DRIFT',sky:['#160606','#3a1408'],story:["OTT: The chart says the quickest way to the rift is through the Cinder Drift.","MARA: The freighter graveyard. Lovely.","FENN: Those things are homing in on the Lantern's signal. And no, you can't switch it off. I asked."]},
{t:'plat',d:2,name:'ORUUN SURFACE',pal:['#6a3a2a','#3a2018','#d08a4a'],bg:['#2a0e18','#6a2a1a'],story:["OTT: Port engine's on fire. I'd like to land.","MARA: You'd like to?","OTT: Oruun, two minutes out. There's an old survey beacon down there that could boost the Lantern's range.","MARA: And the welcome party?","OTT: Already waiting at the door."]},
{t:'hack',d:2,name:'SURVEY BEACON',story:["OTT: Found the beacon. Its memory core's scrambled. Ninety-eight years of junk data.","MARA: How long to clean it?","OTT: Depends how fast you clear lines. Something up there is already tracing us.","MARA: Then stop talking and start slicing."]},
{t:'space',d:3,name:'THE SHEAR',sky:['#03101a','#0a3040'],story:["OTT: I decoded the beacon. You won't like it.","OTT: First colony ship through the rift, ninety-eight years ago. Its call sign matches the big one up ahead.","MARA: So the Hollow are people?","FENN: Were. Their mothership's parked across the Shear. Nobody's gotten past it.","MARA: Somebody has to be first."]},
{t:'space',d:4,name:'RIFT APPROACH',sky:['#0c021a','#300a40'],story:["FENN: Mara, I'm losing you. The rift's chewing up the signal.","VOICE: ...bring the Lantern... we only want to go home...","OTT: That wasn't Fenn.","MARA: Yeah. I caught that."]},
{t:'hack',d:3,name:'SPIRE LOCK',story:["OTT: The Spire's dock is grown shut. There's a lock under the skin. Sort of.","MARA: Sort of?","OTT: It's thinking about us. It'll feed fragments faster than the last two.","FENN (FAINT): ...whatever you're doing out there... do it quicker..."]},
{t:'evade',d:2,name:'SPIRE NURSERY',pal:['#3a2a5a','#1e1430','#a07ad8'],story:["OTT: Past the lock there's a nursery. The damper's back.","MARA: So no gun again.","OTT: No gun. Four of them this time, and they each hunt their own way.","OTT: The red one comes straight at you. The orange one cuts you off.","MARA: And the others?","OTT: One wanders. The purple one works with the red one. Don't get boxed in."]},
{t:'plat',d:3,name:'HIVE SPIRE',ceil:1,pal:['#3a2a5a','#1e1430','#a07ad8'],bg:['#0a0614','#24123a'],story:["OTT: The Spire's grown right into the rift wall. Its core is what's holding the hole open.","MARA: So we break the core.","OTT: There's a big heat signature parked by the core door.","MARA: How big?","OTT: Put it this way. It doesn't fit through the door either."]},
{t:'space',d:5,name:'THE VOID HEART',final:1,sky:['#000000','#2a0010'],story:["OTT: Spire's down. Something's coming up out of the rift.","FENN (FAINT): ...that's the Heart. It's running the whole swarm...","MARA: Ott, when I say so, fire the Lantern straight into it.","OTT: And if that doesn't work?","MARA: Then you get to say you told me so. Briefly."]}];
const ENDING=["The Lantern fires, and the rift folds shut.","OTT: Rift's closed. The swarm's gone quiet.","MARA: Quiet how?","OTT: They're just drifting. A couple of them are pinging old colony codes.","FENN: Mara? You're back on my screen. Say something.","MARA: Put the kettle on, Fenn. And find someone who still speaks colony.","VOID RUNNER","THANKS FOR PLAYING"];

const PORT_RAW={"MARA": ["....rrrrrrr.....", "...rrrrrrrrrr...", "..rrrrrrrrrrrr..", "..rrpppppppprr..", "..rpppppppppprr.", "..rppnnppnnpprr.", "..rppmnppmnpprr.", "..rpppppppppprr.", "..rppppqqppppr..", "..rrpppppppp.r..", "...rppphhpppr...", "....qppppppq....", ".....qqppqq.....", "...ccbbqqbbcc...", "..cbbbbaabbbbc..", ".cbbbbbaabbbbbc."], "FENN": ["................", "....ffffffff....", "...ffffffffff...", "..fffppppppfff..", "..ffppppppppff..", "..fpgggppgggpf..", "..fppmnppmnppf..", "...pppppppppp...", "...ppppqqpppp...", "...pffffffffp...", "...pffppppffp...", "....ffffffff....", ".....qffffq.....", "...oodddddddoo..", "..oddddeedddddo.", ".odddddeeddddddo"], "OTT": ["................", ".gggggggggggggg.", ".gnnnnnnnnnnnng.", ".gnjjjjjjjjjjng.", ".gnjjjjjjjjjjng.", ".gnjjiijjiijjng.", ".gnjjiijjiijjng.", ".gnjjjjjjjjjjng.", ".gnjjjjjjjjjjng.", ".gnjjijjjjijjng.", ".gnjjjiiiijjjng.", ".gnjjjjjjjjjjng.", ".gnnnnnnnnnnnng.", ".gggggggggggggg.", "......ffff......", "....ffffffff...."], "VOICE": ["......llll......", "....llkkkkll....", "...lkkllllkkl...", "..lkllkkkkllkl..", ".lklkk....kklkl.", ".lkkk.hhhh.kkkl.", "lkkl.hhmmhh.lkkl", "lkkl.hhmmhh.lkkl", ".lkkk.hhhh.kkkl.", ".lklkk....kklkl.", "..lkllkkkkllkl..", "...lkkllllkkl...", "....llkkkkll....", "..l...llll...l..", ".l.l..l..l..l.l.", "l...l.l..l.l...l"]};const PORT={};for(const k in PORT_RAW)PORT[k]=hi(spr(PORT_RAW[k]));
const SPK={MARA:'#5ab0ff',OTT:'#9aff5a',FENN:'#ffa03a',VOICE:'#ff3a6a'};
// ---------- input ----------
const keys={};const ptrs={};let taps=[];
addEventListener('keydown',e=>{initAudio();if(!e.repeat&&['Space','KeyZ','KeyK'].includes(e.code))jumpPressAt=now();if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();if(!keys[e.code])onKey(e.code);keys[e.code]=true;});
addEventListener('keyup',e=>{keys[e.code]=false;});
function lp(e){const r=cv.getBoundingClientRect();return{x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*H/r.height};}
// Input: touch events tracked per identifier via changedTouches; pointer events only for mouse/pen
// (so a touch is never double-counted or dropped by a pointercancel). Each finger maps to a control zone
// by its current position, and jump presses are latched at touch time so taps between frames still count.
const now=()=>performance.now()/1000;let jumpPressAt=-9;
function zoneOf(q){if(state!=='plat'||q.y<PH-24)return null;const f=PB.F;if(q.sx>=f[0]-6&&q.sx<f[0]+f[2]+3&&q.sy>=PH-24)return 'F';return q.x<67?'L':q.x<137?'R':q.x<203?'F2':'J';}
function ptrDown(id,e){initAudio();const p=lp(e),q={x:p.x,y:p.y,px:p.x,py:p.y,sx:p.x,sy:p.y,z:null};ptrs[id]=q;taps.push(p);q.z=zoneOf(q);if(state==='hack')hackDown(q);if(state==='evade')evDown(q);if(q.z==='J')jumpPressAt=now();}
function ptrMove(id,e){const q=ptrs[id];if(!q)return;const p=lp(e);q.x=p.x;q.y=p.y;if(state==='hack')hackMove(q);if(state==='evade')evMove(q);const z=zoneOf(q);if(z==='J'&&q.z!=='J')jumpPressAt=now();q.z=z;}
function ptrUp(id,cancel){if(state==='hack'&&ptrs[id])hackUp(ptrs[id],cancel);delete ptrs[id];}
const TOUCH_OPT={passive:false};
addEventListener('touchstart',e=>{e.preventDefault();for(const t of e.changedTouches)ptrDown('t'+t.identifier,t);},TOUCH_OPT);
addEventListener('touchmove',e=>{e.preventDefault();for(const t of e.changedTouches)ptrMove('t'+t.identifier,t);},TOUCH_OPT);
addEventListener('touchend',e=>{e.preventDefault();for(const t of e.changedTouches)ptrUp('t'+t.identifier);},TOUCH_OPT);
addEventListener('touchcancel',e=>{for(const t of e.changedTouches)ptrUp('t'+t.identifier,true);},TOUCH_OPT);
const isMousePtr=e=>e.pointerType==='mouse'||e.pointerType==='pen'&&!('ontouchstart' in window);
addEventListener('pointerdown',e=>{if(!isMousePtr(e))return;e.preventDefault();try{cv.setPointerCapture(e.pointerId);}catch(_){}ptrDown('p'+e.pointerId,e);},TOUCH_OPT);
addEventListener('pointermove',e=>{if(!isMousePtr(e))return;ptrMove('p'+e.pointerId,e);},TOUCH_OPT);
addEventListener('pointerup',e=>{if(isMousePtr(e))ptrUp('p'+e.pointerId);});addEventListener('pointercancel',e=>{if(isMousePtr(e))ptrUp('p'+e.pointerId);});
addEventListener('blur',()=>{for(const k in ptrs)delete ptrs[k];for(const k in keys)keys[k]=false;});
['gesturestart','gesturechange','gestureend','dblclick','contextmenu','selectstart'].forEach(ev=>document.addEventListener(ev,e=>e.preventDefault(),TOUCH_OPT));
document.addEventListener('visibilitychange',()=>{if(document.hidden&&(state==='space'||state==='plat'||state==='hack'||state==='evade'))pause();});
let defaultAct=null,anyTap=null,BTN=[];
function onKey(c){if(c==='KeyM'){S.sound=S.sound?0:1;save();return;}
 if(state==='hack'&&!['Escape','KeyP'].includes(c))hackKey(c);if(state==='evade')evKey(c);
 if((c==='Escape'||c==='KeyP')){if(state==='space'||state==='plat'||state==='hack'||state==='evade')pause();else if(state==='pause')resume();return;}
 if((c==='Enter'||(c==='Space'&&state!=='plat'&&state!=='space'&&state!=='hack'&&state!=='evade'))&&defaultAct)pendingKey=true;}
let pendingKey=false;

// ---------- text/ui ----------
const FG={'A':'699F99','B':'E9E99E','C':'788887','D':'E9999E','E':'F8E88F','F':'F8E888','G':'78B997','H':'99F999','I':'E4444E','J':'111196','K':'9ACA99','L':'88888F','M':'9FF999','N':'9DDBB9','O':'699996','P':'E99E88','Q':'6999A5','R':'E99EA9','S':'78611E','T':'E44444','U':'999996','V':'999966','W':'999FF9','X':'996699','Y':'AAA444','Z':'F1248F','0':'69BD96','1':'4C444E','2':'69124F','3':'E1611E','4':'99F111','5':'F8E11E','6':'68E996','7':'F12444','8':'696996','9':'699716',' ':'000000','.':'000004',',':'000048',':':'040040',';':'040048','!':'444404','?':'692404',"'":'440000','"':'AA0000','-':'00E000','+':'04E400','/':'112488','(':'244442',')':'422224','%':'912489','<':'024842','>':'084248','=':'0E0E00','_':'00000F','#':'AFAFA0','*':'0A4A00','&':'4A4BA5','[':'644446',']':'622226','^':'4A0000'};const FCH=Object.keys(FG),FIX={};FCH.forEach((k,i)=>FIX[k]=i);const FAT={};
function fatlas(c,p){const k=c+p;if(FAT[k])return FAT[k];const cv=document.createElement('canvas');cv.width=FCH.length*5*p;cv.height=6*p;const x=cv.getContext('2d');x.fillStyle=c;FCH.forEach((ch,i)=>{const g=FG[ch];for(let r=0;r<6;r++){const b=parseInt(g[r],16);for(let q=0;q<4;q++)if(b&(8>>q))x.fillRect((i*5+q)*p,r*p,p,p);}});return FAT[k]=cv;}
function fpx(sz){return Math.max(1,Math.round(sz*RQ/7));}
function tw(s,sz){return (String(s).length*5-1)*fpx(sz)/RQ;}
function txt(s,x,y,c='#fff',sz=8,al='center'){s=String(s).toUpperCase();const p=fpx(sz),L=p/RQ,w=(s.length*5-1)*L;if(al==='center')x-=w/2;else if(al==='right')x-=w;x=Math.round(x*RQ)/RQ;y=Math.round(y*RQ)/RQ;const sh=fatlas('#000',p),fa=fatlas(c,p);for(let pass=0;pass<2;pass++){const a=pass?fa:sh,o=pass?0:L;for(let i=0;i<s.length;i++){let j=FIX[s[i]];if(j==null)j=FIX['?'];ctx.drawImage(a,j*5*p,0,4*p,6*p,x+i*5*L+o,y+o,4*L,6*L);}}}
function wrap(s,mw,sz){const out=[];let line='';for(const w of s.split(' ')){const t=line?line+' '+w:w;if(tw(t,sz)>mw&&line){out.push(line);line=w;}else line=t;}if(line)out.push(line);return out;}

// ---------- UI frames: chamfered metal bezel, tinted glass, corner brackets; cached per size/colour/state ----------
const UIC={};function uiArt(w,h,col,kind,on){const key=w+'x'+h+col+kind+(on?1:0);if(UIC[key])return UIC[key];const [c,x]=cnv(w,h),k=kind==='panel'?5:3;
 const P=(i)=>{x.beginPath();x.moveTo(i+k,i);x.lineTo(w-i-k,i);x.lineTo(w-i,i+k);x.lineTo(w-i,h-i-k);x.lineTo(w-i-k,h-i);x.lineTo(i+k,h-i);x.lineTo(i,h-i-k);x.lineTo(i,i+k);x.closePath();};
 const rgb=[1,3,5].map(i=>parseInt(col.slice(i,i+2),16)),tint=(a,m=1)=>`rgba(${rgb.map(v=>Math.round(v*m)).join(',')},${a})`;
 P(0);x.fillStyle='#04050c';x.fill();
 P(1);let g=x.createLinearGradient(0,0,0,h);g.addColorStop(0,'#3a4258');g.addColorStop(0.5,'#20263a');g.addColorStop(1,'#12162a');x.fillStyle=g;x.fill();
 P(2.5);g=x.createLinearGradient(0,0,0,h);if(kind==='panel'){g.addColorStop(0,'rgba(14,20,44,0.97)');g.addColorStop(1,'rgba(5,8,20,0.97)');}else{g.addColorStop(0,on?tint(0.55,0.7):'#152048');g.addColorStop(0.5,on?tint(0.4,0.5):'#0c1434');g.addColorStop(1,on?tint(0.35,0.35):'#070b22');}x.fillStyle=g;x.fill();
 x.save();P(2.5);x.clip();x.fillStyle=tint(kind==='panel'?0.05:0.08);for(let yy=3;yy<h;yy+=2)x.fillRect(0,yy,w,0.5);
 x.fillStyle='rgba(255,255,255,'+(kind==='panel'?0.05:on?0.06:0.12)+')';x.fillRect(0,0,w,kind==='panel'?Math.min(14,h*0.25):h*0.42);
 x.fillStyle='rgba(0,0,0,0.35)';x.fillRect(0,h-4,w,2);x.restore();
 x.strokeStyle=tint(on?1:0.85);x.lineWidth=0.5;P(3.25);x.stroke();x.lineWidth=1;
 x.fillStyle='rgba(255,255,255,0.35)';x.fillRect(k+1,1,w-2*k-2,0.5);
 x.fillStyle=col;const L2=kind==='panel'?10:Math.min(6,w/4);for(const[sx,sy]of[[1,1],[-1,1],[1,-1],[-1,-1]]){const ox=sx>0?2:w-2,oy=sy>0?2:h-2;x.fillRect(sx>0?ox+k-1:ox-k+1-L2,sy>0?oy-0.5:oy-0.5,L2,1);x.fillRect(sx>0?ox-0.5:ox-0.5,sy>0?oy+k-1:oy-k+1-L2,1,L2);}
 if(kind==='panel'){x.fillStyle='#5a6480';for(const[a,b]of[[9,h-3.5],[w-10,h-3.5],[9,2.5],[w-10,2.5]])x.fillRect(a,b,1,1);x.fillStyle=tint(0.5);x.fillRect(w/2-12,h-2,24,1);}
 return UIC[key]=c;}
function btn(label,x,y,w,h,cb,col='#5ab0ff',dis=false){if(dis){ctx.fillStyle='#0c0e1a';ctx.fillRect(x,y,w,h);ctx.strokeStyle='#2a2f45';ctx.strokeRect(x+.5,y+.5,w-1,h-1);}else blit(uiArt(w,h,col,'btn',0),x,y,w,h);txt(label,x+w/2,y+h/2-4,dis?'#555b77':col,8);if(!dis)BTN.push({x,y,w,h,cb});}
function handleTaps(){let done=false;for(const t of taps){if(done)break;for(const b of BTN){if(t.x>=b.x&&t.x<=b.x+b.w&&t.y>=b.y&&t.y<=b.y+b.h){SFX.select();b.cb();done=true;break;}}if(!done&&anyTap){const f=anyTap;f();done=true;}}
 if(pendingKey&&!done&&defaultAct){defaultAct();}pendingKey=false;taps=[];}

// ---------- danger projectiles vs. loot (kept visually separate; see test_palette.py) ----------
// Enemy shots: red/magenta family only, dark outline, bright core, spiky 2-frame flicker + trail.
const DANGER=['#ff2a4a','#ff2a8a','#ff3ad0','#e8205a','#ff1a2a'];// per space boss level d1..d5; on foot uses DANGER_FOOT
const DANGER_FOOT='#ff2a6a';
function mkEB(col){// 22x22 art (2 per logical px): spiked plasma orb, 4 frames of rotating spikes and a pulsing core
 const C=[parseInt(col.slice(1,3),16),parseInt(col.slice(3,5),16),parseInt(col.slice(5,7),16)],mx=(a,b,t)=>a.map((v,i)=>Math.round(v+(b[i]-v)*t)),fr=[];
 for(let f=0;f<4;f++){const c=document.createElement('canvas');c.width=c.height=22;c.r=2;const x=c.getContext('2d'),im=x.createImageData(22,22),d=im.data,rot=f/4*Math.PI/3,pul=[0,0.6,1,0.6][f];
  const inside=(px,py)=>{const dx=px-11,dy=py-11,r=Math.hypot(dx,dy),a=Math.atan2(dy,dx)+rot,sp=Math.pow(Math.max(0,Math.cos(a*3)),6);return r<5.2+sp*4.6;};
  for(let py=0;py<22;py++)for(let px=0;px<22;px++){const X=px+0.5,Y=py+0.5,r=Math.hypot(X-11,Y-11);let v=null;
   if(inside(X,Y)){if(r<1.6+pul*0.7)v=[255,255,255];else if(r<3.2+pul*0.4)v=mx(C,[255,255,255],0.62);else if(r<4.6)v=C;else{const sx=X-11,sy=Y-11;v=(sx+sy<0)?mx(C,[255,255,255],0.25):mx(C,[40,0,16],0.35);}}
   else if(inside(X-1,Y)||inside(X+1,Y)||inside(X,Y-1)||inside(X,Y+1))v=[26,0,8];
   if(v){const i=(py*22+px)*4;d[i]=v[0];d[i+1]=v[1];d[i+2]=v[2];d[i+3]=255;}}
  x.putImageData(im,0,0);fr.push(c);}return fr;}
const EBS={};function ebSpr(col){return EBS[col]||(EBS[col]=mkEB(col));}
function drawEB(u,col,t,cam=0){const sp=Math.hypot(u.vx,u.vy)||1,tx=u.vx/sp,ty=u.vy/sp,x=u.x-cam,y=u.y;
 ctx.globalAlpha=0.55;ctx.fillStyle=col;for(let i=1;i<=3;i++){ctx.fillRect(Math.round(x-tx*i*3)-1,Math.round(y-ty*i*3)-1,2,2);ctx.globalAlpha-=0.15;}ctx.globalAlpha=1;
 const f=ebSpr(col)[((t*14+u.x*0.05)|0)&3];glowS(x,y,7,col,0.55);blit(f,Math.round(x-5),Math.round(y-5),11,11);}
// Coins: gold spinning coin (4-frame edge-on rotation) with a glint; never red.
const COIN=ART.coin;
function drawCoin(x,y,t,seed){const f=COIN[((t*12+seed)|0)%8];blit(f,Math.round(x-4),Math.round(y-4),9,9);if(((t*3+seed*0.37)%2)<0.15){ctx.fillStyle='#ffffff';ctx.fillRect(Math.round(x+2),Math.round(y-5),1,3);ctx.fillRect(Math.round(x+1),Math.round(y-4),3,1);}}
// ---------- fx helpers ----------
const GLW={};function glowS(x,y,r,c,a){if(r<=0||a<=0)return;let g=GLW[c];if(!g){const [cc,x2]=cnv(32,32);const gr=x2.createRadialGradient(16,16,0,16,16,16);gr.addColorStop(0,c);gr.addColorStop(0.35,c+'88');gr.addColorStop(1,c+'00');x2.fillStyle=gr;x2.fillRect(0,0,32,32);g=GLW[c]=cc;}
 ctx.globalCompositeOperation='lighter';ctx.globalAlpha=Math.min(1,a);ctx.drawImage(g,x-r*2,y-r*2,r*4,r*4);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';}
function glow(x,y,r,c,a){if(c.length===7){glowS(x,y,r,c,a*1.4);return;}ctx.globalCompositeOperation='lighter';ctx.globalAlpha=a;ctx.fillStyle=c;ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.fill();ctx.globalAlpha=a*0.6;ctx.beginPath();ctx.arc(x,y,r*0.55,0,7);ctx.fill();ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';}
const NEB={};function nebula(L){if(NEB[L.name])return NEB[L.name];const c=document.createElement('canvas');c.width=W/2;c.height=H/2;const x=c.getContext('2d'),r=rng(L.name.length*97+L.d);
 const cols=[L.sky[1],'#3a1a6a','#0a4a6a','#6a1a3a'];for(let i=0;i<14;i++){const cx=r()*W/2,cy=r()*H/2,rad=20+r()*60,g=x.createRadialGradient(cx,cy,0,cx,cy,rad);g.addColorStop(0,cols[i%4]);g.addColorStop(1,'rgba(0,0,0,0)');x.globalAlpha=0.35;x.fillStyle=g;x.fillRect(0,0,W/2,H/2);}
 // dither to keep it pixel-ish
 const im=x.getImageData(0,0,W/2,H/2),d=im.data;for(let i=0;i<d.length;i+=4){const q=((i/4)%2+((i/4/(W/2))|0)%2)%2?6:-6;d[i]=d[i]+q&~15;d[i+1]=d[i+1]+q&~15;d[i+2]=d[i+2]+q&~15;}x.putImageData(im,0,0);return NEB[L.name]=c;}
function drawFx(list,cam=0){for(const f of list){if(f.sheet){const fi=Math.min(7,Math.floor((1-f.l/f.L)*8));blit(f.sheet[fi],Math.round(f.x-cam-f.sz/2),Math.round(f.y-f.sz/2),f.sz,f.sz);continue;}if(f.ring){const a=Math.max(0,f.l/0.4);ctx.strokeStyle=`rgba(255,220,150,${a})`;ctx.lineWidth=2;ctx.beginPath();ctx.arc(f.x-cam,f.y,(0.4-f.l)*f.R,0,7);ctx.stroke();ctx.lineWidth=1;}else{ctx.globalAlpha=Math.min(1,f.l*3);ctx.fillStyle=f.c;const z=f.s||2;ctx.fillRect(f.x-cam|0,f.y|0,z,z);ctx.globalAlpha=1;}}}
function panel(x,y,w,h,col='#5ab0ff'){blit(uiArt(Math.round(w),Math.round(h),col,'panel',0),x,y,Math.round(w),Math.round(h));}
// ---------- stars ----------
const STARS=[];for(let i=0;i<90;i++)STARS.push({x:rnd(0,W),y:rnd(0,H),z:ri(1,3)});
function stars(dt,speed=1){for(const s of STARS){s.y+=s.z*s.z*12*dt*speed;if(s.y>H){s.y=0;s.x=rnd(0,W);}ctx.fillStyle=s.z===3?((T*3+s.x)|0)%7===0?'#9ad0ff':'#fff':s.z===2?'#8aa0d0':'#44507a';ctx.fillRect(s.x|0,s.y|0,s.z===3?2:1,s.z===3?2:1);}}

// ---------- state ----------
let state='title',curLvl=0,G=null,runCr=0,stT=0,clearInfo=null,overT=0;
const god=()=>window.VR&&VR.god;
function newGame(){const snd=S.sound;S=Object.assign({},DEF,{sound:snd});save();goStory(0);}
function portrait(k,x,y,t){const c=SPK[k]||'#8aa0d0';blit(uiArt(38,38,c,'btn',0),x,y,38,38);const img=ART.portrait(k)||PORT[k];if(img){const bob=k==='OTT'&&(t*3|0)%7===0?1:0;draw(img,x+19,y+19+bob,img.r===2?1:2);if(k==='OTT'){ctx.fillStyle='rgba(0,0,0,0.25)';for(let i=0;i<34;i+=2)ctx.fillRect(x+4,y+3+i,30,0.5);}}ctx.fillStyle=c;ctx.fillRect(x,y,3,3);ctx.fillRect(x+35,y+35,3,3);}
const HEART=(()=>{const f=hi(spr(["hh.hh","hmhhh","hhhhh",".hhh.","..h.."])),e=hi(spr(["gg.gg","gnggg","ggggg",".ggg.","..g.."]));return [e,f];})();
function hudTop(lbl,hp,mhp){const g=ctx.createLinearGradient(0,0,0,20);g.addColorStop(0,'rgba(4,6,16,0.85)');g.addColorStop(1,'rgba(4,6,16,0)');ctx.fillStyle=g;ctx.fillRect(0,0,W,20);txt(lbl,4,5,'#8aa0d0',7,'left');for(let i=0;i<mhp;i++){const b=i===hp-1&&hp<=2?Math.sin(T*12)*0.5:0;draw(HEART[i<hp?1:0],31+i*8,8+b,1);}}
function gfxBtns(x,y){btn('GFX: '+(RQ===1?'LOW':'HIGH'),x,y,73,22,()=>{S.q=RQ===1?'hi':'lo';save();location.reload();},'#8aa0d0');btn('CRT: '+(S.crt?'ON':'OFF'),x+77,y,73,22,()=>{S.crt=S.crt?0:1;save();},'#8aa0d0');}
let fadeT=0,prevState='';const VIG=(()=>{const [c,x]=cnv(W,H),g=x.createRadialGradient(W/2,H/2,H*0.28,W/2,H/2,H*0.62);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,8,0.55)');x.fillStyle=g;x.fillRect(0,0,W,H);return c;})();
const SCAN=(()=>{const c=document.createElement('canvas');c.width=W*RQ;c.height=H*RQ;const x=c.getContext('2d');x.fillStyle='rgba(0,0,0,0.28)';for(let y=0;y<c.height;y+=RQ*2)x.fillRect(0,y,c.width,RQ);return c;})();
function postFX(dt){if(state!==prevState){if(!(state==='pause'||prevState==='pause'||state==='clear'||state==='over'))fadeT=1;prevState=state;}
 if(RQ>1||S.crt)blit(VIG,0,0,W,H);if(S.crt){ctx.drawImage(SCAN,0,0,W,H);ctx.fillStyle='rgba(90,176,255,0.03)';ctx.fillRect(0,0,W,H);}
 if(fadeT>0){fadeT=Math.max(0,fadeT-dt*3.5);ctx.fillStyle='rgba(3,4,10,'+fadeT.toFixed(3)+')';ctx.fillRect(0,0,W,H);}}
function goStory(i){state='story';curLvl=i;stT=0;const L=LV[i];if(L&&L.t==='space')setTimeout(()=>ART.boss(L.d,!!L.final),60);}
function startLevel(i){curLvl=i;runCr=0;const L=LV[i];if(L.t==='space')initSpace(L);else if(L.t==='hack')initHack(L);else if(L.t==='evade')initEvade(L);else initPlat(L);stT=0;}
function pause(){if(state!=='space'&&state!=='plat'&&state!=='hack'&&state!=='evade')return;G.prev=state;state='pause';}
function resume(){state=G.prev;}
function levelClear(){const L=LV[curLvl];const bonus=40*L.d+(S.ng?20:0);S.cr+=runCr+bonus;clearInfo={got:runCr,bonus};S.lvl=Math.max(S.lvl,curLvl+1);save();SFX.win();state='clear';stT=0;}
function failLevel(){state='over';stT=0;}

// ---------- SPACE ----------
const ET={drone:{hp:2,r:7,cr:2},weaver:{hp:2,r:7,cr:2},kami:{hp:1,r:5,cr:3},gun:{hp:10,r:11,cr:8},rock:{hp:4,r:9,cr:1}};
function makeWaves(L){const d=L.d,w=[],len=L.final?25:35+d*8;const pool=['drone','weaver','rock'];if(d>=2)pool.push('kami');if(d>=3)pool.push('gun');if(d>=4)pool.push('gun','kami','weaver');let t=2;while(t<len){w.push({t,k:pool[ri(0,pool.length-1)]});t+=Math.max(1.0,3.0-d*0.4)+rnd(0,1);}for(let i=1;i<d;i++)w.push({t:len*i/d,k:'gun'});w.sort((a,b)=>a.t-b.t);return{list:w,len};}
function initSpace(L){ART.boss(L.d,!!L.final);const mh=2+S.hull*2;G={mode:'space',L,d:L.d+(S.ng?1:0),t:0,p:{x:W/2,y:H-70,hp:mh,mhp:mh,sh:S.shield*2,msh:S.shield*2,inv:1.5,ft:0,shT:9},bul:[],eb:[],en:[],fx:[],coins:[],waves:makeWaves(L),boss:null,endT:0,shake:0,dead:0};state='space';}
function mkE(k,x,y,o={}){const t=ET[k],m=1+(G.d-1)*0.35;const e=Object.assign({k,x,y,x0:x,hp:Math.ceil(t.hp*m),r:t.r,cr:t.cr,t:0,ph:rnd(0,6),fl:0,ft:rnd(0.5,1.5),ty:rnd(70,170),vx:rnd(-20,20),vy:rnd(40,70),rot:0},o);G.en.push(e);}
function spawnWave(k){const d=G.d;if(k==='drone'){const n=Math.min(7,3+d),cx=rnd(60,W-60);for(let i=0;i<n;i++){const o=i-(n-1)/2;mkE('drone',clamp(cx+o*22,12,W-12),-10-Math.abs(o)*14);}}
 else if(k==='weaver'){const n=4+d,x=rnd(55,W-55);for(let i=0;i<n;i++)mkE('weaver',x,-10-i*22,{ph:0});}
 else if(k==='rock'){for(let i=0;i<2+ri(0,d);i++)mkE('rock',rnd(20,W-20),-10-rnd(0,60));}
 else if(k==='kami'){for(let i=0;i<2+Math.floor(d/2);i++)mkE('kami',rnd(20,W-20),-10-i*25);}
 else if(k==='gun')mkE('gun',rnd(40,W-40),-15);}
function aimed(e,n,spd){const P=G.p,a=Math.atan2(P.y-e.y,P.x-e.x);spd=spd||(90+G.d*12);for(let i=0;i<n;i++){const aa=a+(i-(n-1)/2)*0.25;G.eb.push({x:e.x,y:e.y,vx:Math.cos(aa)*spd,vy:Math.sin(aa)*spd,r:3});}}
function ring(x,y,n,spd,off=0){for(let i=0;i<n;i++){const a=off+i/n*Math.PI*2;G.eb.push({x,y,vx:Math.cos(a)*spd,vy:Math.sin(a)*spd,r:3});}}
function boom(x,y,n,cols){G.fx.push({x,y,ring:1,l:0.4,R:n*3+20});G.fx.push({x,y,vx:0,vy:0,sheet:ART.boom,l:0.55,L:0.55,sz:Math.min(64,16+n*1.4)});for(let i=0;i<n*0.6;i++){const a=rnd(0,7),s=rnd(20,140);G.fx.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,l:rnd(.3,.8),c:cols[ri(0,cols.length-1)],s:ri(1,3)});}for(let i=0;i<n/3;i++)G.fx.push({x:x+rnd(-5,5),y:y+rnd(-5,5),vx:rnd(-15,15),vy:rnd(-15,15),l:rnd(.5,1),c:'#4a4a5a',s:3});}
const FIRE=['#fff','#ffd23a','#ff6a3a','#ff3a6a'];
function dropCoins(x,y,cr){for(let i=0;i<Math.ceil(cr/2);i++)G.coins.push({x:x+rnd(-8,8),y:y+rnd(-8,8),v:2,k:'c',vy:rnd(-30,10),vx:rnd(-20,20)});if(Math.random()<0.04)G.coins.push({x,y,v:0,k:'hp',vy:0,vx:0});}
function pfire(){const p=G.p,g=S.sg,pu=G.pu&&G.pu.k;p.ft=[0,.22,.2,.17,.15,.12][g]*(pu==='rapid'?0.45:1);const B=(x,a,dm=1)=>G.bul.push({x:p.x+x,y:p.y-8,vx:Math.sin(a)*380,vy:-Math.cos(a)*380,dm,pierce:pu==='laser',c:pu==='laser'?'#7affff':pu==='rapid'?'#5ad0ff':'#bfe8ff',hits:[]});
 if(pu==='spread'){B(-6,-.35);B(6,.35);B(-8,-.6);B(8,.6);}
 if(pu==='homing'&&(p.hc=(p.hc||0)+1)%2===0){for(const s of[-1,1])G.bul.push({x:p.x+s*8,y:p.y,vx:s*120,vy:-160,dm:2,home:1,c:'#9aff5a',hits:[]});}
 if(pu==='laser')tone(1800,900,.07,'sawtooth',.02);else if(pu==='homing')tone(500,900,.05,'triangle',.03);
 if(g===1)B(0,0);else if(g===2){B(-4,0);B(4,0);}else{B(-4,0);B(4,0);B(-6,-.2);B(6,.2);if(g>=4)B(0,0,g===5?2:1);if(g===5){B(-7,-.4);B(7,.4);}}SFX.shoot();}
function shakeT(s){if(s>0){const a=Math.min(3.5,s*12);ctx.translate(Math.sin(T*91)*a,Math.cos(T*73)*a);}}
function spark(x,y,cam){for(let i=0;i<5;i++){const a=rnd(0,7),v=rnd(60,160);G.fx.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,l:rnd(.08,.2),c:i%2?'#ffffff':'#bfe8ff',s:1,gl:1});}}
function pBullets(cam,plat){for(const u of G.bul){const x=u.x-cam,y=u.y;if(!u.mf){u.mf=1;glow(x,y+(plat?0:-2),plat?7:6,'#bfe8ff',0.9);}
 if(plat){glow(x,y,u.big?7:4,u.c.length===7?u.c:'#5ab0ff',0.45);ctx.fillStyle=u.c;if(u.big)ctx.fillRect(x-4,y-3,8,6);else ctx.fillRect(x-3,y-1,6,2);ctx.fillStyle='#fff';ctx.fillRect(x-1,y-0.5,2,1);}
 else{glow(x,y,u.pierce?7:4,u.c.length===7?u.c:'#5ab0ff',0.45);ctx.fillStyle=u.c;if(u.pierce)ctx.fillRect(x-1.5,y-8,3,12);else if(u.home)ctx.fillRect(x-2,y-2,4,4);else ctx.fillRect(x-1,y-4,2,7);ctx.fillStyle='#fff';ctx.fillRect(x-0.5,y-3,1,3);}}}
const PLANET={};function planet(L){const k=L.name;if(PLANET[k])return PLANET[k];const [c,x]=cnv(90,90),hu=[...k].reduce((a,ch)=>a+ch.charCodeAt(0),0);const cols=[['#3a5aa8','#1a2858','#8ab0ff'],['#a85a3a','#58281a','#ffb08a'],['#5aa86a','#1a4a28','#b0ffb8'],['#7a4aa8','#2a1858','#d0a0ff']][hu%4];
 const g=x.createRadialGradient(34,34,4,45,45,40);g.addColorStop(0,cols[2]);g.addColorStop(0.45,cols[0]);g.addColorStop(1,cols[1]);x.fillStyle=g;x.beginPath();x.arc(45,45,36,0,7);x.fill();
 x.globalCompositeOperation='source-atop';for(let i=0;i<9;i++){x.fillStyle='rgba(0,0,0,0.12)';x.fillRect(0,14+i*7+((hu*i)%5),90,2+(i%3));}for(let i=0;i<300;i++){if((i*hu)%3)continue;x.fillStyle='rgba(255,255,255,0.06)';x.fillRect((i*37)%90,(i*53)%90,1,1);}
 x.globalCompositeOperation='source-over';if(hu%2){x.strokeStyle='rgba(220,230,255,0.35)';x.lineWidth=2;x.beginPath();x.ellipse(45,47,44,9,-0.25,0,7);x.stroke();}return PLANET[k]=c;}
const DARK={};function darkness(px,py,a,r){const k=a+'_'+r;let c=DARK[k];if(!c){const [cc,x]=cnv(W*2,H*2);x.fillStyle=`rgba(2,3,10,${a})`;x.fillRect(0,0,W*2,H*2);x.globalCompositeOperation='destination-out';const g=x.createRadialGradient(W,H,r*0.3,W,H,r);g.addColorStop(0,'rgba(0,0,0,1)');g.addColorStop(0.7,'rgba(0,0,0,0.6)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(W-r,H-r,r*2,r*2);c=DARK[k]=cc;}blit(c,Math.round(px-W),Math.round(py-H),W*2,H*2);}
const AMB=[];for(let i=0;i<(RQ>1?36:16);i++)AMB.push({x:Math.random()*W,y:Math.random()*480,z:Math.random()*0.8+0.2,p:Math.random()*7});
function ambient(c,vy,cam,dt,h){ctx.fillStyle=c;for(const m of AMB){m.y+=vy*m.z*dt;m.p+=dt;if(m.y<0)m.y+=h;if(m.y>h)m.y-=h;const x=((m.x-cam*m.z*0.6)%W+W)%W+Math.sin(m.p*1.3)*3;ctx.globalAlpha=0.25+0.35*m.z*(0.6+0.4*Math.sin(m.p*3));ctx.fillRect(x,m.y,m.z>0.7?1.5:1,m.z>0.7?1.5:1);}ctx.globalAlpha=1;}
const FORE={};function fore(L){const k=L.name;if(FORE[k])return FORE[k];const [c,x]=cnv(540,40);x.fillStyle='rgba(4,5,12,0.92)';if(L.ceil){for(let i=0;i<540;i+=6){const h=(i*37)%11;if(h>6)x.fillRect(i,0,2,h+4);}}else{for(let i=0;i<540;i+=3){const h=((i*53)%9);x.fillRect(i,40-h-4,2,h+4);if(h>6){x.fillRect(i-2,40-h-1,6,2);}}}return FORE[k]=c;}
const SHIP_HW=18,SHIP_HB=24;// ship half width; centre-to-bottom incl. flames
let HS=0;function hurt(){const p=G.mode==='space'?G.p:G.p;if(p.inv>0||god()||G.dead)return;p.inv=1;p.shT=0;G.shake=0.25;HS=0.05;SFX.hurt();if(G.mode==='space'&&p.sh>=1){p.sh-=1;return;}p.hp--;if(p.hp<=0){G.dead=1.4;if(G.mode==='space')boom(p.x,p.y,40,FIRE);SFX.big();}}
const BOSS_HPK=[1.7,1.6,1.05,1.85,1.15];// damage-rate ratio new mask vs old box, measured by .tmp/bossrate.py (sweeping player)
function spawnBoss(){const L=G.L,d=L.d,fin=!!L.final;const w=fin?30:18+d*2,h=fin?22:13+d;
 const cols=[['#ff4a6a','#aa2244','#ffd23a','#200810'],['#ffa03a','#a0501a','#5ad0ff','#201008'],['#5affc0','#228866','#ff5ae0','#082018'],['#c05aff','#5a2aaa','#9aff5a','#100820'],['#ff2a4a','#5a0a2a','#ffffff','#000000']][d-1];
 const art=ART.boss(d,fin),img=art.frames[0][0];const sc=3,hp=Math.round((fin?700:50+d*50+(S.ng?100:0))*BOSS_HPK[fin?4:d-1]);
 G.boss={x:W/2,y:-art.H/2,img,art,flash:0,sc,w:(w+2)*sc,h:(h+2)*sc,hp,mhp:hp,t:0,ph:0,ft:1.5,burst:0,bt:0,fin,name:fin?'THE VOID HEART':['HOLLOW REAVER','CINDER MAW','MOTHERSHIP','RIFT WARDEN'][d-1]};}
function updSpace(dt){const p=G.p;G.t+=dt;G.shake=Math.max(0,G.shake-dt);
 if(G.dead){G.dead-=dt;if(G.dead<=0){failLevel();return;}}
 else{let mx=0,my=0;if(keys.ArrowLeft||keys.KeyA)mx--;if(keys.ArrowRight||keys.KeyD)mx++;if(keys.ArrowUp||keys.KeyW)my--;if(keys.ArrowDown||keys.KeyS)my++;const sp=110+S.speed*25;p.x+=mx*sp*dt;p.y+=my*sp*dt;
  for(const id in ptrs){const q=ptrs[id];p.x+=(q.x-q.px)*1.4;p.y+=(q.y-q.py)*1.4;}
  p.x=clamp(p.x,SHIP_HW,W-SHIP_HW);p.y=clamp(p.y,40,H-SHIP_HB);p.inv=Math.max(0,p.inv-dt);p.ft-=dt;if(p.ft<=0)pfire();
  p.shT+=dt;if(p.shT>2.5&&p.sh<p.msh)p.sh=Math.min(p.msh,p.sh+dt*0.5);}
 if(G.boss&&!G.endT&&!G.dead&&bossTouch(G.boss,p))hurt();
 const wv=G.waves;while(wv.list.length&&wv.list[0].t<=G.t)spawnWave(wv.list.shift().k);
 if(!G.boss&&!G.endT&&G.t>wv.len&&!wv.list.length&&G.en.length===0)spawnBoss();
 const d=G.d;
 for(const e of G.en){e.t+=dt;e.fl=Math.max(0,e.fl-dt);switch(e.k){
  case 'drone':e.y+=(55+d*8)*dt;if(d>=3){e.ft-=dt;if(e.ft<=0&&e.y>20&&e.y<H*0.6){e.ft=3;aimed(e,1);}}break;
  case 'weaver':e.y+=(45+d*6)*dt;e.x=e.x0+Math.sin(e.t*2.5+e.ph)*45;break;
  case 'kami':if(e.t<1)e.y+=60*dt;else{if(!e.lock){const a=Math.atan2(p.y-e.y,p.x-e.x),s=130+d*15;e.vx=Math.cos(a)*s;e.vy=Math.sin(a)*s;e.lock=1;}e.x+=e.vx*dt;e.y+=e.vy*dt;}break;
  case 'gun':if(e.t>11)e.y+=90*dt;else if(e.y<e.ty)e.y+=60*dt;else e.x=clamp(e.x+Math.sin(e.t*1.3)*40*dt,15,W-15);e.ft-=dt;if(e.ft<=0&&e.y>10&&e.t<11){e.ft=Math.max(0.8,2-d*0.25);aimed(e,d>=4?3:1);}break;
  case 'rock':e.x+=e.vx*dt;e.y+=e.vy*dt;e.rot+=dt*2;break;}
  if(!G.dead&&Math.hypot(e.x-p.x,e.y-p.y)<e.r+5){hurt();if(e.k!=='gun'){e.hp=0;e.dead=1;boom(e.x,e.y,12,FIRE);}}}
 const b=G.boss;
 if(b&&!G.endT){b.t+=dt;b.flash=Math.max(0,b.flash-dt);if(b.y<95)b.y+=40*dt;else b.x=W/2+Math.sin(b.t*0.6)*(W/2-b.w/2-4);
  const rage=b.hp<b.mhp/2;b.ft-=dt;
  if(b.burst>0){b.bt-=dt;if(b.bt<=0){b.bt=0.12;b.burst--;aimed({x:b.x,y:b.y+b.h*0.3},1,150+d*10);}}
  if(b.fin&&rage){b.st=(b.st||0)-dt;if(b.st<=0){b.st=0.09;const a=b.t*2.7;G.eb.push({x:b.x,y:b.y,vx:Math.cos(a)*95,vy:Math.sin(a)*95,r:3});G.eb.push({x:b.x,y:b.y,vx:-Math.cos(a)*95,vy:-Math.sin(a)*95,r:3});}}
  if(b.ft<=0&&b.y>=60){b.ph=(b.ph+1)%(d>=3?4:3);
   if(b.ph===0){aimed({x:b.x,y:b.y+b.h*0.3},3+Math.min(d,4),110);b.ft=1.2;}
   else if(b.ph===1){ring(b.x,b.y,10+d*2,85,b.t);b.ft=1.4;}
   else if(b.ph===2){b.burst=5+d;b.ft=1.6;}
   else{mkE('kami',b.x-b.w/3,b.y);mkE('kami',b.x+b.w/3,b.y);b.ft=1.2;}
   if(rage)b.ft*=0.7;}
  if(!G.dead&&Math.abs(p.x-b.x)<b.w*0.4&&Math.abs(p.y-b.y)<b.h*0.38)hurt();}
 for(const u of G.bul){if(u.home){let tg=b&&!G.endT?b:null,bd=1e9;for(const e of G.en){const dd=Math.hypot(e.x-u.x,e.y-u.y);if(dd<bd){bd=dd;tg=e;}}if(tg){const a=Math.atan2(tg.y-u.y,tg.x-u.x),sp=Math.min(320,Math.hypot(u.vx,u.vy)+400*dt),ca=Math.atan2(u.vy,u.vx);let da=a-ca;while(da>Math.PI)da-=2*Math.PI;while(da<-Math.PI)da+=2*Math.PI;const na=ca+clamp(da,-6*dt,6*dt);u.vx=Math.cos(na)*sp;u.vy=Math.sin(na)*sp;}if(Math.random()<.5)G.fx.push({x:u.x,y:u.y,vx:0,vy:0,l:.15,c:'#6a8a5a'});}
  u.x+=u.vx*dt;u.y+=u.vy*dt;
  for(const e of G.en){if(!e.dead&&!u.hits.includes(e)&&Math.hypot(e.x-u.x,e.y-u.y)<e.r+3){e.hp-=u.dm;e.fl=0.06;spark(u.x,u.y,0);if(u.pierce)u.hits.push(e);else u.dead=1;SFX.hit();if(e.hp<=0){e.dead=1;boom(e.x,e.y,14,FIRE);SFX.boom();dropCoins(e.x,e.y,e.cr);puDrop(G.coins,e.x,e.y,e.k==='gun'?0.4:e.k==='kami'?0.1:0.06,PU_SPACE);}break;}}
  if(!u.dead&&b&&!G.endT&&!u.hits.includes(b)&&bossHit(b,u.x,u.y)){if(u.pierce)u.hits.push(b);else u.dead=1;b.hp-=u.dm*(bossCore(b,u.x,u.y)?2:1);b.flash=0.05;spark(u.x,u.y,0);if(b.hp<=0){G.endT=3;G.eb=[];SFX.big();G.shake=0.6;runCr+=50*d;for(let i=0;i<6;i++)boom(b.x+rnd(-b.w/2,b.w/2),b.y+rnd(-b.h/2,b.h/2),20,FIRE);}}}
 if(G.endT){G.endT-=dt;if(b&&Math.random()<0.3)boom(b.x+rnd(-b.w/2,b.w/2),b.y+rnd(-b.h/2,b.h/2),6,FIRE);if(G.endT<=0){G.endT=0;G.boss=null;levelClear();return;}}
 for(const u of G.eb){u.x+=u.vx*dt;u.y+=u.vy*dt;if(!G.dead&&Math.hypot(u.x-p.x,u.y-p.y)<u.r+3){u.dead=1;hurt();}}
 for(const c of G.coins){const dx=p.x-c.x,dy=p.y-c.y,dd=Math.hypot(dx,dy);if(dd<70&&!G.dead){c.x+=dx/dd*220*dt;c.y+=dy/dd*220*dt;}else{c.vy=Math.min(c.vy+60*dt,60);c.x+=c.vx*dt;c.y+=c.vy*dt;}if(dd<12&&!G.dead){c.dead=1;if(c.k==='pu')givePU(c.w);else if(c.k==='hp')p.hp=Math.min(p.mhp,p.hp+1);else runCr+=c.v;if(c.k!=='pu')SFX.coin();}if(c.k==='pu'){c.life-=dt;if(c.life<=0)c.dead=1;}}
 if(G.pu){G.pu.t-=dt;if(G.pu.t<=0)G.pu=null;}
 for(const f of G.fx){f.x+=f.vx*dt;f.y+=f.vy*dt;f.l-=dt;}
 const off=o=>o.y>H+30||o.y<-140||o.x<-40||o.x>W+40;
 G.en=G.en.filter(e=>!e.dead&&!off(e));G.bul=G.bul.filter(u=>!u.dead&&u.y>-10&&u.y<H+10&&u.x>-10&&u.x<W+10);G.eb=G.eb.filter(u=>!u.dead&&!off(u));G.coins=G.coins.filter(c=>!c.dead&&c.y<H+10);G.fx=G.fx.filter(f=>f.l>0);}
// boss collision uses the art's alpha mask at logical resolution (1 cell = 1 logical px)
function bossMask(art){if(art.mask)return art.mask;const c=art.rest||art.frames[0][0],w=c.width>>1,h=c.height>>1,d=c.getContext('2d').getImageData(0,0,c.width,c.height).data,m=new Uint8Array(w*h);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){let a=0;for(let j=0;j<2;j++)for(let i=0;i<2;i++)a+=d[((y*2+j)*c.width+x*2+i)*4+3]>0;m[y*w+x]=a>=2;}
return art.mask={m,w,h};}
function bossHit(b,x,y){const M=bossMask(b.art),lx=Math.floor(x-(b.x-M.w/2)),ly=Math.floor(y-(b.y-M.h/2));return lx>=0&&ly>=0&&lx<M.w&&ly<M.h&&M.m[ly*M.w+lx]===1;}
function bossCore(b,x,y){const a=b.art;return Math.hypot(x-(b.x+(a.cx/2-a.W/4)),y-(b.y+(a.cy/2-a.H/4)))<9;}
function bossTouch(b,p){for(let k=0;k<8;k++){const a=k*Math.PI/4;if(bossHit(b,p.x+Math.cos(a)*6,p.y+Math.sin(a)*6))return true;}return bossHit(b,p.x,p.y);}
function bossDm(b){return b.hp>b.mhp*0.66?0:b.hp>b.mhp*0.33?1:2;}
function drawBossParts(b,jx){const a=b.art,dm=bossDm(b),p0=G.p;if(!a.parts)return;for(const P of a.parts){for(const s of P.center?[1]:[1,-1]){
 const X=b.x+jx+((a.cx+(P.center?0:s*P.ax))-a.W/2)/2,Y0=b.y+(P.ay-a.H/2)/2,aim=clamp(Math.atan2(p0.y-Y0,p0.x-X)-Math.PI/2,-1.2,1.2),m=P.mo(G.t,s,aim),Y=Y0+(m.dy||0);
 let img=s<0?P.imgs[dm].L:P.imgs[dm].R;if(b.flash){P.W=P.W||{};const k=dm+(s<0?'L':'R');img=P.W[k]||(P.W[k]=ART.white(img));}
 const pvx=s<0?P.w-P.pvx:P.pvx;ctx.save();ctx.translate(X,Y);if(m.a)ctx.rotate(m.a);ctx.drawImage(img,-pvx/2,-P.pvy/2,P.w/2,P.h/2);ctx.restore();}}}
function bossImg(b){const a=b.art,dm=bossDm(b),f=((G.t*8)|0)&3;if(b.flash){a.WC=a.WC||{};const k=dm+"_"+f;return a.WC[k]||(a.WC[k]=ART.white(a.frames[dm][f]));}return a.frames[dm][f];}
function drawRock(e){draw(e.fl?ART.rockW:ART.rock[(((e.rot||0)/(Math.PI*2)*8)%8+8|0)%8],e.x,e.y,2);}
function bar(x,y,w,h,f,c,bg='#222'){ctx.fillStyle=bg;ctx.fillRect(x,y,w,h);ctx.fillStyle=c;ctx.fillRect(x,y,Math.max(0,w*f)|0,h);}
function drawSpace(dt){const L=G.L,g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,L.sky[0]);g.addColorStop(1,L.sky[1]);ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
 const nb=nebula(L),ny=(G.t*8)%H;ctx.drawImage(nb,0,ny,W,H);ctx.drawImage(nb,0,ny-H,W,H);{const pl=planet(L),py=((G.t*4+curLvl*90)%(H+180))-90;blit(pl,(curLvl*71)%(W-60)-15,py,90,90);}
 ctx.save();shakeT(G.shake);stars(dt,G.boss?0.5:1.5);
 if(L.final){ctx.fillStyle='rgba(120,0,40,0.25)';const r=60+Math.sin(G.t)*6;ctx.beginPath();ctx.arc(W/2,80,r,0,7);ctx.fill();}
 for(const c of G.coins){if(c.k==='pu')puIcon(c.x,c.y,c.w,G.t,c.life);else if(c.k==='hp'){draw(ART.hp,c.x,c.y,2);}else drawCoin(c.x,c.y,G.t,(c.x*7)%10);}
 for(const e of G.en){if(e.k==='gun'||e.k==='kami')glow(e.x,e.y-11,3+Math.sin(G.t*20+(e.ph||0)),'#ff7a3a',0.45);if(e.k==='rock')drawRock(e);else draw(e.fl?ART.enW[e.k]:ART.en[e.k][((G.t*8+(e.ph||0)*3)|0)&3],e.x,e.y,2);}
 const b=G.boss;if(b){for(let i=-1;i<=1;i++)glow(b.x+i*b.w*0.25,b.y-b.h/2+4,6+Math.sin(G.t*15+i)*2,b.fin?'#ff2a4a':'#ff9a3a',0.5);if(b.fin&&b.hp<b.mhp*0.5){glow(b.x,b.y,b.w*0.6+Math.sin(G.t*8)*4,'#ff2a4a',0.35);G.shake=Math.max(G.shake,0.04);}draw(bossImg(b),b.x+(b.fin&&b.hp<b.mhp*0.5?Math.sin(G.t*40):0),b.y,b.sc);drawBossParts(b,(b.fin&&b.hp<b.mhp*0.5?Math.sin(G.t*40):0));}
 pBullets(0,false);
 {const col=DANGER[(G.L.d-1)%5];for(const u of G.eb)drawEB(u,col,G.t);}
 const p=G.p;if(!(G.dead)&&!(p.inv>0&&(G.t*20|0)%2)){const fl=Math.sin(G.t*40)*1.5;glow(p.x-8,p.y+16,6+fl,'#5ab0ff',0.55);glow(p.x+8,p.y+16,6-fl,'#5ab0ff',0.55);{const fi=(G.t*20|0)%4;blit(ART.flame[fi],p.x-12,p.y+13,8,15);blit(ART.flame[(fi+2)%4],p.x+4,p.y+13,8,15);p.bk=(p.bk||0)+(clamp((p.x-(p.lx??p.x))*12,-2,2)-(p.bk||0))*0.25;p.lx=p.x;draw(ART.ship[Math.round(clamp(p.bk,-2,2))+2],p.x,p.y,2);const pu=0.6+0.4*Math.sin(G.t*8);glow(p.x,p.y,3,'#7ae8ff',0.5*pu);ctx.fillStyle='#ffffff';ctx.fillRect(p.x-1,p.y-1,2,2);}if(p.sh>=1){ctx.strokeStyle='rgba(90,200,255,0.6)';ctx.beginPath();ctx.arc(p.x,p.y,21,0,7);ctx.stroke();}}
 drawFx(G.fx);
 ctx.restore();
 // HUD
 hudTop('HULL',p.hp,p.mhp);
 if(p.msh){txt('SHLD',4,14,'#8aa0d0',7,'left');bar(28,15,60,5,p.sh/p.msh,'#5ad0ff');}puHUD(p.msh?24:14);
 txt('CR '+(S.cr+runCr),236,6,'#ffd23a',8,'right');
 if(b&&!G.endT){txt(b.name,W/2,26,'#ff9ab0',7);bar(30,36,W-60,4,b.hp/b.mhp,'#ff3a6a');}
 if(G.t<3)txt('CHAPTER '+(curLvl+1)+': '+L.name,W/2,H/2-20,'#fff',9);
 if(G.t<4&&!hasTouch)txt('ARROWS/WASD MOVE - AUTO FIRE - P PAUSE',W/2,H-20,'#8aa0d0',7);
 if(G.t<4&&hasTouch)txt('DRAG ANYWHERE TO FLY - AUTO FIRE',W/2,H-20,'#8aa0d0',7);
 if(G.t<6)txt('Grab glowing boxes for 12s weapon boosts',W/2,H-32,'#ffd23a',7);
 pauseBtn();}
function pauseBtn(){blit(uiArt(22,18,'#5ab0ff','btn',0),244,2,22,18);ctx.fillStyle='#5ab0ff';ctx.fillRect(251,6,3,10);ctx.fillRect(257,6,3,10);BTN.push({x:240,y:0,w:30,h:24,cb:pause});}

// ---------- PLATFORMER ----------
const TS=16,ROWS=22,PH=ROWS*TS;
const JUMP_BUF=0.1,COYOTE=0.08;const PHYS={g:900,jv:400,run:115,cut:-140};const JUMP_H=PHYS.jv*PHYS.jv/(2*PHYS.g);// ~88.9px with base suit (v4: jv 400 for taller Mara)
const MAX_RISE=2,MAX_GAP=3,PLAT_UP=4;const MARA_W=14,MARA_H=38;// v4: Mara 1.7x taller; platforms 4 tiles up keep 48px headroom// tiles; kept <=75% of physics limits (checked by test_reach.py)
function initPlat(L){const d=L.d,r=rng(500+d*31),cols=90+d*30,map=new Uint8Array(cols*ROWS),ens=[],coins=[];let gy=17,x=0,lastGap=true;
 const set=(X,Y,v)=>{if(X>=0&&X<cols&&Y>=0&&Y<ROWS)map[Y*cols+X]=v;};const ground=new Int16Array(cols).fill(-1);
 const flat=n=>{for(let i=0;i<n&&x<cols;i++,x++)ground[x]=gy;};
 const pe=(k,tx,ty)=>ens.push(mkPE(k,tx,ty,d));
 flat(10);
 while(x<cols-28){if(!lastGap&&r()<0.3){x+=2+Math.floor(r()*(MAX_GAP-1));lastGap=true;continue;}lastGap=false;
  const n=5+Math.floor(r()*7),sx=x;if(r()<0.4)gy=clamp(gy+(r()<0.5?-1:1)*(1+Math.floor(r()*MAX_RISE)),13,19);flat(n);
  if(r()<0.35+d*0.1){const k=r(),ex=sx+Math.floor(n/2);if(k<0.45)pe('crawler',ex,gy);else if(k<0.75)pe('turret',ex,gy);else pe('flyer',ex,gy-5);}
  if(r()<0.3&&n>=6){const sp=sx+2+Math.floor(r()*(n-4));set(sp,gy-1,2);}
  if(r()<0.4){const py=gy-PLAT_UP,pl=3+Math.floor(r()*3),px=sx+Math.floor(r()*Math.max(1,n-pl));for(let i=0;i<pl;i++){set(px+i,py,1);coins.push({x:(px+i)*TS+8,y:(py-1)*TS+8,k:'c',v:1});}}
  else if(r()<0.5)for(let i=1;i<4;i++)coins.push({x:(sx+i)*TS+8,y:(gy-2)*TS+8,k:'c',v:1});}
 const arena=x;flat(cols-x);const AW=4;for(let X=arena-AW;X<arena;X++)if(X>0&&ground[X]<0)ground[X]=gy;// solid run-up, no pit at arena edge
 for(let X=0;X<cols;X++)if(ground[X]>=0)for(let Y=ground[X];Y<ROWS;Y++)set(X,Y,1);
 if(L.ceil)for(let X=0;X<cols;X++){set(X,0,1);set(X,1,1);}
 for(let Y=0;Y<ROWS;Y++)set(cols-1,Y,1);
 const by=gy;const brute=mkPE('brute',arena+12,by,d);brute.req=1;ens.push(brute);
 const mh=2+S.armor*2;
 G={mode:'plat',L,d:d+(S.ng?1:0),t:0,map,cols,ens,coins,bul:[],eb:[],fx:[],brute,arena:{x0:arena*TS,x1:(cols-1)*TS,gy:by,sx:(arena+12)*TS},door:{x:(cols-3)*TS,y:(by-3)*TS,w:TS*2,h:TS*3},
  p:{x:40,y:17*TS-MARA_H-2,w:MARA_W,h:MARA_H,vx:0,vy:0,face:1,on:false,hp:mh,mhp:mh,inv:1,ft:0,fuel:0,jh:false,co:0,cx:40,cy:17*TS-MARA_H-2},cam:0,shake:0,dead:0};state='plat';}
function mkPE(k,tx,gy,d){const D={crawler:{w:16,h:8,hp:2+d},turret:{w:16,h:12,hp:4+d*2},flyer:{w:14,h:10,hp:2+d},brute:{w:40,h:36,hp:35+d*25}}[k];
 const e={k,w:D.w,h:D.h,hp:D.hp,mhp:D.hp,x:tx*TS+(TS-D.w)/2,y:gy*TS-D.h,vx:k==='crawler'?(30+d*8)*(Math.random()<.5?-1:1):0,vy:0,t:Math.random()*6,ft:1+Math.random(),fl:0};
 e.by=e.y;if(k==='brute'){e.jt=2;}return e;}
const tile=(X,Y)=>{if(X<0)return 1;if(Y<0||Y>=ROWS||X>=G.cols)return 0;return G.map[Y*G.cols+X];};
const solid=(X,Y)=>tile(X,Y)===1;
function moveBody(o,dt){o.x+=o.vx*dt;let hit=false;const y0=Math.floor(o.y/TS),y1=Math.floor((o.y+o.h-0.01)/TS);
 if(o.vx>0){const tx=Math.floor((o.x+o.w)/TS);for(let y=y0;y<=y1;y++)if(solid(tx,y)){o.x=tx*TS-o.w-0.01;hit=true;break;}}
 else if(o.vx<0){const tx=Math.floor(o.x/TS);for(let y=y0;y<=y1;y++)if(solid(tx,y)){o.x=(tx+1)*TS+0.01;hit=true;break;}}
 if(hit)o.vx=o.k==='crawler'?o.vx:0;
 o.y+=o.vy*dt;o.on=false;const x0=Math.floor(o.x/TS),x1=Math.floor((o.x+o.w-0.01)/TS);
 if(o.vy>0){const ty=Math.floor((o.y+o.h)/TS);for(let x=x0;x<=x1;x++)if(solid(x,ty)){o.y=ty*TS-o.h;o.vy=0;o.on=true;break;}}
 else if(o.vy<0){const ty=Math.floor(o.y/TS);for(let x=x0;x<=x1;x++)if(solid(x,ty)){o.y=(ty+1)*TS;o.vy=0;break;}}
 return hit;}
const PB={L:[6,392,58,58],R:[70,392,58,58],F:[144,392,56,58],J:[206,392,58,58]};
const AIM_D=14,AIM_UP=36;
function touchBtns(){const r={L:0,R:0,F:0,J:0,aim:null};for(const id in ptrs){const q=ptrs[id],z=zoneOf(q);q.z=z;if(z==='F'){r.F=1;const dy=q.y-q.sy;r.aim=dy<=-AIM_UP?-2:dy<=-AIM_D?-1:dy>=AIM_D?1:0;}else if(z==='F2')r.F=1;else if(z)r[z]=1;}return r;}
const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
function pdrop(x,y,n){for(let i=0;i<n;i++)G.coins.push({x:x+rnd(-8,8),y:y+rnd(-6,4),k:'c',v:2});if(Math.random()<0.08)G.coins.push({x,y:y-6,k:'hp',v:0});}
function pboom(x,y,n,c){G.fx.push({x,y,ring:1,l:0.4,R:n*2+20});G.fx.push({x,y,vx:0,vy:0,sheet:ART.boom,l:0.55,L:0.55,sz:Math.min(72,18+n*0.9)});for(let i=0;i<n;i++){const a=rnd(0,7),s=rnd(20,120);G.fx.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,l:rnd(.3,.7),c:c[ri(0,c.length-1)]});}}
function aimAngle(p){const a=[-Math.PI/2,-Math.PI/4,0,Math.PI/4][(p.aim|0)+2];return p.face>0?a:(a===-Math.PI/2?a:Math.PI-a);}
function updPlat(dt){const p=G.p,d=G.d;G.t+=dt;G.shake=Math.max(0,G.shake-dt);
 if(G.dead){G.dead-=dt;if(G.dead<=0)failLevel();return;}
 const tb=touchBtns();const L=keys.ArrowLeft||keys.KeyA||tb.L,R=keys.ArrowRight||keys.KeyD||tb.R,J=keys.Space||keys.KeyZ||keys.KeyK||tb.J,F=keys.KeyX||keys.KeyJ||keys.KeyF||tb.F;
 const kU=keys.ArrowUp||keys.KeyW,kD=keys.ArrowDown||keys.KeyS;p.aim=tb.aim!==null?tb.aim:kU?((keys.ArrowLeft||keys.KeyA||keys.ArrowRight||keys.KeyD)?-1:-2):kD?1:0;
 G.tb=tb;const ax=(R?1:0)-(L?1:0);p.vx=ax*PHYS.run;if(ax)p.face=ax;
 if(p.on){p.co=COYOTE;p.fuel=0.35+S.jet*0.35;}else p.co-=dt;
 if(J&&!p.jh)jumpPressAt=Math.max(jumpPressAt,now()-dt);
 if(now()-jumpPressAt<=JUMP_BUF&&p.co>0){p.vy=-PHYS.jv;p.co=0;jumpPressAt=-9;p.jumps=(p.jumps||0)+1;p.jt=0.15;SFX.jump();}
 if(p.jt>0)p.jt-=dt;
 if(!J&&p.vy<PHYS.cut&&!(p.jt>0))p.vy=PHYS.cut;
 p.jet=false;if(J&&!p.on&&S.jet>0&&p.vy>-60&&p.fuel>0&&p.co<=0){p.vy=Math.max(-110,p.vy-1500*dt);p.fuel-=dt;p.jet=true;if(Math.random()<.6)G.fx.push({x:p.x+p.w/2-p.face*4,y:p.y+p.h-4,vx:rnd(-10,10),vy:rnd(40,80),l:.25,c:FIRE[ri(1,3)]});}
 p.jh=J;p.vy=Math.min(p.vy+PHYS.g*dt,500);moveBody(p,dt);
 if(p.on&&tile(Math.floor((p.x+p.w/2)/TS),Math.floor((p.y+p.h+1)/TS))===1){p.cx=p.x;p.cy=p.y;}
 p.inv=Math.max(0,p.inv-dt);p.ft-=dt;
 if(F&&p.ft<=0){const g=S.fg,pu=G.pu&&G.pu.k;p.ft=[0,.3,.25,.2,.17,.13][g]*(pu==='prapid'?0.45:pu==='shotgun'?1.3:1);const dm=g>=4?2:1,a0=aimAngle(p),bx=p.x+p.w/2+Math.cos(a0)*13,byy=p.y+p.h*0.38+Math.sin(a0)*13;
  const B=(off,o={})=>{const sp=o.sp||300,a=a0+off;G.bul.push(Object.assign({x:bx,y:byy,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,dm,l:0.8,c:pu==='prapid'?'#5ad0ff':'#bfffcf',hits:[]},o));};
  p.shots=(p.shots||0)+1;B(0);if(g>=3)B(-0.23);if(g>=5)B(0.23);
  if(pu==='shotgun'){for(const v of[-0.38,-0.2,0.2,0.38])B(v,{l:0.35,c:'#ffa03a'});noise(.08,.12,3000);}
  else if(pu==='plasma'){B(0,{dm:3,pierce:1,big:1,sp:240,l:1.2,c:'#c05aff'});tone(400,150,.12,'sawtooth',.04);}else SFX.pshoot();}
 // spikes & pits
 const sx0=Math.floor(p.x/TS),sx1=Math.floor((p.x+p.w)/TS),sy0=Math.floor(p.y/TS),sy1=Math.floor((p.y+p.h)/TS);
 for(let X=sx0;X<=sx1;X++)for(let Y=sy0;Y<=sy1;Y++)if(tile(X,Y)===2&&p.y+p.h>Y*TS+8){if(p.inv<=0){hurt();p.vy=-260;}}
 if(p.y>PH+30){if(!god()){p.inv=0;hurt();}p.x=p.cx;p.y=p.cy;p.vy=0;p.inv=1.2;}
 for(const e of G.ens){e.t+=dt;e.fl=Math.max(0,e.fl-dt);e.ht=Math.max(0,(e.ht||0)-dt);const dx=(p.x+p.w/2)-(e.x+e.w/2),dy=(p.y+p.h/2)-(e.y+e.h/2);
  if(e.k==='crawler'){e.vy=Math.min(e.vy+900*dt,400);const wall=moveBody(e,dt);const fx=e.vx>0?e.x+e.w+1:e.x-1;if(wall||!solid(Math.floor(fx/TS),Math.floor((e.y+e.h+2)/TS))||tile(Math.floor(fx/TS),Math.floor((e.y+e.h-2)/TS))===2)e.vx=-e.vx;}
  else if(e.k==='turret'){e.ft-=dt;if(Math.abs(dx)<220&&e.ft<=0){e.ft=Math.max(1,2.4-0.3*d);const a=Math.atan2(dy,dx),s=110+d*10;G.eb.push({x:e.x+e.w/2,y:e.y+3,vx:Math.cos(a)*s,vy:Math.sin(a)*s});}}
  else if(e.k==='flyer'){if(Math.abs(dx)<200)e.x+=Math.sign(dx)*(25+d*6)*dt;e.y=e.by+Math.sin(e.t*2)*20;}
  else if(e.k==='brute'){e.atk=Math.max(0,(e.atk||0)-dt);if(Math.abs(dx)<250){e.act=1;}if(e.act){e.vx=Math.sign(dx)*(35+d*8);{const fx=e.vx>0?e.x+e.w+2:e.x-2,ty=Math.floor((e.y+e.h+2)/TS);if(e.on&&!solid(Math.floor(fx/TS),ty))e.vx=0;}e.jt-=dt;if(e.jt<=0&&e.on){e.vy=-300;e.jt=2.5;}e.ft-=dt;if(e.ft<=0){e.ft=Math.max(0.9,2-0.3*d);const a=Math.atan2(dy,dx);e.atk=0.35;for(let i=-1;i<=1;i++)G.eb.push({x:e.x+e.w/2,y:e.y+12,vx:Math.cos(a+i*0.3)*130,vy:Math.sin(a+i*0.3)*130});}}e.vy=Math.min(e.vy+900*dt,500);moveBody(e,dt);const A=G.arena;if(e.x<A.x0){e.x=A.x0;e.vx=0;}if(e.x+e.w>A.x1){e.x=A.x1-e.w;e.vx=0;}}
  if(e.y>PH+20||e.x<-50||e.x>G.cols*TS+50){if(e.req){e.x=G.arena.sx;e.y=G.arena.gy*TS-e.h-2;e.vy=0;e.vx=0;e.respawns=(e.respawns||0)+1;if(e.respawns>3){e.hp=0;e.dead=1;}}else e.dead=1;}
  if(overlap(p,e))hurt(),p.vy=-200;}
 for(const u of G.bul){u.x+=u.vx*dt;u.y+=u.vy*dt;u.l-=dt;if(solid(Math.floor(u.x/TS),Math.floor(u.y/TS)))u.dead=1;
  for(const e of G.ens)if(!u.dead&&!e.dead&&!u.hits.includes(e)&&u.x>e.x-(u.big?3:0)&&u.x<e.x+e.w+(u.big?3:0)&&u.y>e.y-(u.big?5:2)&&u.y<e.y+e.h+(u.big?5:2)){if(u.pierce)u.hits.push(e);else u.dead=1;e.hp-=u.dm;e.fl=.06;e.ht=0.22;spark(u.x,u.y,0);SFX.hit();if(e.hp<=0){e.dead=1;SFX.boom();pboom(e.x+e.w/2,e.y+e.h/2,e.k==='brute'?60:14,FIRE);pdrop(e.x+e.w/2,e.y+e.h/2-4,e.k==='brute'?20:2);puDrop(G.coins,e.x+e.w/2,e.y-6,e.k==='brute'?1:e.k==='turret'?0.25:0.12,PU_FOOT);if(e.k==='brute'){runCr+=40*d;G.shake=.5;SFX.big();}}}}
 for(const u of G.eb){u.x+=u.vx*dt;u.y+=u.vy*dt;if(solid(Math.floor(u.x/TS),Math.floor(u.y/TS))||u.x<G.cam-20||u.x>G.cam+W+20)u.dead=1;if(!u.dead&&u.x>p.x&&u.x<p.x+p.w&&u.y>p.y&&u.y<p.y+p.h){u.dead=1;hurt();}}
 for(const c of G.coins){if(c.k==='pu'){c.life-=dt;if(c.life<=0)c.dead=1;if(c.vy){c.y+=c.vy*dt;if(solid(Math.floor(c.x/TS),Math.floor((c.y+8)/TS)))c.vy=0;}}if(Math.abs(c.x-(p.x+p.w/2))<12&&Math.abs(c.y-(p.y+p.h/2))<22){c.dead=1;if(c.k==='pu')givePU(c.w);else if(c.k==='hp')p.hp=Math.min(p.mhp,p.hp+1);else runCr+=c.v;if(c.k!=='pu')SFX.coin();}}
 if(G.pu){G.pu.t-=dt;if(G.pu.t<=0)G.pu=null;}
 for(const f of G.fx){f.x+=f.vx*dt;f.y+=f.vy*dt;f.l-=dt;}
 G.ens=G.ens.filter(e=>!e.dead);G.bul=G.bul.filter(u=>!u.dead&&u.l>0);G.eb=G.eb.filter(u=>!u.dead);G.coins=G.coins.filter(c=>!c.dead);G.fx=G.fx.filter(f=>f.l>0);
 if(G.brute.dead&&overlap(p,G.door))levelClear();
 {const tg=clamp(p.x-W/2+20+p.face*14,0,G.cols*TS-W);G.cam=Math.abs(tg-G.cam)>W*0.6?tg:G.cam+(tg-G.cam)*Math.min(1,dt*7);}}
function platArt(L){if(L._art)return L._art;const pl=L.pal,mk=(w,h)=>cnv(w,h);
 const [ti,x]=mk(TS,TS);x.fillStyle=pl[0];x.fillRect(0,0,TS,TS);x.fillStyle='rgba(255,255,255,0.12)';x.fillRect(0,0,TS,1);x.fillRect(0,0,1,TS);x.fillStyle='rgba(0,0,0,0.35)';x.fillRect(0,TS-2,TS,2);x.fillRect(TS-2,0,2,TS);x.fillStyle=pl[1];x.fillRect(3,3,2,2);x.fillRect(11,11,2,2);x.fillRect(6,8,4,1);
 const [tt,y]=mk(TS,TS);y.drawImage(ti,0,0,TS,TS);y.fillStyle=pl[2];y.fillRect(0,0,TS,3);y.fillStyle='rgba(255,255,255,0.35)';y.fillRect(0,0,TS,1);y.fillStyle='rgba(0,0,0,0.3)';y.fillRect(0,3,TS,1);for(let i=1;i<TS;i+=4){y.fillStyle=pl[2];y.fillRect(i,3,1,1+(i%3));}
 const layer=(seed,alpha,col,lit)=>{const [c,z]=mk(540,PH),r=rng(seed);z.globalAlpha=alpha;let X=0;while(X<540){const w=20+r()*40,h=60+r()*150;z.fillStyle=col;z.fillRect(X,PH-h,w,h);if(lit)for(let wy=PH-h+8;wy<PH-10;wy+=10)for(let wx=X+4;wx<X+w-4;wx+=8)if(r()<0.35){z.fillStyle=r()<0.5?'#ffd27a':'#7ad0ff';z.fillRect(wx,wy,3,3);z.fillStyle=col;}X+=w+4+r()*20;}return c;};
 const TV=ART.tiles(pl,!!L.ceil,L.d*7+(L.ceil?1:0));return L._art={ti,tt,tv:TV,bg:ART.bg(((L.d-1)%3)+1,pl,L.bg,PH,RQ)};}
function drawPlat(){const L=G.L,cam=Math.round(G.cam),pl=L.pal,art=platArt(L);const g=ctx.createLinearGradient(0,0,0,PH);g.addColorStop(0,L.bg[0]);g.addColorStop(1,L.bg[1]);ctx.fillStyle=g;ctx.fillRect(0,0,W,PH);
 ctx.save();shakeT(G.shake);
 // parallax silhouettes
 if(!L.ceil){ctx.fillStyle='#fff';for(let i=0;i<40;i++){const sx=(((i*67-cam*0.02)%W)+W)%W;ctx.fillRect(sx|0,(i*37)%150,1,1);}}if(!L.ceil){glowS(200-cam*0.05,74,26,'#ff9a5a',0.5);ctx.fillStyle='#ffd09a';ctx.beginPath();ctx.arc(200-cam*0.05,74,18,0,7);ctx.fill();ctx.fillStyle='#ffe8c0';ctx.beginPath();ctx.arc(196-cam*0.05,70,12,0,7);ctx.fill();}
 {const B=art.bg;for(const[k,v]of[['far',B.v[0]],['mid',B.v[1]],['near',B.v[2]]]){const o=-((cam*v)%540);blit(B[k],Math.floor(o),0,540,PH);blit(B[k],Math.floor(o)+540,0,540,PH);}}
 const x0=Math.floor(cam/TS),x1=x0+Math.ceil(W/TS)+1;
 for(let X=x0;X<=x1;X++)for(let Y=0;Y<ROWS;Y++){const t=tile(X,Y),sx=X*TS-cam,sy=Y*TS;if(t===1){const hh=(X*73856093^Y*19349663)>>>0;blit(solid(X,Y-1)?art.tv.ti[hh%7<4?0:hh%4]:art.tv.tt[(hh>>>3)%3],sx,sy,TS,TS);{if(hh%9===0){ctx.fillStyle='rgba(0,0,0,0.3)';ctx.fillRect(sx+3+hh%8,sy+5+(hh>>4)%6,3,2);}else if(hh%13===0&&!solid(X,Y-1)){ctx.fillStyle=L.ceil?'#7a8ab0':'#6aa060';ctx.fillRect(sx+(hh>>3)%12,sy-2,1,2);ctx.fillRect(sx+(hh>>3)%12+2,sy-3,1,3);}}if(!solid(X,Y+1)&&Y<ROWS-1){ctx.fillStyle='rgba(0,0,0,0.35)';ctx.fillRect(sx,sy+TS,TS,3);}}
  else if(t===2){ctx.fillStyle='#d0d8e8';for(let k=0;k<4;k++){ctx.beginPath();ctx.moveTo(sx+k*4,sy+TS);ctx.lineTo(sx+k*4+2,sy+6);ctx.lineTo(sx+k*4+4,sy+TS);ctx.fill();}}}
 const dr=G.door;ctx.fillStyle='#10141f';ctx.fillRect(dr.x-cam,dr.y,dr.w,dr.h);ctx.strokeStyle=G.brute.dead?'#9aff5a':'#ff3a6a';ctx.lineWidth=2;ctx.strokeRect(dr.x-cam+1,dr.y+1,dr.w-2,dr.h-2);ctx.lineWidth=1;txt(G.brute.dead?'EXIT':'LOCK',dr.x-cam+dr.w/2,dr.y-10,G.brute.dead?'#9aff5a':'#ff3a6a',7);
 for(const c of G.coins){const bob=Math.sin(G.t*4+c.x)*2;if(c.k==='pu')puIcon(c.x-cam,c.y+bob,c.w,G.t,c.life);else if(c.k==='hp'){draw(ART.hp,c.x-cam,c.y+bob,2);}else drawCoin(c.x-cam,c.y+bob,G.t,(c.x*7)%10);}
 for(const e of G.ens){const cx=e.x+e.w/2-cam,cy=e.y+e.h/2;if(e.k==='brute'){const B=ART.brute(G.d),dir=(e.vx||((G.p.x+G.p.w/2)-(e.x+e.w/2)))<0;e.wt=(e.wt||0)+Math.abs(e.vx||0)/1800;draw(e.fl?B.W:e.ht>0?B.hit:e.atk>0?B.atk[(e.atk*12|0)&1]:B.walk[(e.wt*4|0)&3],cx,e.y+e.h-23,3,dir);if(e.act){bar(cx-20,e.y-8,40,3,e.hp/e.mhp,'#ff3a6a');}}else{if(e.k==='flyer')glow(cx,cy+4,3+Math.sin(G.t*20),'#c05aff',0.5);{const A=ART.pe[e.k];let img,yy=cy,fl=false;if(e.fl)img=ART.peW[e.k];else if(e.k==='turret'){const a=Math.atan2((G.p.y+G.p.h/2)-(e.y+3),(G.p.x+G.p.w/2)-(e.x+e.w/2));img=(e.ht>0?ART.peH.turret:A)[((Math.round(a/(Math.PI/4))%8)+8)%8];}else if(e.ht>0)img=ART.peH[e.k];else img=A[((G.t*10+e.x*0.1)|0)&3];if(e.k==='crawler'){yy=e.y+e.h-5;fl=e.vx<0;}else if(e.k==='turret')yy=e.y+e.h-7.5;draw(img,cx,yy,2,fl);}}}
 const p=G.p;{const M=ART.mara,ai=clamp((p.aim|0)+2,0,3);if(p.on&&!p._on&&p._air>0.15)p.landT=0.12;p._air=p.on?0:(p._air||0)+1/60;p._on=p.on;p.landT=Math.max(0,(p.landT||0)-1/60);
 let fr;if(G.dead)fr=M.death[Math.min(3,Math.floor((1.4-G.dead)*6))];else if(p.inv>0.8)fr=M.hit;else if(!p.on)fr=p.vy<0?M.rise[ai]:M.fall[ai];else if(p.landT>0)fr=M.land[ai];else if(p.vx)fr=M.run[ai][(G.t*14|0)%8];else fr=M.idle[ai][(G.t*3|0)%4];
 if(G.dead||!(p.inv>0&&p.inv<=0.8&&(G.t*20|0)%2)){if(p.jet&&!G.dead)glow(p.x+p.w/2-p.face*4-cam,p.y+p.h-2,4,'#ffa03a',0.6);draw(fr,p.x+p.w/2-cam,p.y+p.h-23,2,p.face<0);}}
 if(G.dead){ctx.fillStyle='#ff3a6a';txt('SUIT BREACH',W/2,140,'#ff3a6a',10);}
 pBullets(cam,true);
 for(const u of G.eb)drawEB(u,DANGER_FOOT,G.t,cam);
 drawFx(G.fx,cam);ambient(L.ceil?'#9ab0ff':'#ffc08a',L.ceil?6:-10,cam,1/60,PH);{const fo=-((cam*1.3)%540);blit(fore(L),fo,PH-40,540,40);blit(fore(L),fo+540,PH-40,540,40);}if(L.ceil&&!G.dead)darkness(G.p.x+G.p.w/2-cam,G.p.y+G.p.h/2,0.62,110);
 ctx.restore();
 hudTop('SUIT',p.hp,p.mhp);
 if(S.jet)bar(4,15,50,4,p.fuel/(0.35+S.jet*0.35),'#ffa03a');puHUD(22);
 txt('CR '+(S.cr+runCr),236,6,'#ffd23a',8,'right');
 bar(4,PH-4,W-8,2,clamp(p.x/((G.cols-3)*TS),0,1),'#5ab0ff','#1a2030');
 if(G.t<3)txt('CHAPTER '+(curLvl+1)+': '+L.name,W/2,120,'#fff',9);
 // control panel
 ctx.fillStyle='#070912';ctx.fillRect(0,PH,W,H-PH);ctx.fillStyle='#1a2340';ctx.fillRect(0,PH,W,1);
 const tb=G.tb||{};const pb=(k,lab)=>{const b=PB[k];blit(uiArt(b[2],b[3],'#5ab0ff','btn',tb[k]),b[0],b[1],b[2],b[3]);txt(lab,b[0]+b[2]/2,b[1]+b[3]/2-5,'#bfe8ff',10);};
 pb('L','<');pb('R','>');pb('F','FIRE');{const b=PB.F,cx=b[0]+b[2]/2,cy=b[1]+b[3]/2,am=tb.F?(p.aim|0):null;txt('^',cx,b[1]+3,am!==null&&am<0?'#ffd23a':'#3a4a7a',8);txt('v',cx,b[1]+b[3]-12,am===1?'#ffd23a':'#3a4a7a',8);if(am!==null){const a=aimAngle(p);ctx.fillStyle='#ffd23a';for(let i=10;i<=18;i+=2)ctx.fillRect(cx-6+Math.cos(a)*(i-6)-1,cy+13+Math.sin(a)*(i-6)*0.5-1,2,2);}}pb('J',S.jet?'JUMP+':'JUMP');
 txt(G.t<6?'Defeated foes may drop weapon boosts!':hasTouch?'Slide up/down on FIRE to aim. Hold JUMP to hover':'ARROWS move  SPACE/Z jump  X fire (+UP/DOWN aim)',W/2,PH+10,'#56607e',7);
 pauseBtn();}

// ---------- HACKING (falling data-fragment line-clear puzzle) ----------
const HW=10,HH=20,HC=12,HX=14,HY=60;
const SHAPES={I:[[0,1],[1,1],[2,1],[3,1]],O:[[1,0],[2,0],[1,1],[2,1]],T:[[1,0],[0,1],[1,1],[2,1]],S:[[1,0],[2,0],[0,1],[1,1]],Z:[[0,0],[1,0],[1,1],[2,1]],J:[[0,0],[0,1],[1,1],[2,1]],L:[[2,0],[0,1],[1,1],[2,1]]};
const HCOL={I:'#5ad0ff',O:'#e8f4ff',T:'#c05aff',S:'#9aff5a',Z:'#ff5ae0',J:'#4a7aff',L:'#ffa03a'};
const ROT={};for(const k in SHAPES){ROT[k]=[SHAPES[k]];const n=k==='I'?4:3;for(let r=1;r<4;r++)ROT[k].push(k==='O'?SHAPES.O:ROT[k][r-1].map(([x,y])=>[n-1-y,x]));}
const KICKS=[[0,0],[-1,0],[1,0],[0,-1],[-2,0],[2,0],[-1,-1],[1,-1]];
const HTARGET=[8,12,16,20];
const HBLK={};function hblock(k,ghost){if(!ghost)return ART.hack(HCOL[k],k);const key=k+(ghost?'g':'');if(HBLK[key])return HBLK[key];const [c,x]=cnv(HC,HC),col=HCOL[k];
 if(ghost){x.strokeStyle=col;x.globalAlpha=0.5;x.strokeRect(1.5,1.5,HC-3,HC-3);x.fillStyle=col;x.globalAlpha=0.12;x.fillRect(2,2,HC-4,HC-4);return HBLK[key]=c;}
 x.fillStyle='#05080f';x.fillRect(0,0,HC,HC);x.fillStyle=col;x.fillRect(1,1,HC-2,HC-2);x.fillStyle='rgba(255,255,255,0.5)';x.fillRect(1,1,HC-2,1);x.fillRect(1,1,1,HC-2);x.fillStyle='rgba(0,0,0,0.45)';x.fillRect(1,HC-2,HC-2,1);x.fillRect(HC-2,1,1,HC-2);
 x.fillStyle='rgba(0,0,20,0.45)';x.fillRect(3,3,HC-6,HC-6);x.fillStyle=col;x.fillRect(4,4,2,1);x.fillRect(4,6,4,1);x.fillRect(7,4,1,1);x.fillRect(4,8,1.5,0.5);x.fillRect(6,8,2.5,0.5);x.fillStyle='rgba(255,255,255,0.25)';x.fillRect(1.5,1.5,HC-3,0.5);x.fillStyle='#fff';x.fillRect(HC-4,3,1,1);x.fillRect(HC-4.5,2.5,0.5,0.5);return HBLK[key]=c;}
function hcells(p){return ROT[p.k][p.r].map(([x,y])=>[x+p.x,y+p.y]);}
function hfits(H,k,r,x,y){for(const [cx,cy] of ROT[k][r]){const X=x+cx,Y=y+cy;if(X<0||X>=HW||Y>=HH)return false;if(Y>=0&&H.b[Y*HW+X])return false;}return true;}
function hbag(H){if(!H.bag.length){H.bag=Object.keys(SHAPES);for(let i=6;i>0;i--){const j=Math.floor(Math.random()*(i+1));[H.bag[i],H.bag[j]]=[H.bag[j],H.bag[i]];}}return H.bag.pop();}
function hgrav(H){return Math.max(0.06,0.85-(H.lvl-1)*0.08)*(1+0.25*H.dec);}
function initHack(L){const ng=S.ng?1:0,dec=S.dec||0,target=HTARGET[Math.min(3,L.d-1+ng)];
 G={mode:'hack',L,d:L.d+ng,t:0,b:new Array(HW*HH).fill(0),bag:[],q:[],hold:null,canHold:true,lines:0,target,lvl:L.d+ng,gT:0,lockT:0,
  trace:80+target*6+(dec>=3?30:0),p:null,clearing:null,fx:[],pieces:0,dec,das:0,dasDir:0,tb:{},shake:0,dead:0,won:0,msg:''};
 G.traceMax=G.trace;for(let i=0;i<3;i++)G.q.push(hbag(G));hspawn(G);state='hack';}
function hspawn(H,k){if(!k){k=H.q.shift();H.q.push(hbag(H));}const p={k,r:0,x:3,y:k==='I'?-1:0};H.p=p;H.lockT=0;H.gT=0;if(!hfits(H,k,0,p.x,p.y))hfail(H,'STACK OVERFLOW');}
function hfail(H,msg){if(H.dead)return;H.dead=1.2;H.msg=msg;SFX.hurt();H.shake=0.3;}
function hmove(H,dx){const p=H.p;if(!p||H.dead||H.won||H.clearing)return false;if(hfits(H,p.k,p.r,p.x+dx,p.y)){p.x+=dx;H.lockT=Math.min(H.lockT,0.25);tone(220,220,.02,'square',.02);return true;}return false;}
function hrot(H,dir){const p=H.p;if(!p||H.dead||H.won||H.clearing)return false;const nr=(p.r+dir+4)%4;for(const [kx,ky] of KICKS)if(hfits(H,p.k,nr,p.x+kx,p.y+ky)){p.r=nr;p.x+=kx;p.y+=ky;H.lockT=Math.min(H.lockT,0.25);tone(660,990,.04,'square',.03);return true;}return false;}
function hsoft(H){const p=H.p;if(p&&!H.dead&&!H.clearing&&hfits(H,p.k,p.r,p.x,p.y+1)){p.y++;H.gT=0;return true;}return false;}
function hhard(H){const p=H.p;if(!p||H.dead||H.won||H.clearing)return;let n=0;while(hfits(H,p.k,p.r,p.x,p.y+1)){p.y++;n++;}for(const [x,y] of hcells(p))for(let i=0;i<3;i++)H.fx.push({x:HX+x*HC+6,y:HY+y*HC+6,vx:rnd(-40,40),vy:rnd(-60,-10),l:.3,c:HCOL[p.k],s:2});noise(.06,.12,2500);hlock(H);}
function hholdP(H){if(!H.canHold||!H.p||H.dead||H.clearing)return;const k=H.p.k;if(H.hold){const h=H.hold;H.hold=k;hspawn(H,h);}else{H.hold=k;hspawn(H);}H.canHold=false;tone(440,330,.06,'triangle',.05);}
function hlock(H){const p=H.p;for(const [x,y] of hcells(p)){if(y<0){hfail(H,'STACK OVERFLOW');return;}H.b[y*HW+x]=p.k;}H.pieces++;H.canHold=true;H.p=null;tone(160,90,.06,'square',.04);
 const rows=[];for(let y=0;y<HH;y++){let f=true;for(let x=0;x<HW;x++)if(!H.b[y*HW+x]){f=false;break;}if(f)rows.push(y);}
 if(rows.length){H.clearing={rows,t:0.18};[523,659,784,1046].slice(0,rows.length).forEach((f,i)=>tone(f,f,.08,'square',.05,i*.05));}else hspawn(H);}
function hfinishClear(H){const rows=H.clearing.rows;H.clearing=null;for(const y of rows)for(let x=0;x<HW;x++)for(let i=0;i<2;i++)H.fx.push({x:HX+x*HC+6,y:HY+y*HC+6,vx:rnd(-60,60),vy:rnd(-80,20),l:rnd(.3,.6),c:'#9aff5a',s:2});
 const keep=[];for(let y=0;y<HH;y++)if(!rows.includes(y))keep.push(H.b.slice(y*HW,y*HW+HW));while(keep.length<HH)keep.unshift(new Array(HW).fill(0));H.b=[].concat(...keep);
 H.lines+=rows.length;runCr+=[0,3,8,15,30][rows.length];H.lvl=H.d+Math.floor(H.lines/4);
 if(H.lines>=H.target){H.won=1;H.p=null;SFX.win();}else hspawn(H);}
const HB={L:[6,410,40,46],R:[50,410,40,46],U:[94,410,40,46],D:[138,410,40,46],H:[182,410,40,46],C:[226,410,40,46]};
function hzone(q){if(q.sy<398)return null;for(const k in HB){const b=HB[k];if(q.x>=b[0]-2&&q.x<b[0]+b[2]+2)return k;}return null;}
function hackDown(q){const H=G;q.hz=hzone(q);if(q.hz){if(q.hz==='U')hrot(H,1);else if(q.hz==='H')hhard(H);else if(q.hz==='C')hholdP(H);else if(q.hz==='D')hsoft(H);else{const mv=q.hz==='L'?-1:1;hmove(H,mv);H.dasDir=mv;H.das=0.17;}return;}
 if(q.sy>40)q.g={lx:q.x,ly:q.y,t:now(),moved:false};}
function hackMove(q){const H=G;if(!q.g)return;while(q.x-q.g.lx>=HC){hmove(H,1);q.g.lx+=HC;q.g.moved=true;}while(q.g.lx-q.x>=HC){hmove(H,-1);q.g.lx-=HC;q.g.moved=true;}
 if(q.y<q.g.ly)q.g.ly=q.y;while(q.y-q.g.ly>=HC){hsoft(H);q.g.ly+=HC;q.g.moved=true;}}
function hackUp(q,cancel){const H=G;if(!q||!q.g||cancel)return;const dt=now()-q.g.t,dy=q.y-q.sy,dx=q.x-q.sx;
 if(dt<0.3&&dy>36&&Math.abs(dx)<dy*0.7)hhard(H);else if(!q.g.moved&&Math.hypot(dx,dy)<10&&dt<0.4)hrot(H,1);}
function updHack(dt){const H=G;H.t+=dt;H.shake=Math.max(0,H.shake-dt);for(const f of H.fx){f.x+=f.vx*dt;f.y+=f.vy*dt;f.vy+=200*dt;f.l-=dt;}H.fx=H.fx.filter(f=>f.l>0);
 if(H.dead){H.dead-=dt;if(H.dead<=0){H.dead=0;failLevel();}return;}
 if(H.won){H.won-=dt;if(H.won<=0){H.won=0;levelClear();}return;}
 H.trace-=dt;if(H.trace<=0){H.trace=0;hfail(H,'TRACE COMPLETE');return;}
 if(H.clearing){H.clearing.t-=dt;if(H.clearing.t<=0)hfinishClear(H);return;}
 if(!H.p)return;
 const tb={};for(const id in ptrs){const q=ptrs[id];if(q.hz)tb[q.hz]=1;}H.tb=tb;
 const dir=((keys.ArrowRight||keys.KeyD||tb.R)?1:0)-((keys.ArrowLeft||keys.KeyA||tb.L)?1:0);
 if(dir){if(H.dasDir!==dir){H.dasDir=dir;H.das=0.17;hmove(H,dir);}else{H.das-=dt;if(H.das<=0){H.das=0.05;hmove(H,dir);}}}else H.dasDir=0;
 const soft=keys.ArrowDown||keys.KeyS||tb.D,p=H.p;
 if(hfits(H,p.k,p.r,p.x,p.y+1)){H.gT+=dt*(soft?16:1);const gi=hgrav(H);while(H.gT>=gi&&hfits(H,p.k,p.r,p.x,p.y+1)){H.gT-=gi;p.y++;}}
 else{H.lockT+=dt;if(H.lockT>=0.5)hlock(H);}}
function hackKey(c){const H=G;const mv={ArrowLeft:-1,KeyA:-1,ArrowRight:1,KeyD:1}[c];if(mv){hmove(H,mv);H.dasDir=mv;H.das=0.17;return;}if(c==='ArrowDown'||c==='KeyS'){hsoft(H);return;}if(c==='ArrowUp'||c==='KeyX'||c==='KeyW')hrot(H,1);else if(c==='KeyZ')hrot(H,-1);else if(c==='Space')hhard(H);else if(c==='KeyC'||c==='ShiftLeft'||c==='ShiftRight')hholdP(H);}
function hmini(k,x,y,s=7){if(!k)return;const cs=ROT[k][0];for(const [cx,cy] of cs)blit(hblock(k),x+cx*s,y+cy*s,s,s);}
function drawHack(dt){const H=G;ctx.fillStyle='#02060a';ctx.fillRect(0,0,W,HEIGHT_);ctx.fillStyle='rgba(60,255,140,0.05)';for(let x=0;x<W;x+=6)ctx.fillRect(x,0,1,HEIGHT_);for(let y=(H.t*10|0)%6;y<HEIGHT_;y+=6)ctx.fillRect(0,y,W,1);
 ctx.save();shakeT(H.shake);
 panel(HX-6,HY-6,HW*HC+12,HH*HC+12,'#2a8a5a');ctx.fillStyle='#03100a';ctx.fillRect(HX,HY,HW*HC,HH*HC);ctx.fillStyle='rgba(90,255,160,0.06)';for(let x=1;x<HW;x++)ctx.fillRect(HX+x*HC,HY,1,HH*HC);for(let y=1;y<HH;y++)ctx.fillRect(HX,HY+y*HC,HW*HC,1);
 for(let y=0;y<HH;y++)for(let x=0;x<HW;x++){const k=H.b[y*HW+x];if(k){if(H.clearing&&H.clearing.rows.includes(y)){ctx.fillStyle=(H.t*30|0)%2?'#ffffff':'#9aff5a';ctx.fillRect(HX+x*HC,HY+y*HC,HC,HC);}else blit(hblock(k),HX+x*HC,HY+y*HC,HC,HC);}}
 const p=H.p;if(p){let gy=p.y;while(hfits(H,p.k,p.r,p.x,gy+1))gy++;for(const [x,y] of hcells({...p,y:gy}))if(y>=0)blit(hblock(p.k,1),HX+x*HC,HY+y*HC,HC,HC);
  for(const [x,y] of hcells(p))if(y>=0){blit(hblock(p.k),HX+x*HC,HY+y*HC,HC,HC);}glow(HX+(p.x+1.5)*HC,HY+(p.y+1)*HC,10,HCOL[p.k],0.12);}
 drawFx(H.fx);ctx.restore();
 const RX=HX+HW*HC+14,RW=W-RX-6;
 panel(RX,HY-6,RW,56,'#2a8a5a');txt('NEXT',RX+8,HY,'#9aff5a',7,'left');hmini(H.q[0],RX+10,HY+14,8);if(H.dec>=2)hmini(H.q[1],RX+RW-38,HY+18,6);
 panel(RX,HY+56,RW,46,'#2a8a5a');txt('HOLD',RX+8,HY+62,'#9aff5a',7,'left');hmini(H.hold,RX+12,HY+74,7);
 panel(RX,HY+108,RW,126,'#2a8a5a');txt('LINES',RX+8,HY+116,'#9aff5a',7,'left');txt(H.lines+' / '+H.target,RX+8,HY+128,'#fff',11,'left');bar(RX+8,HY+144,RW-16,4,H.lines/H.target,'#9aff5a','#0a2a1a');
 txt('SPEED '+H.lvl,RX+8,HY+156,'#5ad0ff',8,'left');txt('TRACE',RX+8,HY+174,'#ff3a6a',7,'left');bar(RX+8,HY+186,RW-16,5,H.trace/H.traceMax,H.trace<15&&(H.t*4|0)%2?'#ffffff':'#ff3a6a','#2a0a14');txt(Math.ceil(H.trace)+'s',RX+8,HY+196,'#ff9ab0',7,'left');
 txt('CR '+(S.cr+runCr),RX+8,HY+212,'#ffd23a',8,'left');
 txt('CHAPTER '+(curLvl+1)+': '+H.L.name,W/2,32,'#9aff5a',8);
 if(H.t<5)txt('Fill rows to burn them out of the lock',W/2,44,'#56607e',7);
 if(H.dead)txt(H.msg,HX+HW*HC/2,HY+100,'#ff3a6a',10);if(H.won)txt('ACCESS GRANTED',HX+HW*HC/2,HY+100,'#9aff5a',10);
 ctx.fillStyle='#070912';ctx.fillRect(0,398,W,HEIGHT_-398);ctx.fillStyle='#1a2340';ctx.fillRect(0,398,W,1);
 const lab={L:'<',R:'>',U:'ROT',D:'v',H:'DROP',C:'HOLD'};for(const k in HB){const b=HB[k],on=H.tb&&H.tb[k];blit(uiArt(b[2],b[3],'#3aaa6a','btn',on),b[0],b[1],b[2],b[3]);txt(lab[k],b[0]+b[2]/2,b[1]+b[3]/2-4,'#bfffcf',8);}
 txt(hasTouch?'TAP rotate - DRAG move - FLICK down to drop':'ARROWS move  UP/X rotate  Z ccw  SPACE drop  C hold',W/2,HY+HH*HC+14,'#56607e',7);
 ctx.fillStyle='rgba(0,0,0,0.12)';for(let y=0;y<HEIGHT_;y+=2)ctx.fillRect(0,y,W,1);
 pauseBtn();}

// ---------- EVASION (maze, weapons jammed by a Hollow damper field) ----------
const EW=15,EH=21,ETS=16,EOX=15,EOY=46,EDOOR=[7,0],ESTART=[7,19];
const EDIRS=[[0,-1],[1,0],[0,1],[-1,0]];
const ENAMES=['STALKER','CUTTER','DRIFTER','PINCER'];
function genMaze(seed){const r=rng(seed),g=new Uint8Array(EW*EH).fill(1),cw=7,ch=10,vis=new Uint8Array(cw*ch),st=[[3,9]];vis[9*cw+3]=1;g[19*EW+7]=0;
 while(st.length){const [cx,cy]=st[st.length-1];const nb=EDIRS.filter(([dx,dy])=>{const nx=cx+dx,ny=cy+dy;return nx>=0&&ny>=0&&nx<cw&&ny<ch&&!vis[ny*cw+nx];});
  if(!nb.length){st.pop();continue;}const [dx,dy]=nb[Math.floor(r()*nb.length)],nx=cx+dx,ny=cy+dy;vis[ny*cw+nx]=1;g[(2*cy+1+dy)*EW+2*cx+1+dx]=0;g[(2*ny+1)*EW+2*nx+1]=0;st.push([nx,ny]);}
 for(let y=1;y<EH-1;y++)for(let x=1;x<EW-1;x++){if(g[y*EW+x])continue;const ex=EDIRS.filter(([dx,dy])=>!g[(y+dy)*EW+x+dx]);
  if(ex.length===1){const c=EDIRS.filter(([dx,dy])=>{const X=x+2*dx,Y=y+2*dy;return g[(y+dy)*EW+x+dx]&&X>0&&Y>0&&X<EW-1&&Y<EH-1;});if(c.length){const [dx,dy]=c[Math.floor(r()*c.length)];g[(y+dy)*EW+x+dx]=0;}}}
 for(let i=0;i<12;i++){const x=1+Math.floor(r()*(EW-2)),y=1+Math.floor(r()*(EH-2));if(g[y*EW+x]&&((x%2===0&&y%2===1)||(x%2===1&&y%2===0)))g[y*EW+x]=0;}
 return g;}
function eopen(H,x,y){if(x===EDOOR[0]&&y===EDOOR[1])return H.unlocked;if(x<0||y<0||x>=EW||y>=EH)return false;return !H.g[y*EW+x];}
function ebfs(H,sx,sy,door){const d=new Int16Array(EW*EH).fill(-1),q=[[sx,sy]];d[sy*EW+sx]=0;while(q.length){const [x,y]=q.shift();for(const [dx,dy] of EDIRS){const X=x+dx,Y=y+dy;if(X<0||Y<0||X>=EW||Y>=EH)continue;const op=(X===EDOOR[0]&&Y===EDOOR[1])?door:!H.g[Y*EW+X];if(op&&d[Y*EW+X]<0){d[Y*EW+X]=d[y*EW+x]+1;q.push([X,Y]);}}}return d;}
function initEvade(L){const ng=S.ng?1:0,d=L.d+ng,g=genMaze(9100+L.d*57),mh=2+S.armor*2;
 G={mode:'evade',L,d,t:0,g,unlocked:false,lockT:[55,80,90][Math.min(2,d-1)],fx:[],shake:0,dead:0,won:0,stun:0,surge:0,msg:'',
  p:{tx:ESTART[0],ty:ESTART[1],nx:ESTART[0],ny:ESTART[1],p:0,moving:false,dir:null,want:null,spd:4.3,hp:mh,mhp:mh,inv:1.5,face:0},en:[],items:[]};
 G.lockMax=G.lockT;const dist=ebfs(G,ESTART[0],ESTART[1],false),r=rng(77+L.d);
 const cand=[];for(let y=1;y<EH-1;y+=2)for(let x=1;x<EW-1;x+=2)if(dist[y*EW+x]>=12)cand.push([x,y]);
 const n=Math.min(4,2+d),sp=[];for(let i=0;i<n&&cand.length;i++){let best=0,bs=-1;for(let j=0;j<cand.length;j++){const [x,y]=cand[j];let m=99;for(const [a,b] of sp)m=Math.min(m,Math.abs(a-x)+Math.abs(b-y));const s=(sp.length?m:dist[y*EW+x])+r()*2;if(s>bs){bs=s;best=j;}}sp.push(cand.splice(best,1)[0]);}
 sp.forEach(([x,y],i)=>G.en.push({k:i,tx:x,ty:y,nx:x,ny:y,p:0,moving:false,dir:null,hx:x,hy:y,act:1+i*2.5,stun:0,t:0}));
 for(let y=1;y<EH-1;y++)for(let x=1;x<EW-1;x++)if(!g[y*EW+x]&&dist[y*EW+x]>2&&r()<0.4)G.items.push({x,y,k:'c'});
 const far=[];for(let y=1;y<EH-1;y++)for(let x=1;x<EW-1;x++)if(!g[y*EW+x]&&dist[y*EW+x]>=8)far.push([x,y]);
 for(const k of ['stun','surge']){const [x,y]=far.splice(Math.floor(r()*far.length),1)[0];G.items=G.items.filter(it=>it.x!==x||it.y!==y);G.items.push({x,y,k});}
 state='evade';}
function epos(m){return [EOX+(m.tx+(m.nx-m.tx)*m.p)*ETS+ETS/2,EOY+(m.ty+(m.ny-m.ty)*m.p)*ETS+ETS/2];}
function etile(m){return m.p<0.5?[m.tx,m.ty]:[m.nx,m.ny];}
function emove(H,m,dt,spd,choose){
 if(m.moving&&m.want&&m.want[0]===-m.dir[0]&&m.want[1]===-m.dir[1]){[m.tx,m.nx]=[m.nx,m.tx];[m.ty,m.ny]=[m.ny,m.ty];m.p=1-m.p;m.dir=m.want;m.want=null;}
 if(m.moving&&m.p<0.3&&m.want&&(m.want[0]!==m.dir[0]||m.want[1]!==m.dir[1])&&eopen(H,m.tx+m.want[0],m.ty+m.want[1])){m.p=0;m.moving=false;}
 let d=spd*dt,guard=0;while(d>0&&guard++<8){if(!m.moving){const nd=choose(m);if(!nd)return;m.dir=nd;m.nx=m.tx+nd[0];m.ny=m.ty+nd[1];m.p=0;m.moving=true;}
  const rem=1-m.p;if(d<rem){m.p+=d;d=0;}else{d-=rem;m.tx=m.nx;m.ty=m.ny;m.p=0;m.moving=false;}}}
function pchoose(m){const H=G;if(m.want&&eopen(H,m.tx+m.want[0],m.ty+m.want[1])){const w=m.want;m.want=null;return w;}if(m.dir&&eopen(H,m.tx+m.dir[0],m.ty+m.dir[1]))return m.dir;return null;}
function etarget(H,e){const p=H.p,[px,py]=etile(p),pd=p.dir||[0,-1];
 if(e.k===0)return [px,py];
 if(e.k===1)return [px+pd[0]*4,py+pd[1]*4];
 if(e.k===2){const [ex,ey]=etile(e);return Math.abs(ex-px)+Math.abs(ey-py)<6?[px,py]:[e.hx,e.hy];}
 const s=H.en[0],[sx,sy]=s?etile(s):[px,py];return [2*(px+pd[0]*2)-sx,2*(py+pd[1]*2)-sy];}
function echoose(H,e){const opts=EDIRS.filter(d=>!(d[0]===EDOOR[0]-e.tx&&0)&&eopen(H,e.tx+d[0],e.ty+d[1])&&!(e.tx+d[0]===EDOOR[0]&&e.ty+d[1]===EDOOR[1]));
 let o=opts.filter(d=>!(e.dir&&d[0]===-e.dir[0]&&d[1]===-e.dir[1]));if(!o.length)o=opts;if(!o.length)return null;
 if(e.k===2&&Math.random()<0.5)return o[Math.floor(Math.random()*o.length)];
 const [tx,ty]=etarget(H,e);let best=o[0],bd=1e9;for(const d of o){const X=e.tx+d[0],Y=e.ty+d[1],dd=(X-tx)**2+(Y-ty)**2;if(dd<bd){bd=dd;best=d;}}return best;}
function ehome(e){e.tx=e.nx=e.hx;e.ty=e.ny=e.hy;e.p=0;e.moving=false;e.dir=null;e.stun=1.2;}
function updEvade(dt){const H=G,p=H.p;H.t+=dt;H.shake=Math.max(0,H.shake-dt);for(const f of H.fx){f.x+=f.vx*dt;f.y+=f.vy*dt;f.l-=dt;}H.fx=H.fx.filter(f=>f.l>0);
 if(H.dead){H.dead-=dt;if(H.dead<=0){H.dead=0;failLevel();}return;}if(H.won){H.won-=dt;if(H.won<=0){H.won=0;levelClear();}return;}
 if(!H.unlocked){H.lockT-=dt;if(H.lockT<=0){H.lockT=0;H.unlocked=true;SFX.win();}}
 p.inv=Math.max(0,p.inv-dt);H.stun=Math.max(0,H.stun-dt);H.surge=Math.max(0,H.surge-dt);
 emove(H,p,dt,p.spd*(H.surge>0?1.5:1),pchoose);if(p.dir)p.face=EDIRS.findIndex(d=>d[0]===p.dir[0]&&d[1]===p.dir[1]);
 const [ptx,pty]=etile(p);
 for(const it of H.items)if(it.x===ptx&&it.y===pty&&!it.got){it.got=1;if(it.k==='c'){runCr+=1;SFX.coin();}else{if(it.k==='stun')H.stun=4;else H.surge=5;[880,1320,1760].forEach((f,i)=>tone(f,f,.08,'square',.05,i*.05));}}
 H.items=H.items.filter(i=>!i.got);
 if(H.unlocked&&ptx===EDOOR[0]&&pty===EDOOR[1]&&p.p===0||H.unlocked&&p.ty===EDOOR[1]&&p.tx===EDOOR[0]){H.won=0.8;runCr+=10*H.d;return;}
 const ramp=(1+0.1*(H.d-1))*(1+Math.min(0.35,H.t/150)),[ppx,ppy]=epos(p);
 for(const e of H.en){e.t+=dt;if(e.t<e.act)continue;e.stun=Math.max(0,e.stun-dt);if(e.stun<=0&&H.stun<=0)emove(H,e,dt,3.1*ramp,m=>echoose(H,m));
  const [ex,ey]=epos(e);if(Math.hypot(ex-ppx,ey-ppy)<11){if(H.stun>0){ehome(e);SFX.boom();boomE(ex,ey,'#5ad0ff');}else if(p.inv<=0&&!god()){p.hp--;p.inv=1.5;H.shake=0.3;SFX.hurt();boomE(ppx,ppy,'#ff3a6a');ehome(e);if(p.hp<=0){H.dead=1.2;H.msg='SUIT BREACH';}}}}}
function boomE(x,y,c){G.fx.push({x,y,vx:0,vy:0,sheet:ART.boomB,l:0.5,L:0.5,sz:30});for(let i=0;i<14;i++){const a=rnd(0,7),s=rnd(20,90);G.fx.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,l:rnd(.2,.5),c,s:2});}G.fx.push({x,y,ring:1,l:0.4,R:40});}
const EB={U:[113,388,44,29],L:[63,419,46,29],R:[161,419,46,29],D:[113,450,44,29]};
function evDown(q){q.ea={x:q.x,y:q.y};for(const k in EB){const b=EB[k];if(q.x>=b[0]-4&&q.x<=b[0]+b[2]+4&&q.y>=b[1]-2&&q.y<=b[1]+b[3]+2){evWant({U:0,R:1,D:2,L:3}[k]);q.ea=null;return;}}}
function evMove(q){if(!q.ea)return;const dx=q.x-q.ea.x,dy=q.y-q.ea.y;if(Math.max(Math.abs(dx),Math.abs(dy))>=16){evWant(Math.abs(dx)>Math.abs(dy)?(dx>0?1:3):(dy>0?2:0));q.ea={x:q.x,y:q.y};}}
function evWant(i){const p=G.p;p.want=EDIRS[i];}
function evKey(c){const m={ArrowUp:0,KeyW:0,ArrowRight:1,KeyD:1,ArrowDown:2,KeyS:2,ArrowLeft:3,KeyA:3}[c];if(m!==undefined)evWant(m);}
function eWallArt(L){if(L._ew)return L._ew;const pl=L.pal,[c,x]=cnv(ETS,ETS);x.fillStyle=pl[0];x.fillRect(0,0,ETS,ETS);x.fillStyle=pl[2];x.fillRect(0,0,ETS,2);x.fillRect(0,0,2,ETS);x.fillStyle='rgba(0,0,0,0.4)';x.fillRect(0,ETS-3,ETS,3);x.fillRect(ETS-2,0,2,ETS);x.fillStyle=pl[1];x.fillRect(5,5,6,6);x.fillStyle=pl[2];x.fillRect(7,7,2,2);x.fillStyle='rgba(255,255,255,0.18)';x.fillRect(2,2.5,ETS-4,0.5);x.fillStyle='rgba(0,0,0,0.3)';x.fillRect(5,10.5,6,0.5);x.fillRect(10.5,5,0.5,6);return L._ew=c;}
function drawEvade(dt){const H=G,L=H.L;ctx.fillStyle='#04040c';ctx.fillRect(0,0,W,HEIGHT_);
 ctx.save();shakeT(H.shake);
 const wa=eWallArt(L);ctx.fillStyle='#0b0d1c';ctx.fillRect(EOX,EOY,EW*ETS,EH*ETS);
 for(let y=0;y<EH;y++)for(let x=0;x<EW;x++){const sx=EOX+x*ETS,sy=EOY+y*ETS;if(x===EDOOR[0]&&y===EDOOR[1]){const op=H.unlocked,fl=!op&&H.lockT<3&&(H.t*8|0)%2;ctx.fillStyle='#10141f';ctx.fillRect(sx,sy,ETS,ETS);ctx.fillStyle=op?'#9aff5a':fl?'#ffffff':'#ff3a6a';if(op){ctx.globalAlpha=0.5+0.3*Math.sin(H.t*6);ctx.fillRect(sx+2,sy+2,ETS-4,ETS-4);ctx.globalAlpha=1;}else for(let i=2;i<ETS;i+=4)ctx.fillRect(sx+i,sy+1,2,ETS-2);continue;}
  if(H.g[y*EW+x]){const wl=(i,j)=>i<0||j<0||i>=EW||j>=EH||!!H.g[j*EW+i],m=(wl(x,y-1)?1:0)|(wl(x+1,y)?2:0)|(wl(x,y+1)?4:0)|(wl(x-1,y)?8:0),hv=((x*7349)^(y*1931))%7;blit(ART.wall(L.pal,m,hv<4?2:hv<6?0:1),sx,sy,ETS,ETS);}else{ctx.fillStyle=((x+y)%2)?'#0d1022':'#0f1326';ctx.fillRect(sx,sy,ETS,ETS);}}
 // damper field
 const cx=EOX+EW*ETS/2,cy=EOY+EH*ETS/2;for(let i=0;i<3;i++){const r=((H.t*30+i*60)%180);ctx.strokeStyle=`rgba(192,90,255,${0.25*(1-r/180)})`;ctx.beginPath();ctx.arc(cx,cy,r,0,7);ctx.stroke();}
 ctx.fillStyle='rgba(160,80,255,0.05)';for(let y=EOY+((H.t*20)|0)%8;y<EOY+EH*ETS;y+=8)ctx.fillRect(EOX,y,EW*ETS,2);
 for(const it of H.items){const x=EOX+it.x*ETS+8,y=EOY+it.y*ETS+8;if(it.k==='c')drawCoin(x,y,H.t,it.x+it.y);else puIcon(x,y,it.k,H.t,9);}
 for(const e of H.en){const [x,y]=epos(e);if(e.t<e.act){ctx.globalAlpha=0.35+0.3*Math.sin(H.t*10);}const st=e.stun>0||H.stun>0;ctx.fillStyle='rgba(0,0,0,0.35)';ctx.fillRect(x-5,y+6,10,2);{const dx=e.nx-e.tx,dy=e.ny-e.ty;if(dx||dy)e.fd=Math.abs(dx)>Math.abs(dy)?(dx>0?1:3):(dy>0?2:0);const fi=e.moving||dx||dy?((H.t*8+e.k)|0)&3:0;draw(st&&(H.t*10|0)%2?ART.tdW[e.k]:ART.td.ch[e.k][e.fd||0][fi],x,y,1);}ctx.globalAlpha=1;if(H.stun>0){ctx.strokeStyle='#5ad0ff';ctx.strokeRect(x-8.5,y-8.5,17,17);}}
 const p=H.p,[px,py]=epos(p);if(!H.dead&&!(p.inv>0&&(H.t*20|0)%2)){if(H.surge>0)glow(px,py,9,'#9aff5a',0.3);ctx.fillStyle='rgba(0,0,0,0.35)';ctx.fillRect(px-5,py+6,10,2);draw(ART.td.mara[p.face||0][p.moving?((H.t*10)|0)&3:0],px,py,1);}
 if(L.dark||/NURSERY/i.test(L.name)){if(!H.dead)darkness(px,py,0.55,120);for(const e of H.en){const [x,y]=epos(e);glow(x,y-2,3,'#ff3a6a',0.6);}}
 drawFx(H.fx);ctx.restore();
 // HUD
 hudTop('SUIT',p.hp,p.mhp);
 txt('CR '+(S.cr+runCr),236,6,'#ffd23a',8,'right');
 if(!H.unlocked){txt('DOOR UNLOCK IN '+Math.ceil(H.lockT)+'s',W/2,18,'#ff9ab0',8);bar(60,30,150,4,1-H.lockT/H.lockMax,'#ff3a6a','#2a0a14');}else txt('DOOR OPEN - GET OUT',W/2,18,'#9aff5a',8);
 if((H.t*2|0)%2)txt('WEAPON OFFLINE',4,34,'#c05aff',7,'left');
 if(H.stun>0)txt('FLICKER '+H.stun.toFixed(1),W-4,34,'#5ad0ff',7,'right');if(H.surge>0)txt('SURGE '+H.surge.toFixed(1),W-4,34,'#9aff5a',7,'right');
 if(H.t<4)txt('CHAPTER '+(curLvl+1)+': '+L.name,W/2,200,'#fff',9);
 if(H.dead)txt(H.msg,W/2,220,'#ff3a6a',10);if(H.won)txt('YOU MADE IT',W/2,220,'#9aff5a',10);
 ctx.fillStyle='#070912';ctx.fillRect(0,384,W,HEIGHT_-384);const lab={U:'^',L:'<',R:'>',D:'v'};for(const k in EB){const b=EB[k];blit(uiArt(b[2],b[3],'#5ab0ff','btn',0),b[0],b[1],b[2],b[3]);txt(lab[k],b[0]+b[2]/2,b[1]+b[3]/2-4,'#bfe8ff',9);}
 txt(hasTouch?'Swipe anywhere to turn':'Arrows/WASD to turn',8,470,'#56607e',7,'left');
 pauseBtn();}

// ---------- screens ----------
function drawTitle(dt){ctx.fillStyle='#05060f';ctx.fillRect(0,0,W,H);stars(dt,2);
 txt('VOID',W/2,70,'#5ab0ff',34);txt('RUNNER',W/2,108,'#ff6a3a',30);txt('THE LANTERN CHRONICLE',W/2,146,'#8aa0d0',8);
 {const fi=(T*20|0)%4,ty=200+Math.sin(T*2)*4;blit(ART.flame[fi],W/2-24,ty+26,16,30);blit(ART.flame[(fi+2)%4],W/2+8,ty+26,16,30);draw(ART.ship[2],W/2,ty,4);}[[40,'drone'],[90,'weaver'],[180,'gun'],[230,'kami']].forEach(([x,k],i)=>draw(ART.en[k][((T*8)|0)&3],x,262+Math.sin(T*2+i)*5,2));
 const cont=S.lvl>0;btn(cont?'CONTINUE - CH '+(S.lvl+1):'START',60,290,150,30,cont?()=>{state='shop';}:newGame,'#9aff5a');
 if(cont)btn('NEW GAME',60,330,150,26,newGame);
 btn('SOUND: '+(S.sound?'ON':'OFF'),60,366,150,22,()=>{S.sound=S.sound?0:1;save();},'#8aa0d0');gfxBtns(60,394);
 txt(S.ng?'NEW GAME+ ACTIVE':'',W/2,426,'#ffd23a',7);
 txt('Original game. Art & sound made in code.',W/2,450,'#3a4466',7);txt(hasTouch?'Best in portrait':'Keys: arrows, Space/Z jump, X fire, Up/Down aim',W/2,462,'#3a4466',7);
 defaultAct=cont?()=>{state='shop';}:newGame;}
function drawStory(dt){const L=LV[curLvl];ctx.fillStyle='#03040a';ctx.fillRect(0,0,W,H);stars(dt,0.3);stT+=dt;
 txt('CHAPTER '+(curLvl+1),W/2,40,'#8aa0d0',8);txt(L.name,W/2,54,L.t==='space'?'#5ab0ff':L.t==='hack'?'#9aff5a':L.t==='evade'?'#c05aff':'#ffa03a',12);
 txt(L.t==='space'?'[ SPACE FLIGHT ]':L.t==='hack'?'[ HACKING ]':L.t==='evade'?'[ EVASION - NO WEAPONS ]':'[ ON FOOT ]',W/2,72,'#56607e',7);
 panel(8,92,W-16,338,'#2a3a6a');let chars=Math.floor(stT*45),all=true;const blocks=[];
 for(const para of L.story){if(chars<=0){all=false;break;}const m=para.match(/^([A-Z ]+?)( \([^)]*\))?: (.*)$/),who=m?m[1]+(m[2]||''):'',body=m?m[3]:para,k=m?m[1]:null,ind=k?48:0;
  const lines=[],src=wrap(body,W-46-ind,9);for(const ln of src){if(chars<=0){all=false;break;}lines.push(ln.slice(0,chars));chars-=ln.length;if(chars<0)all=false;}
  blocks.push({who,k,lines,ind,h:Math.max(k?42:0,(who?12:0)+lines.length*12)+8});if(chars<=0&&!all)break;}
 const CT=99,CB=424,top=CT+7,bot=CB-6;let tot=blocks.reduce((a,b)=>a+b.h,0),sc=Math.max(0,tot-(bot-top)),y=top-sc;
 ctx.save();ctx.beginPath();ctx.rect(13,CT,W-26,CB-CT);ctx.clip();
 blocks.forEach((b,bi)=>{if(y+b.h>top-10){if(b.k)portrait(b.k,16,y,T);const x=18+b.ind;let yy=y;if(b.who){txt(b.who,x,yy,SPK[b.k]||'#ffd23a',8,'left');yy+=12;}
  for(const ln of b.lines){txt(ln,x,yy,b.who?'#dfe8ff':'#9aa8c8',9,'left');yy+=12;}if(bi===blocks.length-1&&!all&&(T*4|0)%2){ctx.fillStyle='#dfe8ff';ctx.fillRect(x+tw(b.lines[b.lines.length-1]||'',9)+2,yy-12,4,7);}}y+=b.h;});
 if(sc>0){const fg=ctx.createLinearGradient(0,CT,0,CT+14);fg.addColorStop(0,'rgba(10,15,34,1)');fg.addColorStop(1,'rgba(10,15,34,0)');ctx.fillStyle=fg;ctx.fillRect(13,CT,W-26,14);}
 ctx.restore();if(tot>bot-top){const th=(bot-top)*(bot-top)/tot;ctx.fillStyle='#16203e';ctx.fillRect(W-17,top,2,bot-top);ctx.fillStyle='#4a6ab0';ctx.fillRect(W-17,top+(bot-top-th)*(sc/(tot-(bot-top))),2,th);}
 if(all&&(T*2|0)%2)txt(hasTouch?'TAP TO LAUNCH':'PRESS ENTER',W/2,440,'#9aff5a',9);
 const go=()=>{if(!all)stT=999;else startLevel(curLvl);};anyTap=go;defaultAct=go;}
function drawShop(dt){ctx.fillStyle='#060814';ctx.fillRect(0,0,W,H);ctx.fillStyle='#0c1228';for(let y=0;y<H;y+=8)ctx.fillRect(0,y,W,1);
 panel(4,50,W-8,302,'#2a4a8a');txt('HANGAR',W/2,12,'#5ab0ff',16);txt('CREDITS: '+S.cr,W/2,34,'#ffd23a',9);
 let y=54;for(const [sec,items] of SHOP){txt(sec==='SHIP'?'-- SHIP SYSTEMS --':sec==='SUIT'?'-- EXO-SUIT --':'-- HACK RIG --',W/2,y,sec==='SHIP'?'#5ab0ff':sec==='SUIT'?'#ffa03a':'#9aff5a',8);y+=14;
  for(const it of items){const lv=S[it[0]],mx=it[3],max=lv>=mx,c=cost(it);
   txt(it[1],12,y+2,'#fff',8,'left');txt(it[2],12,y+13,'#6a7494',7,'left');
   for(let i=0;i<mx;i++){ctx.fillStyle=i<lv?'#9aff5a':'#262c44';ctx.fillRect(112+i*8,y+5,6,6);}
   btn(max?'MAX':c+' CR',190,y,72,24,()=>{if(S.cr>=c&&S[it[0]]<mx){S.cr-=c;S[it[0]]++;save();SFX.buy();}},'#ffd23a',max||S.cr<c);y+=30;}y+=4;}
 const nxt=Math.min(S.lvl,LV.length-1);btn('LAUNCH: CH '+(nxt+1)+' '+LV[nxt].name,10,y+6,250,30,()=>goStory(nxt),'#9aff5a');
 btn('TITLE',10,y+42,80,22,()=>{state='title';},'#8aa0d0');
 defaultAct=()=>goStory(nxt);}
function drawClear(dt){stT+=dt;ctx.fillStyle='rgba(0,0,0,0.5)';ctx.fillRect(0,0,W,H);const L=LV[curLvl];panel(20,150,W-40,150,'#9aff5a');
 txt(L.t==='space'?'SECTOR CLEARED':L.t==='hack'?'LOCK CRACKED':L.t==='evade'?'ESCAPED':'AREA SECURED',W/2,170,'#9aff5a',14);txt('Collected: '+clearInfo.got+' CR',W/2,200,'#ffd23a',9);txt('Mission bonus: '+clearInfo.bonus+' CR',W/2,214,'#ffd23a',9);txt('Total: '+S.cr+' CR',W/2,232,'#fff',9);
 const go=()=>{if(stT<0.8)return;if(L.final){S.ng=1;S.lvl=0;save();state='win';stT=0;}else state='shop';};if(stT>0.8&&(T*2|0)%2)txt('TAP TO CONTINUE',W/2,280,'#8aa0d0',8);anyTap=go;defaultAct=go;}
function drawOver(dt){stT+=dt;ctx.fillStyle='rgba(20,0,8,0.75)';ctx.fillRect(0,0,W,H);panel(20,140,W-40,200,'#ff3a6a');txt('MISSION FAILED',W/2,160,'#ff3a6a',16);txt('Credits from this run were lost.',W/2,186,'#c08aa0',8);txt('Upgrade in the hangar and try again.',W/2,198,'#c08aa0',8);
 btn('RETRY',60,230,150,30,()=>startLevel(curLvl),'#9aff5a');btn('HANGAR',60,270,150,26,()=>{state='shop';});btn('TITLE',60,304,150,22,()=>{state='title';},'#8aa0d0');defaultAct=()=>startLevel(curLvl);}
function drawPause(){ctx.fillStyle='rgba(0,0,10,0.7)';ctx.fillRect(0,0,W,H);panel(30,135,W-60,225);txt('PAUSED',W/2,150,'#fff',16);btn('RESUME',60,190,150,30,resume,'#9aff5a');btn('SOUND: '+(S.sound?'ON':'OFF'),60,230,150,24,()=>{S.sound=S.sound?0:1;save();});btn('RESTART LEVEL',60,262,150,24,()=>startLevel(curLvl),'#ffa03a');btn('QUIT TO TITLE',60,294,150,24,()=>{state='title';},'#8aa0d0');gfxBtns(60,326);defaultAct=resume;}
function drawWin(dt){stT+=dt;ctx.fillStyle='#000';ctx.fillRect(0,0,W,H);stars(dt,0.5);const r=Math.max(0,60-stT*20);if(r){ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(W/2,120,r,0,7);ctx.fill();}
 txt('VICTORY',W/2,40,'#ffd23a',18);let y=170;const n=Math.floor(stT/1.2)+1;ENDING.slice(0,n).forEach(s=>{for(const ln of wrap(s,W-30,9)){txt(ln,W/2,y,'#dfe8ff',9);y+=13;}y+=8;});
 if(n>ENDING.length){txt('New Game+ unlocked: harder enemies, upgrades kept.',W/2,410,'#9aff5a',7);if((T*2|0)%2)txt('TAP FOR TITLE',W/2,430,'#8aa0d0',8);anyTap=defaultAct=()=>{state='title';};}}

function drawMode(dt){if(G.mode==='space')drawSpace(dt);else if(G.mode==='hack')drawHack(dt);else if(G.mode==='evade')drawEvade(dt);else drawPlat();}
// ---------- main ----------
let last=0,T=0;const PF=[];
function frame(ts){const rdt=Math.min(0.033,(ts-last)/1000||0);last=ts;T+=rdt;const dt=HS>0?0:rdt;HS=Math.max(0,HS-rdt);const pf0=performance.now();BTN=[];anyTap=null;defaultAct=null;
 try{if(state==='space')updSpace(dt);else if(state==='plat')updPlat(dt);else if(state==='hack')updHack(dt);else if(state==='evade')updEvade(dt);
 ctx.setTransform(RQ,0,0,RQ,0,0);ctx.imageSmoothingEnabled=false;
 switch(state){case 'title':drawTitle(dt);break;case 'story':drawStory(dt);break;case 'shop':drawShop(dt);break;
  case 'space':drawSpace(dt);break;case 'plat':drawPlat();break;case 'hack':drawHack(dt);break;case 'evade':drawEvade(dt);break;
  case 'pause':drawMode(0);BTN=[];drawPause();break;
  case 'clear':drawMode(dt);BTN=[];drawClear(dt);break;
  case 'over':drawMode(dt);BTN=[];drawOver(dt);break;
  case 'win':drawWin(dt);break;}
 postFX(rdt);handleTaps();}catch(err){console.error(err);}PF.push(performance.now()-pf0);if(PF.length>600)PF.shift();
 for(const id in ptrs){ptrs[id].px=ptrs[id].x;ptrs[id].py=ptrs[id].y;}
 music(dt);requestAnimationFrame(frame);}
requestAnimationFrame(frame);
window.VR={bossMask:()=>{const b=G.boss,M=bossMask(b.art);return {w:M.w,h:M.h,m:Array.from(M.m),bx:b.x,by:b.y,bw:b.w,bh:b.h};},bossHit:(x,y)=>bossHit(G.boss,x,y),SHIP:()=>({hw:SHIP_HW,hb:SHIP_HB}),perf:()=>{const a=PF.slice().sort((x,y)=>x-y);return {n:a.length,avg:a.reduce((x,y)=>x+y,0)/Math.max(1,a.length),p95:a[Math.floor(a.length*0.95)]||0,max:a[a.length-1]||0,rq:RQ};},perfReset:()=>{PF.length=0;},ev:{H:()=>G,open:(x,y)=>eopen(G,x,y),bfs:(x,y,door)=>Array.from(ebfs(G,x,y,door)),want:i=>evWant(i),target:i=>etarget(G,G.en[i]),tile:m=>etile(m),place:(x,y,dir)=>{const p=G.p;p.tx=p.nx=x;p.ty=p.ny=y;p.p=0;p.moving=false;p.dir=dir==null?null:EDIRS[dir];p.want=null;},EW,EH},hk:{H:()=>G,fits:(k,r,x,y)=>hfits(G,k,r,x,y),spawn:k=>hspawn(G,k),move:d=>hmove(G,d),rot:d=>hrot(G,d),soft:()=>hsoft(G),hard:()=>hhard(G),hold:()=>hholdP(G),cells:()=>hcells(G.p),setRow:(y,arr)=>{for(let x=0;x<HW;x++)G.b[y*HW+x]=arr[x]?'J':0;}},palette:()=>{const px=c=>{const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data,o=[];for(let i=0;i<d.length;i+=4)if(d[i+3]>0)o.push([d[i],d[i+1],d[i+2]]);return o;};const pu={};for(const k in PU){const c=document.createElement('canvas');c.width=c.height=20;const x=c.getContext('2d');const sv=ctx;ctx=x;pu[k]=[];for(let f=0;f<4;f++){x.clearRect(0,0,20,20);puIcon(10,10,k,f/8+0.01,9);pu[k].push(...px(c));}ctx=sv;}return {eb:[...DANGER,DANGER_FOOT].map(c=>ebSpr(c).flatMap(px)),coin:COIN.flatMap(px),pu,hp:[[154,255,90]]};},arena:()=>G.arena,spawn:(k,dx,dy)=>{const p=G.p,e=mkPE(k,0,0,1);e.x=p.x+dx;e.y=p.y+dy;e.by=e.y;e.vx=0;G.ens.push(e);return e;},phys:()=>({PHYS,JUMP_H,TS,ROWS,PW:MARA_W,PHh:MARA_H}),god:false,start:i=>startLevel(i),state:()=>state,G:()=>G,S:()=>S,story:i=>goStory(i),shop:()=>{state='shop';},
 boss:()=>{if(G.mode==='hack'||G.mode==='evade')return;if(G.mode==='space'){G.t=G.waves.len+1;G.waves.list=[];G.en=[];}else{G.p.x=G.brute.x-150;G.p.y=G.brute.y-20;G.p.vy=0;}},
 pu:k=>givePU(k),drop:k=>{const p=G.p;G.coins.push(G.mode==='space'?{x:p.x,y:p.y-60,k:'pu',w:k,life:8,vx:0,vy:20,v:0}:{x:p.x+30,y:p.y+5,k:'pu',w:k,life:8,vx:0,vy:0,v:0});},
 kill:()=>{if(G.mode==='evade'){G.won=0.8;return;}if(G.mode==='hack'){G.lines=G.target;G.won=1;G.p=null;return;}if(G.mode==='space'&&G.boss)G.boss.hp=1;else if(G.brute)G.brute.hp=1;}};
if('serviceWorker' in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('sw.js').catch(()=>{});
