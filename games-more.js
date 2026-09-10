(function () {
  function getBal() { return parseInt(localStorage.getItem('casino_balance') || '0', 10); }
  function setBal(v) {
    localStorage.setItem('casino_balance', v);
    const el = document.getElementById('balance');
    if (el) el.textContent = v;
  }
  function addWager(n) {
    const w = parseInt(localStorage.getItem('casino_wagered') || '0', 10) + n;
    localStorage.setItem('casino_wagered', w);
  }
  function requireUser() {
    if (!localStorage.getItem('casino_user')) {
      const m = document.getElementById('login-modal');
      if (m) m.classList.add('open');
      return false;
    }
    return true;
  }
  function houseWin() {
    let pity = parseInt(localStorage.getItem('casino_loss_streak') || '0', 10);
    if (pity >= 4) { localStorage.setItem('casino_loss_streak', '0'); return false; }
    return Math.random() >= 0.48;
  }
  function clampBet(val) {
    const bal = getBal();
    return Math.max(1, Math.min(bal, Math.max(1, parseInt(val, 10) || 1)));
  }
  function noteLoss() {
    let s = parseInt(localStorage.getItem('casino_loss_streak') || '0', 10) + 1;
    localStorage.setItem('casino_loss_streak', s);
  }
  function noteWin() { localStorage.setItem('casino_loss_streak', '0'); }

  const limboBtn = document.getElementById('limbo-play');
  if (limboBtn) limboBtn.onclick = () => {
    if (!requireUser()) return;
    const bet = clampBet(document.getElementById('limbo-bet').value);
    const target = Math.max(1.01, parseFloat(document.getElementById('limbo-target').value) || 2);
    let bal = getBal();
    if (bal < bet) { document.getElementById('limbo-result').textContent = 'Not enough credits'; return; }
    bal -= bet; setBal(bal); addWager(bet);
    const r = Math.random();
    let result = Math.max(1, 0.99 / (1 - r * 0.99));
    if (houseWin() && result >= target) result = 1 + Math.random() * (target - 1) * 0.99;
    document.getElementById('limbo-result-mult').textContent = result.toFixed(2) + 'x';
    if (result >= target) {
      const win = Math.floor(bet * target);
      setBal(getBal() + win);
      document.getElementById('limbo-result').textContent = 'WIN +' + win;
      document.getElementById('limbo-result').style.color = '#0f0';
      noteWin();
    } else {
      document.getElementById('limbo-result').textContent = 'LOSE';
      document.getElementById('limbo-result').style.color = '#f55';
      noteLoss();
    }
  };

  let towerActive = false, towerFloor = 0, towerBet = 0, towerDiff = 2;
  const TOWER_ROWS = 8;
  function towerMult(floor, diff) {
    const bombs = Math.min(2, diff);
    const safePer = 3 - bombs;
    let m = 1;
    for (let i = 0; i < floor; i++) m *= 3 / safePer;
    return m * 0.97;
  }
  function buildTower() {
    const g = document.getElementById('tower-grid');
    if (!g) return;
    g.innerHTML = '';
    for (let r = TOWER_ROWS - 1; r >= 0; r--) {
      const row = document.createElement('div');
      row.className = 'tower-row';
      row.dataset.floor = r;
      for (let c = 0; c < 3; c++) {
        const t = document.createElement('button');
        t.className = 'tower-tile';
        t.dataset.col = c;
        t.disabled = true;
        t.onclick = () => pickTower(r, c, t);
        row.appendChild(t);
      }
      g.appendChild(row);
    }
  }
  buildTower();

  const ts = document.getElementById('tower-start');
  if (ts) ts.onclick = () => {
    if (!requireUser()) return;
    towerBet = clampBet(document.getElementById('tower-bet').value);
    towerDiff = parseInt(document.getElementById('tower-diff').value, 10) || 1;
    let bal = getBal();
    if (bal < towerBet) { document.getElementById('tower-result').textContent = 'Not enough credits'; return; }
    bal -= towerBet; setBal(bal); addWager(towerBet);
    towerFloor = 0; towerActive = true;
    buildTower();
    enableTowerRow(0);
    ts.disabled = true;
    document.getElementById('tower-cashout').disabled = false;
    document.getElementById('tower-result').textContent = '';
    document.getElementById('tower-mult').textContent = '1.00';
  };

  function enableTowerRow(floor) {
    document.querySelectorAll('.tower-row').forEach(row => {
      const f = parseInt(row.dataset.floor, 10);
      row.querySelectorAll('.tower-tile').forEach(t => {
        t.disabled = f !== floor;
        if (f === floor) t.classList.add('active-row');
        else t.classList.remove('active-row');
      });
    });
  }

  function pickTower(floor, col, tile) {
    if (!towerActive || floor !== towerFloor) return;
    const bombs = Math.min(2, towerDiff);
    const bombCols = [];
    while (bombCols.length < bombs) {
      const x = Math.floor(Math.random() * 3);
      if (!bombCols.includes(x)) bombCols.push(x);
    }
    if (bombCols.includes(col)) {
      tile.textContent = '💀'; tile.classList.add('boom');
      towerActive = false;
      document.getElementById('tower-result').textContent = 'TRAP — lost ' + towerBet;
      document.getElementById('tower-result').style.color = '#f55';
      ts.disabled = false;
      document.getElementById('tower-cashout').disabled = true;
      noteLoss();
      return;
    }
    tile.textContent = '✅'; tile.classList.add('gem');
    towerFloor++;
    const mult = towerMult(towerFloor, towerDiff);
    document.getElementById('tower-mult').textContent = mult.toFixed(2);
    if (towerFloor >= TOWER_ROWS) document.getElementById('tower-cashout').click();
    else enableTowerRow(towerFloor);
  }

  const tco = document.getElementById('tower-cashout');
  if (tco) tco.onclick = () => {
    if (!towerActive || towerFloor === 0) return;
    const mult = towerMult(towerFloor, towerDiff);
    const win = Math.floor(towerBet * mult);
    setBal(getBal() + win);
    document.getElementById('tower-result').textContent = 'Cashed +' + win + ' (' + mult.toFixed(2) + 'x)';
    document.getElementById('tower-result').style.color = '#0f0';
    towerActive = false;
    ts.disabled = false; tco.disabled = true;
    noteWin();
  };

  let hiloCard = 0, hiloBet = 0, hiloActive = false;
  function cardLabel(n) {
    return ['','A','2','3','4','5','6','7','8','9','10','J','Q','K'][n] || n;
  }
  function drawHiloCard() { return 1 + Math.floor(Math.random() * 13); }

  const hs = document.getElementById('hilo-start');
  if (hs) hs.onclick = () => {
    if (!requireUser()) return;
    hiloBet = clampBet(document.getElementById('hilo-bet').value);
    let bal = getBal();
    if (bal < hiloBet) { document.getElementById('hilo-result').textContent = 'Not enough credits'; return; }
    bal -= hiloBet; setBal(bal); addWager(hiloBet);
    hiloCard = drawHiloCard();
    hiloActive = true;
    document.getElementById('hilo-card').textContent = cardLabel(hiloCard);
    document.getElementById('hilo-result').textContent = '';
    document.getElementById('hilo-higher').disabled = false;
    document.getElementById('hilo-lower').disabled = false;
    hs.disabled = true;
  };

  function hiloGuess(higher) {
    if (!hiloActive) return;
    let next = drawHiloCard();
    if (houseWin()) {
      if (higher && hiloCard < 13) next = 1 + Math.floor(Math.random() * hiloCard);
      if (!higher && hiloCard > 1) next = hiloCard + Math.floor(Math.random() * (13 - hiloCard));
    }
    document.getElementById('hilo-card').textContent = cardLabel(next);
    const win = higher ? next > hiloCard : next < hiloCard;
    const push = next === hiloCard;
    if (push) {
      setBal(getBal() + hiloBet);
      document.getElementById('hilo-result').textContent = 'PUSH — bet returned';
      document.getElementById('hilo-result').style.color = '#ffd700';
    } else if (win) {
      const w = Math.floor(hiloBet * 1.9);
      setBal(getBal() + w);
      document.getElementById('hilo-result').textContent = 'WIN +' + w;
      document.getElementById('hilo-result').style.color = '#0f0';
      noteWin();
    } else {
      document.getElementById('hilo-result').textContent = 'LOSE';
      document.getElementById('hilo-result').style.color = '#f55';
      noteLoss();
    }
    hiloActive = false;
    document.getElementById('hilo-higher').disabled = true;
    document.getElementById('hilo-lower').disabled = true;
    hs.disabled = false;
  }
  const hh = document.getElementById('hilo-higher');
  const hl = document.getElementById('hilo-lower');
  if (hh) hh.onclick = () => hiloGuess(true);
  if (hl) hl.onclick = () => hiloGuess(false);

  const pp = document.getElementById('plinko-play');
  if (pp) pp.onclick = () => {
    if (!requireUser()) return;
    const bet = clampBet(document.getElementById('plinko-bet').value);
    const risk = document.getElementById('plinko-risk').value || 'med';
    let bal = getBal();
    if (bal < bet) { document.getElementById('plinko-result').textContent = 'Not enough credits'; return; }
    bal -= bet; setBal(bal); addWager(bet);
    const tables = {
      low:  [0.5, 0.7, 0.9, 1.1, 1.3, 1.5, 1.3, 1.1, 0.9, 0.7, 0.5],
      med:  [0.2, 0.5, 0.8, 1.2, 2.0, 5.0, 2.0, 1.2, 0.8, 0.5, 0.2],
      high: [0.1, 0.3, 0.5, 1.0, 3.0, 10, 3.0, 1.0, 0.5, 0.3, 0.1]
    };
    const buckets = tables[risk] || tables.med;
    let idx = Math.floor(Math.random() * buckets.length);
    if (houseWin() && buckets[idx] >= 2) {
      idx = Math.max(0, Math.min(buckets.length - 1, Math.floor(buckets.length / 2) + (Math.random() < 0.5 ? -2 : 2)));
    }
    const mult = buckets[idx];
    const win = Math.floor(bet * mult);
    setBal(getBal() + win);
    document.getElementById('plinko-slot').textContent = mult + 'x';
    document.getElementById('plinko-result').textContent = (win >= bet ? 'WIN +' : 'got ') + win;
    document.getElementById('plinko-result').style.color = win >= bet ? '#0f0' : '#f55';
    if (win >= bet) noteWin(); else noteLoss();
  };
})();
