# MELEE DUEL (SPIRE CORE): chapter slot + save v8->v9 remap, story text, tuning order, tell lengths, touch + keyboard controls
# (per-touch ids, event-time presses), parry / block / dodge / feint / red unblockable / heavy finisher / poise stun,
# rounds + checkpoint, win/fail, awards, autopilot fairness on Easy/Normal/Hard, daily, campaign flow, screenshots.
import asyncio,pathlib,re,json
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
    # --- save remap v8 -> v9: had just cleared HIVE SPIRE (v8 index 17), next was THE VOID HEART (18)
    await E("localStorage.setItem('voidrunner.save.v1',JSON.stringify({v:8,lvl:18,best:{17:{r:'S',s:5},18:{r:'A',s:6},14:{r:'B',s:7}}}));location.reload()");await pg.wait_for_timeout(800)
    sv=await E("JSON.parse(localStorage.getItem('voidrunner.save.v1'))");nm=await E("LV.map(L=>L.name)")
    chk('v8 save: next chapter is the new SPIRE CORE',nm[sv['lvl']]=='SPIRE CORE' and sv['v']==9,sv)
    chk('v8 save: ranks follow their chapters',{nm[int(k)]:v['r'] for k,v in sv['best'].items()}=={'HIVE SPIRE':'S','THE VOID HEART':'A','RIFT CANYON':'B'},sv['best'])
    await E("localStorage.setItem('voidrunner.save.v1',JSON.stringify({v:8,lvl:19,done:1,best:{}}));location.reload()");await pg.wait_for_timeout(800)
    sv=await E("JSON.parse(localStorage.getItem('voidrunner.save.v1'))");chk('finished v8 save keeps every chapter open',sv['lvl']==20,sv)
    await E("localStorage.setItem('voidrunner.save.v1',JSON.stringify({v:7,lvl:14,best:{}}));location.reload()");await pg.wait_for_timeout(800)
    sv=await E("JSON.parse(localStorage.getItem('voidrunner.save.v1'))");chk('v7 save goes through both remaps (next is still RIFT CANYON)',nm[sv['lvl']]=='RIFT CANYON' and sv['v']==9,sv)
    ci=await E("VR.ix('SPIRE CORE')");chk('duel chapter sits between HIVE SPIRE and THE VOID HEART',nm[ci-1]=='HIVE SPIRE' and nm[ci+1]=='THE VOID HEART' and await E(f"LV[{ci}].t")=='duel',ci)
    chk('20 chapters, final chapter still last',len(nm)==20 and await E("LV[LV.length-1].final===1"),len(nm))
    st=await E(f"LV[{ci}].story");chk('story: short, human (no em dashes, no "not X but Y", no "not because")',all(('\u2014' not in l) and ('\u2013' not in l) and not re.search(r"\bnot\b[^.]*\bbut\b",l,re.I) and 'not because' not in l.lower() and len(l)<110 for l in st) and 4<=len(st)<=8,st)
    chk('story uses the cast (Mara, Ott, Fenn, the Voice)',{l.split(':')[0] for l in st}>={'MARA','OTT','FENN','VOICE'})
    await E("localStorage.clear();location.reload()");await pg.wait_for_timeout(700)
    box=await pg.locator('canvas').bounding_box();X=lambda x:box['x']+x*box['width']/270;Y=lambda y:box['y']+y*box['height']/480
    cdp=await pg.context.new_cdp_session(pg)
    async def touch(kind,pts):await cdp.send('Input.dispatchTouchEvent',{'type':kind,'touchPoints':[{'x':X(x),'y':Y(y),'id':i} for i,(x,y) in pts]})
    await E(f"goStory({ci})");await pg.wait_for_timeout(1200);await pg.touchscreen.tap(X(135),Y(250));await pg.wait_for_timeout(400);chk('tap shows the whole story without starting',await E('VR.state()')=='story');await pg.screenshot(path='screenshots/v9_duel_story.png')
    # --- tuning
    dt=await E("VR.du.DT()")
    chk('tuning order: parry window Easy > Normal > Hard, Normal >= 200 ms',dt[0]['parry']>dt[1]['parry']>dt[2]['parry'] and dt[1]['parry']>=0.2,[d['parry'] for d in dt])
    chk('tuning order: tells longest on Easy, champion hull and pace grow on Hard',dt[0]['tell']>dt[1]['tell']>dt[2]['tell'] and dt[0]['hp']<dt[1]['hp']<dt[2]['hp'] and dt[0]['gap']>dt[1]['gap']>dt[2]['gap'] and dt[0]['punish']>dt[1]['punish']>dt[2]['punish'],dt)
    # every tell on every difficulty and round is long enough to react to (>= 0.3 s; >= 0.45 s on Normal; >= 0.6 s on Easy)
    tl=await E(f"""(()=>{{const o={{}};for(const di of [0,1,2]){{VR.setS({{diff:di}});VR.start({ci});let mn=9,red=9;for(const ph of [0,1,2]){{VR.du.H().C.ph=ph;for(const k of ['slash','thrust','combo','feint','red']){{const m=VR.du.move(k);for(const s of m.strikes){{mn=Math.min(mn,s.at-s.tellAt);if(s.red)red=Math.min(red,s.at-s.tellAt);}}}}}}o[di]=[Math.round(mn*1000),Math.round(red*1000)];}}return o}})()""")
    chk('shortest tell: Easy >= 600 ms, Normal >= 450 ms, Hard >= 300 ms; red tells longest',tl['0'][0]>=600 and tl['1'][0]>=450 and tl['2'][0]>=300 and all(tl[k][1]>=tl[k][0] for k in tl),tl)
    # --- controls (touch)
    await E(f"VR.setS({{diff:1}});VR.god=true;VR.start({ci})");await pg.wait_for_timeout(300);chk('starts in duel mode',await E("VR.state()")=='duel')
    B=await E("VR.du.DU().B");c=lambda k:(B[k][0]+B[k][2]/2,B[k][1]+B[k][3]/2)
    chk('buttons sit in the bottom panel and do not overlap',all(B[k][1]>=352 and B[k][1]+B[k][3]<=478 for k in B) and B['D'][1]+B['D'][3]<B['P'][1] and B['A'][0]+B['A'][2]<B['P'][0],B)
    await E("(()=>{const H=VR.du.H();H.C.gapT=99;H.C.x=230;H.P.x=80;})()")
    x0=await E("VR.du.H().P.x");await touch('touchStart',[(0,c('R'))]);await pg.wait_for_timeout(400);x1=await E("VR.du.H().P.x");chk('hold > walks right',x1>x0+15,x0,x1)
    await touch('touchMove',[(0,c('L'))]);await pg.wait_for_timeout(400);x2=await E("VR.du.H().P.x");chk('slide to < walks left',x2<x1-15,x1,x2)
    await touch('touchMove',[(0,c('L')),(1,c('A'))]);await pg.wait_for_timeout(40);r=await E("VR.du.H().P.st");chk('second finger on ATTACK swings while the first holds a direction',r=='atk',r)
    await touch('touchEnd',[(0,c('L'))]);await pg.wait_for_timeout(400);await touch('touchEnd',[]);await pg.wait_for_timeout(300)
    await touch('touchStart',[(0,c('P'))]);await pg.wait_for_timeout(30);r=await E("[VR.du.H().P.pOK,VR.du.H().P.st]");chk('tap PARRY opens the parry window',r[0]==1 and r[1]=='block',r)
    await pg.wait_for_timeout(450);r=await E("[VR.du.H().P.pOK,VR.du.H().P.st]");chk('keep holding PARRY: window closes, Mara keeps blocking',r[0]==0 and r[1]=='block',r)
    await touch('touchEnd',[]);await pg.wait_for_timeout(100);r=await E("VR.du.H().P.st");chk('let go: back to idle',r=='idle',r)
    await touch('touchStart',[(0,c('L')),(1,c('P'))]);await pg.wait_for_timeout(300);xa=await E("VR.du.H().P.x");await pg.wait_for_timeout(300);xb=await E("VR.du.H().P.x");r=await E("VR.du.H().P.st");await touch('touchEnd',[])
    chk('blocking with a direction held stands still',r=='block' and abs(xb-xa)<1,r,xa,xb)
    await pg.wait_for_timeout(300);x0=await E("VR.du.H().P.x");await touch('touchStart',[(0,c('D'))]);await pg.wait_for_timeout(30);r=await E("VR.du.H().P.st");await touch('touchEnd',[]);await pg.wait_for_timeout(500);x1=await E("VR.du.H().P.x")
    chk('DODGE rolls away from the champion',r=='dodge' and x1<x0-40,r,x0,x1)
    # event-time presses: a tap stamped when it arrived counts with that time even if the next frame is late
    r=await E("(()=>{const H=VR.du.H();H.q.length=0;VR.du.press('P');const e=H.q[0];e.tr-=0.05;VR.du.step(1,1/60);return [H.P.pOK,Math.round((H.t-H.P.pAt)*1000)]})()")
    chk('a press 50 ms before the frame is dated 50 ms back',r[0]==1 and 45<=r[1]<=65,r)
    # --- keyboard
    await E(f"VR.start({ci});VR.du.H().C.gapT=99;VR.du.H().C.x=230;VR.du.H().P.x=120");await pg.wait_for_timeout(100)
    a0=await E("VR.du.H().P.x");await pg.keyboard.down('ArrowLeft');await pg.wait_for_timeout(300);await pg.keyboard.up('ArrowLeft');a1=await E("VR.du.H().P.x")
    await pg.keyboard.down('ArrowRight');await pg.wait_for_timeout(300);await pg.keyboard.up('ArrowRight');a2=await E("VR.du.H().P.x");chk('arrow keys walk both ways',a1<a0-12 and a2>a1+12,a0,a1,a2)
    await pg.keyboard.press('KeyJ');await pg.wait_for_timeout(30);r1=await E("VR.du.H().P.st");await pg.wait_for_timeout(400)
    await pg.keyboard.down('KeyK');await pg.wait_for_timeout(30);r2=await E("[VR.du.H().P.st,VR.du.H().P.pOK]");await pg.wait_for_timeout(400);r3=await E("VR.du.H().P.st");await pg.keyboard.up('KeyK');await pg.wait_for_timeout(100)
    await pg.keyboard.press('KeyL');await pg.wait_for_timeout(30);r4=await E("VR.du.H().P.st")
    chk('J attacks, K taps parry and holds block, L dodges',r1=='atk' and r2==['block',1] and r3=='block' and r4=='dodge',r1,r2,r3,r4)
    await pg.wait_for_timeout(500)
    # --- mechanics, stepped headless at 60 fps
    await E("VR.god=false")
    setup="""const H=VR.du.H();H.p.inv=0;H.p.hp=H.p.mhp;H.q.length=0;H.P.st='idle';H.P.pOK=0;H.P.pcd=0;H.P.kbv=0;H.P.x=120;H.C.x=170;H.C.st='idle';H.C.poise=100;H.C.gapT=99;H.auto=1;H.binp={mx:0,block:false};H.bot={rt:99,jit:0,fool:0,hold:0,aggr:0};"""
    stepTo="""const go=(tt)=>{let g=0;while(H.C.mv&&H.C.mv.t<tt&&g++<600)VR.du.step(1,1/60);};"""
    # parry 100 ms before the blow on Normal
    r=await E(f"""(()=>{{{setup}{stepTo}const m=VR.du.move('slash'),at=m.strikes[0].at;go(at-0.1);H.q.push({{k:'P',t:H.t}});const h=H.p.hp,po=H.C.poise;let g=0;while(H.C.st==='atk'&&g++<60)VR.du.step(1,1/60);return [H.C.st,H.p.hp===h,po-H.C.poise,H.parN]}})()""")
    chk('parry just before the blow: champion staggers, no damage, poise drops',r[0]=='stag' and r[1] and r[2]>=20 and r[3]==1,r)
    await pg.wait_for_timeout(60);await pg.screenshot(path='screenshots/v9_duel_parry.png')
    r=await E(f"""(()=>{{let g=0;const H=VR.du.H();H.P.x=H.C.x-40;H.P.face=1;H.q.push({{k:'A',t:H.t}});const hp=H.C.hp;VR.du.step(1,1/60);const s=H.P.st;while(H.P.st==='heavy'&&g++<60)VR.du.step(1,1/60);return [s,Math.round((hp-H.C.hp)*100)/100,H.heavyN]}})()""")
    chk('ATTACK during the stagger lands the heavy finisher (3.5 damage)',r[0]=='heavy' and r[1]>=3.5 and r[2]==1,r)
    # parry pressed far too early: window has closed, tap released -> hit
    r=await E(f"""(()=>{{{setup}{stepTo}const m=VR.du.move('slash'),at=m.strikes[0].at;go(at-0.45);H.q.push({{k:'P',t:H.t}});const h=H.p.hp;let g=0;while(H.C.st==='atk'&&g++<120)VR.du.step(1,1/60);return [H.C.st,h-H.p.hp,H.hitN]}})()""")
    chk('parry tapped way too early (and released) still gets hit',r[1]>=1 and r[2]==1,r)
    # holding block uses the real input path, so drive it through G.inp each step
    r=await E(f"""(()=>{{{setup}H.auto=0;H.C.ph=1;VR.du.move('combo');const mv=H.C.mv,h=H.p.hp,b0=H.blkN;let g=0;while(H.C.st==='atk'&&g++<400){{keys.KeyK=true;VR.du.step(1,1/60);}}keys.KeyK=false;H.C.ph=0;return [h-H.p.hp,H.blkN-b0,mv.strikes.map(s=>s.res)]}})()""")
    chk('holding block soaks a whole 3-hit combo with no damage',r[0]==0 and r[1]>=1 and all(x in ('block','miss') for x in r[2]) and len(r[2])==3,r)
    r=await E(f"""(()=>{{{setup}H.auto=0;H.C.x=160;const m=VR.du.move('red');const h=H.p.hp;let g=0;while(H.C.st==='atk'&&g++<400){{keys.KeyK=true;VR.du.step(1,1/60);}}keys.KeyK=false;return [h-H.p.hp,m.strikes[0].red]}})()""")
    chk('the red attack goes through a block',r[0]>=1 and r[1]==1,r)
    r=await E(f"""(()=>{{{setup}{stepTo}H.C.x=160;const m=VR.du.move('red'),at=m.strikes[0].at;go(at-0.1);H.q.push({{k:'D',t:H.t}});const h=H.p.hp;let g=0;while(H.C.st==='atk'&&g++<200)VR.du.step(1,1/60);return [h-H.p.hp,H.pdN,H.C.st,H.C.recT]}})()""")
    chk('dodging the red attack: no damage, counts as a dodge, long opening after',r[0]==0 and r[1]==1 and r[2]=='recover' and r[3]>=0.8,r)
    r=await E(f"""(()=>{{{setup}{stepTo}H.P.x=40;H.C.x=200;VR.du.move('red');const mv=H.C.mv,h=H.p.hp;let g=0;while(H.C.st==='atk'&&g++<200)VR.du.step(1,1/60);return [h-H.p.hp,mv.strikes[0].res]}})()""")
    chk('or just be out of reach',r[0]==0 and r[1]=='miss',r)
    # feint: a tap timed to the fake whiffs; still holding turns into a block for the real blow
    r=await E(f"""(()=>{{{setup}H.auto=0;const m=VR.du.move('feint'),f=m.fakes[0].at;let g=0;while(H.C.mv.t<f-0.08&&g++<200)VR.du.step(1,1/60);VR.du.press('P');H.q[H.q.length-1].tr=0;const h=H.p.hp,p0=H.parN,b0=H.blkN;g=0;while(H.C.st==='atk'&&g++<300){{keys.KeyK=true;VR.du.step(1,1/60);}}keys.KeyK=false;return [h-H.p.hp,H.parN-p0,H.blkN-b0]}})()""")
    chk('feint: parry at the fake whiffs, holding on blocks the real swing',r[0]==0 and r[1]==0 and r[2]==1,r)
    r=await E(f"""(()=>{{{setup}H.auto=0;const m=VR.du.move('feint'),f=m.fakes[0].at;let g=0;while(H.C.mv.t<f-0.08&&g++<200)VR.du.step(1,1/60);VR.du.press('P');H.q[H.q.length-1].tr=0;const h=H.p.hp,p0=H.parN;g=0;while(H.C.st==='atk'&&g++<300)VR.du.step(1,1/60);return [h-H.p.hp,H.parN-p0]}})()""")
    chk('feint: tap and let go at the fake, the real swing lands',r[0]>=1 and r[1]==0,r)
    # guard: the champion sometimes blocks pokes when it is idle; always open while staggered, stunned or recovering
    r=await E(f"""(()=>{{{setup}let gd=0;for(let k=0;k<40;k++){{H.C.st='idle';H.C.mv=null;H.C.gapT=99;H.C.hp=H.C.mhp;H.P.x=H.C.x-36;H.P.face=1;H.P.st='idle';H.q.push({{k:'A',t:H.t}});const h=H.C.hp;for(let i=0;i<12;i++)VR.du.step(1,1/60);if(H.C.hp===h)gd++;}}
      let open=0;for(const s of ['stag','stun','recover']){{H.C.st=s;H.C.t=0;H.C.recT=9;H.P.x=H.C.x-36;H.P.st='idle';H.q.push({{k:'A',t:H.t}});const h=H.C.hp;for(let i=0;i<12;i++)VR.du.step(1,1/60);if(H.C.hp<h)open++;}}return [gd,open]}})()""")
    chk('idle champion guards some pokes (round 1, Normal ~30%), always takes hits when open',5<=r[0]<=20 and r[1]==3,r)
    r=await E(f"""(()=>{{{setup}H.C.st='stag';H.C.t=0;H.C.poise=20;H.P.x=H.C.x-40;H.P.face=1;const b0=H.brkN;H.q.push({{k:'A',t:H.t}});for(let i=0;i<40;i++)VR.du.step(1,1/60);return [H.C.st,H.brkN-b0]}})()""")
    chk('poise at zero breaks into a stun',r[0]=='stun' and r[1]==1,r)
    # rounds + checkpoint
    r=await E(f"""(()=>{{{setup}H.C.st='recover';H.C.recT=9;H.C.hp=H.C.mhp*2/3+0.5;H.P.x=H.C.x-36;H.P.face=1;H.q.push({{k:'A',t:H.t}});for(let i=0;i<20;i++)VR.du.step(1,1/60);return [H.C.ph,H.C.st,VR.du.ck()]}})()""")
    chk('crossing 2/3 hull starts round 2 and saves a checkpoint',r[0]==1 and r[1]=='roar' and r[2] and r[2]['ph']==1,r)
    await E("(()=>{const H=VR.du.H();H.p.inv=0;H.p.hp=1;hurt();})()");await pg.wait_for_timeout(1800);chk('suit at 0 fails the chapter',await E("VR.state()")=='over')
    await pg.wait_for_timeout(200);await pg.screenshot(path='.tmp/duel_over.png')
    await E("startLevel(curLvl)");await pg.wait_for_timeout(200);r=await E("[VR.state(),VR.du.H().C.ph,Math.round(VR.du.H().C.hp/VR.du.H().C.mhp*100),VR.du.H().p.hp,VR.du.H().p.mhp]")
    chk('retry starts at round 2 with the champion at 2/3 and most of the suit back',r[0]=='duel' and r[1]==1 and r[2]==67 and r[3]>=0.75*r[4],r)
    await E(f"goStory({ci})");chk('going back through the story clears the checkpoint',await E("VR.du.ck()") is None)
    await E(f"VR.start({ci})");chk('fresh start is round 1',await E("VR.du.H().C.ph")==0)
    await pg.keyboard.press('Escape');chk('Escape pauses',await E("VR.state()")=='pause');await pg.keyboard.press('Escape')
    await pg.touchscreen.tap(X(255),Y(11));await pg.wait_for_timeout(200);chk('pause button pauses',await E("VR.state()")=='pause');await pg.keyboard.press('Escape')
    # gameplay screenshot with the autopilot fighting, and one on a red tell
    await E(f"VR.god=true;VR.start({ci});(()=>{{const H=VR.du.H();H.auto=1;H.bot={{rt:0.3,jit:0.03,fool:0,hold:0.3,aggr:0.6}};H.binp={{mx:0,block:false}};}})()");await pg.wait_for_timeout(6200);await pg.screenshot(path='screenshots/v9_duel.png')
    await E("(()=>{const H=VR.du.H();H.auto=0;H.P.x=110;H.P.st='idle';H.C.x=165;H.C.ph=2;VR.du.move('red');})()");await pg.wait_for_timeout(330);await pg.screenshot(path='screenshots/v9_duel_red.png')
    # --- win, ranks, awards
    await E(f"VR.god=false;VR.start({ci})");await pg.wait_for_timeout(200);await E("VR.kill()");await pg.wait_for_timeout(3300)
    chk('champion down clears the chapter',await E("VR.state()")=='clear',await E("VR.state()"))
    l=await E("VR.last()");chk('rank + duel par time',l['rank'] in list('SABC') and l['par']==await E("Math.round(VR.du.DT()[1].hp*0.9+30)"),l)
    ach=await E("VR.ach()");chk('BATON BEATS BLADE + FLAWLESS awards',('duel' in ach) and ('duelclean' in ach),list(ach.keys())[-4:])
    r=await E(f"""(()=>{{VR.start({ci});{setup}for(let k=0;k<10;k++){{H.C.st='idle';H.C.ph=0;H.C.hp=H.C.mhp;const m=VR.du.move('slash'),at=m.strikes[0].at;let g=0;while(H.C.mv&&H.C.mv.t<at-0.08&&g++<300)VR.du.step(1,1/60);H.q.push({{k:'P',t:H.t}});g=0;while(H.C.st==='atk'&&g++<60)VR.du.step(1,1/60);H.P.pcd=0;H.P.st='idle';}}return [H.parN,!!VR.ach().parry10]}})()""")
    chk('IRON WRIST after 10 parries in one duel',r[0]==10 and r[1],r)
    # --- autopilot fairness. Bots react to each tell after rt seconds and press with gaussian timing error jit;
    # "fool" is the chance of biting on a feint. good: 300 ms / 40 ms, average: 350 ms / 70 ms, sloppy: 400 ms / 100 ms.
    await E("VR.god=false")
    prof={'good':{'rt':0.3,'jit':0.04,'fool':0.5},'average':{'rt':0.35,'jit':0.07,'fool':0.7},'sloppy':{'rt':0.4,'jit':0.1,'fool':0.8,'aggr':1.2},'masher':{'rt':99,'jit':0,'fool':0,'aggr':4,'hold':0}}
    res={}
    for dfi in range(3):
      for pn,pv in prof.items():
        n=4 if pn=='masher' else 8
        res[(dfi,pn)]=await E(f"(()=>{{const o=[];for(let k=0;k<{n};k++){{VR.setS({{diff:{dfi}}});VR.du.ck&&(FT.duelCk=null);VR.start({ci});o.push(VR.du.sim(400,{json.dumps(pv)}));}}return o}})()")
    def summ(rs):return [(('W' if r['won'] else 'DEAD' if r['dead'] else 'T/O'),r['t'],str(r['hp'])+'/'+str(r['mhp']),'p'+str(r['par'])) for r in rs]
    W=lambda k:sum(r['won'] for r in res[k])
    for dfi,dn in [(0,'Easy'),(1,'Normal'),(2,'Hard')]:
      for pn in prof:print(dn,pn,W((dfi,pn)),'/',len(res[(dfi,pn)]),summ(res[(dfi,pn)]))
    chk('Easy: good, average and sloppy bots all win 8/8',all(W((0,pn))==8 for pn in ('good','average','sloppy')))
    chk('Normal: good and average bots win 8/8, sloppy at least 7/8',W((1,'good'))==8 and W((1,'average'))==8 and W((1,'sloppy'))>=7)
    chk('Hard: good bot wins at least 7/8 on the first try',W((2,'good'))>=7)
    # with checkpoints: retry from the saved round like a player would, up to 3 tries
    tries=await E(f"(()=>{{const o=[];for(let k=0;k<8;k++){{VR.setS({{diff:2}});FT.duelCk=null;let n=0,w=false;while(n<3&&!w){{n++;VR.start({ci});w=VR.du.sim(400,{json.dumps(prof['average'])}).won;}}o.push(w?n:0);}}return o}})()")
    print('Hard average bot, tries needed with checkpoints (0 = lost 3 times):',tries)
    chk('Hard: average bot beats it within 3 tries (checkpoints on) in at least 7/8 runs',sum(1 for t in tries if t)>=7,tries)
    chk('Normal: a pure button masher (never parries, blocks or dodges) loses most fights',W((1,'masher'))<=1,summ(res[(1,'masher')]))
    chk('fights take a sensible time on Normal (25-120 s for the average bot)',all(25<=r['t']<=120 for r in res[(1,'average')] if r['won']),[r['t'] for r in res[(1,'average')]])
    # score ratio for ranking: an average Normal win should land around the A/S line
    r=await E(f"(()=>{{VR.setS({{diff:1}});FT.duelCk=null;VR.start({ci});const o=VR.du.sim(400,{json.dumps(prof['average'])});const s=VR.score();return [o.won,s.score,s.pot,Math.round(s.score/s.pot*100)/100]}})()")
    print('score ratio (average bot, Normal):',r)
    chk('score potential is sane (average Normal win lands a ratio between 0.8 and 2)',0.8<=r[3]<=2,r)
    # clear screen after a real (autopilot) fight on Normal
    await E(f"VR.setS({{diff:1}});FT.duelCk=null;VR.start({ci})");r=await E(f"VR.du.sim(400,{json.dumps(prof['good'])})");await pg.wait_for_timeout(3300)
    chk('autopilot win reaches the clear screen',r['won'] and await E("VR.state()")=='clear',r);await pg.wait_for_timeout(2600);await pg.screenshot(path='screenshots/v9_duel_clear.png');print('clear (good bot, Normal):',await E("VR.last()"))
    await E("VR.setS({diff:1})")
    chk('daily challenge can pick the duel',await E(f"(()=>{{for(let i=0;i<900;i++){{const d=new Date(2026,0,1+i),s=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');if(VR.dailyLv(s)==={ci})return true}}return false}})()"))
    # --- campaign flow: story -> duel -> clear -> shop, next is THE VOID HEART
    await E(f"localStorage.clear();VR.S().lvl={ci};VR.S().cr=0;VR.ott.tab(0);VR.shop()");await pg.wait_for_timeout(200)
    await pg.touchscreen.tap(X(135),Y(368));await pg.wait_for_timeout(200);s1=await E('VR.state()');await pg.touchscreen.tap(X(135),Y(300));await pg.wait_for_timeout(100);await pg.touchscreen.tap(X(135),Y(300));await pg.wait_for_timeout(300)
    s2=await E('VR.state()');await E("VR.god=true;VR.kill()");await pg.wait_for_timeout(3300);s3=await E('VR.state()');await pg.wait_for_timeout(500);await pg.touchscreen.tap(X(135),Y(300));await pg.wait_for_timeout(300)
    s4=await E('VR.state()');lv=await E('VR.S().lvl')
    chk('campaign flow through the duel',[s1,s2,s3,s4]==['story','duel','clear','shop'] and nm[lv]=='THE VOID HEART',[s1,s2,s3,s4,lv])
    await b.close()
  print('BAD',bad);print('ERRORS',errs)
asyncio.run(main())
