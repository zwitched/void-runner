# SURVEY DOCK reachability: every lane and enemy type can be hit from inside the gun's arc along its whole path,
# bullets are not eaten by the deck, low touches/keys aim low, and an aim-at-nearest bot wins on Normal and Hard.
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
    await E("localStorage.clear();location.reload()");await pg.wait_for_timeout(700)
    ti=await E("VR.ix('SURVEY DOCK')");await E(f"VR.god=true;VR.start({ti})");await pg.wait_for_timeout(200)
    # one real bullet, fired with the clamped aim, against a frozen enemy at each sampled point of its path
    r=await E("""(()=>{const H=VR.G(),T=TG,miss=[];let n=0;
      const lanes=[];for(let x=-8;x<=T.gx-T.door;x+=6)lanes.push(['crawler',-1,x,T.gr-5]);for(let x=W+8;x>=T.gx+T.door;x-=6)lanes.push(['crawler',1,x,T.gr-5]);
      for(let y=T.top;y<T.gy-16;y+=20)for(let x=10;x<=W-10;x+=20)lanes.push(['flyer',0,x,y]);
      for(let x=W+40;x>=T.gx+T.door+18;x-=8)lanes.push(['breacher',0,x,T.gr-40]);
      for(const [k,side,x,y] of lanes){H.en=[];H.eb=[];H.bul=[];H.q=[];H.wt=999;H.heat=0;H.over=false;H.boss=null;H.rep=0;const e=G.en[VR.tu.spawn(k,side||1)];e.x=x;e.y=y;e.vx=0;e.v=0;e.ft=99;e.hp=999;
        H.ang=tClampAng(Math.atan2(y-T.gy,x-T.gx));tFireP(H,{bar:1,dm:1,heat:0,spread:0});for(let f=0;f<120&&H.bul.length;f++){e.x=x;e.y=y;updTurret(1/60);}n++;if(e.hp>=999)miss.push([k,x,y]);}
      H.en=[];return {n,miss:miss.slice(0,10),nm:miss.length}})()""")
    chk('every lane and enemy type is hittable along its whole path (no deck block)',r['nm']==0 and r['n']>100,r)
    # keys reach the low limits on both sides
    await pg.keyboard.down('ArrowRight');await pg.wait_for_timeout(2000);await pg.keyboard.up('ArrowRight');a=await E("VR.G().ang")
    await pg.keyboard.down('ArrowLeft');await pg.wait_for_timeout(2800);await pg.keyboard.up('ArrowLeft');a2=await E("VR.G().ang")
    chk('arrow keys swing down to the limit on both sides',abs(a-1.2)<0.01 and abs(a2-(3.14159265-1.2))<0.01,a,a2)
    # touch low at deck level, both sides
    box=await pg.locator('canvas').bounding_box();X=lambda x:box['x']+x*box['width']/270;Y=lambda y:box['y']+y*box['height']/480
    cdp=await pg.context.new_cdp_session(pg)
    await E("(()=>{const H=VR.G();H.en=[];H.q=[];H.wt=999;const e=H.en[VR.tu.spawn('crawler',1)];e.x=215;e.vx=0;e.hp=999;})()")
    await cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':X(215),'y':Y(345)}]});await pg.wait_for_timeout(500)
    await pg.screenshot(path='screenshots/v7_turret_lowaim.png')
    hp=await E("VR.G().en[0].hp");await cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
    chk('touch on a crawler at deck level aims at it and hits it',hp<999,hp)
    # bot: aim at the threat that will reach the airlock soonest (shots, flyers, crawlers, breacher), lead it, burst-fire under the heat limit
    BOT="""(()=>{const H=VR.G();H.p.hp=H.p.mhp;let f=0;while(f<60*400&&!H.won&&!H.dead){let best=null,bd=1e9;for(const e of H.en){const sp=Math.abs(e.vx||0)+1;const t=e.k==='crawler'?(Math.abs(e.x-TG.gx)-TG.door)/sp:e.k==='breacher'?0.8:Math.hypot(e.x-TG.gx,e.y-TG.gy)/50;if(t<bd){bd=t;best=e;}}for(const b of H.eb){const t=Math.hypot(b.x-TG.gx,b.y-TG.gy-10)/Math.hypot(b.vx,b.vy)-0.3;if(t<bd){bd=t;best=b;}}if(best)bd=Math.hypot(best.x-TG.gx,best.y-TG.gy);if(best){let vx=best.vx||0,vy=best.vy||0;if(best.k==='flyer'){const fa=Math.atan2(TG.gy-6-best.y,TG.gx-best.x);vx=Math.cos(fa)*best.v;vy=Math.sin(fa)*best.v;}let px=best.x,py=best.y;for(let k=0;k<3;k++){const lt=Math.hypot(px-TG.gx,py-TG.gy)/430;px=best.x+vx*lt;py=best.y+vy*lt;}H.ang=tClampAng(Math.atan2(py-TG.gy,px-TG.gx));}H.botHold=!!best&&H.heat<96;updTurret(1/60);f++;}return {won:H.won>0,dead:H.dead>0,rep:Math.round(H.rep),hp:H.p.hp,mhp:H.p.mhp,t:Math.round(H.t),boss:H.bossDone}})()"""
    await E("VR.god=false")
    for dfi,dn in [(0,'Easy'),(1,'Normal'),(2,'Hard')]:
      await E(f"VR.setS({{diff:{dfi},tdmg:0,tcool:0,ttwin:0}});VR.start({ti})");rs=[]
      for k in range(3):
        await E(f"VR.setS({{diff:{dfi},tdmg:0,tcool:0,ttwin:0}});VR.start({ti})");rs.append(await E(BOT))
      need={0:0.9,1:0.8,2:0.4}[dfi]
      chk(f'{dn}: bot with a stock gun holds the airlock 3/3 with >= {int(need*100)}% door left',all(r['won'] and not r['dead'] and r['boss'] and r['hp']>=need*r['mhp'] for r in rs),rs)
    await E("VR.setS({diff:1})");await b.close()
  print('BAD',bad);print('ERRORS',errs)
asyncio.run(main())
