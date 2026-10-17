# SURVEY DOCK easing (v9): per-difficulty tuning order, low-skill bot fairness, an idle bot still loses, Breacher checkpoint.
import asyncio,pathlib,json
from playwright.async_api import async_playwright
BOTJS=(pathlib.Path(__file__).parent/'turret_bots.js').read_text()
P={'good':dict(turn=6,re=0.1,err=0.0,lead=1,smart=1,shots=1,heat=94),
 'average':dict(turn=2.4,re=0.3,err=0.06,lead=0,smart=1,shots=1,heat=90),
 # sloppy: turns at half the arrow-key rate, re-picks a target every 0.6 s, aims ~0.15 rad off, picks the nearest enemy, ignores shots, never minds the heat
 'sloppy':dict(turn=1.2,re=0.6,err=0.15,lead=0,smart=0,shots=0,heat=0),
 'idle':dict(idle=1)}
async def main():
  bad=[];errs=[]
  def chk(n,ok,*a):
    print(n,ok,*a)
    if not ok:bad.append((n,)+a)
  async with async_playwright() as p:
    b=await p.chromium.launch();pg=await (await b.new_context(**p.devices['Pixel 7'])).new_page()
    pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:m.type=='error' and errs.append(m.text))
    await pg.goto('file://'+str(pathlib.Path(__file__).parent.resolve()/'dist/index.html'));await pg.wait_for_timeout(500)
    E=pg.evaluate;ti=await E("VR.ix('SURVEY DOCK')");await E("VR.god=false")
    te=await E("VR.tu.TE()")
    chk('easing order: Easy gets the most door, patch, assist and spacing, Hard the least',te[0]['door']>te[1]['door']>te[2]['door'] and te[0]['patch']>te[1]['patch']>=te[2]['patch'] and te[0]['assist']>te[1]['assist']>te[2]['assist'] and te[0]['cnt']<te[1]['cnt']<=te[2]['cnt'] and te[0]['shotT']>te[1]['shotT']>=te[2]['shotT'],te)
    hp=[];nd=[]
    for d in range(3):
      await E(f"VR.setS({{diff:{d}}});FT.turCk=null;VR.start({ti})");hp.append(await E("VR.G().p.mhp"));nd.append(await E("VR.G().need"))
    chk('door hull 40 / 36 / 32 and repair time 65 / 68 / 76 s',hp==[40,36,32] and nd==[65,68,76],hp,nd)
    res={}
    for d in range(3):
      for k,v in P.items():
        res[(d,k)]=await E(f"({BOTJS})({json.dumps(v)},{4 if k=='idle' else 8},{ti},{d})")
        rs=res[(d,k)];print(['Easy','Normal','Hard'][d],k,sum(r['won'] for r in rs),'/',len(rs),[f"{r['hp']}/{r['mhp']}" if r['won'] else 'X%d'%r['rep'] for r in rs])
    W=lambda d,k:sum(r['won'] for r in res[(d,k)])
    chk('Easy: good, average and sloppy bots all hold 8/8',all(W(0,k)==8 for k in ('good','average','sloppy')))
    chk('Normal: good and average hold 8/8, the sloppy bot at least 7/8',W(1,'good')==8 and W(1,'average')==8 and W(1,'sloppy')>=7)
    chk('Normal: sloppy wins keep at least a third of the door',all(r['hp']>=r['mhp']/3 for r in res[(1,'sloppy')] if r['won']))
    # Hard with the Breacher checkpoint: retry like a player would, up to 3 tries
    tr=[]
    for k in range(6):
      await E("FT.turCk=null");n=0;w=False
      while n<3 and not w:
        n+=1;w=(await E(f"({BOTJS})({json.dumps(dict(P['good'],keepCk=1))},1,{ti},2)"))[0]['won']
      tr.append(n if w else 0)
    print('INFO Hard good bot, tries needed with the checkpoint (0 = lost 3 times):',tr)
    # info only: Hard is meant to stay hard; the expert bot in test_v7_turret_aim must still hold it
    chk('an idle bot that never fires loses on every difficulty',all(W(d,'idle')==0 for d in range(3)))
    # checkpoint at the Breacher
    await E(f"VR.setS({{diff:1}});FT.turCk=null;VR.start({ti})");await E("(()=>{const H=VR.G();H.rep=69.9;for(let i=0;i<5;i++)updTurret(1/60);})()")
    ck=await E("VR.tu.ck()");chk('the Breacher arriving saves a checkpoint',ck and ck['rep']==66,ck)
    await E("(()=>{const H=VR.G();H.p.inv=0;H.p.hp=1;hurt();})()");await pg.wait_for_timeout(1800);chk('door at 0 fails',await E("VR.state()")=='over')
    await pg.wait_for_timeout(300);await pg.screenshot(path='.tmp/turret_over.png')
    await E("startLevel(curLvl)");await pg.wait_for_timeout(200);r=await E("[VR.state(),Math.round(VR.G().rep),VR.G().p.hp,VR.G().p.mhp]")
    chk('retry starts just before the Breacher with a full door',r[0]=='turret' and r[1]>=66 and r[2]==r[3],r)
    await E(f"goStory({ti})");chk('going back through the story clears the checkpoint',await E("VR.tu.ck()") is None)
    await E(f"VR.start({ti})");chk('fresh start from 0',await E("Math.round(VR.G().rep)")<=1)
    # screenshot: Normal, mid-fight
    await E(f"VR.setS({{diff:1}});VR.start({ti});(()=>{{const H=VR.G();for(let i=0;i<60*24;i++){{let best=null,bd=1e9;for(const e of H.en){{const dd=Math.hypot(e.x-TG.gx,e.y-TG.gy);if(dd<bd){{bd=dd;best=e;}}}}if(best)H.ang=tClampAng(Math.atan2(best.y-TG.gy,best.x-TG.gx));H.botHold=!!best&&H.heat<90;updTurret(1/60);}}H.botHold=true;FT.toasts.length=0;VR.tu.spawn('crawler',1);VR.tu.spawn('crawler',-1);VR.tu.spawn('flyer');}})()");await pg.wait_for_timeout(1500)
    await pg.screenshot(path='screenshots/v9_turret_eased.png');await E("VR.G().botHold=false")
    await E("VR.setS({diff:1})");await b.close()
  print('BAD',bad);print('ERRORS',errs)
asyncio.run(main())
