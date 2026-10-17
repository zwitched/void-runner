// turret test bots: (profile, runs, chapter index, difficulty) -> results. Used by test_v9_turret_eased.py.
(prof,n,ti,dfi)=>{const out=[];const g=()=>Math.sqrt(-2*Math.log(Math.random()+1e-9))*Math.cos(6.283*Math.random());
for(let r=0;r<n;r++){VR.setS({diff:dfi,tdmg:0,tcool:0,ttwin:0});if(!prof.keepCk)FT.turCk=null;VR.start(ti);const H=VR.G();H.p.hp=H.p.mhp;let f=0,tgt=null,rt=0,err=0,et=0,aim=H.ang;
 while(f<60*400&&!H.won&&!H.dead){const dt=1/60;rt-=dt;et-=dt;
  if(prof.idle){H.botHold=false;updTurret(dt);f++;continue;}
  if(rt<=0||!tgt||tgt.dead){rt=prof.re;let best=null,bd=1e9;
   for(const e of H.en){const d=prof.smart?(e.k==='crawler'?(Math.abs(e.x-TG.gx)-TG.door)/(Math.abs(e.vx)+1):e.k==='breacher'?0.8:Math.hypot(e.x-TG.gx,e.y-TG.gy)/50):Math.hypot(e.x-TG.gx,e.y-TG.gy);if(d<bd){bd=d;best=e;}}
   if(prof.shots)for(const b of H.eb){const d=prof.smart?Math.hypot(b.x-TG.gx,b.y-TG.gy-10)/Math.hypot(b.vx,b.vy)-0.3:Math.hypot(b.x-TG.gx,b.y-TG.gy);if(d<bd){bd=d;best=b;}}tgt=best;}
  if(et<=0){et=0.5;err=g()*prof.err;}
  if(tgt&&!tgt.dead){let px=tgt.x,py=tgt.y;if(prof.lead){const vx=tgt.vx||0,vy=tgt.vy||0,lt=Math.hypot(px-TG.gx,py-TG.gy)/430;px+=vx*lt;py+=vy*lt;}
   const want=Math.atan2(py-TG.gy,px-TG.gx)+err;let d=Math.atan2(Math.sin(want-aim),Math.cos(want-aim));const m=prof.turn*dt;aim+=Math.max(-m,Math.min(m,d));}
  aim=tClampAng(aim);H.ang=aim;H.botHold=!!tgt&&!tgt.dead&&(prof.heat?H.heat<prof.heat:true);updTurret(dt);aim=H.ang;f++;}
 out.push({won:H.won>0,dead:H.dead>0,rep:Math.round(H.rep),hp:H.p.hp,mhp:H.p.mhp,t:Math.round(H.t),hit:H.hitBy});}return out;}
