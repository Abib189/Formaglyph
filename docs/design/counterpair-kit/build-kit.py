#!/usr/bin/env python3
"""Mechanical packaging of approved Counterpair artwork. No font dependency."""
from pathlib import Path
import argparse
import hashlib
import json
import re
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parent
NS = '{http://www.w3.org/2000/svg}'

def paths(file):
    return [p.attrib['d'] for p in ET.parse(file).getroot().iter(NS + 'path')]

def svg(width, height, title, body):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" width="{width}" height="{height}" role="img" aria-labelledby="title"><title id="title">{title}</title>{body}</svg>\n'

def group(data, color, transform=None, id=None):
    attrs = f' fill="{color}"'
    if transform: attrs += f' transform="{transform}"'
    if id: attrs += f' id="{id}"'
    return '<g' + attrs + '>' + ''.join(f'<path d="{d}"/>' for d in data) + '</g>'

def build():
    out = ROOT / 'svg'
    out.mkdir(exist_ok=True)
    # Source is Figcraft's native outline of Inter SemiBold, 100 px, tracking -1.5 px.
    raw = paths(ROOT / 'source/wordmark-inter-outlined.svg')
    assert len(raw) == 1 and raw[0].startswith('M0 72.754'), 'Unexpected outlined source'
    # Redraw only F: 6-unit outer shoulder, 3-unit inner shoulder; square terminals retained.
    custom_f = 'M0 72.754V6A6 6 0 0 1 6 0H46.582V10.986H16.037A3 3 0 0 0 13.037 13.986V32.813H43.311V43.652H13.037V72.754Z'
    wm = [custom_f + raw[0].split('Z', 1)[1]]
    standard = paths(ROOT / 'source/symbol-standard-v3.svg')
    reverse = paths(ROOT / 'source/symbol-reverse-v3.svg')
    small = paths(ROOT / 'source/symbol-small-v3.svg')
    for suffix, color in [('black','#000000'),('white','#FFFFFF'),('burgundy','#A10232')]:
        mark = reverse if suffix == 'white' else standard
        items = {
            'symbol': svg(256,256,'Formaglyph Counterpair symbol',group(mark,color,id='symbol')),
            'symbol-small': svg(16,16,'Formaglyph Counterpair small-size symbol',group(small,color,id='symbol')),
            'wordmark': svg(581.293,126.336,'Formaglyph wordmark',group(wm,color,'translate(16 16)','wordmark')),
            'horizontal': svg(1152,256,'Formaglyph horizontal logo',group(mark,color,id='symbol')+group(wm,color,'translate(296 76) scale(1.5)','wordmark')),
            'stacked': svg(864,448,'Formaglyph stacked logo',group(mark,color,'translate(304 0)','symbol')+group(wm,color,'translate(102.424 294) scale(1.2)','wordmark')),
        }
        for kind, data in items.items():
            (out / f'formaglyph-{kind}-{suffix}.svg').write_text(data)
    # App icon geometry is also true negative space, not painted cut-outs.
    icon = svg(256,256,'Formaglyph app icon','<rect width="256" height="256" rx="56" fill="#000000"/>'+group(reverse,'#FFFFFF','translate(20.48 16.48) scale(.84)','symbol'))
    (out / 'formaglyph-app-icon.svg').write_text(icon)
    # Full-bleed tile and a reduced safe-circle cut for platform masks.
    web = ROOT / 'web'
    web.mkdir(exist_ok=True)
    favicon = svg(16,16,'Formaglyph favicon','<rect width="16" height="16" rx="3" fill="#000000"/>'+group(small,'#FFFFFF',id='symbol'))
    (web / 'favicon.svg').write_text(favicon)
    (web / 'formaglyph-favicon.svg').write_text(favicon)
    (web / 'formaglyph-app-icon.svg').write_text(icon)
    tile = svg(256,256,'Formaglyph platform icon','<rect width="256" height="256" fill="#000000"/>'+group(reverse,'#FFFFFF','translate(20.48 16.48) scale(.84)','symbol'))
    (web / 'platform-icon.svg').write_text(tile)
    maskable = svg(256,256,'Formaglyph maskable platform icon','<rect width="256" height="256" fill="#000000"/>'+group(reverse,'#FFFFFF','translate(35.84 31.84) scale(.72)','symbol'))
    (web / 'maskable.svg').write_text(maskable)
    # Open Graph image, an identity card only: no unbuilt product claim.
    social = svg(1200,630,'Formaglyph social identity','<rect width="1200" height="630" fill="#000000"/>'+group(reverse,'#FFFFFF','translate(130 180) scale(.8)')+group(wm,'#FFFFFF','translate(386 242) scale(1.18)')+'<rect x="130" y="486" width="40" height="4" fill="#A10232"/>')
    (out / 'formaglyph-social-card.svg').write_text(social)
    print('Built 17 vector assets from verified outlined source')

def manifest():
    entries = []
    for folder in ['svg','png','web']:
        for p in sorted((ROOT/folder).rglob('*')):
            if p.is_file(): entries.append({'path':p.relative_to(ROOT).as_posix(),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
    (ROOT/'asset-manifest.json').write_text(json.dumps({'brand':'Formaglyph','mark':'C — Counterpair','version':'1.0.0','date':'2026-10-19','assets':entries},indent=2)+'\n')
    print(f'Manifest: {len(entries)} assets')

if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--manifest',action='store_true')
    args = ap.parse_args()
    manifest() if args.manifest else build()
