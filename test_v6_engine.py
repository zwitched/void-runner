# ENGINE FAILURE: physics, gap fairness, collision, win/fail, campaign flow, save remap, input.
import asyncio,pathlib,json
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
    # ---- save remap: an old v3 save that had cleared up to THE SHEAR ----
    await E("localStorage.setItem('voidrunner.save.v1',JSON.stringify({v:3,lvl:8,cr:100,best:{4:{r:'A',s:10},5:{r:'S',s:20},7:{r:'B',s:30}}}));location.reload()");await pg.wait_for_timeout(800)
    sv=await E("JSON.parse(localStorage.getItem('voidrunner.save.v1'))")
    nm=await E("LV.map(L=>L.name)");chk('old save remapped: next chapter is the second engine chapter',sv['v']>=4 and nm[sv['lvl']]=='COLD DRIFT',sv)
    chk('old best ranks follow their chapters',{nm[int(k)] for k in sv['best']}=={'CINDER DRIFT','ORUUN SURFACE','THE SHEAR'} and sv['best'][str(nm.index('ORUUN SURFACE'))]['r']=='S',sv['best'])
    await E("location.reload()");await pg.wait_for_timeout(700)
    chk('remap only runs once',await E("JSON.parse(localStorage.getItem('voidrunner.save.v1')).lvl")==nm.index('COLD DRIFT'))
    idx=await E("VR.eng.idx()");names=await E("LV.map(L=>L.name)")
    chk('two engine chapters in the campaign',[names[i] for i in idx]==['ENGINE FAILURE','COLD DRIFT'] and names[idx[0]-1]=='CINDER DRIFT' and names[idx[0]+1]=='ORUUN SURFACE' and names[idx[1]-1]=='THE SHEAR' and names[idx[1]+1] in ('RIFT APPROACH','SURVEY DOCK'),idx,names)
    await E("localStorage.clear();location.reload()");await pg.wait_for_timeout(700)
    # ---- physics ----
    ys=await E("VR.eng.step(60,false)");vy=[v for _,v in ys]
    chk('gravity pulls down at a steady rate',abs((vy[30]-vy[10])/(20/60)-600)<1,vy[10],vy[30])
    ys=await E("VR.eng.step(30,true)");chk('a kick sends the ship up',ys[0][1]<-190 and ys[5][0]<ys[0][0],ys[0])
    ys=await E("VR.eng.step(200,false)");chk('fall speed is capped',max(v for _,v in ys)<=360.01)
    # ---- gap fairness ----
    bad_course=0;lost=[]
    for d in (1,2,3):
      for k in (0.85,1,1.15):
        r=await E(f"(()=>{{let f=[],c=0;for(let s=1;s<=120;s++){{const seed=s*104729+{d};if(VR.eng.check(seed,{d}).length)c++;const r=VR.eng.sim(seed,{d},{k});if(!r.won)f.push(seed);}}return [c,f];}})()")
        bad_course+=r[0];lost+= [(d,k,x) for x in r[1]]
    chk('every course keeps gaps wide, inside the field, and spaced out',bad_course==0,bad_course)
    chk('autopilot gets through every course at every difficulty (always passable)',not lost,lost[:5])
    # ---- collision ----
    ht=await E("[VR.eng.hitTest(75,200,110,200),VR.eng.hitTest(75,200,110,140),VR.eng.hitTest(75,200,110,252),VR.eng.hitTest(200,200,110,100),VR.eng.hitTest(75,200,110,248)]")
    chk('collision: safe in the gap, hit on the strut, nothing when the strut is far away',ht==[False,True,True,False,False],ht)
    # ---- flow: tap anywhere starts, crash -> over -> retry ----
    await E("VR.setS({diff:1});VR.god=false;VR.start(VR.ix('ENGINE FAILURE'))");await pg.wait_for_timeout(300)
    chk('waits for the first kick',await E("VR.eng.H().ready"))
    await pg.mouse.click(130,600);await pg.wait_for_timeout(100)
    chk('tap anywhere kicks',not await E("VR.eng.H().ready") and await E("VR.eng.H().vy")<0)
    await pg.wait_for_timeout(250);await pg.keyboard.press('Space');await pg.wait_for_timeout(50);v1=await E("VR.eng.H().vy")
    await pg.wait_for_timeout(250);await pg.keyboard.press('ArrowUp');await pg.wait_for_timeout(50);v2=await E("VR.eng.H().vy")
    chk('Space and Up kick too',v1<-150 and v2<-150,v1,v2)
    await E("(()=>{const H=VR.eng.H();H.y=500;})()");await pg.wait_for_timeout(1800)
    chk('hitting the floor fails the chapter',await E("VR.state()")=='over')
    await pg.screenshot(path='screenshots/v6_engine_crash.png')
    await E("startLevel(curLvl)");await pg.wait_for_timeout(200)
    chk('retry restarts the run',await E("VR.state()")=='engine' and await E("VR.eng.H().dist")==0)
    # easy gives one bump
    await E("VR.setS({diff:0});VR.start(VR.ix('ENGINE FAILURE'))");await pg.wait_for_timeout(200);await E("VR.eng.kick();VR.eng.H().y=30");await pg.wait_for_timeout(300)
    chk('Easy: first knock costs hull but keeps you flying',await E("VR.state()")=='engine' and await E("VR.eng.H().hp")==1)
    await E("VR.setS({diff:1})")
    # ---- win: autopilot to the dock ----
    await E("VR.start(VR.ix('ENGINE FAILURE'))");await pg.wait_for_timeout(200);await E("VR.eng.H().auto=1;VR.eng.kick()")
    await pg.wait_for_timeout(6500);await pg.screenshot(path='screenshots/v6_engine_failure.png')
    await E("(()=>{const H=VR.eng.H();H.dist=H.goal-150;})()");await pg.wait_for_timeout(1300);await pg.screenshot(path='screenshots/v6_engine_dock.png')
    await pg.wait_for_timeout(1500)
    st=await E("VR.state()");last=await E("VR.last()")
    chk('reaching the dock clears with a rank',st=='clear' and last and last['rank'] in 'SABC',st,last)
    chk('campaign progress moves past the engine chapter',await E("JSON.parse(localStorage.getItem('voidrunner.save.v1')).lvl")==await E('VR.ix("ORUUN SURFACE")'))
    chk('best rank saved for the engine chapter',str(await E('VR.ix("ENGINE FAILURE")')) in await E("VR.best()"))
    chk('engine award',('engine' in await E("VR.ach()")))
    await pg.screenshot(path='screenshots/v6_engine_clear.png')
    # ---- campaign flow from CINDER DRIFT into the engine chapter ----
    await E("localStorage.clear();location.reload()");await pg.wait_for_timeout(700)
    await E("VR.god=true;VR.start(VR.ix('CINDER DRIFT'))");await pg.wait_for_timeout(200);await E("VR.boss()");await pg.wait_for_timeout(2500);await E("VR.kill()");await pg.wait_for_timeout(4500)
    lv=await E("JSON.parse(localStorage.getItem('voidrunner.save.v1')).lvl");chk('clearing CINDER DRIFT unlocks ENGINE FAILURE next',lv==await E('VR.ix("ENGINE FAILURE")'),lv)
    await E("goStory(S.lvl)");await pg.wait_for_timeout(300);chk('story screen for the engine chapter',await E("VR.state()")=='story' and await E("curLvl")==await E('VR.ix("ENGINE FAILURE")'))
    await pg.screenshot(path='screenshots/v6_engine_story.png')
    for i in range(30):
      if await E("VR.state()")!='story':break
      await pg.mouse.click(200,500);await pg.wait_for_timeout(250)
    chk('story leads into the engine run',await E("VR.state()")=='engine',await E("VR.state()"))
    # ---- daily can land on an engine chapter ----
    ds=await E("(()=>{for(let d=1;d<=60;d++){const s='2026-11-'+String(d).padStart(2,'0');if(VR.eng.idx().includes(VR.dailyLv(s)))return s;}return null})()")
    chk('daily rotation includes engine chapters',ds is not None,ds)
    # text checks
    txt=await E("LV.filter(L=>L.t==='engine').map(L=>L.story.join(' ')).join(' ')")
    chk('story text: no em dashes',('\u2014' not in txt) and ('--' not in txt))
    await b.close()
  print('BAD',bad);print('ERRORS',errs)
asyncio.run(main())
