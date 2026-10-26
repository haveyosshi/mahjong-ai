import concurrent.futures,hashlib,json,urllib.request
from pathlib import Path
BASE='https://neuro.lively-loach-4093.chatgpt.site/'
def fetch(item):
 path=item['path'];dest=Path('public')/path;dest.parent.mkdir(parents=True,exist_ok=True)
 data=urllib.request.urlopen(BASE+urllib.parse.quote(path),timeout=120).read()
 if hashlib.sha256(data).hexdigest()!=item['sha256']:raise ValueError('Asset checksum mismatch: '+path)
 if dest.suffix in ('.js','.mjs','.ts','.css'):
  text=data.decode()
  for prefix in ['engine','tiles','brand','examples','favicon']:
   for quote in ["'",'"','`']:text=text.replace(quote+'/'+prefix,quote+'/mahjong-ai/'+prefix)
  data=text.encode()
 dest.write_bytes(data)
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:list(pool.map(fetch,json.loads(Path('assets.json').read_text())))
print('All public model, WASM, tile and example assets verified.')
