# ENGINE FAILURE: colliders must sit on visible art. Samples many seeds/frames, every collider point must hit an
# opaque pixel of the obstacle layer (drawn by the same drawGates() the game uses), and every crash must touch art or the field edge.
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
    await pg.goto('file://'+str(pathlib.Path(__file__).parent.resolve()/'dist/index.html'));await pg.wait_for_timeout(600)
    E=pg.evaluate
    r=await E("VR.eng.audit(60,1800)")
    chk('every collider point lands on drawn obstacle pixels',not r['bad'] and r['pts']>100000,r['pts'],r['bad'][:3])
    chk('every crash touches visible art or the field edge',r['crashes']>=30 and r['crashOk']==r['crashes'],r['crashes'],r['crashOk'])
    await E("VR.god=false;VR.start(9)");await pg.wait_for_timeout(300);await E("VR.eng.H().auto=1;VR.eng.kick()");await pg.wait_for_timeout(5000)
    cl=await E("VR.eng.colliders()");chk('colliders on screen line up with the gates being drawn',len(cl)>=2 and all(-30<c[0]<W for c in cl for W in [270]),cl[:2])
    await pg.keyboard.press('KeyH');await pg.wait_for_timeout(100);chk('H toggles the hitbox overlay',await E("FT.hitbox")==True)
    await pg.screenshot(path='screenshots/v6_engine_hitboxes.png')
    await pg.keyboard.press('KeyH');chk('H toggles it off again',await E("FT.hitbox")==False)
    await b.close()
  print('BAD',bad);print('ERRORS',errs)
asyncio.run(main())
