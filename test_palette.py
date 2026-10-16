# Danger vs loot colour separation: enemy shots are red/magenta only; coins/pickups never red/magenta;
# no enemy shot pixel is gold/yellow. Samples the actual sprite canvases the game draws with.
import asyncio,pathlib,colorsys
from playwright.async_api import async_playwright
def hsv(p):h,s,v=colorsys.rgb_to_hsv(*(c/255 for c in p));return h*360,s,v
DANGER=lambda h,s,v: s>=0.45 and v>=0.35 and (h>=290 or h<=12)
GOLD=lambda h,s,v: s>=0.45 and v>=0.35 and 25<=h<=70
async def main():
  bad=[];errs=[]
  async with async_playwright() as p:
    b=await p.chromium.launch();pg=await (await b.new_context(**p.devices['Pixel 7'])).new_page()
    pg.on('pageerror',lambda e:errs.append(str(e)))
    await pg.goto('file://'+str(pathlib.Path(__file__).parent.resolve()/'dist/index.html'));await pg.wait_for_timeout(300)
    P=await pg.evaluate('VR.palette()');await b.close()
  for i,sprite in enumerate(P['eb']):
    sat=[hsv(c) for c in sprite];col=[x for x in sat if x[1]>=0.45 and x[2]>=0.35]
    if not col or not all(DANGER(*x) for x in col):bad.append(('enemy shot not danger-coloured',i,[x for x in col if not DANGER(*x)][:3]))
    if any(GOLD(*x) for x in sat):bad.append(('enemy shot has gold',i))
    if not any(x[2]>0.95 and x[1]<0.25 for x in sat):bad.append(('enemy shot lacks bright core',i))
    if not any(x[2]<0.15 for x in sat):bad.append(('enemy shot lacks dark outline',i))
  coin=[hsv(c) for c in P['coin']]
  if any(DANGER(*x) for x in coin):bad.append('coin uses red/magenta')
  if sum(GOLD(*x) for x in coin)<len(coin)*0.5:bad.append('coin not mostly gold')
  for k,px in list(P['pu'].items())+[('hp',P['hp'])]:
    if any(DANGER(*hsv(c)) for c in px):bad.append(('pickup uses danger colour',k))
  print('enemy shot sprites:',len(P['eb']),'coin px:',len(coin),'pickups:',len(P['pu'])+1)
  print('BAD',bad);print('ERRORS',errs)
asyncio.run(main())
