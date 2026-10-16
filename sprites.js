'use strict';
// VOID RUNNER v3 sprite art. Every sprite here is authored natively at 2 art pixels per logical pixel
// (one art pixel = one device pixel on GFX HIGH). Shapes are written as small geometry functions that return a
// material per pixel; paint() shades them with 6-step material ramps, ordered dither, panel seams, rim light and
// a dark outline. Nothing in this file upscales the old sprites. All frames are built once at load (bosses at
// level start) and cached.
const ART=(()=>{
const hx=c=>[parseInt(c.slice(1,3),16),parseInt(c.slice(3,5),16),parseInt(c.slice(5,7),16)];
const mix=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];
const cl=(v,a,b)=>v<a?a:v>b?b:v;
function ramp(base,o={}){const b=hx(base),sh=o.sh?hx(o.sh):mix(b,[12,14,44],0.74),li=o.li?hx(o.li):mix(b,[255,255,255],0.62),out=[];
 for(let i=0;i<6;i++){const t=i/5;out.push((t<0.6?mix(sh,b,t/0.6):mix(b,li,(t-0.6)/0.4)).map(Math.round));}return out;}
const BY=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
const hash=(x,y,s=0)=>{let h=(x*374761393+y*668265263+s*982451653)|0;h=(h^(h>>>13))*1274126177|0;return ((h^(h>>>16))>>>0)/4294967296;};
function vnoise(x,y,s=0){const xi=Math.floor(x),yi=Math.floor(y),fx=x-xi,fy=y-yi,u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy);
 const a=hash(xi,yi,s),b=hash(xi+1,yi,s),c=hash(xi,yi+1,s),d=hash(xi+1,yi+1,s);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v;}
const el=(x,y,cx,cy,rx,ry)=>((x-cx)/rx)**2+((y-cy)/ry)**2<=1;
const eld=(x,y,cx,cy,rx,ry)=>Math.sqrt(((x-cx)/rx)**2+((y-cy)/ry)**2);
const sd=(px,py,ax,ay,bx,by)=>{const dx=bx-ax,dy=by-ay,t=cl(((px-ax)*dx+(py-ay)*dy)/(dx*dx+dy*dy||1),0,1);return Math.hypot(px-ax-dx*t,py-ay-dy*t);};
const cap=(x,y,ax,ay,bx,by,r)=>sd(x,y,ax,ay,bx,by)<=r;
const poly=(x,y,P)=>{let c=false;for(let i=0,j=P.length-1;i<P.length;j=i++){const xi=P[i][0],yi=P[i][1],xj=P[j][0],yj=P[j][1];if(((yi>y)!==(yj>y))&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)c=!c;}return c;};
const rr=(x,y,x0,y0,x1,y1,r=0)=>{const qx=Math.max(x0+r-x,0,x-(x1-r)),qy=Math.max(y0+r-y,0,y-(y1-r));return qx*qx+qy*qy<=r*r;};
const mk=(w,h,r)=>{const c=document.createElement('canvas');c.width=w;c.height=h;c.r=r;return c;};
// paint: fn(x,y)->0 | 'mat' | ['mat',shadeOffset]. M: {mat:{c:ramp, e:emissive, o:offset}}
function paint(w,h,fn,M,o={}){const n=w*h,mat=new Array(n).fill(0),off=new Float32Array(n);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const v=fn(x+0.5,y+0.5);if(!v)continue;const i=y*w+x;if(typeof v==='string')mat[i]=v;else{mat[i]=v[0];off[i]=v[1]||0;}}
 const D=new Float32Array(n);for(let i=0;i<n;i++)D[i]=mat[i]?99:0;const g=(x,y)=>x<0||y<0||x>=w||y>=h?0:D[y*w+x];
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x;if(D[i])D[i]=Math.min(D[i],g(x-1,y)+1,g(x,y-1)+1,g(x-1,y-1)+1.41,g(x+1,y-1)+1.41);}
 for(let y=h-1;y>=0;y--)for(let x=w-1;x>=0;x--){const i=y*w+x;if(D[i])D[i]=Math.min(D[i],g(x+1,y)+1,g(x,y+1)+1,g(x+1,y+1)+1.41,g(x-1,y+1)+1.41);}
 const R=o.R||5,Hh=new Float32Array(n);for(let i=0;i<n;i++)Hh[i]=D[i]?Math.sqrt(Math.min(D[i],R)/R)*R*(o.bulge||1.1):0;
 const hh=(x,y)=>x<0||y<0||x>=w||y>=h?0:Hh[y*w+x];
 const c=mk(w,h,o.r||4),cx=c.getContext('2d'),im=cx.createImageData(w,h),d=im.data;
 const Lx=-0.45,Ly=-0.7,Lz=0.55,rim=o.rim===null?null:hx(o.rim||'#9ad8ff'),ol=o.ol===null?null:hx(o.ol||'#07060e');
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x,k=mat[i];
  if(!k){if(ol&&(g(x-1,y)||g(x+1,y)||g(x,y-1)||g(x,y+1))){d[i*4]=ol[0];d[i*4+1]=ol[1];d[i*4+2]=ol[2];d[i*4+3]=255;}continue;}
  const m=M[k];if(!m)throw new Error('mat '+k);let s;
  if(m.e){s=0.32+0.5*Math.min(1,D[i]/(m.er||2.5))+off[i];}
  else{const gx=(hh(x+1,y)-hh(x-1,y))/2,gy=(hh(x,y+1)-hh(x,y-1))/2,len=Math.hypot(gx,gy,1);const dot=(-gx*Lx-gy*Ly+Lz)/len;
   s=0.08+dot*0.92+off[i]+(m.o||0);
   const l=x>0?mat[i-1]:0,u=y>0?mat[i-w]:0;if((l&&l!==k&&!M[l].e)||(u&&u!==k&&!M[u].e))s-=0.32;}
  let idx=Math.floor(cl(s,0,1)*5.4+(BY[(y&3)*4+(x&3)]/16-0.5)*(o.dith||0.55));idx=cl(idx,0,5);let col=m.c[idx];
  if(rim&&!m.e&&D[i]<=1.6&&!g(x+1,y+1)&&!g(x+2,y)&&(x+y)%1===0)col=mix(col,rim,0.55);
  d[i*4]=col[0];d[i*4+1]=col[1];d[i*4+2]=col[2];d[i*4+3]=255;}
 cx.putImageData(im,0,0);return c;}
function white(c){const o=mk(c.width,c.height,c.r),x=o.getContext('2d');x.drawImage(c,0,0);x.globalCompositeOperation='source-atop';x.fillStyle='#fff';x.fillRect(0,0,o.width,o.height);return o;}
const MAT=(o)=>{const M={};for(const k in o){const v=o[k];M[k]=Array.isArray(v)?{c:ramp(v[0],v[1]||{}),e:!!(v[1]&&v[1].e),er:v[1]&&v[1].er,o:v[1]&&v[1].o}:v;}return M;};

// ================= PLAYER SHIP: 72x76 art (36x38 logical), 5 bank frames, 4 flame frames =================
const SHIPM=MAT({hull:['#c4d0e6'],hull2:['#9aaccc'],trim:['#2e6cf0'],dark:['#262c44'],metal:['#7c8498'],gl:['#2ab8f0',{li:'#e8ffff'}],glh:['#f4ffff',{e:1}],lite:['#7ae8ff',{e:1}],red:['#ffb43a',{e:1}]});
function shipFrame(b){const cx=36;return paint(72,76,(x,y)=>{const sx=x-cx-b*2.6,side=sx<0?-1:1,ax=Math.abs(sx)/(1-0.22*b*side),shade=b*side*0.12;
 const fw=y<4?0:y<58?Math.min(8.5,(y-3)*0.42+1.4):y<67?8.5-(y-58)*0.3:0;
 if(el(ax,y,0,21,3.6,8.5))return(ax<1.4&&y>14&&y<20)||(ax>1.6&&ax<2.4&&y>15&&y<18)?'glh':['gl',shade];
 if(ax<=fw){if(ax<1.3&&y>33&&y<58)return'trim';if(y>29.5&&y<31)return'dark';if(ax>7.5&&y>32&&y<42)return'dark';return[(y>31&&y<46)?'hull2':'hull',shade];}
 if(poly(ax,y,[[8,17],[15,27],[15,31],[8,28]]))return['trim',shade];
 if(ax>=13&&ax<=19.5&&y>=40&&y<=70){if(y>66)return'dark';if(y>44&&y<47)return'dark';return['metal',shade+(ax<16?0.05:-0.05)];}
 if(ax>30&&ax<=34&&y>56.5&&y<61)return'lite';
 if(poly(ax,y,[[7,31],[33.5,55.5],[34.5,62],[25,62],[7,55]])){if(sd(ax,y,7,31,33.5,55.5)<2.4)return['trim',shade];if(y>57.5&&ax>20)return['hull2',shade];if(Math.abs(ax-21)<0.6&&y>46)return'dark';return['hull',shade];}
 if(ax>=21&&ax<=23&&y>=49&&y<=63)return['trim',shade];return 0;},SHIPM,{R:6});}
function flame(f){const L=16+[0,4,1,5][f],c=mk(16,30,4),x=c.getContext('2d');for(let y=0;y<30;y++)for(let X=0;X<16;X++){const t=y/L,w=4.2*(1-t)*(1+0.18*Math.sin(y*1.1+f*2.1));const dx=Math.abs(X+0.5-8);if(y>=L||dx>w)continue;const q=dx/w+t*0.8+(BY[(y&3)*4+(X&3)]/16-0.5)*0.25;x.fillStyle=q<0.35?'#ffffff':q<0.6?'#aef4ff':q<0.85?'#4ab8ff':q<1.1?'#2a6aff':'#1a2aa0';x.fillRect(X,y,1,1);}return c;}
function flameOld(f){const M=MAT({f0:['#3a6aff',{e:1,er:3,li:'#ffffff'}]});const L=14+[0,3,1,4][f];return paint(14,26,(x,y)=>{const w=3.4*(1-y/L)*(1+0.15*Math.sin(y*1.3+f*2));return y<L&&Math.abs(x-7)<w?['f0',-y/L*0.5]:0;},M,{ol:null,rim:null});}

// ================= SPACE ENEMIES =================
const EM=MAT({tis:['#d84a72'],tis2:['#a83058'],vein:['#6a1840'],chit:['#4c2c62'],eye:['#ffd23a',{e:1,li:'#ffffe0'}],pupil:['#1a0a10'],
 jb:['#2c9a52'],jb2:['#1e6a3a'],wing:['#8ae0a0'],eyeg:['#eaff7a',{e:1}],pa:['#7c50b8'],pb:['#56348e'],pm:['#8a90a8'],pc:['#ff6ae8',{e:1}],
 ko:['#ff8a3a'],ko2:['#c05a1a'],ky:['#ffe07a',{e:1}],rock:['#8c7c6a'],rock2:['#6a5a4c']});
function drone(f){const ph=f/4*Math.PI*2,pul=Math.sin(ph)*0.9;return paint(48,48,(x,y)=>{const cx=24,cy=21;
 const ed=eld(x,y,cx,cy,7.5,7.5);if(ed<1){const a=Math.atan2(y-cy,x-cx)+ph/3;const rr2=ed*7.5;if(rr2<2.6)return'pupil';if(rr2<4.6)return Math.sin(a*6)>0.2?'eye':['eye',-0.35];return['eye',-0.2];}
 if(el(x,y,cx,cy,14+pul,12+pul)){const a=Math.atan2(y-cy,x-cx);if(y<cy-3&&Math.abs(Math.sin(a*3))>0.25&&eld(x,y,cx,cy,14+pul,12+pul)>0.62)return'chit';
  const v=Math.abs(Math.sin(a*5+eld(x,y,cx,cy,10,10)*4));return v<0.12?'vein':'tis';}
 for(let k=-1;k<=1;k++){const bx=cx+k*7,by=cy+10,ex=bx+Math.sin(ph+k*1.7)*3+k*2,ey=by+12;if(cap(x,y,bx,by,ex,ey,2.4-((y-by)/14)*1.4))return'tis2';}
 if(poly(Math.abs(x-cx),y,[[10,12],[19,6],[17,14],[13,18]]))return'chit';return 0;},EM,{R:5,rim:'#ffb0d0'});}
function weaver(f){const fl=[1,0.55,-0.1,0.55][f];return paint(56,44,(x,y)=>{const cx=28,ax=Math.abs(x-cx);
 if(el(ax,y,2.6,30,2.2,2))return'eyeg';
 if(el(ax,y,0,29,5,5))return'jb';if(el(ax,y,0,19,6.5,9))return Math.abs(y-17)<0.7||Math.abs(y-22)<0.7?'jb2':'jb';if(el(ax,y,0,9,3.5,6))return'jb2';
 const wy=18-fl*8,wx=24;{const t=sd(ax,y,4,17,wx,wy);if(t<7.5-ax*0.17){return Math.abs(t-2.2)<0.55||(ax>8&&Math.abs((ax*0.6+y)%6-3)<0.4)?'jb2':['wing',0.05];}}
 const wy2=24-fl*4;if(sd(ax,y,4,22,17,wy2+6)<3.4)return['wing',-0.15];
 if(cap(ax,y,3,33,6,38,1)||cap(ax,y,6,38,4,41,0.9))return'jb2';return 0;},EM,{R:4,rim:'#d0ffd8'});}
function gunship(f){const rot=f/4*Math.PI/3;return paint(64,56,(x,y)=>{const cx=32,cy=26,ax=Math.abs(x-cx);
 const ed=eld(x,y,cx,cy,6,6);if(ed<0.6)return'pc';if(ed<1){const a=Math.atan2(y-cy,x-cx)+rot;return Math.cos(a*6)>0.3?'pm':'pb';}
 for(let k=0;k<3;k++){const a=rot+k*Math.PI*2/3+Math.PI/2,bx=cx+Math.cos(a)*9,by=cy+Math.sin(a)*9;if(el(x,y,bx,by,2.2,2.2))return'pm';}
 if(poly(ax,y,[[0,6],[13,10],[21,22],[19,38],[8,44],[0,46]])){if(Math.abs(ax-11)<0.6&&y>14)return'pb';if(y>36)return['pb',0.05];return'pa';}
 if(poly(ax,y,[[19,20],[30,28],[31,40],[24,42],[19,34]]))return ax>27&&y>30?'pc':'pa';
 if(rr(ax,y,22,40,26,52,1.5))return y>49?'pc':'pm';if(rr(ax,y,0,44,3,53,1))return'pm';return 0;},EM,{R:5,rim:'#e0c0ff'});}
function kami(f){return paint(30,34,(x,y)=>{const cx=15,ax=Math.abs(x-cx);if(el(ax,y,0,13,3,3.4))return['ky',[0,0.25,-0.1,0.3][f]];
 if(poly(ax,y,[[0,32],[8,8],[6,2],[0,5]]))return ax<1.2&&y>18?'ko2':'ko';if(poly(ax,y,[[6,6],[13,[2,4,1,3][f]],[10,12]]))return'ko2';return 0;},EM,{R:4,rim:'#ffe0b0'});}
function rockF(f,seed){const a0=f/8*Math.PI*2;return paint(44,44,(x,y)=>{const dx=x-22,dy=y-22,r=Math.hypot(dx,dy),a=Math.atan2(dy,dx)-a0;
 const R=15+3*Math.sin(a*3+seed)+2*Math.sin(a*5+seed*2);if(r>R)return 0;
 for(const[cr,ca,cs]of[[7,1.2,4],[9,3.6,3],[4,5.1,2.4]]){const qx=22+Math.cos(ca+a0)*cr,qy=22+Math.sin(ca+a0)*cr,q=Math.hypot(x-qx,y-qy);if(q<cs)return['rock2',q<cs-1.2?-0.25:0.2];}
 return['rock',(vnoise(x/3,y/3,seed)-0.5)*0.3];},EM,{R:6,rim:'#ffd8b0'});}

// ================= BOSSES (built per level, 4 anim frames x 3 damage states, r=6 so draw(..,3) is 2 art px / logical) =================
const BOSSPAL=[{a:'#c8405a',b:'#7a1e3a',m:'#8a8ca0',g:'#ffd23a',d:'#2a1020'},{a:'#e08a3a',b:'#8a4a1a',m:'#9a8a7a',g:'#5ad0ff',d:'#2a160a'},
 {a:'#3ac8a0',b:'#1a7a62',m:'#8aa0a8',g:'#ff6ae8',d:'#0a2a22'},{a:'#9a5ae0',b:'#5a2aa0',m:'#9a9ab8',g:'#9aff5a',d:'#1a0a30'},{a:'#7a1030',b:'#3a0818',m:'#5a4a5a',g:'#ffffff',d:'#100008'}];
function boss(d,fin){const P=BOSSPAL[fin?4:d-1];const M=MAT({a:[P.a],b:[P.b],m:[P.m],dk:[P.d,{li:P.m}],g:[P.g,{e:1,er:5,li:'#ffffff'}],em:['#ff7a2a',{e:1,li:'#ffe0a0'}],sc:['#2a2026'],flesh:['#b0284a'],flesh2:['#6a1030']});
 const kind=fin?4:d-1,W2=[264,288,312,336,384][kind],H2=[150,160,150,170,200][kind];const frames=[];
 for(let dmg=0;dmg<3;dmg++){const fr=[];for(let f=0;f<4;f++){const ph=f/4*Math.PI*2,rot=f/4*Math.PI/3,cx=W2/2,cy=H2*0.45;
  const cracks=[];for(let k=0;k<dmg*4;k++){const a=hash(k,d,7)*7,r0=20+hash(k,d,9)*W2*0.3;cracks.push([cx+Math.cos(a)*r0,cy+Math.sin(a)*r0*0.5,a+1.2+hash(k,3)*1.5]);}
  const core=(x,y)=>{const ed=eld(x,y,cx,cy+6,16,16);if(ed<0.3)return['g',0.25];if(ed<0.55)return['g',-0.05];if(ed<0.7)return'dk';if(ed<1){const a=Math.atan2(y-cy-6,x-cx)+rot;return Math.cos(a*6)>0.4?'g':'dk';}return 0;};
  const body=(x,y)=>{const ax=Math.abs(x-cx);
   if(kind===0){// Hollow Reaver: carapace with two crescent claws
    if(el(ax,y,0,cy,46,42))return Math.abs(eld(ax,y,0,cy,46,42)-0.72)<0.04?'b':(y<cy-20&&Math.sin(ax*0.25)>0.6?'b':'a');
    const t=eld(ax,y,62,cy+18,62,44);if(t<1&&t>0.66&&y>cy-10)return y>cy+40&&ax>90?'m':'a';
    if(el(ax,y,40,cy-14,26,14))return'b';if(poly(ax,y,[[18,cy+36],[26,cy+66],[30,cy+38]]))return'm';return 0;}
   if(kind===1){// Cinder Maw: wide furnace jaw with teeth
    if(poly(ax,y,[[0,6],[60,14],[120,42],[136,72],[110,100],[70,96],[0,120]])){if(y>cy+30&&ax<70&&Math.sin(ax*0.35)>0)return y>cy+44?'em':'m';if(Math.abs(y-cy+22)<1.5||Math.abs(ax-60)<1.2)return'b';return'a';}
    if(poly(ax,y,[[0,118],[60,96],[50,112],[30,130],[0,140]]))return'b';if(rr(ax,y,100,60,130,80,4))return'm';return 0;}
   if(kind===2){// Mothership: saucer with hangar bays
    if(el(ax,y,0,cy,150,30)){if(Math.abs(eld(ax,y,0,cy,150,30)-0.8)<0.05)return'b';if(y>cy+8&&Math.floor(ax/22)%2===0&&ax>30)return y>cy+14?'em':'dk';return'a';}
    if(el(ax,y,0,cy-18,58,32))return y<cy-40&&ax<26?'m':'a';if(el(ax,y,0,cy+30,40,22))return'b';return 0;}
   if(kind===3){// Rift Warden: spiked diamond with blades
    if(poly(ax,y,[[0,4],[50,40],[70,cy],[44,130],[0,160]])){if(Math.abs(ax-24)<1.2||Math.abs(y-cy)<1.4)return'b';return'a';}
    if(poly(ax,y,[[60,50],[166,30],[140,64],[78,90]]))return sd(ax,y,60,50,166,30)<3?'m':'b';
    if(poly(ax,y,[[60,100],[130,140],[70,124]]))return'b';return 0;}
   // Void Heart: pulsing organic heart with tendrils
   const pul=1+Math.sin(ph)*0.04;const hx2=ax/pul,hy=(y-cy)/pul;
   const heart=el(hx2,hy,28,-10,44,44)||poly(hx2,hy,[[0,94],[70,10],[0,-20]]);
   if(heart){const v=vnoise(x/9,y/9,5);const ed=Math.hypot(hx2,hy+10)/80;if(Math.abs(Math.sin((hx2*0.08+hy*0.05)*3+v*4))<0.1)return'flesh2';return['flesh',v*0.25-ed*0.2];}
   for(let k=0;k<4;k++){const a=0.5+k*0.33,bx=46+k*16,by=cy+10+k*14,wx=Math.sin(ph+k)*8;if(cap(ax,y,bx,by,bx+70+wx,by+40-k*6,6-(k*0.7)))return k%2?'flesh2':'flesh';}
   for(let k=-2;k<=2;k++){if(poly(x-cx-k*18,y,[[-5,cy-62+Math.abs(k)*8],[0,cy-90+Math.abs(k)*10],[5,cy-62+Math.abs(k)*8]]))return'dk';}return 0;};
  const fn=(x,y)=>{const c=core(x,y);if(c)return c;let v=body(x,y);if(!v)return 0;
   for(const[qx,qy,a]of cracks){const t=Math.abs((x-qx)*Math.sin(a)-(y-qy)*Math.cos(a)),u=(x-qx)*Math.cos(a)+(y-qy)*Math.sin(a);if(t<1.1+Math.sin(u*0.4)*0.6&&Math.abs(u)<18)return dmg>1&&t<0.6?'em':'sc';}
   if(dmg>1&&vnoise(x/14,y/14,d*3)>0.78)return vnoise(x/5,y/5,2)>0.5?'em':'sc';
   if(v==='a'||v==='b'){const pw=30,ph2=18;{const row=Math.floor(y/ph2),px=(x+row*7)%pw,py=y%ph2,id=hash(Math.floor((x+row*7)/pw),row,d);
    if(px<1||py<1)return v==='a'?'b':'dk';if(py<2)v=[v,0.18];if(id>0.8&&py>5&&py<12&&px>6&&px<pw-6&&(Math.floor(y)%3===0))return(Math.floor(x)%2)?'dk':'m';if(id<0.12&&px>10&&px<15&&py>6&&py<10)return'g';if((px>=2&&px<3||px>=pw-3&&px<pw-2)&&(py>=2&&py<3||py>=ph2-2&&py<ph2-1))return'm';
    v=Array.isArray(v)?[v[0],v[1]+(id-0.5)*0.16]:[v,(id-0.5)*0.16];}}
   const lights=(Math.floor(x/10)+Math.floor(y/10)+f)%9===0&&hash(Math.floor(x/10),Math.floor(y/10),d)>0.7&&((x%10)<2.5&&(y%10)<2.5);if(lights&&v!=='em')return'g';return v;};
  fr.push(paint(W2,H2,fn,M,{R:24,r:6,rim:fin?'#ff8aa0':'#cfe4ff'}));}frames.push(fr);}
 return {frames,W:W2,H:H2};}

// ================= MARA ON FOOT: 40x56 art (20x28 logical) =================
const MM=MAT({suit:['#3866cc'],suit2:['#284c9c'],arm:['#d6deee'],helm:['#dfe5f2'],vis:['#62f0ff',{e:1,li:'#ffffff'}],boot:['#2c2c3c'],gun:['#6c7290'],gunl:['#86dcff',{e:1}],scarf:['#ff8c3a'],pack:['#5c6274'],belt:['#1c2034']});
const AIMS=[-Math.PI/2,-Math.PI/4,0,Math.PI/4];
function leg(hx,hy,a,b){const kx=hx+Math.sin(a)*9,ky=hy+Math.cos(a)*9,fx=kx+Math.sin(a-b)*9,fy=ky+Math.cos(a-b)*9;return[kx,ky,fx,fy];}
function maraPose(P){const hip=[19+P.lean*2,35+P.dy],sh=[20+P.lean*4,24+P.dy],head=[21+P.lean*5,14+P.dy+(P.headDy||0)];
 const L1=leg(hip[0],hip[1],P.l1[0],P.l1[1]),L2=leg(hip[0],hip[1],P.l2[0],P.l2[1]);const aim=P.aim,dx=Math.cos(aim),dy=Math.sin(aim);
 const hand=[sh[0]+dx*8,sh[1]+dy*8],tip=[hand[0]+dx*11,hand[1]+dy*11];const rot=P.rot||0,piv=[20,55];
 const fn=(X,Y)=>{let x=X,y=Y;if(rot){const c=Math.cos(-rot),s=Math.sin(-rot),ux=X-piv[0],uy=Y-piv[1];x=piv[0]+ux*c-uy*s;y=piv[1]+ux*s+uy*c;}
  // front: gun + front arm
  if(cap(x,y,hand[0]-dx*2,hand[1]-dy*2,tip[0],tip[1],1.7)){return sd(x,y,tip[0]-dx*2,tip[1]-dy*2,tip[0],tip[1])<1.6?'gunl':'gun';}
  if(cap(x,y,hand[0]+dx*3+dy*2,hand[1]+dy*3-dx*2,hand[0]+dx*3+dy*3.5,hand[1]+dy*3-dx*3.5,1.3))return'gun';
  if(cap(x,y,sh[0],sh[1],hand[0],hand[1],2.8))return sd(x,y,hand[0],hand[1],hand[0],hand[1])<2.2?'boot':(sd(x,y,sh[0],sh[1],sh[0],sh[1])<3.3?'arm':'suit');
  // head
  const hd=eld(x,y,head[0],head[1],7,7);if(hd<1){if(el(x,y,head[0]+3.2,head[1]+0.6,4.6,3.1))return x<head[0]+2.5&&y<head[1]?['vis',0.35]:'vis';if(Math.abs(x-head[0]+1.5)<1.1&&y<head[1]-1)return'suit';if(hd>0.82&&y>head[1]+2)return'suit2';return'helm';}
  // scarf (behind head, in front of torso)
  const sph=P.scarf||0;for(let k=0;k<3;k++){const sx=sh[0]-3-k*4,sy=sh[1]-3+Math.sin(sph+k*1.1)*1.6+k*0.8;if(el(x,y,sx,sy,2.8-k*0.5,1.8))return'scarf';}
  if(el(x,y,sh[0],sh[1]-2.5,4.2,2.2))return'scarf';
  // torso
  if(cap(x,y,sh[0],sh[1]+1,hip[0],hip[1]-1,5)){if(Math.abs(y-(hip[1]-1.5))<1.1)return'belt';if(el(x,y,sh[0]+1.5,sh[1]+3,3.6,3.4))return'arm';return'suit';}
  // front leg
  const lg=(L,dark)=>{if(cap(x,y,L[2],L[3],L[2]+2.6,L[3]+0.4,2.2)||cap(x,y,L[0],L[1],L[2],L[3],2.3)&&sd(x,y,L[2],L[3],L[2],L[3])<3.2)return dark?['boot',-0.15]:'boot';
   if(cap(x,y,L[0],L[1],L[2],L[3],2.2))return dark?'suit2':'suit';if(el(x,y,L[0],L[1],2.6,2.6))return dark?'suit2':'arm';if(cap(x,y,hip[0],hip[1],L[0],L[1],2.8))return dark?'suit2':'suit';return 0;};
  let v=lg(L1,false);if(v)return v;
  if(rr(x,y,sh[0]-10+P.lean*2,sh[1]-1,sh[0]-4,sh[1]+11,1.5))return y>sh[1]+8?'belt':'pack';
  v=lg(L2,true);if(v)return v;return 0;};
 return{c:paint(40,56,fn,MM,{R:3,rim:'#a8e8ff'}),tip:[(tip[0]-20)/2,(tip[1]-56)/2]};}
function maraSet(){const S={idle:[],run:[],rise:[],fall:[],land:[],hit:null,death:[],tips:[]};
 for(let a=0;a<4;a++){const aim=AIMS[a];S.idle.push([]);S.run.push([]);
  for(let f=0;f<4;f++){const br=[0,0.5,1,0.5][f];const r=maraPose({lean:0,dy:br*0.6,headDy:br*0.3,l1:[0.12,0.05],l2:[-0.1,0.05],aim,scarf:f*1.6});S.idle[a].push(r.c);if(f===0)S.tips.push(r.tip);}
  for(let f=0;f<8;f++){const p=f/8*Math.PI*2,bob=-Math.abs(Math.sin(p))*1.4+0.8;
   const lg=q=>[Math.sin(q)*0.75,0.25+0.95*Math.max(0,Math.cos(q+0.6))];S.run[a].push(maraPose({lean:0.35,dy:bob,l1:lg(p),l2:lg(p+Math.PI),aim,scarf:p}).c);}
  S.rise.push(maraPose({lean:0.1,dy:-1,l1:[0.9,1.5],l2:[0.1,1.0],aim,scarf:2}).c);
  S.fall.push(maraPose({lean:-0.1,dy:-1,l1:[0.35,0.35],l2:[-0.35,0.5],aim,scarf:4}).c);
  S.land.push(maraPose({lean:0.2,dy:3.5,l1:[0.9,1.6],l2:[-0.2,1.3],aim,scarf:1}).c);}
 S.hit=maraPose({lean:-0.7,dy:0,headDy:1,l1:[0.5,0.6],l2:[-0.4,0.4],aim:-Math.PI*0.75,scarf:3}).c;
 for(let f=0;f<4;f++)S.death.push(maraPose({lean:-0.4,dy:f*1.2,l1:[0.3+f*0.2,0.9],l2:[-0.2,0.7],aim:-Math.PI*0.8+f*0.2,rot:-f*0.45,scarf:f}).c);
 S.hitW=white(S.idle[2][0]);return S;}

// ================= PLATFORMER ENEMIES =================
const PM=MAT({sh:['#d0405e'],sh2:['#8a2040'],leg:['#3a1a2a'],ey:['#ffe07a',{e:1}],tm:['#8a92a8'],tm2:['#5a6078'],tb:['#3a3e52'],tl:['#ff6a5a',{e:1}],
 fw:['#b080f0'],fb:['#6a3ab0'],fg:['#ff9aff',{e:1}]});
function crawler(f){const st=f/4*Math.PI*2;return paint(40,22,(x,y)=>{
 if(el(x,y,30,10,2,2))return'ey';if(el(x,y,25.5,10.5,1.6,1.6))return'ey';
 if(el(x,y,19,11,15,8.5)&&y<15){const t=eld(x,y,19,11,15,8.5);if(Math.abs(x-12)<0.6||Math.abs(x-20)<0.6)return'sh2';return t>0.8&&y<9?['sh',0.15]:'sh';}
 if(el(x,y,30,12,6,5))return'sh2';
 for(let k=0;k<3;k++){const bx=10+k*8,ph=st+k*2.1,lx=bx+Math.sin(ph)*3,ly=21-Math.max(0,Math.cos(ph))*2;if(cap(x,y,bx,13,bx+1.5+Math.sin(ph)*1.5,17,1.2)||cap(x,y,bx+1.5+Math.sin(ph)*1.5,17,lx,ly,1.1))return'leg';}
 return 0;},PM,{R:4,rim:'#ffc0d0'});}
function turret(a){return paint(36,30,(x,y)=>{const cx=18,cy=13,dx=Math.cos(a),dy=Math.sin(a);
 if(cap(x,y,cx+dx*4,cy+dy*4,cx+dx*14,cy+dy*14,2))return sd(x,y,cx+dx*13,cy+dy*13,cx+dx*14,cy+dy*14)<2?'tb':'tm';
 const ed=eld(x,y,cx,cy,8,7);if(ed<1&&y<=cy+3){if(ed<0.35)return'tl';return Math.abs(y-cy+2)<0.6?'tm2':'tm';}
 if(rr(x,y,4,cy+2,32,29,2)){if(y<cy+5)return'tm2';if(Math.abs(x-cx)<6&&y>cy+8&&y<cy+12)return(Math.floor(x)%2)?'tl':'tb';return(y>26)?'tb':'tm';}return 0;},PM,{R:4,rim:'#d8e8ff'});}
function flyer(f){const fl=[1,0.4,-0.4,0.4][f];return paint(36,28,(x,y)=>{const ax=Math.abs(x-18);if(el(ax,y,2.2,13,1.6,1.8))return'fg';
 if(el(ax,y,0,13,4.5,6))return'fb';if(el(ax,y,0,20,2.6,4))return['fg',-0.2];const wy=10-fl*7;if(sd(ax,y,4,12,16,wy)<4.6-ax*0.16){return Math.abs(sd(ax,y,4,12,16,wy)-1.6)<0.45?'fb':'fw';}return 0;},PM,{R:3,rim:'#f0d8ff'});}
const BRP=[{a:'#e06a34',b:'#9a3a1e',c:'#ffd23a'},{a:'#c8a064',b:'#7a5a30',c:'#9aff5a'},{a:'#a060e0',b:'#5a2aa0',c:'#ff8aff'}];
function brute(d,f,atk){const P=BRP[d-1],M=MAT({a:[P.a],b:[P.b],c:[P.c,{e:1,li:'#ffffff'}],m:['#7a8090'],dk:['#2a2030']});const ph=f/4*Math.PI*2;
 return paint(104,92,(x,y)=>{const cx=52,bob=Math.abs(Math.sin(ph))*1.5,sx=0;
  const ex=atk?-26:0;
  // front arm
  const sA=[66,34+bob],hA=atk?[78,10]:[74+Math.sin(ph)*5,64+bob];if(cap(x,y,sA[0],sA[1],hA[0],hA[1],7))return'a';if(el(x,y,hA[0],hA[1],9,8))return'm';
  if(el(x,y,66,32+bob,10,8))return Math.abs(eld(x,y,66,32+bob,10,8)-0.7)<0.1?'dk':'m';if(el(x,y,36,33+bob,8,7))return['m',-0.15];
  if(cap(x,y,52,13+bob,46,4+bob,2.2)||cap(x,y,63,13+bob,69,4+bob,2.2))return'm';
  // head
  if(el(x,y,58,20+bob,10,9)){if(el(x,y,63,21+bob,2.6,2))return'c';if(el(x,y,54,21+bob,2.2,1.8))return'c';return y>24+bob?'b':'a';}
  // torso
  if(el(x,y,50,44+bob,26,22)){const ed=eld(x,y,52,46+bob,9,8);if(ed<1)return atk?['c',0.2]:(ed<0.6?'c':'b');if(Math.abs(x-52)<0.8||Math.abs(y-(56+bob))<0.8)return'dk';if(y>58+bob)return['b',0.05];if(y<34+bob&&Math.sin(x*0.4)>0.3)return'b';return'a';}
  // legs
  const lg=(hx,ph2,dark)=>{const lift=Math.max(0,Math.sin(ph2))*5,fx=hx+Math.cos(ph2)*6;if(el(x,y,(hx+fx)/2,74+bob-lift/2,6,4))return'm';if(cap(x,y,hx,62+bob,fx,86-lift,7))return dark?'b':'a';if(rr(x,y,fx-8,84-lift,fx+10,91-lift,2))return'dk';return 0;};
  let v=lg(56,ph,false);if(v)return v;
  const sB=[34,36+bob],hB=atk?[22,12]:[26-Math.sin(ph)*5,66+bob];if(cap(x,y,sB[0],sB[1],hB[0],hB[1],6.5))return'b';if(el(x,y,hB[0],hB[1],8,7))return['m',-0.15];
  v=lg(42,ph+Math.PI,true);if(v)return v;return 0;},M,{R:7,r:6,rim:'#ffe8c8'});}

// ================= EVASION top-down: 32x32 art (16 logical), 4 dirs x 4 frames =================
const VM=MAT({arm:['#e4eaf6'],suit:['#4a80ea'],helm:['#e8eef8'],vis:['#62f0ff',{e:1}],boot:['#2c2c3c'],scarf:['#ff8c3a'],pack:['#5c6274'],
 h1:['#d0405e'],h2:['#8a2040'],d1:['#ff8a3a'],d2:['#a04a1a'],dm:['#d8dce8'],i1:['#5ae08a'],i2:['#2a8a4a'],k1:['#a068f0'],k2:['#5a2aa0'],ey:['#ffe07a',{e:1}]});
function topdown(local,dir,f){const fn=(gx,gy)=>{const x=gx-16,y=gy-16;let lx,ly;if(dir===0){lx=x;ly=y;}else if(dir===1){lx=y;ly=-x;}else if(dir===2){lx=-x;ly=-y;}else{lx=-y;ly=x;}return local(lx,ly,f);};
 return paint(32,32,fn,VM,{R:4,r:2,rim:'#c8e0ff'});}
const maraTD=(x,y,f)=>{const s=[1,0,-1,0][f]*3.2;
 if(el(x,y,0,-3,4.8,4.8)){if(el(x,y,0,-6,3.6,2.1))return'vis';if(Math.abs(x)<0.9)return'suit';return'helm';}
 if(rr(x,y,-3.4,3,3.4,8.5,1.5))return'pack';
 if(el(x,y,0,1,7.4,3.6))return Math.abs(x)>4.5?'arm':'suit';
 if(cap(x,y,-6,1,-7+s*0.3,-3-s*0.4,1.7)||cap(x,y,6,1,7-s*0.3,-3+s*0.4,1.7))return'arm';
 if(cap(x,y,-2.6,4,-2.6,6-s,1.8))return y>5-s?'boot':'suit';if(cap(x,y,2.6,4,2.6,6+s,1.8))return y>5+s?'boot':'suit';
 if(cap(x,y,0,7,Math.sin(f*1.6)*2,12,1.3))return'scarf';return 0;};
const CH=[(x,y,f)=>{const p=[1,0,-1,0][f];// stalker: tissue beast with 4 legs
  if(el(Math.abs(x),y,2.4,-7,1.3,1.3))return'ey';if(el(x,y,0,-5,5,4))return'h2';if(el(x,y,0,2,6.6,7.4))return Math.abs(x)<0.8?'h2':'h1';
  for(const[s,o]of[[-1,p],[1,-p]]){if(cap(x,y,s*5,-2,s*10,-6+o*3,1.6)||cap(x,y,s*5,5,s*10,9-o*3,1.6))return'h2';}return 0;},
 (x,y,f)=>{const a=f/4*Math.PI/2;// cutter: spinning blade disc
  if(el(x,y,0,0,3,3))return'ey';if(el(x,y,0,0,6,6))return'd1';const r=Math.hypot(x,y),t=Math.atan2(y,x)+a;if(r<11&&(t%(Math.PI/2)+Math.PI*2)%(Math.PI/2)<0.5+((11-r)/11)*0.6)return r>8?'dm':'d2';return 0;},
 (x,y,f)=>{const p=Math.sin(f/4*Math.PI*2);// drifter: jelly with trailing tentacles
  if(el(Math.abs(x),y,2.2,-3,1.2,1.4))return'ey';if(el(x,y,0,-2,8+p*0.8,7-p*0.6))return eld(x,y,0,-2,8,7)>0.7?'i2':'i1';
  for(let k=-2;k<=2;k++)if(cap(x,y,k*3,4,k*3+Math.sin(f*1.5+k)*1.6,12,1))return'i2';return 0;},
 (x,y,f)=>{const p=[1,0,-1,0][f];// pincer: armoured bug with claws
  if(el(Math.abs(x),y,2,-5,1.1,1.1))return'ey';if(el(x,y,0,1,5,8))return Math.abs(y-2)<0.6||Math.abs(y+2)<0.6?'k2':'k1';
  for(const s of[-1,1]){if(cap(x,y,s*4,-5,s*7,-10+p*s,1.8))return'k1';if(cap(x,y,s*7,-10+p*s,s*3,-14,1.3))return'k2';if(cap(x,y,s*4,3,s*9,5+p*s*2,1))return'k2';}return 0;}];

// ================= PICKUPS, COINS, EXPLOSIONS =================
function pickup(col,glyph){const M=MAT({bz:['#3a4260'],bz2:['#232842'],gm:[col],sy:['#ffffff',{e:1}]});return paint(24,24,(x,y)=>{
 const gx=Math.floor((x-4.5)/3),gy=Math.floor((y-4.5)/3);if(gx>=0&&gy>=0&&gx<5&&gy<5&&glyph[gy][gx]!=='.')return'sy';
 if(rr(x,y,3,3,21,21,4))return'gm';if(rr(x,y,1,1,23,23,5))return(x+y)<22?'bz':'bz2';return 0;},M,{R:3,rim:'#ffffff',ol:'#05060c'});}
function hpPick(){const M=MAT({g:['#8aff5a'],w:['#ffffff',{e:1}],bz:['#2a5a2a']});return paint(20,20,(x,y)=>{if((Math.abs(x-10)<1.5&&Math.abs(y-10)<5)||(Math.abs(y-10)<1.5&&Math.abs(x-10)<5))return'w';
 if((Math.abs(x-10)<3.5&&Math.abs(y-10)<8)||(Math.abs(y-10)<3.5&&Math.abs(x-10)<8))return'g';if(rr(x,y,1,1,19,19,5))return'bz';return 0;},M,{R:3,rim:'#e0ffe0'});}
function coins(){const M=MAT({au:['#ffc21a',{sh:'#a86a00',li:'#fff4b0'}],au2:['#e09a10',{sh:'#a06400',li:'#ffe070'}],edge:['#c88a10',{sh:'#a06a00',li:'#ffd860'}]});const fr=[];
 for(let f=0;f<8;f++){const a=f/8*Math.PI,w=Math.max(1.1,8*Math.abs(Math.cos(a))),ew=Math.min(2,1+Math.abs(Math.sin(a))*1.2),dir=Math.cos(a)>=0?1:-1;
  fr.push(paint(18,18,(x,y)=>{const fx=x-9,fy=y-9;if(!el(fx,fy,0,0,w+ew*0.5,8))return 0;if(!el(fx,fy,-dir*ew*0.5,0,w,8))return'edge';
   const u=fx/w,v=fy/8;if(w>3){if(Math.abs(u)<0.55&&Math.abs(v)<0.55&&(Math.abs(u)+Math.abs(v)*0.5<0.5))return['au2',0.15];if(eld(fx,fy,0,0,w,8)>0.78)return['au',0.05];}
   const sheen=Math.abs(u+v*0.6-(f/4-1))<0.2;return['au',sheen?0.35:0];},M,{R:3,rim:'#fff8d0',ol:'#3a2400'}));}return fr;}
function explosion(pal){const P=pal.map(hx),fr=[];for(let f=0;f<8;f++){const t=(f+0.5)/8,c=mk(64,64,4),x=c.getContext('2d'),im=x.createImageData(64,64),d=im.data,R=8+22*Math.sqrt(t);
 for(let py=0;py<64;py++)for(let px=0;px<64;px++){const dx=px-32,dy=py-32,r=Math.hypot(dx,dy),n=vnoise(px/5,py/5,f*3)*0.6+vnoise(px/2.5,py/2.5,9)*0.4,rr2=r/R+(n-0.5)*0.55;
  if(rr2>1)continue;if(t>0.45&&n<(t-0.45)*1.6)continue;let band=rr2+t*0.9+(BY[(py&3)*4+(px&3)]/16-0.5)*0.15,ci;
  if(t>0.55&&rr2>0.5)ci=5;else ci=Math.min(4,Math.floor(band*3.2));const col=ci===5?mix([70,64,84],[30,28,40],rr2):P[ci];const i=(py*64+px)*4;d[i]=col[0];d[i+1]=col[1];d[i+2]=col[2];d[i+3]=ci===5?190:255;}
 x.putImageData(im,0,0);fr.push(c);}return fr;}

// ================= TILES (32x32 art = one 16px tile) =================
function tiles(pal,ceil,seed){const base=hx(pal[0]),dark=hx(pal[1]),top=hx(pal[2]);const out={ti:[],tt:[]};
 const sh=(c,k)=>k>=0?mix(c,[255,255,255],k):mix(c,[6,8,20],-k);
 const make=(v,isTop)=>{const c=mk(32,32,2),x=c.getContext('2d'),im=x.createImageData(32,32),d=im.data;
  for(let y=0;y<32;y++)for(let X=0;X<32;X++){let col,k=0;const b=(BY[(y&3)*4+(X&3)]/16-0.5)*0.08;
   if(ceil){// riveted metal panels
    const px=X%16,py=y%16,edge=px===0||py===0?0.22:px===15||py===15?-0.35:0;k=edge+(vnoise(X/6,y/6,seed+v)-0.5)*0.12;
    if((px===3||px===12)&&(py===3||py===12))k=0.35;if((px===4||px===13)&&(py===4||py===13))k=-0.4;
    if(v===1&&X>5&&X<27&&y>8&&y<24&&y%4<2)k=-0.45;if(v===2&&Math.abs(X-y-4)<1.2&&X>8&&X<24)k=-0.4;
    if(v===3&&y>12&&y<18){col=((X+y)%8<4)?[230,190,40]:[30,30,40];}
    col=col||sh(base,k+b);}
   else{// stone blocks with mortar, moss and cracks
    const row=Math.floor(y/11),off=(row%2)*9,bx=Math.floor((X+off)/16),lx=(X+off)%16,ly=y%11;
    if(lx===0||ly===0)col=sh(dark,-0.2);else{k=(lx===1||ly===1?0.18:0)+(lx===15||ly===10?-0.25:0)+(vnoise(X/4,y/4,seed+v*7+bx)-0.5)*0.35;
     if(v===2&&Math.abs((X-y*0.6)-8)<0.9&&y>6&&y<26)k=-0.5;if(v===1&&vnoise(X/2,y/2,seed+3)>0.82)k=-0.35;col=sh(base,k+b);}}
   if(isTop){const gh=ceil?3:4+Math.floor(vnoise(X/2.3,1,seed+v)*4);if(y<gh){col=sh(top,(y===0?0.35:0)-y*0.08+b);}else if(y===gh)col=sh(top,-0.55);
    else if(!ceil&&y<gh+3&&hash(X,v,seed)>0.7)col=sh(top,-0.3);}
   const i=(y*32+X)*4;d[i]=col[0];d[i+1]=col[1];d[i+2]=col[2];d[i+3]=255;}
  x.putImageData(im,0,0);return c;};
 for(let v=0;v<4;v++)out.ti.push(make(v,false));for(let v=0;v<3;v++)out.tt.push(make(v,true));return out;}

// ================= HACK BLOCKS (24x24 art = 12px cell) =================
function hackBlock(col,k){const base=hx(col),c=mk(24,24,2),x=c.getContext('2d'),im=x.createImageData(24,24),d=im.data,sd2=k.charCodeAt(0);
 for(let y=0;y<24;y++)for(let X=0;X<24;X++){let cc;const e=Math.min(X,y,23-X,23-y);
  if(e===0)cc=[6,8,16];else if(e<3)cc=mix(base,X+y<23?[255,255,255]:[0,0,20],X+y<23?0.45-e*0.1:0.45);
  else{const ix=X-3,iy=y-3;cc=mix(base,[6,10,30],0.55);const tr=(ix===4||iy===13||(ix===13&&iy<9)||(iy===4&&ix>4))&&hash(ix>>2,iy>>2,sd2)>0.25;
   if(tr)cc=mix(base,[255,255,255],0.15);if((ix===4&&iy===4)||(ix===13&&iy===13)||(ix===13&&iy===4))cc=[255,255,255];
   if(ix>=7&&ix<=10&&iy>=7&&iy<=10)cc=(ix===7||iy===7)?mix(base,[255,255,255],0.6):mix(base,[0,0,0],0.2);}
  const i=(y*24+X)*4;d[i]=cc[0];d[i+1]=cc[1];d[i+2]=cc[2];d[i+3]=255;}
 x.putImageData(im,0,0);return c;}

// ================= build all (bosses lazily) =================
const A={};
A.ship=[-2,-1,0,1,2].map(shipFrame);A.shipW=white(A.ship[2]);A.flame=[0,1,2,3].map(flame);
A.en={drone:[0,1,2,3].map(drone),weaver:[0,1,2,3].map(weaver),gun:[0,1,2,3].map(gunship),kami:[0,1,2,3].map(kami)};A.enW={};for(const k in A.en)A.enW[k]=white(A.en[k][0]);
A.rock=[];for(let f=0;f<8;f++)A.rock.push(rockF(f,2.3));A.rockW=white(A.rock[0]);
A.mara=maraSet();
A.pe={crawler:[0,1,2,3].map(crawler),turret:[],flyer:[0,1,2,3].map(flyer)};for(let i=0;i<8;i++)A.pe.turret.push(turret(i/8*Math.PI*2));A.peW={};for(const k in A.pe)A.peW[k]=white(A.pe[k][0]);
const BR={};A.brute=d=>{if(BR[d])return BR[d];const walk=[0,1,2,3].map(f=>brute(d,f,false)),atk=[brute(d,0,true),brute(d,1,true)];return BR[d]={walk,atk,W:white(walk[0])};};
A.td={mara:[0,1,2,3].map(dir=>[0,1,2,3].map(f=>topdown(maraTD,dir,f))),ch:CH.map(fn=>[0,1,2,3].map(dir=>[0,1,2,3].map(f=>topdown(fn,dir,f))))};
A.tdW=A.td.ch.map(c=>white(c[0][0]));
A.coin=coins();A.hp=hpPick();A.pickup=pickup;
A.boom=explosion(['#ffffff','#fff09a','#ffb43a','#ff5a2a','#a02030']);A.boomB=explosion(['#ffffff','#c8f8ff','#5ad0ff','#3a6aff','#2a2a8a']);
const BS={};A.boss=(d,fin)=>{const k=fin?'f':d;return BS[k]||(BS[k]=boss(d,fin));};
const TL={};A.tiles=(pal,ceil,seed)=>{const k=pal.join()+ceil;return TL[k]||(TL[k]=tiles(pal,ceil,seed));};
const HB={};A.hack=(col,k)=>HB[k]||(HB[k]=hackBlock(col,k));
A.white=white;return A;})();
