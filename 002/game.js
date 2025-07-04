let boardType = '2d-3'; // 2d-3, 2d-4, 2d-5, 3d-3, 3d-4
let boardSize = 3;
let boardDepth = 1; // 2D: 1, 3D: 3 or 4
let board = [];
let currentPlayer = 'O';
let gameOver = false;
let mode = 'pvp'; // 'pvp' or 'pve'
let playerMark = 'O'; // 玩家用O或X
let aiMark = 'X';
let difficulty = 'easy'; // easy, normal, hard
let threeScene, threeCamera, threeRenderer, threeControls;
let threeCubes = [];
let threeSpheres = [];
let threeWinLine = null;
let threeWinLineAnim = null;
let svg3dTransform = { rx: -30, ry: 0, tx: 0, ty: 0 };
let threeCubeScene, threeCubeCamera, threeCubeRenderer, threeCubeControls;
let threeCubeCells = [];
let threeCubeGroup;

// 滑鼠閒置檢測
let mouseIdleTimer = null;
let mouseIdleTimeout = 3000; // 3秒
let isMouseIdle = false;

// 勝利連線動畫
let winLine = null;
let winLineAnimation = null;

const boardDiv = document.getElementById('game-board');
const statusDiv = document.getElementById('status');
const restartBtn = document.getElementById('restart');
const modeSelect = document.getElementById('mode-select');
const firstPlayerSelect = document.getElementById('first-player-select');
const firstPlayerLabel = document.getElementById('first-player-label');
const difficultySelect = document.getElementById('difficulty-select');
const difficultyLabel = document.getElementById('difficulty-label');
const boardTypeSelect = document.getElementById('board-type-select');
const boardTypeLabel = document.getElementById('board-type-label');

function updateBoardTypeVars() {
  const val = boardTypeSelect.value;
  boardType = val;
  if (val.startsWith('2d')) {
    boardDepth = 1;
    boardSize = parseInt(val.split('-')[1]);
  } else if (val.startsWith('3d')) {
    boardDepth = parseInt(val.split('-')[1]);
    boardSize = boardDepth;
  }
}

const realInitBoard = function() {
  if (threeWinLine) {
    threeScene.remove(threeWinLine);
    threeWinLine = null;
  }
  if (threeWinLineAnim) cancelAnimationFrame(threeWinLineAnim);
  
  // 清除3D勝利連線
  if (winLine) {
    threeCubeScene.remove(winLine);
    winLine = null;
  }
  if (winLineAnimation) {
    cancelAnimationFrame(winLineAnimation);
    winLineAnimation = null;
  }
  
  updateBoardTypeVars();
  board = Array(boardDepth).fill(0).map(() => Array(boardSize * boardSize).fill(''));
  showThreeJSCube();
  hideSVG3DBoard();
  document.getElementById('game-board').style.display = 'none';
  gameOver = false;
  mode = modeSelect.value;
  if (mode === 'pve') {
    playerMark = firstPlayerSelect.value;
    aiMark = playerMark === 'O' ? 'X' : 'O';
    currentPlayer = 'O';
  } else {
    currentPlayer = 'O';
  }
  updateStatus();
  if (mode === 'pve' && currentPlayer === aiMark) {
    setTimeout(aiMove, 3000);
  }
  updateZLayerSelect();
  renderSide2DBoard();
};

function renderBoard() {
  if (threeWinLine) {
    threeScene.remove(threeWinLine);
    threeWinLine = null;
  }
  if (threeWinLineAnim) cancelAnimationFrame(threeWinLineAnim);
  if (boardDepth === 1) {
    boardDiv.className = 'board';
    boardDiv.setAttribute('data-size', boardSize);
    boardDiv.innerHTML = '';
    for (let i = 0; i < board.length; i++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.textContent = board[i];
      cell.addEventListener('click', () => handleMove(i));
      boardDiv.appendChild(cell);
    }
  } else {
    // 3D: 多層2D棋盤
    boardDiv.className = 'board-3d';
    boardDiv.innerHTML = '';
    for (let z = 0; z < boardDepth; z++) {
      const layerDiv = document.createElement('div');
      layerDiv.className = 'board board-3d-layer';
      layerDiv.setAttribute('data-size', boardSize);
      for (let i = 0; i < board[z].length; i++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.textContent = board[z][i];
        cell.addEventListener('click', () => handleMove3D(z, i));
        layerDiv.appendChild(cell);
      }
      const label = document.createElement('div');
      label.style.textAlign = 'center';
      label.style.color = '#4a6fa5';
      label.style.fontSize = '0.9rem';
      label.textContent = `第${z+1}層`;
      boardDiv.appendChild(label);
      boardDiv.appendChild(layerDiv);
    }
  }
}

function handleMove(idx) {
  if (gameOver || board[idx]) return;
  if (mode === 'pve' && currentPlayer !== playerMark) return;
  board[idx] = currentPlayer;
  renderBoard();
  if (checkWin(currentPlayer)) {
    statusDiv.textContent = `${currentPlayer} 勝利！`;
    gameOver = true;
  } else if (board.every(cell => cell)) {
    statusDiv.textContent = '平手！';
    gameOver = true;
  } else {
    currentPlayer = currentPlayer === 'O' ? 'X' : 'O';
    updateStatus();
    if (mode === 'pve' && !gameOver && currentPlayer === aiMark) {
      setTimeout(aiMove, 3000);
    }
  }
}

function handleMove3D(z, idx) {
  if (gameOver || board[z][idx]) return;
  if (mode === 'pve' && currentPlayer !== playerMark) return;
  board[z][idx] = currentPlayer;
  renderBoard();
  if (checkWin3D(currentPlayer)) {
    statusDiv.textContent = `${currentPlayer} 勝利！`;
    gameOver = true;
  } else if (board.flat().every(cell => cell)) {
    statusDiv.textContent = '平手！';
    gameOver = true;
  } else {
    currentPlayer = currentPlayer === 'O' ? 'X' : 'O';
    updateStatus();
    if (mode === 'pve' && !gameOver && currentPlayer === aiMark) {
      setTimeout(aiMove, 3000);
    }
  }
}

function aiMove() {
  if (boardDepth === 1) {
    // 2D
    if (boardSize === 3 && difficulty === 'hard') {
      // 3x3全深度Minimax
      const best = minimax(board, aiMark, true);
      if (best.index !== undefined) {
        board[best.index] = aiMark;
      }
    } else if (difficulty === 'hard') {
      // 4x4/5x5有限深度Minimax
      const best = minimaxLimited(board, aiMark, 3, true); // 深度3
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
    renderBoard();
    if (checkWin(aiMark)) {
      statusDiv.textContent = `${aiMark} 勝利！`;
      gameOver = true;
    } else if (board.every(cell => cell)) {
      statusDiv.textContent = '平手！';
      gameOver = true;
    } else {
      currentPlayer = playerMark;
      updateStatus();
    }
  } else {
    // 3D
    let aiMoveZ = 0;
    let aiMoveIdx = 0;
    if (difficulty === 'hard') {
      // 1. 先找AI自己有連線的勝利點
      let found = false;
      for (let z = 0; z < boardDepth && !found; z++) {
        for (let i = 0; i < boardSize * boardSize && !found; i++) {
          if (board[z][i] === '') {
            board[z][i] = aiMark;
            if (checkWin3DWithAnimation(aiMark)) {
              aiMoveZ = z;
              aiMoveIdx = i;
              found = true;
            }
            board[z][i] = '';
          }
        }
      }
      // 2. 沒有直接勝利點，阻擋對手即將連線
      if (!found) {
        for (let z = 0; z < boardDepth && !found; z++) {
          for (let i = 0; i < boardSize * boardSize && !found; i++) {
            if (board[z][i] === '') {
              board[z][i] = playerMark;
              if (checkWin3DWithAnimation(playerMark)) {
                board[z][i] = aiMark;
                aiMoveZ = z;
                aiMoveIdx = i;
                found = true;
              } else {
                board[z][i] = '';
              }
            }
          }
        }
      }
      // 3. 其他策略（原有限深度Minimax）
      if (!found) {
        const best = minimaxLimited3D(board, aiMark, 2, true); // 3D用深度2
        if (best && best.z !== undefined && best.index !== undefined) {
          board[best.z][best.index] = aiMark;
          aiMoveZ = best.z;
          aiMoveIdx = best.index;
        } else {
          // 防守
          const block = findWinningMove3D(playerMark);
          if (block) {
            board[block.z][block.index] = aiMark;
            aiMoveZ = block.z;
            aiMoveIdx = block.index;
          } else {
            randomAIMove3D();
            // 找到AI下子的位置
            for (let z = 0; z < boardDepth; z++) {
              for (let i = 0; i < boardSize * boardSize; i++) {
                if (board[z][i] === aiMark) {
                  let isLatest = true;
                  for (let checkZ = 0; checkZ < boardDepth; checkZ++) {
                    for (let checkI = 0; checkI < boardSize * boardSize; checkI++) {
                      if (board[checkZ][checkI] === aiMark && (checkZ > z || (checkZ === z && checkI > i))) {
                        isLatest = false;
                        break;
                      }
                    }
                  }
                  if (isLatest) {
                    aiMoveZ = z;
                    aiMoveIdx = i;
                  }
                }
              }
            }
          }
        }
      }
    } else {
      randomAIMove3D();
      // 找到AI下子的位置
      for (let z = 0; z < boardDepth; z++) {
        for (let i = 0; i < boardSize * boardSize; i++) {
          if (board[z][i] === aiMark) {
            // 檢查是否為最新下的子
            let isLatest = true;
            for (let checkZ = 0; checkZ < boardDepth; checkZ++) {
              for (let checkI = 0; checkI < boardSize * boardSize; checkI++) {
                if (board[checkZ][checkI] === aiMark && (checkZ > z || (checkZ === z && checkI > i))) {
                  isLatest = false;
                  break;
                }
              }
            }
            if (isLatest) {
              aiMoveZ = z;
              aiMoveIdx = i;
            }
          }
        }
      }
    }
    renderThreeJSCube();
    renderSide2DBoard();
    // 自動切換到AI下子的Z層
    const zButtons = document.querySelectorAll('.z-button');
    zButtons.forEach(btn => btn.classList.remove('active'));
    zButtons[aiMoveZ].classList.add('active');
    renderSide2DBoard();
    renderThreeJSCube();
    if (checkWin3DWithAnimation(aiMark)) {
      statusDiv.textContent = `${aiMark} 勝利！`;
      gameOver = true;
    } else if (board.flat().every(cell => cell)) {
      statusDiv.textContent = '平手！';
      gameOver = true;
    } else {
      currentPlayer = playerMark;
      updateStatus();
    }
  }
}

function randomAIMove() {
  const empty = board.map((v, i) => v === '' ? i : null).filter(i => i !== null);
  if (empty.length === 0) return;
  const idx = empty[Math.floor(Math.random() * empty.length)];
  board[idx] = aiMark;
}

function randomAIMove3D() {
  const empty = [];
  for (let z = 0; z < boardDepth; z++) {
    for (let i = 0; i < boardSize * boardSize; i++) {
      if (board[z][i] === '') empty.push([z, i]);
    }
  }
  if (empty.length === 0) return;
  const [z, idx] = empty[Math.floor(Math.random() * empty.length)];
  board[z][idx] = aiMark;
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

// Minimax for 3x3 OOXX
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
  // 只在根節點回傳index
  if (isRoot) {
    return moves[bestMove];
  } else {
    return moves[bestMove];
  }
}

function checkWinForMinimax(bd, player) {
  // 橫、直
  for (let i = 0; i < 3; i++) {
    if ([0,1,2].every(j => bd[i * 3 + j] === player)) return true;
    if ([0,1,2].every(j => bd[j * 3 + i] === player)) return true;
  }
  // 斜線
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
    if (Array(boardSize).fill().every((_, j) => board[i * boardSize + j] === player)) return true;
    if (Array(boardSize).fill().every((_, j) => board[j * boardSize + i] === player)) return true;
  }
  if (Array(boardSize).fill().every((_, i) => board[i * (boardSize + 1)] === player)) return true;
  if (Array(boardSize).fill().every((_, i) => board[(i + 1) * (boardSize - 1)] === player)) return true;
  return false;
}

function showThreeWinLine(start, end) {
  if (threeWinLine) {
    threeScene.remove(threeWinLine);
    threeWinLine = null;
  }
  if (threeWinLineAnim) cancelAnimationFrame(threeWinLineAnim);
  const material = new THREE.LineBasicMaterial({ color: 0xff3333, linewidth: 6 });
  const points = [
    new THREE.Vector3(...start),
    new THREE.Vector3(...start)
  ];
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  threeWinLine = new THREE.Line(geometry, material);
  threeScene.add(threeWinLine);
  // 動畫
  let t = 0;
  function animateLine() {
    t += 0.04;
    if (t > 1) t = 1;
    const x = start[0] + (end[0] - start[0]) * t;
    const y = start[1] + (end[1] - start[1]) * t;
    const z = start[2] + (end[2] - start[2]) * t;
    threeWinLine.geometry.setFromPoints([
      new THREE.Vector3(...start),
      new THREE.Vector3(x, y, z)
    ]);
    if (t < 1) {
      threeWinLineAnim = requestAnimationFrame(animateLine);
    }
  }
  animateLine();
}

function checkWin3D(player) {
  // 檢查每層2D
  for (let z = 0; z < boardDepth; z++) {
    for (let i = 0; i < boardSize; i++) {
      if (Array(boardSize).fill().every((_, j) => board[z][i * boardSize + j] === player)) {
        // 橫線
        if (boardDepth > 1) showThreeWinLine([0 - (boardSize-1)/2, i - (boardSize-1)/2, z - (boardDepth-1)/2], [boardSize-1 - (boardSize-1)/2, i - (boardSize-1)/2, z - (boardDepth-1)/2]);
        return true;
      }
      if (Array(boardSize).fill().every((_, j) => board[z][j * boardSize + i] === player)) {
        // 直線
        if (boardDepth > 1) showThreeWinLine([i - (boardSize-1)/2, 0 - (boardSize-1)/2, z - (boardDepth-1)/2], [i - (boardSize-1)/2, boardSize-1 - (boardSize-1)/2, z - (boardDepth-1)/2]);
        return true;
      }
    }
    if (Array(boardSize).fill().every((_, i) => board[z][i * (boardSize + 1)] === player)) {
      // 主對角線
      if (boardDepth > 1) showThreeWinLine([0 - (boardSize-1)/2, 0 - (boardSize-1)/2, z - (boardDepth-1)/2], [boardSize-1 - (boardSize-1)/2, boardSize-1 - (boardSize-1)/2, z - (boardDepth-1)/2]);
      return true;
    }
    if (Array(boardSize).fill().every((_, i) => board[z][(i + 1) * (boardSize - 1)] === player)) {
      // 副對角線
      if (boardDepth > 1) showThreeWinLine([boardSize-1 - (boardSize-1)/2, 0 - (boardSize-1)/2, z - (boardDepth-1)/2], [0 - (boardSize-1)/2, boardSize-1 - (boardSize-1)/2, z - (boardDepth-1)/2]);
      return true;
    }
  }
  // 檢查跨層直線
  for (let i = 0; i < boardSize * boardSize; i++) {
    if (Array(boardDepth).fill().every((_, z) => board[z][i] === player)) {
      // 跨層直線
      const x = i % boardSize;
      const y = Math.floor(i / boardSize);
      showThreeWinLine([x - (boardSize-1)/2, y - (boardSize-1)/2, 0 - (boardDepth-1)/2], [x - (boardSize-1)/2, y - (boardSize-1)/2, boardDepth-1 - (boardDepth-1)/2]);
      return true;
    }
  }
  // TODO: 3D斜線
  return false;
}

// 有限深度Minimax for 2D
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
  if (isRoot) {
    return moves[bestMove];
  } else {
    return moves[bestMove];
  }
}

// 有限深度Minimax for 3D
function minimaxLimited3D(newBoard, player, depth, isRoot) {
  // newBoard: [z][i]
  const availSpots = [];
  for (let z = 0; z < boardDepth; z++) {
    for (let i = 0; i < boardSize * boardSize; i++) {
      if (newBoard[z][i] === '') availSpots.push({z, index: i});
    }
  }
  if (checkWinForMinimax3D(newBoard, playerMark)) {
    return { score: -10 };
  } else if (checkWinForMinimax3D(newBoard, aiMark)) {
    return { score: 10 };
  } else if (availSpots.length === 0 || depth === 0) {
    return { score: 0 };
  }
  const moves = [];
  for (let k = 0; k < availSpots.length; k++) {
    const {z, index} = availSpots[k];
    const move = { z, index };
    newBoard[z][index] = player;
    if (player === aiMark) {
      const result = minimaxLimited3D(newBoard, playerMark, depth - 1, false);
      move.score = result.score;
    } else {
      const result = minimaxLimited3D(newBoard, aiMark, depth - 1, false);
      move.score = result.score;
    }
    newBoard[z][index] = '';
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
  if (isRoot) {
    return moves[bestMove];
  } else {
    return moves[bestMove];
  }
}

function findWinningMove3D(mark) {
  for (let z = 0; z < boardDepth; z++) {
    for (let i = 0; i < boardSize * boardSize; i++) {
      if (board[z][i] === '') {
        board[z][i] = mark;
        if (checkWin3D(mark)) {
          board[z][i] = '';
          return {z, index: i};
        }
        board[z][i] = '';
      }
    }
  }
  return null;
}

function checkWinForMinimax3D(bd, player) {
  // 檢查每層2D
  for (let z = 0; z < boardDepth; z++) {
    for (let i = 0; i < boardSize; i++) {
      if (Array(boardSize).fill().every((_, j) => bd[z][i * boardSize + j] === player)) return true;
      if (Array(boardSize).fill().every((_, j) => bd[z][j * boardSize + i] === player)) return true;
    }
    if (Array(boardSize).fill().every((_, i) => bd[z][i * (boardSize + 1)] === player)) return true;
    if (Array(boardSize).fill().every((_, i) => bd[z][(i + 1) * (boardSize - 1)] === player)) return true;
  }
  // 檢查跨層直線
  for (let i = 0; i < boardSize * boardSize; i++) {
    if (Array(boardDepth).fill().every((_, z) => bd[z][i] === player)) return true;
  }
  return false;
}

function showSVG3DBoard() {
  document.getElementById('game-board').style.display = 'none';
  const svg3d = document.getElementById('svg3d-container');
  svg3d.style.display = 'block';
  svg3d.style.width = '100%';
  svg3d.style.height = '100%';
  document.getElementById('svg3d-controls').style.display = 'flex';
  renderSVG3DBoard();
}

function hideSVG3DBoard() {
  document.getElementById('game-board').style.display = '';
  const svg3d = document.getElementById('svg3d-container');
  svg3d.style.display = 'none';
  document.getElementById('svg3d-controls').style.display = 'none';
}

function renderSVG3DBoard() {
  const container = document.getElementById('svg3d-container');
  const size = Math.min(container.offsetWidth, container.offsetHeight) || 400;
  const pad = 30;
  const cell = (size - 2 * pad) / boardSize;
  const layerGap = 30;
  const offsetX = 24;
  const offsetY = 18;
  const svgNS = 'http://www.w3.org/2000/svg';
  container.innerHTML = '';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('width', size + boardDepth * offsetX);
  svg.setAttribute('height', size + boardDepth * offsetY);
  svg.style.display = 'block';
  svg.style.margin = '0 auto';
  // 主group加transform
  const mainG = document.createElementNS(svgNS, 'g');
  mainG.setAttribute('transform', `rotateX(${svg3dTransform.rx}) rotateY(${svg3dTransform.ry}) translate(${svg3dTransform.tx},${svg3dTransform.ty})`);
  for (let z = 0; z < boardDepth; z++) {
    const g = document.createElementNS(svgNS, 'g');
    const tx = z * offsetX;
    const ty = -z * offsetY;
    g.setAttribute('transform', `skewX(-30) scale(1,0.7) translate(${tx},${ty})`);
    for (let y = 0; y < boardSize; y++) {
      for (let x = 0; x < boardSize; x++) {
        const rect = document.createElementNS(svgNS, 'rect');
        rect.setAttribute('x', pad + x * cell);
        rect.setAttribute('y', pad + y * cell);
        rect.setAttribute('width', cell - 4);
        rect.setAttribute('height', cell - 4);
        rect.setAttribute('rx', 10);
        rect.setAttribute('ry', 10);
        rect.setAttribute('fill', '#bfd7ed');
        rect.setAttribute('stroke', '#4a6fa5');
        rect.setAttribute('stroke-width', 2);
        rect.setAttribute('fill-opacity', 0.6);
        rect.style.cursor = 'pointer';
        rect.addEventListener('click', () => handleMove3D(z, y * boardSize + x));
        g.appendChild(rect);
        // 棋子用O/X文字
        if (board[z][y * boardSize + x] === 'O' || board[z][y * boardSize + x] === 'X') {
          const text = document.createElementNS(svgNS, 'text');
          text.setAttribute('x', pad + x * cell + cell / 2);
          text.setAttribute('y', pad + y * cell + cell / 2 + 12);
          text.setAttribute('text-anchor', 'middle');
          text.setAttribute('font-size', `${cell * 0.7}px`);
          text.setAttribute('font-family', 'Segoe UI, Arial, sans-serif');
          text.setAttribute('font-weight', 'bold');
          text.setAttribute('fill', board[z][y * boardSize + x] === 'O' ? '#1976d2' : '#d32f2f');
          text.textContent = board[z][y * boardSize + x];
          g.appendChild(text);
        }
      }
    }
    const label = document.createElementNS(svgNS, 'text');
    label.setAttribute('x', size - pad - 10);
    label.setAttribute('y', pad + 18);
    label.setAttribute('fill', '#4a6fa5');
    label.setAttribute('font-size', '1rem');
    label.textContent = `第${z + 1}層`;
    g.appendChild(label);
    mainG.appendChild(g);
  }
  svg.appendChild(mainG);
  container.appendChild(svg);
}

// 滑桿事件
['rotate-x','rotate-y','trans-x','trans-y'].forEach(id => {
  const el = document.getElementById(id);
  if (el) {
    el.addEventListener('input', () => {
      svg3dTransform.rx = +document.getElementById('rotate-x').value;
      svg3dTransform.ry = +document.getElementById('rotate-y').value;
      svg3dTransform.tx = +document.getElementById('trans-x').value;
      svg3dTransform.ty = +document.getElementById('trans-y').value;
      renderSVG3DBoard();
    });
  }
});

function show3DBoard() {
  console.log('show3DBoard called');
  const container = document.getElementById('threejs-container');
  container.style.display = '';
  document.getElementById('game-board').style.display = 'none';
  if (!threeRenderer) {
    initThreeJS();
  } else {
    threeRenderer.domElement.style.display = '';
    renderThreeBoard();
  }
}

function hide3DBoard() {
  document.getElementById('game-board').style.display = '';
  document.getElementById('threejs-container').style.display = 'none';
  if (threeRenderer) threeRenderer.domElement.style.display = 'none';
  if (threeWinLine) {
    threeScene.remove(threeWinLine);
    threeWinLine = null;
  }
  if (threeWinLineAnim) cancelAnimationFrame(threeWinLineAnim);
}

function initThreeJS() {
  console.log('initThreeJS called');
  const container = document.getElementById('threejs-container');
  threeScene = new THREE.Scene();
  threeCamera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
  threeCamera.position.set(0, 0, 18);
  threeRenderer = new THREE.WebGLRenderer({ antialias: true });
  threeRenderer.setSize(400, 400);
  container.appendChild(threeRenderer.domElement);
  // 用THREE.OrbitControls（舊版）
  threeControls = new THREE.OrbitControls(threeCamera, threeRenderer.domElement);
  threeControls.enableDamping = true;
  threeControls.dampingFactor = 0.1;
  threeControls.enablePan = false;
  threeControls.minDistance = 10;
  threeControls.maxDistance = 40;
  // 光源
  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(10, 10, 20);
  threeScene.add(light);
  threeScene.add(new THREE.AmbientLight(0xffffff, 0.5));
  renderThreeBoard();
  animateThree();
}

function renderThreeBoard() {
  console.log('renderThreeBoard called');
  if (!threeScene) return;
  while (threeScene.children.length > 2) threeScene.remove(threeScene.children[2]);
  threeCubes = [];
  threeSpheres = [];
  const offset = (boardSize - 1) / 2;
  for (let z = 0; z < boardDepth; z++) {
    for (let y = 0; y < boardSize; y++) {
      for (let x = 0; x < boardSize; x++) {
        const cubeGeo = new THREE.BoxGeometry(0.9, 0.9, 0.9);
        const cubeMat = new THREE.MeshPhongMaterial({ color: 0xbfd7ed });
        const cube = new THREE.Mesh(cubeGeo, cubeMat);
        cube.position.set(x - offset, y - offset, z - offset);
        cube.userData = { z, idx: y * boardSize + x };
        cube.cursor = 'pointer';
        threeScene.add(cube);
        threeCubes.push(cube);
        // 棋子
        if (board[z][y * boardSize + x] === 'O') {
          const sphereGeo = new THREE.SphereGeometry(0.35, 32, 32);
          const sphereMat = new THREE.MeshPhongMaterial({ color: 0xffffff });
          const sphere = new THREE.Mesh(sphereGeo, sphereMat);
          sphere.position.set(x - offset, y - offset, z - offset);
          threeScene.add(sphere);
          threeSpheres.push(sphere);
        } else if (board[z][y * boardSize + x] === 'X') {
          const sphereGeo = new THREE.SphereGeometry(0.35, 32, 32);
          const sphereMat = new THREE.MeshPhongMaterial({ color: 0x222222 });
          const sphere = new THREE.Mesh(sphereGeo, sphereMat);
          sphere.position.set(x - offset, y - offset, z - offset);
          threeScene.add(sphere);
          threeSpheres.push(sphere);
        }
      }
    }
  }
}

function animateThree() {
  requestAnimationFrame(animateThree);
  if (threeControls) threeControls.update();
  if (threeRenderer && threeScene && threeCamera) threeRenderer.render(threeScene, threeCamera);
}

// 3D棋盤互動
function onThreeClick(event) {
  if (gameOver) return;
  if (mode === 'pve' && currentPlayer !== playerMark) return;
  const rect = threeRenderer.domElement.getBoundingClientRect();
  const mouse = new THREE.Vector2(
    ((event.clientX - rect.left) / rect.width) * 2 - 1,
    -((event.clientY - rect.top) / rect.height) * 2 + 1
  );
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, threeCamera);
  const intersects = raycaster.intersectObjects(threeCubes);
  if (intersects.length > 0) {
    const { z, idx } = intersects[0].object.userData;
    handleMove3D(z, idx);
  }
}

function updateControlsDisplay() {
  if (modeSelect.value === 'pve') {
    firstPlayerLabel.hidden = false;
    difficultyLabel.hidden = false;
  } else {
    firstPlayerLabel.hidden = true;
    difficultyLabel.hidden = true;
  }
}

modeSelect.addEventListener('change', () => {
  updateControlsDisplay();
  realInitBoard();
});

firstPlayerSelect.addEventListener('change', realInitBoard);
difficultySelect.addEventListener('change', () => {
  difficulty = difficultySelect.value;
  realInitBoard();
});

boardTypeSelect.addEventListener('change', () => {
  // 只重繪棋盤，不動控制列
  realInitBoard();
});

restartBtn.addEventListener('click', realInitBoard);

window.addEventListener('DOMContentLoaded', () => {
  updateControlsDisplay();
  realInitBoard();
});

function showThreeJSCube() {
  document.getElementById('game-board').style.display = 'none';
  document.getElementById('svg3d-container').style.display = 'none';
  document.getElementById('svg3d-controls').style.display = 'none';
  const cubeDiv = document.getElementById('threejs-cube');
  cubeDiv.style.display = 'block';
  if (!threeCubeRenderer) {
    initThreeJSCube();
  } else {
    threeCubeRenderer.domElement.style.display = '';
    renderThreeJSCube();
  }
}

function hideThreeJSCube() {
  document.getElementById('threejs-cube').style.display = 'none';
  if (threeCubeRenderer) threeCubeRenderer.domElement.style.display = 'none';
}

function initThreeJSCube() {
  const container = document.getElementById('threejs-cube');
  threeCubeScene = new THREE.Scene();
  threeCubeCamera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
  threeCubeCamera.position.set(6, 6, 6); // 骰子視角
  threeCubeRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  threeCubeRenderer.setSize(container.offsetWidth, container.offsetHeight);
  container.appendChild(threeCubeRenderer.domElement);
  threeCubeControls = new THREE.OrbitControls(threeCubeCamera, threeCubeRenderer.domElement);
  threeCubeControls.enableDamping = true;
  threeCubeControls.dampingFactor = 0.1;
  threeCubeControls.enablePan = false;
  threeCubeControls.minDistance = 5;
  threeCubeControls.maxDistance = 20;
  threeCubeControls.target.set((boardSize-1)/2, (boardSize-1)/2, (boardSize-1)/2);
  
  // 滑鼠閒置檢測
  const canvas = threeCubeRenderer.domElement;
  canvas.addEventListener('mousemove', resetMouseIdleTimer);
  canvas.addEventListener('mousedown', resetMouseIdleTimer);
  canvas.addEventListener('wheel', resetMouseIdleTimer);
  
  // 光源
  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(10, 10, 20);
  threeCubeScene.add(light);
  threeCubeScene.add(new THREE.AmbientLight(0xffffff, 0.5));
  renderThreeJSCube();
  animateThreeJSCube();
}

function renderThreeJSCube() {
  // 清空舊物件
  if (threeCubeGroup) threeCubeScene.remove(threeCubeGroup);
  threeCubeGroup = new THREE.Group();
  threeCubeCells = [];
  
  // 清除勝利連線
  if (winLine) {
    threeCubeScene.remove(winLine);
    winLine = null;
  }
  if (winLineAnimation) {
    cancelAnimationFrame(winLineAnimation);
    winLineAnimation = null;
  }
  
  // 取得目前選取的Z層
  const activeButton = document.querySelector('.z-button.active');
  const currentZ = parseInt(activeButton?.dataset.z || 0);
  // 建立K*K*K格子
  for (let z = 0; z < boardDepth; z++) {
    for (let y = 0; y < boardSize; y++) {
      for (let x = 0; x < boardSize; x++) {
        const geometry = new THREE.BoxGeometry(0.9, 0.9, 0.9);
        // 目前選取的Z層用紅色邊框，整體更透明
        const material = new THREE.MeshPhongMaterial({ 
          color: 0xbfd7ed, 
          transparent: true, 
          opacity: 0.15,
          ...(z === currentZ && { color: 0xffcccc, opacity: 0.3 })
        });
        const cell = new THREE.Mesh(geometry, material);
        cell.position.set(x, y, z);
        cell.userData = { x, y, z };
        cell.cursor = 'pointer';
        threeCubeGroup.add(cell);
        threeCubeCells.push(cell);
        // 立體棋子
        const mark = board[z][y * boardSize + x];
        if (mark === 'O') {
          // 立體O: 白色圓環
          const torusGeo = new THREE.TorusGeometry(0.32, 0.08, 16, 32);
          const torusMat = new THREE.MeshPhongMaterial({ color: 0xffffff });
          const torus = new THREE.Mesh(torusGeo, torusMat);
          torus.position.set(x, y, z);
          threeCubeGroup.add(torus);
        } else if (mark === 'X') {
          // 立體X: 兩根交叉圓柱
          const cylGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.6, 16);
          const cylMat = new THREE.MeshPhongMaterial({ color: 0x222222 });
          const cyl1 = new THREE.Mesh(cylGeo, cylMat);
          const cyl2 = new THREE.Mesh(cylGeo, cylMat);
          cyl1.position.set(x, y, z);
          cyl2.position.set(x, y, z);
          cyl1.rotation.z = Math.PI / 4;
          cyl2.rotation.z = -Math.PI / 4;
          threeCubeGroup.add(cyl1);
          threeCubeGroup.add(cyl2);
        }
      }
    }
  }
  threeCubeScene.add(threeCubeGroup);
}

function animateThreeJSCube() {
  requestAnimationFrame(animateThreeJSCube);
  if (threeCubeControls) threeCubeControls.update();
  if (threeCubeRenderer && threeCubeScene && threeCubeCamera) threeCubeRenderer.render(threeCubeScene, threeCubeCamera);
}

// 初始化Z層按鈕組
function updateZLayerSelect() {
  const zButtons = document.querySelector('.z-buttons');
  zButtons.innerHTML = '';
  for (let z = 0; z < boardDepth; z++) {
    const btn = document.createElement('button');
    btn.className = 'z-button';
    btn.textContent = z + 1;
    btn.dataset.z = z;
    if (z === 0) btn.classList.add('active');
    btn.addEventListener('click', () => {
      // 移除所有active類別
      document.querySelectorAll('.z-button').forEach(b => b.classList.remove('active'));
      // 加上active類別到點擊的按鈕
      btn.classList.add('active');
      renderSide2DBoard();
      renderThreeJSCube();
    });
    zButtons.appendChild(btn);
  }
}

// 渲染側邊2D平面棋盤
function renderSide2DBoard() {
  const activeButton = document.querySelector('.z-button.active');
  const z = parseInt(activeButton?.dataset.z || 0);
  const sideBoard = document.getElementById('side-2d-board');
  sideBoard.innerHTML = '';
  sideBoard.setAttribute('data-size', boardSize);
  for (let y = boardSize - 1; y >= 0; y--) {
    for (let x = 0; x < boardSize; x++) {
      const idx = y * boardSize + x;
      const cell = document.createElement('div');
      cell.className = 'side-2d-cell';
      cell.textContent = board[z][idx];
      cell.addEventListener('click', () => {
        if (gameOver || board[z][idx]) return;
        if (mode === 'pve' && currentPlayer !== playerMark) return;
        board[z][idx] = currentPlayer;
        renderThreeJSCube();
        renderSide2DBoard();
        if (checkWin3DWithAnimation(currentPlayer)) {
          statusDiv.textContent = `${currentPlayer} 勝利！`;
          gameOver = true;
        } else if (board.flat().every(cell => cell)) {
          statusDiv.textContent = '平手！';
          gameOver = true;
        } else {
          currentPlayer = currentPlayer === 'O' ? 'X' : 'O';
          updateStatus();
          if (mode === 'pve' && !gameOver && currentPlayer === aiMark) {
            setTimeout(aiMove, 3000);
          }
        }
      });
      sideBoard.appendChild(cell);
    }
  }
}

// 重置滑鼠閒置計時器
function resetMouseIdleTimer() {
  if (mouseIdleTimer) {
    clearTimeout(mouseIdleTimer);
  }
  if (isMouseIdle) {
    isMouseIdle = false;
  }
  mouseIdleTimer = setTimeout(() => {
    isMouseIdle = true;
    rotateToFrontView();
  }, mouseIdleTimeout);
}

// 旋轉到初始視角（骰子視角）
function rotateToFrontView() {
  if (!threeCubeControls || !isMouseIdle) return;
  
  // 計算初始視角的位置（骰子視角）
  const targetPosition = {
    x: 6,
    y: 6,
    z: 6
  };
  
  // 平滑動畫到初始視角
  const duration = 500; // 0.5秒動畫
  const startPosition = {
    x: threeCubeCamera.position.x,
    y: threeCubeCamera.position.y,
    z: threeCubeCamera.position.z
  };
  
  const startTime = Date.now();
  
  function animateCamera() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // 使用easeInOutQuad緩動函數
    const easeProgress = progress < 0.5 
      ? 2 * progress * progress 
      : 1 - Math.pow(-2 * progress + 2, 2) / 2;
    
    threeCubeCamera.position.x = startPosition.x + (targetPosition.x - startPosition.x) * easeProgress;
    threeCubeCamera.position.y = startPosition.y + (targetPosition.y - startPosition.y) * easeProgress;
    threeCubeCamera.position.z = startPosition.z + (targetPosition.z - startPosition.z) * easeProgress;
    
    if (progress < 1) {
      requestAnimationFrame(animateCamera);
    }
  }
  
  animateCamera();
}

// 顯示3D勝利連線動畫（高亮格子+粗線動畫）
function show3DWinLine(start, end, winner, winCells) {
  if (winLine) {
    threeCubeScene.remove(winLine);
    winLine = null;
  }
  if (winLineAnimation) {
    cancelAnimationFrame(winLineAnimation);
  }
  // 1. 高亮勝利格子
  if (winCells && Array.isArray(winCells)) {
    for (const {x, y, z} of winCells) {
      // 找到對應cell
      const cell = threeCubeCells.find(c => c.position.x === x && c.position.y === y && c.position.z === z);
      if (cell) {
        cell.material.color.set(0xffe066); // 高亮黃色
        cell.material.opacity = 0.7;
      }
    }
  }
  // 2. 粗紅線動畫
  const material = new THREE.LineBasicMaterial({ 
    color: 0xff3333, 
    linewidth: 360 
  });
  const points = [
    new THREE.Vector3(start.x, start.y, start.z),
    new THREE.Vector3(start.x, start.y, start.z)
  ];
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  winLine = new THREE.Line(geometry, material);
  threeCubeScene.add(winLine);
  const startTime = Date.now();
  const duration = 1500;
  function animateWinLine() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easeProgress = 1 - Math.pow(1 - progress, 4);
    const currentX = start.x + (end.x - start.x) * easeProgress;
    const currentY = start.y + (end.y - start.y) * easeProgress;
    const currentZ = start.z + (end.z - start.z) * easeProgress;
    winLine.geometry.setFromPoints([
      new THREE.Vector3(start.x, start.y, start.z),
      new THREE.Vector3(currentX, currentY, currentZ)
    ]);
    if (progress < 1) {
      winLineAnimation = requestAnimationFrame(animateWinLine);
    } else {
      showWinMessage(winner);
    }
  }
  animateWinLine();
}

// 顯示獲勝訊息
function showWinMessage(winner) {
  // 建立3D文字顯示獲勝者
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = 512;
  canvas.height = 128;
  
  context.fillStyle = '#4a6fa5';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#ffffff';
  context.font = 'bold 48px Arial';
  context.textAlign = 'center';
  context.fillText(`${winner} 獲勝！`, canvas.width / 2, canvas.height / 2 + 16);
  
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.MeshBasicMaterial({ 
    map: texture, 
    transparent: true, 
    opacity: 0.9 
  });
  const geometry = new THREE.PlaneGeometry(8, 2);
  const winText = new THREE.Mesh(geometry, material);
  winText.position.set((boardSize - 1) / 2, (boardSize - 1) / 2, (boardSize - 1) / 2 + 2);
  threeCubeScene.add(winText);
  
  // 3秒後移除獲勝訊息
  setTimeout(() => {
    threeCubeScene.remove(winText);
  }, 3000);
}

// 檢查3D勝利並顯示動畫（涵蓋所有3D連線）
function checkWin3DWithAnimation(player) {
  // 層內橫線、直線、斜線
  for (let z = 0; z < boardDepth; z++) {
    // 橫線
    for (let y = 0; y < boardSize; y++) {
      if (Array(boardSize).fill().every((_, x) => board[z][y * boardSize + x] === player)) {
        const start = { x: 0, y: y, z: z };
        const end = { x: boardSize - 1, y: y, z: z };
        const winCells = Array(boardSize).fill().map((_, x) => ({x, y, z}));
        show3DWinLine(start, end, player, winCells);
        return true;
      }
    }
    // 直線
    for (let x = 0; x < boardSize; x++) {
      if (Array(boardSize).fill().every((_, y) => board[z][y * boardSize + x] === player)) {
        const start = { x: x, y: 0, z: z };
        const end = { x: x, y: boardSize - 1, z: z };
        const winCells = Array(boardSize).fill().map((_, y) => ({x, y, z}));
        show3DWinLine(start, end, player, winCells);
        return true;
      }
    }
    // 主對角線
    if (Array(boardSize).fill().every((_, i) => board[z][i * (boardSize + 1)] === player)) {
      const start = { x: 0, y: 0, z: z };
      const end = { x: boardSize - 1, y: boardSize - 1, z: z };
      const winCells = Array(boardSize).fill().map((_, i) => ({x: i, y: i, z: z}));
      show3DWinLine(start, end, player, winCells);
      return true;
    }
    // 副對角線
    if (Array(boardSize).fill().every((_, i) => board[z][(i + 1) * (boardSize - 1)] === player)) {
      const start = { x: boardSize - 1, y: 0, z: z };
      const end = { x: 0, y: boardSize - 1, z: z };
      const winCells = Array(boardSize).fill().map((_, i) => ({x: boardSize - 1 - i, y: i, z: z}));
      show3DWinLine(start, end, player, winCells);
      return true;
    }
  }
  // x軸直線（固定y,z）
  for (let y = 0; y < boardSize; y++) {
    for (let z = 0; z < boardDepth; z++) {
      if (Array(boardSize).fill().every((_, x) => board[z][y * boardSize + x] === player)) {
        const start = { x: 0, y: y, z: z };
        const end = { x: boardSize - 1, y: y, z: z };
        const winCells = Array(boardSize).fill().map((_, x) => ({x, y, z}));
        show3DWinLine(start, end, player, winCells);
        return true;
      }
    }
  }
  // y軸直線（固定x,z）
  for (let x = 0; x < boardSize; x++) {
    for (let z = 0; z < boardDepth; z++) {
      if (Array(boardSize).fill().every((_, y) => board[z][y * boardSize + x] === player)) {
        const start = { x: x, y: 0, z: z };
        const end = { x: x, y: boardSize - 1, z: z };
        const winCells = Array(boardSize).fill().map((_, y) => ({x, y, z}));
        show3DWinLine(start, end, player, winCells);
        return true;
      }
    }
  }
  // z軸直線（固定x,y）
  for (let x = 0; x < boardSize; x++) {
    for (let y = 0; y < boardSize; y++) {
      if (Array(boardDepth).fill().every((_, z) => board[z][y * boardSize + x] === player)) {
        const start = { x: x, y: y, z: 0 };
        const end = { x: x, y: y, z: boardDepth - 1 };
        const winCells = Array(boardDepth).fill().map((_, z) => ({x, y, z}));
        show3DWinLine(start, end, player, winCells);
        return true;
      }
    }
  }
  // 3D主對角線
  if (Array(boardSize).fill().every((_, i) => board[i][i * boardSize + i] === player)) {
    const start = { x: 0, y: 0, z: 0 };
    const end = { x: boardSize - 1, y: boardSize - 1, z: boardDepth - 1 };
    const winCells = Array(boardSize).fill().map((_, i) => ({x: i, y: i, z: i}));
    show3DWinLine(start, end, player, winCells);
    return true;
  }
  if (Array(boardSize).fill().every((_, i) => board[i][i * boardSize + (boardSize - 1 - i)] === player)) {
    const start = { x: boardSize - 1, y: 0, z: 0 };
    const end = { x: 0, y: boardSize - 1, z: boardDepth - 1 };
    const winCells = Array(boardSize).fill().map((_, i) => ({x: boardSize - 1 - i, y: i, z: i}));
    show3DWinLine(start, end, player, winCells);
    return true;
  }
  if (Array(boardSize).fill().every((_, i) => board[i][(boardSize - 1 - i) * boardSize + i] === player)) {
    const start = { x: 0, y: boardSize - 1, z: 0 };
    const end = { x: boardSize - 1, y: 0, z: boardDepth - 1 };
    const winCells = Array(boardSize).fill().map((_, i) => ({x: i, y: boardSize - 1 - i, z: i}));
    show3DWinLine(start, end, player, winCells);
    return true;
  }
  if (Array(boardSize).fill().every((_, i) => board[i][(boardSize - 1 - i) * boardSize + (boardSize - 1 - i)] === player)) {
    const start = { x: boardSize - 1, y: boardSize - 1, z: 0 };
    const end = { x: 0, y: 0, z: boardDepth - 1 };
    const winCells = Array(boardSize).fill().map((_, i) => ({x: boardSize - 1 - i, y: boardSize - 1 - i, z: i}));
    show3DWinLine(start, end, player, winCells);
    return true;
  }
  return false;
} 