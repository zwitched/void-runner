# TURRET DEFENSE (SURVEY DOCK): aim by touch/mouse/keys, hold fire, overheat, upgrades, waves, door damage,
# Fenn's repair bar, Breacher boss, win/fail, campaign flow, save remap, hangar layout.
import asyncio,pathlib,math
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
    # remap from v6 (17 chapters): had just cleared COLD DRIFT (10), next was RIFT APPROACH (11)
    await E("localStorage.setItem('voidrunner.save.v1',JSON.stringify({v:6,lvl:11,best:{10:{r:'S',s:5},11:{r:'A',s:6},12:{r:'B',s:7}}}));location.reload()");await pg.wait_for_timeout(800)
    sv=await E("JSON.parse(localStorage.getItem('voidrunner.save.v1'))");nm=await E("LV.map(L=>L.name)")
    chk('v6 save: next chapter is the new SURVEY DOCK',nm[sv['lvl']]=='SURVEY DOCK' and sv['v']==7,sv)
    chk('v6 save: ranks follow their chapters',{nm[int(k)]:v['r'] for k,v in sv['best'].items()}=={'COLD DRIFT':'S','RIFT APPROACH':'A','LISTENING POST':'B'},sv['best'])
    ti=await E("VR.ix('SURVEY DOCK')");chk('turret chapter sits right after COLD DRIFT',nm[ti-1]=='COLD DRIFT' and nm[ti+1]=='RIFT APPROACH' and await E(f"LV[{ti}].t")=='turret',ti)
    chk('18 chapters in the campaign',len(nm)==18,len(nm))
    await E("localStorage.clear();location.reload()");await pg.wait_for_timeout(700)
    box=await pg.locator('canvas').bounding_box();X=lambda x:box['x']+x*box['width']/270;Y=lambda y:box['y']+y*box['height']/480
    cdp=await pg.context.new_cdp_session(pg)
    async def touch(kind,x,y):await cdp.send('Input.dispatchTouchEvent',{'type':kind,'touchPoints':[] if kind=='touchEnd' else [{'x':X(x),'y':Y(y)}]})
    await E(f"VR.god=false;VR.start({ti})");await pg.wait_for_timeout(300);await E("VR.G().wt=999")
    chk('starts in turret mode',await E("VR.state()")=='turret')
    # touch: press in the sky aims at the finger and fires while held
    await touch('touchStart',220,150);await pg.wait_for_timeout(500)
    a=await E("VR.G().ang");want=math.atan2(150-300,220-135);chk('touch aims the gun at the finger',abs(a-want)<0.05,a,want)
    h1=await E("VR.G().heat");n1=await E("VR.score().score>=0&&VR.G().bul.length");chk('holding fires and builds heat',h1>1 and n1>0,h1,n1)
    await touch('touchMove',60,120);await pg.wait_for_timeout(200);a2=await E("VR.G().ang");chk('drag re-aims',abs(a2-math.atan2(120-300,60-135))<0.05,a2)
    await pg.screenshot(path='screenshots/v7_turret.png')
    await touch('touchEnd',0,0);await pg.wait_for_timeout(600);h2=await E("VR.G().heat");chk('let go: stops firing and cools',await E("!VR.G().fire") and h2<h1+30,h2)
    await touch('touchStart',220,380);await pg.wait_for_timeout(200);a3=await E("VR.G().ang");await touch('touchEnd',0,0)
    chk('low touch near deck level aims there (down past horizontal)',abs(a3-math.atan2(80,85))<0.05,a3)
    await touch('touchStart',150,380);await pg.wait_for_timeout(200);a4=await E('VR.G().ang');await touch('touchEnd',0,0);chk('straight down is clamped to the arc limit',abs(a4-1.2)<0.01,a4)
    await touch('touchStart',135,440);await pg.wait_for_timeout(300);chk('touches in the bottom panel do not fire',await E("!VR.G().fire"));await touch('touchEnd',0,0)
    # keyboard
    a0=await E("VR.G().ang");await pg.keyboard.down('ArrowLeft');await pg.wait_for_timeout(300);await pg.keyboard.up('ArrowLeft');chk('Left turns the gun',await E("VR.G().ang")<a0-0.3)
    await pg.keyboard.down('KeyX');await pg.wait_for_timeout(300);chk('X fires',await E("VR.G().fire") and await E("VR.G().bul.length")>0);await pg.keyboard.up('KeyX')
    # overheat
    await E("VR.G().heat=0;VR.G().over=false");ov=await E("(VR.tu.fire(30),[VR.G().over,VR.G().heat])");chk('steady fire overheats',ov[0] and ov[1]==100,ov)
    await pg.keyboard.down('KeyX');await pg.wait_for_timeout(250);nb=await E("VR.G().bul.filter(u=>u.l>1.1).length");chk('no shots while overheated',nb==0 and not await E("VR.G().fire"),nb)
    await pg.screenshot(path='screenshots/v7_turret_overheat.png');await pg.keyboard.up('KeyX')
    await pg.wait_for_timeout(2600);chk('cools down and unlocks below 35%',await E("!VR.G().over") and await E("VR.G().heat")<=35)
    # upgrades
    s0=await E("(VR.setS({tdmg:0,tcool:0,ttwin:0}),VR.tu.stats())");s1=await E("(VR.setS({tdmg:2,tcool:3,ttwin:1}),VR.tu.stats())")
    chk('CALIBER hits harder, COOLANT runs cooler, TWIN adds a barrel',s1['dm']>s0['dm'] and s1['heat']<s0['heat'] and s1['cool']>s0['cool'] and s1['bar']==2,s0,s1)
    nb=await E("(()=>{const G=VR.G();G.bul=[];G.heat=0;G.over=false;VR.tu.fire(1);return G.bul.length})()");chk('twin fires two rounds per shot',nb==2,nb)
    await E("VR.setS({tdmg:0,tcool:0,ttwin:0})")
    # enemies: shot down for points, crawlers hurt the door, flyers dive at the gun, enemy rounds can be shot down
    await E(f"VR.start({ti})");await pg.wait_for_timeout(200)
    r=await E("""(()=>{const G=VR.G();G.wt=999;const i=VR.tu.spawn('crawler',1),e=G.en[i];e.x=200;const s0=VR.score().score;for(let k=0;k<12;k++)G.bul.push({x:e.x,y:e.y,vx:0,vy:0,l:0.1,dm:1});updTurret(1/60);return [e.dead===1,VR.score().score>s0]})()""")
    chk('rounds kill a crawler and score',r==[True,True],r)
    r=await E("""(()=>{const G=VR.G();G.p.inv=0;const h=G.p.hp,i=VR.tu.spawn('crawler',-1),e=G.en[i];e.x=TG.gx+TG.door+2;e.vx=-30;for(let k=0;k<10;k++)updTurret(1/60);return [h,G.p.hp,VR.score().dmg]})()""")
    chk('a crawler reaching the airlock damages it and counts as a hit',r[1]==r[0]-1 and r[2]>=1,r)
    r=await E("""(()=>{const G=VR.G();G.p.inv=0;const h=G.p.hp,i=VR.tu.spawn('flyer'),e=G.en[i];e.x=TG.gx;e.y=TG.gy-20;for(let k=0;k<30;k++)updTurret(1/60);return [h,G.p.hp]})()""")
    chk('a flyer diving into the gun damages the airlock',r[1]==r[0]-1,r)
    r=await E("""(()=>{const G=VR.G();G.eb=[{x:100,y:100,vx:0,vy:0}];G.bul=[{x:100,y:100,vx:0,vy:0,l:1,dm:1}];updTurret(1/60);return G.eb.length})()""");chk('enemy rounds can be shot down',r==0,r)
    # waves get bigger and bring flyers
    w=await E("""(()=>{const G=VR.G();G.q=[];tWave(G);const a=G.q.slice();G.q=[];tWave(G);const b=G.q.slice();G.q=[];return [a.length,a.filter(q=>q[1]==='flyer').length,b.length,b.filter(q=>q[1]==='flyer').length]})()""")
    chk('wave 2 is bigger than wave 1 and adds flyers',w[2]>w[0] and w[1]==0 and w[3]>0,w)
    # repair + boss + win
    await E(f"VR.start({ti})");await pg.wait_for_timeout(200)
    r=await E("(()=>{const G=VR.G();G.wt=999;G.p.hp=99;G.p.mhp=99;const r0=G.rep;for(let k=0;k<60;k++)updTurret(1/60);return [r0,G.rep,G.need]})()");chk('Fenn repairs over time (about need seconds)',abs((r[1]-r[0])-100/r[2])<0.2,r)
    await E("VR.god=true;VR.G().rep=69.99");await pg.wait_for_timeout(300);chk('at 70% the Breacher shows up',await E("!!VR.G().boss&&VR.G().boss.k==='breacher'"))
    await pg.wait_for_timeout(3500);await pg.screenshot(path='screenshots/v7_turret_boss.png')
    await E("VR.G().rep=98.9");await pg.wait_for_timeout(900);chk('repair holds at 99% while the Breacher lives',await E("VR.G().rep")==99 and await E("VR.state()")=='turret')
    await E("(()=>{const G=VR.G();G.boss.hp=1;G.bul.push({x:G.boss.x,y:G.boss.y,vx:0,vy:0,l:1,dm:5});})()");await pg.wait_for_timeout(300);print("boss",await E("[VR.G().bossDone,VR.G().rep,VR.G().won]"));await pg.wait_for_timeout(3300)
    chk('Breacher down + repair done clears the chapter',await E("VR.state()")=='clear',await E("VR.state()"))
    chk('rank shown',await E("VR.last().rank") in list('SABC'));ach=await E("VR.ach()");chk('DOCK WORKER award',('dock' in ach))
    await pg.screenshot(path='screenshots/v7_turret_clear.png')
    # fail
    await E(f"VR.god=false;VR.start({ti})");await pg.wait_for_timeout(200);await E("(()=>{const G=VR.G();G.p.hp=1;G.p.inv=0;tHitDoor(G,1);})()");await pg.wait_for_timeout(1900)
    chk('door broken fails the chapter',await E("VR.state()")=='over');await E("startLevel(curLvl)");await pg.wait_for_timeout(200);chk('retry starts fresh',await E("VR.state()")=='turret' and await E("VR.G().rep")<2)
    # pause
    await pg.keyboard.press('Escape');chk('Escape pauses',await E("VR.state()")=='pause');await pg.keyboard.press('Escape')
    await pg.touchscreen.tap(X(255),Y(11));await pg.wait_for_timeout(200);chk('pause button pauses and does not fire',await E("VR.state()")=='pause' and not await E("VR.G().fire"));await pg.keyboard.press('Escape')
    # difficulty
    v=[]
    for dfi in range(3):
      await E(f"VR.setS({{diff:{dfi}}});VR.start({ti})");v.append(await E("(()=>{const G=VR.G(),e=G.en[VR.tu.spawn('crawler',1)];return [e.hp,Math.abs(e.vx)]})()"))
    chk('Hard: tougher, faster crawlers. Easy: weaker, slower',v[0][0]<=v[1][0]<v[2][0] and v[0][1]<v[1][1]<v[2][1],v)
    await E("VR.setS({diff:1})")
    chk('daily challenge can pick the dock',await E(f"(()=>{{for(let i=0;i<800;i++){{const d=new Date(2026,0,1+i),s=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');if(VR.dailyLv(s)==={ti})return true}}return false}})()"))
    # hangar: gun upgrades on the GEAR tab, everything fits
    await E("VR.setS({cr:2000});VR.ott.tab(1);VR.shop()");await pg.wait_for_timeout(300)
    ys=await E("BTN.filter(b=>b.w===72).map(b=>b.y)");chk('gear tab: 1 hack + 3 drone + 3 gun upgrades',len(ys)==7,ys)
    await pg.touchscreen.tap(X(226),Y(ys[4]+12));await pg.wait_for_timeout(200);chk('tap buys CALIBER',await E("VR.S().tdmg")==1)
    ov=await E("(()=>{const B=BTN;for(let i=0;i<B.length;i++)for(let j=i+1;j<B.length;j++){const a=B[i],b=B[j];if(a.x<b.x+b.w&&b.x<a.x+a.w&&a.y<b.y+b.h&&b.y<a.y+a.h)return [a,b];}return null})()");chk('no overlapping hangar buttons',ov is None,ov)
    chk('fits on screen',await E("Math.max(...BTN.map(b=>b.y+b.h))")<=478);await pg.screenshot(path='screenshots/v7_hangar_gear.png')
    # campaign flow
    await E(f"localStorage.clear();VR.S().lvl={ti};VR.S().cr=0;VR.ott.tab(0);VR.shop()");await pg.wait_for_timeout(200)
    await pg.touchscreen.tap(X(135),Y(368));await pg.wait_for_timeout(200);s1=await E('VR.state()');await pg.touchscreen.tap(X(135),Y(300));await pg.wait_for_timeout(100);await pg.touchscreen.tap(X(135),Y(300));await pg.wait_for_timeout(300)
    s2=await E('VR.state()');await E("VR.kill()");await pg.wait_for_timeout(2500);s3=await E('VR.state()');await pg.wait_for_timeout(500);await pg.touchscreen.tap(X(135),Y(300));await pg.wait_for_timeout(300)
    s4=await E('VR.state()');lv=await E('VR.S().lvl')
    chk('campaign flow through the dock',[s1,s2,s3,s4]==['story','turret','clear','shop'] and nm[lv]=='RIFT APPROACH',[s1,s2,s3,s4,lv])
    await b.close()
  print('BAD',bad);print('ERRORS',errs)
asyncio.run(main())
