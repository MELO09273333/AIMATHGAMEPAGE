// 狀態
let boardSize = 3;
let board = [];
let currentPlayer = 'O';
let gameOver = false;
let mode = 'pve'; // 'pve' or 'pvp'
let playerMark = 'O';
let aiMark = 'X';
let difficulty = 'easy';

const boardTypeSelect = document.getElementById('board-type-select');
const modeSelect = document.getElementById('mode-select');
const firstPlayerSelect = document.getElementById('first-player-select');
const difficultySelect = document.getElementById('difficulty-select');
const boardDiv = document.getElementById('game-board');
const statusDiv = document.getElementById('status');
const restartBtn = document.getElementById('restart');

function initBoard() {
  boardSize = parseInt(boardTypeSelect.value.split('-')[1]);
  board = Array(boardSize * boardSize).fill('');
  gameOver = false;
  mode = modeSelect.value;
  if (mode === 'pve') {
    playerMark = firstPlayerSelect.value;
    aiMark = playerMark === 'O' ? 'X' : 'O';
    currentPlayer = 'O';
  } else {
    currentPlayer = 'O';
  }
  renderBoard();
  updateStatus();
  if (mode === 'pve' && currentPlayer === aiMark) {
    setTimeout(aiMove, 400);
  }
}

function renderBoard(highlightLine) {
  boardDiv.innerHTML = '';
  boardDiv.className = 'board';
  boardDiv.setAttribute('data-size', boardSize);
  for (let i = 0; i < board.length; i++) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.textContent = board[i];
    cell.addEventListener('click', () => handleMove(i));
    if (highlightLine && highlightLine.includes(i)) {
      cell.classList.add('win-cell');
    }
    boardDiv.appendChild(cell);
  }
  if (highlightLine && highlightLine.length > 1) {
    drawWinLine(highlightLine);
  } else {
    removeWinLine();
  }
}

function handleMove(idx) {
  if (gameOver || board[idx]) return;
  if (mode === 'pve' && currentPlayer !== playerMark) return;
  board[idx] = currentPlayer;
  const winLine = checkWin(currentPlayer);
  renderBoard(winLine);
  if (winLine) {
    statusDiv.textContent = `${currentPlayer} 勝利！`;
    gameOver = true;
  } else if (board.every(cell => cell)) {
    statusDiv.textContent = '平手！';
    gameOver = true;
  } else {
    currentPlayer = currentPlayer === 'O' ? 'X' : 'O';
    updateStatus();
    if (mode === 'pve' && !gameOver && currentPlayer === aiMark) {
      setTimeout(aiMove, 400);
    }
  }
}

function aiMove() {
  if (boardSize === 3 && difficulty === 'hard') {
    const best = minimax(board, aiMark, true);
    if (best.index !== undefined) {
      board[best.index] = aiMark;
    }
  } else if (difficulty === 'hard') {
    const best = minimaxLimited(board, aiMark, 3, true);
    if (best && best.index !== undefined) {
      board[best.index] = aiMark;
    } else {
      const blockIdx = findWinningMove(playerMark);
      if (blockIdx !== null) {
        board[blockIdx] = aiMark;
      } else {
        randomAIMove();
      }
    }
  } else if (difficulty === 'normal') {
    const winIdx = findWinningMove(aiMark);
    if (winIdx !== null) {
      board[winIdx] = aiMark;
    } else {
      const blockIdx = findWinningMove(playerMark);
      if (blockIdx !== null) {
        board[blockIdx] = aiMark;
      } else {
        randomAIMove();
      }
    }
  } else {
    randomAIMove();
  }
  const winLine = checkWin(aiMark);
  renderBoard(winLine);
  if (winLine) {
    statusDiv.textContent = `${aiMark} 勝利！`;
    gameOver = true;
  } else if (board.every(cell => cell)) {
    statusDiv.textContent = '平手！';
    gameOver = true;
  } else {
    currentPlayer = playerMark;
    updateStatus();
  }
}

function randomAIMove() {
  const empty = board.map((v, i) => v === '' ? i : null).filter(i => i !== null);
  if (empty.length === 0) return;
  const idx = empty[Math.floor(Math.random() * empty.length)];
  board[idx] = aiMark;
}

function findWinningMove(mark) {
  for (let i = 0; i < board.length; i++) {
    if (board[i] === '') {
      board[i] = mark;
      if (checkWin(mark)) {
        board[i] = '';
        return i;
      }
      board[i] = '';
    }
  }
  return null;
}

function minimax(newBoard, player, isRoot) {
  const availSpots = newBoard.map((v, i) => v === '' ? i : null).filter(i => i !== null);
  if (checkWinForMinimax(newBoard, playerMark)) {
    return { score: -10 };
  } else if (checkWinForMinimax(newBoard, aiMark)) {
    return { score: 10 };
  } else if (availSpots.length === 0) {
    return { score: 0 };
  }
  const moves = [];
  for (let i = 0; i < availSpots.length; i++) {
    const idx = availSpots[i];
    const move = { index: idx };
    newBoard[idx] = player;
    if (player === aiMark) {
      const result = minimax(newBoard, playerMark, false);
      move.score = result.score;
    } else {
      const result = minimax(newBoard, aiMark, false);
      move.score = result.score;
    }
    newBoard[idx] = '';
    moves.push(move);
  }
  let bestMove;
  if (player === aiMark) {
    let bestScore = -Infinity;
    for (let i = 0; i < moves.length; i++) {
      if (moves[i].score > bestScore) {
        bestScore = moves[i].score;
        bestMove = i;
      }
    }
  } else {
    let bestScore = Infinity;
    for (let i = 0; i < moves.length; i++) {
      if (moves[i].score < bestScore) {
        bestScore = moves[i].score;
        bestMove = i;
      }
    }
  }
  return moves[bestMove];
}

function checkWinForMinimax(bd, player) {
  for (let i = 0; i < 3; i++) {
    if ([0,1,2].every(j => bd[i * 3 + j] === player)) return true;
    if ([0,1,2].every(j => bd[j * 3 + i] === player)) return true;
  }
  if ([0,1,2].every(i => bd[i * 4] === player)) return true;
  if ([0,1,2].every(i => bd[(i + 1) * 2] === player)) return true;
  return false;
}

function updateStatus() {
  if (mode === 'pvp') {
    statusDiv.textContent = `輪到 ${currentPlayer}`;
  } else {
    if (currentPlayer === playerMark) {
      statusDiv.textContent = `輪到你 (${playerMark})`;
    } else {
      statusDiv.textContent = `AI (${aiMark}) 思考中...`;
    }
  }
}

function checkWin(player) {
  for (let i = 0; i < boardSize; i++) {
    if (Array(boardSize).fill().every((_, j) => board[i * boardSize + j] === player)) {
      return Array(boardSize).fill().map((_, j) => i * boardSize + j);
    }
    if (Array(boardSize).fill().every((_, j) => board[j * boardSize + i] === player)) {
      return Array(boardSize).fill().map((_, j) => j * boardSize + i);
    }
  }
  if (Array(boardSize).fill().every((_, i) => board[i * (boardSize + 1)] === player)) {
    return Array(boardSize).fill().map((_, i) => i * (boardSize + 1));
  }
  if (Array(boardSize).fill().every((_, i) => board[(i + 1) * (boardSize - 1)] === player)) {
    return Array(boardSize).fill().map((_, i) => (i + 1) * (boardSize - 1));
  }
  return null;
}

function minimaxLimited(newBoard, player, depth, isRoot) {
  const availSpots = newBoard.map((v, i) => v === '' ? i : null).filter(i => i !== null);
  if (checkWinForMinimax(newBoard, playerMark)) {
    return { score: -10 };
  } else if (checkWinForMinimax(newBoard, aiMark)) {
    return { score: 10 };
  } else if (availSpots.length === 0 || depth === 0) {
    return { score: 0 };
  }
  const moves = [];
  for (let i = 0; i < availSpots.length; i++) {
    const idx = availSpots[i];
    const move = { index: idx };
    newBoard[idx] = player;
    if (player === aiMark) {
      const result = minimaxLimited(newBoard, playerMark, depth - 1, false);
      move.score = result.score;
    } else {
      const result = minimaxLimited(newBoard, aiMark, depth - 1, false);
      move.score = result.score;
    }
    newBoard[idx] = '';
    moves.push(move);
  }
  let bestMove;
  if (player === aiMark) {
    let bestScore = -Infinity;
    for (let i = 0; i < moves.length; i++) {
      if (moves[i].score > bestScore) {
        bestScore = moves[i].score;
        bestMove = i;
      }
    }
  } else {
    let bestScore = Infinity;
    for (let i = 0; i < moves.length; i++) {
      if (moves[i].score < bestScore) {
        bestScore = moves[i].score;
        bestMove = i;
      }
    }
  }
  return moves[bestMove];
}

function removeWinLine() {
  const old = document.getElementById('win-line-svg');
  if (old) old.remove();
}

function drawWinLine(highlightLine) {
  removeWinLine();
  if (!highlightLine || highlightLine.length < 2) return;
  const size = boardSize;
  const boardRect = boardDiv.getBoundingClientRect();
  const cellElems = boardDiv.querySelectorAll('.cell');
  if (cellElems.length === 0) return;
  const getCellCenter = idx => {
    const cell = cellElems[idx];
    const rect = cell.getBoundingClientRect();
    return {
      x: rect.left - boardRect.left + rect.width / 2,
      y: rect.top - boardRect.top + rect.height / 2
    };
  };
  const start = getCellCenter(highlightLine[0]);
  const end = getCellCenter(highlightLine[highlightLine.length - 1]);
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('id', 'win-line-svg');
  svg.style.position = 'absolute';
  svg.style.left = 0;
  svg.style.top = 0;
  svg.style.width = '100%';
  svg.style.height = '100%';
  svg.style.pointerEvents = 'none';
  svg.style.zIndex = 10;
  svg.setAttribute('width', boardRect.width);
  svg.setAttribute('height', boardRect.height);
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  line.setAttribute('x1', start.x);
  line.setAttribute('y1', start.y);
  line.setAttribute('x2', start.x);
  line.setAttribute('y2', start.y);
  line.setAttribute('stroke', '#ff3b3b');
  line.setAttribute('stroke-width', 6);
  line.setAttribute('stroke-linecap', 'round');
  svg.appendChild(line);
  boardDiv.appendChild(svg);
  setTimeout(() => {
    line.setAttribute('x2', end.x);
    line.setAttribute('y2', end.y);
    line.style.transition = 'x2 0.5s, y2 0.5s';
  }, 30);
}

// 事件綁定
restartBtn.addEventListener('click', initBoard);
modeSelect.addEventListener('change', initBoard);
firstPlayerSelect.addEventListener('change', initBoard);
difficultySelect.addEventListener('change', () => {
  difficulty = difficultySelect.value;
  initBoard();
});
boardTypeSelect.addEventListener('change', initBoard);

// 頁面載入時初始化
initBoard(); 