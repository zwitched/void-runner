# Boss rush + endless: locked until the campaign is done (debug unlock for tests), run flow, local high-score tables.
import asyncio,pathlib
from playwright.async_api import async_playwright
async def main():
  bad=[];errs=[]
  def chk(n,ok,*a):
    print(n,ok,*a)
    if not ok:bad.append((n,)+a)
  async with async_playwright() as p:
    b=await p.chromium.launch();pg=await (await b.new_context(**p.devices['Pixel 7'])).new_page()
    pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:m.type=='error' and errs.append(m.text))
    await pg.goto('file://'+str(pathlib.Path(__file__).parent.resolve()/'dist/index.html'));await pg.wait_for_timeout(500)
    E=pg.evaluate
    await E("localStorage.clear();location.reload()");await pg.wait_for_timeout(700)
    await E("VR.go('modes')");await pg.wait_for_timeout(300);await pg.screenshot(path='.tmp/m_locked.png')
    chk('locked before campaign',await E("!FT.unlocked()"))
    await E("VR.unlock()");chk('debug unlock works',await E("FT.unlocked()"))
    await E("VR.god=true;VR.rush()");await pg.wait_for_timeout(2500)
    st=await E("[VR.state(),!!VR.G().boss,VR.run().i]");chk('rush starts straight at boss 1',st[0]=='space' and st[1] and st[2]==0,st)
    for i in range(5):
      await E("VR.kill()");await pg.wait_for_timeout(4200)
      s=await E("VR.state()")
      if s=='clear':
        await pg.wait_for_timeout(900);await pg.mouse.click(200,400);await pg.wait_for_timeout(2500)
      r=await E("VR.run()");print('after boss',i,s,r and r.get('i'))
    st=await E("VR.state()");hs=await E("VR.hs()");chk('rush ends on the results screen with a score saved',st=='runover' and len(hs.get('rush',[]))==1 and hs['rush'][0]['s']>0,st,hs)
    lvl=await E("JSON.parse(localStorage.getItem('voidrunner.save.v1')).lvl");chk('rush does not touch campaign progress',lvl==0,lvl)
    await pg.screenshot(path='screenshots/v6_boss_rush_results.png')
    await E("VR.endless()");await pg.wait_for_timeout(1500)
    for c in range(2):
      await E("(()=>{const G=VR.G();G.t=G.waves.len+1;G.waves.list=[];G.en=[];})()");await pg.wait_for_timeout(400)
    cy=await E("VR.run().cyc");chk('endless rolls new waves instead of ending',cy>=2 and await E("VR.state()")=='space',cy)
    await E("(()=>{const G=VR.G();G.t=G.waves.len+1;G.waves.list=[];G.en=[];})()");await pg.wait_for_timeout(2500)
    bs=await E("!!VR.G().boss");chk('boss shows up on the third wave',bs)
    await E("VR.kill()");await pg.wait_for_timeout(4200);chk('endless keeps going after the boss',await E("VR.state()")=='space' and not await E("!!VR.G().boss"))
    await pg.wait_for_timeout(1500);await pg.screenshot(path='screenshots/v6_endless.png')
    await E("VR.god=false;(()=>{const p=VR.G().p;p.hp=1;p.inv=0;p.sh=0;VR.G().eb.push({x:p.x,y:p.y,vx:0,vy:0,r:3});})()");await pg.wait_for_timeout(2500)
    st=await E("VR.state()");hs=await E("VR.hs()");chk('death ends the endless run and records it',st=='runover' and len(hs.get('endless',[]))==1,st,hs)
    await E("VR.go('modes')");await pg.wait_for_timeout(300);await pg.screenshot(path='screenshots/v6_modes.png')
    await b.close()
  print('BAD',bad);print('ERRORS',errs)
asyncio.run(main())
