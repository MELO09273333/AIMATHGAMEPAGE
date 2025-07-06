// 取得DOM元素
const boardWidthInput = document.getElementById('board-width');
const boardHeightInput = document.getElementById('board-height');
const startBtn = document.getElementById('start-btn');
const resetBtn = document.getElementById('reset-btn');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const okBtn = document.getElementById('ok-btn');
const statusText = document.getElementById('status-text');
const boardGrid = document.getElementById('board-grid');
const tilePool = document.querySelector('.tile-pool');

let board = [];
let boardW = 5, boardH = 5;
let gameStarted = false;
let previewTile = null;
let previewCell = null;
let lockedMoves = [];
let nextSteps = [{ x: 0, y: 0, dir: null }];
let cellPaths = [];
let currentPlayer = 1; // 1: 藍色, 2: 紫色
let history = [];
let historyIndex = 0;

// 方向對應表
const DIRS = ['up', 'right', 'down', 'left'];
const DX = [0, 1, 0, -1];
const DY = [1, 0, -1, 0];
// T1, T2, T3連接片的進出對應
const TILE_MAP = {
  T1: { up: 'left', left: 'up', down: 'right', right: 'down' },
  T2: { up: 'right', right: 'up', down: 'left', left: 'down' },
  T3: { up: 'down', down: 'up', left: 'right', right: 'left' }
};

function initBoard() {
  boardW = parseInt(boardWidthInput.value);
  boardH = parseInt(boardHeightInput.value);
  board = Array.from({ length: boardH }, () => Array(boardW).fill(null));
  previewTile = null;
  previewCell = null;
  lockedMoves = [];
  nextSteps = [{ x: 0, y: 0, dir: null }];
  cellPaths = Array.from({ length: boardH }, () => Array.from({ length: boardW }, () => []));
}

function getDirIndex(dir) {
  return DIRS.indexOf(dir);
}

function getNextStepFrom(x, y, inDir, path = []) {
  // 若超出邊界
  if (x < 0 || x >= boardW || y < 0 || y >= boardH) return null;
  // 若是終點
  if (x === boardW - 1 && y === boardH - 1) return { x, y, dir: inDir, isGoal: true, path };
  // 若是空格
  const tile = lockedMoves.find(m => m.x === x && m.y === y);
  if (!tile) return { x, y, dir: inDir, path };
  // 若已經走過這條路徑則終止
  if (cellPaths[y][x].some(p => p.in === inDir)) return null;
  // 標記這條路徑已走過
  cellPaths[y][x].push({ in: inDir, out: TILE_MAP[tile.type][inDir] });
  // 推進到下一格
  const outDir = TILE_MAP[tile.type][inDir];
  const nx = x + DX[getDirIndex(outDir)];
  const ny = y + DY[getDirIndex(outDir)];
  // 遞迴推進，記錄每格的進入點
  return getNextStepFrom(nx, ny, reverseDir(outDir), [...path, { x, y, dir: inDir }]);
}

function reverseDir(dir) {
  switch (dir) {
    case 'up': return 'down';
    case 'down': return 'up';
    case 'left': return 'right';
    case 'right': return 'left';
  }
}

function renderBoard() {
  boardGrid.innerHTML = '';
  boardGrid.style.setProperty('--bw', boardW);
  boardGrid.style.setProperty('--bh', boardH);
  for (let y = boardH - 1; y >= 0; y--) {
    for (let x = 0; x < boardW; x++) {
      const cell = document.createElement('div');
      cell.className = 'board-cell';
      // 判斷是否有預覽或已鎖定連接片
      const locked = lockedMoves.find(m => m.x === x && m.y === y);
      const isPreview = previewCell && previewCell.x === x && previewCell.y === y && previewTile;
      // 判斷是否為下一步指引格
      const nextStep = nextSteps.find(s => s.x === x && s.y === y);
      if (nextStep) {
        cell.classList.add('next-step');
      }
      // 起點(左下)
      if (x === 0 && y === 0 && !locked && !isPreview) {
        cell.classList.add('start');
        cell.textContent = '起點';
      }
      // 終點(右上)
      if (x === boardW - 1 && y === boardH - 1) {
        cell.classList.add('end');
        cell.textContent = '終點';
      }
      cell.dataset.x = x + 1;
      cell.dataset.y = y + 1;
      // 顯示已鎖定的連接片
      if (locked) {
        const img = document.createElement('img');
        img.src = locked.type + '.png';
        img.className = 'tile-on-board';
        cell.appendChild(img);
      }
      // 預覽連接片
      if (isPreview) {
        const img = document.createElement('img');
        img.src = previewTile + '.png';
        img.className = 'tile-on-board preview';
        cell.appendChild(img);
      }
      // 黃色圓點顯示進入點
      if (nextStep && nextStep.dir) {
        const dot = document.createElement('div');
        dot.className = 'entry-dot ' + nextStep.dir;
        cell.appendChild(dot);
      }
      // 拖曳放置事件
      cell.ondragover = e => {
        if (!gameStarted) return;
        if (!nextSteps.find(s => s.x === x && s.y === y)) return;
        e.preventDefault();
      };
      cell.ondrop = e => {
        if (!gameStarted) return;
        if (!nextSteps.find(s => s.x === x && s.y === y)) return;
        const type = e.dataTransfer.getData('tile-type');
        if (!type) return;
        previewTile = type;
        previewCell = { x, y };
        renderBoard();
        okBtn.disabled = false;
      };
      boardGrid.appendChild(cell);
    }
  }
}

tilePool.querySelectorAll('.tile-draggable').forEach(tile => {
  tile.ondragstart = e => {
    e.dataTransfer.setData('tile-type', tile.dataset.type);
  };
});

function autoAdvance(x, y, inDir) {
  // 若超出邊界
  if (x < 0 || x >= boardW || y < 0 || y >= boardH) return null;
  // 若是終點
  if (x === boardW - 1 && y === boardH - 1) return { x, y, dir: inDir, isGoal: true };
  // 若是空格
  const tile = lockedMoves.find(m => m.x === x && m.y === y);
  if (!tile) return { x, y, dir: inDir };
  // 若已經走過這條路徑則終止
  if (cellPaths[y][x].some(p => p.in === inDir)) return null;
  // 標記這條路徑已走過
  cellPaths[y][x].push({ in: inDir, out: TILE_MAP[tile.type][inDir] });
  // 推進到下一格
  const outDir = TILE_MAP[tile.type][inDir];
  const nx = x + DX[getDirIndex(outDir)];
  const ny = y + DY[getDirIndex(outDir)];
  return autoAdvance(nx, ny, reverseDir(outDir));
}

function findNextSteps(x, y, inDir, visited = {}) {
  // 超出邊界
  if (x < 0 || x >= boardW || y < 0 || y >= boardH) return [{ x, y, dir: inDir, isEdge: true }];
  // 終點
  if (x === boardW - 1 && y === boardH - 1) return [{ x, y, dir: inDir, isGoal: true }];
  // 已經走過這條路徑則終止
  const key = `${x},${y},${inDir}`;
  if (visited[key]) return [];
  visited[key] = true;
  // 空格：收集但不繼續推進
  const tile = lockedMoves.find(m => m.x === x && m.y === y);
  if (!tile) return [{ x, y, dir: inDir }];
  // 已有連接片，自動推進
  const outDir = TILE_MAP[tile.type][inDir];
  const nx = x + DX[getDirIndex(outDir)];
  const ny = y + DY[getDirIndex(outDir)];
  return findNextSteps(nx, ny, reverseDir(outDir), visited);
}

function showAutoStep(step, cb) {
  // 顯示黃點閃爍0.5秒
  nextSteps = [step];
  renderBoard();
  setTimeout(cb, 500);
}

function updateStatusText(gameOver = false, winner = null) {
  if (gameOver) {
    statusText.style.color = '#232426';
    if (winner === 1) statusText.textContent = '遊戲結束！玩家1獲勝';
    else if (winner === 2) statusText.textContent = '遊戲結束！玩家2獲勝';
    else statusText.textContent = '遊戲結束！';
    return;
  }
  if (currentPlayer === 1) {
    statusText.style.color = '#5b8dee';
    statusText.textContent = '輪到玩家1';
  } else {
    statusText.style.color = '#a259e6';
    statusText.textContent = '輪到玩家2';
  }
}

function saveHistory() {
  history = history.slice(0, historyIndex + 1);
  history.push({
    lockedMoves: JSON.parse(JSON.stringify(lockedMoves)),
    currentPlayer,
    nextSteps: JSON.parse(JSON.stringify(nextSteps)),
    cellPaths: JSON.parse(JSON.stringify(cellPaths)),
    gameStarted,
    status: statusText.textContent,
    statusColor: statusText.style.color
  });
  historyIndex = history.length - 1;
}

function loadHistory(idx) {
  if (idx < 0 || idx >= history.length) return;
  const snap = history[idx];
  lockedMoves = JSON.parse(JSON.stringify(snap.lockedMoves));
  currentPlayer = snap.currentPlayer;
  nextSteps = JSON.parse(JSON.stringify(snap.nextSteps));
  cellPaths = JSON.parse(JSON.stringify(snap.cellPaths));
  gameStarted = snap.gameStarted;
  statusText.textContent = snap.status;
  statusText.style.color = snap.statusColor;
  renderBoard();
  okBtn.disabled = true;
}

okBtn.onclick = () => {
  if (previewTile && previewCell) {
    lockedMoves.push({ ...previewCell, type: previewTile });
    previewTile = null;
    previewCell = null;
    okBtn.disabled = true;
    let steps = [];
    if (lockedMoves.length === 1) {
      steps = [
        { x: 0, y: 1, dir: 'down' },
        { x: 1, y: 0, dir: 'left' }
      ];
      nextSteps = steps;
      currentPlayer = 2;
      updateStatusText();
      renderBoard();
      saveHistory();
      return;
    }
    let start;
    if (nextSteps.length > 0) {
      const chosen = nextSteps.find(s => s.x === lockedMoves[lockedMoves.length-1].x && s.y === lockedMoves[lockedMoves.length-1].y);
      if (chosen) {
        start = chosen;
      } else {
        const last = lockedMoves[lockedMoves.length - 1];
        const prev = lockedMoves[lockedMoves.length - 2];
        const inDir = getNextStepDir(prev, last);
        start = { x: last.x, y: last.y, dir: inDir };
      }
    } else {
      const last = lockedMoves[lockedMoves.length - 1];
      const prev = lockedMoves[lockedMoves.length - 2];
      const inDir = getNextStepDir(prev, last);
      start = { x: last.x, y: last.y, dir: inDir };
    }
    const found = findNextSteps(start.x, start.y, start.dir);
    if (found.length === 1 && lockedMoves.find(m => m.x === found[0].x && m.y === found[0].y)) {
      showAutoStep(found[0], () => {
        okBtn.onclick();
      });
      return;
    }
    nextSteps = found;
    renderBoard();
    if (found.some(f => f.isGoal)) {
      updateStatusText(true, currentPlayer);
      saveHistory();
      return;
    }
    if (found.some(f => f.isEdge)) {
      updateStatusText(true, currentPlayer === 1 ? 2 : 1);
      saveHistory();
      return;
    }
    currentPlayer = currentPlayer === 1 ? 2 : 1;
    updateStatusText();
    saveHistory();
  }
};

function getNextStepDir(prev, curr) {
  // 根據前一步和這一步的位置，推算進入方向
  if (curr.x === prev.x && curr.y === prev.y + 1) return 'down';
  if (curr.x === prev.x && curr.y === prev.y - 1) return 'up';
  if (curr.x === prev.x + 1 && curr.y === prev.y) return 'left';
  if (curr.x === prev.x - 1 && curr.y === prev.y) return 'right';
  return null;
}

prevBtn.onclick = () => {
  if (historyIndex > 0) {
    loadHistory(historyIndex - 1);
    historyIndex--;
  }
};
nextBtn.onclick = () => {
  if (historyIndex < history.length - 1) {
    loadHistory(historyIndex + 1);
    historyIndex++;
  }
};

startBtn.addEventListener('click', () => {
  gameStarted = true;
  initBoard();
  cellPaths = Array.from({ length: boardH }, () => Array.from({ length: boardW }, () => []));
  currentPlayer = 1;
  updateStatusText();
  renderBoard();
  okBtn.disabled = true;
  saveHistory();
});
resetBtn.addEventListener('click', () => {
  gameStarted = false;
  initBoard();
  cellPaths = Array.from({ length: boardH }, () => Array.from({ length: boardW }, () => []));
  currentPlayer = 1;
  statusText.textContent = '請按開始遊戲';
  statusText.style.color = '#b7bfe6';
  renderBoard();
  okBtn.disabled = true;
  saveHistory();
});

// 初始化
initBoard();
renderBoard();
statusText.textContent = '請按開始遊戲';
okBtn.disabled = true;

window.addEventListener('resize', renderBoard);

document.addEventListener('DOMContentLoaded', () => {
  const sidePanel = document.getElementById('side-panel');
  const sideToggle = document.getElementById('side-toggle');
  sideToggle.onclick = () => {
    sidePanel.classList.toggle('collapsed');
  };
  // 預設收合
  sidePanel.classList.add('collapsed');
}); 