# Ship loadouts change stats and sprite; secondary weapons (bomb, EMP) clear enemy shots, respect cooldown, can be upgraded.
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
    d=await E("ART.ships.map(s=>{const c=s[2];return c.getContext('2d').getImageData(0,0,c.width,c.height).data.join(',').length})")
    chk('three distinct ship sprites',len(set(d))==3,d)
    hp={};spd={}
    for i in range(3):
      await E(f"VR.god=true;localStorage.clear();VR.setS({{ship:{i}}});VR.start(0)");await pg.wait_for_timeout(400)
      hp[i]=(await E("VR.loadout()"))['mh'];x0=await E("VR.G().p.x");await pg.keyboard.down('ArrowLeft');await pg.wait_for_timeout(300);await pg.keyboard.up('ArrowLeft');spd[i]=x0-await E("VR.G().p.x")
    chk('wisp has least hull, bulwark most',hp[1]<hp[0]<hp[2],hp);chk('wisp fastest, bulwark slowest',spd[1]>spd[0]>spd[2],spd)
    await E("VR.setS({ship:0,sec:'emp',secLv:0});VR.start(0)");await pg.wait_for_timeout(4500)
    await E("(()=>{const G=VR.G();for(let i=0;i<20;i++)G.eb.push({x:20+i*10,y:100,vx:0,vy:10,r:3});})()")
    ok=await E("VR.fireSec()");n=await E("VR.G().eb.length");chk('EMP fires and wipes every enemy shot',ok and n==0,ok,n)
    ok2=await E("VR.fireSec()");chk('cooldown blocks a second use',not ok2)
    cd=await E("VR.loadout().cd");chk('cooldown is 18s at level 0',17<cd<=18,cd)
    await E("VR.setS({sec:'bomb',secLv:2});VR.start(0)");await pg.wait_for_timeout(4500)
    await E("(()=>{const G=VR.G();G.eb=[];G.eb.push({x:G.p.x,y:G.p.y-40,vx:0,vy:0,r:3},{x:G.p.x,y:G.p.y-300,vx:0,vy:0,r:3});})()")
    k0=await E("VR.score().kills");ne=await E("VR.G().en.filter(e=>e.y>-10).length")
    await E("VR.fireSec()");await pg.wait_for_timeout(200)
    left=await E("VR.G().eb.map(u=>Math.round(u.y-VR.G().p.y))");k1=await E("VR.score().kills")
    chk('bomb wipes nearby shots only',len([y for y in left if y>-150])==0 and any(y<-150 for y in left),left)
    chk('bomb damages on-screen enemies',ne==0 or k1>k0,ne,k0,k1)
    cd=await E("VR.loadout().cd");chk('upgrades shorten recharge (22-6)',15<cd<=16,cd)
    # touch button fires it too
    await E("VR.start(0)");await pg.wait_for_timeout(4300)
    box=await pg.locator('canvas').bounding_box();await pg.touchscreen.tap(box['x']+246*box['width']/270,box['y']+452*box['height']/480);await pg.wait_for_timeout(150)
    cd=await E("VR.loadout().cd");chk('touch button fires the secondary',cd>10,cd)
    await pg.wait_for_timeout(300);await pg.screenshot(path='screenshots/v6_secondary.png')
    await E("VR.setS({ship:2});VR.start(4)");await pg.wait_for_timeout(2500);await pg.screenshot(path='screenshots/v6_ship_bulwark.png')
    await E("VR.go('loadout')");await pg.wait_for_timeout(400);await pg.screenshot(path='screenshots/v6_loadout.png')
    await b.close()
  print('BAD',bad);print('ERRORS',errs)
asyncio.run(main())
