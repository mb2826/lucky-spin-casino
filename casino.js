(function () {
  /* Balanced edge — player ~48%, pity win after 4 losses */
  const PLAYER_WIN_RATE = 0.48;
  let _pityLosses = parseInt(localStorage.getItem('casino_loss_streak') || '0', 10);
  function houseRoll() {
    if (_pityLosses >= 4) { _pityLosses = 0; return true; }
    return Math.random() < PLAYER_WIN_RATE;
  }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  let balance = parseInt(localStorage.getItem('casino_balance') || '1000', 10);
  let user = localStorage.getItem('casino_user') || null;
  let streak = parseInt(localStorage.getItem('casino_streak') || '0', 10);
  let lossStreak = parseInt(localStorage.getItem('casino_loss_streak') || '0', 10);
  let totalWagered = parseInt(localStorage.getItem('casino_wagered') || '0', 10);
  const balEl = document.getElementById('balance');
  const loginBtn = document.getElementById('open-login');
  const streakEl = document.getElementById('streak');
  const streakFire = document.getElementById('streak-fire');

  function updateBalance() {
    balEl.textContent = balance;
    localStorage.setItem('casino_balance', balance);
    if (balance < 50 && user) showDepositNudge();
  }
  function updateStreak() {
    if (streakEl) streakEl.textContent = streak;
    if (streakFire) streakFire.textContent = streak >= 3 ? '🔥'.repeat(Math.min(streak, 5)) : '';
    localStorage.setItem('casino_streak', streak);
    localStorage.setItem('casino_loss_streak', lossStreak);
    localStorage.setItem('casino_wagered', totalWagered);
  }
  updateBalance();
  updateStreak();

  function updateUserUI() {
    if (user) {
      loginBtn.textContent = user;
      loginBtn.style.background = '#222';
      loginBtn.style.color = '#ffd700';
    } else loginBtn.textContent = 'Login';
  }
  updateUserUI();

  const modal = document.getElementById('login-modal');
  if (!user) modal.classList.add('open');

  function showDepositNudge() {
    if (document.getElementById('nudge-overlay')) return;
    const o = document.createElement('div');
    o.id = 'nudge-overlay';
    o.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:300;display:flex;align-items:center;justify-content:center;';
    o.innerHTML = '<div style="background:#161622;border:2px solid #ff2d95;border-radius:18px;padding:2rem;max-width:340px;text-align:center;box-shadow:0 0 40px rgba(255,45,149,0.4)"><div style="font-size:2rem;margin-bottom:0.5rem">⚠️</div><h3 style="color:#ffd700;font-family:Orbitron,sans-serif;margin-bottom:0.6rem">LOW BALANCE</h3><p style="color:#ccc;margin-bottom:1rem;font-size:0.95rem">Top up and get <b style="color:#0f0">+500 FREE</b> credits!</p><button id="nudge-yes" style="width:100%;padding:0.8rem;background:linear-gradient(135deg,#ff2d95,#ff6b00);border:none;border-radius:10px;color:#fff;font-weight:700;cursor:pointer;margin-bottom:0.5rem">CLAIM +500 CREDITS</button><button id="nudge-no" style="width:100%;padding:0.5rem;background:transparent;border:1px solid #444;border-radius:8px;color:#888;cursor:pointer;font-size:0.8rem">Maybe later</button></div>';
    document.body.appendChild(o);
    document.getElementById('nudge-yes').onclick = () => { balance += 500; updateBalance(); o.remove(); flashMsg('+500 CREDITS — KEEP PLAYING!', '#0f0'); };
    document.getElementById('nudge-no').onclick = () => o.remove();
  }

  function showNearMiss(msg) { flashMsg(msg || 'SO CLOSE! One more try...', '#ffd700'); }

  function flashMsg(text, color) {
    let el = document.getElementById('flash-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'flash-toast';
      el.style.cssText = 'position:fixed;top:80px;left:50%;transform:translateX(-50%);z-index:400;padding:0.8rem 1.5rem;border-radius:10px;font-weight:700;font-family:Orbitron,sans-serif;letter-spacing:1px;pointer-events:none;transition:opacity 0.3s;';
      document.body.appendChild(el);
    }
    el.textContent = text;
    el.style.background = color === '#0f0' ? 'rgba(0,40,0,0.95)' : color === '#f55' ? 'rgba(40,0,0,0.95)' : 'rgba(40,30,0,0.95)';
    el.style.color = color;
    el.style.border = '1px solid ' + color;
    el.style.opacity = '1';
    clearTimeout(el._t);
    el._t = setTimeout(() => { el.style.opacity = '0'; }, 2500);
  }

  function afterLoss(bet) {
    lossStreak++;
    _pityLosses = lossStreak;
    streak = 0;
    updateStreak();
    if (lossStreak >= 3 && balance >= bet) {
      setTimeout(() => {
        flashMsg('DOUBLE YOUR BET TO WIN IT BACK!', '#ff6b00');
        document.querySelectorAll('#flip-bet, #slot-bet, #roulette-bet, #bj-bet').forEach(inp => {
          if (inp.offsetParent !== null) {
            const cur = parseInt(inp.value, 10) || bet;
            inp.value = Math.min(balance, cur * 2);
            inp.style.borderColor = '#ff6b00';
            setTimeout(() => { inp.style.borderColor = ''; }, 2000);
          }
        });
      }, 800);
    }
  }

  function afterWin() {
    lossStreak = 0;
    _pityLosses = 0;
    streak++;
    updateStreak();
  }

  document.getElementById('add-credits').onclick = () => {
    if (!user) { modal.classList.add('open'); return; }
    balance += 500; updateBalance();
    flashMsg('+500 CREDITS — GOOD LUCK!', '#0f0');
  };

  document.querySelectorAll('nav a[data-game]').forEach(a => {
    a.onclick = e => {
      e.preventDefault();
      if (!user) { modal.classList.add('open'); return; }
      document.querySelectorAll('.game-panel').forEach(p => p.classList.remove('active'));
      document.getElementById('game-' + a.dataset.game).classList.add('active');
      document.querySelectorAll('nav a[data-game]').forEach(x => x.classList.remove('active'));
      a.classList.add('active');
    };
  });

  document.getElementById('open-login').onclick = e => { e.preventDefault(); modal.classList.add('open'); };
  document.getElementById('close-login').onclick = () => { if (user) modal.classList.remove('open'); };
  modal.onclick = e => { if (e.target === modal && user) modal.classList.remove('open'); };

  document.getElementById('auth-form').onsubmit = e => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const pass = document.getElementById('password').value;
    const uname = document.getElementById('username').value.trim() || email.split('@')[0];
    if (!email || !pass) return;
    user = uname;
    localStorage.setItem('casino_user', user);
    localStorage.setItem('casino_email', email);
    updateUserUI();
    modal.classList.remove('open');
    balance = 2000;
    updateBalance();
    flashMsg('WELCOME BONUS! 2000 credits ready', '#0f0');
  };

  function requireLogin() {
    if (!user) { modal.classList.add('open'); return false; }
    return true;
  }

  /* COIN FLIP */
  let chosenSide = null;
  const coin = document.getElementById('coin');
  const flipBtn = document.getElementById('flip-btn');
  const flipResult = document.getElementById('flip-result');
  const flipBetInput = document.getElementById('flip-bet');

  document.querySelectorAll('.side-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.side-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      chosenSide = btn.dataset.side;
    };
  });
  document.querySelectorAll('.qbet').forEach(btn => {
    btn.onclick = () => {
      const amt = btn.dataset.amt;
      if (amt === 'half') flipBetInput.value = Math.max(1, Math.floor(balance / 2));
      else if (amt === 'max') flipBetInput.value = balance;
      else flipBetInput.value = amt;
    };
  });

  flipBtn.onclick = () => {
    if (!requireLogin()) return;
    if (!chosenSide) { flipResult.textContent = 'Pick HEADS or TAILS'; flipResult.style.color = '#f55'; return; }
    const bet = Math.max(1, parseInt(flipBetInput.value, 10) || 25);
    if (balance < bet) { flipResult.textContent = 'Not enough credits'; flipResult.style.color = '#f55'; showDepositNudge(); return; }
    balance -= bet; totalWagered += bet; updateBalance();
    flipBtn.disabled = true; flipResult.textContent = '';

    const playerWins = houseRoll();
    const resultSide = playerWins ? chosenSide : (chosenSide === 'heads' ? 'tails' : 'heads');
    const baseSpins = 6 * 360;
    const endRot = resultSide === 'heads' ? baseSpins : baseSpins + 180;
    coin.style.setProperty('--end-rot', endRot + 'deg');
    coin.classList.remove('flipping');
    void coin.offsetWidth;
    coin.classList.add('flipping');

    setTimeout(() => {
      coin.classList.remove('flipping');
      coin.style.transform = 'rotateY(' + endRot + 'deg)';
      if (playerWins) {
        const win = bet * 2;
        balance += win;
        afterWin();
        flipResult.textContent = resultSide.toUpperCase() + ' — YOU WIN +' + win;
        flipResult.style.color = '#0f0';
      } else {
        afterLoss(bet);
        flipResult.textContent = resultSide.toUpperCase() + ' — HOUSE WINS';
        flipResult.style.color = '#f55';
        if (Math.random() < 0.3) showNearMiss('IT WAS SO CLOSE...');
      }
      updateBalance();
      flipBtn.disabled = false;
    }, 2300);
  };

  /* SLOTS */
  const symbols = ['🍒', '🍋', '🔔', '⭐', '💎', '7️⃣', '🍀'];
  const reelEls = [document.getElementById('reel1'), document.getElementById('reel2'), document.getElementById('reel3')];
  const spinBtn = document.getElementById('spin-btn');
  const slotResult = document.getElementById('slot-result');

  function forceSlotLose() {
    if (Math.random() < 0.4) {
      const s = pick(symbols);
      const other = pick(symbols.filter(x => x !== s));
      const pos = Math.floor(Math.random() * 3);
      const out = [s, s, s]; out[pos] = other;
      return out;
    }
    let a = pick(symbols), b = pick(symbols), c = pick(symbols);
    while (a === b || b === c || a === c) { b = pick(symbols); c = pick(symbols); }
    return [a, b, c];
  }
  function forceSlotWin() {
    if (Math.random() < 0.25) {
      const s = pick(['7️⃣', '💎', '⭐', '🍀']);
      return [s, s, s];
    }
    const s = pick(symbols);
    const other = pick(symbols.filter(x => x !== s));
    const pos = Math.floor(Math.random() * 3);
    const out = [s, s, s]; out[pos] = other;
    return out;
  }

  spinBtn.onclick = () => {
    if (!requireLogin()) return;
    const bet = Math.max(1, parseInt(document.getElementById('slot-bet').value, 10) || 10);
    if (balance < bet) { slotResult.textContent = 'Not enough credits'; slotResult.style.color = '#f55'; showDepositNudge(); return; }
    balance -= bet; totalWagered += bet; updateBalance();
    spinBtn.disabled = true; slotResult.textContent = '';
    const playerWins = houseRoll();
    const final = playerWins ? forceSlotWin() : forceSlotLose();
    let spins = 0;
    const interval = setInterval(() => {
      reelEls.forEach(r => r.textContent = pick(symbols));
      spins++;
      if (spins > 15) {
        clearInterval(interval);
        reelEls.forEach((r, i) => r.textContent = final[i]);
        let win = 0;
        if (final[0] === final[1] && final[1] === final[2]) {
          win = bet * (final[0] === '7️⃣' ? 50 : final[0] === '💎' ? 25 : 10);
          slotResult.textContent = 'JACKPOT! +' + win; slotResult.style.color = '#0f0'; afterWin();
        } else if (final[0] === final[1] || final[1] === final[2] || final[0] === final[2]) {
          if (playerWins) {
            win = bet * 2; slotResult.textContent = 'Pair! +' + win; slotResult.style.color = '#ffd700'; afterWin();
          } else {
            slotResult.textContent = 'SO CLOSE — 2 matching!'; slotResult.style.color = '#ff6b00';
            afterLoss(bet); showNearMiss('Almost... spin again!');
          }
        } else {
          slotResult.textContent = 'No win'; slotResult.style.color = '#aaa'; afterLoss(bet);
        }
        balance += win; updateBalance(); spinBtn.disabled = false;
      }
    }, 80);
  };

  /* ROULETTE */
  let selectedBet = null;
  document.querySelectorAll('.bet-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.bet-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedBet = btn.dataset.bet;
    };
  });
  const redNums = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
  const blackNums = [2,4,6,8,10,11,13,15,17,20,22,24,26,28,29,31,33,35];
  const wheel = document.getElementById('wheel');
  const rouResult = document.getElementById('roulette-result');
  const spinRou = document.getElementById('spin-roulette');

  function forceRouletteResult(betType, playerWins) {
    if (playerWins) {
      if (betType === 'green') return 0;
      if (betType === 'red') return pick(redNums);
      if (betType === 'black') return pick(blackNums);
      if (betType === 'odd') return pick([...redNums, ...blackNums].filter(n => n % 2 === 1));
      if (betType === 'even') return pick([...redNums, ...blackNums].filter(n => n % 2 === 0));
    } else {
      if (betType === 'green') return pick([...redNums, ...blackNums]);
      if (betType === 'red') return pick([0, ...blackNums]);
      if (betType === 'black') return pick([0, ...redNums]);
      if (betType === 'odd') return pick([0, ...[...redNums, ...blackNums].filter(n => n % 2 === 0)]);
      if (betType === 'even') return pick([0, ...[...redNums, ...blackNums].filter(n => n % 2 === 1)]);
    }
    return Math.floor(Math.random() * 37);
  }

  spinRou.onclick = () => {
    if (!requireLogin()) return;
    if (!selectedBet) { rouResult.textContent = 'Pick a bet first'; rouResult.style.color = '#f55'; return; }
    const bet = Math.max(1, parseInt(document.getElementById('roulette-bet').value, 10) || 10);
    if (balance < bet) { rouResult.textContent = 'Not enough credits'; rouResult.style.color = '#f55'; showDepositNudge(); return; }
    balance -= bet; totalWagered += bet; updateBalance();
    spinRou.disabled = true; rouResult.textContent = 'Spinning...';
    const playerWins = houseRoll();
    const num = forceRouletteResult(selectedBet, playerWins);
    wheel.style.transform = 'rotate(' + (1800 + num * 9.73) + 'deg)';
    setTimeout(() => {
      const isRed = redNums.includes(num);
      const isBlack = blackNums.includes(num);
      let win = 0;
      let msg = 'Landed on ' + num + ' ';
      if (num === 0) msg += '(GREEN)'; else if (isRed) msg += '(RED)'; else msg += '(BLACK)';
      if (selectedBet === 'green' && num === 0) win = bet * 14;
      else if (selectedBet === 'red' && isRed) win = bet * 2;
      else if (selectedBet === 'black' && isBlack) win = bet * 2;
      else if (selectedBet === 'odd' && num % 2 === 1) win = bet * 2;
      else if (selectedBet === 'even' && num !== 0 && num % 2 === 0) win = bet * 2;
      if (win) { msg += ' — YOU WIN +' + win; rouResult.style.color = '#0f0'; afterWin(); }
      else { msg += ' — lose'; rouResult.style.color = '#f55'; afterLoss(bet); }
      rouResult.textContent = msg; balance += win; updateBalance(); spinRou.disabled = false;
    }, 3200);
  };

  /* BLACKJACK */
  const suits = ['♠', '♥', '♦', '♣'];
  const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  let deck = [], player = [], dealer = [], bjBet = 0, inHand = false, forcedOutcome = null;

  function newDeck() {
    deck = [];
    for (const s of suits) for (const r of ranks) deck.push({ r, s, red: s === '♥' || s === '♦' });
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
  }
  function cardVal(c) {
    if (['J', 'Q', 'K'].includes(c.r)) return 10;
    if (c.r === 'A') return 11;
    return parseInt(c.r, 10);
  }
  function handScore(hand) {
    let s = hand.reduce((a, c) => a + cardVal(c), 0);
    let aces = hand.filter(c => c.r === 'A').length;
    while (s > 21 && aces) { s -= 10; aces--; }
    return s;
  }
  function renderCards(el, hand, hideFirst) {
    el.innerHTML = '';
    hand.forEach((c, i) => {
      const d = document.createElement('div');
      d.className = 'card' + (c.red ? ' red' : '') + (hideFirst && i === 0 ? ' hidden' : '');
      d.textContent = hideFirst && i === 0 ? '?' : c.r + c.s;
      el.appendChild(d);
    });
  }
  function drawCard() { return deck.pop(); }
  function dealBiased() {
    newDeck();
    player = [drawCard(), drawCard()];
    dealer = [drawCard(), drawCard()];
    if (forcedOutcome === 'dealer' && handScore(player) === 21) {
      newDeck(); player = [drawCard(), drawCard()]; dealer = [drawCard(), drawCard()];
    }
  }

  const dealBtn = document.getElementById('bj-deal');
  const hitBtn = document.getElementById('bj-hit');
  const standBtn = document.getElementById('bj-stand');
  const bjResult = document.getElementById('bj-result');

  function endHand(msg, color) {
    inHand = false; hitBtn.disabled = true; standBtn.disabled = true; dealBtn.disabled = false;
    bjResult.textContent = msg; bjResult.style.color = color;
    renderCards(document.getElementById('dealer-cards'), dealer, false);
    document.getElementById('dealer-score').textContent = '(' + handScore(dealer) + ')';
  }

  dealBtn.onclick = () => {
    if (!requireLogin()) return;
    bjBet = Math.max(1, parseInt(document.getElementById('bj-bet').value, 10) || 20);
    if (balance < bjBet) { bjResult.textContent = 'Not enough credits'; bjResult.style.color = '#f55'; showDepositNudge(); return; }
    balance -= bjBet; totalWagered += bjBet; updateBalance();
    forcedOutcome = houseRoll() ? 'player' : 'dealer';
    dealBiased(); inHand = true; bjResult.textContent = '';
    dealBtn.disabled = true; hitBtn.disabled = false; standBtn.disabled = false;
    renderCards(document.getElementById('player-cards'), player, false);
    renderCards(document.getElementById('dealer-cards'), dealer, true);
    document.getElementById('player-score').textContent = '(' + handScore(player) + ')';
    document.getElementById('dealer-score').textContent = '';
    if (handScore(player) === 21) {
      balance += Math.floor(bjBet * 2.5); updateBalance(); afterWin();
      endHand('Blackjack! +' + Math.floor(bjBet * 2.5), '#0f0');
    }
  };

  hitBtn.onclick = () => {
    if (!inHand) return;
    player.push(drawCard());
    renderCards(document.getElementById('player-cards'), player, false);
    const ps = handScore(player);
    document.getElementById('player-score').textContent = '(' + ps + ')';
    if (ps > 21) { afterLoss(bjBet); endHand('Bust! You lose', '#f55'); }
  };

  standBtn.onclick = () => {
    if (!inHand) return;
    while (handScore(dealer) < 17) dealer.push(drawCard());
    if (forcedOutcome === 'dealer') {
      while (handScore(dealer) <= handScore(player) && handScore(dealer) < 21) dealer.push(drawCard());
    }
    const ps = handScore(player), ds = handScore(dealer);
    if (ds > 21 || ps > ds) {
      balance += bjBet * 2; updateBalance(); afterWin();
      endHand('You win! +' + (bjBet * 2), '#0f0');
    } else if (ps === ds) {
      balance += bjBet; updateBalance(); endHand('Push', '#ffd700');
    } else { afterLoss(bjBet); endHand('Dealer wins', '#f55'); }
  };
})();
