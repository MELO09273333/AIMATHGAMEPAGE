class SproutsGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // 遊戲狀態
        this.gameState = 'setup'; // setup, playing, ended
        this.currentPlayer = 1; // 1 = 玩家1, 2 = 玩家2
        this.moveCount = 0;
        
        // 遊戲設定
        this.initialPoints = 3;
        this.maxConnections = 3;
        
        // 遊戲數據
        this.points = []; // 點
        this.lines = []; // 線
        
        // 繪圖狀態
        this.isDrawing = false;
        this.drawingPath = [];
        this.drawingStartPoint = null;
        this.isValidPath = true;
        
        // 盤面變換
        this.scale = 1;
        this.offsetX = 0;
        this.offsetY = 0;
        this.isDragging = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        
        // 畫布設定
        this.canvasSize = 800;
        
        // 控制面板狀態
        this.panelVisible = true;
        
        // 事件監聽器
        this.setupEventListeners();
        this.setupControlListeners();
        
        // 初始化
        this.resizeCanvas();
        this.draw();
        
        // 初始化控制面板收合功能
        this.initControlPanel();
    }
    
    setupEventListeners() {
        // 滑鼠事件
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('wheel', (e) => this.handleWheel(e));
        
        // 觸控事件
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e));
        
        // 視窗大小變化
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // 鍵盤事件
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.togglePanel();
            }
        });
    }
    
    setupControlListeners() {
        // 控制按鈕
        document.getElementById('startGame')?.addEventListener('click', () => this.startGame());
        document.getElementById('togglePanel')?.addEventListener('click', () => this.togglePanel());
        document.getElementById('reset')?.addEventListener('click', () => this.resetGame());
        
        // 設定控制
        document.getElementById('decreasePoints')?.addEventListener('click', () => this.decreasePoints());
        document.getElementById('increasePoints')?.addEventListener('click', () => this.increasePoints());
        document.getElementById('decreaseConnections')?.addEventListener('click', () => this.decreaseConnections());
        document.getElementById('increaseConnections')?.addEventListener('click', () => this.increaseConnections());
        
        this.updateUI();
    }
    
    initControlPanel() {
        // 綁定控制面板收合按鈕
        const toggleBtn = document.getElementById('togglePanel');
        const controlToggle = document.getElementById('controlToggle');
        
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.hideControlPanel());
        }
        
        if (controlToggle) {
            controlToggle.addEventListener('click', () => this.showControlPanel());
        }
        
        // 初始化時確保控制面板可見，收合按鈕隱藏
        if (controlToggle) {
            controlToggle.classList.remove('visible');
        }
    }
    
    togglePanel() {
        const panel = document.getElementById('controlPanel');
        const controlToggle = document.getElementById('controlToggle');
        
        if (panel && controlToggle) {
            if (panel.classList.contains('collapsed')) {
                this.showControlPanel();
            } else {
                this.hideControlPanel();
            }
        }
    }
    
    hideControlPanel() {
        const panel = document.getElementById('controlPanel');
        const controlToggle = document.getElementById('controlToggle');
        
        if (panel && controlToggle) {
            panel.classList.add('collapsed');
            controlToggle.classList.add('visible');
        }
        this.resizeCanvas();
    }
    
    showControlPanel() {
        const panel = document.getElementById('controlPanel');
        const controlToggle = document.getElementById('controlToggle');
        
        if (panel && controlToggle) {
            panel.classList.remove('collapsed');
            controlToggle.classList.remove('visible');
        }
        this.resizeCanvas();
    }
    
    decreasePoints() {
        if (this.initialPoints > 2) {
            this.initialPoints--;
            this.updateSettings();
        }
    }
    
    increasePoints() {
        if (this.initialPoints < 10) {
            this.initialPoints++;
            this.updateSettings();
        }
    }
    
    decreaseConnections() {
        if (this.maxConnections > 2) {
            this.maxConnections--;
            this.updateSettings();
        }
    }
    
    increaseConnections() {
        if (this.maxConnections < 5) {
            this.maxConnections++;
            this.updateSettings();
        }
    }
    
    updateSettings() {
        const pointsDisplay = document.getElementById('pointsDisplay');
        const connectionsDisplay = document.getElementById('connectionsDisplay');
        
        if (pointsDisplay) pointsDisplay.textContent = this.initialPoints;
        if (connectionsDisplay) connectionsDisplay.textContent = this.maxConnections;
    }
    
    updateUI() {
        // 更新設定顯示
        this.updateSettings();
        
        // 更新遊戲狀態
        const statusElement = document.getElementById('gameStatus');
        const playerInfo = document.getElementById('playerInfo');
        const currentPlayerElement = document.getElementById('currentPlayer');
        const moveCountElement = document.getElementById('moveCount');
        
        if (statusElement) {
            if (this.gameState === 'setup') {
                statusElement.textContent = '準備開始';
                if (playerInfo) playerInfo.style.display = 'none';
            } else if (this.gameState === 'playing') {
                const playerName = this.currentPlayer === 1 ? '玩家1' : '玩家2';
                statusElement.textContent = `回合 ${this.moveCount + 1} - ${playerName}的回合`;
                if (playerInfo) playerInfo.style.display = 'flex';
                if (currentPlayerElement) {
                    currentPlayerElement.textContent = playerName;
                    currentPlayerElement.className = `player-indicator player-${this.currentPlayer}`;
                }
                if (moveCountElement) {
                    moveCountElement.textContent = `回合: ${this.moveCount}`;
                }
            } else if (this.gameState === 'ended') {
                statusElement.textContent = '遊戲結束';
                if (playerInfo) playerInfo.style.display = 'none';
            }
        }
    }
    
    resizeCanvas() {
        const container = this.canvas.parentElement;
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        
        // 設置畫布大小為容器大小
        this.canvas.width = containerWidth;
        this.canvas.height = containerHeight;
        
        // 重置變換
        this.scale = Math.min(containerWidth, containerHeight) / this.canvasSize;
        this.offsetX = (containerWidth - this.canvasSize * this.scale) / 2;
        this.offsetY = (containerHeight - this.canvasSize * this.scale) / 2;
    }
    
    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left - this.offsetX) / this.scale,
            y: (e.clientY - rect.top - this.offsetY) / this.scale
        };
    }
    
    getTouchPos(e) {
        const rect = this.canvas.getBoundingClientRect();
        const touch = e.touches[0];
        return {
            x: (touch.clientX - rect.left - this.offsetX) / this.scale,
            y: (touch.clientY - rect.top - this.offsetY) / this.scale
        };
    }
    
    handleMouseDown(e) {
        e.preventDefault();
        
        if (e.button === 1) { // 中鍵拖動
            this.isDragging = true;
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
            this.canvas.style.cursor = 'grabbing';
        } else if (e.button === 0) { // 左鍵繪製
            this.handlePointerDown(this.getMousePos(e));
        }
    }
    
    handleMouseMove(e) {
        e.preventDefault();
        
        if (this.isDragging) {
            const deltaX = e.clientX - this.lastMouseX;
            const deltaY = e.clientY - this.lastMouseY;
            
            this.offsetX += deltaX;
            this.offsetY += deltaY;
            
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
            
            this.draw();
        } else if (this.isDrawing) {
            this.handlePointerMove(this.getMousePos(e));
        }
    }
    
    handleMouseUp(e) {
        e.preventDefault();
        
        if (e.button === 1) { // 中鍵拖動結束
            this.isDragging = false;
            this.canvas.style.cursor = 'default';
        } else if (e.button === 0) { // 左鍵繪製結束
            this.handlePointerUp(this.getMousePos(e));
        }
    }
    
    handleWheel(e) {
        e.preventDefault();
        
        const zoomFactor = 0.1;
        const mousePos = this.getMousePos(e);
        
        if (e.deltaY < 0) {
            // 放大
            this.scale *= (1 + zoomFactor);
        } else {
            // 縮小
            this.scale *= (1 - zoomFactor);
        }
        
        // 限制縮放範圍
        this.scale = Math.max(0.1, Math.min(5, this.scale));
        
        // 調整偏移以保持滑鼠位置不變
        const newMousePos = this.getMousePos(e);
        this.offsetX += (newMousePos.x - mousePos.x) * this.scale;
        this.offsetY += (newMousePos.y - mousePos.y) * this.scale;
        
        this.draw();
    }
    
    handleTouchStart(e) {
        e.preventDefault();
        if (e.touches.length === 1) {
            this.handlePointerDown(this.getTouchPos(e));
        }
    }
    
    handleTouchMove(e) {
        e.preventDefault();
        if (e.touches.length === 1 && this.isDrawing) {
            this.handlePointerMove(this.getTouchPos(e));
        }
    }
    
    handleTouchEnd(e) {
        e.preventDefault();
        if (e.touches.length === 0) {
            this.handlePointerUp(this.getTouchPos(e));
        }
    }
    
    handlePointerDown(pos) {
        if (this.gameState !== 'playing') return;
        
        const point = this.findPointAt(pos.x, pos.y);
        if (point && this.canConnectPoint(point)) {
            this.startDrawing(pos, point);
        }
    }
    
    handlePointerMove(pos) {
        if (!this.isDrawing) return;
        
        // 添加點到路徑
        this.drawingPath.push(pos);
        
        // 檢查路徑有效性
        this.isValidPath = this.isPathValid(this.drawingPath);
        
        this.draw();
    }
    
    handlePointerUp(pos) {
        if (!this.isDrawing) return;
        
        this.finishDrawing(pos);
    }
    
    startDrawing(pos, startPoint) {
        this.isDrawing = true;
        this.drawingStartPoint = startPoint;
        this.drawingPath = [startPoint];
        this.isValidPath = true;
    }
    
    finishDrawing(pos) {
        if (!this.isDrawing) return;
        
        this.isDrawing = false;
        
        // 尋找終點
        const endPoint = this.findPointAt(pos.x, pos.y);
        if (!endPoint) {
            this.drawingPath = [];
            this.draw();
            return;
        }
        
        // 檢查是否為自連（從同一點出發回到同一點）
        const isSelfConnect = endPoint === this.drawingStartPoint;
        
        if (isSelfConnect) {
            // 自連檢查：只有當連接數小於最大連接數-1時才允許
            if (this.drawingStartPoint.connections >= this.maxConnections - 1) {
                this.drawingPath = [];
                this.draw();
                return;
            }
        } else {
            // 檢查連接數限制
            if (!this.canConnectPoints(this.drawingStartPoint, endPoint)) {
                this.drawingPath = [];
                this.draw();
                return;
            }
        }
        
        // 更新路徑，確保終點在點上
        this.drawingPath.push(endPoint);
        
        // 檢查路徑有效性
        if (!this.isPathValid(this.drawingPath)) {
            this.drawingPath = [];
            this.draw();
            return;
        }
        
        // 執行移動
        this.makeMove(this.drawingStartPoint, endPoint, this.drawingPath);
        // 清除繪製路徑（隱藏綠色部分）
        this.drawingPath = [];
        this.draw();
    }
    
    findPointAt(x, y) {
        const threshold = 25;
        for (const point of this.points) {
            const distance = Math.sqrt((x - point.x) ** 2 + (y - point.y) ** 2);
            if (distance <= threshold) {
                return point;
            }
        }
        return null;
    }
    
    canConnectPoint(point) {
        return point.connections < this.maxConnections;
    }
    
    canConnectPoints(point1, point2) {
        // 如果是自連，檢查是否允許
        if (point1 === point2) {
            return point1.connections < this.maxConnections - 1;
        }
        // 正常連接檢查
        return point1.connections < this.maxConnections && point2.connections < this.maxConnections;
    }
    
    isPathValid(path) {
        if (path.length < 2) return false;
        
        // 檢查路徑是否與現有線條相交
        for (let i = 1; i < path.length; i++) {
            const segment = {
                start: path[i - 1],
                end: path[i]
            };
            
            if (this.segmentIntersectsExistingLines(segment)) {
                return false;
            }
        }
        
        // 檢查路徑是否與自己相交（自交）
        for (let i = 1; i < path.length - 1; i++) {
            for (let j = i + 1; j < path.length; j++) {
                if (this.linesIntersect(
                    path[i - 1], path[i],
                    path[j - 1], path[j]
                )) {
                    return false;
                }
            }
        }
        
        return true;
    }
    
    segmentIntersectsExistingLines(segment) {
        for (const line of this.lines) {
            if (this.linesIntersect(
                segment.start, segment.end,
                line.start, line.end
            )) {
                return true;
            }
        }
        return false;
    }
    
    linesIntersect(p1, p2, p3, p4) {
        const denom = (p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y);
        if (Math.abs(denom) < 1e-10) return false;
        
        const ua = ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) / denom;
        const ub = ((p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x)) / denom;
        
        return ua > 0 && ua < 1 && ub > 0 && ub < 1;
    }
    
    makeMove(startPoint, endPoint, path) {
        // 檢查是否為自連
        const isSelfConnect = startPoint === endPoint;
        
        if (isSelfConnect) {
            // 自連：創建一個環形路徑
            const midPoint = this.getPathMidPoint(path);
            const safePosition = this.findSafePointPosition(midPoint, 20);
            const newPoint = {
                id: this.points.length,
                x: safePosition.x,
                y: safePosition.y,
                connections: 2
            };
            
            this.points.push(newPoint);
            
            // 創建兩條線形成環形
            const firstLine = {
                id: this.lines.length,
                start: startPoint,
                end: newPoint,
                path: this.getPathSegment(path, 0, 0.5),
                player: this.currentPlayer
            };
            
            const secondLine = {
                id: this.lines.length + 1,
                start: newPoint,
                end: startPoint, // 回到起點
                path: this.getPathSegment(path, 0.5, 1),
                player: this.currentPlayer
            };
            
            this.lines.push(firstLine);
            this.lines.push(secondLine);
            
            // 更新連接數（自連增加2個連接）
            startPoint.connections += 2;
        } else {
            // 正常連接：創建新點（在路徑中點）
            const midPoint = this.getPathMidPoint(path);
            const safePosition = this.findSafePointPosition(midPoint, 20);
            const newPoint = {
                id: this.points.length,
                x: safePosition.x,
                y: safePosition.y,
                connections: 2
            };
            
            this.points.push(newPoint);
            
            // 創建兩條新線
            const firstLine = {
                id: this.lines.length,
                start: startPoint,
                end: newPoint,
                path: this.getPathSegment(path, 0, 0.5),
                player: this.currentPlayer
            };
            
            const secondLine = {
                id: this.lines.length + 1,
                start: newPoint,
                end: endPoint,
                path: this.getPathSegment(path, 0.5, 1),
                player: this.currentPlayer
            };
            
            this.lines.push(firstLine);
            this.lines.push(secondLine);
            
            // 更新連接數
            startPoint.connections++;
            endPoint.connections++;
        }
        
        // 更新回合
        this.moveCount++;
        this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
        
        // 檢查遊戲是否結束
        if (this.isGameOver()) {
            this.endGame();
        }
        
        this.updateUI();
        this.draw();
    }
    
    getPathMidPoint(path) {
        const midIndex = Math.floor(path.length / 2);
        return path[midIndex];
    }
    
    findSafePointPosition(basePoint, minDistance = 20) {
        // 如果基礎點與現有點距離足夠遠，直接使用
        if (!this.isPointTooClose(basePoint, minDistance)) {
            return { x: basePoint.x, y: basePoint.y };
        }
        
        // 否則尋找附近的安全位置
        const attempts = 50;
        const searchRadius = 50;
        
        for (let i = 0; i < attempts; i++) {
            const angle = (Math.PI * 2 * i) / attempts;
            const distance = minDistance + Math.random() * searchRadius;
            
            const newX = basePoint.x + Math.cos(angle) * distance;
            const newY = basePoint.y + Math.sin(angle) * distance;
            
            const testPoint = { x: newX, y: newY };
            
            if (!this.isPointTooClose(testPoint, minDistance)) {
                return testPoint;
            }
        }
        
        // 如果找不到安全位置，返回一個稍微偏移的位置
        return {
            x: basePoint.x + (Math.random() - 0.5) * minDistance,
            y: basePoint.y + (Math.random() - 0.5) * minDistance
        };
    }
    
    getPathSegment(path, startT, endT) {
        const startIndex = Math.floor(startT * (path.length - 1));
        const endIndex = Math.floor(endT * (path.length - 1));
        return path.slice(startIndex, endIndex + 1);
    }
    
    isGameOver() {
        // 檢查是否只剩1個點未達到最大連接數且該點連接數為"最大連接數-1"
        const availablePoints = this.points.filter(point => point.connections < this.maxConnections);
        
        // 如果沒有可用點，遊戲結束
        if (availablePoints.length === 0) {
            return true;
        }
        
        // 如果有多個可用點，遊戲未結束
        if (availablePoints.length > 1) {
            return false;
        }
        
        // 只剩1個可用點，檢查其連接數是否為"最大連接數-1"
        const lastPoint = availablePoints[0];
        return lastPoint.connections === this.maxConnections - 1;
    }
    
    getValidMoves() {
        const moves = [];
        
        // 檢查是否只剩1個點未達到最大連接數且該點連接數為"最大連接數-1"
        const availablePoints = this.points.filter(point => point.connections < this.maxConnections);
        
        // 如果只剩1個點且連接數為"最大連接數-1"，則沒有有效移動
        if (availablePoints.length === 1 && availablePoints[0].connections === this.maxConnections - 1) {
            return moves;
        }
        
        // 否則檢查所有可能的移動
        for (let i = 0; i < this.points.length; i++) {
            for (let j = i; j < this.points.length; j++) {
                const point1 = this.points[i];
                const point2 = this.points[j];
                
                if (this.canConnectPoints(point1, point2)) {
                    if (!this.segmentIntersectsExistingLines({
                        start: point1,
                        end: point2
                    })) {
                        moves.push({
                            start: point1,
                            end: point2
                        });
                    }
                }
            }
        }
        
        return moves;
    }
    
    endGame() {
        this.gameState = 'ended';
        const winner = this.currentPlayer === 1 ? 2 : 1;
        const winnerName = winner === 1 ? '玩家1' : '玩家2';
        
        setTimeout(() => {
            alert(`遊戲結束！${winnerName}獲勝！`);
        }, 100);
        
        this.updateUI();
    }
    
    startGame() {
        this.gameState = 'playing';
        this.currentPlayer = 1;
        this.moveCount = 0;
        this.points = [];
        this.lines = [];
        
        // 生成初始點
        this.generateRandomPoints(this.initialPoints);
        
        this.updateUI();
        this.draw();
    }
    
    resetGame() {
        this.gameState = 'setup';
        this.currentPlayer = 1;
        this.moveCount = 0;
        this.points = [];
        this.lines = [];
        this.drawingPath = [];
        this.isDrawing = false;
        
        this.updateUI();
        this.draw();
    }
    
    generateRandomPoints(count) {
        const margin = 100;
        const minDistance = 80;
        
        for (let i = 0; i < count; i++) {
            let newPoint;
            let attempts = 0;
            
            do {
                newPoint = {
                    id: i,
                    x: margin + Math.random() * (this.canvasSize - 2 * margin),
                    y: margin + Math.random() * (this.canvasSize - 2 * margin),
                    connections: 0
                };
                attempts++;
            } while (this.isPointTooClose(newPoint, minDistance) && attempts < 100);
            
            // 如果嘗試100次後仍然找不到合適位置，強制放置
            if (attempts >= 100) {
                console.warn(`無法為點 ${i} 找到合適位置，強制放置`);
            }
            
            this.points.push(newPoint);
        }
    }
    
    isPointTooClose(newPoint, minDistance = 80) {
        for (const point of this.points) {
            const distance = Math.sqrt(
                Math.pow(newPoint.x - point.x, 2) + Math.pow(newPoint.y - point.y, 2)
            );
            if (distance < minDistance) {
                return true;
            }
        }
        return false;
    }
    
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 應用變換
        this.ctx.save();
        this.ctx.translate(this.offsetX, this.offsetY);
        this.ctx.scale(this.scale, this.scale);
        
        this.drawBackground();
        this.drawLines();
        this.drawPoints();
        this.drawDrawingPath();
        
        this.ctx.restore();
    }
    
    drawBackground() {
        // 繪製背景網格
        this.ctx.strokeStyle = '#f0f0f0';
        this.ctx.lineWidth = 1;
        
        const gridSize = 50;
        for (let x = 0; x < this.canvasSize; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvasSize);
            this.ctx.stroke();
        }
        
        for (let y = 0; y < this.canvasSize; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvasSize, y);
            this.ctx.stroke();
        }
    }
    
    drawLines() {
        for (const line of this.lines) {
            // 根據玩家選擇顏色
            if (line.player === 1) {
                this.ctx.strokeStyle = '#2196F3'; // 藍色 - 玩家1
            } else {
                this.ctx.strokeStyle = '#9C27B0'; // 紫色 - 玩家2
            }
            
            this.ctx.lineWidth = 4;
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';
            
            this.ctx.beginPath();
            this.ctx.moveTo(line.path[0].x, line.path[0].y);
            
            for (let i = 1; i < line.path.length; i++) {
                this.ctx.lineTo(line.path[i].x, line.path[i].y);
            }
            
            this.ctx.stroke();
        }
    }
    
    drawPoints() {
        for (const point of this.points) {
            // 根據連接數選擇顏色
            let fillColor, strokeColor;
            if (point.connections >= this.maxConnections) {
                // 已達到最大連接數的點用紅色
                fillColor = '#F44336';
                strokeColor = '#D32F2F';
            } else {
                // 正常點用綠色
                fillColor = '#4CAF50';
                strokeColor = '#2E7D32';
            }
            
            // 繪製點
            this.ctx.fillStyle = fillColor;
            this.ctx.beginPath();
            this.ctx.arc(point.x, point.y, 10, 0, 2 * Math.PI);
            this.ctx.fill();
            
            // 繪製邊框
            this.ctx.strokeStyle = strokeColor;
            this.ctx.lineWidth = 3;
            this.ctx.stroke();
            
            // 繪製連接數
            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 14px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(point.connections.toString(), point.x, point.y);
        }
    }
    
    drawDrawingPath() {
        if (this.drawingPath.length < 2) return;
        
        // 繪製進行中的路徑（綠色）
        this.ctx.strokeStyle = this.isValidPath ? '#4CAF50' : '#F44336';
        this.ctx.lineWidth = 4;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        this.ctx.beginPath();
        this.ctx.moveTo(this.drawingPath[0].x, this.drawingPath[0].y);
        
        for (let i = 1; i < this.drawingPath.length; i++) {
            this.ctx.lineTo(this.drawingPath[i].x, this.drawingPath[i].y);
        }
        
        this.ctx.stroke();
        
        // 繪製起點標記
        if (this.drawingStartPoint) {
            this.ctx.fillStyle = '#FF9800';
            this.ctx.beginPath();
            this.ctx.arc(this.drawingStartPoint.x, this.drawingStartPoint.y, 8, 0, 2 * Math.PI);
            this.ctx.fill();
        }
    }
} 