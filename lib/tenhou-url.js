const LOG_ID = /^\d{10}gm-[0-9a-f]{4}-[0-9a-f]{4,6}-[0-9a-f]{8}$/i;
const HOSTS = new Set(['tenhou.net','www.tenhou.net','cdn.tenhou.net']);

export function parseTenhouReference(input) {
  let text = String(input || '').trim().replace(/^<|>$/g, '').replace(/&amp;/gi, '&');
  if (text.length > 4096) throw Error('天鳳の牌譜URLを入力してください。');
  if (/^https?%3a/i.test(text)) {try {text = decodeURIComponent(text);} catch {}}
  if (LOG_ID.test(text)) return {id:text.toLowerCase(),player:0,url:`https://tenhou.net/0/?log=${text.toLowerCase()}`};
  if (/^(?:www\.|cdn\.)?tenhou\.net\//i.test(text)) text = 'https://' + text;
  let url;
  try {url = new URL(text);} catch {throw Error('天鳳の牌譜URLを入力してください。');}
  if (!['http:','https:'].includes(url.protocol) || !HOSTS.has(url.hostname.toLowerCase()) || url.username || url.password || url.port) throw Error('tenhou.net の牌譜URLを入力してください。');
  if (!/^\/(?:[0356]\/?|0\/log\/?|5\/mjlog2json\.cgi)$/.test(url.pathname)) throw Error('天鳳の牌譜再生URL（log=を含むURL）を入力してください。');
  const hash = new URLSearchParams(url.hash.slice(1));
  const id = url.searchParams.get('log') || hash.get('log') || url.search.slice(1).split('&')[0];
  if (!LOG_ID.test(id)) throw Error('牌譜IDが見つかりません。天鳳の「牌譜URL」をコピーしてください。');
  const tw = url.searchParams.get('tw') ?? hash.get('tw') ?? '0';
  const player = /^[0-3]$/.test(tw) ? Number(tw) : 0;
  return {id:id.toLowerCase(),player,url:`https://tenhou.net/0/?log=${id.toLowerCase()}&tw=${player}`};
}

export const TENHOU_MAX_BYTES = 8_000_000;
export async function readTenhouResponse(response) {
  if (!response.ok) throw Error('天鳳から牌譜を取得できませんでした。');
  if (Number(response.headers.get('content-length')) > TENHOU_MAX_BYTES) throw Error('牌譜データが大きすぎます。');
  let text;
  if (response.body) {
    const reader = response.body.getReader(), decoder = new TextDecoder();
    let size = 0; text = '';
    try {
      while (true) {
        const {value,done} = await reader.read(); if (done) break;
        size += value.byteLength;
        if (size > TENHOU_MAX_BYTES) {await reader.cancel(); throw Error('牌譜データが大きすぎます。');}
        text += decoder.decode(value,{stream:true});
      }
      text += decoder.decode();
    } finally {reader.releaseLock();}
  } else text = await response.text();
  text = text.trim();
  if (/^(?:<\?xml[^>]*>\s*)?<mjloggm[\s>]/.test(text) && text.endsWith('</mjloggm>') && /<INIT[\s>]/.test(text)) return {text,format:'xml'};
  try {
    const data = JSON.parse(text);
    if (Array.isArray(data.log) && data.log.length && Array.isArray(data.name)) return {text,format:'json'};
  } catch {}
  throw Error('天鳳から有効な牌譜が返されませんでした。URLや公開状態をご確認ください。');
}

/** @param {string} input @param {{signal?:AbortSignal,fetchImpl?:typeof fetch,onStage?:(stage:string)=>void,timeoutMs?:number}} options */
export async function fetchTenhouInput(input,{signal,fetchImpl=fetch,onStage=()=>{},timeoutMs=12000}={}) {
  const reference = parseTenhouReference(input);
  signal?.throwIfAborted();
  onStage('天鳳から牌譜を取得中');
  try {
    const response = await fetchImpl(`https://tenhou.net/5/mjlog2json.cgi?${reference.id}`,{mode:'cors',credentials:'omit',redirect:'error',signal:signal?AbortSignal.any([signal,AbortSignal.timeout(timeoutMs)]):AbortSignal.timeout(timeoutMs)});
    const data = await readTenhouResponse(response);
    return {...data,...reference};
  } catch {
    signal?.throwIfAborted();
    throw Error('GitHub Pages版でURLを取得できませんでした。天鳳から保存したXML・JSON牌譜を読み込んでください。');
  }
}
