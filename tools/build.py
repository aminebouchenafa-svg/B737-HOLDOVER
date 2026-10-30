#!/usr/bin/env python3
"""Assemble index.html (fichier unique, hors ligne) : gabarit + JSON MANEX + polices + icône en base64.
Usage : python3 tools/build.py"""
import base64, json, pathlib, datetime
R = pathlib.Path(__file__).resolve().parent.parent
b64 = lambda p: base64.b64encode((R / p).read_bytes()).decode()
data = json.loads((R / 'data/hot_tables_manexA_2025-2026.json').read_text(encoding='utf-8'))
version = datetime.date.today().isoformat()
html = (R / 'src/app.html').read_text(encoding='utf-8')
for k, v in {
    '__HOT_JSON__': json.dumps(data, ensure_ascii=False, separators=(',', ':')),
    '__FONT_ORB__': b64('src/fonts/orb.woff2'),
    '__FONT_STM__': b64('src/fonts/stm.woff2'),
    '__FONT_CINZEL__': b64('src/fonts/cinzel.woff2'),
    '__ICON_180__': b64('icons/icon-180.png'),
    '__VERSION__': version,
}.items():
    assert k in html, k
    html = html.replace(k, v)
(R / 'index.html').write_text(html, encoding='utf-8')
sw = (R / 'src/sw.js').read_text(encoding='utf-8').replace('__VERSION__', version)
(R / 'sw.js').write_text(sw, encoding='utf-8')
print(f'index.html : {len(html)//1024} Ko — version {version}')
