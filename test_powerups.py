import asyncio,pathlib
from playwright.async_api import async_playwright
async def main():
  errs=[];res={}
  async with async_playwright() as p:
    b=await p.chromium.launch();pg=await (await b.new_context(**p.devices['Pixel 7'])).new_page()
    pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:errs.append(m.text) if m.type=='error' else None)
    await pg.goto('file://'+str(pathlib.Path(__file__).parent.resolve()/'dist/index.html'));await pg.wait_for_timeout(300)
    E=pg.evaluate
    for k in ['spread','rapid','laser','homing']:
      await E('VR.god=true;VR.start(4)');await pg.wait_for_timeout(200);await E(f"VR.drop('{k}')");await pg.wait_for_timeout(1500)
      g=await E("(()=>{const G=VR.G();return {pu:G.pu&&G.pu.k,n:G.bul.length,pierce:G.bul.some(u=>u.pierce),home:G.bul.some(u=>u.home)}})()")
      res[k]=g
      if k=='homing':await pg.screenshot(path='screenshots/09_powerup_space.png')
    await E("VR.G().pu.t=0.2");await pg.wait_for_timeout(500);res['space_expired']=await E('VR.G().pu')
    await E("(()=>{const G=VR.G();G.coins.push({x:20,y:200,k:'pu',w:'laser',life:0.5,vx:0,vy:0,v:0,tag:1})})()");await pg.wait_for_timeout(1000)
    res['despawn']=await E("VR.G().coins.filter(c=>c.tag).length")
    for k in ['shotgun','prapid','plasma']:
      await E('VR.start(2)');await pg.wait_for_timeout(1200);await E(f"VR.drop('{k}')")
      await pg.keyboard.down('ArrowRight');await pg.keyboard.down('KeyX');await pg.wait_for_timeout(500);await pg.keyboard.up('ArrowRight');await pg.wait_for_timeout(300)
      res[k]=await E("(()=>{const G=VR.G();return {pu:G.pu&&G.pu.k,n:G.bul.length,pierce:G.bul.some(u=>u.pierce)}})()")
      if k=='plasma':await pg.screenshot(path='screenshots/10_powerup_foot.png')
      await pg.keyboard.up('KeyX')
    # random drop rate sanity: brute always drops
    await E('VR.start(2)');await pg.wait_for_timeout(300);await E('VR.boss()');await E("VR.G().brute.hp=1")
    await E("(()=>{const G=VR.G();G.p.x=G.brute.x-30;G.p.y=G.brute.y;G.p.face=1})()");await pg.keyboard.down('KeyX');await pg.wait_for_timeout(800);await pg.keyboard.up('KeyX')
    res['brute_drop']=await E("VR.G().brute.dead&&VR.G().coins.some(c=>c.k==='pu')||!!VR.G().pu")
    await b.close()
  for k,v in res.items():print(k,v)
  print('ERRORS',errs)
asyncio.run(main())
