# Hack variety (Hollow garbage rows, FREEZE and COLUMN special cells) and maze variety (keycards, collapsing floor).
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
    await pg.goto('file://'+str(pathlib.Path(__file__).parent.resolve()/'dist/index.html'));await pg.wait_for_timeout(600)
    E=pg.evaluate
    # ---- hack ----
    await E("VR.god=true;VR.start(1)");await pg.wait_for_timeout(300)
    await E("VR.s5.noGarbage(true);VR.hk.setRow(19,[1,1,1,1,1,0,1,1,1,1])")
    ok=await E("VR.s5.garbage(3)")
    r=await E("(()=>{const b=VR.hk.H().b;return [b.slice(190,200),b.slice(180,190)];})()")
    chk('garbage row has exactly one hole',ok and r[0].count(0)==1 and r[0][3]==0 and all(v=='G' for i,v in enumerate(r[0]) if i!=3),r[0])
    chk('old stack pushed up a row',r[1][5]==0 and r[1][0]=='J',r[1])
    full=await E("(()=>{const H=VR.hk.H();for(let x=0;x<10;x++)H.b[x]='J';const res=VR.s5.garbage(0);return [res,H.dead>0];})()")
    chk('garbage into a full top row overflows the stack',full==[False,True],full)
    # timer drives it
    await E("VR.start(1)");await pg.wait_for_timeout(200)
    await E("(()=>{const H=VR.hk.H();H.gbT=0.05;})()");await pg.wait_for_timeout(300)
    chk('counter-hack fires on its timer',await E("VR.hk.H().gbN")==1)
    # freeze
    await E("VR.start(1)");await pg.wait_for_timeout(200)
    await E("(()=>{VR.s5.noGarbage(true);const H=VR.hk.H();for(let y=16;y<20;y++)VR.hk.setRow(y,[1,1,1,1,0,1,1,1,1,1]);VR.hk.spawn('I');VR.hk.rot(1);const c=VR.hk.cells();VR.s5.setSp(0,'F');})()")
    await E("(()=>{const H=VR.hk.H();while(VR.hk.cells()[0][0]>4)VR.hk.move(-1);while(VR.hk.cells()[0][0]<4)VR.hk.move(1);VR.hk.hard();})()")
    await pg.wait_for_timeout(500)
    st=await E("(()=>{const H=VR.hk.H();return {f:H.freeze,lines:H.lines,tr:H.trace};})()")
    await pg.wait_for_timeout(1500);tr2=await E("VR.hk.H().trace")
    chk('FREEZE cell stops the trace',st['lines']==4 and st['f']>4 and abs(tr2-st['tr'])<0.05,st,tr2)
    chk('toast for freeze',any('FROZEN' in t for t in await E("VR.toasts()")))
    # column
    await E("VR.start(1)");await pg.wait_for_timeout(200)
    await E("(()=>{VR.s5.noGarbage(true);const H=VR.hk.H();VR.hk.setRow(19,[1,1,1,1,0,1,1,1,1,1]);for(let y=14;y<19;y++)VR.hk.setRow(y,[0,0,0,0,0,0,0,1,0,0]);VR.hk.spawn('I');VR.hk.rot(1);VR.s5.setSp(3,'X');while(VR.hk.cells()[0][0]>4)VR.hk.move(-1);while(VR.hk.cells()[0][0]<4)VR.hk.move(1);})()")
    await pg.screenshot(path='screenshots/v6_hack_specials.png')
    await E("VR.hk.hard()");await pg.wait_for_timeout(500)
    col=await E("(()=>{const b=VR.hk.H().b;let n=0;for(let y=0;y<20;y++)if(b[y*10+7])n++;return [n,VR.hk.H().lines];})()")
    chk('COLUMN cell wipes the column it sits in? (col 4 cleared, col 7 kept)',col[1]==1 and col[0]==5,col)
    c4=await E("(()=>{const b=VR.hk.H().b;let n=0;for(let y=0;y<20;y++)if(b[y*10+4])n++;return n;})()")
    chk('column of the special is empty after the wipe',c4==0,c4)
    sp=await E("(()=>{let n=0;VR.start(1);const H=VR.hk.H();H.noGarbage=1;for(let i=0;i<24;i++){VR.hk.spawn();if(H.p.sp)n++;H.p=null;}return n;})()")
    chk('specials show up every sixth fragment',3<=sp<=5,sp)
    await E("VR.start(VR.ix('SPIRE LOCK'))");await pg.wait_for_timeout(200)
    await E("(()=>{const H=VR.hk.H();H.gbT=1.5;for(let y=15;y<20;y++)VR.hk.setRow(y,[1,1,0,1,1,1,1,1,1,1]);VR.s5.garbage(6);H.spc[17*10+3]='F';H.spc[18*10+8]='X';})()");await pg.wait_for_timeout(400)
    await pg.screenshot(path='screenshots/v6_hack_garbage.png')
    # ---- maze ----
    await E("VR.start(3)");await pg.wait_for_timeout(300)
    kc=await E("VR.s5.kc()");chk('maze has keycards',len(kc)>=2,kc)
    reach=await E("(()=>{const d=VR.ev.bfs(7,19,true);return VR.s5.kc().every(k=>d[k.y*15+k.x]>=0);})()");chk('every keycard reachable',reach)
    await E("(()=>{const H=VR.ev.H();H.lockT=0.05;})()");await pg.wait_for_timeout(400)
    chk('door stays shut while keycards are missing',not await E("VR.ev.H().unlocked"))
    await pg.screenshot(path='screenshots/v6_maze_keycards.png')
    for k in kc:
      await E(f"VR.ev.place({k['x']},{k['y']},null)");await pg.wait_for_timeout(120)
    chk('all keycards collected',all(k['got'] for k in await E("VR.s5.kc()")))
    await pg.wait_for_timeout(300);chk('door opens once all keycards are in and the timer is done',await E("VR.ev.H().unlocked"))
    # collapse
    await E("VR.start(VR.ix('SPIRE NURSERY'))");await pg.wait_for_timeout(300)
    cr=await E("VR.s5.cr()");chk('maze has crumbling tiles',len(cr)>=6,len(cr))
    idx=int(sorted(cr.keys(),key=int)[0]);x,y=idx%15,idx//15
    await E(f"VR.ev.place({x},{y},null)");await pg.wait_for_timeout(150)
    chk('stepping on the tile marks it',await E(f"VR.s5.cr()[{idx}].s")==1)
    await E("VR.ev.place(7,19,null)");await pg.wait_for_timeout(1600)
    s=await E(f"VR.s5.cr()[{idx}].s");w=await E(f"VR.s5.wall({idx})")
    chk('after you leave it falls in, or holds if that would cut off the way out',(s==3 and w==1) or s==4,s,w)
    # fuzz: walk all over every crumbling tile, the exit and every keycard must stay reachable
    okall=True
    for it in range(3):
      for k in list((await E("VR.s5.cr()")).keys()):
        i=int(k);await E(f"VR.ev.place({i%15},{i//15},null)");await pg.wait_for_timeout(40);await E("VR.ev.place(7,19,null)");await pg.wait_for_timeout(40)
      await pg.wait_for_timeout(1400)
      d=await E("VR.ev.bfs(7,19,true)");kk=await E("VR.s5.kc()")
      okall=okall and d[7]>=0 and all(d[k['y']*15+k['x']]>=0 for k in kk if not k['got'])
    chk('exit and keycards always stay reachable',okall)
    await pg.wait_for_timeout(300);await pg.screenshot(path='screenshots/v6_maze_collapse.png')
    await b.close()
  print('BAD',bad);print('ERRORS',errs)
asyncio.run(main())
