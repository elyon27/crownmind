"""Bundle the website's generated scripture with the Android-specific presentation."""
from pathlib import Path
import shutil
from build_bible import build
ROOT=Path(__file__).resolve().parents[1]
build()
dest=ROOT/'android/app/src/main/assets/bible'
if dest.exists(): shutil.rmtree(dest)
shutil.copytree(ROOT/'dist/bible',dest)
html=(dest/'index.html').read_text(encoding='utf-8')
html=html.replace('href="/crownmind-bible-library-privacy-policy.html"','href="crownmind-bible-library-privacy-policy.html"')
html=html.replace('</head>','<link rel="stylesheet" href="mobile.css"></head>')
(dest/'index.html').write_text(html,encoding='utf-8')
for name in ['mobile.css']:shutil.copy2(ROOT/'android/mobile'/name,dest/name)
shutil.copy2(ROOT/'crownmind-bible-library-privacy-policy.html',dest/'crownmind-bible-library-privacy-policy.html')
print('Prepared offline Android assets')
