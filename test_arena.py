# Boss arena integrity + brute fall failsafe: every on-foot level must stay completable.
import asyncio,pathlib
from playwright.async_api import async_playwright
async def main():
  errs=[];bad=[];out=[]
  async with async_playwright() as p:
    b=await p.chromium.launch();pg=await (await b.new_context(**p.devices['Pixel 7'])).new_page()
    pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:errs.append(m.text) if m.type=='error' else None)
    await pg.goto('file://'+str(pathlib.Path(__file__).parent.resolve()/'dist/index.html'));await pg.wait_for_timeout(300)
    E=pg.evaluate
    for lvl in (1,3,6):
      await E(f'VR.god=true;VR.start({lvl})');await pg.wait_for_timeout(200)
      gaps=await E("""(()=>{const G=VR.G(),A=VR.arena(),TS=16,R=22,bad=[];for(let X=Math.floor(A.x0/TS)-4;X<G.cols-1;X++){for(let Y=A.gy;Y<R;Y++)if(G.map[Y*G.cols+X]!==1){bad.push(X);break;}if(G.map[(A.gy-1)*G.cols+X]!==0&&X<G.cols-1)bad.push('blk'+X);}return bad})()""")
      if gaps:bad.append((lvl,'arena gaps',gaps))
      # 1) brute dropped below the map -> respawned on arena ground
      await E("(()=>{const G=VR.G();G.p.x=G.brute.x-120;G.p.y=G.brute.y;G.brute.y=500;G.brute.vy=300})()");await pg.wait_for_timeout(700)
      r=await E("(()=>{const G=VR.G(),A=VR.arena(),b=G.brute;return {y:b.y,x:b.x,on:b.on,inArena:b.x>=A.x0&&b.x+b.w<=A.x1,alive:!b.dead,stand:Math.abs(b.y+b.h-A.gy*16)<1}})()")
      if not(r['inArena'] and r['stand'] and r['alive']):bad.append((lvl,'respawn',r))
      # 2) player far left behind pits: brute chases but must not leave the arena
      await E("(()=>{const G=VR.G(),A=VR.arena();G.brute.x=A.x0+2;G.p.x=A.x0-200;G.p.y=40})()");await pg.wait_for_timeout(2500)
      r2=await E("(()=>{const G=VR.G(),A=VR.arena(),b=G.brute;return {x:Math.round(b.x),x0:A.x0,y:Math.round(b.y),ok:b.x>=A.x0&&b.y<=A.gy*16}})()")
      if not r2['ok']:bad.append((lvl,'left arena',r2))
      # 3) repeated falls -> failsafe counts it defeated so the exit opens
      for _ in range(5):
        await E("VR.G().brute.y=600");await pg.wait_for_timeout(120)
      dead=await E("VR.G().brute.dead===1")
      # 4) a regular enemy falling off the map is removed and doesn't block
      await E("(()=>{const e=VR.spawn('crawler',0,0);e.y=700;window.__c=e})()");await pg.wait_for_timeout(150)
      cr=await E("!VR.G().ens.includes(__c)")
      await E("(()=>{const G=VR.G();G.p.x=G.door.x+6;G.p.y=G.door.y+10;G.p.vy=0})()");await pg.wait_for_timeout(400)
      st=await E('VR.state()')
      out.append((lvl,'no gaps' if not gaps else gaps,r['stand'],r2,dead,cr,st))
      if not(dead and cr and st=='clear'):bad.append((lvl,dead,cr,st))
    await b.close()
  for o in out:print(o)
  print('BAD',bad);print('ERRORS',errs)
asyncio.run(main())
