'use client';
import {tileImage,tileLabel} from '../../lib/paifu.js';
import {tileKind} from '../../public/engine/tile-risk.js';
const riskPercent=(n:number)=>n===0?'0.0%':n<.001?'<0.1%':(n*100).toFixed(1)+'%';
const ROWS=[{rel:3,label:'上家',color:'#f0bb71'},{rel:2,label:'対面',color:'#df80c6'},{rel:1,label:'下家',color:'#54dccb'}];
export function TileRiskBars({tile,risk}:{tile:string,risk:any}){const k=tileKind(tile);return <span className="tile-risk-bars" aria-hidden="true">{ROWS.map(row=><i key={row.rel} style={{background:row.color,opacity:risk?.risks?.[row.rel-1]?.[k] != null ? .3+Math.min(.7,risk.risks[row.rel-1][k]*5) : .15}}/>)}</span>}
export default function TileRiskTooltip({tile,risk,player,names}:{tile:string,risk:any,player:number,names:string[]}){
 const k=tileKind(tile);return <aside id="tile-risk-tooltip" className="tile-risk-tooltip" role="tooltip" aria-label={tileLabel(tile)+'の他家別推定放銃率'}>
  <div className="tile-risk-title"><img src={tileImage(tile)} alt=""/><b>{tileLabel(tile)}</b><span>推定放銃率</span></div>
  {ROWS.map(row=><div className="tile-risk-row" key={row.rel}><span style={{color:row.color}}>{row.label}<small>{names[(player+row.rel)%4]}</small></span><b>{risk?.risks?riskPercent(risk.risks[row.rel-1][k]||0):risk?.error?'—':'計算中'}</b></div>)}
  <p>{risk?.error?'この局面の推定値を取得できません。':'ウチカワによる推定値です。'}</p>
 </aside>;
}
