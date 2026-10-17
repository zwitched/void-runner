# BOARDING: cutter engine pods, hull soaks shots, dock -> interior, reactor core, clear, save remap.
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
    # remap from a v4 save (15 chapters) that had cleared SURVEY BEACON
    await E("localStorage.setItem('voidrunner.save.v1',JSON.stringify({v:4,lvl:8,best:{6:{r:'S',s:5},7:{r:'A',s:6}}}));location.reload()");await pg.wait_for_timeout(800)
    sv=await E("JSON.parse(localStorage.getItem('voidrunner.save.v1'))");nm=await E("LV.map(L=>L.name)")
    chk('v4 save remapped: next chapter still THE SHEAR',nm[sv['lvl']]=='THE SHEAR',sv['lvl'])
    chk('best ranks follow their chapters',{nm[int(k)]:v['r'] for k,v in sv['best'].items()}=={'ORUUN SURFACE':'S','SURVEY BEACON':'A'},sv['best'])
    bi=await E("VR.ix('HOLLOW CUTTER')");chk('boarding chapter sits after ORUUN SURFACE',nm[bi-1]=='ORUUN SURFACE' and await E(f"LV[{bi}].t")=='board',bi)
    await E("localStorage.clear();location.reload()");await pg.wait_for_timeout(700)
    await E(f"VR.god=true;VR.start({bi})");await pg.wait_for_timeout(300)
    chk('boarding starts in space',await E("VR.state()")=='space')
    await E("VR.boss()");await pg.wait_for_timeout(3500)
    c=await E("VR.board.cut()");chk('the cutter shows up instead of a normal boss',c and c['state']=='fight' and not await E("!!VR.G().boss"),c)
    await pg.screenshot(path='screenshots/v7_boarding_space.png')
    # hull soaks shots, pods take damage
    r=await E("""(()=>{const G=VR.G(),c=G.cutter,h0=c.pods.map(q=>q.hp);G.bul.push({x:c.x+20,y:c.y-20,vx:0,vy:-1,dm:1,l:1,hits:[],c:'#bfe8ff'});return h0})()""");await pg.wait_for_timeout(80)
    r2=await E("VR.board.cut().pods");chk('the hull soaks shots without touching the engines',r==r2,r,r2)
    await E("""(()=>{const G=VR.G(),c=G.cutter,q=c.pods[0];G.bul.push({x:c.x+q.dx,y:c.y+q.dy+3,vx:0,vy:-1,dm:2,l:1,hits:[],c:'#bfe8ff'});})()""");await pg.wait_for_timeout(80)
    r3=await E("VR.board.cut().pods");chk('a shot on an engine pod damages it',r3[0]<r[0] and r3[1]==r[1],r3)
    await E("VR.setS({sec:'bomb',secLv:0});VR.G().secT=0;VR.fireSec()");await pg.wait_for_timeout(80)
    r4=await E("VR.board.cut().pods");chk('the bomb hits every pod',all(r4[i]<r3[i] for i in range(3)),r4)
    await E("VR.kill()");await pg.wait_for_timeout(600);sc0=await E("VR.score().score");cr0=await E("runCr")
    chk('all pods down -> docking',await E("VR.board.cut().state")=='dock')
    await pg.wait_for_timeout(700);await pg.screenshot(path='screenshots/v7_boarding_dock.png')
    await pg.wait_for_timeout(1800)
    chk('docking hands over to the cutter interior on foot',await E("VR.state()")=='plat' and await E("VR.board.inside()"))
    chk('score and credits carry over',await E("VR.score().score")>=sc0>0 and await E("runCr")>=cr0,sc0)
    core=await E("VR.board.core()");chk('the interior ends at a reactor core',core and core['k']=='core' and core['hp']>20,core)
    await E("(()=>{const G=VR.G();G.p.x=G.brute.x-110;G.p.y=G.brute.y;G.p.face=1;})()");await pg.wait_for_timeout(700)
    await pg.keyboard.down('KeyX');await pg.wait_for_timeout(900);await pg.screenshot(path='screenshots/v7_boarding_core.png');await pg.keyboard.up('KeyX')
    h1=await E("VR.board.core().hp");chk('the core takes hits',h1<core['hp'],h1)
    await E("VR.G().brute.hp=1");await pg.keyboard.down('KeyX');await pg.wait_for_timeout(1500);await pg.keyboard.up('KeyX')
    chk('core breaks',not await E("VR.G().ens.includes(VR.G().brute)"))
    await E("(()=>{const G=VR.G();G.p.x=G.door.x+4;G.p.y=G.door.y+4;})()");await pg.wait_for_timeout(600)
    chk('exit after the core clears the chapter',await E("VR.state()")=='clear')
    chk('clear rank shows',await E("VR.last().rank") in list('SABC'))
    chk('progress moves on',await E("S.lvl")==bi+1)
    chk('award',('board' in await E("VR.ach()")))
    # fail in space restarts the whole chapter from space
    await E(f"VR.god=false;VR.start({bi})");await pg.wait_for_timeout(300);await E("(()=>{const p=VR.G().p;p.hp=1;p.inv=0;p.sh=0;hurt();})()");await pg.wait_for_timeout(2000)
    chk('dying fails the chapter',await E("VR.state()")=='over')
    await E("startLevel(curLvl)");await pg.wait_for_timeout(200);chk('retry starts back in space',await E("VR.state()")=='space')
    await b.close()
  print('BAD',bad);print('ERRORS',errs)
asyncio.run(main())
