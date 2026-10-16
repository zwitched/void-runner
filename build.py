# Builds dist/index.html: one self-contained file (JS inlined, icon as data URI, no SW/manifest).
import base64,pathlib
r=pathlib.Path(__file__).parent;h=(r/'index.html').read_text();js=(r/'sprites.js').read_text()+'\n'+(r/'game.js').read_text()
ic='data:image/png;base64,'+base64.b64encode((r/'icon.png').read_bytes()).decode()
h=h.replace('<link rel="manifest" href="manifest.webmanifest">','').replace('href="icon.png"',f'href="{ic}"')
h=h.replace('<script src="sprites.js"></script><script src="game.js"></script>','<script>'+js.replace('</script','<\\/script')+'</script>')
(r/'dist').mkdir(exist_ok=True);(r/'dist/index.html').write_text(h);print('dist/index.html',len(h))
