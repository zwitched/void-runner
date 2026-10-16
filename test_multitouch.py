# Multi-touch on-foot controls: every JUMP press must register while other fingers hold buttons.
import asyncio,pathlib,sys
from playwright.async_api import async_playwright
SRC=sys.argv[1] if len(sys.argv)>1 else str(pathlib.Path(__file__).parent.resolve()/'dist/index.html')
async def main():
  errs=[];bad=[];out=[]
  async with async_playwright() as p:
    b=await p.chromium.launch();ctx=await b.new_context(**p.devices['Pixel 7']);pg=await ctx.new_page()
    pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:errs.append(m.text) if m.type=='error' else None)
    await pg.goto('file://'+SRC);await pg.wait_for_timeout(300)
    E=pg.evaluate;cdp=await ctx.new_cdp_session(pg);box=await pg.locator('canvas').bounding_box()
    def T(x,y,i):return {'x':box['x']+x*box['width']/270,'y':box['y']+y*box['height']/480,'id':i}
    # Real multi-touch semantics via synthetic TouchEvents (Touch.identifier + changedTouches), since CDP
    # can't release a single finger while others stay down.
    await E('''(()=>{window.__act={};window.__tt=(type,pts)=>{const c=document.getElementById('c');const mk=q=>new Touch({identifier:q.id,target:c,clientX:q.x,clientY:q.y});
      const ch=[];if(type==='touchStart'||type==='touchMove'){for(const q of pts){if(type==='touchStart'&&__act[q.id])continue;if(type==='touchMove'&&!__act[q.id])continue;__act[q.id]=q;ch.push(mk(q));}
        if(type==='touchStart'){for(const id in __act)if(!pts.some(q=>q.id==id))0;}
        const gone=Object.keys(__act).filter(id=>!pts.some(q=>q.id==id));
        if(ch.length)c.dispatchEvent(new TouchEvent(type.toLowerCase(),{bubbles:true,cancelable:true,changedTouches:ch,touches:Object.values(__act).map(mk)}));
        if(gone.length){const g=gone.map(id=>mk(__act[id]));gone.forEach(id=>delete __act[id]);c.dispatchEvent(new TouchEvent('touchend',{bubbles:true,cancelable:true,changedTouches:g,touches:Object.values(__act).map(mk)}));}}
      else{const g=Object.values(__act).map(mk);window.__act={};c.dispatchEvent(new TouchEvent(type.toLowerCase(),{bubbles:true,cancelable:true,changedTouches:g,touches:[]}));}}})()''')
    async def touch(typ,pts):await E('([t,p])=>__tt(t,p)',[typ,pts])
    async def onground(timeout=2.0):
      for _ in range(int(timeout/0.01)):
        if await E('VR.G().p.on'):return True
        await pg.wait_for_timeout(10)
      return False
    J=lambda i=2:T(235,421,i);RIGHT=T(99,421,1);LEFT=T(35,421,1);FIRE=T(172,421,3)
    async def fresh():
      await E("VR.god=true;VR.start(1)");await pg.wait_for_timeout(1300);await E("VR.G().ens=VR.G().ens.filter(e=>e.k==='brute')")
    jumps=lambda:E('VR.G().p.jumps||0')
    # A) hold > then tap JUMP repeatedly while moving (normal + ultra-short taps)
    await fresh();await touch('touchStart',[RIGHT]);presses=0
    for k in range(8):
      await onground();before=await jumps()
      await touch('touchStart',[RIGHT,J()])
      if k%2:await touch('touchMove',[RIGHT])   # tap released immediately (sub-frame)
      else:await pg.wait_for_timeout(40);await touch('touchMove',[RIGHT])
      presses+=1;await pg.wait_for_timeout(120)
      if await jumps()!=before+1:bad.append(('A tap',k,'not registered'))
      await touch('touchMove',[T(99+(k%3),421,1)])
    vx=await E('VR.G().p.vx');x=await E('VR.G().p.x');await touch('touchEnd',[])
    out.append(('A: hold > + tap JUMP',presses,'presses',await jumps(),'jumps','vx',vx));
    if vx<=0:bad.append('A not moving right')
    # B) three fingers: hold < , hold FIRE pad (aim up), tap JUMP
    await fresh();await E("VR.G().p.x=300");await pg.wait_for_timeout(100)
    await touch('touchStart',[LEFT]);await touch('touchStart',[LEFT,FIRE]);await touch('touchMove',[LEFT,T(172,399,3)])
    b0=await jumps();n=5
    for k in range(n):
      await onground();await touch('touchStart',[LEFT,T(172,399,3),J(7+k)]);await pg.wait_for_timeout(30);await touch('touchMove',[LEFT,T(172,399,3)]);await pg.wait_for_timeout(100)
    st=await E("(()=>{const p=VR.G().p,G=VR.G();return {L:G.tb.L,F:G.tb.F,aim:p.aim,shots:p.shots||0,face:p.face}})()")
    await touch('touchEnd',[]);got=await jumps()-b0
    out.append(('B: < + FIRE pad + JUMP',n,'presses',got,'jumps',st))
    if got!=n or not st['L'] or st['face']!=-1 or st['shots']<3 or st['aim']!=-1:bad.append(('B',got,st))
    # C) slide one finger from < to > without lifting
    await fresh();await touch('touchStart',[LEFT]);await pg.wait_for_timeout(150);v1=await E('VR.G().p.vx')
    await touch('touchMove',[T(67,421,1)]);await touch('touchMove',[RIGHT]);await pg.wait_for_timeout(150);v2=await E('VR.G().p.vx');await touch('touchEnd',[])
    out.append(('C: slide < to >',v1,v2));
    if not(v1<0<v2):bad.append(('C',v1,v2))
    # D) jump buffer: tap JUMP while falling just before landing -> jumps on landing
    await fresh();await onground();yg=await E('VR.G().p.y');await E("VR.G().p.y-=40;VR.G().p.vy=0");b0=await jumps()
    for _ in range(200):
      y=await E('VR.G().p.y')
      if y>yg-14:break
      await pg.wait_for_timeout(3)
    air=not await E('VR.G().p.on');await touch('touchStart',[J()]);await touch('touchEnd',[]);await pg.wait_for_timeout(200)
    out.append(('D: buffered tap in air before landing',air,await jumps()-b0))
    if await jumps()-b0!=1:bad.append('D buffer')
    # E) coyote: tap JUMP just after walking off a ledge
    await fresh();await E("(()=>{const G=VR.G();for(let X=5;X<9;X++)for(let Y=0;Y<22;Y++)G.map[Y*G.cols+X]=0;})()")
    await touch('touchStart',[RIGHT]);b0=await jumps();ok=False
    for _ in range(400):
      s=await E("(()=>{const p=VR.G().p;return [p.on,p.vy,p.x]})()")
      if not s[0] and s[1]>=0:
        await touch('touchStart',[RIGHT,J()]);await touch('touchMove',[RIGHT]);ok=True;break
      await pg.wait_for_timeout(2)
    await pg.wait_for_timeout(150);await touch('touchEnd',[])
    out.append(('E: coyote tap after leaving ledge',ok,await jumps()-b0))
    if not ok or await jumps()-b0!=1:bad.append('E coyote')
    # F) touchcancel clears held button
    await fresh();await touch('touchStart',[RIGHT]);await pg.wait_for_timeout(100);await touch('touchCancel',[]);await pg.wait_for_timeout(100)
    vc=await E('VR.G().p.vx');out.append(('F: touchcancel releases',vc))
    if vc!=0:bad.append('F cancel')
    await b.close()
  for o in out:print(o)
  print('BAD',bad);print('ERRORS',errs)
asyncio.run(main())
