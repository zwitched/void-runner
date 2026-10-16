# Geometry-vs-physics reachability test for all on-foot levels (base suit, no jetpack).
import asyncio,pathlib,math
from playwright.async_api import async_playwright
MARGIN=0.75
async def main():
  fails=[];out=[]
  async with async_playwright() as p:
    b=await p.chromium.launch();pg=await (await b.new_context(**p.devices['Pixel 7'])).new_page()
    await pg.goto('file://'+str(pathlib.Path(__file__).parent.resolve()/'dist/index.html'));await pg.wait_for_timeout(300)
    E=pg.evaluate
    await E("Object.assign(VR.S(),{jet:0,armor:1});VR.god=true")
    ph=await E('VR.phys()');P=ph['PHYS'];TS=ph['TS'];ROWS=ph['ROWS'];JH=ph['JUMP_H']
    # empirical jump height from the real game loop
    await E('VR.start(2)');await pg.wait_for_timeout(1200)
    y0=await E('VR.G().p.y');await E("window.__miny=1e9;window.__iv=setInterval(()=>{__miny=Math.min(__miny,VR.G().p.y)},5)")
    await pg.keyboard.down('Space');await pg.wait_for_timeout(1100);await pg.keyboard.up('Space')
    emp=y0-await E('__miny');await E('clearInterval(__iv)')
    out.append(f"jump: formula {JH:.1f}px ({JH/TS:.2f} tiles), measured in-game {emp:.1f}px; 75% budget {MARGIN*JH:.1f}px")
    if emp<JH*0.9:fails.append('measured jump much lower than formula')
    H=min(JH,emp);g,jv,run,w,h=P['g'],P['jv'],P['run'],10,22
    def reach(rise):  # horizontal distance at the moment feet come back down to height `rise`
      d=jv*jv-2*g*rise
      return -1 if d<0 else run*(jv+math.sqrt(d))/g
    for lvl in (2,4,9):
      await E(f'VR.start({lvl})');await pg.wait_for_timeout(100)
      m=await E("(()=>{const G=VR.G();return {cols:G.cols,map:Array.from(G.map),ceil:!!G.L.ceil}})()")
      C=m['cols'];M=m['map'];t=lambda x,y:M[y*C+x]
      top=[]
      for x in range(C):
        y=ROWS-1
        if t(x,y)!=1: top.append(None);continue
        while y-1>=0 and t(x,y-1)==1: y-=1
        top.append(y)
      maxrise=maxgap=0;maxplat=0;minhead=99;checks=0
      x=0
      while x<C-2:
        if top[x] is None: x+=1;continue
        nx=x+1
        while nx<C and top[nx] is None: nx+=1
        if nx>=C-1: break
        gap=(nx-x-1)*TS;rise=(top[x]-top[nx])*TS;checks+=1
        if rise>0: maxrise=max(maxrise,rise)
        if rise>MARGIN*H: fails.append(f'L{lvl} col{nx}: rise {rise}px > {MARGIN*H:.0f}')
        if gap>0:
          need=gap+w;r=reach(max(rise,0))
          maxgap=max(maxgap,need/r)
          if need>MARGIN*r: fails.append(f'L{lvl} col{nx}: gap {gap}px needs {need}px > 75% of {r:.0f}px')
        x=nx
      for X in range(C-1):
        for Y in range(2 if m['ceil'] else 0,ROWS):
          if t(X,Y)==1 and top[X] is not None and Y<top[X] and t(X,Y-1)!=1:
            # floating platform tile
            if Y>=top[X]: continue
            up=(top[X]-Y)*TS;head=(top[X]-Y-1)*TS;checks+=1
            maxplat=max(maxplat,up);minhead=min(minhead,head)
            if up>MARGIN*H: fails.append(f'L{lvl} plat col{X}: {up}px up > {MARGIN*H:.0f}')
            if head<h+4: fails.append(f'L{lvl} plat col{X}: headroom {head}px blocks walking')
      out.append(f"L{lvl}: {checks} checks, max step-up {maxrise}px, max floating-platform height {maxplat}px, min headroom {minhead}px, worst gap {maxgap*100:.0f}% of jump range")
    await b.close()
  print('\n'.join(out));print('FAILS',fails);print('REACHABILITY','PASS' if not fails else 'FAIL')
asyncio.run(main())
