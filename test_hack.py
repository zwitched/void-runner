# HACKING mode: rotation/collision, line clears, win/lose, touch gestures, keyboard, campaign flow.
import asyncio,pathlib
from playwright.async_api import async_playwright
TT='''(()=>{window.__act={};window.__tt=(type,pts)=>{const c=document.getElementById('c'),r=c.getBoundingClientRect();const mk=q=>new Touch({identifier:q.id,target:c,clientX:r.left+q.x*r.width/270,clientY:r.top+q.y*r.height/480});
 const ch=[];if(type==='touchstart'||type==='touchmove'){for(const q of pts){if(type==='touchstart'&&__act[q.id])continue;if(type==='touchmove'&&!__act[q.id])continue;__act[q.id]=q;ch.push(mk(q));}
  if(ch.length)c.dispatchEvent(new TouchEvent(type,{bubbles:true,cancelable:true,changedTouches:ch,touches:Object.values(__act).map(mk)}));}
 else{const g=pts.map(q=>mk(__act[q.id]||q));pts.forEach(q=>delete __act[q.id]);c.dispatchEvent(new TouchEvent(type,{bubbles:true,cancelable:true,changedTouches:g,touches:Object.values(__act).map(mk)}));}}})()'''
async def main():
  errs=[];bad=[];out=[]
  async with async_playwright() as p:
    b=await p.chromium.launch();pg=await (await b.new_context(**p.devices['Pixel 7'])).new_page()
    pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:errs.append(m.text) if m.type=='error' else None)
    await pg.goto('file://'+str(pathlib.Path(__file__).parent.resolve()/'dist/index.html'));await pg.wait_for_timeout(300)
    E=pg.evaluate;await E(TT)
    T=lambda typ,pts:E('([t,p])=>__tt(t,p)',[typ,pts])
    def chk(name,ok,info=None):
      out.append((name,'OK' if ok else 'FAIL',info))
      if not ok:bad.append((name,info))
    async def fresh(i=1,k='T'):
      await E(f"VR.start({i})");await pg.wait_for_timeout(100);await E(f"(()=>{{const G=VR.hk.H();G.b=G.b.map(()=>0);G.trace=999;VR.hk.spawn('{k}');G.gT=-999;}})()")
    # campaign order
    order=await E("(()=>{const o=[];for(let i=0;i<LV.length;i++){VR.start(i);o.push(VR.G().mode)}return o})()");exp=await E("LV.map(L=>({space:'space',board:'space',hack:'hack',plat:'plat',evade:'evade',engine:'engine',stealth:'stealth',turret:'turret',canyon:'canyon'})[L.t])")
    chk('chapter types',order==exp and order.count('hack')==3,order)
    # 1) rotation: 4 CW rotations return to start; CW then CCW returns
    await fresh();c0=await E('VR.hk.cells()')
    for _ in range(4):await E('VR.hk.rot(1)')
    chk('rotate x4 identity',await E('VR.hk.cells()')==c0)
    await E('VR.hk.rot(1)');await E('VR.hk.rot(-1)');chk('cw then ccw',await E('VR.hk.cells()')==c0)
    # 2) wall collision: move left until stuck stays in bounds; can't pass the wall
    for _ in range(12):await E('VR.hk.move(-1)')
    xs=[c[0] for c in await E('VR.hk.cells()')];chk('left wall',min(xs)==0,xs)
    for _ in range(12):await E('VR.hk.move(1)')
    xs=[c[0] for c in await E('VR.hk.cells()')];chk('right wall',max(xs)==9,xs)
    # 3) wall kick: vertical I against right wall rotates back to horizontal inside bounds
    await fresh(1,'I');await E('VR.hk.rot(1)')
    for _ in range(12):await E('VR.hk.move(1)')
    ok=await E('VR.hk.rot(1)');xs=[c[0] for c in await E('VR.hk.cells()')];chk('I wall kick',ok and max(xs)<=9 and min(xs)>=0,xs)
    # 4) block collision: piece can't move into filled cells
    await fresh(1,'O');await E("(()=>{const G=VR.hk.H();for(let y=0;y<20;y++)G.b[y*10+6]='J';})()");x0=await E('VR.hk.H().p.x')
    for _ in range(5):await E('VR.hk.move(1)')
    xs=[c[0] for c in await E('VR.hk.cells()')];chk('block collision',max(xs)==5,xs)
    # 5) line clear counting: 4 rows full except col 9, vertical I dropped there -> 4 lines
    await fresh(1,'I');await E("for(let y=16;y<20;y++)VR.hk.setRow(y,[1,1,1,1,1,1,1,1,1,0])");await E('VR.hk.rot(1)')
    for _ in range(12):await E('VR.hk.move(1)')
    await E('VR.hk.hard()');await pg.wait_for_timeout(400)
    st=await E("(()=>{const G=VR.hk.H();return {lines:G.lines,filled:G.b.filter(Boolean).length,cr:VR.G()&&0}})()");chk('4-line clear',st['lines']==4 and st['filled']==0,st)
    # partial: 2 rows, O piece fills a 2-wide gap -> 2 lines, leftover none
    await fresh(1,'O');await E("for(let y=18;y<20;y++)VR.hk.setRow(y,[1,1,1,1,0,0,1,1,1,1])")
    await E('VR.hk.hard()');await pg.wait_for_timeout(400);chk('2-line clear',await E('VR.hk.H().lines')==2)
    # 6) win at target
    await fresh(1,'I');tg=await E('VR.hk.H().target');await E(f"VR.hk.H().lines={tg-1};VR.hk.setRow(19,[1,1,1,0,0,0,0,1,1,1])")
    await E('VR.hk.hard()');await pg.wait_for_timeout(1700);chk('win at target',await E('VR.state()')=='clear',(tg,await E('VR.state()')))
    # 7) loss at top-out
    await fresh(1,'T');await E("for(let y=1;y<20;y++)VR.hk.setRow(y,[1,1,1,1,1,1,1,1,1,y%2])");await E('VR.hk.spawn("O")')
    await pg.wait_for_timeout(1700);chk('top-out -> fail',await E('VR.state()')=='over')
    # retry works
    await pg.mouse.click(0,0);await E("VR.start(1)");await pg.wait_for_timeout(100);chk('retry restarts hack',await E('VR.state()')=='hack')
    # trace timeout
    await E('VR.hk.H().trace=0.05');await pg.wait_for_timeout(1700);chk('trace timeout -> fail',await E('VR.state()')=='over')
    # 8) touch gestures
    await fresh(1,'T');r0=await E('VR.hk.H().p.r')
    await T('touchstart',[{'id':1,'x':70,'y':200}]);await T('touchend',[{'id':1}]);await pg.wait_for_timeout(50)
    chk('tap rotates',await E('VR.hk.H().p.r')==(r0+1)%4)
    x0=await E('VR.hk.H().p.x');await T('touchstart',[{'id':2,'x':60,'y':200}])
    for dx in range(0,40,4):await T('touchmove',[{'id':2,'x':60+dx,'y':200}])
    await T('touchend',[{'id':2}]);chk('drag right 3 cells',await E('VR.hk.H().p.x')-x0==3,await E('VR.hk.H().p.x')-x0)
    x0=await E('VR.hk.H().p.x');await T('touchstart',[{'id':3,'x':100,'y':200}])
    for dx in range(0,26,2):await T('touchmove',[{'id':3,'x':100-dx,'y':200}])
    await T('touchend',[{'id':3}]);chk('drag left 2 cells',x0-await E('VR.hk.H().p.x')==2)
    y0=await E('VR.hk.H().p.y');await T('touchstart',[{'id':4,'x':70,'y':150}])
    for dy in range(0,44,4):await T('touchmove',[{'id':4,'x':70,'y':150+dy}])
    await pg.wait_for_timeout(400);await T('touchend',[{'id':4}]);dy=await E('VR.hk.H().p.y')-y0;chk('slow swipe down = soft drop 3',dy==3,dy)
    n0=await E('VR.hk.H().pieces');await T('touchstart',[{'id':5,'x':70,'y':150}]);await T('touchmove',[{'id':5,'x':72,'y':200}]);await T('touchend',[{'id':5}]);await pg.wait_for_timeout(50)
    chk('flick down = hard drop',await E('VR.hk.H().pieces')==n0+1)
    # on-screen buttons: HOLD, ROT, DROP
    await E("VR.hk.H().gT=-999");k0=await E('VR.hk.H().p.k');await T('touchstart',[{'id':6,'x':246,'y':430}]);await T('touchend',[{'id':6}])
    chk('HOLD button',await E('VR.hk.H().hold')==k0)
    r0=await E('VR.hk.H().p.r');await T('touchstart',[{'id':7,'x':114,'y':430}]);await T('touchend',[{'id':7}]);chk('ROT button',await E('VR.hk.H().p.r')!=r0 or await E('VR.hk.H().p.k')=='O')
    n0=await E('VR.hk.H().pieces');await T('touchstart',[{'id':8,'x':202,'y':430}]);await T('touchend',[{'id':8}]);chk('DROP button',await E('VR.hk.H().pieces')==n0+1)
    x0=await E('VR.hk.H().p.x');await E("VR.hk.H().gT=-999");await T('touchstart',[{'id':9,'x':26,'y':430}]);await pg.wait_for_timeout(120);await T('touchend',[{'id':9}]);chk('< button moves',await E('VR.hk.H().p.x')<x0)
    # keyboard
    await fresh(1,'T');x0=await E('VR.hk.H().p.x');await pg.keyboard.press('ArrowRight');chk('key right',await E('VR.hk.H().p.x')==x0+1)
    await pg.keyboard.press('ArrowUp');chk('key rotate',await E('VR.hk.H().p.r')==1);await pg.keyboard.press('KeyZ');chk('key ccw',await E('VR.hk.H().p.r')==0)
    n0=await E('VR.hk.H().pieces');await pg.keyboard.press('Space');await pg.wait_for_timeout(50);chk('key hard drop',await E('VR.hk.H().pieces')==n0+1)
    # gravity speeds up with level; Decrypter slows it
    g=await E("(()=>{const G=VR.hk.H(),o=[];for(const l of [1,3,6]){G.lvl=l;G.dec=0;o.push(hgrav(G))}G.lvl=1;G.dec=2;o.push(hgrav(G));return o})()")
    chk('gravity scaling',g[0]>g[1]>g[2] and g[3]>g[0],g)
    tg=await E("['ASTER-9 AIRLOCK','SURVEY BEACON','SPIRE LOCK'].map(n=>{VR.start(VR.ix(n));return VR.G().target})");chk('targets scale',tg==sorted(tg) and tg[0]>=8 and tg[-1]<=20,tg)
    # campaign flow: new game -> ch1 space (shortcut clear) -> shop -> ch2 hack -> real play clear -> shop shows ch3 on foot
    await E("localStorage.clear();location.reload()");await pg.wait_for_timeout(600);await E(TT)
    box=await pg.locator('canvas').bounding_box();tap=lambda x,y:pg.touchscreen.tap(box['x']+x*box['width']/270,box['y']+y*box['height']/480)
    await tap(135,305);await pg.wait_for_timeout(300);await tap(135,300);await pg.wait_for_timeout(100);await tap(135,300);await pg.wait_for_timeout(300)
    await E('VR.god=true;VR.boss()');await pg.wait_for_timeout(3000);await E('VR.kill()');await pg.wait_for_timeout(5000)
    s1=await E('VR.state()');await tap(135,300);await pg.wait_for_timeout(1200);await tap(135,300);await pg.wait_for_timeout(300);s2=await E('VR.state()')
    await tap(135,370);await pg.wait_for_timeout(300);await tap(135,300);await pg.wait_for_timeout(100);await tap(135,300);await pg.wait_for_timeout(300)
    s3=await E('VR.state()');mode=await E('VR.G().mode')
    # actually clear lines with real drops until target (prepare rows so each I drop clears 4)
    for _ in range(3):
      await E("(()=>{const G=VR.hk.H();G.b=G.b.map(()=>0);for(let y=16;y<20;y++)VR.hk.setRow(y,[1,1,1,1,1,1,1,1,1,0]);VR.hk.spawn('I');VR.hk.rot(1);for(let i=0;i<12;i++)VR.hk.move(1);VR.hk.hard();})()");await pg.wait_for_timeout(400)
    await pg.wait_for_timeout(1500);s4=await E('VR.state()');lv=await E('VR.S().lvl')
    await tap(135,300);await pg.wait_for_timeout(1000);s5=await E('VR.state()')
    chk('campaign flow',[s1,s2,s3,mode,s4,lv,s5]==['clear','shop','hack','hack','clear',2,'shop'],[s1,s2,s3,mode,s4,lv,s5])
    # screenshot
    await E("VR.S().dec=2;VR.start(VR.ix('SURVEY BEACON'))");await pg.wait_for_timeout(200)
    await E("""(()=>{const G=VR.hk.H(),ks='JLSZTOI';for(let y=13;y<20;y++)for(let x=0;x<10;x++)G.b[y*10+x]=(x===(y*3)%10||(y<15&&x>6))?0:ks[(x+y)%7];G.hold='T';G.lines=5;G.trace=133;VR.hk.spawn('L');G.p.x=6;G.p.y=4;G.gT=-999;})()""")
    await pg.wait_for_timeout(300);await pg.screenshot(path='screenshots/13_hack.png')
    await b.close()
  for o in out:print(o)
  print('BAD',bad);print('ERRORS',errs)
asyncio.run(main())
