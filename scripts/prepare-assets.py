import hashlib
import json
import tarfile
import tempfile
from pathlib import Path

root = Path(__file__).resolve().parents[1]
manifest = json.loads((root / 'assets.parts.json').read_text())
with tempfile.TemporaryFile() as archive:
    digest = hashlib.sha256()
    for part in manifest['parts']:
        data = (root / 'assets' / part['name']).read_bytes()
        if len(data) != part['bytes'] or hashlib.sha256(data).hexdigest() != part['sha256']:
            raise ValueError('Asset part checksum mismatch: ' + part['name'])
        digest.update(data)
        archive.write(data)
    if digest.hexdigest() != manifest['archive_sha256']:
        raise ValueError('Asset archive checksum mismatch')
    archive.seek(0)
    with tarfile.open(fileobj=archive, mode='r:gz') as tar:
        tar.extractall(root / 'public', filter='data')
for item in json.loads((root / 'assets.json').read_text()):
    if hashlib.sha256((root / 'public' / item['path']).read_bytes()).hexdigest() != item['sha256']:
        raise ValueError('Asset checksum mismatch: ' + item['path'])
print('All public model, WASM, tile and example assets verified.')
