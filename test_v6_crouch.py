# Crouch on foot: hitbox, low shots hit crawlers, ducking high shots, keyboard + touch, can't stand under a ceiling.
import asyncio,pathlib
from playwright.async_api import async_playwright
async def main():
  bad=[];errs=[]
  def chk(n,ok,*a):
    print(n,ok,*a)
    if not ok:bad.append((n,)+a)
  async with async_playwright() as p:
    b=await p.chromium.launch();ctx=await b.new_context(**p.devices['Pixel 7']);pg=await ctx.new_page()
    pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:m.type=='error' and errs.append(m.text))
    await pg.goto('file://'+str(pathlib.Path(__file__).parent.resolve()/'dist/index.html'));await pg.wait_for_timeout(600)
    E=pg.evaluate;K=pg.keyboard
    async def fresh():
      await E("VR.god=false;VR.start(2)");await pg.wait_for_timeout(900)
      await E("(()=>{const G=VR.G();G.ens=[];G.eb=[];G.p.inv=0;})()")
    await fresh()
    s0=await E("(()=>{const p=VR.G().p;return [p.h,p.y+p.h,p.on]})()")
    await K.down('ArrowDown');await pg.wait_for_timeout(200)
    s1=await E("(()=>{const p=VR.G().p;return [p.h,p.y+p.h,!!p.crouch,p.aim]})()")
    chk('Down on the ground crouches: shorter hitbox, feet stay put, aim forward',s0[2] and s1[2] and s1[0]<s0[0]*0.7 and abs(s1[1]-s0[1])<0.5 and s1[3]==0,s0,s1)
    x0=await E("VR.G().p.x");await K.down('ArrowLeft');await pg.wait_for_timeout(300);x1=await E("VR.G().p.x");f=await E("VR.G().p.face");await K.up('ArrowLeft')
    chk('no walking while crouched, but you can turn',abs(x1-x0)<0.5 and f==-1,x0,x1,f)
    await K.down('ArrowRight');await pg.wait_for_timeout(50);await K.up('ArrowRight')
    await K.up('ArrowDown');await pg.wait_for_timeout(150)
    chk('release Down stands back up',await E("VR.G().p.h")==s0[0] and not await E("!!VR.G().p.crouch"))
    # low shot vs crawler
    pin="(()=>{const G=VR.G(),p=G.p;window.__e=VR.spawn('crawler',70,0);__e.y=p.y+p.h-__e.h;__e.hp=__e.mhp=99;const X=__e.x,Y=__e.y;clearInterval(window.__pin);window.__pin=setInterval(()=>{__e.x=X;__e.y=Y;__e.vx=0;},4);})()"
    await fresh();await E("VR.G().p.face=1");await E(pin);await K.down('KeyX');await pg.wait_for_timeout(700);await K.up('KeyX');hp1=await E("__e.hp");await E("clearInterval(__pin)")
    await fresh();await E("VR.G().p.face=1");await E(pin);await K.down('ArrowDown');await K.down('KeyX');await pg.wait_for_timeout(250)
    await pg.screenshot(path='screenshots/v6_crouch.png')
    await pg.wait_for_timeout(450);await K.up('KeyX');await K.up('ArrowDown');hp2=await E("__e.hp");await E("clearInterval(__pin)")
    chk('standing shot flies over a crawler',hp1==99,hp1)
    chk('crouch shot hits the crawler',hp2<99,hp2)
    # duck a high shot
    async def shot(crouch):
      await fresh()
      if crouch:await K.down('ArrowDown');await pg.wait_for_timeout(100)
      await E("(()=>{const G=VR.G(),p=G.p,top=p.y+p.h-38;G.eb.push({x:p.x+80,y:top+6,vx:-160,vy:0,r:3});})()");await pg.wait_for_timeout(900)
      hp=await E("[VR.G().p.hp,VR.G().p.mhp]")
      if crouch:await K.up('ArrowDown')
      return hp
    a=await shot(False);c=await shot(True)
    chk('a head-height shot hits you standing',a[0]<a[1],a)
    chk('crouching ducks under it',c[0]==c[1],c)
    # touch: CROUCH pad, and FIRE slid down on the ground
    cdp=await ctx.new_cdp_session(pg);box=await pg.locator('canvas').bounding_box()
    T=lambda x,y:{'x':box['x']+x*box['width']/270,'y':box['y']+y*box['height']/480}
    await fresh()
    await cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[T(172,372)]});await pg.wait_for_timeout(200)
    chk('holding the CROUCH pad crouches',await E("!!VR.G().p.crouch"))
    await cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]});await pg.wait_for_timeout(150)
    chk('letting go stands up',not await E("!!VR.G().p.crouch"))
    await fresh();await E("VR.G().p.face=1");await E(pin)
    await cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[T(172,421)]});await pg.wait_for_timeout(50)
    await cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[T(172,443)]});await pg.wait_for_timeout(600)
    st=await E("[!!VR.G().p.crouch,VR.G().p.aim,__e.hp]")
    await cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]});await E("clearInterval(__pin)")
    chk('sliding FIRE down on the ground = crouch shot that hits the crawler',st[0] and st[1]==0 and st[2]<99,st)
    # CROUCH pad must not overlap other pads
    ov=await E("(()=>{const ks=Object.keys(PB),o=[];for(let i=0;i<ks.length;i++)for(let j=i+1;j<ks.length;j++){const a=PB[ks[i]],b=PB[ks[j]];if(a[0]<b[0]+b[2]&&b[0]<a[0]+a[2]&&a[1]<b[1]+b[3]&&b[1]<a[1]+a[3])o.push(ks[i]+ks[j]);}return o})()")
    chk('touch pads do not overlap',not ov,ov)
    # ceiling
    await fresh();await K.down('ArrowDown');await pg.wait_for_timeout(150)
    await E("(()=>{const G=VR.G(),p=G.p,Y=Math.floor((p.y-6)/16);window.__ct=[];for(let X=Math.floor(p.x/16);X<=Math.floor((p.x+p.w)/16);X++){__ct.push(Y*G.cols+X);G.map[Y*G.cols+X]=1;}})()")
    await K.up('ArrowDown');await pg.wait_for_timeout(200)
    chk('cannot stand up under a low ceiling',await E("!!VR.G().p.crouch") and await E("VR.G().p.h")<38)
    y0=await E("VR.G().p.y");await K.press('Space');await pg.wait_for_timeout(250);y1=await E("VR.G().p.y")
    chk('cannot jump into the ceiling either',abs(y1-y0)<1 and await E("!!VR.G().p.crouch"),y0,y1)
    await E("__ct.forEach(i=>VR.G().map[i]=0)");await pg.wait_for_timeout(150)
    chk('stands once the ceiling is gone',not await E("!!VR.G().p.crouch") and await E("VR.G().p.h")==38)
    # in the air Down still aims down
    await fresh();await K.press('Space');await pg.wait_for_timeout(80);await K.down('ArrowDown');await pg.wait_for_timeout(60)
    air=await E("[!!VR.G().p.crouch,VR.G().p.aim,VR.G().p.on]");await K.up('ArrowDown')
    chk('Down in the air aims 45 down and does not crouch',not air[0] and air[1]==1 and not air[2],air)
    # jump from crouch
    await fresh();await K.down('ArrowDown');await pg.wait_for_timeout(150);await K.press('Space');await pg.wait_for_timeout(150);j=await E("[!!VR.G().p.crouch,VR.G().p.on,VR.G().p.h]");await K.up('ArrowDown')
    chk('jumping out of a crouch stands up and jumps',not j[0] and not j[1] and j[2]==38,j)
    await b.close()
  print('BAD',bad);print('ERRORS',errs)
asyncio.run(main())
