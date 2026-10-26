
export default function LicensesPage(){
 return <div className="studio-shell neuro-review"><div className="app-main">
  <header className="topbar"><a className="brand" href="/mahjong-ai/#/">NEURO</a><a className="button secondary" href="/mahjong-ai/#/">牌譜入力へ戻る</a></header>
  <main className="legal-page"><section className="panel legal-panel">
   <h1>第三者ライセンス</h1>
   <p>本サイトで使用しているソフトウェアのライセンス情報です。</p>
   <ul>
    <li><a href="/mahjong-ai/engine/LICENSE.RiichiEnv">RiichiEnv — Apache License 2.0</a></li>
    <li><a href="/mahjong-ai/engine/LICENSE.ONNXRuntime">ONNX Runtime — MIT License</a></li>
    <li><a href="/mahjong-ai/engine/LICENSE.Mortal">Mortal — GNU AGPL v3.0 or later</a></li>
    <li><a href="/mahjong-ai/engine/LICENSE.MortalModel">モデルのライセンス</a></li>
   </ul>
   <h2>対応ソースコード</h2>
   <p>対局エンジンに含まれるライセンス対象部分の対応ソースを提供します。</p>
   <a className="button secondary" href="/mahjong-ai/engine/engine-source.zip" download>対応ソースをダウンロード</a>
   <p><a href="/mahjong-ai/engine/NOTICE.txt">著作権表示</a></p>
  </section></main>
 </div></div>;
}
