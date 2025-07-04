// 生命遊戲 Canvas 版，支援手機/桌機拖曳、縮放、設置
const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const size = 100; // 棋盤格數
let cellSize = 10; // 每格像素
let offsetX = 0, offsetY = 0, scale = 1;
let dragging = false, lastX, lastY, pinchDist0 = null;
let setupMode = false;
let board = Array.from({length: size}, () => Array(size).fill(0));

function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.parentElement.clientWidth;
  const h = canvas.parentElement.clientHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
  ctx.setTransform(1,0,0,1,0,0);
  ctx.scale(dpr, dpr);
}
window.addEventListener('resize', () => { resizeCanvas(); draw(); });
resizeCanvas();

function draw() {
  resizeCanvas();
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.save();
  ctx.translate(offsetX, offsetY);
  ctx.scale(scale, scale);
  // 畫格線
  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
  ctx.lineWidth = 1;
  for(let i=0;i<=size;i++){
    ctx.beginPath(); ctx.moveTo(0,i*cellSize); ctx.lineTo(size*cellSize,i*cellSize); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(i*cellSize,0); ctx.lineTo(i*cellSize,size*cellSize); ctx.stroke();
  }
  // 畫細胞
  for(let y=0;y<size;y++) for(let x=0;x<size;x++) if(board[y][x]){
    ctx.beginPath();
    ctx.arc(x*cellSize+cellSize/2, y*cellSize+cellSize/2, cellSize*0.45, 0, 2*Math.PI);
    ctx.fillStyle = '#fff';
    ctx.shadowColor = '#fff8';
    ctx.shadowBlur = 2;
    ctx.fill();
    ctx.shadowBlur = 0;
  }
  ctx.restore();
}

function screenToCell(px, py) {
  // 轉換螢幕座標到格子座標
  const rect = canvas.getBoundingClientRect();
  const x = (px - rect.left - offsetX) / scale;
  const y = (py - rect.top - offsetY) / scale;
  return [Math.floor(x/cellSize), Math.floor(y/cellSize)];
}

// 滑鼠拖曳/縮放/設置
canvas.addEventListener('mousedown', e => {
  if (setupMode) {
    const [cx, cy] = screenToCell(e.clientX, e.clientY);
    if (cx>=0 && cx<size && cy>=0 && cy<size) {
      board[cy][cx] = board[cy][cx] ? 0 : 1;
      draw();
    }
    return;
  }
  dragging = true; lastX = e.clientX; lastY = e.clientY;
});
canvas.addEventListener('mousemove', e => {
  if (!dragging || setupMode) return;
  offsetX += e.clientX - lastX;
  offsetY += e.clientY - lastY;
  lastX = e.clientX; lastY = e.clientY;
  draw();
});
canvas.addEventListener('mouseup', ()=>dragging=false);
canvas.addEventListener('mouseleave', ()=>dragging=false);
canvas.addEventListener('wheel', e => {
  if (setupMode) return;
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const mx = (e.clientX - rect.left - offsetX) / scale;
  const my = (e.clientY - rect.top - offsetY) / scale;
  const zoom = e.deltaY < 0 ? 1.1 : 0.9;
  scale *= zoom;
  // 以滑鼠位置為中心縮放
  offsetX -= mx * (zoom-1) * scale;
  offsetY -= my * (zoom-1) * scale;
  draw();
},{passive:false});

// 觸控拖曳/縮放/設置
canvas.addEventListener('touchstart', e => {
  if (e.touches.length === 1) {
    if (setupMode) {
      const [cx, cy] = screenToCell(e.touches[0].clientX, e.touches[0].clientY);
      if (cx>=0 && cx<size && cy>=0 && cy<size) {
        board[cy][cx] = board[cy][cx] ? 0 : 1;
        draw();
      }
      return;
    }
    dragging = true; lastX = e.touches[0].clientX; lastY = e.touches[0].clientY;
  } else if (e.touches.length === 2) {
    dragging = false;
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    pinchDist0 = Math.hypot(dx, dy);
  }
});
canvas.addEventListener('touchmove', e => {
  if (e.touches.length === 1 && dragging && !setupMode) {
    offsetX += e.touches[0].clientX - lastX;
    offsetY += e.touches[0].clientY - lastY;
    lastX = e.touches[0].clientX; lastY = e.touches[0].clientY;
    draw();
  } else if (e.touches.length === 2) {
    // 雙指縮放
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    const pinchDist = Math.hypot(dx, dy);
    if (pinchDist0) {
      const zoom = pinchDist / pinchDist0;
      scale *= zoom;
      pinchDist0 = pinchDist;
      draw();
    }
  }
  e.preventDefault();
},{passive:false});
canvas.addEventListener('touchend', e => {
  dragging = false; pinchDist0 = null;
});

// 控制列功能
const setupBtn = document.getElementById('setup-btn');
setupBtn.onclick = () => { stopPlay(); setupMode = !setupMode; setupBtn.style.background = setupMode ? '#ff0' : '#fff'; };
const randomBtn = document.getElementById('random-btn');
randomBtn.onclick = () => { stopPlay(); for(let y=0;y<size;y++) for(let x=0;x<size;x++) board[y][x] = Math.random()<0.2?1:0; draw(); };
const resetBtn = document.getElementById('reset-btn');
resetBtn.onclick = () => { stopPlay(); board = Array.from({length: size}, () => Array(size).fill(0)); offsetX = 0; offsetY = 0; scale = 1;
  document.getElementById('survive-min').value = 2;
  document.getElementById('survive-max').value = 3;
  document.getElementById('born-min').value = 3;
  document.getElementById('born-max').value = 3;
  draw(); };
const evolveBtn = document.getElementById('evolve-btn');
evolveBtn.onclick = () => { stopPlay(); const m = +document.getElementById('survive-min').value; const n = +document.getElementById('survive-max').value; const p = +document.getElementById('born-min').value; const q = +document.getElementById('born-max').value; board = evolve(board, m, n, p, q); draw(); };
function evolve(b, m, n, p, q) {
  const next = Array.from({length: size}, () => Array(size).fill(0));
  for(let y=0;y<size;y++) for(let x=0;x<size;x++){
    let cnt=0;
    for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++)
      if((dx||dy)&&b[y+dy]?.[x+dx])cnt++;
    if(b[y][x]) next[y][x]=(cnt>=m&&cnt<=n)?1:0;
    else next[y][x]=(cnt>=p&&cnt<=q)?1:0;
  }
  return next;
}
// 控制列收合/展開
const controlBar = document.getElementById('control-bar');
const expandBarBtn = document.getElementById('expand-bar-btn');
function updateBarDisplay() {
  if (controlBar.classList.contains('collapsed')) {
    expandBarBtn.style.display = 'flex';
  } else {
    expandBarBtn.style.display = 'none';
  }
}
document.getElementById('toggle-bar').onclick = () => {
  controlBar.classList.toggle('collapsed');
  updateBarDisplay();
};
expandBarBtn.onclick = () => {
  controlBar.classList.remove('collapsed');
  updateBarDisplay();
};
updateBarDisplay();
draw(); // 只初始化畫面，不呼叫 resetBtn.onclick()

const playBtn = document.getElementById('play-btn');
let playing = false, playTimer = null, playCount = 0;
playBtn.onclick = () => {
  if (playing) {
    stopPlay();
  } else {
    startPlay();
  }
};
function startPlay() {
  playing = true;
  playCount = 0;
  playBtn.textContent = '■';
  playBtn.style.background = '#ff0';
  playTimer = setInterval(() => {
    if (playCount >= 100) { stopPlay(); return; }
    const m = +document.getElementById('survive-min').value;
    const n = +document.getElementById('survive-max').value;
    const p = +document.getElementById('born-min').value;
    const q = +document.getElementById('born-max').value;
    board = evolve(board, m, n, p, q);
    draw();
    playCount++;
  }, 500);
}
function stopPlay() {
  playing = false;
  playBtn.textContent = '▶';
  playBtn.style.background = '';
  clearInterval(playTimer);
}
