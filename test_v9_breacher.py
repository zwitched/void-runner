# SURVEY DOCK Breacher regression (v9.2): the big one's entrance after "BIG ONE ON THE RIGHT".
# Checks on High and Low GFX, Easy and Normal, a normal run and a checkpoint retry:
#  canvas transform is identity*RQ and the save/restore stack is balanced at the end of every frame,
#  Breacher frame is a real walk/atk frame, position finite and on screen, feet on the deck (pixel check),
#  it stops walking at the door and shows bash frames, no stall on the spawn frame, no page errors.
# Also NG+ (palette index past the 3 brute palettes used to throw every frame and blank the scene).
import asyncio,pathlib,math
from playwright.async_api import async_playwright
ROOT=pathlib.Path(__file__).parent.resolve()
HOOK="""(()=>{if(window.__fr)return;window.__fr=[];let depth=0;const sv=ctx.save.bind(ctx),rs=ctx.restore.bind(ctx);ctx.save=()=>{depth++;sv();};ctx.restore=()=>{depth--;rs();};
 const raf=window.requestAnimationFrame.bind(window);window.requestAnimationFrame=cb=>raf(ts=>{const t0=performance.now();cb(ts);const t=ctx.getTransform(),H=VR.G(),b=VR.state()==='turret'&&VR.tu.br();
  window.__fr.push({ms:performance.now()-t0,tf:[t.a,t.b,t.c,t.d,t.e,t.f],depth,rep:H&&H.rep,b});if(window.__fr.length>3000)window.__fr.splice(0,1000);});})()"""
async def main():
  bad=[];errs=[]
  def chk(n,ok,*a):
    print(n,ok,*a)
    if not ok:bad.append((n,)+a)
  async with async_playwright() as p:
    b=await p.chromium.launch()
    for gfx in ('hi','lo'):
     for d in (0,1):
      tag=f'{gfx}/{["easy","normal"][d]}'
      ctx=await b.new_context(**p.devices['Pixel 7']);pg=await ctx.new_page()
      pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:m.type=='error' and errs.append(m.text))
      await pg.goto('file://'+str(ROOT/'dist/index.html'));await pg.wait_for_timeout(300)
      if gfx=='lo':await pg.evaluate("localStorage.setItem('voidrunner.save.v1',JSON.stringify({q:'lo'}));location.reload()");await pg.wait_for_timeout(600)
      E=pg.evaluate;ti=await E("VR.ix('SURVEY DOCK')");RQ=2 if gfx=='hi' else 1
      await E(HOOK)
      await E(f"VR.god=true;VR.setS({{diff:{d},ng:0}});FT.turCk=null;VR.start({ti})");await pg.wait_for_timeout(300)
      chk(f'{tag} brute art is built at mission start (cached call is instant)',await E("(()=>{const t=performance.now();tBrute(VR.G());return performance.now()-t})()")<3)
      await E("window.__fr.length=0;VR.G().rep=69.8")
      shots=[]
      for k,ms in enumerate((600,2500,4000,4000)):
        await pg.wait_for_timeout(ms);shots.append(await pg.screenshot())
        if k==1:
          # pixel check: brute pixels just above the deck line under the Breacher, none in the strip right above its head
          px=await E(f"""(()=>{{const r=VR.tu.br(),TG=VR.tu.TG(),c=document.querySelector('canvas'),x=c.getContext('2d');const n=(y0,y1)=>{{const d=x.getImageData(Math.round((r.x-14)*{RQ}),Math.round(y0*{RQ}),Math.round(28*{RQ}),Math.round((y1-y0)*{RQ})).data;let k=0;for(let i=0;i<d.length;i+=4)if(d[i+2]>110&&d[i]>70&&d[i+2]>d[i+1]+50)k++;return k;}};return [n(TG.gr-6,TG.gr-1),n(r.dy-44,r.dy-36),r]}})()""")
          chk(f'{tag} pixel: Breacher purple reaches the deck (feet on the floor)',px[0]>3*RQ*RQ,px[0])
          chk(f'{tag} pixel: no Breacher art floating up in the label gap',px[1]<=2*RQ*RQ,px[1])
      fr=await E("window.__fr")
      bf=[f for f in fr if f['b']]
      chk(f'{tag} frames sampled with a Breacher',len(bf)>300,len(fr),len(bf))
      chk(f'{tag} transform is (RQ,0,0,RQ,0,0) at the end of every frame',all(f['tf']==[RQ,0,0,RQ,0,0] for f in fr),{tuple(f['tf']) for f in fr})
      chk(f'{tag} ctx.save/restore balanced every frame',all(f['depth']==0 for f in fr),{f['depth'] for f in fr})
      okf=all(x['b']['set'] in('walk','atk','flash') and 0<=x['b']['fi']<(4 if x['b']['set']=='walk' else 2) or x['b']['set']=='flash' for x in bf)
      chk(f'{tag} Breacher frame is always a valid walk/atk/flash frame',okf,{(x['b']['set'],x['b']['fi']) for x in bf})
      fin=all(all(math.isfinite(v) for v in (x['b']['x'],x['b']['y'],x['b']['foot'])) for x in bf)
      chk(f'{tag} Breacher position finite',fin)
      chk(f'{tag} Breacher on screen once in (x in 0..W+60, feet on the deck)',all(-10<x['b']['x']<=270+60 and abs(x['b']['foot']-350)<1.5 for x in bf),bf[-1]['b'])
      spawn=[f['ms'] for f in fr if f['rep'] is not None and 69.8<=f['rep']<70.6]
      chk(f'{tag} no stall around the spawn frame (frame work < 25 ms)',max(spawn or [0])<25,round(max(spawn or [0]),1))
      at=[x['b'] for x in bf if x['b']['x']<=179.01]
      chk(f'{tag} reached the door',len(at)>20,len(at))
      chk(f'{tag} stands still at the door (no walk cycle in place)',all(not a['moving'] and a['set']!='walk' or a['fi']==0 for a in at))
      chk(f'{tag} bash frames shown at the door',any(a['set']=='atk' for a in at))
      chk(f'{tag} walk cycle advances while walking in',len({x['b']['fi'] for x in bf if x['b']['moving'] and x['b']['set']=='walk'})>=3)
      if gfx=='hi' and d==1:(ROOT/'screenshots').mkdir(exist_ok=True);(ROOT/'screenshots/v9_breacher_fixed.png').write_bytes(shots[3])
      # checkpoint retry: lose at the Breacher, retry, and the big one comes in clean again
      await E("(()=>{const H=VR.G();VR.god=false;H.p.inv=0;H.p.hp=1;hurt();})()");await pg.wait_for_timeout(1800)
      await E("VR.god=true;window.__fr.length=0;startLevel(curLvl)");await pg.wait_for_timeout(500)
      chk(f'{tag} retry starts at the checkpoint',await E("VR.state()==='turret'&&VR.G().rep>=65"),await E("VR.G().rep"))
      await E("VR.G().rep=69.8");await pg.wait_for_timeout(2500)
      fr=await E("window.__fr");bf=[f for f in fr if f['b']]
      chk(f'{tag} retry: Breacher spawned, frames clean, feet on deck',len(bf)>60 and all(f['tf']==[RQ,0,0,RQ,0,0] and f['depth']==0 for f in fr) and all(math.isfinite(x['b']['x']) and abs(x['b']['foot']-350)<1.5 for x in bf),len(bf))
      await ctx.close()
    # NG+: palette index Q.d+1 = 4 used to throw on every frame
    ctx=await b.new_context(**p.devices['Pixel 7']);pg=await ctx.new_page();ng=[]
    pg.on('pageerror',lambda e:ng.append(str(e)));pg.on('console',lambda m:m.type=='error' and ng.append(m.text))
    await pg.goto('file://'+str(ROOT/'dist/index.html'));await pg.wait_for_timeout(300);E=pg.evaluate;await E(HOOK)
    await E("VR.god=true;VR.setS({diff:2,ng:1});FT.turCk=null;VR.start(VR.ix('SURVEY DOCK'));VR.G().rep=69.8");await pg.wait_for_timeout(2500)
    fr=await E("window.__fr")
    chk('NG+ Hard: Breacher draws with no errors and a balanced stack',not ng and any(f['b'] for f in fr) and all(f['depth']==0 for f in fr),ng[:1])
    chk('ART.brute clamps out-of-range palettes',await E("ART.brute(4)===ART.brute(3)&&ART.brute(0)===ART.brute(1)"))
    await E("VR.start(VR.ix('HIVE SPIRE'))");await pg.wait_for_timeout(1500)
    chk('NG+ HIVE SPIRE (brute d=4) draws with no errors',not ng,ng[:1])
    await b.close()
  print('BAD',bad);print('ERRORS',errs[:5])
asyncio.run(main())
