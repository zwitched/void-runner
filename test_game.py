import asyncio,sys,pathlib
from playwright.async_api import async_playwright
OUT=pathlib.Path(__file__).parent/'screenshots'
async def main():
  errs=[]
  async with async_playwright() as p:
    b=await p.chromium.launch()
    ctx=await b.new_context(**p.devices['Pixel 7'])
    pg=await ctx.new_page()
    pg.on('console',lambda m: errs.append(m.text) if m.type=='error' else None)
    pg.on('pageerror',lambda e: errs.append(str(e)))
    await pg.goto('file://'+str(pathlib.Path(__file__).parent/'dist/index.html'))
    await pg.wait_for_timeout(800)
    await pg.screenshot(path=OUT/'01_title.png')
    box=await pg.locator('canvas').bounding_box()
    tap=lambda x,y: pg.touchscreen.tap(box['x']+x*box['width']/270, box['y']+y*box['height']/480)
    await tap(135,305)  # START via real touch
    await pg.wait_for_timeout(500); assert await pg.evaluate('VR.state()')=='story'
    await tap(135,300); await pg.wait_for_timeout(200); await pg.screenshot(path=OUT/'02_story.png')
    await tap(135,300); await pg.wait_for_timeout(300)
    assert await pg.evaluate('VR.state()')=='space', await pg.evaluate('VR.state()')
    await pg.evaluate('VR.god=true')
    await pg.wait_for_timeout(9000); await pg.screenshot(path=OUT/'03_space.png')
    res=[]
    for i in range(8):
      await pg.evaluate(f'VR.start({i})'); await pg.wait_for_timeout(1500)
      st=await pg.evaluate('VR.state()'); 
      await pg.evaluate('VR.boss()'); await pg.wait_for_timeout(4000 if i%3!=1 else 2500)
      if i==4: await pg.screenshot(path=OUT/'05_boss.png')
      if i==7: await pg.screenshot(path=OUT/'06_final_boss.png')
      if i==3: await pg.screenshot(path=OUT/'04_platformer.png')
      # finish: kill boss
      await pg.evaluate('VR.kill()')
      if await pg.evaluate("VR.G().mode")=='plat':
        await pg.evaluate("(()=>{const G=VR.G();G.p.x=G.brute.x-30;G.p.y=G.brute.y;})()")
        # hold FIRE touch button region via keyboard X facing right
        await pg.keyboard.down('KeyX'); await pg.wait_for_timeout(1500); await pg.keyboard.up('KeyX')
        await pg.evaluate("(()=>{const G=VR.G();if(G.brute.dead){G.p.x=G.door.x+5;G.p.y=G.door.y+10;}})()")
      await pg.wait_for_timeout(3500)
      res.append((i,st,await pg.evaluate('VR.state()')))
    # touch platformer buttons check
    await pg.evaluate('VR.start(1)'); await pg.wait_for_timeout(500)
    x0=await pg.evaluate('VR.G().p.x')
    cdp=await ctx.new_cdp_session(pg)
    px,py=box['x']+99*box['width']/270, box['y']+420*box['height']/480
    await cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':px,'y':py}]})
    await pg.wait_for_timeout(700)
    await cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
    x1=await pg.evaluate('VR.G().p.x'); res.append(('touch-right-moved',x0,x1))
    await pg.evaluate('VR.shop()'); await pg.evaluate('VR.S().cr=500'); await pg.wait_for_timeout(300)
    await tap(226,80); await pg.wait_for_timeout(300)
    res.append(('bought sg',await pg.evaluate('VR.S().sg')))
    await pg.screenshot(path=OUT/'07_shop.png')
    await pg.evaluate("VR.start(0)"); await pg.wait_for_timeout(300); await tap(255,11); await pg.wait_for_timeout(300)
    res.append(('pause',await pg.evaluate('VR.state()')))
    await pg.evaluate("VR.god=false;VR.G().p.hp=0;VR.G().dead=0.1;"); await pg.evaluate("VR.state()")
    await tap(135,100); await pg.wait_for_timeout(600)  # resume via button? tap outside
    print(res); print('ERRORS',errs); await b.close()
asyncio.run(main())
