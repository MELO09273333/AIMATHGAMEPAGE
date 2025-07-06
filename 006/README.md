# Black Path Game (Brick)

一款現代美術風格的雙人策略棋盤遊戲，靈感來自經典數學遊戲 [Black Path Game](https://en.wikipedia.org/wiki/Black_Path_Game)。

## 遊戲簡介
- 兩位玩家輪流在棋盤上延伸路徑，目標是將路徑連接到終點（基地），或讓對手無法繼續。
- 遊戲支援自訂棋盤大小（3×3 ~ 24×24），每格皆為正方形。
- 玩法簡單但策略豐富，適合親友對戰或數學愛好者。

## 玩法說明
- 棋盤左下為起點，右上為終點。
- 玩家輪流在「下一步指引位置」放置一個連接片（T1、T2、T3）。
- 連接片有三種：
  - T1：連接左上-右下
  - T2：連接左下-右上
  - T3：連接上下、左右
- 路徑可重用已放片的格子，但不能重複同一條路徑。
- 誰先將路徑連接到終點即獲勝；若路徑連接到棋盤邊界（出界），則該玩家輸。

## 操作指南
1. 選擇棋盤大小，點擊「開始」。
2. 拖曳下方的連接片到閃爍藍框的「下一步指引位置」。
3. 預覽無誤後，點擊「OK」鎖定步驟並換對手。
4. 可用「上一步」「下一步」瀏覽歷程。
5. 右上角「重置」可重新開始。
6. 右側可展開規則說明欄，隨時查閱遊戲規則。

## 特色
- 響應式設計，支援桌機與行動裝置。
- 現代、柔和的UI配色與動畫。
- 支援完整歷程回溯與雙人輪流。
- 右側可展開/收合的規則說明欄。

## 參考與相關資料
- 數學遊戲 凡異出版社(P60-66)  
  https://taiwanebook.ncl.edu.tw/zh-tw/book/TNGS-9910016060/reader
- Black Path Game (Wikipedia)  
  https://en.wikipedia.org/wiki/Black_Path_Game
- Path Tile Games  
  https://blog.garritys.org/2012/01/path-tile-games.html
- UI設計靈感來自 [Design Seeds - Bubble Hues](https://www.design-seeds.com/)

---

> 本專案僅供學習與娛樂用途，歡迎改作與分享！ 