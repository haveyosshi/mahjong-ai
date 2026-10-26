"""Create reproducible asset parts from an existing Pages-ready public directory."""
import gzip
import hashlib
import io
import json
import tarfile
from pathlib import Path

root = Path(__file__).resolve().parents[1]
public = root / 'public'
assets = sorted(p for p in public.rglob('*') if p.is_file())
manifest = [{'path': p.relative_to(public).as_posix(), 'sha256': hashlib.sha256(p.read_bytes()).hexdigest()} for p in assets]
buffer = io.BytesIO()
with gzip.GzipFile(fileobj=buffer, mode='wb', filename='', mtime=0) as compressed:
    with tarfile.open(fileobj=compressed, mode='w') as archive:
        for path in assets:
            data = path.read_bytes()
            info = tarfile.TarInfo(path.relative_to(public).as_posix())
            info.size = len(data)
            info.mode = 0o644
            archive.addfile(info, io.BytesIO(data))
data = buffer.getvalue()
parts = []
directory = root / 'assets'
directory.mkdir(exist_ok=True)
for index, offset in enumerate(range(0, len(data), 524288)):
    piece = data[offset:offset + 524288]
    name = f'piece-{index:03d}'
    (directory / name).write_bytes(piece)
    parts.append({'name': name, 'bytes': len(piece), 'sha256': hashlib.sha256(piece).hexdigest()})
(root / 'assets.json').write_text(json.dumps(manifest, indent=2) + '\n')
(root / 'assets.parts.json').write_text(json.dumps({'archive_sha256': hashlib.sha256(data).hexdigest(), 'parts': parts}, indent=2) + '\n')
print(f'{len(assets)} assets, {len(data)} compressed bytes, {len(parts)} parts')
