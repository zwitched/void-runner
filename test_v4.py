# v4 checks: boss hit mask matches the art (wing/arm hits count), core weak point, contact damage, ship clamp.
import asyncio,pathlib
from playwright.async_api import async_playwright
async def main():
  bad=[];errs=[];out=[]
  def chk(n,ok,*a):
    out.append((n,bool(ok))+a)
    if not ok:bad.append((n,)+a)
  async with async_playwright() as p:
    b=await p.chromium.launch();pg=await (await b.new_context(**p.devices['Pixel 7'])).new_page()
    pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:errs.append(m.text) if m.type=='error' else None)
    await pg.goto('file://'+str(pathlib.Path(__file__).parent.resolve()/'dist/index.html'));await pg.wait_for_timeout(400)
    E=pg.evaluate
    for lvl in (0,4,7,8,12):
      await E(f"VR.god=true;VR.start({lvl})");await pg.wait_for_timeout(500);await E("VR.boss()");await pg.wait_for_timeout(4200)
      M=await E("VR.bossMask()")
      # pick a mask pixel outside the old v3 box (|dx|>0.45w or |dy|>0.42h): a wing / arm / claw
      w,h=M['w'],M['h'];ox=M['bx']-w/2;oy=M['by']-h/2;pick=None;core=None
      for y in range(h):
        for x in range(w):
          if pick is None and 3<=x<w-3 and 3<=y<h-3 and all(M['m'][(y+j)*w+x+i] for i in range(-3,4) for j in range(-3,4)):
            dx,dy=x+0.5-w/2,y+0.5-h/2
            if abs(dx)>M['bw']*0.45+6: pick=(dx,dy)
      chk(f'L{lvl} mask has parts beyond old box',pick is not None)
      if not pick: continue
      # freeze the boss and fire one bullet straight into the wing pixel
      r=await E(f"""(()=>{{const G=VR.G(),b=G.boss;b.t=-1e9;const hp=b.hp;G.bul=[];G.p.x=10;G.p.y=470;G.p.ft=99;
        G.en=[];G.eb=[];let n=0;const f=()=>{{if(b.hp<hp||n++>8)return;G.bul=[{{x:b.x+{pick[0]},y:b.y+{pick[1]}+1,vx:0,vy:-1,dm:1,l:1,hits:[],c:'#5ab0ff'}}];requestAnimationFrame(f);}};requestAnimationFrame(f);return hp;}})()""")
      await pg.wait_for_timeout(300)
      hp=await E("VR.G().boss.hp");chk(f'L{lvl} wing shot registers',hp<r,r,hp)
      # empty space next to boss must not register
      miss=await E(f"VR.bossHit(VR.G().boss.x+{w/2+4},VR.G().boss.y)");chk(f'L{lvl} empty space misses',not miss)
      # core weak point takes double damage
      r2=await E("""(()=>{const G=VR.G(),b=G.boss,a=b.art;const cx=b.x+(a.cx/2-a.W/4),cy=b.y+(a.cy/2-a.H/4);const ox=cx-b.x,oy=cy-b.y;const hp=b.hp;G.en=[];let n=0;const f=()=>{if(b.hp<hp||n++>8)return;G.bul=[{x:b.x+ox,y:b.y+oy+1,vx:0,vy:-1,dm:1,l:1,hits:[],c:'#5ab0ff'}];requestAnimationFrame(f);};requestAnimationFrame(f);return hp;})()""")
      await pg.wait_for_timeout(300);hp2=await E("VR.G().boss.hp");chk(f'L{lvl} core deals 2x',r2-hp2==2,r2-hp2)
      # contact damage with the same shape (god off, no shield)
      c=await E(f"""(()=>{{const G=VR.G(),p=G.p;VR.god=false;p.inv=0;p.sh=0;p.msh=0;const b=G.boss;p.x=b.x+{pick[0]};p.y=b.y+{pick[1]};const hp=p.hp;return hp;}})()""")
      await pg.wait_for_timeout(60);hpp=await E("VR.G().p.hp");chk(f'L{lvl} ship touching wing takes damage',hpp<c,c,hpp);await E("VR.god=true")
    # ship clamp: drive to every corner and check the sprite stays on screen
    await E("VR.god=true;VR.start(0)");await pg.wait_for_timeout(600)
    S=await E("VR.SHIP()")
    for keys in (['ArrowDown','ArrowLeft'],['ArrowDown','ArrowRight'],['ArrowUp','ArrowLeft']):
      for k in keys: await pg.keyboard.down(k)
      await pg.wait_for_timeout(2500)
      for k in keys: await pg.keyboard.up(k)
      x,y=await E("[VR.G().p.x,VR.G().p.y]")
      chk(f'ship clamp {keys}',x-S['hw']>=0 and x+S['hw']<=270 and y+S['hb']<=480,x,y)
    await b.close()
  for o in out:print(o)
  print('BAD',bad);print('ERRORS',errs)
asyncio.run(main())
