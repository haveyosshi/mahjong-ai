/** Reconstruct result details off the UI thread, preserving the stored AI data.
 * @param {any} report
 * @param {{signal?: AbortSignal, createWorker?:()=>Worker}} [options]
 */
export function backfillWinReport(report,{signal,createWorker=()=>new Worker('/mahjong-ai/engine/win-worker.js',{type:'module'})}={}){
 return new Promise((resolve,reject)=>{
  const worker=createWorker();let finished=false;
  const finish=(error,value)=>{if(finished)return;finished=true;signal?.removeEventListener('abort',abort);worker.terminate();error?reject(error):resolve(value);};
  const abort=()=>finish(new DOMException('結果の読み込みを中止しました。','AbortError'));
  signal?.addEventListener('abort',abort,{once:true});if(signal?.aborted){abort();return;}
  worker.onmessage=e=>e.data.error?finish(Error(e.data.error)):finish(null,e.data.report);
  worker.onerror=()=>finish(Error('和了情報を復元できませんでした。'));
  worker.postMessage({report});
 });
}
