# Combo/score/rank: kills build a chain and multiplier, a hit resets it, clearing stores a rank and best score.
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
    await E("localStorage.clear();location.reload()");await pg.wait_for_timeout(600)
    await E("VR.god=true;VR.start(0)");await pg.wait_for_timeout(200)
    s0=await E("VR.score()");await pg.wait_for_timeout(2300);chk('score starts at 0',s0['score']==0,s0)
    for i in range(30):
      await E("(()=>{const G=VR.G();const e=G.en.find(e=>!e.dead);if(e){e.hp=1;G.bul.push({x:e.x,y:e.y+1,vx:0,vy:-1,dm:5,l:1,hits:[],c:'#5ab0ff'});}})()");await pg.wait_for_timeout(250)
    s1=await E("VR.score()");chk('kills add score',s1['score']>0 and s1['kills']>=4,s1);chk('chain builds',s1['best']>=4,s1)
    await E("VR.god=false");await E("(()=>{const G=VR.G();G.p.inv=0;G.p.sh=0;})()");await E("(()=>{const G=VR.G();G.eb.push({x:G.p.x,y:G.p.y,vx:0,vy:0,r:3});})()");await pg.wait_for_timeout(150);await E("VR.god=true")
    s2=await E("VR.score()");chk('hit resets chain and counts damage',s2['combo']==0 and s2['dmg']>=1,s2)
    r=await E("[VR.rankOf({ratio:2,dmg:0,time:10,par:20}),VR.rankOf({ratio:1,dmg:1,time:10,par:20}),VR.rankOf({ratio:0.9,dmg:2,time:30,par:20}),VR.rankOf({ratio:0.1,dmg:5,time:99,par:20})]")
    chk('rank thresholds S/A/B/C',r==['S','A','B','C'],r)
    await E("VR.boss()");await pg.wait_for_timeout(4000);await E("VR.kill()");await pg.wait_for_timeout(6000)
    st=await E("VR.state()");chk('cleared',st=='clear',st);L=await E("VR.last()");chk('rank computed',L and L['rank'] in 'SABC',L)
    bst=await E("VR.best()");chk('best saved',bst.get('0',{}).get('r')==L['rank'],bst)
    sv=await E("JSON.parse(localStorage.getItem('voidrunner.save.v1')).best");chk('best persisted',sv and '0' in sv,sv)
    await pg.screenshot(path='screenshots/v6_rank_clear.png')
    await E("VR.go('chapters')");await pg.wait_for_timeout(400);await pg.screenshot(path='screenshots/v6_chapter_select.png')
    box=await pg.locator('canvas').bounding_box();tap=lambda x,y:pg.touchscreen.tap(box['x']+x*box['width']/270,box['y']+y*box['height']/480)
    await tap(135,56);await pg.wait_for_timeout(300);chk('chapter select opens story',await E("VR.state()")=='story')
    await E("VR.start(2)");await pg.wait_for_timeout(1500);await pg.screenshot(path='screenshots/v6_score_hud.png')
    await b.close()
  print('BAD',bad);print('ERRORS',errs)
asyncio.run(main())
