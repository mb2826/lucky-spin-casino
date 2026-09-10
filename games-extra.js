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
    /* house wins ~52%; pity forces player win after 4 losses */
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

  const GRID = 25;
  let minesActive = false, minesBombs = [], minesRevealed = [], minesBet = 0, minesCount = 5;

  function minesMult(revealed, bombs) {
    const safe = GRID - bombs;
    if (revealed === 0) return 1;
    let m = 1;
    for (let i = 0; i < revealed; i++) m *= (safe - i) / (GRID - i);
    return Math.max(1.01, (0.97 / m));
  }

  function buildMinesGrid() {
    const g = document.getElementById('mines-grid');
    if (!g) return;
    g.innerHTML = '';
    for (let i = 0; i < GRID; i++) {
      const t = document.createElement('button');
      t.className = 'mine-tile';
      t.dataset.i = i;
      t.onclick = () => revealMine(i, t);
      g.appendChild(t);
    }
  }
  buildMinesGrid();

  function updateMinesUI() {
    const rev = minesRevealed.length;
    const me = document.getElementById('mines-mult');
    const ne = document.getElementById('mines-next');
    if (me) me.textContent = minesMult(rev, minesCount).toFixed(2);
    if (ne) ne.textContent = minesMult(rev + 1, minesCount).toFixed(2);
  }

  const ms = document.getElementById('mines-start');
  if (ms) ms.onclick = () => {
    if (!requireUser()) return;
    minesBet = clampBet(document.getElementById('mines-bet').value);
    minesCount = parseInt(document.getElementById('mines-count').value, 10) || 5;
    let bal = getBal();
    if (bal < minesBet) { document.getElementById('mines-result').textContent = 'Not enough credits'; return; }
    bal -= minesBet; setBal(bal); addWager(minesBet);
    minesBombs = [];
    while (minesBombs.length < minesCount) {
      const x = Math.floor(Math.random() * GRID);
      if (!minesBombs.includes(x)) minesBombs.push(x);
    }
    minesRevealed = [];
    minesActive = true;
    buildMinesGrid();
    ms.disabled = true;
    document.getElementById('mines-cashout').disabled = false;
    document.getElementById('mines-result').textContent = '';
    updateMinesUI();
  };

  function revealMine(i, tile) {
    if (!minesActive || minesRevealed.includes(i)) return;
    if (minesBombs.includes(i)) {
      tile.textContent = '💣'; tile.classList.add('boom');
      minesActive = false;
      document.querySelectorAll('.mine-tile').forEach((t, idx) => {
        if (minesBombs.includes(idx)) { t.textContent = '💣'; t.classList.add('boom'); }
        else if (!minesRevealed.includes(idx)) { t.textContent = '💎'; t.classList.add('gem'); }
      });
      document.getElementById('mines-result').textContent = 'BOOM — lost ' + minesBet;
      document.getElementById('mines-result').style.color = '#f55';
      ms.disabled = false;
      document.getElementById('mines-cashout').disabled = true;
      noteLoss();
      return;
    }
    minesRevealed.push(i);
    tile.textContent = '💎'; tile.classList.add('gem');
    updateMinesUI();
    if (minesRevealed.length >= GRID - minesCount) document.getElementById('mines-cashout').click();
  }

  const mco = document.getElementById('mines-cashout');
  if (mco) mco.onclick = () => {
    if (!minesActive || minesRevealed.length === 0) return;
    const mult = minesMult(minesRevealed.length, minesCount);
    const win = Math.floor(minesBet * mult);
    setBal(getBal() + win);
    document.getElementById('mines-result').textContent = 'Cashed out +' + win + ' (' + mult.toFixed(2) + 'x)';
    document.getElementById('mines-result').style.color = '#0f0';
    minesActive = false;
    ms.disabled = false; mco.disabled = true;
    noteWin();
  };

  let crashRunning = false, crashMult = 1, crashTimer = null, crashBet = 0, crashCashed = false;
  const cp = document.getElementById('crash-play');
  if (cp) cp.onclick = () => {
    if (!requireUser() || crashRunning) return;
    crashBet = clampBet(document.getElementById('crash-bet').value);
    let bal = getBal();
    if (bal < crashBet) { document.getElementById('crash-result').textContent = 'Not enough credits'; return; }
    bal -= crashBet; setBal(bal); addWager(crashBet);
    crashRunning = true; crashCashed = false; crashMult = 1;
    cp.disabled = true;
    document.getElementById('crash-cashout').disabled = false;
    document.getElementById('crash-result').textContent = '';
    let crashAt = houseWin() ? (1 + Math.random() * 1.5) : (1.5 + Math.random() * 8);
    const disp = document.getElementById('crash-display');
    crashTimer = setInterval(() => {
      crashMult += 0.01 + crashMult * 0.012;
      disp.textContent = crashMult.toFixed(2) + 'x';
      disp.style.color = crashMult > 2 ? '#0f0' : '#ffd700';
      if (crashMult >= crashAt) {
        clearInterval(crashTimer);
        crashRunning = false;
        disp.textContent = 'CRASHED @ ' + crashAt.toFixed(2) + 'x';
        disp.style.color = '#f55';
        cp.disabled = false;
        document.getElementById('crash-cashout').disabled = true;
        if (!crashCashed) {
          document.getElementById('crash-result').textContent = 'Crashed — lost ' + crashBet;
          document.getElementById('crash-result').style.color = '#f55';
          noteLoss();
        }
      }
    }, 50);
  };
  const cco = document.getElementById('crash-cashout');
  if (cco) cco.onclick = () => {
    if (!crashRunning || crashCashed) return;
    crashCashed = true;
    const win = Math.floor(crashBet * crashMult);
    setBal(getBal() + win);
    document.getElementById('crash-result').textContent = 'Cashed out +' + win + ' @ ' + crashMult.toFixed(2) + 'x';
    document.getElementById('crash-result').style.color = '#0f0';
    cco.disabled = true;
    noteWin();
  };

  let diceMode = 'under';
  const du = document.getElementById('dice-under');
  const dov = document.getElementById('dice-over');
  if (du) du.onclick = () => { diceMode = 'under'; du.classList.add('selected'); dov.classList.remove('selected'); updateDiceOdds(); };
  if (dov) dov.onclick = () => { diceMode = 'over'; dov.classList.add('selected'); du.classList.remove('selected'); updateDiceOdds(); };
  const dt = document.getElementById('dice-target');
  if (dt) dt.oninput = updateDiceOdds;

  function updateDiceOdds() {
    const t = Math.max(2, Math.min(98, parseInt((document.getElementById('dice-target') || {}).value, 10) || 50));
    const chance = diceMode === 'under' ? t - 1 : 100 - t;
    const payout = 99 / chance;
    const c = document.getElementById('dice-chance');
    const p = document.getElementById('dice-payout');
    if (c) c.textContent = chance;
    if (p) p.textContent = payout.toFixed(2);
  }
  updateDiceOdds();

  const dr = document.getElementById('dice-roll-btn');
  if (dr) dr.onclick = () => {
    if (!requireUser()) return;
    const bet = clampBet(document.getElementById('dice-bet').value);
    const t = Math.max(2, Math.min(98, parseInt(document.getElementById('dice-target').value, 10) || 50));
    let bal = getBal();
    if (bal < bet) { document.getElementById('dice-result').textContent = 'Not enough credits'; return; }
    bal -= bet; setBal(bal); addWager(bet);
    let roll = Math.floor(Math.random() * 100) + 1;
    const wouldWin = diceMode === 'under' ? roll < t : roll > t;
    if (wouldWin && houseWin()) {
      roll = diceMode === 'under' ? Math.min(100, t + Math.floor(Math.random() * (100 - t) || 1)) : Math.max(1, Math.floor(Math.random() * t) || 1);
    }
    document.getElementById('dice-roll').textContent = roll;
    const win = diceMode === 'under' ? roll < t : roll > t;
    const chance = diceMode === 'under' ? t - 1 : 100 - t;
    const payout = 99 / chance;
    if (win) {
      const w = Math.floor(bet * payout);
      setBal(getBal() + w);
      document.getElementById('dice-result').textContent = 'WIN +' + w;
      document.getElementById('dice-result').style.color = '#0f0';
      noteWin();
    } else {
      document.getElementById('dice-result').textContent = 'LOSE';
      document.getElementById('dice-result').style.color = '#f55';
      noteLoss();
    }
  };
})();
