# STEALTH (LISTENING POST): cones blocked by walls, shadows, noise, detection meter, alarm chase, caught=fail,
# terminal download + hatch exit, a cone-free route always exists, campaign flow, save remap, touch controls.
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
    # save remap from v5 (16 chapters): had just cleared RIFT APPROACH (index 11), so next was SPIRE LOCK
    await E("localStorage.setItem('voidrunner.save.v1',JSON.stringify({v:5,lvl:12,best:{11:{r:'S',s:5},12:{r:'A',s:6},3:{r:'B',s:1}}}));location.reload()");await pg.wait_for_timeout(800)
    sv=await E("JSON.parse(localStorage.getItem('voidrunner.save.v1'))");nm=await E("LV.map(L=>L.name)")
    chk('v5 save: next chapter is the new LISTENING POST',nm[sv['lvl']]=='LISTENING POST',sv['lvl'])
    chk('v5 save: ranks follow their chapters',{nm[int(k)]:v['r'] for k,v in sv['best'].items()}=={'RIFT APPROACH':'S','SPIRE LOCK':'A','CHART VAULT':'B'},sv['best'])
    si=await E("VR.ix('LISTENING POST')");chk('stealth sits after RIFT APPROACH, followed by RIFT CANYON (v8)',nm[si-1]=='RIFT APPROACH' and nm[si+1]=='RIFT CANYON' and await E(f"LV[{si}].t")=='stealth',si)
    await E("localStorage.clear();location.reload()");await pg.wait_for_timeout(700)
    # a cone-free route exists: for the shipped level on every difficulty, and the real game loop can walk it unseen
    for dfi,dn in enumerate(['Easy','Normal','Hard']):
      await E(f"VR.setS({{diff:{dfi}}});VR.god=false;VR.start({si})");await pg.wait_for_timeout(150)
      pl=await E("VR.st.plan()");chk(f'{dn}: planner finds a route that avoids every cone (with margin)',pl is not None and pl['ticks']>10,pl and pl['ticks'])
      pl0=await E("VR.st.plan({ex:0})");chk(f'{dn}: ...and without margin too',pl0 is not None)
      r=await E("VR.st.sim()");chk(f'{dn}: real update loop follows the route: never seen, codes, out the hatch',r['won'] and r['got'] and r['spotted']==0 and r['maxMeter']==0,r)
    ok=await E(f"(()=>{{let n=0;for(let s=0;s<20;s++)if(VR.st.build({si},5000+s*31).plan)n++;return n}})()");chk('most random layouts are solvable as built (the game retries until one is)',ok>=10,ok)
    chk('the game rebuilds until a route exists',await E("VR.G().plan!==null"))
    rs=await E("(()=>{const out=[];for(let dfi=0;dfi<3;dfi++){VR.setS({diff:dfi});for(let s=0;s<10;s++){const L=LV[VR.ix('LISTENING POST')];const H=sMake(L,L.d,7000+s*313);const pl=sPlan(H);if(!pl)continue;G=H;H.plan=pl;state='stealth';const r=VR.st.sim();out.push(r.won&&r.maxMeter===0&&r.spotted===0);}}state='title';VR.setS({diff:1});return out})()")
    chk('every solvable random layout, all difficulties: the real loop walks the planned route unseen',len(rs)>=15 and all(rs),len(rs),rs.count(False))
    tm=await E(f"(()=>{{const t=performance.now();VR.start({si});return performance.now()-t}})()");chk('building the level (with route check) is quick',tm<400,tm)
    # cones: walls block, open floor does not
    await E(f"VR.setS({{diff:1}});VR.start({si})");await pg.wait_for_timeout(200)
    r=await E("""(()=>{const H=VR.G(),g=H.g,EW=15,gd=H.guards[0];let blk=null,opn=null;
      for(let y=1;y<20&&(!blk||!opn);y++)for(let x=1;x<11;x++){const o=i=>!g[y*EW+x+i];if(!blk&&o(0)&&!o(1)&&o(2))blk=[x,y];if(!opn&&o(0)&&o(1)&&o(2)&&o(3))opn=[x,y];}
      const sv={x:gd.x,y:gd.y,ang:gd.ang,mode:gd.mode};gd.mode='pat';
      gd.x=blk[0];gd.y=blk[1];gd.ang=0;const a=VR.st.sees(0,blk[0]+2,blk[1]);gd.x=opn[0];gd.y=opn[1];const b=VR.st.sees(0,opn[0]+3,opn[1]);const c=VR.st.sees(0,opn[0]-0+0,opn[1]-3);
      gd.ang=Math.PI;const d=VR.st.sees(0,opn[0]+3,opn[1]);Object.assign(gd,sv);return [a,b>0,c,d]})()""")
    chk('wall between: not seen. open floor ahead: seen. behind the guard: not seen',r[0]==0 and r[1] and r[3]==0,r)
    await pg.screenshot(path='screenshots/v7_stealth.png')
    # detection meter fills in a cone, then the alarm, then guards chase; caught = fail
    async def into_cone(hide=False,move=False):
      return await E(f"""(()=>{{const H=VR.G();H.guards.forEach(q=>{{q.path=[{{x:q.x|0,y:q.y|0}}]}});const gd=H.guards[0];gd.path=[{{x:Math.round(gd.x),y:Math.round(gd.y)}}];gd.x=gd.path[0].x;gd.y=gd.path[0].y;
        for(const [dx,dy,a] of [[2,0,0],[-2,0,Math.PI],[0,2,Math.PI/2],[0,-2,-Math.PI/2]]){{const X=gd.x+dx,Y=gd.y+dy,M=gd.x+dx/2,N=gd.y+dy/2;if(X>0&&Y>0&&X<14&&Y<20&&!H.g[Y*15+X]&&!H.g[N*15+M]){{gd.ang0=a;gd.sw=-1;
          H.guards.forEach((q,i)=>{{if(i)q.path=[{{x:1,y:1}}];}});VR.st.place(X,Y);H.p.halt=1;H.shadow.fill(0);if({str(hide).lower()})H.shadow[Y*15+X]=1;return [X,Y];}}}}return null}})()""")
    await E(f"VR.start({si})");await pg.wait_for_timeout(200)
    # freeze the sweep so the guard stares at Mara
    await E("(()=>{const _sp=sPose;window._sp=_sp;sPose=function(gd,t){_sp(gd,t);if(gd.path.length<2&&gd.ang0!==undefined)gd.ang=gd.ang0;};})()")
    pos=await into_cone(hide=True);await pg.wait_for_timeout(1500)
    r=await E("[VR.G().meter,VR.G().hid,VR.G().alarm]");chk('standing still in a shadow inside a cone: hidden, meter stays at 0',pos and r[0]==0 and r[1] and r[2]==0,pos,r)
    await pg.screenshot(path='screenshots/v7_stealth_hidden.png')
    await E(f"VR.start({si})");await pg.wait_for_timeout(200);pos=await into_cone();await pg.wait_for_timeout(250)
    m1=await E("VR.G().meter");chk('in the open the meter climbs',0<m1<1,m1)
    await pg.wait_for_timeout(1200);r=await E("[VR.G().alarm>0,VR.G().spotted,VR.G().guards.every(q=>q.mode==='chase'),VR.score().dmg]")
    chk('meter full: alarm, every guard chases, counts as a hit for the rank',r==[True,1,True,1],r)
    await pg.screenshot(path='screenshots/v7_stealth_alarm.png')
    await pg.wait_for_timeout(2500);chk('caught during the alarm fails the mission',await E("VR.state()")=='over')
    await E("startLevel(curLvl)");await pg.wait_for_timeout(200);chk('retry restarts the post clean',await E("VR.state()")=='stealth' and await E("VR.G().meter")==0 and await E("VR.G().alarm")==0)
    await E("(sPose=window._sp,0)")
    # noise: running near a guard makes it investigate, walking does not
    await E(f"VR.start({si})");await pg.wait_for_timeout(200)
    r=await E("""(()=>{const H=VR.G(),gd=H.guards[0];const x=Math.round(gd.x),y=Math.round(gd.y);H.guards.forEach((q,i)=>{if(i){q.path=[{x:1,y:1}];q.x=1;q.y=1;}});
      VR.st.noise(x+1,y);const a=gd.mode;return a})()""");chk('a noise in range sends the guard to look',r=='inv',r)
    await E(f"VR.start({si})");await pg.wait_for_timeout(200)
    r=await E("""(()=>{const H=VR.G();let n=0;const _n=sNoise;sNoise=function(){n++;_n.apply(null,arguments);};H.run=false;H.p.want=null;VR.st.place(7,19);const od=EDIRS.find(d=>!H.g[(19+d[1])*15+7+d[0]]);H.p.dir=od;H.guards.forEach(q=>{q.path=[{x:1,y:1}];q.x=1;q.y=1;});for(let i=0;i<60;i++)updStealth(1/60);const walk=n;H.run=true;VR.st.place(7,19);H.p.dir=od;for(let i=0;i<60;i++)updStealth(1/60);sNoise=_n;return [walk,n-walk,H.p.spd]})()""")
    chk('walking is silent, running makes noise and is faster',r[0]==0 and r[1]>=1 and r[2]>3,r)
    # investigate -> look around -> back to patrol
    r=await E("""(()=>{const H=VR.G(),gd=H.guards[0];H.p.halt=1;VR.st.place(7,19);sGo(H,gd,'inv',[Math.round(gd.x),Math.round(gd.y)]);for(let i=0;i<60*8&&gd.mode!=='pat';i++){updStealth(1/60);if(H.alarm||H.dead)break;}return [gd.mode,H.alarm]})()""")
    chk('an investigating guard looks around then returns to its patrol',r[0]=='pat',r)
    # terminal download, hatch locked until then, ghost bonus + award
    await E(f"VR.start({si})");await pg.wait_for_timeout(200)
    await E("(()=>{const H=VR.G();H.guards.forEach(q=>{q.path=[{x:1,y:1}];});VR.st.place(7,1)})()");await pg.keyboard.press('ArrowUp');await pg.wait_for_timeout(500)
    chk('hatch is locked before the codes',await E("VR.state()")=='stealth' and await E("VR.ev.tile(VR.G().p)")==[7,1])
    await E("(()=>{const H=VR.G();VR.st.place(H.term[0],H.term[1]);})()");await pg.wait_for_timeout(1000)
    d1=await E("VR.G().dl");await pg.screenshot(path='screenshots/v7_stealth_download.png');await pg.wait_for_timeout(1500)
    chk('standing at the terminal downloads the codes in about 2s',0.3<d1<0.8 and await E("VR.G().got")==1 and await E("VR.G().unlocked"),d1)
    sc0=await E("VR.score().score");await E("VR.st.place(7,1)");await pg.keyboard.press('ArrowUp');await pg.wait_for_timeout(1500)
    chk('out the hatch clears the chapter',await E("VR.state()")=='clear');chk('ghost bonus scored',await E("FT.last.score")>=sc0+2000,sc0)
    chk('rank shown',await E("VR.last().rank") in list('SABC'));chk('ghost award',('ghost' in await E("VR.ach()")))
    # touch controls
    await E(f"VR.start({si})");await pg.wait_for_timeout(300)
    box=await pg.locator('canvas').bounding_box();X=lambda x:box['x']+x*box['width']/270;Y=lambda y:box['y']+y*box['height']/480
    await pg.touchscreen.tap(X(239),Y(413));await pg.wait_for_timeout(150);chk('RUN button toggles running',await E("VR.G().run")==True)
    await pg.touchscreen.tap(X(239),Y(413));await pg.wait_for_timeout(150);chk('...and back',await E("VR.G().run")==False)
    od=await E("(()=>{const H=VR.G();H.guards.forEach(q=>{q.path=[{x:1,y:1}];q.x=1;q.y=1;});return EDIRS.findIndex(d=>!H.g[(19+d[1])*15+7+d[0]])})()");key=['U','R','D','L'][od];bt=await E(f"EB.{key}")
    await pg.touchscreen.tap(X(bt[0]+bt[2]/2),Y(bt[1]+bt[3]/2));await pg.wait_for_timeout(500);chk('D-pad moves Mara',await E("VR.ev.tile(VR.G().p).join()")!='7,19',od)
    await pg.touchscreen.tap(X(31),Y(413));await pg.wait_for_timeout(700);chk('STOP halts her',await E("!VR.G().p.moving&&!VR.G().p.dir"))
    cdp=await pg.context.new_cdp_session(pg)
    async def swipe(x0,y0,x1,y1):
      await cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':X(x0),'y':Y(y0)}]})
      for i in range(1,6):await cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':X(x0+(x1-x0)*i/5),'y':Y(y0+(y1-y0)*i/5)}]});await pg.wait_for_timeout(16)
      await cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
    dv=[(0,-50),(50,0),(0,50),(-50,0)][od];await E("VR.st.place(7,19)");await swipe(135,250,135+dv[0],250+dv[1]);await pg.wait_for_timeout(400);chk('swipe walks',await E("VR.ev.tile(VR.G().p).join()")!='7,19')
    await pg.touchscreen.tap(X(135),Y(250));await pg.wait_for_timeout(600);chk('tap on the map stops',await E("!VR.G().p.moving"))
    ov=await E("(()=>{const B=[...Object.values(EB),...Object.values(SB),[244,2,22,18]];for(let i=0;i<B.length;i++)for(let j=i+1;j<B.length;j++){const a=B[i],b=B[j];if(a[0]<b[0]+b[2]&&b[0]<a[0]+a[2]&&a[1]<b[1]+b[3]&&b[1]<a[1]+a[3])return [a,b];}return null})()");chk('stealth buttons do not overlap',ov is None,ov)
    # keyboard
    await E("VR.st.place(7,19)");await pg.keyboard.press(['ArrowUp','ArrowRight','ArrowDown','ArrowLeft'][od]);await pg.wait_for_timeout(300);await pg.keyboard.press('Space');await pg.wait_for_timeout(500);chk('keys: arrow moves, Space stops',await E("!VR.G().p.moving") and await E("VR.ev.tile(VR.G().p).join()")!='7,19')
    await pg.keyboard.press('Escape');chk('Escape pauses',await E("VR.state()")=='pause');await pg.keyboard.press('Escape');chk('and resumes',await E("VR.state()")=='stealth')
    # difficulty
    v=[]
    for dfi in range(3):await E(f"VR.setS({{diff:{dfi}}});VR.start({si})");v.append(await E("[VR.G().guards[0].v,sDK()]"))
    chk('Hard: faster patrols and quicker detection, Easy the reverse',v[0][0]<v[1][0]<v[2][0] and v[0][1]<v[1][1]<v[2][1],v)
    await E("VR.setS({diff:1})")
    # daily pool includes it
    chk('daily challenge can pick the post',await E(f"(()=>{{for(let i=0;i<800;i++){{const d=new Date(2026,0,1+i),s=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');if(VR.dailyLv(s)==={si})return true}}return false}})()"))
    # campaign flow: hangar -> launch -> story -> stealth -> clear -> hangar shows RIFT CANYON
    await E(f"localStorage.clear();VR.S().lvl={si};VR.S().cr=0;VR.shop()");await pg.wait_for_timeout(200)
    await pg.touchscreen.tap(X(135),Y(368));await pg.wait_for_timeout(200);s1=await E('VR.state()');await pg.touchscreen.tap(X(135),Y(300));await pg.wait_for_timeout(100);await pg.touchscreen.tap(X(135),Y(300));await pg.wait_for_timeout(300)
    s2=await E('VR.state()');await E("VR.kill()");await pg.wait_for_timeout(1500);s3=await E('VR.state()');await pg.wait_for_timeout(500);await pg.touchscreen.tap(X(135),Y(300));await pg.wait_for_timeout(300)
    s4=await E('VR.state()');lv=await E('VR.S().lvl')
    chk('campaign flow through the post',[s1,s2,s3,s4]==['story','stealth','clear','shop'] and nm[lv]=='RIFT CANYON',[s1,s2,s3,s4,lv])
    await b.close()
  print('BAD',bad);print('ERRORS',errs)
asyncio.run(main())
