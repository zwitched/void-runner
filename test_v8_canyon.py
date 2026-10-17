# CANYON CHASE (RIFT CANYON): chapter slot + save remap, generator fairness, steering (drag/keys), boost (button/Shift),
# rocks/walls/boulders/pads/coins, auto guns + courier surges, win/fail/escape, autopilot on Easy/Normal/Hard, daily, campaign flow.
import asyncio,pathlib,re
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
    # --- save remap v7 -> v8: had just cleared LISTENING POST (v7 index 13), next was SPIRE LOCK (14)
    await E("localStorage.setItem('voidrunner.save.v1',JSON.stringify({v:7,lvl:14,best:{13:{r:'S',s:5},14:{r:'A',s:6},15:{r:'B',s:7}}}));location.reload()");await pg.wait_for_timeout(800)
    sv=await E("JSON.parse(localStorage.getItem('voidrunner.save.v1'))");nm=await E("LV.map(L=>L.name)")
    chk('v7 save: next chapter is the new RIFT CANYON',nm[sv['lvl']]=='RIFT CANYON' and sv['v']==8,sv)
    chk('v7 save: ranks follow their chapters',{nm[int(k)]:v['r'] for k,v in sv['best'].items()}=={'LISTENING POST':'S','SPIRE LOCK':'A','SPIRE NURSERY':'B'},sv['best'])
    await E("localStorage.setItem('voidrunner.save.v1',JSON.stringify({v:7,lvl:16,best:{}}));location.reload()");await pg.wait_for_timeout(800)
    sv=await E("JSON.parse(localStorage.getItem('voidrunner.save.v1'))");chk('v7 save further along keeps its next chapter (HIVE SPIRE)',nm[sv['lvl']]=='HIVE SPIRE',sv)
    ci=await E("VR.ix('RIFT CANYON')");chk('canyon chapter sits between LISTENING POST and SPIRE LOCK',nm[ci-1]=='LISTENING POST' and nm[ci+1]=='SPIRE LOCK' and await E(f"LV[{ci}].t")=='canyon',ci)
    chk('19 chapters',len(nm)==19,len(nm))
    st=await E(f"LV[{ci}].story");chk('story: short, human (no em dashes, no "not X but Y")',all(('\u2014' not in l) and ('\u2013' not in l) and not re.search(r"\bnot\b[^.]*\bbut\b",l,re.I) and len(l)<110 for l in st) and 4<=len(st)<=8,st)
    await E("localStorage.clear();location.reload()");await pg.wait_for_timeout(700)
    box=await pg.locator('canvas').bounding_box();X=lambda x:box['x']+x*box['width']/270;Y=lambda y:box['y']+y*box['height']/480
    cdp=await pg.context.new_cdp_session(pg)
    async def touch(kind,pts):await cdp.send('Input.dispatchTouchEvent',{'type':kind,'touchPoints':[{'x':X(x),'y':Y(y),'id':i} for i,(x,y) in pts]})
    # story screen label
    await E(f"goStory({ci})");await pg.wait_for_timeout(400);await pg.screenshot(path='screenshots/v8_canyon_story.png')
    # --- fairness: every seed on every difficulty keeps a clear racing line
    fr=await E("""(()=>{const o=[];for(const di of [0,1,2]){let bad=[],ms=0,mw=1e9,mo=1e9,ob=0,nar=0;for(let k=0;k<40;k++){const r=VR.cy.gen(500+k*97,di);bad=bad.concat(r.bad);ms=Math.max(ms,r.mxSl);mw=Math.min(mw,r.minWall);mo=Math.min(mo,r.minObs);ob+=r.obs;nar+=r.nar;}o.push({di,bad:bad.length,ms,mw,mo,ob:ob/40,nar:nar/40});}return o})()""")
    chk('generator: racing line clears every rock by >= 10px, walls by >= 18px, slope <= 0.5, on all difficulties (120 canyons)',all(r['bad']==0 and r['mo']>=10 and r['mw']>=18 and r['ms']<=0.5 for r in fr),fr)
    chk('more rocks on harder settings',fr[0]['ob']<fr[1]['ob']<fr[2]['ob'] and all(r['nar']>=2 for r in fr),[r['ob'] for r in fr])
    ct=await E("VR.cy.CT()");chk('tuning order: Hard has the fastest courier, Easy the slowest; narrows tighten on Hard',ct[0]['vt']<ct[1]['vt']<ct[2]['vt'] and ct[0]['narrow']>ct[1]['narrow']>ct[2]['narrow'],[c['vt'] for c in ct])
    # --- controls
    await E(f"VR.setS({{diff:1}});VR.god=true;VR.start({ci})");await pg.wait_for_timeout(300);chk('starts in canyon mode',await E("VR.state()")=='canyon')
    lay=await E("(()=>{const c=VR.cy.CY(),[x,y,w,h]=c.boostR;return {x,y,w,h,bot:c.bot,top:c.top}})()")
    chk('BOOST button sits in the bottom panel, clear of the play area and the pause button',lay['y']>=lay['bot'] and lay['y']+lay['h']<=478 and lay['x']+lay['w']<=270 and lay['x']>=150,lay)
    x0=await E("VR.G().P.x");await touch('touchStart',[(0,(120,250))]);await touch('touchMove',[(0,(150,250))]);await pg.wait_for_timeout(400);x1=await E("VR.G().P.x")
    chk('drag right steers right (relative to where the finger went down)',x1>x0+25,x0,x1)
    await touch('touchMove',[(0,(90,250))]);await pg.wait_for_timeout(400);x2=await E("VR.G().P.x");chk('drag left steers left',x2<x1-25,x1,x2)
    # second finger on BOOST while steering
    v0=await E("VR.G().P.v");await touch('touchMove',[(0,(90,250)),(1,(216,438))]);await pg.wait_for_timeout(700);r=await E("[VR.G().boosting,VR.G().P.v,VR.G().bm]")
    chk('second finger on BOOST boosts while the first keeps steering',r[0] and r[1]>v0+60 and r[2]<100,v0,r)
    await pg.screenshot(path='screenshots/v8_canyon_boost.png')
    await touch('touchEnd',[]);await pg.wait_for_timeout(200);chk('let go: boost stops',not await E("VR.G().boosting"))
    xa=await E("VR.G().P.x");await touch('touchStart',[(0,(216,438))]);await pg.wait_for_timeout(300);xb=await E("VR.G().P.x");await touch('touchEnd',[])
    chk('pressing BOOST does not steer',abs(xb-xa)<1,xa,xb)
    await E("VR.G().bm=100");a0=await E("VR.G().P.x");await pg.keyboard.down('ArrowLeft');await pg.wait_for_timeout(250);await pg.keyboard.up('ArrowLeft');a1=await E("VR.G().P.x")
    await pg.keyboard.down('ArrowRight');await pg.wait_for_timeout(250);await pg.keyboard.up('ArrowRight');a2=await E("VR.G().P.x")
    chk('arrow keys steer both ways',a1<a0-20 and a2>a1+20,a0,a1,a2)
    await pg.keyboard.down('Shift');await pg.wait_for_timeout(300);r=await E("VR.G().boosting");await pg.keyboard.up('Shift');chk('Shift boosts',r)
    await E("VR.G().bm=0;VR.G().P.v=250");await pg.keyboard.down('Shift');await pg.wait_for_timeout(400);r=await E("[VR.G().bm,VR.G().P.v]");await pg.keyboard.up('Shift');chk('empty meter: holding boost only sips the trickle, no real speed-up',r[0]<3 and r[1]<300,r)
    r=await E("(()=>{const G=VR.G();G.boosting=false;G.bm=50;for(let k=0;k<60;k++)updCanyon(1/60);return G.bm})()");chk('meter refills when not boosting',r>55,r)
    # --- hazards and pickups (headless steps on the live state)
    await E("VR.god=false")
    r=await E("""(()=>{const G=VR.G(),P=G.P;G.p.inv=0;G.p.hp=G.p.mhp;const c=G.at(G.C,P.s),hw=G.at(G.HW,P.s);P.x=c-hw-20;const v=P.v,h=G.p.hp,w0=G.wallN;updCanyon(1/60);return [h,G.p.hp,G.wallN-w0,P.v<v,Math.abs(P.x-c)<hw]})()""")
    chk('hitting a wall hurts, slows you and pushes you back inside',r[1]<r[0] and r[2]==1 and r[3] and r[4],r)
    r=await E("""(()=>{const G=VR.G(),P=G.P;G.p.inv=0;const h=G.p.hp;P.x=G.at(G.C,P.s);G.obs.unshift({k:'rock',x:P.x,s:P.s+4,r:10});const v=P.v,n0=G.hitN;for(let k=0;k<3;k++)updCanyon(1/60);return [h,G.p.hp,G.hitN-n0,P.v<v*0.9,G.obs[0].dead===1]})()""")
    chk('hitting a rock hurts, slows you and breaks the rock',r[1]<r[0] and r[2]==1 and r[3] and r[4],r)
    r=await E("""(()=>{const G=VR.G(),P=G.P;G.p.inv=9;const o={k:'boulder',x:P.x+60,s:P.s+300,r:12,ft:0,trig:320};G.obs.unshift(o);updCanyon(1/60);const f1=o.ft;for(let k=0;k<70;k++)updCanyon(1/60);return [f1>0,o.ft]})()""")
    chk('boulders start falling once you get near and land about a second later',r[0] and r[1]>=1,r)
    r=await E("""(()=>{const G=VR.G(),P=G.P;G.p.inv=9;G.bm=10;G.pads.unshift({s:P.s+3,x:P.x});for(let k=0;k<2;k++)updCanyon(1/60);return [G.padN,P.v,G.bm]})()""");chk('boost pad: speed burst and +30 meter',r[0]>=1 and r[1]>=380 and r[2]>=39,r)
    r=await E("""(()=>{const G=VR.G(),P=G.P;const c0=VR.S().cr+0,k0=G.coins.filter(c=>c.got).length;G.coins.unshift({s:P.s+3,x:P.x});for(let k=0;k<2;k++)updCanyon(1/60);return G.coins.filter(c=>c.got).length-k0})()""");chk('coins on the line get picked up',r==1,r)
    # near miss
    r=await E("""(()=>{const G=VR.G(),P=G.P;G.p.inv=0;const s0=VR.score().score,h=G.p.hp;G.obs.unshift({k:'rock',x:P.x+20,s:P.s+10,r:9});for(let k=0;k<20;k++)updCanyon(1/60);return [G.near,G.p.hp===h,VR.score().score>s0]})()""");chk('a close pass scores a near miss without damage',r[0]>=1 and r[1] and r[2],r)
    # guns + surges
    r=await E("""(()=>{const G=VR.G(),P=G.P,tg=G.tg;G.p.inv=99;G.obs=G.obs.filter(o=>o.s>P.s+2000);tg.s=P.s+400;tg.hp=tg.mhp;for(let k=0;k<30;k++)updCanyon(1/60);const far=tg.hp;tg.s=P.s+180;let su=0;for(let k=0;k<240&&tg.hp>2;k++){updCanyon(1/60);if(tg.su>0)su=1;}return [far,tg.mhp,tg.hp,su]})()""")
    chk('guns stay quiet out of range, fire and hit in range, the courier surges when hurt',r[0]==r[1] and r[2]<r[1] and r[3]==1,r)
    await E(f"VR.start({ci})");await E("VR.G().auto=1");await pg.wait_for_timeout(4300);await E("(()=>{const G=VR.G();G.tg.s=G.P.s+230;})()");await pg.wait_for_timeout(500);await pg.screenshot(path='screenshots/v8_canyon.png');await E("VR.G().auto=0")
    # --- win
    await E(f"VR.god=true;VR.start({ci})");await pg.wait_for_timeout(200);await E("VR.kill()");await pg.wait_for_timeout(3200)
    chk('courier down clears the chapter',await E("VR.state()")=='clear',await E("VR.state()"))
    l=await E("VR.last()");chk('rank + canyon par time',l['rank'] in list('SABC') and l['par']==await E("Math.round(VR.cy.H().Lc/250+6)"),l)
    ach=await E("VR.ach()");chk('CANYON RUNNER + THREAD THE NEEDLE awards',('canyon' in ach) and ('needle' in ach),list(ach.keys())[-4:])
    await pg.screenshot(path='screenshots/v8_canyon_clear.png')
    # --- fail: hull, escape
    await E(f"VR.god=false;VR.start({ci})");await pg.wait_for_timeout(200);await E("(()=>{const G=VR.G();G.p.hp=1;G.p.inv=0;hurt();})()");await pg.wait_for_timeout(1700)
    chk('hull 0 fails the chapter',await E("VR.state()")=='over')
    await E(f"VR.god=true;VR.start({ci})");await pg.wait_for_timeout(200);await E("(()=>{const G=VR.G();G.tg.s=G.Lc-1;})()");await pg.wait_for_timeout(300);r=await E("VR.G().esc");await pg.wait_for_timeout(1800)
    chk('courier reaching the Spire fails the chapter',r==1 and await E("VR.state()")=='over')
    await E("startLevel(curLvl)");await pg.wait_for_timeout(200);chk('retry starts fresh',await E("VR.state()")=='canyon' and await E("VR.G().P.s")<300)
    await pg.keyboard.press('Escape');chk('Escape pauses',await E("VR.state()")=='pause');await pg.keyboard.press('Escape')
    await pg.touchscreen.tap(X(255),Y(11));await pg.wait_for_timeout(200);chk('pause button pauses',await E("VR.state()")=='pause');await pg.keyboard.press('Escape')
    # --- autopilot: precise (1), a bit sloppy (2) and very sloppy (3, hits rocks) on every difficulty
    await E("VR.god=false")
    res={}
    for dfi in range(3):
      for m in (1,2,3):
        n=3 if m<3 else 6
        res[(dfi,m)]=await E(f"(()=>{{const o=[];for(let k=0;k<{n};k++){{VR.setS({{diff:{dfi}}});VR.start({ci});o.push(VR.cy.sim(120,{m}));}}return o}})()")
    def summ(rs):return [(('W' if r['won'] else 'ESC' if r['esc'] else 'DEAD'),r['t'],r['left'],str(r['hp'])+'/'+str(r['mhp'])) for r in rs]
    for dfi,dn,left in [(0,'Easy',15),(1,'Normal',10),(2,'Hard',5)]:
      rs=res[(dfi,1)];chk(f'{dn}: autopilot wins 3/3 with >= {left}s of courier time to spare and full-ish hull',all(r['won'] and r['left']>=left and r['hp']>=0.75*r['mhp'] for r in rs),summ(rs))
      rs=res[(dfi,2)];chk(f'{dn}: slightly sloppy pilot wins 3/3',all(r['won'] for r in rs),summ(rs))
    rs=res[(0,3)];chk('Easy: very sloppy pilot (keeps hitting rocks) still wins 6/6',all(r['won'] for r in rs),summ(rs))
    rs=res[(1,3)];chk('Normal: very sloppy pilot wins at least 5/6',sum(r['won'] for r in rs)>=5,summ(rs))
    print('Hard very sloppy (info only):',summ(res[(2,3)]))
    await E("VR.setS({diff:1})")
    chk('daily challenge can pick the canyon',await E(f"(()=>{{for(let i=0;i<800;i++){{const d=new Date(2026,0,1+i),s=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');if(VR.dailyLv(s)==={ci})return true}}return false}})()"))
    # --- campaign flow: story -> canyon -> clear -> shop, next is SPIRE LOCK
    await E(f"localStorage.clear();VR.S().lvl={ci};VR.S().cr=0;VR.ott.tab(0);VR.shop()");await pg.wait_for_timeout(200)
    await pg.touchscreen.tap(X(135),Y(368));await pg.wait_for_timeout(200);s1=await E('VR.state()');await pg.touchscreen.tap(X(135),Y(300));await pg.wait_for_timeout(100);await pg.touchscreen.tap(X(135),Y(300));await pg.wait_for_timeout(300)
    s2=await E('VR.state()');await E("VR.god=true;VR.kill()");await pg.wait_for_timeout(3200);s3=await E('VR.state()');await pg.wait_for_timeout(500);await pg.touchscreen.tap(X(135),Y(300));await pg.wait_for_timeout(300)
    s4=await E('VR.state()');lv=await E('VR.S().lvl')
    chk('campaign flow through the canyon',[s1,s2,s3,s4]==['story','canyon','clear','shop'] and nm[lv]=='SPIRE LOCK',[s1,s2,s3,s4,lv])
    await b.close()
  print('BAD',bad);print('ERRORS',errs)
asyncio.run(main())
