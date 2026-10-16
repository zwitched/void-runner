# Platformer moves: dash (burst, cooldown, no invulnerability), wall slide + wall jump, hidden rooms (cracked and fake floors).
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
    await E("VR.god=true;VR.start(5)");await pg.wait_for_timeout(1500)
    # dash on flat ground away from rooms: put Mara on a clear stretch
    await E("(()=>{const G=VR.G(),p=G.p;G.ens=G.ens.filter(e=>e.k==='brute');const X=30;for(let x=X-2;x<X+12;x++){for(let y=0;y<17;y++)G.map[y*G.cols+x]=0;for(let y=17;y<22;y++)G.map[y*G.cols+x]=1;}p.x=X*16;p.y=17*16-p.h;p.vy=0;p.vx=0;p.face=1;p.dcd=0;})()")
    await pg.wait_for_timeout(200)
    x0=await E("VR.G().p.x");await pg.keyboard.down('ShiftLeft');await pg.wait_for_timeout(60);await pg.keyboard.up('ShiftLeft');await pg.wait_for_timeout(250)
    x1=await E("VR.G().p.x");chk('dash moves a burst distance',x1-x0>35,x1-x0)
    await pg.keyboard.down('ShiftLeft');await pg.wait_for_timeout(60);await pg.keyboard.up('ShiftLeft');await pg.wait_for_timeout(150)
    x2=await E("VR.G().p.x");chk('cooldown blocks an instant second dash',abs(x2-x1)<5,x2-x1)
    inv=await E("(()=>{const p=VR.G().p;p.inv=0;p.dcd=0;p.dashT=0;return 1})()")
    await pg.keyboard.down('ShiftLeft');await pg.wait_for_timeout(40);i2=await E("VR.G().p.inv");await pg.keyboard.up('ShiftLeft');chk('dash gives no invulnerability',i2==0,i2)
    # double-tap right also dashes
    await pg.wait_for_timeout(900);await E("(()=>{const p=VR.G().p;p.x=30*16;p.vx=0;})()");x0=await E("VR.G().p.x")
    await pg.keyboard.down('ArrowRight');await pg.wait_for_timeout(50);await pg.keyboard.up('ArrowRight');await pg.wait_for_timeout(60);await pg.keyboard.down('ArrowRight');await pg.wait_for_timeout(180);await pg.keyboard.up('ArrowRight');x1=await E("VR.G().p.x")
    chk('double-tap dashes',x1-x0>45,x1-x0)
    # wall: build a tall wall to the right and hang Mara in the air next to it
    await E("(()=>{const G=VR.G(),p=G.p,X=36;for(let y=4;y<17;y++)G.map[y*G.cols+X]=1;p.x=X*16-p.w-1;p.y=9*16;p.vy=120;p.vx=0;p.dashT=0;p.wjT=0;})()")
    await pg.keyboard.down('ArrowRight');await pg.wait_for_timeout(250)
    vy=await E("VR.G().p.vy");chk('wall slide caps fall speed',0<vy<=60,vy)
    await pg.keyboard.down('Space');await pg.wait_for_timeout(50);await pg.keyboard.up('Space');await pg.wait_for_timeout(60)
    st=await E("(()=>{const p=VR.G().p;return [p.vy,p.vx,VR.G().wjumps||0]})()");await pg.keyboard.up('ArrowRight')
    chk('wall jump launches up and away',st[0]<-150 and st[1]<0 and st[2]==1,st)
    # hidden rooms
    R=await E("VR.G().rooms");chk('level has hidden rooms',len(R)>=1,R)
    await E("VR.start(5)");await pg.wait_for_timeout(1200)
    R=await E("VR.G().rooms");cr=[r for r in R if r['kind']==3][0];fk=[r for r in R if r['kind']==4]
    t=await E(f"VR.G().map[{cr['y']}*VR.G().cols+{cr['x']+1}]");chk('cracked floor tile present',t==3,t)
    await E(f"(()=>{{const G=VR.G(),p=G.p;G.ens=G.ens.filter(e=>e.k==='brute');p.x={cr['x']+1}*16+1;p.y={cr['y']}*16-p.h-1;p.vy=0;}})()");await pg.wait_for_timeout(1400)
    t=await E(f"VR.G().map[{cr['y']}*VR.G().cols+{cr['x']+1}]");py=await E("VR.G().p.y");chk('standing on it cracks it open and Mara drops in',t==0 and py>cr['y']*16,t,py)
    await pg.wait_for_timeout(300);await pg.keyboard.down('ArrowRight');await pg.wait_for_timeout(500);await pg.keyboard.up('ArrowRight')
    await pg.keyboard.down('ArrowLeft');await pg.wait_for_timeout(700);await pg.keyboard.up('ArrowLeft')
    sec=await E("VR.secrets()");chk('stash found',('stash' in sec),sec)
    # can climb back out with a plain jump
    await E(f"(()=>{{const p=VR.G().p;p.x={cr['x']+1}*16+9;}})()");await pg.wait_for_timeout(200)
    await pg.keyboard.down('Space');await pg.wait_for_timeout(450);await pg.keyboard.down('ArrowRight');await pg.wait_for_timeout(300);await pg.keyboard.up('Space');await pg.wait_for_timeout(400);await pg.keyboard.up('ArrowRight')
    py=await E("VR.G().p.y+VR.G().p.h");chk('plain jump climbs out of the room',py<=cr['y']*16+1,py,cr['y']*16)
    if fk:
      f=fk[0];lv=await E("VR.upgr()")
      await E(f"(()=>{{const p=VR.G().p;p.x={f['x']+1}*16+9;p.y={f['y']}*16-p.h-2;p.vy=0;p.vx=0;}})()");await pg.wait_for_timeout(1500)
      lv2=await E("VR.upgr()");sec=await E("VR.secrets()");chk('fake floor drops into the parts room and the part upgrades something',sum(lv2.values())>sum(lv.values()) or 'part' in sec,lv,lv2,sec)
    await pg.screenshot(path='screenshots/v6_hidden_room.png')
    await b.close()
  print('BAD',bad);print('ERRORS',errs)
asyncio.run(main())
