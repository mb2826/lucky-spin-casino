(function () {
  const RANKS = [
    { id: 'bronze',   name: 'Bronze',   icon: '🥉', xp: 0,      reward: '—' },
    { id: 'silver',   name: 'Silver',   icon: '🥈', xp: 500,    reward: '+100 credits' },
    { id: 'gold',     name: 'Gold',     icon: '🥇', xp: 2000,   reward: '+300 credits' },
    { id: 'platinum', name: 'Platinum', icon: '💎', xp: 5000,   reward: '+750 credits' },
    { id: 'diamond',  name: 'Diamond',  icon: '💠', xp: 12000,  reward: '+2000 credits' },
    { id: 'master',   name: 'Master',   icon: '👑', xp: 25000,  reward: '+5000 credits' },
    { id: 'grandmaster', name: 'Grandmaster', icon: '⚔️', xp: 50000, reward: '+10000 credits' },
    { id: 'unreal',   name: 'Unreal',   icon: '🌌', xp: 100000, reward: '100€ or 100B DonutSMP' }
  ];

  let xp = parseInt(localStorage.getItem('casino_xp') || '0', 10);
  let claimed = JSON.parse(localStorage.getItem('casino_rank_claimed') || '{}');

  function currentRankIndex() {
    let idx = 0;
    for (let i = 0; i < RANKS.length; i++) {
      if (xp >= RANKS[i].xp) idx = i;
    }
    return idx;
  }

  function addXP(amount) {
    const prev = currentRankIndex();
    xp += amount;
    localStorage.setItem('casino_xp', xp);
    const now = currentRankIndex();
    updateRankUI();
    if (now > prev) {
      const r = RANKS[now];
      // rank up toast
      const t = document.getElementById('flash-toast');
      if (window.flashMsg) {
        // use existing if available via global
      }
      alert('RANK UP! ' + r.icon + ' ' + r.name + (r.reward !== '—' ? '\nReward: ' + r.reward : ''));
      // auto-claim credit rewards (not unreal cash)
      if (r.reward.includes('credits') && !claimed[r.id]) {
        const m = r.reward.match(/\+(\d+)/);
        if (m) {
          const bal = parseInt(localStorage.getItem('casino_balance') || '0', 10);
          localStorage.setItem('casino_balance', bal + parseInt(m[1], 10));
          const el = document.getElementById('balance');
          if (el) el.textContent = bal + parseInt(m[1], 10);
        }
        claimed[r.id] = true;
        localStorage.setItem('casino_rank_claimed', JSON.stringify(claimed));
      }
      if (r.id === 'unreal') {
        alert('UNREAL REACHED!\n\nReward: 100€ cash OR 100B DonutSMP money\n\nCash payouts — COMING SOON\nContact staff to claim DonutSMP.');
      }
    }
  }

  function updateRankUI() {
    const idx = currentRankIndex();
    const r = RANKS[idx];
    const next = RANKS[idx + 1];
    const icon = document.getElementById('rank-icon');
    const name = document.getElementById('rank-name');
    const fill = document.getElementById('rank-xp-fill');
    if (icon) icon.textContent = r.icon;
    if (name) name.textContent = r.name;
    if (fill) {
      if (!next) {
        fill.style.width = '100%';
      } else {
        const span = next.xp - r.xp;
        const prog = Math.min(100, ((xp - r.xp) / span) * 100);
        fill.style.width = prog + '%';
      }
    }
    renderLadder();
  }

  function renderLadder() {
    const box = document.getElementById('rank-ladder');
    if (!box) return;
    const idx = currentRankIndex();
    box.innerHTML = RANKS.map((r, i) => {
      const cls = i === idx ? 'current' : (i > idx ? 'locked' : '');
      const xpTxt = i === idx && RANKS[i + 1]
        ? xp + ' / ' + RANKS[i + 1].xp + ' XP'
        : (i < idx ? 'Unlocked' : r.xp + ' XP required');
      return '<div class="rank-row ' + cls + '">' +
        '<div class="r-icon">' + r.icon + '</div>' +
        '<div class="r-info"><div class="r-name">' + r.name + '</div>' +
        '<div class="r-xp">' + xpTxt + '</div></div>' +
        '<div class="r-reward">' + r.reward + '</div></div>';
    }).join('');
  }

  // hook into wagering: expose global
  window.casinoAddXP = addXP;
  window.casinoGetXP = () => xp;

  // patch totalWagered increases by observing balance changes is hard;
  // instead wrap after common bet paths via MutationObserver on balance is overkill
  // Call addXP from a periodic check on localStorage wagered
  let lastWagered = parseInt(localStorage.getItem('casino_wagered') || '0', 10);
  setInterval(() => {
    const w = parseInt(localStorage.getItem('casino_wagered') || '0', 10);
    if (w > lastWagered) {
      addXP(w - lastWagered); // 1 XP per credit wagered
      lastWagered = w;
    }
  }, 500);

  // also XP on wins slightly
  const origSetItem = localStorage.setItem.bind(localStorage);
  // init UI
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateRankUI);
  } else {
    updateRankUI();
  }
})();