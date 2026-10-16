# EVASION maze: connectivity, AI chase/catch, buffered swipe turns, damage/invuln, fail+retry, door, campaign.
import asyncio,pathlib
from playwright.async_api import async_playwright
TT='''(()=>{window.__act={};window.__tt=(type,pts)=>{const c=document.getElementById('c'),r=c.getBoundingClientRect();const mk=q=>new Touch({identifier:q.id,target:c,clientX:r.left+q.x*r.width/270,clientY:r.top+q.y*r.height/480});
 const ch=[];if(type!=='touchend'){for(const q of pts){__act[q.id]=q;ch.push(mk(q));}c.dispatchEvent(new TouchEvent(type,{bubbles:true,cancelable:true,changedTouches:ch,touches:Object.values(__act).map(mk)}));}
 else{const g=pts.map(q=>mk(__act[q.id]||q));pts.forEach(q=>delete __act[q.id]);c.dispatchEvent(new TouchEvent(type,{bubbles:true,cancelable:true,changedTouches:g,touches:Object.values(__act).map(mk)}));}}})()'''
EV=(3,10)
async def main():
  errs=[];bad=[];out=[]
  async with async_playwright() as p:
    b=await p.chromium.launch();pg=await (await b.new_context(**p.devices['Pixel 7'])).new_page()
    pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:errs.append(m.text) if m.type=='error' else None)
    await pg.goto('file://'+str(pathlib.Path(__file__).parent.resolve()/'dist/index.html'));await pg.wait_for_timeout(300)
    E=pg.evaluate;await E(TT);T=lambda typ,pts:E('([t,p])=>__tt(t,p)',[typ,pts])
    def chk(n,ok,info=None):
      out.append((n,'OK' if ok else 'FAIL',info))
      if not ok:bad.append((n,info))
    async def fresh(i=3,keep=None):
      await E(f"VR.god=false;VR.start({i})");await pg.wait_for_timeout(50)
      await E(f"(()=>{{const G=VR.ev.H();G.lockT=999;G.lockMax=999;G.p.inv=0;{'G.en=G.en.filter(e=>'+str(keep)+'.includes(e.k));' if keep is not None else ''}}})()")
    # 1) connectivity, spawn safety, door reachability
    for i in EV:
      await E(f"VR.start({i})");r=await E("""(()=>{const G=VR.ev.H(),W=VR.ev.EW,H=VR.ev.EH,d=VR.ev.bfs(7,19,true),dl=VR.ev.bfs(7,19,false);let open=0,reach=0;
        for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(!G.g[y*W+x]){open++;if(d[y*W+x]>=0)reach++;}
        return {open,reach,door:d[7],doorLocked:dl[7],spawn:G.en.map(e=>dl[e.ty*W+e.tx]),n:G.en.length,lock:G.lockT,outer:[...Array(W).keys()].every(x=>G.g[x]||x==7)&&[...Array(W).keys()].every(x=>G.g[(H-1)*W+x])}})()""")
      chk(f'ch{i+1} maze fully connected',r['open']==r['reach'],r);chk(f'ch{i+1} door reachable when open, sealed when locked',r['door']>0 and r['doorLocked']==-1,r)
      chk(f'ch{i+1} spawn safety (>=12 steps)',min(r['spawn'])>=12,r['spawn']);chk(f'ch{i+1} enemies/timer',r['n']==(3 if i==3 else 4) and 45<=r['lock']<=90,r)
    # 2) AI: every enemy moves; targets reflect personalities; stalker catches a still player
    await fresh(10);await E("VR.god=true;VR.ev.H().en.forEach(e=>e.act=0)");p0=await E("VR.ev.H().en.map(e=>[e.tx,e.ty])");await pg.wait_for_timeout(3000)
    p1=await E("VR.ev.H().en.map(e=>[e.tx,e.ty])");chk('all 4 enemies move',all(a!=b for a,b in zip(p0,p1)),(p0,p1))
    await E("VR.ev.place(7,19,1)");tg=await E("[0,1,3].map(i=>VR.ev.target(i))");chk('distinct AI targets (chase/ambush/flank)',len({tuple(t) for t in tg})==3,tg)
    await fresh(3,[0]);await E("(()=>{const G=VR.ev.H(),e=G.en[0],d=VR.ev.bfs(7,19,false);let k=d.findIndex(v=>v===8);e.tx=e.nx=e.hx=k%15;e.ty=e.ny=e.hy=Math.floor(k/15);e.act=0;e.t=0;})()");hp0=await E('VR.ev.H().p.hp')
    d0=await E("(()=>{const G=VR.ev.H(),d=VR.ev.bfs(7,19,false),e=G.en[0];return d[e.ty*15+e.tx]})()")
    for _ in range(150):
      await pg.wait_for_timeout(100)
      if await E('VR.ev.H().p.hp')<hp0:break
    chk('stalker chases and catches',await E('VR.ev.H().p.hp')==hp0-1,d0)
    # 3) buffered swipe turn applied at next junction
    await fresh(3,[]);sc=await E("""(()=>{const G=VR.ev.H(),o=(x,y)=>VR.ev.open(x,y);for(let y=1;y<20;y++)for(let x=1;x<12;x++){if(!o(x,y)||o(x,y-1))continue;let j=x+1;while(o(j,y)&&!o(j,y-1))j++;if(o(j,y)&&o(j,y-1)&&j-x>=2)return [x,y,j];}return null})()""")
    await E(f"VR.ev.place({sc[0]},{sc[1]},1)");await pg.wait_for_timeout(60)
    await T('touchstart',[{'id':1,'x':135,'y':250}]);await T('touchmove',[{'id':1,'x':136,'y':226}]);await T('touchend',[{'id':1}])
    w=await E('VR.ev.H().p.want');await pg.wait_for_timeout(int((sc[2]-sc[0])*250+600))
    st=await E("(()=>{const p=VR.ev.H().p;return [p.dir,VR.ev.tile(p)]})()")
    chk('swipe up buffered, turns at junction',w==[0,-1] and st[0]==[0,-1] and st[1][0]==sc[2] and st[1][1]<sc[1],(sc,w,st))
    # swipe left reverses immediately; keyboard turns
    await E(f"VR.ev.place({sc[0]},{sc[1]},1)");await pg.wait_for_timeout(100);await T('touchstart',[{'id':2,'x':150,'y':250}]);await T('touchmove',[{'id':2,'x':128,'y':251}]);await T('touchend',[{'id':2}]);await pg.wait_for_timeout(50)
    chk('swipe left reverses',await E('VR.ev.H().p.dir')==[-1,0])
    await E("VR.ev.place(7,19,null)");kd=await E("VR.ev.open(6,19)?'ArrowLeft':'ArrowUp'");await pg.keyboard.press(kd);await pg.wait_for_timeout(400);tl=await E('VR.ev.tile(VR.ev.H().p)');chk('keyboard turn',tl!=[7,19],(kd,tl))
    # D-pad
    await E("VR.ev.place(7,19,null)");await T('touchstart',[{'id':3,'x':184,'y':433}]);await T('touchend',[{'id':3}]);await pg.wait_for_timeout(400);chk('D-pad right',await E('VR.ev.tile(VR.ev.H().p)[0]')>7)
    # 4) hit -> damage + invulnerability, enemy knocked home
    await fresh(3,[0]);hp0=await E('VR.ev.H().p.hp')
    await E("(()=>{const G=VR.ev.H(),e=G.en[0],p=G.p;e.t=99;e.act=0;e.tx=e.nx=p.tx;e.ty=e.ny=p.ty;e.p=0;e.moving=false;})()");await pg.wait_for_timeout(100)
    r=await E("(()=>{const G=VR.ev.H(),e=G.en[0];return {hp:G.p.hp,inv:G.p.inv,home:e.tx==e.hx&&e.ty==e.hy}})()");chk('hit costs 1 HP, invuln, enemy sent home',r['hp']==hp0-1 and r['inv']>1 and r['home'],r)
    await E("(()=>{const G=VR.ev.H(),e=G.en[0],p=G.p;e.stun=0;e.tx=e.nx=p.tx;e.ty=e.ny=p.ty;e.p=0;})()");await pg.wait_for_timeout(100);chk('no damage while invulnerable',await E('VR.ev.H().p.hp')==hp0-1)
    # stun pickup lets you bump enemies home without damage
    await E("(()=>{const G=VR.ev.H(),e=G.en[0],p=G.p;G.stun=3;p.inv=0;e.tx=e.nx=p.tx;e.ty=e.ny=p.ty;e.p=0;})()");await pg.wait_for_timeout(100);chk('FLICKER stun: contact sends enemy home, no damage',await E('VR.ev.H().p.hp')==hp0-1)
    # 5) fail at 0 HP + retry
    await E("(()=>{const G=VR.ev.H(),e=G.en[0],p=G.p;G.stun=0;p.hp=1;p.inv=0;e.stun=0;e.tx=e.nx=p.tx;e.ty=e.ny=p.ty;e.p=0;})()");await pg.wait_for_timeout(1700)
    chk('0 HP -> fail screen',await E('VR.state()')=='over')
    box=await pg.locator('canvas').bounding_box();tap=lambda x,y:pg.touchscreen.tap(box['x']+x*box['width']/270,box['y']+y*box['height']/480)
    await tap(135,245);await pg.wait_for_timeout(200);chk('RETRY restarts evasion',await E('VR.state()')=='evade' and await E('VR.ev.H().p.hp')==await E('VR.ev.H().p.mhp'))
    # 6) door unlocks at timer, reaching it clears
    await fresh(3,[]);await E("VR.ev.H().lockT=0.05");await pg.wait_for_timeout(150);chk('door unlocks at 0',await E('VR.ev.H().unlocked'))
    await E("VR.ev.place(7,1,null)");await pg.keyboard.press('ArrowUp');await pg.wait_for_timeout(1500);chk('reaching door clears',await E('VR.state()')=='clear')
    await fresh(3,[]);await E("VR.ev.place(7,1,null)");await pg.keyboard.press('ArrowUp');await pg.wait_for_timeout(500);chk('locked door blocks',await E('VR.state()')=='evade' and await E('VR.ev.tile(VR.ev.H().p)')==[7,1])
    # 7) campaign flow: shop -> launch ch4 -> story -> evasion -> door -> cleared -> shop next = ch5
    await E("localStorage.clear();VR.S().lvl=3;VR.S().cr=0;VR.shop()");await pg.wait_for_timeout(200)
    await tap(135,368);await pg.wait_for_timeout(200);s1=await E('VR.state()');await tap(135,300);await pg.wait_for_timeout(100);await tap(135,300);await pg.wait_for_timeout(200)
    s2=await E('VR.state()');await E("(()=>{const G=VR.ev.H();G.en=[];G.lockT=0.01})()");await pg.wait_for_timeout(100);await E("VR.ev.place(7,1,null)");await pg.keyboard.press('ArrowUp');await pg.wait_for_timeout(1500)
    s3=await E('VR.state()');await pg.wait_for_timeout(900);await tap(135,300);await pg.wait_for_timeout(300);s4=await E('VR.state()');lv=await E('VR.S().lvl')
    chk('campaign flow through evasion',[s1,s2,s3,s4,lv]==['story','evade','clear','shop',4],[s1,s2,s3,s4,lv])
    # screenshot
    await E("VR.god=true;VR.start(10)");await pg.wait_for_timeout(100);await E("(()=>{const G=VR.ev.H();G.en.forEach((e,i)=>{e.act=0});G.lockT=21;})()");await pg.keyboard.press('ArrowLeft');await pg.wait_for_timeout(6000)
    await pg.screenshot(path='screenshots/14_evasion.png');await b.close()
  for o in out:print(o)
  print('BAD',bad);print('ERRORS',errs)
asyncio.run(main())
