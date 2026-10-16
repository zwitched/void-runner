# Headless perf check: per-frame CPU work (update+draw) in ms, High and Low graphics, busy scenes.
# Headless Chromium renders in software, so real phones (GPU canvas) will be faster than this.
import asyncio,pathlib,json
from playwright.async_api import async_playwright
URL='file://'+str(pathlib.Path(__file__).parent.resolve()/'dist/index.html')
SCENES=[('space boss',7,True),('final boss',12,True),('platformer dark',11,False),('platformer',5,False),('hack',6,False),('evasion dark',10,False)]
async def main():
  out={};bad=[];errs=[]
  async with async_playwright() as p:
    b=await p.chromium.launch()
    for q in ['hi','lo']:
      ctx=await b.new_context(**p.devices['Pixel 7']);pg=await ctx.new_page();pg.on('pageerror',lambda e:errs.append(str(e)))
      await pg.goto(URL);await pg.evaluate(f"localStorage.setItem('voidrunner.save.v1',JSON.stringify(Object.assign(JSON.parse(localStorage.getItem('voidrunner.save.v1')||'{{}}'),{{q:'{q}'}})))");await pg.reload();await pg.wait_for_timeout(600)
      for name,i,boss in SCENES:
        await pg.evaluate(f"VR.god=true;VR.start({i})");await pg.wait_for_timeout(1200)
        if boss:await pg.evaluate("VR.boss()");await pg.wait_for_timeout(3500)
        await pg.keyboard.down('KeyX');await pg.evaluate("VR.perfReset()");await pg.wait_for_timeout(3000);await pg.keyboard.up('KeyX')
        r=await pg.evaluate("VR.perf()");out[(q,name)]=r
        print(f"{q:2} {name:16} rq={r['rq']} frames={r['n']:3} avg={r['avg']:.2f}ms p95={r['p95']:.2f}ms max={r['max']:.1f}ms")
        if r['p95']>16.7:bad.append((q,name,'p95 over 16.7ms'))
      await ctx.close()
    await b.close()
  print('BAD',bad);print('ERRORS',errs)
asyncio.run(main())
