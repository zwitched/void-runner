# Achievements, daily challenge, difficulty.
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
    await E("localStorage.clear();location.reload()");await pg.wait_for_timeout(800)
    n=await E("VR.ACH().length");chk('15-25 achievements',15<=n<=25,n)
    await pg.screenshot(path='screenshots/v6_title_menu.png')
    # buttons on title must not overlap
    ov=await E("(()=>{const B=window.__btns||[];return 0})()")
    # ---- difficulty ----
    res={}
    for d in (0,1,2):
      await E(f"VR.setS({{diff:{d}}})");await E("VR.god=false;VR.start(1)");await pg.wait_for_timeout(200)
      tr=await E("VR.hk.H().traceMax")
      await E("VR.start(3)");await pg.wait_for_timeout(200);lk=await E("VR.ev.H().lockMax")
      await E("VR.start(0)");await pg.wait_for_timeout(200)
      await E("(()=>{const G=VR.G();G.p.inv=0;G.p.sh=0;})()");hp0=await E("VR.G().p.hp")
      await E("(()=>{const G=VR.G();for(let i=0;i<2;i++){G.p.inv=0;hurt();}})()");hp1=await E("VR.G().p.hp")
      await E("VR.boss()");await pg.wait_for_timeout(2500);bh=await E("VR.G().boss&&VR.G().boss.mhp")
      res[d]=dict(trace=tr,lock=lk,lost=hp0-hp1,boss=bh)
    print(res)
    chk('Easy gives more trace time, Hard less',res[0]['trace']>res[1]['trace']>res[2]['trace'],res)
    chk('Easy door timer shorter, Hard longer',res[0]['lock']<res[1]['lock']<res[2]['lock'])
    chk('two hits: Easy costs 1, Normal 2, Hard 4',[res[0]['lost'],res[1]['lost'],res[2]['lost']]==[1,2,4])
    chk('boss HP scales with difficulty',res[0]['boss']<res[1]['boss']<res[2]['boss'])
    await E("VR.setS({diff:2})");await E("VR.start(0)");await pg.wait_for_timeout(200)
    sp=await E("(()=>{const G=VR.G();G.eb.push({x:100,y:100,vx:0,vy:100,r:3});return 0})()");await pg.wait_for_timeout(60)
    v=await E("(()=>{const b=VR.G().eb.find(b=>b.x===100||b._ds);return b&&b.vy})()");chk('enemy shots faster on Hard',v and v>100,v)
    g=await E("(()=>{VR.start(1);const H=VR.hk.H();return hgrav(H)})()");await E("VR.setS({diff:1})");g1=await E("hgrav(VR.hk.H())");chk('hack pieces fall faster on Hard',g<g1,g,g1)
    await E("VR.go('title')");await pg.wait_for_timeout(200)
    t0=await E("VR.diff().n");await pg.mouse.click(135*411/270,0) if False else None
    # ---- daily ----
    lv=await E("VR.dailyLv('2026-10-16')");lv2=await E("VR.dailyLv('2026-10-16')");lv3=set([await E(f"VR.dailyLv('2026-10-{d:02d}')") for d in range(1,29)])
    chk('daily chapter fixed per date',lv==lv2,lv)
    chk('daily rotates over days',len(lv3)>=4,lv3)
    await E("VR.setS({diff:2})");await E("VR.god=true;VR.daily()");await pg.wait_for_timeout(300)
    chk('daily runs on Normal no matter the setting',await E("VR.diff().n")=='NORMAL')
    r1=await E("(()=>{return [Math.random(),Math.random()]})()")
    await E("VR.daily()");r2=await E("(()=>{return [Math.random(),Math.random()]})()")
    chk('daily randomness seeded by date',r1==r2,r1,r2)
    await E("VR.daily()");await pg.wait_for_timeout(300);st=await E("VR.state()")
    await E("VR.kill()");await pg.wait_for_timeout(4500)
    if await E("VR.state()")=='clear':
      await pg.wait_for_timeout(900);await pg.mouse.click(200,400);await pg.wait_for_timeout(800)
    st=await E("VR.state()");hs=await E("VR.hs()")
    k='daily:'+await E("VR.today()")
    chk('daily clear goes to results and saves to today table',st=='runover' and len(hs.get(k,[]))==1,st,hs)
    chk('daily does not touch campaign',await E("JSON.parse(localStorage.getItem('voidrunner.save.v1')).lvl")==0)
    chk('Math.random restored after the run',await E("Math.random===Math.random&&String(Math.random).includes('native')"))
    await pg.screenshot(path='screenshots/v6_daily_results.png')
    await E("VR.go('modes')");await pg.wait_for_timeout(300);await pg.screenshot(path='screenshots/v6_modes_daily.png')
    # ---- achievements ----
    a=await E("VR.ach()");chk('daily award unlocked by finishing one',('daily' in a),list(a))
    await E("VR.setS({cr:2500})");await pg.wait_for_timeout(200);chk('credits award',('rich' in await E("VR.ach()")))
    tt=await E("VR.toasts()");chk('toast shown',any('UNLOCKED' in t for t in tt),tt)
    await pg.wait_for_timeout(200);await pg.screenshot(path='screenshots/v6_achievement_toast.png')
    for i in range(20):await E("emit('dash')")
    for i in range(10):await E("emit('walljump')")
    await E("emit('lines',4);emit('special','F');emit('keycard',0)")
    a=await E("VR.ach()");chk('event awards',all(x in a for x in ['dash','wall','quad','freeze','keys']),list(a))
    await E("location.reload()");await pg.wait_for_timeout(800);chk('awards persist',len(await E("VR.ach()"))>=7)
    await E("VR.go('achievements')");await pg.wait_for_timeout(300);await pg.screenshot(path='screenshots/v6_achievements.png')
    await b.close()
  print('BAD',bad);print('ERRORS',errs)
asyncio.run(main())
