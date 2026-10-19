#!/usr/bin/env python3
"""Repeatable raster packaging, using the logo-design skill renderer."""
import argparse
from pathlib import Path
import subprocess
import sys
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parent
ap = argparse.ArgumentParser()
ap.add_argument('--renderer', required=True, type=Path, help='logo-design/scripts/render_png.py')
args = ap.parse_args()
(ROOT/'png').mkdir(exist_ok=True)

def render(source, target, w, h):
    subprocess.run([sys.executable,str(args.renderer),str(source),'-o',str(target),'--width',str(w),'--height',str(h)],check=True)

for f in sorted((ROOT/'svg').glob('*.svg')):
    vb = [float(x) for x in ET.parse(f).getroot().attrib['viewBox'].split()]
    width = 1200 if any(k in f.name for k in ['horizontal','stacked','wordmark','social']) else 512
    if 'symbol-small' in f.name: width = 64
    render(f,ROOT/'png'/f.with_suffix('.png').name,width,round(width*vb[3]/vb[2]))
for name,size in [('apple-touch-icon',180),('icon-192',192),('icon-512',512)]:
    render(ROOT/'web/platform-icon.svg',ROOT/f'web/{name}.png',size,size)
render(ROOT/'web/maskable.svg',ROOT/'web/maskable-512.png',512,512)
for size in [16,32,48]:
    render(ROOT/'web/favicon.svg',ROOT/f'web/favicon-{size}.png',size,size)
subprocess.run([sys.executable,str(args.renderer),str(ROOT/'web/favicon.svg'),'--ico',str(ROOT/'web/favicon.ico'),'--ico-sizes','16','32','48'],check=True)
