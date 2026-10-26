'use client';
import {useEffect,useRef,useState} from 'react';
import {useRouter} from 'next/navigation';
import {ArrowRight,Check,ChevronRight,FileText,FolderOpen,LoaderCircle,Upload,X} from 'lucide-react';
import {MODELS,DEFAULT_MODEL} from '../public/engine/models.js';
import {parseInput} from '../lib/paifu.js';
import {readPaifuFile} from '../public/engine/paifu-file.js';
import {fetchTenhouInput} from '../lib/tenhou-url.js';
import {analyzeSelectedModels,validateAnalysisSession} from '../lib/analysis-session.js';
import {useAnalysisSession} from '../components/analysis-session-provider';

export default function IntakePage(){
 const router=useRouter(),{session,complete}=useAnalysisSession();
 const [inputMode,setInputMode]=useState('data'),[urlInput,setUrlInput]=useState(''),[input,setInput]=useState(''),[filename,setFilename]=useState(''),[sample,setSample]=useState(false),[models,setModels]=useState<string[]>([DEFAULT_MODEL]),[busy,setBusy]=useState<any>(null),[reading,setReading]=useState(false),[error,setError]=useState('');
 const fileRef=useRef<HTMLInputElement>(null),controller=useRef<AbortController|null>(null),sequence=useRef(0);
 const disabled=!!busy||reading,sourceInput=inputMode==='url'?urlInput:input;
 useEffect(()=>()=>{sequence.current++;controller.current?.abort()},[]);
 function toggle(id:string){if(disabled)return;setModels(current=>current.includes(id)?current.filter(x=>x!==id):[...current,id])}
 function cancel(){sequence.current++;controller.current?.abort();controller.current=null;setBusy(null);setReading(false);setError('')}
 async function readFile(file:File){
  if(disabled)return;const job=++sequence.current;setReading(true);setError('');
  try{const text=await readPaifuFile(file);if(job!==sequence.current)return;setInput(text);setInputMode('data');setFilename(file.name);setSample(false)}catch(e:any){if(job===sequence.current)setError(e.message||'ファイルを読み込めませんでした。')}finally{if(job===sequence.current)setReading(false)}
 }
 async function loadSample(){
  const job=++sequence.current;setReading(true);setError('');
  try{const response=await fetch('/mahjong-ai/examples/sample.json');if(!response.ok)throw Error();const text=await response.text();if(job!==sequence.current)return;setInput(text);setInputMode('data');setFilename('サンプル牌譜');setSample(true)}catch{if(job===sequence.current)setError('サンプルを読み込めませんでした。')}finally{if(job===sequence.current)setReading(false)}
 }
 async function start(){
  if(disabled||!sourceInput.trim()||!models.length)return;
  const job=++sequence.current,abort=new AbortController();controller.current=abort;setError('');
  const ids=Object.keys(MODELS).filter(id=>models.includes(id));
  try{
   setBusy({stage:'牌譜を読み込み中',percent:0,completed:[]});
   let game:any,preferredPlayer=0;
   const parsed:any=inputMode==='url'&&!/#json=/.test(sourceInput)?{url:sourceInput}:parseInput(sourceInput);
   if(parsed.session){const saved=validateAnalysisSession(parsed.session);game=saved.reports[saved.modelIds[0]].game;preferredPlayer=saved.player}
   else game=parsed.report?.game||parsed;
   if(game.url){const data=await fetchTenhouInput(game.url,{signal:abort.signal,onStage:stage=>{if(job===sequence.current)setBusy({stage,percent:0,completed:[]})}});const parsed:any=parseInput(data.text);game=parsed.report?.game||parsed;game.title='天鳳 '+data.id;preferredPlayer=data.player;game.tenhouUrl=data.url}
   if(job!==sequence.current)return;
   const result=await analyzeSelectedModels(game,ids,{signal:abort.signal,onProgress:progress=>{if(job===sequence.current)setBusy(progress)}});
   if(job!==sequence.current)return;
   result.sample=inputMode==='data'&&sample;result.player=preferredPlayer;setBusy({stage:'解析結果を準備中',percent:100,completed:ids});
   await complete(result);
   if(job!==sequence.current)return;
   controller.current=null;setBusy(null);router.push('/analysis');
  }catch(e:any){if(job!==sequence.current||e.name==='AbortError')return;setError(e.message||'牌譜を解析できませんでした。');setBusy(null);controller.current=null}
 }
 return <div className="studio-shell neuro-review intake-shell"><div className="app-main">
  <header className="topbar"><a className="brand" href="/mahjong-ai/#/"><span className="mascot-portrait brand-mascot"><img src="/mahjong-ai/brand/neuro-mascot.png" alt="NEUROのマスコット"/></span><span>NEURO<small>麻雀AI 牌譜解析</small></span></a><nav className="intake-nav" aria-label="メインメニュー"><span aria-current="page">牌譜入力</span>{session&&<a href="/mahjong-ai/#/analysis">前回の解析を開く<ChevronRight size={14}/></a>}</nav></header>
  <main className="intake-main">
   <div className="intake-intro"><div><span className="eyebrow">NEW ANALYSIS</span><h1>牌譜から、次の一手へ。</h1><p>牌譜を読み込み、解析するAIを選んでください。</p></div></div>
   <ol className="intake-steps" aria-label="解析の流れ"><li className={!busy?'current':'done'}><span>{busy?<Check size={14}/>:1}</span>牌譜を入力</li><li className={!busy?'current':'done'}><span>{busy?<Check size={14}/>:2}</span>AIを選択</li><li className={busy?'current':''}><span>3</span>解析して結果へ</li></ol>
   <div className="intake-grid"><section className="panel intake-file-panel"><div className="intake-section-heading"><span>01</span><div><h2>牌譜を入力</h2><p>天鳳URL・JSON・XML・MJAIに対応</p></div></div>
    <div className="paifu-input-tabs" role="group" aria-label="牌譜の入力方法"><button aria-pressed={inputMode==='url'} disabled={disabled} onClick={()=>{setInputMode('url');setError('')}}>天鳳URL</button><button aria-pressed={inputMode==='data'} disabled={disabled} onClick={()=>{setInputMode('data');setError('')}}>牌譜データ・ファイル</button></div>
    {inputMode==='url'?<div className="tenhou-url-input"><label className="input-label" htmlFor="tenhou-url">天鳳の牌譜URL</label><input id="tenhou-url" type="text" inputMode="url" autoComplete="off" spellCheck={false} value={urlInput} disabled={disabled} onChange={e=>{setUrlInput(e.target.value);setError('');setSample(false)}} placeholder="https://tenhou.net/0/?log=…&tw=0" aria-describedby="tenhou-url-help" onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();start()}}}/><p id="tenhou-url-help">天鳳の「牌譜URL」をそのまま貼り付けてください。<br/>/0/・/3/・/5/・/6/の再生URLと、牌譜IDに対応しています。</p><div className="tenhou-url-note"><FileText size={17}/><span>URLから牌譜を取得し、選択したAIで解析します。<small>URLのtwで指定されたプレイヤーを最初に表示します。</small></span></div></div>:filename?<div className="selected-file"><FileText size={28}/><div><b>{filename}</b><small>{busy?'読み込み済み · 選択したAIで解析中':'読み込み済み · 解析はまだ開始していません'}</small></div><button disabled={disabled} aria-label="牌譜ファイルの選択を解除" onClick={()=>{setInput('');setFilename('');setSample(false)}}><X size={18}/></button></div>:<><label className="input-label" htmlFor="paifu-input">牌譜のJSON / XML / MJAI</label><textarea id="paifu-input" value={input} disabled={disabled} onChange={e=>{setInput(e.target.value);setSample(false);setError('')}} placeholder="牌譜のJSON / XML / MJAIを貼り付け" rows={6}/></>}
    <div className="or-divider"><span>ファイルから読み込む</span></div>
    <button className="file-drop" disabled={disabled} onClick={()=>fileRef.current?.click()} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();if(!disabled&&e.dataTransfer.files[0])readFile(e.dataTransfer.files[0])}}>{reading?<LoaderCircle className="spin" size={28}/>:<Upload size={28}/>}<b>{reading?'牌譜を読み込み中':'牌譜ファイルをドロップ'}</b><span>クリックして選択</span><small>XML / JSON / JSONL / MJLOGGM · 50 MBまで</small></button>
    <input ref={fileRef} type="file" className="hidden" disabled={disabled} accept=".xml,.json,.jsonl,.txt,.mjloggm,.mjlog,.gz" onChange={e=>{if(e.target.files?.[0])readFile(e.target.files[0]);e.target.value=''}}/>
    <p className="fine-print">赤あり四人麻雀・全員の配牌を含むログに対応。天鳳URLが取得できない場合は、保存したXML・JSONをご利用ください。</p>
    <button className="text-button intake-sample" disabled={disabled} onClick={loadSample}><FolderOpen size={15}/>サンプル牌譜を読み込む<ArrowRight size={14}/></button>
   </section><div className="intake-settings"><section className="panel intake-model-panel"><div className="intake-section-heading"><span>02</span><div><h2>解析するAIを選択</h2><p>複数選択して、同じ局面を比較できます。</p></div></div>
    <fieldset className="intake-models" disabled={disabled}><legend className="sr-only">解析AI（複数選択可能）</legend>{Object.values(MODELS).map(model=><label key={model.id} className={'intake-model-card '+(models.includes(model.id)?'selected':'')}><input type="checkbox" checked={models.includes(model.id)} onChange={()=>toggle(model.id)}/><span className="intake-model-symbol">{model.symbol}</span><span className="intake-model-text"><b>NEURO {model.label}</b></span><span className="model-checkbox" aria-hidden="true">{models.includes(model.id)&&<Check size={14}/>}</span></label>)}</fieldset><p className="intake-selection-count">{models.length?`${models.length}体のAIを選択中`:'AIを1つ以上選んでください'}</p>
   </section><section className="panel intake-start-panel" aria-label="解析の開始">
    {busy?<div className="intake-progress" role="status" aria-live="polite"><div className="intake-progress-heading"><LoaderCircle className="spin" size={20}/><h2>{busy.stage}</h2><b>{busy.percent}%</b></div><progress max={100} value={busy.percent} aria-label="選択したAI全体の解析進捗"/><div className="model-job-list">{Object.values(MODELS).filter(model=>models.includes(model.id)).map(model=><div key={model.id}><span>{model.symbol} {model.label}</span><small>{busy.completed?.includes(model.id)?<><Check size={13}/>完了</>:busy.modelId===model.id?'解析中':'待機中'}</small></div>)}</div><p>すべてのAIの解析が終わると、結果ページへ移動します。画面を開いたままお待ちください。</p><button className="button secondary" onClick={cancel} disabled={busy.percent===100}>解析をキャンセル</button></div>:<><div className="intake-start-title"><span>03</span><h2>準備ができたら、解析へ。</h2></div><p>選択したAIで解析し、結果ページで推奨打牌と対局レポートを確認できます。</p><button className="button primary intake-submit" disabled={reading||!sourceInput.trim()||!models.length} onClick={start}>{models.length>1?`${models.length}体のAIで解析する`:'選択したAIで解析する'}<ArrowRight size={17}/></button></>}
    {error&&<div className="modal-error" role="alert">{error}</div>}
   </section><div className="intake-coach"><span className="mascot-portrait"><img src="/mahjong-ai/brand/neuro-mascot.png" alt="NEUROのマスコット"/></span><p>気になる一手を、一緒に。<small>結果ページで私が推奨打牌をコメントするよ。</small></p></div></div></div>
   <footer className="app-footer"><span>NEURO</span><a href="/mahjong-ai/#/licenses">ライセンス</a></footer>
  </main></div></div>;
}
