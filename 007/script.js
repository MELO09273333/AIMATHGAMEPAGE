// MCTS/UCT AI 節點類
class MCTSNode {
    constructor(board, player, move = null, parent = null) {
        this.board = board;
        this.player = player;
        this.move = move;
        this.parent = parent;
        this.children = [];
        this.wins = 0;
        this.visits = 0;
        this.untriedMoves = this.getAvailableMoves();
        this.isTerminal = this.checkTerminal();
    }

    getAvailableMoves() {
        const moves = [];
        for (let i = 0; i < this.board.length; i++) {
            for (let j = 0; j < this.board[i].length; j++) {
                if (this.board[i][j] === null) {
                    moves.push([i, j]);
                }
            }
        }
        return moves;
    }

    checkTerminal() {
        // 檢查是否有玩家獲勝
        for (let i = 0; i < this.board.length; i++) {
            for (let j = 0; j < this.board[i].length; j++) {
                if (this.board[i][j] !== null) {
                    if (this.checkWin(i, j, this.board[i][j])) {
                        return true;
                    }
                }
            }
        }
        // 檢查是否平局
        return this.untriedMoves.length === 0;
    }

    checkWin(row, col, player) {
        const visited = Array(this.board.length).fill().map(() => Array(this.board[0].length).fill(false));
        const startEdges = this.getStartEdges(player);
        const endEdges = this.getEndEdges(player);
        
        for (const [startRow, startCol] of startEdges) {
            if (this.board[startRow][startCol] === player && !visited[startRow][startCol]) {
                if (this.dfs(startRow, startCol, endEdges, visited, player)) {
                    return true;
                }
            }
        }
        return false;
    }

    getStartEdges(player) {
        const edges = [];
        if (player === 'blue') {
            // 藍色從上邊開始（第一行）
            for (let j = 0; j < this.board[0].length; j++) {
                edges.push([0, j]);
            }
        } else {
            // 紫色從左邊開始（第一列）
            for (let i = 0; i < this.board.length; i++) {
                edges.push([i, 0]);
            }
        }
        return edges;
    }

    getEndEdges(player) {
        const edges = [];
        if (player === 'blue') {
            // 藍色到下邊結束（最後一行）
            for (let j = 0; j < this.board[0].length; j++) {
                edges.push([this.board.length - 1, j]);
            }
        } else {
            // 紫色到右邊結束（最後一列）
            for (let i = 0; i < this.board.length; i++) {
                edges.push([i, this.board[0].length - 1]);
            }
        }
        return edges;
    }

    dfs(row, col, endEdges, visited, player) {
        if (visited[row][col]) return false;
        visited[row][col] = true;

        // 檢查是否到達終點
        for (const [endRow, endCol] of endEdges) {
            if (row === endRow && col === endCol) {
                return true;
            }
        }

        // 六個方向的鄰居
        const directions = [
            [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0]
        ];

        for (const [dr, dc] of directions) {
            const newRow = row + dr;
            const newCol = col + dc;
            if (this.isValidPosition(newRow, newCol) && 
                this.board[newRow][newCol] === player) {
                if (this.dfs(newRow, newCol, endEdges, visited, player)) {
                    return true;
                }
            }
        }
        return false;
    }

    isValidPosition(row, col) {
        return row >= 0 && row < this.board.length && 
               col >= 0 && col < this.board[0].length;
    }

    // UCT 公式計算
    uctValue(explorationConstant = 1.414) {
        if (this.visits === 0) return Infinity;
        return (this.wins / this.visits) + 
               explorationConstant * Math.sqrt(Math.log(this.parent.visits) / this.visits);
    }

    // 選擇最佳子節點
    selectChild() {
        return this.children.reduce((best, child) => {
            return child.uctValue() > best.uctValue() ? child : best;
        });
    }

    // 擴展新節點
    expand() {
        if (this.untriedMoves.length === 0) return this;
        
        const move = this.untriedMoves.pop();
        const newBoard = this.makeMove(move[0], move[1], this.player);
        const nextPlayer = this.player === 'blue' ? 'purple' : 'blue';
        const child = new MCTSNode(newBoard, nextPlayer, move, this);
        this.children.push(child);
        return child;
    }

    // 模擬隨機對局
    simulate() {
        let currentBoard = this.board.map(row => [...row]);
        let currentPlayer = this.player;
        
        while (true) {
            const availableMoves = [];
            for (let i = 0; i < currentBoard.length; i++) {
                for (let j = 0; j < currentBoard[i].length; j++) {
                    if (currentBoard[i][j] === null) {
                        availableMoves.push([i, j]);
                    }
                }
            }
            
            if (availableMoves.length === 0) return 'draw';
            
            // 隨機選擇一個移動
            const randomMove = availableMoves[Math.floor(Math.random() * availableMoves.length)];
            currentBoard[randomMove[0]][randomMove[1]] = currentPlayer;
            
            // 檢查是否獲勝
            if (this.checkWin(randomMove[0], randomMove[1], currentPlayer)) {
                return currentPlayer;
            }
            
            currentPlayer = currentPlayer === 'blue' ? 'purple' : 'blue';
        }
    }

    // 回傳結果
    backpropagate(result) {
        let node = this;
        while (node !== null) {
            node.visits++;
            if (result === node.player) {
                node.wins++;
            } else if (result === 'draw') {
                node.wins += 0.5;
            }
            node = node.parent;
        }
    }

    makeMove(row, col, player) {
        const newBoard = this.board.map(row => [...row]);
        newBoard[row][col] = player;
        return newBoard;
    }
}

// 主遊戲類
class HexGame {
    constructor() {
        this.boardSize = 6;
        this.board = [];
        this.currentPlayer = 'blue';
        this.gameMode = 'ai';
        this.aiDifficulty = 'medium';
        this.gameOver = false;
        this.winner = null;
        this.history = [];
        this.historyIndex = -1;
        this.isAITurn = false;
        this.winningPath = null;
        
        this.initializeBoard();
        this.setupEventListeners();
        this.updateDisplay();
        this.renderBoard();
    }

    initializeBoard() {
        this.board = Array(this.boardSize).fill().map(() => Array(this.boardSize).fill(null));
        this.gameOver = false;
        this.winner = null;
        this.history = [];
        this.historyIndex = -1;
        this.isAITurn = false;
        this.winningPath = null;
    }

    setupEventListeners() {
        // 棋盤大小控制
        document.getElementById('decrease-size').addEventListener('click', () => {
            if (this.boardSize > 3) {
                this.boardSize--;
                this.updateBoardSize();
            }
        });

        document.getElementById('increase-size').addEventListener('click', () => {
            if (this.boardSize < 20) {
                this.boardSize++;
                this.updateBoardSize();
            }
        });

        // 遊戲模式切換
        document.getElementById('game-mode').addEventListener('change', (e) => {
            this.gameMode = e.target.value;
            this.restart();
        });

        // AI難度切換
        document.getElementById('ai-difficulty').addEventListener('change', (e) => {
            this.aiDifficulty = e.target.value;
        });

        // 操作按鈕
        document.getElementById('undo-btn').addEventListener('click', () => this.undo());
        document.getElementById('restart-btn').addEventListener('click', () => this.restart());

        window.addEventListener('resize', () => this.renderBoard());
    }

    updateBoardSize() {
        document.getElementById('board-size').textContent = this.boardSize;
        this.initializeBoard();
        this.renderBoard();
        this.updateDisplay();
    }

    renderBoard() {
        const boardElement = document.getElementById('hex-board');
        boardElement.innerHTML = '';
        const container = boardElement.parentElement;
        const containerRect = container.getBoundingClientRect();
        const N = this.boardSize;
        const margin = 0.08;
        const maxWidth = containerRect.width;
        const maxHeight = containerRect.height;
        const hexRadiusW = (maxWidth * (1 - 2 * margin)) / (N * 1.5 + (N - 1) * 0.75 + 0.5);
        const hexRadiusH = (maxHeight * (1 - 2 * margin)) / (N * 1.5 + 1);
        const hexRadius = Math.min(hexRadiusW, hexRadiusH);
        const boardWidth = hexRadius * (N * 1.5 + (N - 1) * 0.75 + 0.5);
        const boardHeight = hexRadius * (N * 1.5 + 1);
        const offsetX = (maxWidth - boardWidth) / 2;
        const offsetY = (maxHeight - boardHeight) / 2;
        boardElement.setAttribute('viewBox', `0 0 ${maxWidth} ${maxHeight}`);
        boardElement.setAttribute('width', maxWidth);
        boardElement.setAttribute('height', maxHeight);
        // 先畫所有六角格polygon
        for (let i = 0; i < N; i++) {
            for (let j = 0; j < N; j++) {
                const {cx, cy} = this.hexCenter(i, j, hexRadius, offsetX, offsetY);
                const hex = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                hex.setAttribute('points', this.hexPointsFlat(cx, cy, hexRadius * 0.65));
                hex.setAttribute('class', 'hex-hexagon');
                hex.setAttribute('stroke', '#444');
                hex.setAttribute('stroke-width', '1.5');
                hex.setAttribute('fill', 'white');
                hex.addEventListener('click', () => this.makeMove(i, j));
                boardElement.appendChild(hex);
            }
        }
        // 畫外框
        this.drawHexParallelogramBorder(boardElement, N, hexRadius, offsetX, offsetY);
        // 若有連線，補上高亮（在棋子下方）
        if (this.winningPath) {
            for (const [i, j] of this.winningPath) {
                const {cx, cy} = this.hexCenter(i, j, hexRadius, offsetX, offsetY);
                const hex = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                hex.setAttribute('points', this.hexPointsFlat(cx, cy, hexRadius * 0.65));
                hex.setAttribute('class', 'hex-hexagon hex-highlight');
                hex.setAttribute('stroke', '#ffd700');
                hex.setAttribute('stroke-width', '2.5');
                hex.setAttribute('fill', '#ffe066');
                boardElement.appendChild(hex);
            }
        }
        // 再畫所有棋子，確保在最上層
        for (let i = 0; i < N; i++) {
            for (let j = 0; j < N; j++) {
                if (this.board[i][j]) {
                    const {cx, cy} = this.hexCenter(i, j, hexRadius, offsetX, offsetY);
                    const piece = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                    piece.setAttribute('cx', cx);
                    piece.setAttribute('cy', cy);
                    piece.setAttribute('r', hexRadius * 0.38);
                    piece.setAttribute('class', 'hex-piece');
                    piece.setAttribute('fill', this.board[i][j] === 'blue' ? '#667eea' : '#764ba2');
                    piece.setAttribute('stroke', this.board[i][j] === 'blue' ? '#5a6fd8' : '#6a4c93');
                    piece.setAttribute('stroke-width', '3');
                    boardElement.appendChild(piece);
                }
            }
        }
    }

    hexCenter(i, j, r, offsetX, offsetY) {
        // 平行四邊形六角格排列 - 統一間距
        // 水平間距：1.5 * r，垂直間距：1.5 * r（與水平間距相同）
        // 每行向右偏移 0.75 * r，形成平行四邊形
        const x = offsetX + r + j * r * 1.5 + i * r * 0.75;
        const y = offsetY + r + i * r * 1.5;
        return {cx: x, cy: y};
    }

    hexPointsFlat(cx, cy, r) {
        const points = [];
        for (let k = 0; k < 6; k++) {
            const angle = Math.PI / 180 * (60 * k + 30);
            const px = cx + r * Math.cos(angle);
            const py = cy + r * Math.sin(angle);
            points.push(`${px},${py}`);
        }
        return points.join(' ');
    }

    drawHexParallelogramBorder(svg, N, r, offsetX, offsetY) {
        // 取得四個角的六角格中心
        const p1 = this.hexCenter(0, 0, r, offsetX, offsetY);           // 左上
        const p2 = this.hexCenter(N-1, 0, r, offsetX, offsetY);         // 左下
        const p3 = this.hexCenter(N-1, N-1, r, offsetX, offsetY);       // 右下
        const p4 = this.hexCenter(0, N-1, r, offsetX, offsetY);         // 右上
        const pts = [p1, p2, p3, p4];
        // 計算每條邊的法線
        function getNormal(a, b) {
            let dx = b.cx - a.cx, dy = b.cy - a.cy;
            let len = Math.sqrt(dx*dx + dy*dy);
            return {x: -dy/len, y: dx/len}; // 逆時針90度
        }
        // 計算每個頂點的外推向量（兩條相鄰邊法線平均）
        let newPts = [];
        for (let i = 0; i < 4; i++) {
            let prev = pts[(i+3)%4], curr = pts[i], next = pts[(i+1)%4];
            let n1 = getNormal(prev, curr), n2 = getNormal(curr, next);
            let nx = (n1.x + n2.x) / 2, ny = (n1.y + n2.y) / 2;
            let nlen = Math.sqrt(nx*nx + ny*ny);
            nx /= nlen; ny /= nlen;
            newPts.push({cx: curr.cx + nx*r, cy: curr.cy + ny*r});
        }
        // 畫外框（上下藍，左右紫）
        this.drawBorderLine(svg, [newPts[0], newPts[3]], '#1976d2', 16); // 上
        this.drawBorderLine(svg, [newPts[1], newPts[2]], '#1976d2', 16); // 下
        this.drawBorderLine(svg, [newPts[0], newPts[1]], '#7b1fa2', 16); // 左
        this.drawBorderLine(svg, [newPts[3], newPts[2]], '#7b1fa2', 16); // 右
    }

    drawBorderLine(svg, pts, color, width=10) {
        const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
        poly.setAttribute('points', pts.map(p => `${p.cx},${p.cy}`).join(' '));
        poly.setAttribute('stroke', color);
        poly.setAttribute('stroke-width', width);
        poly.setAttribute('fill', 'none');
        poly.setAttribute('stroke-linecap', 'round');
        poly.setAttribute('stroke-linejoin', 'round');
        svg.appendChild(poly);
    }

    makeMove(row, col) {
        if (this.gameOver || this.board[row][col] !== null || this.isAITurn) {
            return;
        }
        this.board[row][col] = this.currentPlayer;
        this.addHistoryItem(`${this.currentPlayer === 'blue' ? '藍色' : '紫色'} 下在 (${row+1}, ${col+1})`, this.currentPlayer);
        this.renderBoard();
        this.updateDisplay();
        setTimeout(() => {
            if (this.checkWin(row, col, this.currentPlayer)) {
                this.gameOver = true;
                this.winner = this.currentPlayer;
                // 從起點開始尋找完整路徑
                this.winningPath = this.findCompletePath(this.currentPlayer);
                this.renderBoard(); // 先高亮再顯示棋子
                this.updateDisplay();
                return;
            }
            if (this.isBoardFull()) {
                this.gameOver = true;
                this.winner = 'draw';
                this.updateDisplay();
                return;
            }
            this.currentPlayer = this.currentPlayer === 'blue' ? 'purple' : 'blue';
            this.updateDisplay();
            if (this.gameMode === 'ai' && this.currentPlayer === 'purple' && !this.gameOver) {
                this.isAITurn = true;
                this.updateDisplay();
                setTimeout(() => {
                    this.makeAIMove();
                }, 500);
            }
        }, 50);
    }

    makeAIMove() {
        if (this.gameOver || this.isAITurn === false) return;
        let move = getAIMoveWithTimeout(getAIFunc(this.aiDifficulty), this.board, this.currentPlayer, this.currentPlayer === 'blue' ? 'purple' : 'blue', this.history);
        if (move) {
            this.board[move.r][move.c] = this.currentPlayer;
            this.addHistoryItem(`AI下在 (${move.r+1}, ${move.c+1})`, 'ai');
            this.renderBoard();
            setTimeout(() => {
                            if (this.checkWin(move.r, move.c, this.currentPlayer)) {
                this.gameOver = true;
                this.winner = this.currentPlayer;
                // 從起點開始尋找完整路徑
                this.winningPath = this.findCompletePath(this.currentPlayer);
                this.updateDisplay();
                this.renderBoard();
                } else if (this.isBoardFull()) {
                    this.gameOver = true;
                    this.winner = 'draw';
                    this.updateDisplay();
                } else {
                    this.currentPlayer = this.currentPlayer === 'blue' ? 'purple' : 'blue';
                    this.isAITurn = false;
                    this.updateDisplay();
                }
            }, 300);
        }
    }

    // 隨機落子
    getRandomMove() {
        const N = this.boardSize;
        const empty = [];
        for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) if (this.board[i][j] === null) empty.push([i, j]);
        if (empty.length) return empty[Math.floor(Math.random() * empty.length)];
        return null;
    }

    getBestMove() {
        const iterations = this.getIterationsByDifficulty();
        const root = new MCTSNode(this.board, this.currentPlayer);
        
        for (let i = 0; i < iterations; i++) {
            let node = root;
            
            // Selection
            while (node.untriedMoves.length === 0 && node.children.length > 0) {
                node = node.selectChild();
            }
            
            // Expansion
            if (node.untriedMoves.length > 0) {
                node = node.expand();
            }
            
            // Simulation
            const result = node.simulate();
            
            // Backpropagation
            node.backpropagate(result);
        }
        
        // 選擇訪問次數最多的子節點
        if (root.children.length > 0) {
            const bestChild = root.children.reduce((a, b) => 
                a.visits > b.visits ? a : b);
            return bestChild.move;
        }
        
        return null;
    }

    getIterationsByDifficulty() {
        switch (this.aiDifficulty) {
            case 'easy': return 100;
            case 'medium': return 500;
            case 'hard': return 1000;
            default: return 500;
        }
    }

    checkWin(row, col, player) {
        const N = this.boardSize;
        const visited = Array(N).fill().map(()=>Array(N).fill(false));
        const stack = [];
        if (player === 'blue') {
            for (let j = 0; j < N; j++) if (this.board[0][j] === 'blue') stack.push([0, j]);
        } else {
            for (let i = 0; i < N; i++) if (this.board[i][0] === 'purple') stack.push([i, 0]);
        }
        while (stack.length) {
            const [r, c] = stack.pop();
            if (visited[r][c]) continue;
            visited[r][c] = true;
            if ((player === 'blue' && r === N-1) || (player === 'purple' && c === N-1)) return true;
            for (const [dr, dc] of [[-1,0],[0,-1],[1,0],[0,1],[-1,1],[1,-1]]) {
                const nr = r + dr, nc = c + dc;
                if (nr >= 0 && nr < N && nc >= 0 && nc < N && this.board[nr][nc] === player && !visited[nr][nc]) {
                    stack.push([nr, nc]);
                }
            }
        }
        return false;
    }

    findPath(row, col, player, visited, path) {
        const N = this.boardSize;
        // 檢查是否到達終點
        if ((player === 'blue' && row === N-1) || (player === 'purple' && col === N-1)) {
            return [[row, col], ...path];
        }
        
        const key = row + ',' + col;
        if (visited[key]) return null;
        visited[key] = true;
        
        // 六個方向的鄰居
        const directions = [[-1,0],[0,-1],[1,0],[0,1],[-1,1],[1,-1]];
        
        for (const [dr, dc] of directions) {
            const nr = row + dr, nc = col + dc;
            if (nr >= 0 && nr < N && nc >= 0 && nc < N && 
                this.board[nr][nc] === player && !visited[nr + ',' + nc]) {
                const result = this.findPath(nr, nc, player, visited, [[row, col], ...path]);
                if (result) return result;
            }
        }
        return null;
    }

    // 尋找完整的連線路徑（從起點到終點）
    findCompletePath(player) {
        const N = this.boardSize;
        const visited = {};
        
        if (player === 'blue') {
            // 藍色：從上邊開始，到下邊結束
            for (let j = 0; j < N; j++) {
                if (this.board[0][j] === 'blue') {
                    const path = this.findPath(0, j, player, visited, []);
                    if (path) return path;
                }
            }
        } else {
            // 紫色：從左邊開始，到右邊結束
            for (let i = 0; i < N; i++) {
                if (this.board[i][0] === 'purple') {
                    const path = this.findPath(i, 0, player, visited, []);
                    if (path) return path;
                }
            }
        }
        return null;
    }

    isValidPosition(row, col) {
        return row >= 0 && row < this.boardSize && 
               col >= 0 && col < this.boardSize;
    }

    isBoardFull() {
        for (let i = 0; i < this.boardSize; i++) for (let j = 0; j < this.boardSize; j++) if (this.board[i][j] === null) return false;
        return true;
    }

    highlightWinningPath() {
        if (!this.winningPath) return;
        const boardElement = document.getElementById('hex-board');
        const N = this.boardSize;
        const container = boardElement.parentElement;
        const containerRect = container.getBoundingClientRect();
        const margin = 0.08;
        const maxWidth = containerRect.width;
        const maxHeight = containerRect.height;
        const hexRadiusW = (maxWidth * (1 - 2 * margin)) / (N * 1.5 + (N - 1) * 0.75 + 0.5);
        const hexRadiusH = (maxHeight * (1 - 2 * margin)) / (N * 1.5 + 1);
        const hexRadius = Math.min(hexRadiusW, hexRadiusH);
        const offsetX = (maxWidth - (hexRadius * (N * 1.5 + (N - 1) * 0.75 + 0.5))) / 2;
        const offsetY = (maxHeight - (hexRadius * (N * 1.5 + 1))) / 2;
        for (const [i, j] of this.winningPath) {
            const {cx, cy} = this.hexCenter(i, j, hexRadius, offsetX, offsetY);
            const hex = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            hex.setAttribute('points', this.hexPointsFlat(cx, cy, hexRadius * 0.65));
            hex.setAttribute('class', 'hex-hexagon hex-highlight');
            hex.setAttribute('stroke', '#ffd700');
            hex.setAttribute('stroke-width', '2.5');
            hex.setAttribute('fill', '#ffe066');
            document.getElementById('hex-board').appendChild(hex);
        }
    }

    addHistoryItem(text, type) {
        this.history.push({
            board: JSON.parse(JSON.stringify(this.board)),
            currentPlayer: this.currentPlayer,
            text,
            type
        });
        this.historyIndex = this.history.length - 1;
    }

    undo() {
        if (this.historyIndex < 0) return;
        if (this.historyIndex === 0) {
            this.initializeBoard();
            this.renderBoard();
            this.updateDisplay();
            return;
        }
        this.historyIndex--;
        const state = this.history[this.historyIndex];
        this.board = JSON.parse(JSON.stringify(state.board));
        this.currentPlayer = state.currentPlayer;
        this.gameOver = false;
        this.winner = null;
        this.winningPath = null;
        this.renderBoard();
        this.updateDisplay();
    }

    restart() {
        this.initializeBoard();
        this.renderBoard();
        this.updateDisplay();
    }

    updateDisplay() {
        const currentPlayerElement = document.getElementById('current-player');
        if (this.isAITurn) {
            currentPlayerElement.textContent = 'AI思考中...';
            currentPlayerElement.style.background = 'linear-gradient(135deg, #ff9800, #f57c00)';
        } else {
            currentPlayerElement.textContent = this.currentPlayer === 'blue' ? '藍色' : '紫色';
            currentPlayerElement.style.background = this.currentPlayer === 'blue' 
                ? 'linear-gradient(135deg, #667eea, #764ba2)' 
                : 'linear-gradient(135deg, #764ba2, #667eea)';
        }
        const gameStatusElement = document.getElementById('game-status');
        if (this.gameOver) {
            if (this.winner === 'draw') {
                gameStatusElement.textContent = '平局！';
                gameStatusElement.style.color = '#ff9800';
            } else {
                gameStatusElement.textContent = `${this.winner === 'blue' ? '藍色' : '紫色'}獲勝！`;
                gameStatusElement.style.color = this.winner === 'blue' ? '#667eea' : '#764ba2';
            }
        } else {
            gameStatusElement.textContent = '遊戲進行中';
            gameStatusElement.style.color = '#667eea';
        }
        document.getElementById('undo-btn').disabled = this.historyIndex <= 0;
    }

    // BFS計算最短連線距離
    getShortestPathLength(board, player) {
        const N = board.length || board.size;
        const visited = Array(N).fill().map(() => Array(N).fill(false));
        const queue = [];
        // 藍色：上到下，紫色：左到右
        if (player === 'blue') {
            for (let j = 0; j < N; j++) {
                if (board[0][j] === 'blue') {
                    queue.push({row: 0, col: j, dist: 0});
                    visited[0][j] = true;
                } else if (board[0][j] === null) {
                    queue.push({row: 0, col: j, dist: 1});
                    visited[0][j] = true;
                }
            }
        } else {
            for (let i = 0; i < N; i++) {
                if (board[i][0] === 'purple') {
                    queue.push({row: i, col: 0, dist: 0});
                    visited[i][0] = true;
                } else if (board[i][0] === null) {
                    queue.push({row: i, col: 0, dist: 1});
                    visited[i][0] = true;
                }
            }
        }
        const dirs = [[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0]];
        while (queue.length) {
            const {row, col, dist} = queue.shift();
            if ((player === 'blue' && row === N-1) || (player === 'purple' && col === N-1)) {
                return dist;
            }
            for (const [dr, dc] of dirs) {
                const nr = row + dr, nc = col + dc;
                if (nr >= 0 && nr < N && nc >= 0 && nc < N && !visited[nr][nc]) {
                    if (board[nr][nc] === player) {
                        queue.unshift({row: nr, col: nc, dist}); // 先走自己
                        visited[nr][nc] = true;
                    } else if (board[nr][nc] === null) {
                        queue.push({row: nr, col: nc, dist: dist+1});
                        visited[nr][nc] = true;
                    }
                }
            }
        }
        return 99; // 不可達
    }

    // 檢查(i, j)是否為己方棋子的橋點
    isBridgeMove(i, j, player) {
        const N = this.boardSize;
        const board = this.board;
        // 六角格的橋型偏移（以平行四邊形座標）
        const bridges = [
            [-2, -1], [-1, -2], [1, -2], [2, -1],
            [2, 1], [1, 2], [-1, 2], [-2, 1]
        ];
        for (const [di, dj] of bridges) {
            const ni = i + di, nj = j + dj;
            if (ni >= 0 && ni < N && nj >= 0 && nj < N && board[ni][nj] === player) {
                // 中間點必須為空
                const mi = i + di/2, mj = j + dj/2;
                if (Number.isInteger(mi) && Number.isInteger(mj) && mi >= 0 && mi < N && mj >= 0 && mj < N && board[mi][mj] === null) {
                    return true;
                }
            }
        }
        return false;
    }

    // 檢查(i, j)是否為對手橋的中間點
    isBreakOpponentBridge(i, j, player) {
        const N = this.boardSize;
        const board = this.board;
        const opp = (player === 'blue' ? 'purple' : 'blue');
        const bridges = [
            [-2, -1], [-1, -2], [1, -2], [2, -1],
            [2, 1], [1, 2], [-1, 2], [-2, 1]
        ];
        for (const [di, dj] of bridges) {
            const ni = i + di, nj = j + dj;
            if (ni >= 0 && ni < N && nj >= 0 && nj < N && board[ni][nj] === opp) {
                // 中間點必須是(i, j)
                const mi = i + di/2, mj = j + dj/2;
                if (Number.isInteger(mi) && Number.isInteger(mj) && mi === i && mj === j) {
                    return true;
                }
            }
        }
        return false;
    }

    // 取得四角座標
    getCornerPoints() {
        const N = this.boardSize;
        return [
            [0, 0],
            [0, N-1],
            [N-1, 0],
            [N-1, N-1]
        ];
    }

    // 尋找對方橋點（堵對方橋）
    findOpponentBridgePoints(player) {
        const N = this.boardSize;
        const opp = (player === 'blue' ? 'purple' : 'blue');
        let points = [];
        for (let i = 0; i < N; i++) {
            for (let j = 0; j < N; j++) {
                if (this.board[i][j] !== null) continue;
                if (this.isBridgeMove(i, j, opp)) {
                    points.push([i, j]);
                }
            }
        }
        return points;
    }

    // 尋找己方橋點
    findMyBridgePoints(player) {
        const N = this.boardSize;
        let points = [];
        for (let i = 0; i < N; i++) {
            for (let j = 0; j < N; j++) {
                if (this.board[i][j] !== null) continue;
                if (this.isBridgeMove(i, j, player)) {
                    points.push([i, j]);
                }
            }
        }
        return points;
    }

    // 跳一格堵（預判對方下一步，優先堵橋點或雙活點）
    findJumpBlockPoints(player) {
        const N = this.boardSize;
        const opp = (player === 'blue' ? 'purple' : 'blue');
        let points = [];
        // 只考慮對方棋子周圍兩格內的空格
        const dirs = [[-2,0],[2,0],[0,-2],[0,2],[-2,1],[-1,2],[1,2],[2,1],[2,-1],[1,-2],[-1,-2],[-2,-1]];
        for (let i = 0; i < N; i++) {
            for (let j = 0; j < N; j++) {
                if (this.board[i][j] !== null) continue;
                for (const [di, dj] of dirs) {
                    const ni = i + di, nj = j + dj;
                    if (ni >= 0 && ni < N && nj >= 0 && nj < N && this.board[ni][nj] === opp) {
                        points.push([i, j]);
                        break;
                    }
                }
            }
        }
        return points;
    }

    // 橋搭好後穩健連線（最短路徑/最大安全）
    findBestConnection(player) {
        // 直接用最短路徑啟發式
        const N = this.boardSize;
        let bestScore = -Infinity, bestMoves = [];
        for (let i = 0; i < N; i++) {
            for (let j = 0; j < N; j++) {
                if (this.board[i][j] !== null) continue;
                this.board[i][j] = player;
                const myLen = this.getShortestPathLength(this.board, player);
                const oppLen = this.getShortestPathLength(this.board, player === 'blue' ? 'purple' : 'blue');
                const score = oppLen - myLen;
                if (score > bestScore) {
                    bestScore = score;
                    bestMoves = [[i, j]];
                } else if (score === bestScore) {
                    bestMoves.push([i, j]);
                }
                this.board[i][j] = null;
            }
        }
        if (bestMoves.length) return bestMoves[Math.floor(Math.random()*bestMoves.length)];
        for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) if (this.board[i][j] === null) return [i, j];
        return null;
    }

    // 找出同時為2個以上對手棋子的橋點的空格
    findMultiOpponentBridgePoints(player) {
        const N = this.boardSize;
        const opp = (player === 'blue' ? 'purple' : 'blue');
        // 對每個空格，計算它是幾顆對手棋子的橋點
        let countMap = Array(N).fill().map(() => Array(N).fill(0));
        const bridges = [
            [-2, -1], [-1, -2], [1, -2], [2, -1],
            [2, 1], [1, 2], [-1, 2], [-2, 1]
        ];
        for (let i = 0; i < N; i++) {
            for (let j = 0; j < N; j++) {
                if (this.board[i][j] !== opp) continue;
                for (const [di, dj] of bridges) {
                    const ni = i + di, nj = j + dj;
                    if (ni >= 0 && ni < N && nj >= 0 && nj < N && this.board[ni][nj] === null) {
                        // 中間點必須為空
                        const mi = i + di/2, mj = j + dj/2;
                        if (Number.isInteger(mi) && Number.isInteger(mj) && mi >= 0 && mi < N && mj >= 0 && mj < N && this.board[mi][mj] === null) {
                            countMap[ni][nj]++;
                        }
                    }
                }
            }
        }
        let result = [];
        for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) if (countMap[i][j] >= 2) result.push([i, j]);
        return result;
    }

    // 過濾只保留與己方任一棋子距離<=radius的空格
    filterNearOwnStones(points, player, radius=2) {
        const N = this.boardSize;
        let own = [];
        for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) if (this.board[i][j] === player) own.push([i, j]);
        if (own.length === 0) return points; // 開局例外
        return points.filter(([x, y]) => own.some(([i, j]) => Math.abs(i-x) + Math.abs(j-y) <= radius));
    }

    // 專業AI主流程（插入多重橋點與距離過濾）
    getBestMoveProAI() {
        const N = this.boardSize;
        const player = this.currentPlayer;
        // 1. 直接贏
        for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
            if (this.board[i][j] !== null) continue;
            this.board[i][j] = player;
            if (this.checkWin(i, j, player)) {
                this.board[i][j] = null;
                return [i, j];
            }
            this.board[i][j] = null;
        }
        // 2. 必須防守
        for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
            if (this.board[i][j] !== null) continue;
            this.board[i][j] = player === 'blue' ? 'purple' : 'blue';
            if (this.checkWin(i, j, player === 'blue' ? 'purple' : 'blue')) {
                this.board[i][j] = null;
                return [i, j];
            }
            this.board[i][j] = null;
        }
        // 3. 多重橋點
        const multiBridge = this.findMultiOpponentBridgePoints(player);
        if (multiBridge.length) return multiBridge[Math.floor(Math.random()*multiBridge.length)];
        // 4. 堵對方橋點
        const oppBridge = this.findOpponentBridgePoints(player);
        if (oppBridge.length) return oppBridge[Math.floor(Math.random()*oppBridge.length)];
        // 5. 搶佔四角
        const corners = this.getCornerPoints().filter(([i,j]) => this.board[i][j] === null);
        if (corners.length) return corners[Math.floor(Math.random()*corners.length)];
        // 6. 主動做己方橋
        const myBridge = this.findMyBridgePoints(player);
        if (myBridge.length) return myBridge[Math.floor(Math.random()*myBridge.length)];
        // 7. 跳一格堵
        const jumpBlock = this.findJumpBlockPoints(player);
        if (jumpBlock.length) return jumpBlock[Math.floor(Math.random()*jumpBlock.length)];
        // 8. 橋搭好後穩健連線（優先考慮距離己方棋子半徑2內的點）
        // 先找所有空格
        let allEmpty = [];
        for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) if (this.board[i][j] === null) allEmpty.push([i, j]);
        let nearOwn = this.filterNearOwnStones(allEmpty, player, 2);
        if (nearOwn.length) {
            // 在這些點中選最短路徑啟發式
            let bestScore = -Infinity, bestMoves = [];
            for (const [i, j] of nearOwn) {
                this.board[i][j] = player;
                const myLen = this.getShortestPathLength(this.board, player);
                const oppLen = this.getShortestPathLength(this.board, player === 'blue' ? 'purple' : 'blue');
                const score = oppLen - myLen;
                if (score > bestScore) {
                    bestScore = score;
                    bestMoves = [[i, j]];
                } else if (score === bestScore) {
                    bestMoves.push([i, j]);
                }
                this.board[i][j] = null;
            }
            if (bestMoves.length) return bestMoves[Math.floor(Math.random()*bestMoves.length)];
        }
        // fallback
        if (allEmpty.length) return allEmpty[Math.floor(Math.random()*allEmpty.length)];
        return null;
    }
}

// 初始化遊戲
document.addEventListener('DOMContentLoaded', () => {
    new HexGame();
});

// ===== AI主流程分流 =====
function getAIFunc(difficulty) {
    if (difficulty === 'boss') return getBossMove;
    if (difficulty === 'hard') return getSmartBridgeMove;
    if (difficulty === 'medium') return getMediumAIMove;
    return getEasyAIMove;
}
// ===== 3秒超時包裝與備用策略 =====
function getAIMoveWithTimeout(aiFunc, board, myColor, oppColor, moveHistory) {
    const start = Date.now();
    let move = null;
    let timedOut = false;
    try {
        move = aiFunc(board, myColor, oppColor, moveHistory, ()=>{
            if (Date.now() - start > 3000) throw new Error('timeout');
        });
    } catch(e) {
        timedOut = true;
    }
    if (!move || timedOut) {
        let lastMove = moveHistory && moveHistory.length ? moveHistory[moveHistory.length-1] : null;
        if (!lastMove) {
            const empty = getEmptyCells(board);
            return empty.length ? empty[0] : null;
        }
        return getTimeoutFallbackMove(board, lastMove);
    }
    return move;
}
function getTimeoutFallbackMove(board, lastMove) {
    const N = board.length || board.size;
    const dirs = [[-1,-1],[-1,1],[1,-1],[1,1]];
    let candidates = [];
    for (const [dr, dc] of dirs) {
        const nr = lastMove.r + dr, nc = lastMove.c + dc;
        if (nr >= 0 && nr < N && nc >= 0 && nc < N && (!board.board ? board[nr][nc] : board.board[nr][nc]) === null) {
            candidates.push({r: nr, c: nc});
        }
    }
    let best = null, maxEmpty = -1;
    for (const pos of candidates) {
        let empty = 0;
        for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1],[-1,1],[1,-1]]) {
            const nr = pos.r + dr, nc = pos.c + dc;
            if (nr >= 0 && nr < N && nc >= 0 && nc < N && (!board.board ? board[nr][nc] : board.board[nr][nc]) === null) empty++;
        }
        if (empty > maxEmpty) {
            maxEmpty = empty;
            best = pos;
        }
    }
    if (best) return best;
    const empty = getEmptyCells(board);
    return empty.length ? empty[0] : null;
}
function getEmptyCells(board) {
    const N = board.length || board.size;
    let res = [];
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) if ((!board.board ? board[i][j] : board.board[i][j]) === null) res.push({r: i, c: j});
    return res;
}
// ===== AI主流程（簡單/中等/困難/魔王） =====
// 簡單AI：隨機落子
function getEasyAIMove(board, myColor, oppColor, moveHistory, checkTimeout) {
    const empty = getEmptyCells(board);
    if (empty.length) return empty[Math.floor(Math.random() * empty.length)];
    return null;
}
// 中等AI：最短路徑啟發式
function getMediumAIMove(board, myColor, oppColor, moveHistory, checkTimeout) {
    const N = board.length || board.size;
    let bestScore = -Infinity, bestMoves = [];
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
        if ((!board.board ? board[i][j] : board.board[i][j]) !== null) continue;
        if (checkTimeout) checkTimeout();
        // 模擬下子
        if (board.board) board.board[i][j] = myColor; else board[i][j] = myColor;
        const myLen = getShortestPathLength(board, myColor);
        const oppLen = getShortestPathLength(board, oppColor);
        const score = oppLen - myLen;
        if (score > bestScore) {
            bestScore = score;
            bestMoves = [{r: i, c: j}];
        } else if (score === bestScore) {
            bestMoves.push({r: i, c: j});
        }
        if (board.board) board.board[i][j] = null; else board[i][j] = null;
    }
    if (bestMoves.length) return bestMoves[Math.floor(Math.random()*bestMoves.length)];
    return null;
}
// 最短路徑計算（BFS）
function getShortestPathLength(board, player) {
    const N = board.length || board.size;
    const visited = Array(N).fill().map(()=>Array(N).fill(false));
    const queue = [];
    if (player === 'blue' || player === 1) {
        for (let j = 0; j < N; j++) {
            if ((!board.board ? board[0][j] : board.board[0][j]) === player) {
                queue.push({row: 0, col: j, dist: 0});
                visited[0][j] = true;
            } else if ((!board.board ? board[0][j] : board.board[0][j]) === null) {
                queue.push({row: 0, col: j, dist: 1});
                visited[0][j] = true;
            }
        }
    } else {
        for (let i = 0; i < N; i++) {
            if ((!board.board ? board[i][0] : board.board[i][0]) === player) {
                queue.push({row: i, col: 0, dist: 0});
                visited[i][0] = true;
            } else if ((!board.board ? board[i][0] : board.board[i][0]) === null) {
                queue.push({row: i, col: 0, dist: 1});
                visited[i][0] = true;
            }
        }
    }
    const dirs = [[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0]];
    while (queue.length) {
        const {row, col, dist} = queue.shift();
        if ((player === 'blue' || player === 1) && row === N-1) return dist;
        if ((player === 'purple' || player === 2) && col === N-1) return dist;
        for (const [dr, dc] of dirs) {
            const nr = row + dr, nc = col + dc;
            if (nr >= 0 && nr < N && nc >= 0 && nc < N && !visited[nr][nc]) {
                const cell = (!board.board ? board[nr][nc] : board.board[nr][nc]);
                if (cell === player) {
                    queue.unshift({row: nr, col: nc, dist});
                    visited[nr][nc] = true;
                } else if (cell === null) {
                    queue.push({row: nr, col: nc, dist: dist+1});
                    visited[nr][nc] = true;
                }
            }
        }
    }
    return 99;
}
// 困難AI：主線橋點+毀橋策略
function getSmartBridgeMove(board, myColor, oppColor, moveHistory, checkTimeout) {
    const N = board.length || board.size;
    const boardData = board.board || board;
    
    // 1. 直接獲勝
    for (let i = 0; i < N; i++) {
        for (let j = 0; j < N; j++) {
            if (checkTimeout) checkTimeout();
            if (boardData[i][j] !== null) continue;
            boardData[i][j] = myColor;
            if (checkWin(boardData, i, j, myColor)) {
                boardData[i][j] = null;
                return {r: i, c: j};
            }
            boardData[i][j] = null;
        }
    }
    
    // 2. 必須防守
    for (let i = 0; i < N; i++) {
        for (let j = 0; j < N; j++) {
            if (checkTimeout) checkTimeout();
            if (boardData[i][j] !== null) continue;
            boardData[i][j] = oppColor;
            if (checkWin(boardData, i, j, oppColor)) {
                boardData[i][j] = null;
                return {r: i, c: j};
            }
            boardData[i][j] = null;
        }
    }
    
    // 3. 堵對方主線橋點（優先毀掉對手主線橋點）
    const oppBridgePoints = findOpponentBridgePoints(boardData, oppColor, checkTimeout);
    if (oppBridgePoints.length) {
        return oppBridgePoints[Math.floor(Math.random() * oppBridgePoints.length)];
    }
    
    // 4. 做己方橋點
    const myBridgePoints = findMyBridgePoints(boardData, myColor, checkTimeout);
    if (myBridgePoints.length) {
        return myBridgePoints[Math.floor(Math.random() * myBridgePoints.length)];
    }
    
    // 5. 最短路徑啟發式
    let bestScore = -Infinity, bestMoves = [];
    for (let i = 0; i < N; i++) {
        for (let j = 0; j < N; j++) {
            if (checkTimeout) checkTimeout();
            if (boardData[i][j] !== null) continue;
            boardData[i][j] = myColor;
            const myLen = getShortestPathLength(board, myColor);
            const oppLen = getShortestPathLength(board, oppColor);
            const score = oppLen - myLen;
            if (score > bestScore) {
                bestScore = score;
                bestMoves = [{r: i, c: j}];
            } else if (score === bestScore) {
                bestMoves.push({r: i, c: j});
            }
            boardData[i][j] = null;
        }
    }
    if (bestMoves.length) return bestMoves[Math.floor(Math.random() * bestMoves.length)];
    
    // fallback
    const empty = getEmptyCells(board);
    return empty.length ? empty[0] : null;
}

// 魔王AI：理論必勝策略
function getBossMove(board, myColor, oppColor, moveHistory, checkTimeout) {
    const N = board.length || board.size;
    const boardData = board.board || board;
    
    // 1. 直接獲勝
    for (let i = 0; i < N; i++) {
        for (let j = 0; j < N; j++) {
            if (checkTimeout) checkTimeout();
            if (boardData[i][j] !== null) continue;
            boardData[i][j] = myColor;
            if (checkWin(boardData, i, j, myColor)) {
                boardData[i][j] = null;
                return {r: i, c: j};
            }
            boardData[i][j] = null;
        }
    }
    
    // 2. 必須防守
    for (let i = 0; i < N; i++) {
        for (let j = 0; j < N; j++) {
            if (checkTimeout) checkTimeout();
            if (boardData[i][j] !== null) continue;
            boardData[i][j] = oppColor;
            if (checkWin(boardData, i, j, oppColor)) {
                boardData[i][j] = null;
                return {r: i, c: j};
            }
            boardData[i][j] = null;
        }
    }
    
    // 3. 中心開局策略
    if (moveHistory && moveHistory.length <= 2) {
        const center = Math.floor(N / 2);
        if (boardData[center][center] === null) {
            return {r: center, c: center};
        }
    }
    
    // 4. 多重橋點策略
    const multiBridgePoints = findMultiOpponentBridgePoints(boardData, oppColor, checkTimeout);
    if (multiBridgePoints.length) {
        return multiBridgePoints[Math.floor(Math.random() * multiBridgePoints.length)];
    }
    
    // 5. 堵對方橋點
    const oppBridgePoints = findOpponentBridgePoints(boardData, oppColor, checkTimeout);
    if (oppBridgePoints.length) {
        return oppBridgePoints[Math.floor(Math.random() * oppBridgePoints.length)];
    }
    
    // 6. 做己方橋點
    const myBridgePoints = findMyBridgePoints(boardData, myColor, checkTimeout);
    if (myBridgePoints.length) {
        return myBridgePoints[Math.floor(Math.random() * myBridgePoints.length)];
    }
    
    // 7. 四角策略
    const corners = [[0,0], [0,N-1], [N-1,0], [N-1,N-1]];
    const availableCorners = corners.filter(([i,j]) => boardData[i][j] === null);
    if (availableCorners.length) {
        const [i, j] = availableCorners[Math.floor(Math.random() * availableCorners.length)];
        return {r: i, c: j};
    }
    
    // 8. 最短路徑啟發式
    let bestScore = -Infinity, bestMoves = [];
    for (let i = 0; i < N; i++) {
        for (let j = 0; j < N; j++) {
            if (checkTimeout) checkTimeout();
            if (boardData[i][j] !== null) continue;
            boardData[i][j] = myColor;
            const myLen = getShortestPathLength(board, myColor);
            const oppLen = getShortestPathLength(board, oppColor);
            const score = oppLen - myLen;
            if (score > bestScore) {
                bestScore = score;
                bestMoves = [{r: i, c: j}];
            } else if (score === bestScore) {
                bestMoves.push({r: i, c: j});
            }
            boardData[i][j] = null;
        }
    }
    if (bestMoves.length) return bestMoves[Math.floor(Math.random() * bestMoves.length)];
    
    // fallback
    const empty = getEmptyCells(board);
    return empty.length ? empty[0] : null;
}

// 輔助函數：檢查獲勝
function checkWin(board, row, col, player) {
    const N = board.length;
    const visited = Array(N).fill().map(() => Array(N).fill(false));
    const stack = [];
    
    if (player === 'blue') {
        for (let j = 0; j < N; j++) {
            if (board[0][j] === 'blue') stack.push([0, j]);
        }
    } else {
        for (let i = 0; i < N; i++) {
            if (board[i][0] === 'purple') stack.push([i, 0]);
        }
    }
    
    while (stack.length) {
        const [r, c] = stack.pop();
        if (visited[r][c]) continue;
        visited[r][c] = true;
        if ((player === 'blue' && r === N-1) || (player === 'purple' && c === N-1)) return true;
        for (const [dr, dc] of [[-1,0],[0,-1],[1,0],[0,1],[-1,1],[1,-1]]) {
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < N && nc >= 0 && nc < N && board[nr][nc] === player && !visited[nr][nc]) {
                stack.push([nr, nc]);
            }
        }
    }
    return false;
}

// 輔助函數：尋找對方橋點
function findOpponentBridgePoints(board, oppColor, checkTimeout) {
    const N = board.length;
    const points = [];
    const bridges = [[-2, -1], [-1, -2], [1, -2], [2, -1], [2, 1], [1, 2], [-1, 2], [-2, 1]];
    
    for (let i = 0; i < N; i++) {
        for (let j = 0; j < N; j++) {
            if (checkTimeout) checkTimeout();
            if (board[i][j] !== null) continue;
            for (const [di, dj] of bridges) {
                const ni = i + di, nj = j + dj;
                if (ni >= 0 && ni < N && nj >= 0 && nj < N && board[ni][nj] === oppColor) {
                    const mi = i + di/2, mj = j + dj/2;
                    if (Number.isInteger(mi) && Number.isInteger(mj) && mi >= 0 && mi < N && mj >= 0 && mj < N && board[mi][mj] === null) {
                        points.push({r: i, c: j});
                        break;
                    }
                }
            }
        }
    }
    return points;
}

// 輔助函數：尋找己方橋點
function findMyBridgePoints(board, myColor, checkTimeout) {
    const N = board.length;
    const points = [];
    const bridges = [[-2, -1], [-1, -2], [1, -2], [2, -1], [2, 1], [1, 2], [-1, 2], [-2, 1]];
    
    for (let i = 0; i < N; i++) {
        for (let j = 0; j < N; j++) {
            if (checkTimeout) checkTimeout();
            if (board[i][j] !== null) continue;
            for (const [di, dj] of bridges) {
                const ni = i + di, nj = j + dj;
                if (ni >= 0 && ni < N && nj >= 0 && nj < N && board[ni][nj] === myColor) {
                    const mi = i + di/2, mj = j + dj/2;
                    if (Number.isInteger(mi) && Number.isInteger(mj) && mi >= 0 && mi < N && mj >= 0 && mj < N && board[mi][mj] === null) {
                        points.push({r: i, c: j});
                        break;
                    }
                }
            }
        }
    }
    return points;
}

// 輔助函數：尋找多重橋點
function findMultiOpponentBridgePoints(board, oppColor, checkTimeout) {
    const N = board.length;
    const countMap = Array(N).fill().map(() => Array(N).fill(0));
    const bridges = [[-2, -1], [-1, -2], [1, -2], [2, -1], [2, 1], [1, 2], [-1, 2], [-2, 1]];
    
    for (let i = 0; i < N; i++) {
        for (let j = 0; j < N; j++) {
            if (checkTimeout) checkTimeout();
            if (board[i][j] !== oppColor) continue;
            for (const [di, dj] of bridges) {
                const ni = i + di, nj = j + dj;
                if (ni >= 0 && ni < N && nj >= 0 && nj < N && board[ni][nj] === null) {
                    const mi = i + di/2, mj = j + dj/2;
                    if (Number.isInteger(mi) && Number.isInteger(mj) && mi >= 0 && mi < N && mj >= 0 && mj < N && board[mi][mj] === null) {
                        countMap[ni][nj]++;
                    }
                }
            }
        }
    }
    
    const result = [];
    for (let i = 0; i < N; i++) {
        for (let j = 0; j < N; j++) {
            if (countMap[i][j] >= 2) result.push({r: i, c: j});
        }
    }
    return result;
}