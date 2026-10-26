import {getModel, identifyReportModel} from '../public/engine/models.js';
import {parseInput} from './paifu.js';

export const SESSION_SCHEMA = 'neuro-analysis-session/1';

export function createAnalysisSession(reports, modelIds, sample = false, player = 0) {
  const ids = [...new Set(modelIds)];
  if (!ids.length) throw Error('解析するAIを1つ以上選んでください。');
  let signature;
  for (const id of ids) {
    getModel(id);
    const report = reports[id];
    if (identifyReportModel(report)?.id !== id) throw Error('解析モデルと結果が一致しません。');
    const current = JSON.stringify([report.game.events, report.game.names, report.game.finalScores]);
    if (signature && current !== signature) throw Error('異なる牌譜の解析結果が含まれています。');
    signature = current;
  }
  return {schema: SESSION_SCHEMA, createdAt: new Date().toISOString(), modelIds: ids, reports: Object.fromEntries(ids.map(id => [id, reports[id]])), sample, player:Number.isInteger(player) && player >= 0 && player < 4 ? player : 0};
}

export function validateAnalysisSession(value) {
  if (value?.schema !== SESSION_SCHEMA || !Array.isArray(value.modelIds) || !value.reports) throw Error('解析結果の形式が不正です。');
  const reports = Object.fromEntries(value.modelIds.map(id => [id, parseInput(JSON.stringify(value.reports[id])).report]));
  return {...createAnalysisSession(reports, value.modelIds, !!value.sample, value.player), createdAt: value.createdAt};
}

/** @param {any} game @param {string[]} modelIds @param {{signal?:AbortSignal,onProgress?:(progress:any)=>void,createWorker?:()=>any}} options */
export async function analyzeSelectedModels(game, modelIds, {signal, onProgress = () => {}, createWorker = () => new Worker('/mahjong-ai/engine/analysis-worker.js?v=hermes-call2-20261026', {type:'module'})} = {}) {
  const ids = [...new Set(modelIds)];
  if (!ids.length) throw Error('解析するAIを1つ以上選んでください。');
  ids.forEach(getModel);
  const reports = {};
  for (const [index, id] of ids.entries()) {
    signal?.throwIfAborted();
    const report = await new Promise((resolve, reject) => {
      let worker, settled = false;
      const finish = (error, value) => {
        if (settled) return;
        settled = true;
        signal?.removeEventListener('abort', abort);
        worker?.terminate();
        error ? reject(error) : resolve(value);
      };
      const abort = () => finish(new DOMException('解析をキャンセルしました。', 'AbortError'), null);
      try {
        worker = createWorker();
        signal?.addEventListener('abort', abort, {once:true});
        if (signal?.aborted) {abort(); return;}
        const progress = p => onProgress({...p, modelId:id, modelIndex:index, modelCount:ids.length, completed:ids.slice(0,index), percent:Math.round((index + Math.max(0, Math.min(1, p.current / Math.max(1,p.total)))) / ids.length * 100)});
        worker.onmessage = e => {
          if (settled) return;
          const data = e.data;
          if (data.type === 'progress') progress(data);
          if (data.type === 'error') finish(Error(data.error), null);
          if (data.type === 'complete') {
            if (identifyReportModel(data.report)?.id !== id) finish(Error('選択したAIと解析結果が一致しません。'), null);
            else finish(null, data.report);
          }
        };
        worker.onerror = () => finish(Error('解析エンジンを開始できませんでした。ページを再読み込みしてください。'), null);
        progress({stage:getModel(id).name+'を準備中',current:0,total:1});
        worker.postMessage({game,modelId:id});
      } catch (error) {finish(error, null);}
    });
    reports[id] = report;
  }
  signal?.throwIfAborted();
  return createAnalysisSession(reports, ids);
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('neuro-analysis', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('sessions');
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(Error('結果の保存先を開けません。'));
    request.onsuccess = () => {request.result.onversionchange = () => request.result.close(); resolve(request.result);};
  });
}

export async function saveAnalysisSession(session) {
  const db = await openDatabase();
  try {
    await new Promise((resolve, reject) => {
      const transaction = db.transaction('sessions', 'readwrite');
      transaction.objectStore('sessions').put(session, 'latest');
      transaction.oncomplete = () => resolve(null);
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  } finally {db.close();}
}

export async function loadAnalysisSession() {
  const db = await openDatabase();
  try {
    const value = await new Promise((resolve, reject) => {
      const request = db.transaction('sessions').objectStore('sessions').get('latest');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    return value ? validateAnalysisSession(value) : null;
  } finally {db.close();}
}
