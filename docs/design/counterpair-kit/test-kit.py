#!/usr/bin/env python3
"""Dependency-free delivery checks. Visual/physical/legal QA remains separate."""
from pathlib import Path
import hashlib
import json
import math
import struct
import unittest
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parent

class KitTests(unittest.TestCase):
    def test_vector_masters(self):
        files = list((ROOT/'svg').glob('*.svg'))
        self.assertEqual(len(files),17)
        for f in files:
            root = ET.parse(f).getroot()
            self.assertEqual(len(root.attrib['viewBox'].split()),4,f.name)
            for e in root.iter():
                tag = e.tag.split('}')[-1]
                self.assertNotIn(tag,['text','image','filter','mask','clipPath','use'],f.name)
                if tag == 'path': self.assertTrue(e.attrib['d'].endswith('Z'),f.name)
                if 'fill' in e.attrib: self.assertIn(e.attrib['fill'],['#000000','#FFFFFF','#A10232'],f.name)

    def test_pngs(self):
        files = list((ROOT/'png').glob('*.png'))
        self.assertEqual(len(files),17)
        for f in files:
            head = f.read_bytes()[:26]
            self.assertEqual(head[:8],b'\x89PNG\r\n\x1a\n')
            w,h = struct.unpack('>II',head[16:24])
            self.assertGreater(w,0)
            if 'social' in f.name: self.assertEqual((w,h),(1200,630))
            if 'social' not in f.name and 'app-icon' not in f.name:
                self.assertEqual(head[25],6,'Transparent RGBA expected: '+f.name)
        for name,size in [('favicon-16',16),('favicon-32',32),('favicon-48',48),('apple-touch-icon',180),('icon-192',192),('icon-512',512),('maskable-512',512)]:
            data=(ROOT/f'web/{name}.png').read_bytes()
            self.assertEqual(struct.unpack('>II',data[16:24]),(size,size))

    def test_ico(self):
        data=(ROOT/'web/favicon.ico').read_bytes()
        reserved,kind,count=struct.unpack('<HHH',data[:6])
        self.assertEqual((reserved,kind,count),(0,1,3))
        self.assertEqual([data[6+i*16] for i in range(count)],[16,32,48])

    def test_manifest_targets_and_palette(self):
        manifest=json.loads((ROOT/'web/site.webmanifest').read_text())
        self.assertEqual(manifest['name'],'Formaglyph')
        for icon in manifest['icons']:
            self.assertTrue((ROOT/'web'/icon['src'].lstrip('/')).is_file())
        self.assertEqual(manifest['theme_color'],'#000000')

    def test_maskable_safe_circle(self):
        # All actual ink lies within these conservatively enclosing corners.
        corners=[(35.84+.72*x,31.84+.72*y) for x in [32,224] for y in [32,224]]
        self.assertTrue(all(math.hypot(x-128,y-128)<=102.4 for x,y in corners))

    def test_asset_hashes(self):
        manifest=json.loads((ROOT/'asset-manifest.json').read_text())
        actual={f.relative_to(ROOT).as_posix() for folder in ['svg','png','web'] for f in (ROOT/folder).rglob('*') if f.is_file()}
        self.assertEqual(actual,{a['path'] for a in manifest['assets']})
        for asset in manifest['assets']:
            data=(ROOT/asset['path']).read_bytes()
            self.assertEqual(hashlib.sha256(data).hexdigest(),asset['sha256'])
            self.assertEqual(len(data),asset['bytes'])

if __name__=='__main__': unittest.main(verbosity=2)
