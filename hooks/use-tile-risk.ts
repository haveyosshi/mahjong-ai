'use client';
import {useEffect,useRef,useState} from 'react';
import {publicRiskInput} from '../public/engine/tile-risk.js';
export function useTileRisk(report:any,snapshot:number,player:number) {
 const worker=useRef<Worker|null>(null),sequence=useRef(0),[value,setValue]=useState<any>(null);
 useEffect(()=>()=>{sequence.current++;worker.current?.terminate();worker.current=null;},[]);
 useEffect(()=>{
  const id=++sequence.current,view=report?.snapshots?.[snapshot];setValue(null);
  if(!view?.hands||['hora','ryukyoku','end_kyoku','end_game'].includes(view.event?.type))return;
  // Send only this round's public history and our own hand to the worker.
  let start=snapshot;while(start>0&&report.game.events[start]?.type!=='start_kyoku')start--;
  const timer=setTimeout(()=>{try{
   const input=publicRiskInput(view,player,report.game.events.slice(start,snapshot+1));
   worker.current ||= new Worker('/mahjong-ai/engine/tile-risk-worker.js?v=uchikawa-25000-20261028',{type:'module'});
   const current=worker.current;current.onmessage=e=>{if(e.data.id===sequence.current)setValue({report,snapshot,player,data:e.data.error?{error:e.data.error}:{risks:e.data.risks}});};
   current.onerror=()=>{if(id===sequence.current)setValue({report,snapshot,player,data:{error:'放銃率を推定できませんでした。'}});};current.postMessage({id,input});
  }catch{if(id===sequence.current)setValue({report,snapshot,player,data:{error:'この局面の放銃率を推定できません。'}});}},120);
  return()=>clearTimeout(timer);
 },[report,snapshot,player]);
 return value?.report===report&&value.snapshot===snapshot&&value.player===player?value.data:null;
}
