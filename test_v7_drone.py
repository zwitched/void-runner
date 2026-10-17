# OTT companion drone: follows Mara, magnet pulls coins, zap on cooldown, shield soaks a hit, difficulty scaling, hangar tab, quips.
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
    st=await E("VR.ix('ASTER-9 STATION')")
    await E(f"VR.setS({{dmag:0,dzap:0,dshd:0}});VR.god=false;VR.start({st})");await pg.wait_for_timeout(400)
    o=await E("VR.ott.o()");chk('Ott shows up in an on-foot level',o is not None)
    chk('Ott opens with a line',bool(o and o['q']) and o['qt']>0,o and o['q'])
    await E("(()=>{const p=VR.G().p;p.x+=120;})()");await pg.wait_for_timeout(1500)
    d=await E("(()=>{const o=VR.ott.o(),p=VR.G().p;return Math.hypot(o.x-(p.x+p.w/2),o.y-p.y)})()");chk('Ott follows Mara',d<40,d)
    # magnet: coin 40px from Ott and 50px from Mara. Base range 28 ignores it; magnet 1 (50) pulls it in
    put="(()=>{const G=VR.G(),o=G.ott,p=G.p;G.coins.length=0;G.ens.length=0;G.coins.push({x:o.x,y:o.y-40,k:'c',v:7});return 0})()"
    await E("VR.G().p.inv=9;VR.G().ott.x=VR.G().p.x;VR.G().ott.y=VR.G().p.y-10");await E("(()=>{const G=VR.G();G.p.vx=0;})()")
    await E(put);cr0=await E("runCr");await pg.wait_for_timeout(1200);chk('base magnet leaves a coin 40px out alone',await E("runCr")==cr0 and await E("VR.G().coins.length")==1)
    await E("VR.setS({dmag:1})");await pg.wait_for_timeout(1500);chk('magnet 1 pulls it to Mara and she collects it',await E("runCr")>=cr0+7,await E("runCr"))
    chk('magnet range grows per level',[await E(f"(VR.setS({{dmag:{i}}}),VR.ott.stats().mag)") for i in range(4)]==[28,50,72,94])
    chk('hidden-room coins stay put',await E("(()=>{const G=VR.G(),o=G.ott;G.coins.push({x:o.x,y:o.y,k:'c',v:1,rm:{found:false}});return true})()"))
    await pg.wait_for_timeout(500);chk('...still there',await E("VR.G().coins.filter(c=>c.rm).length")==1)
    # zap: off at level 0
    await E(f"VR.setS({{dzap:0}});VR.start({st})");await pg.wait_for_timeout(1200)
    los0=await E("(()=>{const G=VR.G(),o=G.ott;G.ens.length=0;G.p.inv=99;const e=VR.spawn('flyer',0,0);e.x=o.x+40;e.y=o.y-5;e.hp=50;e.upd=()=>{};return ottLOS(o.x,o.y,e.x+e.w/2,e.y+e.h/2)})()");chk('test enemy is in Ott line of sight',los0)
    await pg.wait_for_timeout(2500)
    chk('no zap without the upgrade',await E("VR.G().ens[0].hp")==50 and await E("VR.ott.o().zaps")==0)
    await E("VR.setS({dzap:1})");await pg.wait_for_timeout(4200);z=await E("VR.ott.o().zaps");h=await E("VR.G().ens[0].hp")
    chk('zap 1 hits the nearest enemy about every 3.4s on Normal',1<=z<=2 and h==50-z,z,h)
    await E("VR.G().ens[0].hp=1");await pg.wait_for_timeout(3600);chk('a zap can finish an enemy (kill counts)',await E("VR.G().ens.length")==0 and await E("VR.score().score")>0)
    # zap needs line of sight
    los=await E("(()=>{const G=VR.G();return [ottLOS(G.ott.x,G.ott.y,G.ott.x+40,G.ott.y), ottLOS(10,10,10,PH-2)]})()");chk('zap is blocked by walls',los==[True,False],los)
    # difficulty scales cooldowns
    cds=[]
    for dfi in range(3):cds.append(await E(f"(VR.setS({{diff:{dfi},dzap:2,dshd:2}}),[VR.ott.stats().zcd,VR.ott.stats().scd])"))
    chk('cooldowns: Easy < Normal < Hard',cds[0][0]<cds[1][0]<cds[2][0] and cds[0][1]<cds[1][1]<cds[2][1],cds)
    chk('max zap still waits 2s+ and max shield 20s+ on Normal (not overpowered)',await E("(VR.setS({diff:1,dzap:3,dshd:3}),VR.ott.stats().zcd>=2&&VR.ott.stats().scd>=20)"))
    # shield
    await E(f"VR.setS({{dshd:1,dzap:0,diff:1}});VR.start({st})");await pg.wait_for_timeout(400)
    chk('shield starts charged',await E("VR.ott.o().shRdy"))
    r=await E("(()=>{const p=VR.G().p;p.inv=0;const h=p.hp;hurt();return [h,p.hp,VR.ott.o().shRdy,VR.score().dmg]})()");chk('shield soaks the hit: no damage, no rank penalty',r[0]==r[1] and not r[2] and r[3]==0,r)
    await pg.screenshot(path='screenshots/v7_drone_shield.png')
    r=await E("(()=>{const p=VR.G().p;p.inv=0;const h=p.hp;hurt();return [h,p.hp]})()");chk('next hit lands while it recharges',r[1]==r[0]-1,r)
    await E("VR.G().ott.st=0.05");await pg.wait_for_timeout(300);chk('shield recharges',await E("VR.ott.o().shRdy"))
    r=await E("(()=>{const p=VR.G().p;p.inv=0;p.y=PH+40;const h=p.hp;hurt();return [h,p.hp]})()");chk('pits still hurt through the shield',r[1]==r[0]-1,r)
    chk('award for the block',('ott' in await E("VR.ach()")))
    # zap screenshot with an enemy near
    await E(f"VR.setS({{dzap:3,dshd:1,dmag:3}});VR.start({st})");await pg.wait_for_timeout(600);await E("(()=>{const e=VR.spawn('flyer',70,-30);e.hp=99;e.upd=()=>{};})()")
    await E("VR.ott.say('zap')");await pg.wait_for_function("VR.G().ott.zx",timeout=4000);await pg.screenshot(path='screenshots/v7_drone_zap.png')
    # no drone in space or other modes
    await E("VR.start(0)");await pg.wait_for_timeout(300);chk('no drone in space',not await E("!!VR.G().ott"))
    # boarding interior gets Ott too
    bi=await E("VR.ix('HOLLOW CUTTER')");await E(f"VR.god=true;VR.start({bi})");await pg.wait_for_timeout(300);await E("VR.boss()");await pg.wait_for_timeout(3500);await E("VR.kill()");await pg.wait_for_timeout(3500)
    chk('Ott comes along inside the cutter',await E("VR.state()")=='plat' and await E("!!VR.G().ott"))
    # hangar gear tab
    await E("VR.god=false;VR.setS({cr:1000,dmag:0,dzap:0,dshd:0});VR.ott.tab(1);VR.shop()");await pg.wait_for_timeout(300)
    btns=await E("BTN.filter(b=>b.w===72).map(b=>b.y)");chk('gear tab lists hack + 3 drone upgrades',len(btns)>=4,btns)
    box=await pg.locator('canvas').bounding_box()
    async def tap(x,y):await pg.touchscreen.tap(box['x']+x*box['width']/270,box['y']+y*box['height']/480);await pg.wait_for_timeout(200)
    await tap(226,btns[1]+12);chk('tap buys MAGNET',await E("VR.S().dmag")==1 and await E("VR.S().cr")==940)
    await pg.screenshot(path='screenshots/v7_hangar_gear.png')
    ov=await E("(()=>{const B=BTN;for(let i=0;i<B.length;i++)for(let j=i+1;j<B.length;j++){const a=B[i],b=B[j];if(a.x<b.x+b.w&&b.x<a.x+a.w&&a.y<b.y+b.h&&b.y<a.y+a.h)return [a,b];}return null})()")
    chk('hangar buttons do not overlap',ov is None,ov)
    chk('everything fits on screen',await E("Math.max(...BTN.map(b=>b.y+b.h))")<=478)
    await E("VR.ott.tab(0)");await pg.wait_for_timeout(200);chk('ship tab still has BLASTER first at the old spot',await E("BTN.some(b=>b.w===72&&b.y===68)"))
    await b.close()
  print('BAD',bad);print('ERRORS',errs)
asyncio.run(main())
