# On-foot aiming: keyboard + touch aim pad, power-ups respect angle, angled shots hit turrets/flyers.
import asyncio,pathlib
from playwright.async_api import async_playwright
REC="window.__v=[];clearInterval(window.__iv);window.__iv=setInterval(()=>{for(const u of VR.G().bul)__v.push([Math.sign(Math.round(u.vx)),Math.sign(Math.round(u.vy))])},4)"
async def main():
  errs=[];res=[];bad=[]
  async with async_playwright() as p:
    b=await p.chromium.launch();ctx=await b.new_context(**p.devices['Pixel 7']);pg=await ctx.new_page()
    pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:errs.append(m.text) if m.type=='error' else None)
    await pg.goto('file://'+str(pathlib.Path(__file__).parent.resolve()/'dist/index.html'));await pg.wait_for_timeout(300)
    E=pg.evaluate;K=pg.keyboard
    async def fresh(pu=None):
      await E("VR.god=true;VR.start(1)");await pg.wait_for_timeout(1300);await E("VR.G().ens=VR.G().ens.filter(e=>e.k==='brute');VR.G().p.face=1")
      if pu: await E(f"VR.pu('{pu}')")
    def check(name,got,exp):
      ok=exp in got; res.append((name,exp,ok)); 
      if not ok: bad.append((name,exp,sorted(set(map(tuple,got)))))
    # keyboard
    for name,keys,exp,aim in [('kb fwd',['KeyX'],[1,0],0),('kb up45',['ArrowRight','ArrowUp','KeyX'],[1,-1],-1),('kb up',['ArrowUp','KeyX'],[0,-1],-2),('kb down45',['ArrowDown','KeyX'],[1,1],1)]:
      await fresh();await E(REC)
      for k in keys: await K.down(k)
      await pg.wait_for_timeout(350);a=await E('VR.G().p.aim')
      for k in keys: await K.up(k)
      got=await E('__v');check(name,got,exp)
      if a!=aim: bad.append((name,'aim',a))
    # touch aim pad via CDP
    cdp=await ctx.new_cdp_session(pg);box=await pg.locator('canvas').bounding_box()
    T=lambda x,y:{'x':box['x']+x*box['width']/270,'y':box['y']+y*box['height']/480}
    for name,dy,exp,aim in [('touch fwd',0,[1,0],0),('touch up45',-22,[1,-1],-1),('touch up',-45,[0,-1],-2),('touch down45',22,[1,1],1)]:
      await fresh();await E(REC)
      await cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[T(172,421)]})
      await pg.wait_for_timeout(50)
      await cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[T(172,421+dy)]})
      await pg.wait_for_timeout(350);a=await E('VR.G().p.aim')
      if name=='touch up45':await pg.screenshot(path='screenshots/11_aim_up45.png')
      await cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
      got=await E('__v');check(name,got,exp)
      if a!=aim: bad.append((name,'aim',a))
    # power-ups respect angle (straight up: every bullet must go up)
    for pu in ['shotgun','prapid','plasma']:
      await fresh(pu);await E(REC);await K.down('ArrowUp');await K.down('KeyX');await pg.wait_for_timeout(350);await K.up('KeyX');await K.up('ArrowUp')
      got=await E('__v');ok=len(got)>0 and all(v[1]<0 for v in got);res.append((pu+' up',ok))
      if not ok:bad.append((pu,'not all upward',sorted(set(map(tuple,got)))))
    # angled shots hit enemies
    for name,k,dx,dy,keys in [('up45 hits turret','turret',60,-60,['ArrowRight','ArrowUp']),('up hits flyer','flyer',-2,-70,['ArrowUp']),('down45 hits flyer','flyer',40,40,['ArrowDown'])]:
      await fresh()
      if name.startswith('down'): await E("(()=>{const P=VR.G().p,Y=P.y-60;clearInterval(window.__pp);window.__pp=setInterval(()=>{P.y=Y;P.vy=0},2)})()");await pg.wait_for_timeout(40)
      await E(f"window.__e=VR.spawn('{k}',{dx},{dy});__e.hp=__e.mhp=99;__e.w=__e.h=28;__e.x-=7;__e.y-=9;const X0=__e.x,Y0=__e.y;clearInterval(window.__pin);window.__pin=setInterval(()=>{{__e.x=X0;__e.y=Y0;__e.by=Y0}},4)")
      for kk in keys+['KeyX']: await K.down(kk)
      await pg.wait_for_timeout(500)
      for kk in keys+['KeyX']: await K.up(kk)
      await E('clearInterval(__pin);clearInterval(window.__pp)');hp=await E('__e.hp');ok=hp<99;res.append((name,hp,ok))
      if not ok: bad.append((name,hp))
    await b.close()
  for r in res:print(r)
  print('BAD',bad);print('ERRORS',errs)
asyncio.run(main())
