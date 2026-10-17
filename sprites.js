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

// ---- alternate hulls for the hangar loadouts (same 72x76 canvas and pivot as the Kestrel) ----
const WISPM=MAT({hull:['#dfe2ec'],hull2:['#b4bacb'],trim:['#ff7a2a'],dark:['#2a2433'],metal:['#8a8090'],gl:['#ffb03a',{li:'#fff4d8'}],glh:['#fffaf0',{e:1}],lite:['#ffd27a',{e:1}],red:['#ffb43a',{e:1}]});
const BULM=MAT({hull:['#a9b49c'],hull2:['#808c76'],trim:['#4ab04a'],dark:['#20281e'],metal:['#6a7266'],gl:['#3ad08a',{li:'#e0fff0'}],glh:['#f0fff4',{e:1}],lite:['#9aff5a',{e:1}],red:['#ffb43a',{e:1}]});
function wispFrame(b){const cx=36;return paint(72,76,(x,y)=>{const sx=x-cx-b*2.2,side=sx<0?-1:1,ax=Math.abs(sx)/(1-0.2*b*side),shade=b*side*0.12;
 const fw=y<2?0:y<62?Math.min(4.6,(y-1)*0.3+0.8):y<70?4.6-(y-62)*0.4:0;
 if(el(ax,y,0,24,2.4,7))return ax<0.9&&y>19&&y<24?'glh':['gl',shade];
 if(ax<=fw){if(ax<0.9&&y>34&&y<60)return'trim';if(Math.abs(y-40)<0.7||Math.abs(y-52)<0.7)return'dark';return[y>44?'hull2':'hull',shade];}
 if(poly(ax,y,[[4,40],[27,30],[30,32],[9,52],[4,54]])){if(sd(ax,y,4,40,27,30)<1.6)return['trim',shade];if(Math.abs(ax-16)<0.6&&y>38)return'dark';return['hull',shade];}
 if(ax>26&&ax<30&&y>29&&y<33.5)return'lite';
 if(poly(ax,y,[[3.5,58],[11,66],[11,72],[3.5,68]]))return['hull2',shade];
 if(ax>=5&&ax<=8&&y>=56&&y<=68)return y>65?'dark':['metal',shade];return 0;},WISPM,{R:5});}
function bulwarkFrame(b){const cx=36;return paint(72,76,(x,y)=>{const sx=x-cx-b*2.8,side=sx<0?-1:1,ax=Math.abs(sx)/(1-0.24*b*side),shade=b*side*0.12;
 const fw=y<10?0:y<20?(y-10)*0.9+3:y<64?12:y<70?12-(y-64)*1.2:0;
 if(el(ax,y,0,27,4.6,6))return(ax<1.6&&y>23&&y<27)?'glh':['gl',shade];
 if(ax<=fw){if(Math.abs(y-38)<0.8||Math.abs(y-50)<0.8)return'dark';if(ax>9&&y>40&&y<62&&Math.floor(y/3)%2)return'dark';if(ax<1.2&&y>34)return'trim';return[(y>40)?'hull2':'hull',shade];}
 if(rr(ax,y,15,30,27,68,3)){if(y>64)return'dark';if(ax>17&&ax<25&&y>36&&y<40)return'lite';if(Math.abs(y-48)<0.8||Math.abs(y-58)<0.8)return'dark';return['metal',shade+(ax<20?0.08:-0.06)];}
 if(poly(ax,y,[[12,36],[15,34],[15,56],[12,60]]))return['trim',shade];
 if(poly(ax,y,[[27,44],[34,50],[34,58],[27,60]]))return['hull',shade];return 0;},BULM,{R:7});}
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
    if(el(ax,y,40,cy-14,26,14))return'b';if(poly(ax,y,[[18,cy+36],[26,cy+66],[30,cy+38]]))return'm';return 0;}
   if(kind===1){// Cinder Maw: wide furnace jaw with teeth
    if(poly(ax,y,[[0,6],[60,14],[120,42],[136,72],[110,100],[70,96],[0,120]])){if(y>cy+30&&ax<66)return['em',(y-cy-30)*-0.02];if(Math.abs(y-cy+22)<1.5||Math.abs(ax-60)<1.2)return'b';return'a';}
    if(poly(ax,y,[[0,118],[60,96],[50,112],[30,130],[0,140]]))return'b';if(rr(ax,y,100,60,130,80,4))return'm';return 0;}
   if(kind===2){// Mothership: saucer with hangar bays
    if(el(ax,y,0,cy,150,30)){if(Math.abs(eld(ax,y,0,cy,150,30)-0.8)<0.05)return'b';if(y>cy+8&&Math.floor(ax/22)%2===0&&ax>30)return y>cy+14?'em':'dk';return'a';}
    if(el(ax,y,0,cy-18,58,32))return y<cy-40&&ax<26?'m':'a';if(el(ax,y,0,cy+30,40,22))return'b';return 0;}
   if(kind===3){// Rift Warden: spiked diamond with blades
    if(poly(ax,y,[[0,4],[50,40],[70,cy],[44,130],[0,160]])){if(Math.abs(ax-24)<1.2||Math.abs(y-cy)<1.4)return'b';return'a';}
    if(poly(ax,y,[[60,100],[130,140],[70,124]]))return'b';return 0;}
   // Void Heart: pulsing organic heart with tendrils
   const pul=1+Math.sin(ph)*0.04;const hx2=ax/pul,hy=(y-cy)/pul;
   const heart=el(hx2,hy,28,-10,44,44)||poly(hx2,hy,[[0,94],[70,10],[0,-20]]);
   if(heart){const v=vnoise(x/9,y/9,5);const ed=Math.hypot(hx2,hy+10)/80;if(Math.abs(Math.sin((hx2*0.08+hy*0.05)*3+v*4))<0.1)return'flesh2';return['flesh',v*0.25-ed*0.2];}
   for(let k=-2;k<=2;k++){if(poly(x-cx-k*18,y,[[-5,cy-62+Math.abs(k)*8],[0,cy-90+Math.abs(k)*10],[5,cy-62+Math.abs(k)*8]]))return'dk';}return 0;};
  const fn=(x,y)=>{const c=core(x,y);if(c)return c;let v=body(x,y);if(!v)return 0;
   for(const[qx,qy,a]of cracks){const t=Math.abs((x-qx)*Math.sin(a)-(y-qy)*Math.cos(a)),u=(x-qx)*Math.cos(a)+(y-qy)*Math.sin(a);if(t<1.1+Math.sin(u*0.4)*0.6&&Math.abs(u)<18)return dmg>1&&t<0.6?'em':'sc';}
   if(dmg>1&&vnoise(x/14,y/14,d*3)>0.78)return vnoise(x/5,y/5,2)>0.5?'em':'sc';
   if(v==='a'||v==='b'){const pw=30,ph2=18;{const row=Math.floor(y/ph2),px=(x+row*7)%pw,py=y%ph2,id=hash(Math.floor((x+row*7)/pw),row,d);
    if(px<1||py<1)return v==='a'?'b':'dk';if(py<2)v=[v,0.18];if(id>0.8&&py>5&&py<12&&px>6&&px<pw-6&&(Math.floor(y)%3===0))return(Math.floor(x)%2)?'dk':'m';if(id<0.12&&px>10&&px<15&&py>6&&py<10)return'g';if((px>=2&&px<3||px>=pw-3&&px<pw-2)&&(py>=2&&py<3||py>=ph2-2&&py<ph2-1))return'm';
    v=Array.isArray(v)?[v[0],v[1]+(id-0.5)*0.16]:[v,(id-0.5)*0.16];}}
   const lights=(Math.floor(x/10)+Math.floor(y/10)+f)%9===0&&hash(Math.floor(x/10),Math.floor(y/10),d)>0.7&&((x%10)<2.5&&(y%10)<2.5);if(lights&&v!=='em')return'g';return v;};
  fr.push(paint(W2,H2,fn,M,{R:24,r:6,rim:fin?'#ff8aa0':'#cfe4ff'}));}frames.push(fr);}
 // ---- independently moving parts (drawn over the body at runtime; mask uses the rest pose) ----
 const cx=W2/2,cy=H2*0.45,PD=[];
 if(kind===0)PD.push({fn:(ax,y)=>{const t=eld(ax,y,62,cy+18,62,44);if(t<1&&t>0.66&&y>cy-10&&ax>34){if(y>cy+40&&ax>90)return'm';return Math.abs(t-0.83)<0.03?'b':'a';}return 0;},bb:[30,cy-30,128,cy+66],pv:[40,cy+6],mo:(t,s)=>({a:s*0.22*Math.sin(t*2.2)})});
 if(kind===1)PD.push({center:1,fn:(dx,y)=>{const ax=Math.abs(dx);if(!rr(ax,y,0,cy+28,64,cy+54,5))return 0;if(y<cy+37)return Math.sin(ax*0.35+0.8)>0?['m',(cy+37-y)*0.05]:0;if(Math.abs(y-cy-44)<1)return'dk';return ax%16<1?'b':'a';},bb:[-66,cy+26,66,cy+56],pv:[0,cy+28],mo:t=>({dy:(1+Math.sin(t*3))*4})});
 if(kind===2)PD.push({fn:(ax,y)=>{const px=40,py=cy-24;if(cap(ax,y,px,py,px,py+16,2.6))return sd(ax,y,px,py+15,px,py+16)<2.6?'g':'m';if(el(ax,y,px,py,9,8))return y<py-2?'m':'dk';return 0;},bb:[28,cy-34,52,cy-4],pv:[40,cy-24],mo:(t,s,aim)=>({a:aim})});
 if(kind===3)PD.push({fn:(ax,y)=>poly(ax,y,[[60,50],[166,30],[140,64],[78,90]])?(sd(ax,y,60,50,166,30)<3?'m':(Math.abs(sd(ax,y,70,70,150,46)-6)<1?'dk':'b')):0,bb:[56,26,168,92],pv:[62,62],mo:(t,s)=>({a:s*0.18*Math.sin(t*1.7)})});
 if(kind===4)PD.push({fn:(ax,y)=>{for(let k=0;k<4;k++){const bx=46+k*16,by=cy+10+k*14;if(cap(ax,y,bx,by,bx+70,by+40-k*6,6-(k*0.7)))return Math.abs(sd(ax,y,bx,by,bx+70,by+40-k*6)-2)<0.6?'flesh2':(k%2?'flesh2':'flesh');}return 0;},bb:[38,cy+2,130,cy+66],pv:[44,cy+14],mo:(t,s)=>({a:s*0.13*Math.sin(t*2.1)})});
 const parts=PD.map(P=>{const[x0,y0,x1,y1]=P.bb,w=Math.ceil(x1-x0),h=Math.ceil(y1-y0);const imgs=[0,1,2].map(dmg=>{const r=paint(w,h,(lx,ly)=>{const v=P.fn(x0+lx,y0+ly);if(!v)return 0;if(dmg>0&&vnoise((x0+lx)/9,(y0+ly)/9,d*5+1)>(dmg>1?0.7:0.84))return dmg>1&&vnoise(lx/4,ly/4,4)>0.5?'em':'sc';return v;},M,{R:10,r:6,rim:fin?'#ff8aa0':'#cfe4ff'});
   if(P.center)return{R:r};const l=mk(w,h,6),lx=l.getContext('2d');lx.translate(w,0);lx.scale(-1,1);lx.drawImage(r,0,0);return{R:r,L:l};});
  return{imgs,w,h,center:!!P.center,pvx:P.pv[0]-x0,pvy:P.pv[1]-y0,ax:P.pv[0],ay:P.pv[1],mo:P.mo};});
 // rest-pose composite for the collision mask
 const rest=mk(W2,H2,6),rc=rest.getContext('2d');rc.drawImage(frames[0][0],0,0);for(const p of parts){if(p.center)rc.drawImage(p.imgs[0].R,cx+(p.ax)-p.pvx,p.ay-p.pvy);else{rc.drawImage(p.imgs[0].R,cx+p.ax-p.pvx,p.ay-p.pvy);rc.drawImage(p.imgs[0].L,cx-p.ax-(p.w-p.pvx),p.ay-p.pvy);}}
 return {frames,parts,rest,W:W2,H:H2,cx,cy:cy+6};}

// ================= MARA ON FOOT: 40x56 art (20x28 logical) =================
const MM=MAT({suit:['#3866cc'],suit2:['#284c9c'],arm:['#d6deee'],helm:['#dfe5f2'],vis:['#62f0ff',{e:1,li:'#ffffff'}],boot:['#2c2c3c'],gun:['#6c7290'],gunl:['#86dcff',{e:1}],scarf:['#ff8c3a'],pack:['#5c6274'],belt:['#1c2034']});
const AIMS=[-Math.PI/2,-Math.PI/4,0,Math.PI/4];
function leg(hx,hy,a,b){const kx=hx+Math.sin(a)*9,ky=hy+Math.cos(a)*9,fx=kx+Math.sin(a-b)*9,fy=ky+Math.cos(a-b)*9;return[kx,ky,fx,fy];}
function maraPose(P){const hip=[19+P.lean*2,35+P.dy],sh=[20+P.lean*4,24+P.dy],head=[21+P.lean*5,14+P.dy+(P.headDy||0)];
 const L1=leg(hip[0],hip[1],P.l1[0],P.l1[1]),L2=leg(hip[0],hip[1],P.l2[0],P.l2[1]);const aim=P.aim,dx=Math.cos(aim),dy=Math.sin(aim);
 const hand=[sh[0]+dx*8,sh[1]+dy*8],tip=[hand[0]+dx*11,hand[1]+dy*11];const rot=P.rot||0,piv=P.piv||[20,55];
 const ba=P.bat===undefined?aim:P.bat,bx=Math.cos(ba),by=Math.sin(ba),bt=[hand[0]+bx*15,hand[1]+by*15];
 const fn=(X,Y)=>{let x=X,y=Y;if(rot){const c=Math.cos(-rot),s=Math.sin(-rot),ux=X-piv[0],uy=Y-piv[1];x=piv[0]+ux*c-uy*s;y=piv[1]+ux*s+uy*c;}
  // front: gun + front arm
  if(P.baton){// shock baton: glove over the grip, guard ring, dark shaft, glowing tip with coil bands
   if(Math.hypot(x-hand[0],y-hand[1])<2.3)return'boot';
   if(cap(x,y,hand[0]+bx*1.6-by*2.4,hand[1]+by*1.6+bx*2.4,hand[0]+bx*1.6+by*2.4,hand[1]+by*1.6-bx*2.4,0.9))return'belt';
   if(cap(x,y,hand[0]-bx*3,hand[1]-by*3,bt[0],bt[1],1.25)){const u=(x-hand[0])*bx+(y-hand[1])*by;if(u>10.5)return(u>13.6?'gunl':(Math.floor(u*1.2)%2?'gunl':'gun'));if(u<-1.5)return'belt';return Math.abs((x-hand[0])*-by+(y-hand[1])*bx)<0.35?['gun',0.25]:'gun';}}
  else{if(cap(x,y,hand[0]-dx*2,hand[1]-dy*2,tip[0],tip[1],1.7)){return sd(x,y,tip[0]-dx*2,tip[1]-dy*2,tip[0],tip[1])<1.6?'gunl':'gun';}
  if(cap(x,y,hand[0]+dx*3+dy*2,hand[1]+dy*3-dx*2,hand[0]+dx*3+dy*3.5,hand[1]+dy*3-dx*3.5,1.3))return'gun';}
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
 const K=P.K||MK,pad=P.pad||0,padT=P.padT||0,det=(X,Y)=>{const x=X/K-pad,y=Y/K-padT;let ux=x,uy=y;if(rot){const c=Math.cos(-rot),s2=Math.sin(-rot),vx=x-piv[0],vy=y-piv[1];ux=piv[0]+vx*c-vy*s2;uy=piv[1]+vx*s2+vy*c;}
  const v=fn(x,y);if(!v)return 0;const m=Array.isArray(v)?v[0]:v;
  // extra detail at the larger size: helmet antenna light, knee pads, glove cuffs, belt pouch, boot soles, suit seams
  if(m==='helm'&&Math.abs(ux-(head[0]-4.2))<0.5&&uy<head[1]-3)return'gunl';
  if(m==='suit'&&(Math.abs(ux-sh[0]-0.5)<0.28&&uy>sh[1]+2&&uy<hip[1]-2))return'suit2';
  if(m==='belt'&&ux>hip[0]-1&&ux<hip[0]+2.2)return'pack';
  if(m==='boot'&&(uy>54.3||Math.abs(uy-(L1[3]+1.6))<0.25))return'belt';
  if((m==='suit'||m==='suit2')&&(Math.hypot(ux-L1[0],uy-L1[1])<2.1||Math.hypot(ux-L2[0],uy-L2[1])<2.1))return m==='suit'?'arm':['arm',-0.25];
  return v;};
 return{c:paint(Math.round((40+2*pad)*K),Math.round((56+padT)*K),det,MM,{R:4,rim:'#a8e8ff'}),tip:[(tip[0]-20)*K/2,(tip[1]-56)*K/2]};}
const MK=1.65;
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
 S.crouch=[];for(let f=0;f<2;f++)S.crouch.push(maraPose({lean:0.25,dy:12+f*0.5,headDy:0.3*f,l1:[1.5,0.5],l2:[0.9,2.47],aim:0.38,scarf:f*1.6}).c);
 S.crouchShoot=maraPose({lean:0.05,dy:12,l1:[1.5,0.5],l2:[0.9,2.47],aim:0.38,scarf:3}).c;
 S.hitW=white(S.idle[2][0]);return S;}

// ================= PLATFORMER ENEMIES =================
const PM=MAT({sh:['#d0405e'],sh2:['#8a2040'],leg:['#3a1a2a'],ey:['#ffe07a',{e:1}],tm:['#8a92a8'],tm2:['#5a6078'],tb:['#3a3e52'],tl:['#ff6a5a',{e:1}],
 fw:['#b080f0'],fb:['#6a3ab0'],fg:['#ff9aff',{e:1}]});
function crawler(f,hit){const st=f/4*Math.PI*2;return paint(40,22,(X,Y)=>{let x=X,y=Y;
 if(hit){y=Y+1.5-(X-20)*0.12;
  if(sd(X,Y,28,8,32,12)<0.8||sd(X,Y,32,8,28,12)<0.8)return'tm';if(sd(X,Y,23.5,9,27,12)<0.7||sd(X,Y,27,9,23.5,12)<0.7)return'tm';
  if(el(x,y,19,11,15,8.5)&&y<15&&Math.abs(x-16+(y-6)*0.8)<0.6&&y<12)return'leg';
  if(!(el(x,y,19,11,15,8.5)&&y<15)&&!el(x,y,30,12,6,5)){for(let k=0;k<3;k++){const bx=10+k*8,ang=-0.6+k*0.6;if(cap(X,Y,bx,15,bx+Math.sin(ang)*7,21,1.2))return'leg';}return 0;}}
 if(!hit){if(el(x,y,30,10,2,2))return'ey';if(el(x,y,25.5,10.5,1.6,1.6))return'ey';}
 if(el(x,y,19,11,15,8.5)&&y<15){const t=eld(x,y,19,11,15,8.5);if(Math.abs(x-12)<0.6||Math.abs(x-20)<0.6)return'sh2';return t>0.8&&y<9?['sh',0.15]:'sh';}
 if(el(x,y,30,12,6,5))return'sh2';
 for(let k=0;k<3;k++){const bx=10+k*8,ph=st+k*2.1,lx=bx+Math.sin(ph)*3,ly=21-Math.max(0,Math.cos(ph))*2;if(cap(x,y,bx,13,bx+1.5+Math.sin(ph)*1.5,17,1.2)||cap(x,y,bx+1.5+Math.sin(ph)*1.5,17,lx,ly,1.1))return'leg';}
 return 0;},PM,{R:4,rim:'#ffc0d0'});}
function turret(a,hit){const rl=hit?9:14;return paint(36,30,(x,y)=>{const cx=18,cy=13+(hit?1:0),dx=Math.cos(a),dy=Math.sin(a);
 if(cap(x,y,cx+dx*4,cy+dy*4,cx+dx*rl,cy+dy*rl,2))return sd(x,y,cx+dx*(rl-1),cy+dy*(rl-1),cx+dx*rl,cy+dy*rl)<2?'tb':'tm';
 const ed=eld(x,y,cx,cy,8,7);if(ed<1&&y<=cy+3){if(hit&&(Math.abs(x-cx-(y-cy)*0.7)<0.6||Math.abs(x-cx+2+(y-cy)*-0.9)<0.5))return'tb';if(ed<0.35)return hit?'tb':'tl';return Math.abs(y-cy+2)<0.6?'tm2':'tm';}
 if(rr(x,y,4,cy+2,32,29,2)){if(y<cy+5)return'tm2';if(Math.abs(x-cx)<6&&y>cy+8&&y<cy+12)return(Math.floor(x)%2)?'tl':'tb';return(y>26)?'tb':'tm';}return 0;},PM,{R:4,rim:'#d8e8ff'});}
function flyer(f,hit){const fl=hit?1.9:[1,0.4,-0.4,0.4][f];return paint(36,28,(X,Y)=>{const x=hit?18+(X-18)*0.97+(Y-14)*0.25:X,y=hit?Y+2:Y;const ax=Math.abs(x-18);if(el(ax,y,2.2,13,1.6,1.8))return hit?(sd(ax,y,1,12,3.4,14)<0.6?'fb':0)||'fw':'fg';
 if(el(ax,y,0,13,4.5,6))return'fb';if(el(ax,y,0,20,2.6,4))return['fg',-0.2];const wy=10-fl*7;if(sd(ax,y,4,12,16,wy)<4.6-ax*0.16){return Math.abs(sd(ax,y,4,12,16,wy)-1.6)<0.45?'fb':'fw';}return 0;},PM,{R:3,rim:'#f0d8ff'});}
const BRP=[{a:'#e06a34',b:'#9a3a1e',c:'#ffd23a'},{a:'#c8a064',b:'#7a5a30',c:'#9aff5a'},{a:'#a060e0',b:'#5a2aa0',c:'#ff8aff'}];
function brute(d,f,atk,hit){const P=BRP[d-1],M=MAT({a:[P.a],b:[P.b],c:[P.c,{e:1,li:'#ffffff'}],m:['#7a8090'],dk:['#2a2030']});const ph=f/4*Math.PI*2;
 return paint(104,92,(X,y)=>{const x=hit?X+(84-y)*0.16:X,cx=52,bob=Math.abs(Math.sin(ph))*1.5,sx=0;
  const ex=atk?-26:0;
  // front arm
  const sA=[66,34+bob],hA=hit?[84,28]:atk?[78,10]:[74+Math.sin(ph)*5,64+bob];if(cap(x,y,sA[0],sA[1],hA[0],hA[1],7))return'a';if(el(x,y,hA[0],hA[1],9,8))return'm';
  if(el(x,y,66,32+bob,10,8))return Math.abs(eld(x,y,66,32+bob,10,8)-0.7)<0.1?'dk':'m';if(el(x,y,36,33+bob,8,7))return['m',-0.15];
  if(cap(x,y,52,13+bob,46,4+bob,2.2)||cap(x,y,63,13+bob,69,4+bob,2.2))return'm';
  // head
  if(el(x,y,58,20+bob,10,9)){if(hit){if(sd(x,y,60,21+bob,66,21+bob)<0.9||sd(x,y,52,21+bob,56,21+bob)<0.9)return'dk';if(el(x,y,60,26+bob,3,2))return'dk';}else{if(el(x,y,63,21+bob,2.6,2))return'c';if(el(x,y,54,21+bob,2.2,1.8))return'c';}return y>24+bob?'b':'a';}
  // torso
  if(el(x,y,50,44+bob,26,22)){const ed=eld(x,y,52,46+bob,9,8);if(ed<1)return atk?['c',0.2]:(ed<0.6?'c':'b');if(Math.abs(x-52)<0.8||Math.abs(y-(56+bob))<0.8)return'dk';if(y>58+bob)return['b',0.05];if(y<34+bob&&Math.sin(x*0.4)>0.3)return'b';return'a';}
  // legs
  const lg=(hx,ph2,dark)=>{const lift=Math.max(0,Math.sin(ph2))*5,fx=hx+Math.cos(ph2)*6;if(el(x,y,(hx+fx)/2,74+bob-lift/2,6,4))return'm';if(cap(x,y,hx,62+bob,fx,86-lift,7))return dark?'b':'a';if(rr(x,y,fx-8,84-lift,fx+10,91-lift,2))return'dk';return 0;};
  let v=lg(56,ph,false);if(v)return v;
  const sB=[34,36+bob],hB=hit?[18,28]:atk?[22,12]:[26-Math.sin(ph)*5,66+bob];if(cap(x,y,sB[0],sB[1],hB[0],hB[1],6.5))return'b';if(el(x,y,hB[0],hB[1],8,7))return['m',-0.15];
  v=lg(42,ph+Math.PI,true);if(v)return v;return 0;},M,{R:7,r:6,rim:'#ffe8c8'});}


// ================= PLATFORMER PARALLAX (one set per chapter; tiles seamlessly every 540 logical px) =================
const TAU=Math.PI*2,PP=540;
const fb1=(x,s,n=5)=>{let v=0,a=1,t=0;const F=[3,5,9,17,31,47];for(let k=0;k<n;k++){v+=a*Math.sin(x/PP*TAU*F[k]+hash(k,s,7)*TAU);t+=a;a*=0.55;}return v/t;};
function scene(h,r,fn){const w=PP,c=mk(w*r,h*r,r),x=c.getContext('2d'),im=x.createImageData(w*r,h*r),d=im.data;
 for(let py=0;py<h*r;py++)for(let px=0;px<w*r;px++){const v=fn((px+0.5)/r,(py+0.5)/r,BY[(py&3)*4+(px&3)]/16);if(!v)continue;const i=(py*w*r+px)*4;d[i]=v[0];d[i+1]=v[1];d[i+2]=v[2];d[i+3]=v[3]===undefined?255:v[3];}
 x.putImageData(im,0,0);return c;}
const sh=(c,k)=>c.map(v=>cl(Math.round(v*k),0,255));
function bgSet(d,pal,bg,H,r){const P0=hx(pal[0]),P1=hx(pal[1]),P2=hx(pal[2]),B0=hx(bg[0]),B1=hx(bg[1]);const fog=(c,t)=>mix(c,mix(B0,B1,0.5),t).map(Math.round);
 if(d===1){// ASTER-9: station interior. Far wall with observation bays, mid machinery, near hanging cables.
  const far=scene(H,r,(x,y,th)=>{const bx=x%135,wy0=34,wy1=150;
   if(bx>22&&bx<113&&y>wy0&&y<wy1){if(bx<26||bx>109||y<wy0+4||y>wy1-4)return fog(sh(P2,0.7),0.45);
    const gx=(x-67)%135,gc=Math.hypot(((x%270)-180)/1.0,y-240);if(gc<130)return fog(mix([60,40,90],[150,110,170],cl((130-gc)/40,0,1)*(y<180?1:0)*0.6+((gc+(y*0.4))%18<2?0.2:0)).map(Math.round),0.25);
    if(hash(Math.floor(x),Math.floor(y),3)>0.994)return[220,230,255];return fog([8,10,24],0.1);}
   if(x%67.5<5)return fog(sh(P1,x%67.5<1.5?1.5:1.15),0.35+(y%24<1?0.1:0));
   if(y>170&&y<178)return fog(sh(P2,y<172?0.9:0.6),0.4);
   if(y>178&&y<206){const q=Math.abs(((x+y)%28)-14)<1.3||Math.abs(((x-y)%28+28)%28-14)<1.3;if(q)return fog(sh(P1,1.2),0.45);}
   const pid=Math.floor(x/33.75)*31+Math.floor(y/24);if(y%24<1||x%33.75<0.8)return fog(sh(P1,0.55),0.4);
   if(hash(pid,1,5)>0.82&&Math.abs((x%33.75)-28)<1.2&&Math.abs((y%24)-6)<1.2)return hash(pid,2,5)>0.5?[255,200,110]:[110,210,255];
   return fog(sh(P1,0.82+((x%33.75)<2?0.1:0)-(y/H)*0.25+(th<0.5&&(y%24)>20?-0.05:0)),0.42);});
  const mid=scene(H,r,(x,y,th)=>{const bx=x%90,top=H-150;
   const tank=bx>8&&bx<52&&y>top+((bx-30)/22)**2*14;if(tank){const n=(bx-30)/22;if(Math.abs(y-(top+60))<2||Math.abs(y-(top+100))<2)return sh(P1,0.7);return sh(P1,0.9+0.5*Math.max(0,-n-0.2)+(th<0.3&&n>0.4?-0.15:0));}
   if(y>H-96&&y<H-88)return sh(P2,y<H-93?0.75:0.5);if(Math.abs(bx-70)<1&&y>H-88&&y<H-60)return sh(P2,0.6);
   if(bx>58&&bx<86&&y>H-60){if(bx>62&&bx<82&&y>H-54&&y<H-44)return((Math.floor(x*2)+Math.floor(y*2))%3===0)?[90,220,160]:[18,40,46];return sh(P1,1.05-(y>H-58?0:0.2));}
   return 0;});
  const near=scene(H,r,(x,y,th)=>{const bx=x%120,cy=10+26*(1-((bx-60)/60)**2),cy2=6+40*(1-((((x+40)%160)-80)/80)**2);
   if(Math.abs(y-cy)<1.4||Math.abs(y-cy2)<1.1)return[10,12,22];if(y<8&&(x%40)<6)return[14,16,28];if(Math.abs(bx-60)<1.2&&y>cy&&y<cy+16)return[10,12,22];if(Math.abs(bx-60)<2.4&&Math.abs(y-cy-17)<2.4)return(hash(Math.floor(x/120),0,9)>0.5)?[255,190,90]:[30,32,44];return 0;});
  return{far,mid,near,v:[0.12,0.28,0.55]};}
 if(d===2){// ORUUN: dusk desert. Banded mesas, rock spires with glowing pod stalks, dark boulders.
  const far=scene(H,r,(x,y,th)=>{const n=fb1(x,11),m=H-150-46*Math.max(-0.3,Math.min(0.55,n))*1.6;if(y<m)return 0;
   const band=Math.floor((y-m+fb1(x,4,3)*6)/9)%3;const base=fog(sh(P0,0.75+band*0.08),0.55),hz=cl((y-m)/90,0,1);
   if(y-m<1.5)return fog(sh(P2,0.9),0.45);return mix(base,fog(sh(P1,0.8),0.6),hz*(th<0.6?1:0.7)).map(Math.round);});
  const mid=scene(H,r,(x,y,th)=>{const bx=x%135;const sp=H-78-30*Math.abs(fb1(x,23,4));const sx=Math.abs(bx-38);
   const spire=y>H-168+sx*sx*0.2+fb1(x,8,3)*8&&sx<11;if(spire||y>sp){const lit=(bx<38&&spire)?0.18:0;return sh(P1,1.0+lit-(y>H-40?0.15:0)+(th<0.25?-0.06:0));}
   const st=(x+30)%113,stx=Math.abs(st-56+Math.sin(y*0.05)*4);if(stx<1.3&&y>H-180)return sh(P1,0.8);
   if(el(st,y,56+Math.sin((H-186)*0.05)*4,H-186,5,7)||el(st,y,56+Math.sin((H-160)*0.05)*4+6,H-160,3,4))return eld(st,y,56+Math.sin((H-186)*0.05)*4,H-186,5,7)<0.5?[255,236,170]:[255,170,80];
   return 0;});
  const near=scene(H,r,(x,y,th)=>{const h=H-34-18*fb1(x,31,6)-8*Math.max(0,Math.sin(x*0.09));if(y<h){const gx=Math.floor(x*1.3);if(hash(gx,0,4)>0.7&&y>h-4-hash(gx,1,4)*6&&Math.abs((x*1.3)%1-0.5)<0.35)return[26,10,12];return 0;}
   return y<h+2?sh(P1,0.55):[20,8,10];});
  return{far,mid,near,v:[0.1,0.25,0.5]};}
 // HIVE SPIRE: grown interior. Honeycomb far wall with glowing nodes, mid hanging membranes, near roots.
 const far=scene(H,r,(x,y,th)=>{const q=Math.sqrt(3),hy=y/12,hx2=x/12/q*2;const cx=Math.round(hx2),odd=cx&1,cyy=Math.round(hy-odd*0.5),dx=(hx2-cx)*q/2*12,dy=(hy-cyy-odd*0.5)*12;
  const hd=Math.max(Math.abs(dx)*0.87+Math.abs(dy)*0.5,Math.abs(dy));
  const col=x%108,cw=14+6*Math.sin(y*0.045+Math.floor(x/108));if(Math.abs(col-54)<cw){const n=(col-54)/cw;if(Math.abs(Math.sin(y*0.32))<0.2)return fog(sh(P1,1.1),0.35);return fog(sh(P0,0.8+0.4*Math.max(0,-n)),0.4);}
  if(hd>5.4)return fog(sh(P1,0.75),0.45);if(hash(cx,cyy,6)>0.972&&hd<2.6)return hd<1.2?[255,200,255]:[200,120,240];return fog(sh(P1,0.45+th*0.08),0.5);});
 const mid=scene(H,r,(x,y,th)=>{const bx=x%96,dr=46+30*fb1(x,17,4)+18*Math.max(0,Math.sin(bx/96*Math.PI*3));if(y<dr)return sh(P0,0.9+(y>dr-3?0.25:0));
  for(let k=0;k<3;k++){const tx=k*33+12,len=dr+40+hash(Math.floor(x/96),k,3)*70;if(Math.abs(bx-tx-Math.sin(y*0.07+k)*4)<1.4&&y<len)return sh(P0,0.8);if(eld(bx,y,tx+Math.sin(len*0.07+k)*4,len,3.2,4.2)<1)return eld(bx,y,tx+Math.sin(len*0.07+k)*4,len,3.2,4.2)<0.5?[255,190,255]:[190,110,230];}
  const sac=(x+50)%140;if(y>H-70&&eld(sac,y,70,H-36,20,30)<1){const e=eld(sac,y,70,H-36,20,30);return e<0.45?mix([150,80,190],[230,160,255],0.5-e).map(Math.round):sh(P0,0.85+(sac<70?0.15:0));}return 0;});
 const near=scene(H,r,(x,y,th)=>{for(let k=0;k<2;k++){const c=(x+k*90)%180,ry=H-6-64*Math.sqrt(Math.max(0,1-((c-90)/90)**2))*(0.6+k*0.3);if(Math.abs(y-ry)<2.4&&c>4&&c<176)return[16,8,24];}if(y>H-14+6*fb1(x,5,4))return[12,6,20];return 0;});
 return{far,mid,near,v:[0.12,0.28,0.55]};}

// ================= EVASION MAZE WALLS: 16 neighbour masks x 3 variants, 32x32 art per 16px cell =================
// mask bits: 1 N, 2 E, 4 S, 8 W set when that neighbour is also wall. Exposed sides get a bevel; an exposed
// south side shows a brick front face so the maze reads as raised blocks.
function mazeWall(pal,m,v){const A0=hx(pal[0]),A1=hx(pal[1]),A2=hx(pal[2]),c=mk(32,32,2),x=c.getContext('2d'),im=x.createImageData(32,32),d=im.data;
 const N=!(m&1),E=!(m&2),S=!(m&4),Wx=!(m&8),FH=S?7:0;
 for(let py=0;py<32;py++)for(let px=0;px<32;px++){let col,th=BY[(py&3)*4+(px&3)]/16;
  const dn=N?py:99,de=E?31-px:99,dw=Wx?px:99,ds=S?31-py:99;
  if(S&&py>=32-FH){const fy=py-(32-FH),row=Math.floor(fy/3.5),bx=(px+(row&1)*5)%10;col=mix(A1,[0,0,0],0.25+fy*0.04);
   if(fy%3.5<1||bx<1)col=mix(col,[0,0,0],0.4);else if(fy%3.5<2)col=mix(col,A0,0.2);if(py===31)col=[6,6,14];if(dw<1||de<1)col=[6,6,14];}
  else{const ty=py;let k=0.86+vnoise(px/6+v*9,py/6,4)*0.14;
   const pl=(Math.abs(px-15.5)>13||Math.abs(ty-15.5)>13);
   if(dn<1||dw<1||de<1)col=[6,6,14];else{
    if(dn<3||dw<3)k+=0.32;if(de<3)k-=0.22;if(S&&ty>=32-FH-2)k-=0.18;
    col=mix(A1,A0,cl(k-0.25,0,1.3)).map(v2=>v2);if(k>1.05)col=mix(col,A2,(k-1.05)*1.4);
    const ix=px-16,iy=ty-16+(S?-3:0);
    if(v===0&&(Math.abs(ix)===6||Math.abs(iy)===6)&&Math.abs(ix)<=6&&Math.abs(iy)<=6)col=mix(col,[0,0,0],0.35);
    if(v===0&&Math.abs(ix+0.5)<2&&Math.abs(iy+0.5)<2)col=mix(A2,[255,255,255],0.3);
    if(v===1&&((Math.abs(ix+iy)<1&&Math.abs(ix)<7)||(Math.abs(iy-7)<1&&ix>=0&&ix<9)))col=mix(A2,[255,255,255],0.15);
    if(v===2){const g=(px+py)%6;if(g===0&&th>0.3)col=mix(col,[0,0,0],0.25);}
    for(const[rx,ry]of[[5,5],[26,5],[5,26-FH],[26,26-FH]])if(Math.hypot(px+0.5-rx,ty+0.5-ry)<1.3)col=px+py<rx+ry?mix(A2,[255,255,255],0.4):mix(A1,[0,0,0],0.3);
    if(pl&&th>0.82)col=mix(col,[0,0,0],0.12);}}
  const i=(py*32+px)*4;d[i]=col[0];d[i+1]=col[1];d[i+2]=col[2];d[i+3]=255;}
 x.putImageData(im,0,0);return c;}

// ================= STORY PORTRAITS: 64x64 art (32 logical), painted heads and shoulders =================
function portraits(){const P={};
 const eye=(x,y,ex,ey,iris)=>{if(!el(x,y,ex,ey,3.4,2.2))return 0;if(el(x,y,ex+0.4,ey,1.7,1.9)){if(el(x,y,ex+0.4,ey+0.2,0.8,0.9))return'pu';if(el(x,y,ex-0.3,ey-0.7,0.5,0.5))return'gl';return iris;}return'ew';};
 const MM=MAT({sk:['#e8b48e',{sh:'#7a3a3a'}],hr:['#d24a2a',{li:'#ffb070'}],hr2:['#8a2418'],ew:['#f4f0ea'],ir:['#3a8ae0'],ir2:['#7a5a2a'],pu:['#101020'],gl:['#ffffff',{e:1}],
  lp:['#a84a4a'],br:['#7a2a18'],su:['#3a6ac8'],su2:['#24408a'],col:['#e4eaf6'],mic:['#2c2c3c'],led:['#62f0ff',{e:1}],
  fh:['#a8683a',{li:'#e0a060'}],gg:['#5a6070'],ggl:['#ffc060',{e:1}],sk2:['#c08a66',{sh:'#5a2a2a'}],bd:['#6a4022'],jk:['#d07a30'],jk2:['#8a4a1a'],
  bz:['#3a4058'],bz2:['#22263a'],scr:['#0e2a1a'],gn:['#9aff5a',{e:1}],gn2:['#4ac03a',{e:1}],an:['#8a92a8'],
  vr:['#5a1028'],vr2:['#2a0614'],vk:['#a02040'],ve:['#ff3a6a',{e:1}],vw:['#ffd0e0',{e:1}]});
 P.MARA=paint(64,64,(x,y)=>{
  if(el(x,y,32,62,26,12)&&y>50){if(cap(x,y,22,50,32,58,2.4)||cap(x,y,42,50,32,58,2.4))return'col';if(Math.abs(x-32)<0.8)return'su2';return y>58&&Math.abs(x-32)>14?'su2':'su';}
  if(rr(x,y,26,40,38,54,3))return y<47?['sk',-0.25]:'sk';
  if(cap(x,y,12,34,18,42,1.4)||cap(x,y,18,42,24,44,1.1))return'mic';if(el(x,y,25,44,1.6,1.4))return'led';if(el(x,y,13,32,3.5,4.5))return'mic';
  const hd=el(x,y,32,30,13,15.5);
  if(hd){const bang=y<21+Math.abs(Math.sin(x*0.45))*3.6&&x>20;if(bang||y<17)return Math.sin(x*0.7+y*0.3)>0.6?'hr2':'hr';
   let e=eye(x,y,26.5,30,'ir')||eye(x,y,37.5,30,'ir');if(e)return e;
   if((cap(x,y,23.5,25.5,29,25,0.9))||cap(x,y,35,25,40.5,25.5,0.9))return'br';
   if(cap(x,y,32,33,31,37,0.7))return['sk',-0.3];if(cap(x,y,29,40,35,40,1.1))return'lp';
   if(el(x,y,24.5,36,2.6,1.6)||el(x,y,39.5,36,2.6,1.6))return['sk',0.06];return'sk';}
  if(el(x,y,32,27,17,17)&&y<44&&(x<20||x>44||y<16))return Math.sin(y*0.8+x*0.2)>0.55?'hr2':'hr';
  if(cap(x,y,46,22,50,48,3.2))return Math.sin(y*0.9)>0.5?'hr2':'hr';return 0;},MM,{R:4,r:2,rim:'#ffd8b0'});
 P.FENN=paint(64,64,(x,y)=>{
  if(el(x,y,32,64,28,14)&&y>49){if(Math.abs(x-32)<1)return'jk2';if(cap(x,y,20,51,30,62,2)||cap(x,y,44,51,34,62,2))return'jk2';return'jk';}
  if(rr(x,y,26,40,38,53,3))return['sk2',-0.2];
  const hd=el(x,y,32,30,13,15);
  if(y<24&&el(x,y,32,26,16,14)){if(rr(x,y,17,18.5,47,23.5,2)){if(el(x,y,25,21,4.2,3)||el(x,y,39,21,4.2,3))return el(x,y,24,20.3,1.6,1.1)||el(x,y,38,20.3,1.6,1.1)?'ggl':'gg';return'bz';}return Math.sin(x*0.9+y*0.4)>0.5?'bd':'fh';}
  if(hd){let e=eye(x,y,26.5,30,'ir2')||eye(x,y,37.5,30,'ir2');if(e)return e;
   if(cap(x,y,23,26,29.5,26.5,1)||cap(x,y,34.5,26.5,41,26,1))return'bd';
   if(y>36&&(el(x,y,32,42,12,8)))return(Math.floor(x*1.5)+Math.floor(y))%3===0?'fh':'bd';
   if(cap(x,y,32,32,31,36,0.8))return['sk2',-0.3];return'sk2';}
  if(el(x,y,32,28,16,16)&&y<38&&(x<20||x>44))return'fh';return 0;},MM,{R:4,r:2,rim:'#ffd0a0'});
 P.OTT=paint(64,64,(x,y)=>{
  if(cap(x,y,46,10,52,3,1))return'an';if(el(x,y,52.5,3,2,2))return'gn';
  if(rr(x,y,22,52,42,64,2))return Math.abs(y-57)<0.7?'bz2':'an';
  if(rr(x,y,6,8,58,52,6)){if(rr(x,y,11,13,53,47,4)){const sx=x-32,sy=y-30;
    if(el(x,y,23,26,4,5)||el(x,y,41,26,4,5))return el(x,y,24,24.5,1.4,1.6)||el(x,y,42,24.5,1.4,1.6)?'gl':'gn';
    if(Math.abs(eld(x,y,32,33,10,6)-1)<0.17&&y>35)return'gn';
    if(Math.floor(y)%3===0)return'scr';return(x*0.7+y)%9<0.8?'gn2':'scr';}
   if(el(x,y,10,48,1.4,1.4)||el(x,y,15,48,1.4,1.4))return'gn';return(x+y<40)?'bz':'bz2';}return 0;},MM,{R:3,r:2,rim:'#d8ffd0'});
 P.VOICE=paint(64,64,(x,y)=>{const dx=x-32,dy=y-30,r=Math.hypot(dx,dy),a=Math.atan2(dy,dx);
  if(r<6.5){if(r<2.2)return'vw';return've';}if(r<9)return'vr2';if(r<10.5)return'vk';
  if(r<20+2*Math.sin(a*7)){const ring=Math.sin(r*1.1+a*3);return ring>0.6?'vk':ring<-0.6?'vr2':'vr';}
  for(let k=0;k<7;k++){const ta=k/7*Math.PI*2+0.3,wob=Math.sin(r*0.35+k)*0.18;const d2=Math.abs(((a-ta-wob+Math.PI*3)%(Math.PI*2))-Math.PI)*r;if(r<30&&d2<2.6-r*0.06)return r>27?'ve':'vr';}
  return 0;},MM,{R:4,r:2,rim:'#ff9ab0'});
 return P;}

// ================= SPACE BACKDROPS (one set per chapter): nebula, a landmark, a debris layer =================
function pix(w,h,r,fn){const c=mk(Math.round(w*r),Math.round(h*r),r),x=c.getContext('2d'),W2=c.width,H2=c.height,im=x.createImageData(W2,H2),d=im.data;
 for(let py=0;py<H2;py++)for(let px=0;px<W2;px++){const v=fn((px+0.5)/r,(py+0.5)/r,BY[(py&3)*4+(px&3)]/16);if(!v)continue;const i=(py*W2+px)*4;d[i]=v[0];d[i+1]=v[1];d[i+2]=v[2];d[i+3]=v[3]===undefined?255:v[3];}
 x.putImageData(im,0,0);return c;}
const fbm2=(x,y,s)=>{let v=0,a=0.5;for(let k=0;k<4;k++){v+=a*vnoise(x,y,s+k*13);x*=2.03;y*=2.03;a*=0.5;}return v/0.9375;};
const SPC=[// sky top, sky bottom, nebula colours (dim to bright)
 {s0:'#05061a',s1:'#120a2c',n:['#1a1a4a','#34306e','#5a4a9a','#8a7ac8']},
 {s0:'#120406',s1:'#2c0c08',n:['#3a1008','#6a2410','#b04a1a','#ff9a4a']},
 {s0:'#020c14',s1:'#06222e',n:['#08303a','#10505a','#2a8a8a','#8ae0d0']},
 {s0:'#0a0216',s1:'#22082e',n:['#2a0a40','#4a1a6a','#8a3aa8','#e08aff']},
 {s0:'#000000',s1:'#140006',n:['#1a0008','#3a0614','#7a1028','#ff3a5a']}];
function spaceSet(d,r){const P=SPC[d-1],S0=hx(P.s0),S1=hx(P.s1),N=P.n.map(hx),H=480,W=270;
 const nf=(x,y)=>{const a=fbm2(x/70,y/70,d*31),b=fbm2(x/26+9,y/26,d*17);return a*0.75+b*0.35-0.18-(d===4?Math.abs(x-135)/400:0);};
 const neb=pix(W,H,Math.min(r,1),(x,y,th)=>{const w=y<60?y/60:1;let n=nf(x,y)*w+nf(x,y+H)*(1-w);// fades into the copy above so it tiles vertically
  let col=mix(S0,S1,0.5-0.5*Math.cos(y/H*TAU));const q=cl((n-0.25)*2.4,0,1)*4+th*0.9-0.45,lv=Math.floor(q);if(lv>=1)col=mix(col,N[Math.min(3,lv-1)],0.55+0.12*Math.min(3,lv-1));
  if(d===2&&lv>=3&&hash(Math.floor(x),Math.floor(y),3)>0.97)col=mix(col,[255,220,160],0.6);return col.map(Math.round);});
 let mark;
 if(d===1){// Kestrel relay: ring station with solar wings, painted like the sprites
  const M=MAT({rg:['#8a92a8'],rg2:['#4a5068'],hb:['#c8d0e0'],sp:['#2a4a9a',{li:'#8ab0ff'}],sp2:['#18285a'],lt:['#ffd23a',{e:1}],gl:['#62f0ff',{e:1}]});
  mark=paint(240,240,(X,Y)=>{const x=X*150/240,y=Y*150/240,dx=x-75,dy=(y-75)*2.4,rr2=Math.hypot(dx,dy);
   if(rr2>50&&rr2<60&&!(dy<0&&Math.abs(dx)<12&&rr2<60))return Math.abs(rr2-55)<1.2?'rg2':(Math.floor(Math.atan2(dy,dx)*6)%2?'rg':['rg',-0.1]);
   if(rr(x,y,70,30,80,120,3)){if(Math.abs(y-75)<6)return'gl';return Math.floor(y/9)%2?'hb':['hb',-0.15];}
   for(const sx of[-1,1])if(rr(x,y,sx>0?82:22,40,sx>0?128:68,52,1)){const gx=(x-(sx>0?82:22))%6,gy=(y-40)%4;return gx<0.8||gy<0.7?'sp2':'sp';}
   if(cap(x,y,22,46,128,46,0.9))return'rg2';if(el(x,y,75,28,2,2)||el(x,y,75,122,2,2))return'lt';return 0;},M,{R:3,r:2,rim:'#d8e8ff'});}
 else if(d===2){// Cinder Drift: a swollen red giant with granulation and a ragged corona
  mark=pix(170,170,r,(x,y,th)=>{const dx=x-85,dy=y-85,rr2=Math.hypot(dx,dy);if(rr2<52){const g=vnoise(x/5,y/5,3)*0.6+vnoise(x/13,y/13,8)*0.4,limb=1-(rr2/52)**2;const t=cl(g*0.6+limb*0.7+th*0.12,0,1);
    return mix(mix([90,14,10],[180,52,24],cl(t*1.6,0,1)),[220,120,60],cl((t-0.6)*2.5,0,1)).map(Math.round);}
   const cor=52+18*vnoise(Math.atan2(dy,dx)*4+10,0.5,5)+6*vnoise(Math.atan2(dy,dx)*13,1.5,6);if(rr2<cor){const t=(cor-rr2)/(cor-52);if(t>th*0.9)return[220,Math.round(80+t*50),30,Math.round(60+t*90)];}return 0;});}
 else if(d===3){// The Shear: banded ice giant with a tilted ring and a shard field crossing it
  mark=pix(190,150,r,(x,y,th)=>{const dx=x-95,dy=y-75,rr2=Math.hypot(dx,dy),rx=dx*Math.cos(0.3)+dy*Math.sin(0.3),ry=(-dx*Math.sin(0.3)+dy*Math.cos(0.3))*3.6,rq=Math.hypot(rx,ry);
   const ring=rq>62&&rq<88&&(Math.floor(rq/3)%3!==0);const front=ry>0;
   if(ring&&front)return mix([40,110,120],[180,240,230],cl((rq-62)/26+th*0.2,0,1)*0.8).map(Math.round);
   if(rr2<46){const band=Math.sin((dy+Math.sin(dx*0.08)*4)*0.33)+vnoise(x/6,y/3,4)*0.8,limb=Math.sqrt(1-(rr2/46)**2),lit=cl(0.25+limb*0.6-(dx+dy)/140,0,1);
    const c=band>0.4?[60,170,170]:band>-0.3?[30,110,130]:[20,70,96];return mix([4,14,24],c,cl(lit+th*0.15,0,1)).map(Math.round);}
   if(ring)return mix([30,90,100],[150,220,210],cl((rq-62)/26,0,1)*0.7).map(Math.round);return 0;});}
 else if(d===4){// Rift Approach: a vertical tear with a hot white edge and warped stars sliding toward it
  mark=pix(120,300,r,(x,y,th)=>{const cxx=60+Math.sin(y*0.045)*10+Math.sin(y*0.13)*4,w=3+14*Math.sin(Math.PI*y/300)**1.5,dx=Math.abs(x-cxx);
   if(dx<w*0.2)return[235,200,250,220];if(dx<w*0.7)return mix([200,120,240],[90,20,140],(dx-w*0.2)/(w*0.5)).map(Math.round).concat([200]);
   if(dx<w*2.6){const t=1-(dx-w*0.7)/(w*1.9);if(t>th)return[130,40,190,Math.round(50+t*80)];}
   if(hash(Math.floor(x/3),Math.floor(y),2)>0.996)return[230,200,255,200];return 0;});}
 else{// Void Heart: an accretion swirl round a black centre
  mark=pix(220,220,r,(x,y,th)=>{const dx=x-110,dy=(y-110)*1.3,rr2=Math.hypot(dx,dy),a=Math.atan2(dy,dx);if(rr2<26)return rr2>23?[255,90,110]:[0,0,0];
   if(rr2<104){const sw=Math.sin(a*3+rr2*0.12)*0.5+0.5,t=(1-(rr2-26)/78)*(0.5+sw*0.6);if(t>th*0.8)return mix([90,0,20],[255,140,150],cl(t*t*1.4,0,1)).map(Math.round).concat([Math.round(120+cl(t,0,1)*135)]);}return 0;});}
 // debris layer (tiles vertically): drawn sprites, dimmed so they read as far away
 const mid=mk(Math.round(W*r),Math.round(H*r),r),mx=mid.getContext('2d');mx.scale(r,r);mx.imageSmoothingEnabled=false;
 const put=(img,x,y,s)=>{const w=img.width*s/img.r,h=img.height*s/img.r;for(const oy of[0,-H,H])mx.drawImage(img,x-w/2,y-h/2+oy,w,h);};
 for(let i=0;i<(d===1?22:d===3?18:14);i++){const x=hash(i,1,d)*W,y=hash(i,2,d)*H,s=0.4+hash(i,3,d)*0.6;
  if(d===1||d===2)put(A.rock[i%8],x,y,s*0.9);else if(d===3)put(shard(i),x,y,s*1.6);else if(d===4)put(shard(i+40,1),x,y,s*1.3);else put(A.rock[i%8],x,y,s);}
 mx.globalCompositeOperation='source-atop';mx.fillStyle=P.s1;mx.globalAlpha=(d===1||d===2||d===5)?0.62:0.4;mx.fillRect(0,0,W,H);mx.globalAlpha=1;mx.globalCompositeOperation='source-over';
 if(d===2||d===5)for(let i=0;i<70;i++){const x=hash(i,5,d)*W,y=hash(i,6,d)*H;mx.fillStyle=d===2?(i%3?'#ff9a3a':'#ffe08a'):'#ff3a5a';mx.globalAlpha=0.5+hash(i,7,d)*0.5;mx.fillRect(x,y,1,i%4?1:2);mx.globalAlpha=0.25;mx.fillRect(x,y-3,1,3);}
 mx.globalAlpha=1;
 return{neb,mark,mid,mw:mark.width/mark.r,mh:mark.height/mark.r};}
const SHM=MAT({ic:['#6ad0d0',{li:'#e0ffff'}],ic2:['#2a7a8a'],pc:['#a060e0',{li:'#ffd0ff'}],pc2:['#5a2a9a']});
function shard(i,purple){const a=hash(i,9,1)*Math.PI,L2=8+hash(i,8,1)*8,ca=Math.cos(a),sa=Math.sin(a);return paint(40,40,(x,y)=>{const dx=x-20,dy=y-20,u=dx*ca+dy*sa,v=-dx*sa+dy*ca;
 if(Math.abs(v)<(1-Math.abs(u)/L2)*4.5&&Math.abs(u)<L2)return purple?(v>0?'pc2':'pc'):(v>0?'ic2':'ic');return 0;},SHM,{R:3,r:2,rim:purple?'#ffd0ff':'#e0ffff'});}
// ================= EVASION top-down: 32x32 art (16 logical), 4 dirs x 4 frames =================
const VM=MAT({arm:['#e4eaf6'],suit:['#4a80ea'],helm:['#e8eef8'],vis:['#62f0ff',{e:1}],boot:['#2c2c3c'],scarf:['#ff8c3a'],pack:['#5c6274'],
 h1:['#d0405e'],h2:['#8a2040'],d1:['#ff8a3a'],d2:['#a04a1a'],dm:['#d8dce8'],i1:['#5ae08a'],i2:['#2a8a4a'],k1:['#a068f0'],k2:['#5a2aa0'],ey:['#ffe07a',{e:1}]});
// Each character has its own drawing for the up view (back), down view (front) and side view (profile,
// mirrored for left). v: 'u' | 'd' | 's'. Side views face +x.
function topdown(local,dir,f){const v=dir===0?'u':dir===2?'d':'s',m=dir===3?-1:1;
 return paint(32,32,(gx,gy)=>local((gx-16)*m,gy-16,f,v),VM,{R:4,r:2,rim:'#c8e0ff'});}
const maraTD=(x,y,f,v)=>{const s=[1,0,-1,0][f]*2.6;
 if(v==='s'){
  if(el(x,y,0.6,-7,4.6,4.4)){if(el(x,y,3.4,-6.6,1.9,2.3))return'vis';if(y>-3.4)return'suit';return'helm';}
  if(cap(x,y,-2.5,-2.2,-8,-3.4+Math.sin(f*1.6)*1.4,1.2))return'scarf';
  if(rr(x,y,-5.6,-2.4,-2.2,3.6,1.2))return'pack';
  if(cap(x,y,0.3,-1,-s*0.9,4.5,1.5))return'arm';
  if(rr(x,y,-2.4,-2.6,2.6,4.4,1.6))return Math.abs(y-1.6)<0.5?'pack':'suit';
  if(cap(x,y,0,4,s*1.3,9.6,1.7))return y>8.2?'boot':'suit';if(cap(x,y,0,4,-s*1.3,9.6,1.7))return y>8.2?['boot',-0.2]:['suit',-0.25];return 0;}
 const back=v==='u';
 if(cap(x,y,-2.2,4,-2.2,9.6-s,1.8))return y>8.4-s?'boot':'suit';if(cap(x,y,2.2,4,2.2,9.6+s,1.8))return y>8.4+s?'boot':'suit';
 if(el(x,y,0,-7,5,4.5)){if(!back&&el(x,y,0,-6.2,3.6,2.3))return'vis';if(back&&Math.abs(x)<0.7&&y<-4)return'suit';return'helm';}
 if(back&&cap(x,y,0.6,-2,0.6+Math.sin(f*1.6)*1.6,6,1.1))return'scarf';
 if(!back&&el(x,y,0,-2.2,4.2,1.4))return'scarf';
 if(back&&rr(x,y,-3.4,-1.6,3.4,4.4,1.4))return Math.abs(y-1.4)<0.5?'boot':'pack';
 if(cap(x,y,-5,-0.6,-5.8,4.4-s*0.7,1.5)||cap(x,y,5,-0.6,5.8,4.4+s*0.7,1.5))return'arm';
 if(rr(x,y,-4,-2,4,4.6,1.6)){if(!back&&Math.abs(x)<0.6)return'pack';if(!back&&el(x,y,0,3.6,1.2,0.8))return'vis';return'suit';}return 0;};
const CH=[
 (x,y,f,v)=>{const p=[1,0,-1,0][f];// stalker: four-legged tissue beast
  if(v==='s'){if(el(x,y,8.6,-2.4,1.2,1.2))return'ey';if(el(x,y,7,-1,4.4,3.6))return y>0.6&&x>8?'h2':'h1';
   if(cap(x,y,-7,-1,-12,-4+p*1.5,1.2))return'h2';
   if(el(x,y,-1,0,8,4.6))return Math.abs(Math.sin(x*1.1))<0.25&&y<-1?'h2':'h1';
   for(const[lx,o,dk]of[[4,p,0],[-5,-p,0],[2,-p,1],[-3,p,1]])if(cap(x,y,lx,2,lx+o*2.2,8.5,1.4))return dk?['h2',-0.25]:'h2';return 0;}
  const fr=v==='d';const hy=fr?5:-7;
  if(fr&&el(Math.abs(x),y,2.2,5.6,1.2,1.2))return'ey';
  if(el(x,y,0,hy,4.4,3.8))return fr&&y>7?'h2':'h1';
  if(!fr&&(cap(x,y,-2.4,-9.5,-3.6,-12,0.9)||cap(x,y,2.4,-9.5,3.6,-12,0.9)))return'h2';
  if(!fr&&cap(x,y,0,6,Math.sin(f*1.6)*2.5,12,1.2))return'h2';
  if(el(x,y,0,fr?-1:0,6,7))return Math.abs(x)<0.8||(Math.abs(Math.sin(y*1.1))<0.22&&Math.abs(x)<3)?'h2':'h1';
  for(const[sx,o]of[[-1,p],[1,-p]]){if(cap(x,y,sx*5,-3,sx*9.5,-6+o*3,1.5)||cap(x,y,sx*5,4,sx*9.5,8-o*3,1.5))return'h2';}return 0;},
 (x,y,f,v)=>{const a=f/4*Math.PI/2;// cutter: blade disc, seen face-on from front/back, edge-on from the side
  if(v==='s'){const rx=4.2,ry=11;if(el(x,y,3.4,0,1.6,2.2))return'ey';if(el(x,y,0,0,2.2,5))return'd1';
   if(el(x,y,0,0,rx,ry)){const band=((y/ry*3+f*0.75)%1+1)%1;if(eld(x,y,0,0,rx,ry)>0.75)return'dm';return band<0.35?'d2':'d1';}
   if(cap(x,y,-4,0,-9,Math.sin(f*1.6)*1.5,0.8)&&(Math.floor(x)%2))return'd2';return 0;}
  const fr=v==='d',r=Math.hypot(x,y),t=Math.atan2(y,x)+(fr?a:-a);
  if(fr&&el(x,y,0,1,2.4,1.8))return'ey';if(!fr&&el(x,y,0,0,2.2,2.2))return'dm';
  if(el(x,y,0,0,6,6))return !fr&&(Math.abs(x)<0.6||Math.abs(y)<0.6)?'d2':'d1';
  if(r<11&&(t%(Math.PI/2)+Math.PI*2)%(Math.PI/2)<0.5+((11-r)/11)*0.6)return r>8?'dm':'d2';return 0;},
 (x,y,f,v)=>{const p=Math.sin(f/4*Math.PI*2);// drifter: jelly with trailing tentacles
  if(v==='s'){if(el(x,y,5,-3,1.2,1.5))return'ey';if(el(x,y,2,-2,6.4+p*0.6,6-p*0.5))return eld(x,y,2,-2,6.4,6)>0.72||(x<0&&Math.abs(y+2)<0.5)?'i2':'i1';
   for(let k=0;k<4;k++){const yy=-3+k*2.4;if(cap(x,y,-3,yy,-12,yy+Math.sin(f*1.5+k)*2,0.9))return'i2';}return 0;}
  const fr=v==='d';
  if(fr&&el(Math.abs(x),y,2.4,-1.4,1.2,1.5))return'ey';
  if(el(x,y,0,fr?-1:1,8+p*0.8,7-p*0.6)){const e=eld(x,y,0,fr?-1:1,8,7);if(!fr&&(el(Math.abs(x),y,3.4,0,1.3,1.3)||el(x,y,0,4,1.4,1.2)))return'i2';return e>0.72?'i2':'i1';}
  for(let k=-2;k<=2;k++){const y0=fr?-6:6,y1=fr?-13:12;if(cap(x,y,k*3,y0,k*3+Math.sin(f*1.5+k)*1.6,y1,1))return'i2';}return 0;},
 (x,y,f,v)=>{const p=[1,0,-1,0][f];// pincer: armoured bug with claws
  if(v==='s'){if(el(x,y,6,-2.4,1.1,1.1))return'ey';if(el(x,y,-1,0,8,4.4))return Math.abs(x+3)<0.5||Math.abs(x-2)<0.5?'k2':'k1';
   if(cap(x,y,5,1,11,-1+p,1.8))return'k1';if(cap(x,y,11,-1+p,13,-4,1.2)||cap(x,y,11,0+p,13.5,1.5,1))return'k2';
   for(const[lx,o]of[[-5,p],[-1,-p],[3,p]])if(cap(x,y,lx,3,lx+o*1.6,8,0.9))return'k2';return 0;}
  const fr=v==='d',fy=fr?1:-1;
  if(fr&&el(Math.abs(x),y,2,4.4,1.1,1.1))return'ey';
  if(el(x,y,0,-fy*0.5,5,8))return Math.abs(y+fy*1.5)<0.6||Math.abs(y-fy*2.5)<0.6||(!fr&&Math.abs(x)<0.5)?'k2':'k1';
  for(const s of[-1,1]){if(cap(x,y,s*4,fy*4,s*7,fy*(9-p*s),fr?1.8:1.4))return'k1';if(cap(x,y,s*7,fy*(9-p*s),s*3,fy*13,fr?1.3:1))return'k2';if(cap(x,y,s*4,-fy*2,s*9,-fy*(4+p*s*2),1))return'k2';}
  if(!fr&&cap(x,y,0,7,0,11,1.4))return'k2';return 0;}];

// ================= PICKUPS, COINS, EXPLOSIONS =================
// 4-frame badge: a light sheen sweeps across the gem, a bezel light runs round the corners, the glyph pulses.
function pickup(col,glyph){const M=MAT({bz:['#3a4260'],bz2:['#232842'],gm:[col],sy:['#ffffff',{e:1}],lt:['#e8f4ff',{e:1}]});const fr=[];
 for(let f=0;f<4;f++){const sw=-10+f*10,pul=[0,0.12,0.2,0.12][f],cn=[[4,4],[20,4],[20,20],[4,20]][f];fr.push(paint(24,24,(x,y)=>{
 const gx=Math.floor((x-4.5)/3),gy=Math.floor((y-4.5)/3);if(gx>=0&&gy>=0&&gx<5&&gy<5&&glyph[gy][gx]!=='.')return['sy',pul];
 if(rr(x,y,3,3,21,21,4)){const d=(x-y)-sw;if(Math.abs(d)<1.6)return['gm',0.45];if(Math.abs(d-4)<0.8)return['gm',0.25];return'gm';}
 if(rr(x,y,1,1,23,23,5)){if(Math.hypot(x-cn[0],y-cn[1])<1.6)return'lt';return(x+y)<22?'bz':'bz2';}return 0;},M,{R:3,rim:'#ffffff',ol:'#05060c'}));}return fr;}
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

// ================= v9 DUEL: Mara with the shock baton (larger, 2.2 art px per unit), the Hollow champion, the core chamber =================
const DK=2.2,DST={l1:[0.45,0.32],l2:[-0.38,0.22]};
function dMara(o){return maraPose(Object.assign({lean:0,dy:0,l1:DST.l1,l2:DST.l2,aim:0.35,bat:-0.9,scarf:0,baton:1,K:DK,pad:12,padT:8},o)).c;}
function maraDuelSet(){const S={idle:[],walk:[],wind:[],swing:[],roll:[],death:[]};
 for(let f=0;f<4;f++){const br=[0,0.5,1,0.5][f];S.idle.push(dMara({dy:br*0.6+1,headDy:br*0.3,scarf:f*1.6,bat:-0.9+br*0.06}));}
 for(let f=0;f<8;f++){const p=f/8*Math.PI*2,lg=q=>[0.1+Math.sin(q)*0.5,0.3+0.6*Math.max(0,Math.cos(q+0.6))];S.walk.push(dMara({lean:0.15,dy:1-Math.abs(Math.sin(p))*0.8,l1:lg(p),l2:lg(p+Math.PI),scarf:p}));}
 S.wind.push(dMara({lean:-0.2,dy:1,aim:-2.05,bat:-2.55,l1:[0.55,0.4],l2:[-0.45,0.25],scarf:2}));
 S.wind.push(dMara({lean:-0.1,dy:2,aim:2.35,bat:2.85,l1:[0.5,0.45],l2:[-0.5,0.3],scarf:3}));
 S.swing.push(dMara({lean:0.5,dy:2,aim:0.45,bat:0.85,l1:[0.75,0.6],l2:[-0.55,0.25],scarf:4}));
 S.swing.push(dMara({lean:0.4,dy:1.5,aim:-0.3,bat:-0.65,l1:[0.7,0.55],l2:[-0.5,0.25],scarf:5}));
 S.heavyWind=dMara({lean:-0.35,dy:2.5,aim:-1.95,bat:-1.62,l1:[0.6,0.6],l2:[-0.5,0.35],scarf:1});
 S.heavy=dMara({lean:0.75,dy:5,aim:0.85,bat:1.15,l1:[1.0,1.0],l2:[-0.75,0.2],scarf:5});
 S.block=dMara({lean:-0.12,dy:2,aim:-0.55,bat:-1.45,l1:[0.55,0.45],l2:[-0.5,0.3],scarf:2});
 S.parry=dMara({lean:0.3,dy:1.5,aim:-0.15,bat:-1.0,l1:[0.7,0.5],l2:[-0.5,0.25],scarf:3});
 for(let f=0;f<4;f++)S.roll.push(dMara({lean:0.6,dy:13,headDy:2,l1:[1.6,0.6],l2:[1.0,2.4],aim:1.1,bat:1.9,rot:-f*Math.PI/2,piv:[20,43],scarf:f}));
 S.hit=dMara({lean:-0.7,dy:1,headDy:1,l1:[0.5,0.6],l2:[-0.4,0.4],aim:-2.4,bat:-2.0,scarf:3});
 for(let f=0;f<4;f++)S.death.push(dMara({lean:-0.4,dy:f*1.2,l1:[0.3+f*0.2,0.9],l2:[-0.2,0.7],aim:-2.5+f*0.2,bat:-2.2+f*0.4,rot:-f*0.45,scarf:f}));
 S.win=dMara({lean:0,dy:0,aim:-1.35,bat:-1.5,l1:[0.2,0.1],l2:[-0.2,0.1],scarf:2});
 S.W=white(S.idle[0]);return S;}
// Hollow champion: 64x84 units at 2 art px each. Faces right; the game flips it.
const CHM=MAT({a:['#6a2a8a'],b:['#3e1a5a'],c:['#d0405e'],ey:['#ffe07a',{e:1,li:'#ffffff'}],bl:['#c8c4e4',{li:'#ffffff'}],be:['#ff9aff',{e:1,li:'#ffffff'}],m:['#7a8090'],cl:['#7a1a34'],dk:['#22122e']});
function cleg(hx,hy,a,b,L){const kx=hx+Math.sin(a)*L,ky=hy+Math.cos(a)*L,ax=kx+Math.sin(a-b)*L,ay=ky+Math.cos(a-b)*L;return[kx,ky,ax,ay];}
function champPose(P){P=Object.assign({lean:0,dy:0,a1:1.2,a2:0.5,a3:-0.15,b1:1.4,b2:0.9,l1:[0.5,1.2],l2:[-0.25,1.1],hd:0,cape:0},P);
 const S=[36+P.lean*5,31+P.dy],B=[27+P.lean*5,32+P.dy],H=[39+P.lean*7,17+P.dy+P.hd],hip=[31+P.lean*1.5,55+P.dy],tc=[32+P.lean*3,41+P.dy];
 const E=[S[0]+Math.cos(P.a1)*11,S[1]+Math.sin(P.a1)*11],Hd=[E[0]+Math.cos(P.a2)*10,E[1]+Math.sin(P.a2)*10];
 const bd=[Math.cos(P.a3),Math.sin(P.a3)],bn=[-bd[1],bd[0]],BL=[];for(let k=0;k<=6;k++){const t=k/6;BL.push([Hd[0]+bd[0]*t*37+bn[0]*t*t*6,Hd[1]+bd[1]*t*37+bn[1]*t*t*6,3.3-2.5*t]);}
 const E2=[B[0]+Math.cos(P.b1)*10,B[1]+Math.sin(P.b1)*10],H2=[E2[0]+Math.cos(P.b2)*9,E2[1]+Math.sin(P.b2)*9];
 const L1=cleg(hip[0],hip[1],P.l1[0],P.l1[1],14),L2=cleg(hip[0],hip[1],P.l2[0],P.l2[1],14);
 const fn=(x,y)=>{
  // blade (curved, tapered) with a glowing edge on the cutting side
  for(let k=0;k<6;k++){const a=BL[k],b=BL[k+1],d=sd(x,y,a[0],a[1],b[0],b[1]);const w=(a[2]+b[2])/2;if(d<w){const side=(x-a[0])*bn[0]+(y-a[1])*bn[1];return side>w*0.35?'be':(k===0&&d<w*0.5?'m':'bl');}}
  if(Math.hypot(x-Hd[0],y-Hd[1])<3)return'dk';
  if(cap(x,y,Hd[0]-bn[0]*3.5,Hd[1]-bn[1]*3.5,Hd[0]+bn[0]*3.5,Hd[1]+bn[1]*3.5,1.2))return'm';
  // blade arm
  if(cap(x,y,E[0],E[1],Hd[0],Hd[1],2.8))return Math.abs(sd(x,y,E[0],E[1],Hd[0],Hd[1])-1.2)<0.4?'b':'a';
  if(cap(x,y,S[0],S[1],E[0],E[1],3.3))return 'a';if(Math.hypot(x-E[0],y-E[1])<3.2)return'c';
  // front leg (digitigrade: thigh, shin, hoof spur)
  const lg=(L,dk)=>{if(cap(x,y,L[2],L[3],L[2]+6,L[3]+1.5,2))return'dk';if(cap(x,y,L[2],L[3],L[2]-3,L[3]+1,1.5))return'dk';
   if(cap(x,y,L[0],L[1],L[2],L[3],2.6))return dk?'b':(sd(x,y,L[0],L[1],L[2],L[3])>1.6?'b':'a');if(Math.hypot(x-L[0],y-L[1])<3.2)return dk?'b':'c';if(cap(x,y,hip[0],hip[1],L[0],L[1],3.8))return dk?'b':'a';return 0;};
  let v=lg(L1,false);if(v)return v;
  // head: long insect skull, two eye slits, crest swept back
  const hd=eld(x,y,H[0],H[1],5.5,6.5);if(hd<1){if(el(x,y,H[0]+2.8,H[1]-0.6,1.7,0.9)||el(x,y,H[0]+2.3,H[1]+2.2,1.3,0.7))return'ey';if(y>H[1]+3.2&&x>H[0])return'b';if(Math.abs(x-H[0]+0.5)<0.5&&y<H[1]-1)return'b';return hd>0.8?['a',-0.1]:'a';}
  if(poly(x,y,[[H[0]-3,H[1]-4],[H[0]-17,H[1]-11],[H[0]-6,H[1]-1]]))return y<H[1]-6?'c':'b';
  if(poly(x,y,[[H[0]-2,H[1]+1],[H[0]-13,H[1]-2],[H[0]-4,H[1]+3]]))return'b';
  if(cap(x,y,H[0]-1,H[1]+4,S[0]-3,S[1],2.6))return'b';
  // pauldron
  const pd=eld(x,y,S[0]-0.5,S[1]-1,6.5,4.6);if(pd<1){if(pd>0.78)return'dk';if(y<S[1]-2.5)return['c',0.15];return'c';}
  // torso carapace with ribs and a glowing core seam
  const td=eld(x,y,tc[0],tc[1],9.5,13);if(td<1){if(Math.abs(x-tc[0]-2)<0.6&&Math.abs(y-tc[1])<6)return'be';const rib=(y-tc[1]+13)%4.5;if(rib<0.7&&td<0.92)return'b';if(td>0.86)return'b';return y<tc[1]-6?['a',0.1]:'a';}
  if(el(x,y,hip[0],hip[1]-1,7,4.2))return Math.abs(y-hip[1]+1)<0.6?'dk':'b';
  v=lg(L2,true);if(v)return v;
  // back claw arm
  if(cap(x,y,E2[0],E2[1],H2[0],H2[1],2.2)||cap(x,y,B[0],B[1],E2[0],E2[1],2.8))return['b',-0.1];
  if(cap(x,y,H2[0],H2[1],H2[0]+3,H2[1]+3,1)||cap(x,y,H2[0],H2[1],H2[0]+4,H2[1]+0.5,1))return'dk';
  // tattered cape behind
  const cx0=B[0]-3,sw=P.cape;if(y>B[1]-3&&y<70+P.dy*0.5){const t=(y-(B[1]-3))/(70+P.dy*0.5-B[1]+3),xl=cx0-3-t*(9+sw*2),xr=cx0+5-t*(1-sw);if(x>xl&&x<xr){const tear=hash(Math.floor(x*0.8),0,9)*6;if(y<70+P.dy*0.5-tear)return Math.floor(x*0.9)%3===0?['cl',-0.15]:'cl';}}
  return 0;};
 return paint(Math.round(120*CK),Math.round(88*CK),(X,Y)=>fn(X/CK-28,Y/CK-4),CHM,{R:6,rim:'#ffc0e8'});}
const CK=2.4;
function tint(c,col,a){const o=mk(c.width,c.height,c.r),x=o.getContext('2d');x.drawImage(c,0,0);x.globalCompositeOperation='source-atop';x.globalAlpha=a===undefined?1:a;x.fillStyle=col;x.fillRect(0,0,o.width,o.height);return o;}
function champSet(){const C={idle:[],walk:[],stun:[]};
 for(let f=0;f<4;f++){const b=Math.sin(f/4*Math.PI*2);C.idle.push(champPose({dy:1+b*0.6,hd:b*0.3,cape:b*0.5,a1:1.15+b*0.04}));}
 for(let f=0;f<4;f++){const p=f/4*Math.PI*2;C.walk.push(champPose({lean:0.15,dy:Math.abs(Math.sin(p))*-0.8,l1:[0.3+Math.sin(p)*0.45,1.2],l2:[0.1-Math.sin(p)*0.45,1.15],cape:Math.sin(p)}));}
 C.windHi=champPose({lean:-0.45,dy:2,a1:-2.0,a2:-2.45,a3:-2.85,l1:[0.6,1.3],l2:[-0.45,1.0],cape:1.2});
 C.slash=champPose({lean:0.65,dy:4,a1:0.25,a2:0.35,a3:0.4,l1:[0.85,1.5],l2:[-0.55,0.9],cape:-1});
 C.windLo=champPose({lean:-0.2,dy:4,a1:2.3,a2:2.7,a3:2.9,l1:[0.6,1.4],l2:[-0.5,1.0],cape:0.8});
 C.up=champPose({lean:0.5,dy:1,a1:-0.45,a2:-0.6,a3:-0.75,l1:[0.8,1.4],l2:[-0.5,0.9],cape:-0.8});
 C.windTh=champPose({lean:-0.35,dy:4,a1:2.5,a2:0.05,a3:0,l1:[0.55,1.5],l2:[-0.55,1.1],cape:1});
 C.thrust=champPose({lean:0.95,dy:5,a1:0.05,a2:0.0,a3:-0.02,l1:[1.1,1.6],l2:[-0.75,0.8],cape:-1.2});
 C.windRed=champPose({lean:-0.25,dy:0,a1:-1.45,a2:-1.6,a3:-1.72,b1:-1.2,b2:-1.6,l1:[0.45,1.1],l2:[-0.45,1.0],hd:-1,cape:1.5});
 C.red=champPose({lean:0.85,dy:8,a1:0.7,a2:1.0,a3:0.25,l1:[1.1,1.8],l2:[-0.7,1.0],cape:-1.5});
 C.feint=champPose({lean:0.1,dy:2,a1:-0.9,a2:-1.2,a3:-1.6,l1:[0.6,1.3],l2:[-0.45,1.0],cape:0.4});
 C.recover=champPose({lean:0.35,dy:4,a1:1.35,a2:1.45,a3:0.95,l1:[0.7,1.4],l2:[-0.5,1.0],hd:1.5,cape:-0.3});
 C.stag=champPose({lean:-0.85,dy:2,a1:-2.5,a2:-2.85,a3:-2.3,b1:-2.4,b2:-2.8,l1:[0.2,0.9],l2:[-0.8,1.2],hd:-1.5,cape:1.6});
 for(let f=0;f<2;f++)C.stun.push(champPose({lean:0.55,dy:15+f*0.6,a1:1.5,a2:1.4,a3:0.55,b1:1.6,b2:1.5,l1:[1.3,2.7],l2:[-0.3,2.4],hd:3+f*0.5,cape:-0.2}));
 C.roar=champPose({lean:-0.3,dy:0,a1:-0.6,a2:-1.0,a3:-1.3,b1:-2.4,b2:-2.6,l1:[0.55,1.2],l2:[-0.5,1.1],hd:-2.5,cape:2});
 C.W=white(C.idle[0]);
 const tl=k=>{const o={};for(const n in C){const v=C[n];if(Array.isArray(v))o[n]=v.map(c=>tint(c,k,0.85));else if(v&&v.getContext)o[n]=tint(v,k,0.85);}return o;};C.Y=tl('#ffe23a');C.R=tl('#ff1a3a');return C;}
// core chamber background: 270x352 units (W x arena), ribs, the core behind a cage, hex floor
function duelBg(r){const w=270,h=352,c=mk(w*r,h*r,r),x=c.getContext('2d'),im=x.createImageData(w*r,h*r),d=im.data;
 const FY=318,cx=135,cy=150,CR=44,base=hx('#0c0614'),wall=hx('#2a1240'),wall2=hx('#3e1a5a'),rim=hx('#a07ad8'),hot=hx('#ff5a8a'),core=hx('#ff3a6a'),core2=hx('#ffd0e0'),fl=hx('#1e1430'),fl2=hx('#2e1e48');
 for(let py=0;py<h*r;py++)for(let px=0;px<w*r;px++){const X=(px+0.5)/r,Y=(py+0.5)/r,dt=BY[(py&3)*4+(px&3)]/16-0.5;let col;
  if(Y<FY){// back wall: vertical organic ribs, darker toward the edges and top
   const rib=Math.sin(X*0.22+vnoise(X*0.05,Y*0.02,3)*4),n=vnoise(X*0.08,Y*0.08,5),edge=Math.min(1,Math.min(X,w-X)/90),v=0.25+0.35*(rib*0.5+0.5)+0.25*n+dt*0.12;
   col=mix(base,mix(wall,wall2,cl(v,0,1)),cl(0.35+0.65*edge*(0.4+0.6*Y/FY),0,1));
   if(Math.abs(rib)<0.05&&n>0.6)col=mix(col,rim,0.18);
   // veins that run toward the core
   const ang=Math.atan2(Y-cy,X-cx),rd=Math.hypot(X-cx,Y-cy),vein=Math.abs(Math.sin(ang*7+vnoise(rd*0.03,ang,8)*3));if(rd>CR+6&&rd<170&&vein<0.05+0.04*(1-rd/170))col=mix(col,hot,0.55*(1-rd/170)+0.15);
   // the core and its cage
   if(rd<CR+14){const g=1-rd/(CR+14);col=mix(col,core,g*0.6);}
   if(rd<CR){const q=rd/CR,sw=vnoise(X*0.12,Y*0.12,11);col=mix(core2,core,cl(q*0.9+sw*0.35+dt*0.2,0,1));if(sw>0.72&&q>0.3)col=mix(col,hx('#5a0a2a'),0.6);}
   const cage=Math.abs(rd-CR-4)<1.6||(rd<CR+5&&rd>CR-2&&Math.abs(Math.sin(ang*4))<0.12);if(cage)col=mix(hx('#5a3a6a'),rim,cl(0.4+0.5*-Math.sin(ang)+dt*0.3,0,1));
   // two pillars framing the room
   for(const pxl of [14,256]){const dx=Math.abs(X-pxl);if(dx<11){const s2=dx/11;col=mix(mix(hx('#4a2a62'),hx('#1a0c28'),s2*s2),rim,(X<pxl===(pxl<135))?0:0.12);if(Math.floor(Y/22)%2===0&&Math.abs(Y%22-11)<1)col=mix(col,hot,0.4);}}
   if(Y>FY-8)col=mix(col,base,0.6*(Y-FY+8)/8);}
  else{// hex-ish plate floor with perspective
   const t=(Y-FY)/(h-FY),sc=1+t*1.8,u=(X-cx)/sc,row=Math.floor((Y-FY)/(5+t*7)),off=row%2?9:0,cell=((u+off+999)%18);
   col=mix(fl2,fl,cl(t*0.8+dt*0.15,0,1));if(cell<0.9*sc||((Y-FY)%(5+t*7))<0.8)col=mix(col,hx('#0a0612'),0.7);
   if(Y<FY+1.2)col=rim;else if(Y<FY+3)col=mix(rim,col,0.6);
   const rg=Math.max(0,1-Math.abs(X-cx)/120)*(1-t);col=mix(col,core,rg*0.22);}
  const i=(py*w*r+px)*4;d[i]=col[0];d[i+1]=col[1];d[i+2]=col[2];d[i+3]=255;}
 x.putImageData(im,0,0);return c;}

// ================= build all (bosses lazily) =================
const A={};
A.ship=[-2,-1,0,1,2].map(shipFrame);A.ships=[A.ship,[-2,-1,0,1,2].map(wispFrame),[-2,-1,0,1,2].map(bulwarkFrame)];A.shipW=white(A.ship[2]);A.flame=[0,1,2,3].map(flame);
A.en={drone:[0,1,2,3].map(drone),weaver:[0,1,2,3].map(weaver),gun:[0,1,2,3].map(gunship),kami:[0,1,2,3].map(kami)};A.enW={};for(const k in A.en)A.enW[k]=white(A.en[k][0]);
A.rock=[];for(let f=0;f<8;f++)A.rock.push(rockF(f,2.3));A.rockW=white(A.rock[0]);
A.mara=maraSet();
A.pe={crawler:[0,1,2,3].map(f=>crawler(f)),turret:[],flyer:[0,1,2,3].map(f=>flyer(f))};A.peH={crawler:crawler(0,1),flyer:flyer(0,1),turret:[]};for(let i=0;i<8;i++){A.pe.turret.push(turret(i/8*Math.PI*2));A.peH.turret.push(turret(i/8*Math.PI*2,1));}A.peW={};for(const k in A.pe)A.peW[k]=white(A.pe[k][0]);
const BR={};A.brute=d=>{if(BR[d])return BR[d];const walk=[0,1,2,3].map(f=>brute(d,f,false)),atk=[brute(d,0,true),brute(d,1,true)];return BR[d]={walk,atk,hit:brute(d,1,false,true),W:white(walk[0])};};
A.td={mara:[0,1,2,3].map(dir=>[0,1,2,3].map(f=>topdown(maraTD,dir,f))),ch:CH.map(fn=>[0,1,2,3].map(dir=>[0,1,2,3].map(f=>topdown(fn,dir,f))))};
A.tdW=A.td.ch.map(c=>white(c[0][0]));
A.coin=coins();A.hp=hpPick();A.pickup=pickup;
A.boom=explosion(['#ffffff','#fff09a','#ffb43a','#ff5a2a','#a02030']);A.boomB=explosion(['#ffffff','#c8f8ff','#5ad0ff','#3a6aff','#2a2a8a']);
const BS={};A.boss=(d,fin)=>{const k=fin?'f':d;return BS[k]||(BS[k]=boss(d,fin));};
const TL={};A.tiles=(pal,ceil,seed)=>{const k=pal.join()+ceil;return TL[k]||(TL[k]=tiles(pal,ceil,seed));};
const HB={};A.hack=(col,k)=>HB[k]||(HB[k]=hackBlock(col,k));
const BGS={};A.bg=(d,pal,bg,H,r)=>{const k=d+pal.join()+r;return BGS[k]||(BGS[k]=bgSet(d,pal,bg,H,r));};
const MW={};A.wall=(pal,m,v)=>{const k=pal.join()+m+'_'+v;return MW[k]||(MW[k]=mazeWall(pal,m,v));};
let PT=null;A.portrait=k=>(PT||(PT=portraits()))[k];
const SPS={};A.space=(d,r)=>SPS[d+'_'+r]||(SPS[d+'_'+r]=spaceSet(d,r));
let DU_A=null;A.duel=()=>DU_A||(DU_A={mara:maraDuelSet(),ch:champSet()});const DBG={};A.duelBg=r=>DBG[r]||(DBG[r]=duelBg(r));A.tint=tint;
A.white=white;A.paint=paint;A.MAT=MAT;A.el=el;return A;})();
