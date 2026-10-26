import React,{useState,useEffect} from 'react';
import {createRoot} from 'react-dom/client';
import Home from './app/page';
import Analysis from './app/analysis/page';
import Licenses from './app/licenses/page';
import {AnalysisSessionProvider} from './components/analysis-session-provider';
import './app/globals.css';
function App(){const [route,setRoute]=useState(location.hash.slice(1)||'/');useEffect(()=>{const update=()=>setRoute(location.hash.slice(1)||'/');window.addEventListener('hashchange',update);return()=>window.removeEventListener('hashchange',update)},[]);return <AnalysisSessionProvider>{route==='/analysis'?<Analysis/>:route==='/licenses'?<Licenses/>:<Home/>}</AnalysisSessionProvider>}
createRoot(document.getElementById('root')!).render(<App/>);
