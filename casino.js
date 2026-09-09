(function () {
  let balance = parseInt(localStorage.getItem('casino_balance') || '1000', 10);
  const balEl = document.getElementById('balance');
  function updateBalance() {
    balEl.textContent = balance;
    localStorage.setItem('casino_balance', balance);
  }
  updateBalance();

  document.getElementById('add-credits').onclick = () => {
    balance += 500;
    updateBalance();
  };

  document.querySelectorAll('nav a[data-game]').forEach(a => {
    a.onclick = e => {
      e.preventDefault();
      document.querySelectorAll('.game-panel').forEach(p => p.classList.remove('active'));
      document.getElementById('game-' + a.dataset.game).classList.add('active');
      document.querySelectorAll('nav a[data-game]').forEach(x => x.classList.remove('active'));
      a.classList.add('active');
    };
  });
  document.querySelector('nav a[data-game="slots"]').classList.add('active');

  const modal = document.getElementById('login-modal');
  document.getElementById('open-login').onclick = e => { e.preventDefault(); modal.classList.add('open'); };
  document.getElementById('close-login').onclick = () => modal.classList.remove('open');
  modal.onclick = e => { if (e.target === modal) modal.classList.remove('open'); };
  document.getElementById('auth-form').onsubmit = e => {
    e.preventDefault();
    alert('Welcome! Credits unlocked.');
    modal.classList.remove('open');
  };

  const symbols = ['🍒', '🍋', '🔔', '⭐', '💎', '7️⃣', '🍀'];
  const reelEls = [document.getElementById('reel1'), document.getElementById('reel2'), document.getElementById('reel3')];
  const spinBtn = document.getElementById('spin-btn');
  const slotResult = document.getElementById('slot-result');

  spinBtn.onclick = () => {
    const bet = Math.max(1, parseInt(document.getElementById('slot-bet').value, 10) || 10);
    if (balance < bet) { slotResult.textContent = 'Not enough credits'; slotResult.style.color = '#f55'; return; }
    balance -= bet;
    updateBalance();
    spinBtn.disabled = true;
    slotResult.textContent = '';

    let spins = 0;
    const interval = setInterval(() => {
      reelEls.forEach(r => r.textContent = symbols[Math.floor(Math.random() * symbols.length)]);
      spins++;
      if (spins > 15) {
        clearInterval(interval);
        const final = reelEls.map(r => {
          const s = symbols[Math.floor(Math.random() * symbols.length)];
          r.textContent = s;
          return s;
        });
        let win = 0;
        if (final[0] === final[1] && final[1] === final[2]) {
          win = bet * (final[0] === '7️⃣' ? 50 : final[0] === '💎' ? 25 : 10);
          slotResult.textContent = `JACKPOT! +${win}`;
          slotResult.style.color = '#0f0';
        } else if (final[0] === final[1] || final[1] === final[2] || final[0] === final[2]) {
          win = bet * 2;
          slotResult.textContent = `Pair! +${win}`;
          slotResult.style.color = '#ffd700';
        } else {
          slotResult.textContent = 'No win';
          slotResult.style.color = '#aaa';
        }
        balance += win;
        updateBalance();
        spinBtn.disabled = false;
      }
    }, 80);
  };

  let selectedBet = null;
  document.querySelectorAll('.bet-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.bet-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedBet = btn.dataset.bet;
    };
  });

  const redNums = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
  const wheel = document.getElementById('wheel');
  const rouResult = document.getElementById('roulette-result');
  const spinRou = document.getElementById('spin-roulette');

  spinRou.onclick = () => {
    if (!selectedBet) { rouResult.textContent = 'Pick a bet first'; rouResult.style.color = '#f55'; return; }
    const bet = Math.max(1, parseInt(document.getElementById('roulette-bet').value, 10) || 10);
    if (balance < bet) { rouResult.textContent = 'Not enough credits'; rouResult.style.color = '#f55'; return; }
    balance -= bet;
    updateBalance();
    spinRou.disabled = true;
    rouResult.textContent = 'Spinning...';

    const num = Math.floor(Math.random() * 37);
    const deg = 1800 + (num * 9.73);
    wheel.style.transform = `rotate(${deg}deg)`;

    setTimeout(() => {
      const isRed = redNums.includes(num);
      const isBlack = num !== 0 && !isRed;
      const isOdd = num % 2 === 1;
      const isEven = num !== 0 && num % 2 === 0;
      let win = 0;
      let msg = `Landed on ${num} `;
      if (num === 0) msg += '(GREEN)';
      else if (isRed) msg += '(RED)';
      else msg += '(BLACK)';

      if (selectedBet === 'green' && num === 0) win = bet * 14;
      else if (selectedBet === 'red' && isRed) win = bet * 2;
      else if (selectedBet === 'black' && isBlack) win = bet * 2;
      else if (selectedBet === 'odd' && isOdd) win = bet * 2;
      else if (selectedBet === 'even' && isEven) win = bet * 2;

      if (win) {
        msg += ` — YOU WIN +${win}`;
        rouResult.style.color = '#0f0';
      } else {
        msg += ' — lose';
        rouResult.style.color = '#f55';
      }
      rouResult.textContent = msg;
      balance += win;
      updateBalance();
      spinRou.disabled = false;
    }, 3200);
  };

  const suits = ['♠', '♥', '♦', '♣'];
  const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  let deck = [], player = [], dealer = [], bjBet = 0, inHand = false;

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

  const dealBtn = document.getElementById('bj-deal');
  const hitBtn = document.getElementById('bj-hit');
  const standBtn = document.getElementById('bj-stand');
  const bjResult = document.getElementById('bj-result');

  function endHand(msg, color) {
    inHand = false;
    hitBtn.disabled = true;
    standBtn.disabled = true;
    dealBtn.disabled = false;
    bjResult.textContent = msg;
    bjResult.style.color = color;
    renderCards(document.getElementById('dealer-cards'), dealer, false);
    document.getElementById('dealer-score').textContent = '(' + handScore(dealer) + ')';
  }

  dealBtn.onclick = () => {
    bjBet = Math.max(1, parseInt(document.getElementById('bj-bet').value, 10) || 20);
    if (balance < bjBet) { bjResult.textContent = 'Not enough credits'; bjResult.style.color = '#f55'; return; }
    balance -= bjBet;
    updateBalance();
    newDeck();
    player = [deck.pop(), deck.pop()];
    dealer = [deck.pop(), deck.pop()];
    inHand = true;
    bjResult.textContent = '';
    dealBtn.disabled = true;
    hitBtn.disabled = false;
    standBtn.disabled = false;
    renderCards(document.getElementById('player-cards'), player, false);
    renderCards(document.getElementById('dealer-cards'), dealer, true);
    document.getElementById('player-score').textContent = '(' + handScore(player) + ')';
    document.getElementById('dealer-score').textContent = '';
    if (handScore(player) === 21) {
      balance += Math.floor(bjBet * 2.5);
      updateBalance();
      endHand('Blackjack! +' + Math.floor(bjBet * 2.5), '#0f0');
    }
  };

  hitBtn.onclick = () => {
    if (!inHand) return;
    player.push(deck.pop());
    renderCards(document.getElementById('player-cards'), player, false);
    const ps = handScore(player);
    document.getElementById('player-score').textContent = '(' + ps + ')';
    if (ps > 21) {
      endHand('Bust! You lose', '#f55');
    }
  };

  standBtn.onclick = () => {
    if (!inHand) return;
    while (handScore(dealer) < 17) dealer.push(deck.pop());
    const ps = handScore(player);
    const ds = handScore(dealer);
    if (ds > 21 || ps > ds) {
      balance += bjBet * 2;
      updateBalance();
      endHand('You win! +' + (bjBet * 2), '#0f0');
    } else if (ps === ds) {
      balance += bjBet;
      updateBalance();
      endHand('Push', '#ffd700');
    } else {
      endHand('Dealer wins', '#f55');
    }
  };
})();