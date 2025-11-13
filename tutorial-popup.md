## **役割**

あなたはReactとTailwind CSSを使用したフロントエンド開発のエキスパートです。

## **タスク**

Reactで構築されたWebアプリのオンボーディング（初回利用時）に使用する、インタラクティブなガイド付きチュートリアル機能をコンポーネントとして実装します。

## **🚀 機能要件**

React（Hooks）とTailwind CSSを使用して、以下の機能を実現します。

1. **オーバーレイ**:  
   * チュートリアル実行中、画面全体を覆う半透明の黒いオーバーレイ（例：div）を表示します。  
   * オーバーレイはTailwindの z-40（例）に設定します。  
2. **要素のハイライト**:  
   * チュートリアルの各ステップで、説明対象となる特定のUI要素（IDで指定）だけをハイライトします。  
   * ハイライトは、対象要素のスタイル（z-index など）を動的に操作して実現します。  
   * **重要**: Reactでこれを実現するには、対象要素の ref を取得するか、もしくは対象要素に動的にスタイルを適用する必要があります。ここでは、対象要素のID（elementId）を頼りに document.getElementById を使用し、対象要素に直接スタイル（またはTailwindクラス）を適用する方法を採用します。  
   * 具体的には、対象要素に position: relative と z-index: 50（例）が適用されるようにし、オーバーレイの上に「浮き上がって」表示させます。  
3. **説明ポップアップ**:  
   * ハイライトされた要素の近くに、説明文（タイトル、詳細）を表示するポップアップコンポーネント（例：\<TutorialPopup\>）を表示します。  
   * ポップアップは、ハイライト要素よりも高い z-index: 60（例）を持ちます。  
   * ポップアップには「次へ」ボタンと「スキップ」ボタンを配置します。  
4. **重ね順の制御**:  
   * ポップアップ (z-60) \> ハイライト要素 (z-50) \> オーバーレイ (z-40) \> 通常のUI という重ね順（z-index）をTailwind CSSのクラスで厳守してください。

## **🧠 Reactコンポーネントの実装詳細**

1. **チュートリアルステップの管理**:  
   * チュートリアルの各ステップ（対象要素のID、タイトル、説明文）を、JavaScriptの配列（例：tutorialSteps）で管理します。これはコンポーネントのpropsとして渡されることを想定します。  
2. **状態管理 (useState)**:  
   * 現在のステップ番号（currentStep）を useState で管理します。  
   * チュートリアルがアクティブかどうか（show）はpropsで受け取ります。  
   * ポップアップの位置（popupPosition）を useState で管理します（例：{ top: number, left: number }）。  
3. **ハイライトの制御 (useEffect)**:  
   * currentStep または show が変更された際に useEffect を実行します。  
   * **クリーンアップ**: まず、以前のステップでハイライトされた要素（もしあれば）のスタイルを元に戻します。  
   * **ハイライト**: 現在のステップの elementId を使って document.getElementById で対象要素を取得します。  
   * 対象要素が見つかった場合、その要素にハイライト用のスタイル（position: 'relative', zIndex: 50, boxShadow: '...'など）を直接適用します。  
   * 同時に positionPopup() を呼び出して、ポップアップの位置を計算・更新します。  
4. **ポップアップ位置の計算 (useLayoutEffect / useEffect)**:  
   * positionPopup() 関数は currentStep に依存する useEffect または useLayoutEffect 内で呼び出されます。  
   * 対象要素の getBoundingClientRect() を取得し、ポップアップが対象要素の「上」または「下」に表示されるよう計算します。  
   * 計算結果を setPopupPosition で状態に保存します。（画面の端にはみ出さないように考慮してください）  
5. **イベントハンドラ**:  
   * handleNext(): setCurrentStep を呼び出してステップを進めます。最終ステップの場合は handleEnd() を呼び出します。  
   * handleSkip(): handleEnd() を呼び出します。  
   * handleEnd(): チュートリアルを終了するコールバック関数（props経由、例：onClose()）を呼び出します。

## **依頼**

上記の要件と実装詳細に基づき、単一のReactコンポーネント（例：\<TutorialGuide\>）のコード（JSX, Tailwindクラス, ロジック）を生成してください。

* このコンポーネントは、steps（tutorialSteps 配列）と show（ブール値）、onClose（終了時コールバック）をpropsとして受け取る設計にしてください。  
* steps propsのデフォルト値またはダミーデータとして、以下のプレースホルダーを使用した配列をコード内に含めてください。

const defaultSteps \= \[  
    {  
        elementId: 'your-element-id-1', // \<-- 置き換え対象  
        title: '（ここにステップ1のタイトル）',  
        description: '（ここにステップ1の説明文）'  
    },  
    {  
        elementId: 'your-element-id-2', // \<-- 置き換え対象  
        title: '（ここにステップ2のタイトル）',  
        description: '（ここにステップ2の説明文）'  
    },  
    {  
        elementId: 'your-element-id-3', // \<-- 置き換え対象  
        title: '（ここにステップ3のタイトル）',  
        description: '（ここにステップ3の説明文）'  
    }  
\];

最後に、ここまでの指示に対するあなたの応答はすべて**日本語**で生成してください。