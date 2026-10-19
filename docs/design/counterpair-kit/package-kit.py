#!/usr/bin/env python3
"""Package the verified assets and native source, preserving working relative links."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

ROOT=Path(__file__).resolve().parent
REPO=ROOT.parents[2]
target=ROOT/'formaglyph-counterpair-kit.zip'
files=[p for p in ROOT.rglob('*') if p.is_file() and p!=target and '__pycache__' not in p.parts]
files += [REPO/'LICENSE',REPO/'LICENSE-ASSETS',ROOT.parent/'formaglyph-glyph-workbench.figcraft',ROOT.parent/'logo-concepts/c-counterpair-v2.svg']
with ZipFile(target,'w',ZIP_DEFLATED,compresslevel=9) as archive:
    archive.writestr('START-HERE.md','# Formaglyph / Counterpair\n\nOpen docs/design/counterpair-kit/README.md for assets and guidance.\nOpen docs/design/formaglyph-glyph-workbench.figcraft in Figcraft; pages 07–09 contain the identity kit.\nThe repository-relative layout preserves handoff links. No production app is included.\n')
    for file in sorted(files): archive.write(file,file.relative_to(REPO))
with ZipFile(target) as archive:
    assert archive.testzip() is None
    print(f'Verified {len(archive.namelist())} archive entries; {target.stat().st_size:,} bytes')
