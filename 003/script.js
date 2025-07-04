class FlipGame {
    constructor() {
        this.board = [];
        this.width = 5;
        this.height = 5;
        this.gameRule = 'cross';
        this.isGameActive = false;
        this.isManualMode = false;
        
        // 歷程記錄
        this.historyStates = [];
        this.currentStateIndex = 1; // 狀態編號，1=初始狀態
        
        // 互動鎖定機制
        this.isInteractionLocked = false;
        this.interactionLockTimeout = null;
        this.isLoadingHistory = false; // 標誌：是否正在載入歷史狀態
        
        this.initializeElements();
        this.bindEvents();
        this.createBoard();
        this.updateHistoryDisplay(); // 初始化歷程資訊顯示
    }
    
    initializeElements() {
        this.gameBoard = document.getElementById('gameBoard');
        this.boardWidthInput = document.getElementById('boardWidth');
        this.boardHeightInput = document.getElementById('boardHeight');
        this.gameRuleSelect = document.getElementById('gameRule');
        this.randomBtn = document.getElementById('randomBtn');
        this.manualBtn = document.getElementById('manualBtn');
        this.startBtn = document.getElementById('startBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.statusText = document.getElementById('statusText');
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');
        
        // 歷程記錄資訊元素
        this.totalHistoryCount = document.getElementById('totalHistoryCount');
        this.currentHistoryIndex = document.getElementById('currentHistoryIndex');

    }
    
    bindEvents() {
        // 設置變更事件（控制按鈕）
        this.boardWidthInput.addEventListener('change', () => this.handleControlInteraction(() => this.updateBoardSize()));
        this.boardHeightInput.addEventListener('change', () => this.handleControlInteraction(() => this.updateBoardSize()));
        this.gameRuleSelect.addEventListener('change', () => this.handleControlInteraction(() => {
            this.gameRule = this.gameRuleSelect.value;
            this.updateStatus('遊戲規則已更改為: ' + this.getRuleName());
        }));
        
        // 按鈕事件（控制按鈕）
        this.randomBtn.addEventListener('click', () => this.handleControlInteraction(() => this.randomizeBoard()));
        this.manualBtn.addEventListener('click', () => this.handleControlInteraction(() => this.toggleManualMode()));
        this.startBtn.addEventListener('click', () => this.handleControlInteraction(() => this.startGame()));
        this.resetBtn.addEventListener('click', () => this.handleControlInteraction(() => this.resetBoard()));
        this.prevBtn.addEventListener('click', () => this.handleControlInteraction(() => this.goToPreviousStep()));
        this.nextBtn.addEventListener('click', () => this.handleControlInteraction(() => this.goToNextStep()));

    }
    
    // 處理控制按鈕的互動
    handleControlInteraction(action) {
        if (this.isInteractionLocked) {
            return; // 如果被鎖定，不執行任何操作
        }
        action();
    }
    
    // 鎖定互動0.62秒
    lockInteraction() {
        this.isInteractionLocked = true;
        
        // 清除之前的計時器
        if (this.interactionLockTimeout) {
            clearTimeout(this.interactionLockTimeout);
        }
        
        // 0.62秒後解鎖
        this.interactionLockTimeout = setTimeout(() => {
            this.isInteractionLocked = false;
        }, 620);
    }
    
    updateBoardSize() {
        const newWidth = Math.min(20, Math.max(1, parseInt(this.boardWidthInput.value) || 5));
        const newHeight = Math.min(20, Math.max(1, parseInt(this.boardHeightInput.value) || 5));
        
        this.boardWidthInput.value = newWidth;
        this.boardHeightInput.value = newHeight;
        
        this.width = newWidth;
        this.height = newHeight;
        
        this.createBoard();
        this.updateStatus('棋盤大小已更改為 ' + this.width + 'x' + this.height);
    }
    
    createBoard() {
        this.gameBoard.innerHTML = '';
        this.gameBoard.style.gridTemplateColumns = `repeat(${this.width}, 1fr)`;
        
        this.board = [];
        for (let row = 0; row < this.height; row++) {
            this.board[row] = [];
            for (let col = 0; col < this.width; col++) {
                const tile = document.createElement('button');
                tile.className = 'tile black';
                tile.dataset.row = row;
                tile.dataset.col = col;
                
                tile.addEventListener('click', (e) => this.handleTileClick(e));
                
                this.gameBoard.appendChild(tile);
                this.board[row][col] = {
                    element: tile,
                    isBlack: true
                };
            }
        }
    }
    
    handleTileClick(event) {
        // 如果互動被鎖定，不處理棋子點擊
        if (this.isInteractionLocked) {
            return;
        }
        
        const tile = event.target;
        const row = parseInt(tile.dataset.row);
        const col = parseInt(tile.dataset.col);
        
        if (this.isManualMode) {
            this.flipTile(row, col);
            // 手動模式下，0.6秒後記錄狀態
            setTimeout(() => {
                this.saveCurrentState();
            }, 600);
            this.updateStatus('手動模式：點擊棋子來改變顏色');
        } else if (this.isGameActive) {
            this.flipTilesByRule(row, col);
        }
        
        // 只有在不是載入歷史狀態時才鎖定互動
        if (!this.isLoadingHistory) {
            this.lockInteraction();
        }
    }
    
    flipTile(row, col) {
        if (row < 0 || row >= this.height || col < 0 || col >= this.width) return;
        
        const tile = this.board[row][col];
        const element = tile.element;
        
        // 如果正在翻轉中，不重複執行
        if (element.classList.contains('flipping')) return;
        
        // 添加翻面動畫
        element.classList.add('flipping');
        
        // 在動畫中間點改變顏色（0.4秒動畫的一半時間）
        setTimeout(() => {
            tile.isBlack = !tile.isBlack;
            element.className = tile.isBlack ? 'tile black' : 'tile white';
        }, 200);
        
        // 移除動畫類（0.4秒後）
        setTimeout(() => {
            element.classList.remove('flipping');
        }, 400);
    }
    
    flipTilesByRule(row, col) {
        const positions = this.getFlipPositions(row, col);
        positions.forEach(([r, c]) => {
            this.flipTile(r, c);
        });
        // 遊戲模式下，0.6秒後記錄狀態和檢測勝利條件
        setTimeout(() => {
            this.saveCurrentState();
            this.checkWinCondition();
        }, 600);
    }
    
    getFlipPositions(row, col) {
        const positions = [[row, col]]; // 總是包含點擊的棋子本身
        
        switch (this.gameRule) {
            case 'cross':
                // 十字：上下左右
                if (row > 0) positions.push([row - 1, col]); // 上
                if (row < this.height - 1) positions.push([row + 1, col]); // 下
                if (col > 0) positions.push([row, col - 1]); // 左
                if (col < this.width - 1) positions.push([row, col + 1]); // 右
                break;
                
            case 'x':
                // X字：左上、左下、右上、右下
                if (row > 0 && col > 0) positions.push([row - 1, col - 1]); // 左上
                if (row > 0 && col < this.width - 1) positions.push([row - 1, col + 1]); // 右上
                if (row < this.height - 1 && col > 0) positions.push([row + 1, col - 1]); // 左下
                if (row < this.height - 1 && col < this.width - 1) positions.push([row + 1, col + 1]); // 右下
                break;
                
            case 'bigCross':
                // 大十字：同行同列
                for (let r = 0; r < this.height; r++) {
                    if (r !== row) positions.push([r, col]);
                }
                for (let c = 0; c < this.width; c++) {
                    if (c !== col) positions.push([row, c]);
                }
                break;
                
            case 'bigX':
                // 大X字：斜向直線
                // 左上到右下
                for (let i = 1; i < Math.max(this.width, this.height); i++) {
                    if (row - i >= 0 && col - i >= 0) positions.push([row - i, col - i]);
                    if (row + i < this.height && col + i < this.width) positions.push([row + i, col + i]);
                }
                // 右上到左下
                for (let i = 1; i < Math.max(this.width, this.height); i++) {
                    if (row - i >= 0 && col + i < this.width) positions.push([row - i, col + i]);
                    if (row + i < this.height && col - i >= 0) positions.push([row + i, col - i]);
                }
                break;
        }
        
        return positions;
    }
    
    randomizeBoard() {
        for (let row = 0; row < this.height; row++) {
            for (let col = 0; col < this.width; col++) {
                const isBlack = Math.random() < 0.5;
                this.board[row][col].isBlack = isBlack;
                this.board[row][col].element.className = isBlack ? 'tile black' : 'tile white';
            }
        }
        
        this.isManualMode = false;
        this.isGameActive = true;
        this.clearHistory();
        this.recordInitialState();
        this.updateStatus('棋盤已隨機重置，遊戲開始！');
    }
    
    toggleManualMode() {
        this.isManualMode = !this.isManualMode;
        this.isGameActive = false;
        
        if (this.isManualMode) {
            this.manualBtn.textContent = '完成';
            this.manualBtn.style.background = 'linear-gradient(45deg, #27ae60, #229954)';
            this.clearHistory();
            this.recordInitialState();
            this.updateStatus('手動模式：點擊棋子來改變顏色');
        } else {
            this.manualBtn.textContent = '自訂';
            this.manualBtn.style.background = 'linear-gradient(45deg, #4ecdc4, #44a08d)';
            this.updateStatus('請選擇遊戲規則和棋盤大小，然後點擊開始');
        }
    }
    
    startGame() {
        const wasActive = this.isGameActive;
        this.isManualMode = false;
        this.isGameActive = true;
        this.manualBtn.textContent = '自訂';
        this.manualBtn.style.background = 'linear-gradient(45deg, #4ecdc4, #44a08d)';
        this.updateStatus('遊戲開始！點擊棋子來翻轉，規則：' + this.getRuleName());
        
        // 重置歷程記錄並記錄初始狀態
        this.clearHistory();
        this.recordInitialState();
    }
    
    resetBoard() {
        for (let row = 0; row < this.height; row++) {
            for (let col = 0; col < this.width; col++) {
                const tile = this.board[row][col];
                tile.isBlack = true;
                tile.element.className = 'tile black';
            }
        }
        
        this.isManualMode = false;
        this.isGameActive = true;
        this.manualBtn.textContent = '自訂';
        this.manualBtn.style.background = 'linear-gradient(45deg, #4ecdc4, #44a08d)';
        this.clearHistory();
        this.recordInitialState();
        this.updateStatus('棋盤已重置，遊戲開始！');
    }
    
    checkWinCondition() {
        // 檢查是否所有棋子都是白色
        let allWhite = true;
        for (let row = 0; row < this.height; row++) {
            for (let col = 0; col < this.width; col++) {
                if (this.board[row][col].isBlack) {
                    allWhite = false;
                    break;
                }
            }
            if (!allWhite) break;
        }
        
        if (allWhite) {
            this.isGameActive = false;
            this.updateStatus('恭喜！您贏了！所有棋子都變成白色了！');
        }
    }
    
    getRuleName() {
        const ruleNames = {
            'cross': '十字',
            'x': 'X字',
            'bigCross': '大十字',
            'bigX': '大X字'
        };
        return ruleNames[this.gameRule] || '未知規則';
    }
    
    updateStatus(message) {
        this.statusText.textContent = message;
    }
    
    // 歷程記錄相關方法
    saveCurrentState() {
        // 深拷貝棋盤狀態
        const state = [];
        for (let row = 0; row < this.height; row++) {
            state[row] = [];
            for (let col = 0; col < this.width; col++) {
                state[row][col] = this.board[row][col].isBlack ? true : false;
            }
        }
        // 如果不是在最新狀態，移除後續歷程
        if (this.currentStateIndex < this.historyStates.length) {
            this.historyStates = this.historyStates.slice(0, this.currentStateIndex);
        }
        this.historyStates.push(JSON.parse(JSON.stringify(state)));
        this.currentStateIndex = this.historyStates.length; // 指向最新狀態
        this.updateHistoryDisplay();
    }

    loadStateByIndex(stateIndex) {
        // stateIndex: 1-based
        if (stateIndex < 1 || stateIndex > this.historyStates.length) return;
        
        this.isLoadingHistory = true; // 設置正在載入歷史狀態的標誌
        
        const state = this.historyStates[stateIndex - 1];
        // 禁用上一步/下一步按鈕
        this.prevBtn.disabled = true;
        this.nextBtn.disabled = true;
        let flipCount = 0;
        for (let row = 0; row < this.height; row++) {
            for (let col = 0; col < this.width; col++) {
                const tile = this.board[row][col];
                const targetIsBlack = state[row][col];
                if (tile.isBlack !== targetIsBlack) {
                    this.animateFlipTo(row, col, targetIsBlack);
                    flipCount++;
                } else {
                    tile.element.className = tile.isBlack ? 'tile black' : 'tile white';
                }
            }
        }
        // 若有翻面動畫，400ms後再恢復按鈕，否則立即恢復
        if (flipCount > 0) {
            setTimeout(() => {
                this.updateHistoryDisplay();
                this.isLoadingHistory = false; // 動畫完成後清除標誌
            }, 400);
        } else {
            this.updateHistoryDisplay();
            this.isLoadingHistory = false; // 立即清除標誌
        }
    }

    animateFlipTo(row, col, targetIsBlack) {
        const tile = this.board[row][col];
        const element = tile.element;
        if (element.classList.contains('flipping')) return;
        element.classList.add('flipping');
        setTimeout(() => {
            tile.isBlack = targetIsBlack;
            element.className = tile.isBlack ? 'tile black' : 'tile white';
        }, 200);
        setTimeout(() => {
            element.classList.remove('flipping');
        }, 400);
    }

    goToPreviousStep() {
        if (this.isInteractionLocked) {
            return; // 如果被鎖定，不執行任何操作
        }
        
        if (this.currentStateIndex > 1) {
            this.currentStateIndex--;
            this.loadStateByIndex(this.currentStateIndex);
            this.updateHistoryDisplay();
            
            // 鎖定互動0.62秒
            this.lockInteraction();
        }
    }

    goToNextStep() {
        if (this.isInteractionLocked) {
            return; // 如果被鎖定，不執行任何操作
        }
        
        if (this.currentStateIndex < this.historyStates.length) {
            this.currentStateIndex++;
            this.loadStateByIndex(this.currentStateIndex);
            this.updateHistoryDisplay();
            
            // 鎖定互動0.62秒
            this.lockInteraction();
        }
    }

    clearHistory() {
        this.historyStates = [];
        this.currentStateIndex = 1;
        this.updateHistoryDisplay();
    }

    recordInitialState() {
        // 清空後記錄初始狀態，currentStateIndex=1
        this.saveCurrentState();
        this.currentStateIndex = 1;
        this.updateHistoryDisplay();
    }

    updateHistoryDisplay() {
        // 更新按鈕狀態
        this.prevBtn.disabled = this.currentStateIndex <= 1;
        this.nextBtn.disabled = this.currentStateIndex >= this.historyStates.length;
        
        // 更新歷程記錄資訊（特殊顯示邏輯）
        const displayTotal = this.historyStates.length <= 1 ? 0 : this.historyStates.length - 1;
        const displayCurrent = this.currentStateIndex <= 1 ? 0 : this.currentStateIndex - 1;
        
        this.totalHistoryCount.textContent = `總共 ${displayTotal} 次`;
        this.currentHistoryIndex.textContent = `現在第 ${displayCurrent} 次`;
    }
    

    

}

// 當頁面加載完成後初始化遊戲
document.addEventListener('DOMContentLoaded', () => {
    new FlipGame();
}); 