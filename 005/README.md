# 🌱 Sprouts 豆芽遊戲

一個基於Web的雙人Sprouts（豆芽）遊戲，使用現代JavaScript和Canvas技術開發，具有流暢的用戶體驗和豐富的遊戲功能。

## 🎮 遊戲特色

### 核心功能
- **雙人對戰**: 支持兩名玩家輪流進行遊戲
- **智能繪製**: 實時繪製連接線，支持平滑的貝塞爾曲線
- **自連功能**: 支持從同一點出發回到同一點的自連操作
- **碰撞檢測**: 智能檢測線條交叉和路徑有效性
- **遊戲規則**: 完整的Sprouts遊戲規則實現

### 視覺效果
- **現代UI設計**: 使用毛玻璃效果和漸變背景
- **響應式佈局**: 適配不同屏幕尺寸
- **動畫效果**: 流暢的過渡動畫和懸停效果
- **顏色編碼**: 玩家1（藍色）vs 玩家2（紫色）

### 交互功能
- **縮放和平移**: 滑鼠滾輪縮放，中鍵拖拽移動畫布
- **控制面板**: 可收合的側邊控制面板
- **實時反饋**: 繪製過程中的視覺反饋
- **遊戲狀態**: 實時顯示當前玩家和回合數

## 🚀 快速開始

### 環境要求
- 現代瀏覽器（Chrome, Firefox, Safari, Edge）
- Python 3.x（用於本地服務器）

### 安裝和運行

1. **克隆或下載項目**
   ```bash
   git clone [repository-url]
   cd SP
   ```

2. **啟動本地服務器**
   ```bash
   python -m http.server 8000
   ```

3. **打開瀏覽器**
   訪問 `http://localhost:8000`

## 🎯 遊戲規則

### 基本規則
1. 遊戲開始時有指定數量的初始點
2. 玩家輪流在兩個點之間畫線連接
3. 每次連接時，在路徑中點會產生一個新的點
4. 每個點最多可以連接指定次數（最大連接數）
5. 線不能穿過其他線或點

### 特殊規則
- **自連**: 可以從一個點出發回到同一點，但該點的連接數必須小於最大連接數-1
- **遊戲結束**: 當沒有玩家可以再畫線時，遊戲結束
- **勝利條件**: 最後一個能畫線的玩家獲勝

## 🎮 操作說明

### 基本操作
- **左鍵拖拽**: 繪製連接線
- **滑鼠滾輪**: 縮放盤面
- **滑鼠中鍵拖拽**: 移動盤面
- **ESC鍵**: 收合/展開控制面板

### 控制面板
- **收合按鈕**: 點擊"收合"隱藏控制面板
- **齒輪圖標**: 收合後點擊左上角齒輪圖標重新打開
- **滾動查看**: 控制面板內容可滾動查看

### 遊戲設置
- **初始點數**: 設置遊戲開始時的點數（1-10）
- **最大連接數**: 設置每個點的最大連接數（2-5）
- **開始遊戲**: 開始新的遊戲
- **重置遊戲**: 重置當前遊戲

## 🛠️ 技術實現

### 前端技術
- **HTML5**: 語義化標記
- **CSS3**: 現代樣式和動畫
- **JavaScript ES6+**: 模塊化代碼結構
- **Canvas API**: 2D繪圖和交互

### 核心算法
- **路徑檢測**: 實時檢測繪製路徑的有效性
- **碰撞檢測**: 線條交叉檢測算法
- **貝塞爾曲線**: 平滑的曲線繪製
- **遊戲邏輯**: 完整的遊戲狀態管理

### 性能優化
- **事件節流**: 優化滑鼠事件處理
- **渲染優化**: 智能重繪機制
- **內存管理**: 高效的數據結構

## 📁 項目結構

```
SP/
├── index.html          # 主遊戲頁面
├── game.js             # 遊戲邏輯和交互
├── style.css           # 樣式和動畫
├── test-toggle.html    # 控制面板測試頁面
└── README.md           # 項目說明文檔
```

## 🎨 自定義功能

### 已實現功能
- ✅ 綠色路徑隱藏（完成繪製後自動消失）
- ✅ 自連功能（支持從同一點回到同一點）
- ✅ 控制面板收合（帶齒輪圖標重新打開）
- ✅ 滾動查看控制面板內容
- ✅ 完整的遊戲規則說明
- ✅ 響應式設計和現代UI
- ✅ 縮放和平移功能
- ✅ 實時遊戲狀態顯示

### 技術特色
- **模塊化設計**: 清晰的代碼結構和功能分離
- **事件驅動**: 響應式的用戶交互
- **狀態管理**: 完整的遊戲狀態追蹤
- **錯誤處理**: 健壯的錯誤檢測和處理

## 🐛 已知問題

目前沒有已知的重大問題。遊戲已經過充分測試，所有核心功能都能正常工作。

## 🤝 貢獻

歡迎提交Issue和Pull Request來改進這個項目！

## 📄 許可證

本項目採用MIT許可證。

## 👨‍💻 開發者

**Cursor 2025 By pcshmath W.Y.**

## 📚 參考資料

### 遊戲理論
- [Sprouts Game - Wikipedia](https://en.wikipedia.org/wiki/Sprouts_(game)) - 豆芽遊戲的詳細介紹和歷史
- [豆芽遊戲 - 維基百科](https://zh.wikipedia.org/zh-tw/%E8%B1%86%E8%8A%BD%E9%81%8A%E6%88%B2) - 中文版豆芽遊戲介紹
- [Conway's Sprouts Game](https://mathworld.wolfram.com/SproutsGame.html) - Wolfram MathWorld的數學分析

### 技術參考
- [HTML5 Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API) - Canvas繪圖技術文檔
- [JavaScript ES6+ Features](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide) - 現代JavaScript語法指南
- [CSS3 Transforms and Animations](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Transforms) - CSS變換和動畫技術
- [Bezier Curves](https://en.wikipedia.org/wiki/B%C3%A9zier_curve) - 貝塞爾曲線數學原理

### 算法參考
- [Line Segment Intersection](https://en.wikipedia.org/wiki/Line_segment_intersection) - 線段相交檢測算法
- [Douglas-Peucker Algorithm](https://en.wikipedia.org/wiki/Ramer%E2%80%93Douglas%E2%80%93Peucker_algorithm) - 路徑簡化算法
- [Catmull-Rom Splines](https://en.wikipedia.org/wiki/Centripetal_Catmull%E2%80%93Rom_spline) - 平滑曲線插值算法

### 設計參考
- [Material Design](https://material.io/design) - Google Material Design設計規範
- [CSS Grid Layout](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Grid_Layout) - 現代CSS佈局技術
- [Responsive Web Design](https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Responsive_Design) - 響應式設計指南

### 遊戲開發資源
- [Game Development Patterns](https://gameprogrammingpatterns.com/) - 遊戲開發設計模式
- [HTML5 Game Development](https://developer.mozilla.org/en-US/docs/Games) - Mozilla遊戲開發指南
- [Canvas Performance Optimization](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas) - Canvas性能優化技巧

### 開源項目參考
- [Phaser.js](https://phaser.io/) - HTML5遊戲框架（設計理念參考）
- [Three.js](https://threejs.org/) - 3D圖形庫（Canvas技術參考）
- [D3.js](https://d3js.org/) - 數據可視化庫（貝塞爾曲線實現參考）

---

*享受遊戲！🌱* 