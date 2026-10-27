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

# Small model updates are stored separately from the stable shared assets.
risk = root / 'risk-model'
update = json.loads((risk / 'manifest.json').read_text())
model = bytearray()
for part in update['parts']:
    data = (risk / part['name']).read_bytes()
    if len(data) != part['bytes'] or hashlib.sha256(data).hexdigest() != part['sha256']:
        raise ValueError('Risk model part checksum mismatch: ' + part['name'])
    model.extend(data)
if hashlib.sha256(model).hexdigest() != update['onnx_sha256']:
    raise ValueError('Risk model checksum mismatch')
metadata = json.loads((risk / 'uchikawa.json').read_text())
if metadata['dataset_games'] != update['dataset_games'] or metadata['id'] != 'uchikawa':
    raise ValueError('Risk model metadata mismatch')
engine = root / 'public' / 'engine'
(engine / update['modelFile']).write_bytes(model)
(engine / update['replaced_modelFile']).unlink(missing_ok=True)
(engine / 'models/uchikawa.json').write_text(json.dumps(metadata, ensure_ascii=False) + '\n')
info = {k: update[k] for k in ['id', 'name', 'status', 'dataset_games', 'target_games', 'onnx_sha256', 'modelFile', 'feature_shape', 'outputs', 'target']}
(engine / 'uchikawa-model.js').write_text('export const UCHIKAWA_MODEL = ' + json.dumps(info, ensure_ascii=False) + ';\n')
for filename in ['tile-risk.js', 'tile-risk-worker.js', 'tile-risk-runtime.js']:
    path = engine / filename
    path.write_text(path.read_text().replace('uchikawa-20261026', update['cache_tag']))
print(f"Uchikawa {metadata['dataset_games']:,}-game model verified and installed.")
