const HONORS={E:'東',S:'南',W:'西',N:'北',P:'白',F:'發',C:'中'};
export function coachTileLabel(tile){
 if(!tile||tile==='?')return '不明牌';
 if(HONORS[tile])return HONORS[tile];
 return (tile.endsWith('r')?'赤':'')+tile[0]+({m:'萬',p:'筒',s:'索'}[tile[1]]||'');
}
function actionLabel(a){
 if(!a)return '未確認';
 return a.type===0?coachTileLabel(a.tile)+'切り':({1:'チー',2:'ポン',3:'大明槓',4:'ロン',5:'リーチ',6:'ツモ和了',7:'見送り',8:'暗槓',9:'加槓',10:'九種九牌'}[a.type]||'未確認');
}
const pct=p=>(p*100).toFixed(1)+'%';
/** @param {{decision?: any, view?: any, player?: number, selectedTile?: string|null, busy?: boolean}} [options] */
export function getCoachComment({decision,view,player=0,selectedTile=null,busy=false}={}){
 if(busy)return {state:'loading',title:'いま、読み直しているよ。',body:'解析が終わったら、この局面の推奨手を一緒に見よう。',mood:'calm'};
 if(!decision){
  const ended=['hora','ryukyoku','end_kyoku','end_game'].includes(view?.event?.type);
  return {state:'waiting',title:ended?'この局の結果を振り返ろう。':'次の判断を、一緒に見よう。',body:ended?'前の判断に戻ると、その時点の推奨手を確認できるよ。':view?.reach?.[player]?'リーチ中だね。あなたの次の判断で、推奨手を表示するよ。':'「次の自分」で、あなたの打牌・鳴き・リーチの判断へ進めるよ。',mood:'calm'};
 }
 const best=decision.choices?.[decision.best];
 if(!best||!Number.isFinite(best.probability))return {state:'waiting',title:'この判断の情報を確認してね。',body:'別の判断局面に進むと、推奨手のコメントを表示できるよ。',mood:'calm'};
 const actual=decision.choices?.[decision.chosen],forced=!!decision.forced,match=decision.chosen===decision.best;
 const label=actionLabel(best),runner=decision.choices.filter((_,i)=>i!==decision.best).sort((a,b)=>b.probability-a.probability)[0];
 let title=best.type===0?`私なら、${coachTileLabel(best.tile)}を切るよ。`:({1:'ここはチーを選ぶよ。',2:'ここはポンを選ぶよ。',3:'大明槓をおすすめするよ。',4:'ロンで和了しよう！',5:'ここは、リーチを選ぶよ。',6:'ツモ！ 和了しよう。',7:'ここは見送るよ。',8:'暗槓をおすすめするよ。',9:'加槓をおすすめするよ。',10:'九種九牌で流局を選ぶよ。'}[best.type]||`おすすめは${label}だよ。`);
 let body;
 if(forced){title=`この局面は、${label}の一手だね。`;body='選べる行動が1つなので、一致率の集計には含めていないよ。';}
 else if(!actual){body=`このモデルの候補では${label}が1番。実際の選択を照合できなかったので、比較は集計から除いているよ。`;}
 else if(selectedTile&&selectedTile!==best.tile&&decision.choices.some(a=>a.type===0&&a.tile===selectedTile)){
  const picked=decision.choices.find(a=>a.type===0&&a.tile===selectedTile);
  body=`選んだ${coachTileLabel(selectedTile)}切りは${pct(picked.probability)}。私の推奨の${label}は${pct(best.probability)}だよ。`;
 }else if(runner&&best.probability-runner.probability<0.05){
  body=`${actionLabel(runner)}も近い候補。選択確率は${label}が${pct(best.probability)}、${actionLabel(runner)}が${pct(runner.probability)}だよ。`;
 }else if(match){body=`実際の選択も同じだね。${label}の選択確率は${pct(best.probability)}だよ。`;}
 else{body=`実際は${actionLabel(actual)}を選んだんだね。このモデルでは、${label}が${pct(best.probability)}で最も高い候補だよ。`;}
 return {state:'recommendation',title,body,mood:match&&!forced?'happy':'focused',tile:best.type===0?best.tile:null,label,probability:best.probability,match:!!actual&&match,forced,decisionId:decision.id};
}
