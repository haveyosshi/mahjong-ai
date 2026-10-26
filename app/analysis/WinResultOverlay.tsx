'use client';
import {useEffect,useState} from 'react';
import {X,ArrowRight,Trophy} from 'lucide-react';
import {roundResult} from '../../public/engine/round-result.js';
import {loadShanten} from '../../public/engine/shanten.js';
import {sortTiles,tileImage,tileLabel} from '../../lib/paifu.js';
const WINDS=['東','南','西','北'],REL=['自家','下家','対面','上家'],COLORS=['#c29aff','#54dccb','#df80c6','#f0bb71'];
const number=(v:number)=>v?.toLocaleString('ja-JP')??'—';
function ResultTile({tile,hidden=false,winning=false}:{tile?:string,hidden?:boolean,winning?:boolean}){return <span className={'win-tile '+(hidden?'hidden-tile ':'')+(winning?'winning-tile':'')} title={hidden?'伏せ牌':tileLabel(tile)}>{!hidden&&tile&&<img src={tileImage(tile)} alt={tileLabel(tile)} draggable={false}/>}</span>}
export default function WinResultOverlay({view,names,onContinue,perspective=0}:{view:any,names:string[],onContinue?:()=>void,perspective?:number}){
 const [closed,setClosed]=useState(false),[shanten,setShanten]=useState<any>(null),[shantenFailed,setShantenFailed]=useState(false);
 useEffect(()=>{let active=true;if(view.event?.type==='ryukyoku')loadShanten().then(fn=>{if(active)setShanten(()=>fn);}).catch(()=>{if(active)setShantenFailed(true);});return()=>{active=false;};},[view.event?.type]);
 const result:any=roundResult(view,{shanten});if(!result)return null;
 const draw=result.type==='ryukyoku',label=draw?'流局結果':'和了結果',rel=(p:number)=>(p-perspective+4)%4;
 if(closed)return <button className="win-reopen" onClick={()=>setClosed(false)}><Trophy size={16}/>{label}を表示</button>;
 const win=draw?null:result,e=view.event,own=win?view.hands[e.actor]:[],winning=win?(e.pai||(win.tsumo?view.drawn[e.actor]:view.rivers[e.target]?.at(-1)?.tile)):null;
 const hand=win?.concealedTiles?.length?sortTiles(win.concealedTiles):sortTiles(own),tiles=win?.tsumo||hand.length%3===2?hand:winning?[...hand,winning]:hand;
 const order=draw?[1,2,3,0].map(i=>(perspective+i)%4):[0,1,2,3].map(i=>(win.actor+i)%4);
 return <section className={'win-result-overlay round-result-overlay '+(draw?'draw-result-overlay':'')} aria-label={label}>
  <button className="win-close" aria-label={label+'を閉じる'} onClick={()=>setClosed(true)}><X size={20}/></button>
  <div className="win-context">{WINDS['ESWN'.indexOf(view.bakaze)]}{view.kyoku}局 {view.honba}本場 の結果</div>
  {draw?<>
   <div className="round-result-heading"><h2>流局</h2><span>{result.reason}</span></div>
   <div className="draw-statuses">{[1,2,3,0].map(i=>{const p=(perspective+i)%4;return <div key={p}><b style={{color:COLORS[i]}}>{REL[i]}</b><small>{names[p]}</small><strong className={result.tenpai[p]?'tenpai':'noten'}>{result.tenpai[p]===true?'聴牌':result.tenpai[p]===false?'ノーテン':result.normal?(shantenFailed?'不明':'確認中'):'—'}</strong></div>;})}</div>
   <div className="draw-hands">{[1,2,3,0].map(i=>{const p=(perspective+i)%4;return result.tenpai[p]===true?<div className="draw-hand" key={p}><span style={{color:COLORS[i]}}>{REL[i]}</span><div>{sortTiles(view.hands[p]).map((t:string,j:number)=><ResultTile key={j} tile={t}/>)}{view.melds[p]?.map((m:any,j:number)=><span className="win-meld" key={'m'+j}>{m.tiles.map((t:string,k:number)=><ResultTile key={k} tile={t} hidden={m.type==='ankan'&&(k===0||k===3)}/>)}</span>)}</div></div>:null;})}</div>
  </>:<>
   <div className="round-result-heading"><h2 className={win.tsumo?'tsumo-result':''}>{win.tsumo?'ツモ':'ロン'}</h2><b style={{color:COLORS[rel(win.actor)]}}>{REL[rel(win.actor)]}</b><small>{names[win.actor]}</small><div>{win.fu?`${win.fu}符 `:''}{win.han?`${win.han}翻 `:win.yakuman?'役満 ':''}<strong>{win.limit} {win.points!=null?number(win.points):'和了'}</strong>{win.points!=null&&'点'}</div></div>
   <div className="win-hand" aria-label="和了手牌">{tiles.map((t:string,i:number)=><ResultTile key={i} tile={t} winning={i===tiles.length-1&&!!winning}/>)}{view.melds[win.actor]?.map((m:any,i:number)=><span className="win-meld" key={'m'+i}>{m.tiles.map((t:string,j:number)=><ResultTile key={j} tile={t} hidden={m.type==='ankan'&&(j===0||j===3)}/>)}</span>)}</div>
   <div className="win-breakdown"><div className="win-yaku"><h3>役</h3>{win.yaku?.length?win.yaku.map((y:any,i:number)=><div key={i}><span>{y.name}</span><b>{y.yakuman?'役満':y.han!=null?`${y.han}翻`:''}</b></div>):<p>この牌譜には役の詳細がありません。</p>}</div><div className="win-indicators"><div><span>ドラ表示牌</span><div>{view.dora.map((t:string,i:number)=><ResultTile key={i} tile={t}/>)}</div></div>{view.reach[win.actor]&&<div><span>裏ドラ表示牌</span><div>{win.ura.length?win.ura.map((t:string,i:number)=><ResultTile key={i} tile={t}/>):<ResultTile hidden/>}</div></div>}</div></div>
  </>}
  {result.hasMovement?<div className="score-transfers" aria-label="点棒移動">{order.map(p=><div className={'score-transfer-row '+(!draw&&p===win.actor?'winner':'')} key={p}><div className="score-transfer-person"><b style={{color:COLORS[rel(p)]}}>{WINDS[(p-view.oya+4)%4]} · {REL[rel(p)]}</b><small>{names[p]}</small></div><div className="score-transfer-values"><span>{number(result.before[p])}</span><i>→</i><b>{number(result.after[p])}</b></div><strong className={result.deltas[p]>0?'positive':result.deltas[p]<0?'negative':'neutral'}>{result.deltas[p]>0?'+':result.deltas[p]===0?'±':''}{number(result.deltas[p])}</strong></div>)}</div>:<p className="win-missing-movement">この牌譜には点棒移動の記録がありません。</p>}
  <footer className="win-bottom"><button className="show-table" onClick={()=>setClosed(true)}>卓を見る</button>{onContinue&&<button className="next-result" onClick={onContinue}>次へ<ArrowRight size={15}/></button>}</footer>
 </section>;
}
