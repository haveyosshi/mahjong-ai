'use client';
import {createContext,useContext,useEffect,useRef,useState} from 'react';
import {loadAnalysisSession,saveAnalysisSession} from '../lib/analysis-session.js';

type SessionContextValue={session:any,ready:boolean,storageWarning:string,complete:(session:any)=>Promise<void>};
const SessionContext=createContext<SessionContextValue|null>(null);
export function AnalysisSessionProvider({children}:{children:React.ReactNode}){
 const [session,setSession]=useState<any>(null),[ready,setReady]=useState(false),[storageWarning,setStorageWarning]=useState('');
 const revision=useRef(0);
 useEffect(()=>{let alive=true;const version=revision.current;loadAnalysisSession().then(value=>{if(alive&&revision.current===version)setSession(value)}).catch(()=>{}).finally(()=>{if(alive)setReady(true)});return()=>{alive=false}},[]);
 async function complete(value:any){revision.current++;setSession(value);setReady(true);setStorageWarning('');try{await saveAnalysisSession(value)}catch{setStorageWarning('このブラウザーに結果を保存できませんでした。ページを閉じる前に、結果をJSONで保存してください。')}}
 return <SessionContext.Provider value={{session,ready,storageWarning,complete}}>{children}</SessionContext.Provider>;
}
export function useAnalysisSession(){const value=useContext(SessionContext);if(!value)throw Error('解析セッションを取得できません。');return value;}
