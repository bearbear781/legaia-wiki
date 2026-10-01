/* ---- 00-core.js ---- */
'use strict';
/* 雷盖亚传说百科 / Legend of Legaia Wiki - a static wiki built from the game's data. Every page is a function of the
   data; routes are #name-arg-arg (letters, digits, '-', '.' only). Text shown on a page goes through T`...` (page
   templates) or tr() (data strings): in English the Chinese is looked up in window.LG_EN (data/en.js). */
(() => {
  const LG = window.LG || {};
  const D = LG.D, IT = LG.IT, NPC = LG.NPC, X = LG.X || {};
  const EN = window.LG_EN || { t: {} };
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const store = {
    get(k, d) { try { const v = localStorage.getItem('lgwiki.' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('lgwiki.' + k, JSON.stringify(v)); } catch (e) { /* private mode */ } },
  };

  // ------------------------------------------------------------------ language
  const HAS_EN = !!(EN.t && Object.keys(EN.t).length);
  let LANG = (() => {
    const s = store.get('lang', '');
    if (s === 'zh' || (s === 'en' && HAS_EN)) return s;
    if (!HAS_EN) return 'zh';
    const n = (navigator.languages && navigator.languages[0]) || navigator.language || 'zh';
    return /^zh/i.test(n) ? 'zh' : 'en';
  })();
  const isEn = () => LANG === 'en';
  const COLLECT = window.LG_COLLECT ? (window.LG_KEYS = new Map()) : null;     // key extraction (build tools)
  const MISSING = (window.LG_MISSING = new Set());
  const HAN = /[㐀-鿿]/;
  const fill = (strs, vals) => { let s = strs[0]; for (let i = 0; i < vals.length; i++) s += vals[i] + strs[i + 1]; return s; };
  function T(strs, ...vals) {
    if (LANG !== 'en' && !COLLECT) return fill(strs, vals);
    let key = strs[0];
    for (let i = 1; i < strs.length; i++) key += `{${i - 1}}` + strs[i];
    if (COLLECT && HAN.test(key)) COLLECT.set(key, 't');
    if (LANG !== 'en') return fill(strs, vals);
    const en = EN.t[key];
    if (en === undefined) { if (HAN.test(key)) MISSING.add(key); return fill(strs, vals); }
    return en.replace(/\{(\d+)\}/g, (_, n) => vals[Number(n)]);
  }
  // a short label whose English depends on where it stands (the same Chinese word means more than one thing)
  const L = (zh, en) => (LANG === 'en' ? en : zh);
  function tr(s) {
    if (!s || typeof s !== 'string') return s;
    if (COLLECT && HAN.test(s) && !COLLECT.has(s)) COLLECT.set(s, 'd');
    if (LANG !== 'en') return s;
    const en = EN.t[s];
    if (en === undefined) { if (HAN.test(s)) MISSING.add(s); return s; }
    return en;
  }

  // ------------------------------------------------------------------ constants
  const ELEMENTS_ZH = ['地', '水', '火', '风', '雷', '光', '邪', '无'];
  const ELEMENTS_EN = ['Earth', 'Water', 'Fire', 'Wind', 'Thunder', 'Light', 'Evil', 'None'];
  const elName = (e) => (LANG === 'en' ? ELEMENTS_EN : ELEMENTS_ZH)[e] || '';
  const ARROW = { U: '↑', D: '↓', L: '←', R: '→' };
  const CMD_COST = 30;
  const CHARS = D.chars.slice();                     // 瓦恩 诺娅 加拉 (data keys; display with charName)
  const CHARS_EN = ['Vahn', 'Noa', 'Gala'];
  const RASERU_ZH = ['麦塔', '泰拉', '奥兹玛'], RASERU_EN = ['Meta', 'Terra', 'Ozma'];
  const charName = (i) => (LANG === 'en' ? CHARS_EN : CHARS)[i] || '';
  const raseruName = (i) => (LANG === 'en' ? RASERU_EN : RASERU_ZH)[i] || '';
  const WEAPON_HAND = ['←', '→', '←'];
  const siteName = () => T`雷盖亚传说百科`;

  // ------------------------------------------------------------------ text helpers
  const esc = (s) => String(s === undefined || s === null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const num = (n) => Number(n || 0).toLocaleString(LANG === 'en' ? 'en-US' : 'zh-CN');
  const uniq = (a) => a.filter((x, i) => a.indexOf(x) === i);
  const range = (a, b) => Array.from({ length: b - a + 1 }, (_, k) => a + k);
  const list = (a) => a.join(LANG === 'en' ? ', ' : '、');          // a run of names
  const orList = (a) => a.join(LANG === 'en' ? ' or ' : ' 或 ');
  const q2 = (s) => (LANG === 'en' ? `“${s}”` : `「${s}」`);         // a quoted name
  const paren = (s) => (LANG === 'en' ? ` (${s})` : `（${s}）`);
  const colon = () => (LANG === 'en' ? ': ' : '：');
  const circled = (i) => '①②③④⑤⑥⑦⑧⑨⑩'[i] || String(i + 1);
  // English names: the game's own (monster records carry "^A Gimard $2" = element icon, Lv2)
  const monEn = (id) => { const n = (X.mon_en || {})[id]; return n ? n.replace(/^\^[A-Z]\s*/, '').replace(/\s*\$(\d)$/, ' Lv$1') : ''; };
  const itemName = (id) => {
    const x = D.items[id];
    if (!x) return T`物品#${id}`;
    const n = LANG === 'en' && x.en ? x.en : x.zh;
    return x.lv && !/Lv\s?\d+$/.test(n) ? `${n} Lv${x.lv}` : n;
  };
  const spellName = (id) => { const s = D.spells[id]; if (!s) return T`魔法#${id}`; return LANG === 'en' && s.en ? s.en : s.zh; };
  const monName = (id) => (LANG === 'en' && monEn(id) ? monEn(id) : D.mons[id] ? D.mons[id].n : (D.monsters[id] || T`怪物#${id}`));
  const artName = (a) => (a ? (LANG === 'en' && a.en ? a.en : a.zh) : '');
  const npcName = (e) => (e && e.n ? (LANG === 'en' && e.ne ? e.ne : e.n) : '');
  const elTag = (e) => (e === undefined || e === null || e > 7 ? '' : `<span class="el el${e}">${elName(e)}</span>`);
  const keys = (cmd) => `<span class="keys" aria-label="${esc([...cmd].map((c) => ARROW[c]).join(''))}">${[...cmd].map((c) => `<kbd class="${c}">${ARROW[c]}</kbd>`).join('')}</span>`;
  const itemsLinks = (ids) => { const m = new Map(); for (const id of ids) m.set(id, (m.get(id) || 0) + 1); return list([...m].map(([id, n]) => `${aItem(id)}${n > 1 ? ` ×${n}` : ''}`)); };
  const pill = (t, cls) => `<span class="pill ${cls || ''}">${esc(t)}</span>`;

  // ------------------------------------------------------------------ links
  const aItem = (id, t) => (D.items[id] ? `<a href="#item-${id}">${esc(t || itemName(id))}</a>` : esc(t || itemName(id)));
  const aMon = (id, t) => (D.mons[id] ? `<a href="#mon-${id}">${esc(t || monName(id))}</a>` : esc(t || monName(id)));
  const aSpell = (id, t) => `<a href="#spell-${id}">${esc(t || spellName(id))}</a>`;
  const chName = (i) => tr(D.guide.ch[i] ? D.guide.ch[i].name : '');
  const chLabel = (i) => T`第${i + 1}章`;
  const aCh = (i, t) => `<a href="#ch-${i + 1}">${esc(t || T`第${i + 1}章 ${chName(i)}`)}</a>`;
  const aChar = (i, t) => `<a href="#char-${i}">${esc(t || charName(i))}</a>`;
  function aPlace(label, t) {
    const k = PL_OF[label];
    const name = t || (k ? PL.get(k).name : placeName(label));
    return k ? `<a href="#place-${k}">${esc(name)}</a>` : esc(name);
  }
  const aNpc = (i, t) => `<a href="#npc-${i}">${esc(t || npcName(NPC.npcs[i]))}</a>`;

  // ------------------------------------------------------------------ places: one page per place name, every story
  // version of the place (the same map at another time) on it; ending / opening cut-scene copies stay apart
  const NAME_FIX = {
    map01: ['德雷克王国（大地图）', 'Drake Kingdom (world map)'], map02: ['塞布库斯群岛（大地图）', 'Sebucus Islands (world map)'],
    map03: ['卡里斯托王国（大地图）', 'Karisto Kingdom (world map)'], juui1: ['瑟鲁界', 'Seru World'], juui2: ['瑟鲁界', 'Seru World'],
    urudre1: ['乌鲁迈斯 · 梦境', 'Uru Mais (dream)'], urudre2: ['乌鲁迈斯 · 梦境', 'Uru Mais (dream)'], urudre3: ['乌鲁迈斯 · 梦境', 'Uru Mais (dream)'],
  };
  const WORLD = { map01: 0, map02: 1, map03: 2 };
  const isCut = (l) => /^(ed|op)/.test(l);
  const PLACE_EN = X.place_en || {};
  const placeNameZh = (label) => {
    if (!label) return '';
    if (NAME_FIX[label]) return NAME_FIX[label][0];
    const n = D.places[label] || label;
    return isCut(label) ? `${n}（${label.startsWith('ed') ? '结局' : '过场'}）` : n;
  };
  function placeName(label) {
    if (LANG !== 'en') return placeNameZh(label);
    if (!label) return '';
    if (NAME_FIX[label]) return NAME_FIX[label][1];
    const n = PLACE_EN[label] || tr(D.places[label] || label);
    return isCut(label) ? `${n} (${label.startsWith('ed') ? 'ending' : 'cut-scene'})` : n;
  }
  const sceneName = (l) => placeName(l);
  // what a story version of a scene is (the NPC data names some; the rest by hand)
  const SCENE_WHEN = Object.assign({
    urudre1: '瓦恩的梦（利姆艾姆）', urudre2: '诺娅的梦（康克拉姆）', urudre3: '加拉的梦（拜伦修道院）',
    taiku2: '浮空城开始坠落后', nilboa2: '峡谷深处', rikuroa2: '山顶', conc2: '昔日康克拉姆 · 宫殿', conc3: '昔日康克拉姆 · 第二天',
    concend: '康克拉姆消亡时', uru2: '最终章再访', korout: '索尔塔外', korb2: '索尔塔下层', korb3: '战士广场', tunnelc: '火焰之路深处',
    chitei2: '要塞地下', jagaroom: '札格诺特之室', retockin: '拉塔尤城',
    jouina: '区域 A', jouinb: '区域 B', jouinc: '区域 C', jouind: '区域 D', jouine: '区域 E',
  }, NPC.when || {});
  const sceneWhen = (l) => tr(SCENE_WHEN[l] || '');
  const PL = new Map();
  const PL_OF = {};
  (function buildPlaces() {
    const chs = D.guide.ch;
    const labels = uniq([...chs.flatMap((c) => c.labels), ...Object.keys(D.places)]);
    for (const l of labels) {
      const name = placeNameZh(l);
      const key0 = isCut(l) || WORLD[l] !== undefined ? l : name;
      let P = [...PL.values()].find((p) => p.gkey === key0);
      if (!P) {
        P = { key: l, gkey: key0, zh: name, labels: [], ch: [], region: null, world: WORLD[l] !== undefined, cut: isCut(l) };
        Object.defineProperty(P, 'name', { get() { return placeName(this.key); } });
        PL.set(l, P);
      }
      P.labels.push(l);
      PL_OF[l] = P.key;
    }
    chs.forEach((c, i) => {
      for (const l of c.labels) { const P = PL.get(PL_OF[l]); if (P && !P.ch.includes(i)) P.ch.push(i); }
    });
    for (const P of PL.values()) {
      if (P.world) {
        const r = WORLD[P.key];
        P.region = r;
        P.ch = chs.map((c, i) => (c.region === r ? i : -1)).filter((i) => i >= 0);
      } else if (P.ch.length) P.region = chs[Math.min(...P.ch)].region;
      P.ch.sort((a, b) => a - b);
    }
  })();
  const placeList = () => [...PL.values()].sort((a, b) => ((a.ch[0] ?? 99) - (b.ch[0] ?? 99)) || (a.world - b.world));
  const placeOf = (label) => PL.get(PL_OF[label]) || null;
  const placeByZh = (n) => [...PL.values()].find((x) => !x.cut && (x.zh === n || x.zh === `${n}（大地图）` || (n === '索尔' && x.zh === '索尔塔'))) || null;
  const regionName = (r) => tr(D.guide.regions[r] || '');

  // ------------------------------------------------------------------ story flags and conditions
  const flagName = (f) => tr(IT.flags[f] || (X.flag_extra || {})[f] || '') || T`某段剧情`;
  const CMP = { '>=': '≥', '<': '<', '>': '>', '<=': '≤', '=': '=' };
  function condText(c) {
    const op = CMP[c[2]] || c[2];
    switch (c[0]) {
      case 'f': case 'ft': return c[2] ? flagName(c[1]) : T`在${q2(flagName(c[1]))}之前`;
      case 'h': return c[2] ? T`持有${q2(itemName(c[1]))}` : T`没有${q2(itemName(c[1]))}`;
      case 'lv': return T`${charName(c[1])} 等级${op}${c[3]}`;
      case 'g': return T`金钱${op}${num(c[3])}`;
      case 'c': return T`代币${op}${num(c[3])}`;
      case 'pick': return T`对话选${q2(tr(c[1]))}`;
      case 'rnd': return T`几率约${c[3]}%`;
      case 'slot': return T`小游戏成绩${op}${c[3]}`;
      case 'ch': return T`剧情到达${chLabel(c[1])}${q2(chName(c[1]))}`;
      default: return c.join(' ');
    }
  }
  const condHtml = (c) => {
    if (c[0] === 'h' && c[2]) return `<span class="cond">${T`持有${q2(aItem(c[1]))}`}</span>`;
    if (c[0] === 'ch') return `<span class="cond">${T`剧情到达${aCh(c[1], `${chLabel(c[1])}${q2(chName(c[1]))}`)}`}</span>`;
    return `<span class="cond">${esc(condText(c))}</span>`;
  };

  // ------------------------------------------------------------------ guide indexes
  const GUIDE = D.guide;
  const BOSSES = [];                                  // in story order
  GUIDE.ch.forEach((c, i) => (c.boss || []).forEach((b) => BOSSES.push(Object.assign({ ch: i }, b))));
  const bossesOf = (id) => BOSSES.filter((b) => b.id === Number(id));
  const firstBossCh = (id) => { const b = bossesOf(id); return b.length ? b[0].ch : null; };
  const labelChapter = (l) => { const P = placeOf(l); return P && P.ch.length ? P.ch[0] : null; };

  // ------------------------------------------------------------------ encounters: a scene's condition groups are walked
  // in order and the first whose story flag is set (0xFFFF = always) owns its slice of the region list; inside it the
  // first region holding the player rolls a formation from its own row slice. rate 0 = no random battles there.
  const TRANSIENT = new Set(X.flag_transient || []);
  function encGroups(lab) {
    const t = (D.enct || {})[lab];
    if (!t) return [];
    const out = [];
    let first = 0;
    t.conds.forEach(([flag, n], gi) => {
      const regs = t.regs.slice(first, first + n);
      first += n;
      const zones = new Map();
      for (const r of regs) {
        if (!r[4]) continue;
        const k = r[5] + ':' + r[6];
        const z = zones.get(k) || { k, rows: t.rows.slice(r[5], r[5] + r[6]).filter((f) => f.length), rate: 0, boxes: [] };
        z.rate = Math.max(z.rate, r[4]);
        z.boxes.push(r.slice(0, 4));
        zones.set(k, z);
      }
      out.push({ gi, flag, zones: [...zones.values()].filter((z) => z.rows.length), always: flag === 0xFFFF, transient: TRANSIENT.has(flag) });
    });
    return out;
  }
  // where each monster is met at random: scene -> the groups (story periods) it shows up in
  const MON_ENC = {};
  for (const lab of Object.keys(D.enct || {})) {
    if (isCut(lab)) continue;
    for (const g of encGroups(lab)) {
      if (g.transient) continue;
      for (const z of g.zones) for (const f of z.rows) for (const id of f) {
        const m = MON_ENC[id] || (MON_ENC[id] = {});
        const e = m[lab] || (m[lab] = { flags: new Set(), rate: 0 });
        e.flags.add(g.flag);
        e.rate = Math.max(e.rate, z.rate);
      }
    }
  }
  const randomPlaces = (id) => uniq(Object.keys(MON_ENC[id] || {}).map((l) => PL_OF[l]).filter(Boolean)).map((k) => PL.get(k));
  const monFirstCh = (id) => {
    let best = 99;
    for (const l of Object.keys(MON_ENC[id] || {})) { const c = labelChapter(l); if (c !== null && c < best) best = c; }
    const b = firstBossCh(id);
    if (b !== null && b < best) best = b;
    return best;
  };
  // the period wording of one condition group (groups are ordered newest story beat first)
  function periodText(groups, g) {
    if (!g.always) return T`${q2(flagName(g.flag))}之后`;
    const others = groups.filter((x) => !x.always && !x.transient);
    return others.length ? T`一开始（下面这些剧情之前）` : '';
  }

  // ------------------------------------------------------------------ item sources
  const SRC_T = { box: '宝箱', box2: '贤者宝箱', floor: '地上', hid: '调查', obj: '拾取', npc: '人物', evt: '事件', craft: '加工', shop: '商店',
    plat: '白金卡', casino: '赌场', fish: '钓鱼', drop: '掉落', steal: '偷取', raseru: '圣瑟鲁', none: '无' };
  const ONE_T = ['box', 'box2', 'floor', 'hid', 'obj', 'npc', 'evt'];
  const price = (s) => (s.$ !== undefined ? (s.cur === 'c' ? T`${num(s.$)} 代币` : s.cur === 'fp' ? T`${num(s.$)} 钓鱼积分` : `${num(s.$)}G`) : '');
  const shopNames = (s) => list((s.ns && s.ns.length ? s.ns : [s.n]).map(tr));
  function srcHead(s) {
    const pr = price(s);
    const q = s.q > 1 ? ` ×${s.q}` : '';
    if (s.how && s.t !== 'craft') return `${esc(tr(s.how))}${q}${pr ? T`，花${pr}` : ''}`;
    switch (s.t) {
      case 'box': return T`打开宝箱${q}`;
      case 'box2': return T`打开贤者宝箱（第一次打开时给）${q}`;
      case 'floor': return T`捡起地上发光处的东西${q}`;
      case 'hid': return T`调查${esc(tr(s.n || '家具'))}${q}`;
      case 'npc': return `${s.n ? T`找${esc(tr(s.n))}对话` : T`和人物对话`}${q}${pr ? T`，花${pr}` : ''}`;
      case 'obj': return T`捡起${esc(tr(s.n || '地上的东西'))}${q}`;
      case 'evt': return `${s.n ? T`${esc(tr(s.n))}：剧情事件` : T`剧情事件`}${q}${pr ? T`，花${pr}` : ''}`;
      case 'craft': return T`让${esc(tr(s.n || ''))}加工（用掉${(s.take || []).map((t) => q2(aItem(t))).join('')}）`;
      case 'shop': return s.ns && s.ns.length > 1 ? T`${esc(shopNames(s))}都能买　${pr}` : T`${esc(tr(s.n))}买　${pr}`;
      case 'plat': return `${s.ns && s.ns.length > 1 ? T`${esc(shopNames(s))}都能买　${pr}` : T`${esc(tr(s.n))}买　${pr}`}　<span class="faint">${s.unv ? T`（白金卡秘密商品，尚未在实机上确认）` : T`（白金卡秘密商品）`}</span>`;
      case 'casino': return `${T`赌场奖品兑换处换　${pr}`}${s.once ? T`（限一次）` : ''}`;
      case 'fish': return `${T`钓鱼积分兑换处换　${pr}`}${s.fbit !== undefined ? T`（限一次）` : ''}`;
      case 'raseru': return T`圣瑟鲁的装备：跟着圣瑟鲁的等级自动变化，不能另外获得`;
      case 'none': return T`游戏里没有获得途径`;
      default: return '';
    }
  }
  function srcWhere(s, noWhen) {
    if (!s.p) return '';
    let w = `<span class="gm">${L('地点', 'Location')}</span>${s.s ? aPlace(s.s) : esc(tr(s.p))}`;
    if (s.when && !noWhen) w += `<span class="faint">${esc(paren(tr(s.when)))}</span>`;
    if (s.near && s.near !== s.n) w += ` · ${T`靠近${q2(esc(tr(s.near)))}`}`;
    if ((s.t === 'npc' || s.t === 'evt') && s.n && s.how && !s.how.includes(s.n)) w += `　<span class="gm">${T`找`}</span>${esc(tr(s.n))}`;
    return w;
  }
  // alternative condition sets: two that differ only in one story flag being off / on are one set without it
  // (a shop open "before X" or "after X" is simply open); a set that needs nothing makes the whole thing unconditional
  function simplifyAlts(alts) {
    const a = alts.map((x) => x.slice());
    const ks = (c) => JSON.stringify(c);
    for (let changed = true; changed;) {
      changed = false;
      for (let i = 0; i < a.length && !changed; i++) {
        for (let j = i + 1; j < a.length && !changed; j++) {
          const x = a[i], y = a[j];
          const dx = x.filter((c) => !y.some((d) => ks(d) === ks(c))), dy = y.filter((c) => !x.some((d) => ks(d) === ks(c)));
          if (dx.length === 1 && dy.length === 1 && ['f', 'ft'].includes(dx[0][0]) && dx[0][0] === dy[0][0] && dx[0][1] === dy[0][1] && !dx[0][2] !== !dy[0][2]) {
            a[i] = x.filter((c) => c !== dx[0]);
            a.splice(j, 1);
            changed = true;
          } else if (!dx.length && x.length <= y.length) { a.splice(j, 1); changed = true; }      // y needs more than x
          else if (!dy.length) { a.splice(i, 1); changed = true; }
        }
      }
    }
    return a.some((x) => !x.length) ? [] : a;
  }
  function srcAlts(s) {
    const alts = simplifyAlts((s.alt && s.alt.length ? s.alt : [[]]).map((a) => a.slice()));
    if (s.t === 'plat') { if (!alts.length) alts.push([]); for (const a of alts) a.unshift(['h', 255, 1]); }
    return alts.filter((a) => a.length);
  }
  const dlName = (f) => tr((IT.dl && IT.dl[f]) || '') || flagName(f);
  // the story beat that closes a source for good (static: always named)
  function deadline(s) {
    if (s.until !== undefined) return T`${chLabel(s.until)}${q2(chName(s.until))}这段剧情过去之后`;
    if (s.miss && s.miss.length) return T`${orList(uniq(s.miss.map(dlName)).slice(0, 2).map(q2))}之后`;
    if (s.closed && s.closed.length) return T`${orList(uniq([...new Set(s.closed.flat())].map(dlName)).slice(0, 2).map(q2))}之后（这里进不去了）`;
    return '';
  }
  const isLimited = (s) => !!((s.miss && s.miss.length) || (s.closed && s.closed.length) || s.until !== undefined);
  // the place a source happens: a map spot link when the data has one
  const spotLink = (s, t) => (s.s && s.w ? `<a class="small" href="#spot-${s.s}-${s.w[0]}-${s.w[1]}">${esc(t || T`在地图上看`)}</a>` : '');
  // several spots of one kind: "地图 ①②③"
  function spotLinks(spots, label) {
    const ok = uniq(spots.filter((s) => s && s.s && s.w).map((s) => `${s.s}-${s.w[0]}-${s.w[1]}`));
    if (!ok.length) return '';
    if (ok.length === 1) return `<a class="small" href="#spot-${ok[0]}">${esc(label || T`在地图上看`)}</a>`;
    return `<span class="small spots">${esc(label || T`在地图上看`)} ${ok.map((k, i) => `<a href="#spot-${k}">${circled(i)}</a>`).join('')}</span>`;
  }

  // ------------------------------------------------------------------ small widgets
  function table(head, rows, opt) {
    const o = opt || {};
    const th = head.map((h) => {
      const [t, cls] = Array.isArray(h) ? h : [h, ''];
      return `<th class="${cls}${o.sort ? ' sort' : ''}">${t}</th>`;
    }).join('');
    return `<div class="tbl"><table class="data${o.cls ? ' ' + o.cls : ''}"${o.sort ? ' data-sort="1"' : ''}><thead><tr>${th}</tr></thead><tbody>${rows.join('')}</tbody></table></div>`;
  }
  // a sortable cell: data-v carries the value to sort by
  const td = (v, html, cls) => `<td${cls ? ` class="${cls}"` : ''} data-v="${esc(v)}">${html === undefined ? esc(v) : html}</td>`;
  function infobox(title, sub, rows, cls) {
    const body = rows.filter(Boolean).map((r) => (r.sec ? `<tr class="ib-sec"><td colspan="2">${esc(r.sec)}</td></tr>`
      : r.raw ? `<tr><td colspan="2" style="padding:0">${r.raw}</td></tr>` : `<tr><th>${esc(r[0])}</th><td>${r[1]}</td></tr>`)).join('');
    return `<aside class="infobox ${cls || ''}"><div class="ib-h"><b>${esc(title)}</b>${sub ? `<span>${sub}</span>` : ''}</div><table>${body}</table></aside>`;
  }
  const statGrid = (pairs) => `<div class="stats">${pairs.map(([k, v]) => `<div><b>${typeof v === 'number' ? num(v) : esc(v)}</b><small>${esc(k)}</small></div>`).join('')}</div>`;
  const crumbs = (lst) => `<div class="crumbs">${lst.map(([h, t]) => (h ? `<a href="#${h}">${esc(t)}</a>` : esc(t))).join(' › ')}</div>`;
  const home = () => ['home', T`首页`];
  const toc = (pairs) => `<div class="toc"><b>${T`本页`}</b>${pairs.map(([id, t]) => `<a href="#" role="button" data-jump="${id}">${esc(t)}</a>`).join('')}</div>`;
  const h2 = (id, t, extra) => `<h2 id="${id}">${esc(t)}${extra || ''}</h2>`;

  // ------------------------------------------------------------------ auto links: names written in running text
  // (item effects, notes, walkthrough steps, conditions...) become links to their pages. A name is linked once per
  // block (list item, cell, paragraph); a character's name once per page; nothing inside quotes, headings or links.
  const NOLINK = 'a, h1, h2, h3, h4, .crumbs, .toc, .chips, .pill, kbd, .keys, .quote, .nl, button, input, textarea, select, label, summary, .ib-h, thead, .mapbox, .nav2, .en, .self, script, style';
  const GENERIC_EN = new Set(['Wolf', 'Frog', 'Worm', 'Mage', 'Ostrich', 'Guardian', 'Nightmare', 'Shade', 'Mushroom', 'Hornet', 'Ogre', 'Golem', 'Sorcerer', 'Skeleton', 'Magic', 'Heal', 'Revive']);
  let NAMES = null;
  function nameTable() {
    if (NAMES && NAMES.lang === LANG) return NAMES;
    const map = new Map(), clash = new Set();
    const add = (n, h, k) => {
      if (!n) return;
      n = String(n).trim();
      if (LANG === 'en' ? n.length < 3 || GENERIC_EN.has(n) : n.length < 2) return;
      const o = map.get(n);
      if (!o) { map.set(n, { h, k }); return; }
      if (o.k === 'char') return;                    // a character's name stays the character (Meta the Ra-Seru, not the spell)
      if (o.h !== h && !(o.k === k && (k === 'mon' || k === 'npc' || k === 'place'))) clash.add(n);   // same name, two kinds: leave it
    };
    [0, 1, 2].forEach((c) => { add(charName(c), `#char-${c}`, 'char'); add(raseruName(c), `#char-${c}`, 'char'); });
    for (const id of Object.keys(IT.items)) if (D.items[id]) add(itemName(id), `#item-${id}`, 'item');
    const monIds = Object.keys(D.mons).sort((a, b) => (monFirstCh(a) - monFirstCh(b)) || (a - b));
    for (const id of monIds) add(monName(id), `#mon-${id}`, 'mon');
    for (const id of [...SERU_ALL, ...RA_MAGIC, ...SUMMONS.map((s) => s[0])]) add(spellName(id), `#spell-${id}`, 'spell');
    for (const P of placeList()) if (!P.cut) add(P.name, `#place-${P.key}`, 'place');
    for (const [n, i] of Object.entries(npcIdx)) {
      const e = NPC.npcs[i];
      if (!NPC_GENERIC.test(n)) add(npcName(e), `#npc-${i}`, 'npc');
    }
    for (const n of clash) map.delete(n);
    const names = [...map.keys()].sort((a, b) => b.length - a.length).map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const re = names.length ? new RegExp(LANG === 'en' ? `(?<![A-Za-z0-9'’-])(?:${names.join('|')})(?![A-Za-z0-9’-])` : names.join('|'), 'g') : null;
    NAMES = { lang: LANG, map, re };
    return NAMES;
  }
  const DELIM = /[\s「」『』“”"：:、，,。；;（）()×·\/!?！？]/;
  // two-character names that are transliterations, never everyday words: linked wherever they stand
  const SAFE2 = new Set(['卓拉', '嘉萨', '杰特', '松吉', '柯特', '泽托', '科姆', '科鲁', '罗格', '贡布', '赞恩', '伊文', '佐普', '佩佩', '卡萝', '哈里',
    '妮妮', '娜拉', '扎兰', '沃尔', '玛丽', '玛雅', '琪娜', '莎夏', '萨留', '布玛']);
  function autolink(root, route) {
    const T0 = nameTable();
    if (!T0.re) return;
    const self = '#' + route;
    const pageSeen = new Set();
    for (const a of $$('a[href^="#"]', root)) pageSeen.add(a.getAttribute('href'));
    const blockSeen = new WeakMap();
    const blockOf = (el) => el.closest('li, td, th, p, dd, .src-b, .src-h, .go, .st-h, .st-m, .lede, .h1sub, div') || root;
    const seenIn = (b) => {
      let s = blockSeen.get(b);
      if (!s) { s = new Set($$('a[href^="#"]', b).map((a) => a.getAttribute('href'))); blockSeen.set(b, s); }
      return s;
    };
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => (n.nodeValue.trim() && n.parentElement && !n.parentElement.closest(NOLINK) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT),
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const node of nodes) {
      const text = node.nodeValue;
      T0.re.lastIndex = 0;
      let m, last = 0, frag = null;
      const block = blockOf(node.parentElement);
      while ((m = T0.re.exec(text))) {
        const n = m[0], o = T0.map.get(n);
        if (!o || o.h === self) continue;
        if (LANG !== 'en' && n.length === 2 && !SAFE2.has(n)) {          // a two-character name only as a name: quoted or in a list
          const a = text[m.index - 1], b = text[m.index + 2];
          if ((a !== undefined && !DELIM.test(a)) || (b !== undefined && !DELIM.test(b))) continue;
        }
        const seen = seenIn(block);
        if (seen.has(o.h) || (o.k === 'char' && pageSeen.has(o.h))) continue;
        seen.add(o.h);
        pageSeen.add(o.h);
        if (!frag) frag = document.createDocumentFragment();
        if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
        const a = document.createElement('a');
        a.href = o.h;
        a.className = 'al';
        a.textContent = n;
        frag.appendChild(a);
        last = m.index + n.length;
      }
      if (!frag) continue;
      if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
      node.parentNode.replaceChild(frag, node);
    }
  }
  // a link to the page itself reads as bold text (as on Wikipedia)
  function unlinkSelf(root, route) {
    for (const a of $$(`a[href="#${CSS.escape(route)}"]`, root)) {
      if (a.closest('.chips, .toc, .crumbs, .nav2, .mapbox')) continue;
      const b = document.createElement('b');
      b.className = 'self';
      b.innerHTML = a.innerHTML;
      a.replaceWith(b);
    }
  }

  // ------------------------------------------------------------------ router
  const PAGES = {};
  const NAV_OF = { item: 'items', mon: 'monsters', spell: 'magic', place: 'places', spot: 'places', ch: 'walkthrough', char: 'chars', arts: 'arts',
    npc: 'npcs', shop: 'shops' };
  let lastRoute = '';
  function parseHash() {
    const h = decodeURIComponent((location.hash || '').replace(/^#/, '')) || 'home';
    const parts = h.split('-');
    return { h, name: parts[0], args: parts.slice(1) };
  }
  function render() {
    const R = parseHash();
    if (R.name === 'lang' && (R.args[0] === 'zh' || R.args[0] === 'en')) { setLang(R.args[0]); history.replaceState(null, '', '#home'); return render(); }
    const fn = PAGES[R.name] || PAGES.notfound;
    let out;
    try { out = fn(R.args, R); } catch (e) {
      console.error(e);
      out = { title: T`出错了`, html: `<h1>${T`页面出错`}</h1><p>${T`这个页面生成时出了错：`}${esc(e && e.message)}</p><p><a href="#home">${T`回到首页`}</a></p>` };
    }
    if (!out) out = PAGES.notfound(R.args, R);
    const page = $('#page');
    page.innerHTML = out.html;
    document.title = out.title && out.title !== siteName() ? `${out.title} · ${siteName()}` : siteName();
    const nav = NAV_OF[R.name] || R.name;
    for (const a of $$('#side a')) a.classList.toggle('on', a.getAttribute('href') === '#' + nav);
    document.body.classList.remove('nav-open');
    if (R.h !== lastRoute) window.scrollTo(0, 0);
    lastRoute = R.h;
    try { autolink(page, R.h); } catch (e) { console.error(e); }
    unlinkSelf(page, R.h);
    hookPage(page);
    if (out.after) out.after(page);
  }
  // in-page widgets: sortable tables, jump links (pages register their own handlers via data-*)
  function hookPage(root) {
    for (const t of $$('table[data-sort]', root)) {
      const ths = $$('thead th', t);
      ths.forEach((th, ci) => th.addEventListener('click', () => {
        const dir = th.classList.contains('asc') ? -1 : 1;
        ths.forEach((x) => x.classList.remove('asc', 'desc'));
        th.classList.add(dir > 0 ? 'asc' : 'desc');
        const tb = t.tBodies[0];
        const rows = [...tb.rows];
        const val = (r) => { const c = r.cells[ci]; const v = c ? (c.dataset.v ?? c.textContent) : ''; const n = Number(v); return v !== '' && !Number.isNaN(n) ? n : v; };
        rows.sort((a, b) => { const x = val(a), y = val(b); return (typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), LANG === 'en' ? 'en' : 'zh-CN')) * dir; });
        for (const r of rows) tb.appendChild(r);
      }));
    }
    for (const a of $$('[data-jump]', root)) a.addEventListener('click', (e) => { e.preventDefault(); const el = document.getElementById(a.dataset.jump); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
  }
  // the header, menu and footer: their Chinese is kept in data-zh and painted in the page language
  function paintShell() {
    document.documentElement.lang = LANG === 'en' ? 'en' : 'zh-CN';
    for (const el of $$('[data-zh]')) el.textContent = LANG === 'en' && el.dataset.en ? el.dataset.en : tr(el.dataset.zh);
    for (const el of $$('[data-zh-ph]')) el.placeholder = tr(el.dataset.zhPh);
    for (const el of $$('[data-zh-al]')) el.setAttribute('aria-label', tr(el.dataset.zhAl));
    const b = $('#langBtn');
    if (b) { b.hidden = !HAS_EN; b.textContent = LANG === 'en' ? '中文' : 'EN'; b.title = LANG === 'en' ? '切换到中文' : 'Switch to English'; }
  }
  function setLang(l) {
    if (l === LANG || (l === 'en' && !HAS_EN)) return;
    LANG = l;
    store.set('lang', l);
    NAMES = null;
    paintShell();
  }

/* ---- 01-search.js ---- */
  // ------------------------------------------------------------------ search: every name a page exists for, in both
  // languages, with pinyin (full and initials)
  const CAT_TXT = { use: '消耗品', weapon: '武器', armor: '防具', acc: '饰品', key: '重要物品', seru: '圣瑟鲁装备' };
  const KIND_TXT = { item: '物品', mon: '怪物', spell: '魔法', art: '招式', place: '地点', npc: '人物', ch: '攻略' };
  const T_ORDER = ['item', 'mon', 'spell', 'art', 'place', 'npc', 'ch'];
  let SIDX = null;
  function searchIndex() {
    if (SIDX) return SIDX;
    SIDX = [];
    const py = X.py || {};
    const both = (f) => { const l = LANG; LANG = 'zh'; const zh = f(); LANG = 'en'; const en = f(); LANG = l; return [zh, en]; };
    const add = (t, f, h, x, pyKey) => { const [zh, en] = both(f); SIDX.push({ t, zh, en: en === zh ? '' : en, py: py[pyKey || zh] || '', h, x }); };
    for (const id of Object.keys(IT.items)) {
      if (!D.items[id]) continue;
      add('item', () => itemName(id), `#item-${id}`, () => catName(IT.items[id].c), D.items[id].zh);
      SIDX[SIDX.length - 1].py = IT.items[id].py || SIDX[SIDX.length - 1].py;
    }
    for (const [id, m] of Object.entries(D.mons)) add('mon', () => monName(id), `#mon-${id}`, () => T`${elName(m.el)}属性 · HP ${num(m.hp)}`, m.n);
    for (const [id, s] of Object.entries(D.spells)) {
      if (!s.zh || s.zh === '魔法') continue;
      add('spell', () => spellName(id), `#spell-${id}`, () => (s.mp ? `MP ${s.mp}` : ''), s.zh);
    }
    D.arts.forEach((rows, c) => rows.forEach((a) => add('art', () => artName(a), `#arts-${c}`, () => charName(c), a.zh)));
    for (const s of D.supers) add('art', () => artName(s), `#arts-${s.char}`, () => T`${charName(s.char)} · 连携招式`, s.zh);
    for (const P of PL.values()) {
      if (P.cut) continue;
      add('place', () => P.name, `#place-${P.key}`, () => (P.ch.length ? chLabel(P.ch[0]) : ''), P.zh);
    }
    GUIDE.ch.forEach((c, i) => add('ch', () => T`第${i + 1}章 ${chName(i)}`, `#ch-${i + 1}`, () => regionName(c.region), c.name));
    const seen = new Set();
    NPC.npcs.forEach((e, i) => {
      if (!e.n || seen.has(e.n)) return;
      seen.add(e.n);
      add('npc', () => npcName(e), `#npc-${i}`, () => placeName(e.s), e.n);
    });
    for (const s of SIDX) { s.lz = s.zh.toLowerCase(); s.le = (s.en || '').toLowerCase(); }
    return SIDX;
  }
  const hitName = (s) => (isEn() && s.en ? s.en : s.zh);
  const hitOther = (s) => (isEn() ? (s.en ? s.zh : '') : s.en);
  function search(q0) {
    const q = q0.trim().toLowerCase();
    if (!q) return [];
    const ascii = /^[a-z0-9 '.\-]+$/.test(q);
    const out = [];
    for (const s of searchIndex()) {
      let sc = 0;
      if (s.lz === q || s.le === q) sc = 100;
      else if (s.lz.startsWith(q)) sc = 80;
      else if (s.lz.includes(q)) sc = 60;
      if (ascii) {
        const [full, ini] = (s.py || '').split('|');
        const qq = q.replace(/[\s'.\-]+/g, '');
        if (s.le.startsWith(q)) sc = Math.max(sc, isEn() ? 85 : 52);
        else if (s.le.includes(q)) sc = Math.max(sc, isEn() ? 62 : 40);
        if (ini && ini === qq) sc = Math.max(sc, 70);
        if (full && full.startsWith(qq)) sc = Math.max(sc, 55);
        if (ini && ini.startsWith(qq)) sc = Math.max(sc, 50);
        if (full && full.includes(qq)) sc = Math.max(sc, 30);
      }
      if (sc) out.push({ s, sc });
    }
    out.sort((a, b) => (b.sc - a.sc) || (T_ORDER.indexOf(a.s.t) - T_ORDER.indexOf(b.s.t)) || (hitName(a.s).length - hitName(b.s).length));
    return out.map((o) => o.s);
  }
  let lastQuery = store.get('q', '');
  function setupSearch() {
    const inp = $('#q'), box = $('#sugg');
    let cur = -1, hits = [];
    const close = () => { box.hidden = true; cur = -1; };
    const show = () => {
      const q = inp.value.trim();
      if (!q) { close(); return; }
      hits = search(q);
      const top = hits.slice(0, 10);
      box.innerHTML = top.map((s, i) => `<a href="${s.h}" data-i="${i}"><span class="t">${esc(tr(KIND_TXT[s.t]))}</span><span>${esc(hitName(s))}</span><span class="x">${esc(s.x() || hitOther(s) || '')}</span></a>`).join('')
        + (hits.length ? `<a class="all" href="#search">${T`查看全部 ${hits.length} 个结果`}</a>` : `<div class="empty small">${T`没有找到`}</div>`);
      box.hidden = false;
      cur = -1;
    };
    inp.addEventListener('input', () => { lastQuery = inp.value; store.set('q', lastQuery); show(); });
    inp.addEventListener('focus', show);
    inp.addEventListener('keydown', (e) => {
      const links = $$('a', box);
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (box.hidden) show();
        cur = (cur + (e.key === 'ArrowDown' ? 1 : -1) + links.length) % Math.max(1, links.length);
        links.forEach((a, i) => a.classList.toggle('on', i === cur));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const a = cur >= 0 ? links[cur] : null;
        lastQuery = inp.value;
        store.set('q', lastQuery);
        location.hash = a ? a.getAttribute('href') : '#search';
        if (!a && parseHash().name === 'search') render();
        close();
        inp.blur();
      } else if (e.key === 'Escape') { close(); inp.blur(); }
    });
    box.addEventListener('mousedown', (e) => e.preventDefault());
    box.addEventListener('click', (e) => { if (e.target.closest('a')) { lastQuery = inp.value; close(); } });
    inp.addEventListener('blur', () => setTimeout(close, 120));
    inp.value = lastQuery;
  }
  PAGES.search = () => {
    const q = lastQuery.trim();
    const res = q ? search(q) : [];
    let h = `<h1>${T`搜索`}</h1><div class="h1sub">${q ? T`${q2(esc(q))}共 ${res.length} 个结果` : T`在上面的搜索框输入名字（中文、拼音、拼音首字母或英文名都可以）`}</div>`;
    for (const t of T_ORDER) {
      const g = res.filter((s) => s.t === t);
      if (!g.length) continue;
      h += h2('s-' + t, `${tr(KIND_TXT[t])}（${g.length}）`);
      h += `<ul class="plain">${g.map((s) => `<li><a href="${s.h}">${esc(hitName(s))}</a> <span class="faint small">${esc([hitOther(s), s.x()].filter(Boolean).join(' · '))}</span></li>`).join('')}</ul>`;
    }
    return { title: T`搜索`, html: h };
  };

/* ---- 10-items.js ---- */
  // ------------------------------------------------------------------ 物品
  // equipment: [INT, ATK, UDF, LDF, SPD, who mask, slot 0 body / 1 head / 2 weapon / 3 legs, Ra-Seru]
  const RARE = [118, 114, 115, 116, 117, 110, 111, 112, 113, 191, 247, 229, 204, 248, 249, 250, 205, 236, 196, 197, 233,
    234, 231, 230, 208, 206, 207, 220, 228, 235, 240, 239, 209, 88, 255, 254, 237, 244, 245, 246, 107];
  const ITEM_CATS = [['all', '全部'], ['rare', '稀有·隐藏'], ['use', '消耗品'], ['weapon', '武器'], ['armor', '防具'], ['acc', '饰品'], ['key', '重要物品'], ['seru', '圣瑟鲁装备']];
  const SLOT_TXT = { 0: '身体', 1: '头部', 2: '武器', 3: '脚部' };
  const slotName = (s) => tr(SLOT_TXT[s]);
  const catName = (c) => tr(CAT_TXT[c] || '');
  const EQ_STAT = [[1, '攻击'], [2, '上防'], [3, '下防'], [4, '速度'], [0, '智力']];
  const eqOf = (id) => (IT.eq[id] || null);
  const whoMask = (m) => [0, 1, 2].filter((i) => m & (1 << i));
  function eqStats(e) {
    return EQ_STAT.filter(([k]) => e[k]).map(([k, t]) => `${tr(t)}${e[k] > 0 ? '+' : ''}${e[k]}`).join(' ');
  }
  // the weapon hand's command cost with a weapon (swing record +0x74): 30 favoured class, 42 off-class, 54 far off
  function armCost(chi, id) {
    const sec = D.weapon_slot[chi];
    const tbl = IT.sw && IT.sw[chi] && IT.sw[chi][sec];
    const rows = tbl ? (tbl[id] || tbl['0']) : null;
    const r = rows && rows.find((x) => x[0] === (sec === 2 ? 0x0C : 0x0D));
    return r ? r[2] : CMD_COST;
  }
  const passiveOf = (id) => { const p = IT.acc[id]; return p !== undefined && IT.pas[p] ? { i: p, party: !!IT.pas[p][0], name: tr(IT.pas[p][1]), desc: tr(IT.pas[p][2]) } : null; };
  const itemDesc = (id) => { const d = ((D.items[id] && D.items[id].desc) || '').replace(/\s+/g, ''); return d && d !== '饰品' ? tr(d) : ''; };
  function itemBrief(id) {
    const e = eqOf(id);
    const c = IT.items[id] && IT.items[id].c;
    if (c === 'seru') return tr((IT.items[id].fx || [''])[0].replace(/；可装备.*$/, '').replace(/^武器装备：/, ''));
    if (e && (c === 'weapon' || c === 'armor')) return `${slotName(e[6])} ${eqStats(e)}`;
    const p = passiveOf(id);
    if (p) return p.name;
    return itemDesc(id);
  }
  // one scene's shops with the same stock at the same price and terms: one entry naming every shop and spot
  function mergeShops(src) {
    const out = [], seen = new Map();
    for (const q of src) {
      if (q.t !== 'shop' && q.t !== 'plat') { out.push(q); continue; }
      const k = JSON.stringify([q.t, q.s, q.$, q.cur, q.alt || [], q.unv || 0, q.warn || '', q.when || '', q.miss || [], q.closed || [], q.until ?? -1]);
      const m = seen.get(k);
      if (m) { if (!m.ns.includes(q.n)) m.ns.push(q.n); m.spots.push(q); continue; }
      const c = Object.assign({}, q, { ns: [q.n], spots: [q] });
      seen.set(k, c);
      out.push(c);
    }
    for (const c of out) if (c.ns && c.ns.length > 1) delete c.near;
    return out;
  }
  // one spot found in several story versions of a place: one block with the whole window
  const srcGroupKey = (q) => (ONE_T.includes(q.t) && (q.w || q.how) ? [q.t, q.p, q.how || '', q.w ? q.w.join(',') : ''].join('|') : null);
  const onceKey = (q) => (q.once || []).slice().sort((a, b) => a - b).join(',');
  function srcBlocks(src) {
    const used = new Set(), out = [];
    src.forEach((q, i) => {
      if (used.has(i)) return;
      used.add(i);
      const g = [q], k = srcGroupKey(q);
      if (k) src.forEach((z, j) => {
        if (!used.has(j) && srcGroupKey(z) === k && onceKey(z) === onceKey(q) && !g.some((y) => y.s === z.s)) { used.add(j); g.push(z); }
      });
      out.push(g.length > 1 ? g.slice().sort((a, b) => (a.ch || 0) - (b.ch || 0)) : g);
    });
    return out;
  }
  const exOnce = (q) => (q.once && q.once.length) || q.fbit !== undefined;
  const isOneTime = (q) => ONE_T.includes(q.t) || q.t === 'craft';
  const recKey = (q) => (q.k ? q.k.split(':').slice(0, 4).join(':') : '');
  // one-time sources that share a "taken" record are ONE copy: whichever way is taken first, the others are gone (the
  // Disco King's Speed Chain by talk or by lesson, the Octam mayor's Slow Chain in either version of the town, the
  // cabinets that share one record, the quiz that pays 10 or 5 by the answers). Each copy is a list of srcBlocks blocks.
  function copyGroups(src) {
    const blocks = srcBlocks(src);
    const par = blocks.map((_, i) => i);
    const find = (i) => (par[i] === i ? i : (par[i] = find(par[i])));
    const join = (a, b) => { a = find(a); b = find(b); if (a !== b) par[Math.max(a, b)] = Math.min(a, b); };
    for (let i = 0; i < blocks.length; i++) {
      for (let j = i + 1; j < blocks.length; j++) {
        const a = blocks[i][0], b = blocks[j][0];
        if (!isOneTime(a) || !isOneTime(b)) continue;
        const oa = a.once || [], ob = b.once || [];
        if (oa.length && ob.length) { if (oa.some((f) => ob.includes(f))) join(i, j); } else if (recKey(a) && recKey(a) === recKey(b) && (oa.length || ob.length)) join(i, j);
      }
    }
    const by = new Map();
    blocks.forEach((g, i) => { const r = find(i); if (!by.has(r)) by.set(r, []); by.get(r).push(g); });
    return [...by.values()];
  }
  const copyQty = (alts) => Math.max(...alts.map((g) => g[0].q || 1));
  const ACQ_KIND = { shop: '购买', plat: '白金卡', casino: '赌场', fish: '钓鱼', box: '宝箱', box2: '宝箱', floor: '宝箱', hid: '宝箱',
    obj: '拾取', npc: '剧情', evt: '剧情', craft: '加工', drop: '掉落', steal: '偷取', raseru: '圣瑟鲁' };
  const ACQ_ORDER = ['购买', '白金卡', '赌场', '钓鱼', '宝箱', '拾取', '剧情', '加工', '掉落', '偷取', '圣瑟鲁'];
  // price, how it is had, how many there are - the same three facts for every item
  function itemAcq(id) {
    const it = IT.items[id];
    const buy = it.src.filter((q) => (q.t === 'shop' || q.t === 'plat') && !q.unv);
    const minPrice = buy.length ? Math.min(...buy.map((q) => q.$ || 0)) : null;
    const kinds = uniq(it.src.map((q) => (q.unv ? '白金卡？' : ACQ_KIND[q.t])).filter(Boolean))
      .sort((a, b) => ACQ_ORDER.indexOf(a.replace('？', '')) - ACQ_ORDER.indexOf(b.replace('？', '')));
    const mobs = (q) => ((q.t === 'drop' || q.t === 'steal') ? q.m || [] : []);
    const unlimited = it.src.some((q) => ((q.t === 'shop' || q.t === 'plat') && !q.unv) || mobs(q).some((m) => !m[3])
      || ((q.t === 'casino' || q.t === 'fish') && !exOnce(q)));
    const one = it.src.filter((q) => ONE_T.includes(q.t) || q.t === 'craft' || ((q.t === 'casino' || q.t === 'fish') && exOnce(q)));
    const n = (one.length ? copyGroups(one).reduce((a, alts) => a + copyQty(alts), 0) : 0) + it.src.reduce((a, q) => a + mobs(q).filter((m) => m[3]).length, 0);
    const kt = kinds.map((k) => (k.endsWith('？') ? tr(k.slice(0, -1)) + '?' : tr(k)));
    return {
      price: minPrice, kinds, how: kinds.length ? (kinds.length === 1 ? T`仅${kt[0]}` : kt.join('/')) : T`拿不到`,
      qty: unlimited ? T`无限量` : n ? T`限量·${n}` : '', unlimited, n: unlimited ? 9999 : n,
    };
  }
  const priceCell = (a) => td(a.price === null ? 1e9 : a.price, a.price === null ? `<span class="faint">${T`非卖品`}</span>` : num(a.price) + 'G', 'num');
  function monRows(s, kind) {
    return s.m.map(([mid, p, where, boss]) => {
      let eff = '';
      if (kind === 'drop' && p < 100) eff = T`（不戴青铜之书时实际约 ${p / 4 >= 1 ? Math.round(p / 4) : (p / 4).toFixed(1)}%，戴上 ${Math.min(100, p + 30)}%）`;
      else if (kind === 'steal') eff = T`（戴青铜之书 ${Math.min(100, p * 2)}%）`;
      return `${aMon(mid)} <b>${p}%</b>${eff ? `<span class="faint small">${eff}</span>` : ''}${where.length ? `<span class="faint small"> · ${esc(list(where.map(tr)))}${boss ? T`（头目）` : ''}</span>` : ''}`;
    }).join('<br>');
  }
  const dropNote = () => T`战斗胜利后按几率掉落，一场战斗最多掉 1 件。没戴青铜之书时，除了必掉的，还要再过一道 1/4 的判定；戴上后每个敌人的掉落率 +30%、不再打折。`;
  const stealNote = () => T`要戴「邪神像」：戴的人用攻击（普通攻击或招式）打倒敌人时判定。青铜之书让偷窃率 ×2。`;
  const altList = (alts) => `<div class="src-b"><div class="faint small">${T`条件（满足下面任意一组即可）：`}</div>${alts.map((a, i) => `<div class="alt"><b>${circled(i)}</b>${a.map(condHtml).join('')}</div>`).join('')}</div>`;
  function srcHtml(s, id, opt) {
    const o = opt || {};
    const spots = o.spots || s.spots || [s];
    const many = spots.length > 1 && uniq(spots.map((x) => (x.w ? x.w.join(',') : ''))).length > 1;
    let h = `<div class="src"><div class="src-h">${o.name || ''}${pill(tr(SRC_T[s.t] || s.t), 'src-t acc')}<span>${srcHead(s)}</span>${many && ONE_T.includes(s.t) ? pill(T`${spots.length} 处`, '') : ''}${s.t === 'casino' || s.t === 'fish' ? (exOnce(s) ? pill(T`限一次`, 'lim') : '') : ''}</div>`;
    const wh = srcWhere(s, !!(o.window || o.noWhen));
    if (wh) h += `<div class="src-b">${wh}${s.s && spots.some((x) => x.w) ? ' · ' + spotLinks(spots) : ''}</div>`;
    if (o.window) h += `<div class="src-b warn small">${esc(o.window)}</div>`;
    if (s.t === 'drop') h += `<div class="src-b">${monRows(s, 'drop')}</div><div class="src-b note">${dropNote()}</div>`;
    else if (s.t === 'steal') h += `<div class="src-b">${monRows(s, 'steal')}</div><div class="src-b note">${stealNote()}</div>`;
    else {
      const alts = srcAlts(s);
      if (alts.length === 1) h += `<div class="src-b"><span class="gm">${T`条件`}</span>${alts[0].map(condHtml).join('')}</div>`;
      else if (alts.length > 1) h += altList(alts);
      if (s.x) h += `<div class="src-b">${s.t === 'fish' ? `<span class="small faint">${esc(tr(s.x))}</span>` : `<span class="quote">${esc(tr(s.x))}</span>`}</div>`;
    }
    if (s.warn) h += `<div class="src-b small bad">${esc(tr(s.warn))}</div>`;
    if (!o.window && isLimited(s)) h += `<div class="src-b small warn">${T`限时：${deadline(s)}就拿不到了`}</div>`;
    if (s.share && s.share.length && !o.inAlt) h += `<div class="src-b small warn">${T`这个柜子和${list(s.share.slice(0, 4).map(tr))}的柜子共用同一个“已拿”记录：拿了其中一个，其余的都会变空。`}</div>`;
    return h + '</div>';
  }
  const winStart = (q) => (q && q.when ? q.when.split('，或')[0].replace(/到第二天出发前$/, '') : '');
  function srcGroupHtml(g, id, opt) {
    if (g.length === 1) return srcHtml(g[0], id, opt);
    const a = winStart(g[0]), last = g[g.length - 1], dl = isLimited(last) ? deadline(last) : '';
    const from = a ? T`从${q2(tr(a))}起` : T`一直`;
    const win = a || dl ? (dl ? T`可以拿的时期：${from}，${dl}就拿不到了` : T`可以拿的时期：${from}，之后一直都能拿`) : '';
    return srcHtml(g[0], id, Object.assign({ window: win, noWhen: true }, opt || {}));
  }
  // one copy with several ways to it: one block, the ways numbered inside
  function altWrap(head, ways) {
    return `<div class="src alts"><div class="src-h">${head}</div>${ways.map((w, i) => `<div class="alt-b"><b class="alt-n">${circled(i)}</b><div>${w}</div></div>`).join('')}</div>`;
  }
  function altHead(alts) {
    const places = uniq(alts.map((g) => g[0].s ? PL_OF[g[0].s] : g[0].p || ''));
    return places.length > 1 || alts.some((g) => g[0].share && g[0].share.length)
      ? T`这 ${alts.length} 处共用同一个“已拿”记录：全游戏只能拿到其中一处的`
      : T`同一件东西，${alts.length} 种拿法任选一种（拿了一种，另一种就没有了）`;
  }
  function altHtml(alts, id, opt) {
    const o = opt || {};
    if (alts.length === 1) return srcGroupHtml(alts[0], id, o);
    return altWrap(`${o.name || ''}${pill(T`只有一件`, 'lim')}<span>${esc(altHead(alts))}</span>`, alts.map((g) => srcGroupHtml(g, id, { inAlt: true })));
  }
  // the same way at several spots (three chests with the same thing in one place): one block, the spots numbered
  const sameWayKey = (alts) => (alts.length === 1 && alts[0].length === 1 && ONE_T.includes(alts[0][0].t)
    ? JSON.stringify(Object.assign({}, alts[0][0], { s: PL_OF[alts[0][0].s] || alts[0][0].s, w: 0, k: 0, once: 0, fbit: 0, spots: 0, ch: 0 })) : null);
  function mergeSpots(groups) {
    const out = [], by = new Map();
    for (const alts of groups) {
      const k = sameWayKey(alts);
      if (k && by.has(k)) { by.get(k).spots.push(alts[0][0]); continue; }
      const e = { alts, spots: [alts[0][0]] };
      if (k) by.set(k, e);
      out.push(e);
    }
    return out;
  }
  // one person handing the same thing over at several story moments (no "taken" record): one entry, the moments numbered
  function mergeMulti(entries) {
    const out = [], by = new Map();
    for (const e of entries) {
      const q = e.alts.length === 1 && e.alts[0].length === 1 && (!e.spots || e.spots.length === 1) ? e.alts[0][0] : null;
      const k = q && isOneTime(q) && !exOnce(q) && recKey(q) ? JSON.stringify([recKey(q), (e.items || []).map((x) => [x.id, x.n])]) : null;
      if (k && by.has(k)) { const m = by.get(k); m.alts.push(...e.alts); m.multi = true; continue; }
      const c = Object.assign({}, e, { alts: e.alts.slice() });
      if (k) by.set(k, c);
      out.push(c);
    }
    return out;
  }
  const multiHead = (n) => T`同一个人在 ${n} 个不同时机各给一次（每次都能拿到）`;
  const SRC_ORDER = ['npc', 'evt', 'obj', 'box', 'box2', 'floor', 'hid', 'craft', 'shop', 'plat', 'casino', 'fish', 'drop', 'steal', 'raseru', 'none'];
  function sourcesHtml(id) {
    const it = IT.items[id];
    const groups = copyGroups(mergeShops(it.src)).map((alts, i) => ({ alts, i, k: SRC_ORDER.indexOf(alts[0][0].t) }))
      .sort((a, b) => (a.k - b.k) || ((a.alts[0][0].ch || 0) - (b.alts[0][0].ch || 0)) || (a.i - b.i));
    return mergeMulti(mergeSpots(groups.map((x) => x.alts))).map((e) => (e.multi ? altWrap(`<span>${esc(multiHead(e.alts.length))}</span>`, e.alts.map((g) => srcGroupHtml(g, id, { inAlt: true })))
      : e.spots.length > 1 ? srcHtml(e.alts[0][0], id, { spots: e.spots }) : altHtml(e.alts, id))).join('')
      || `<p class="muted">${T`游戏里没有找到获得途径。`}</p>`;
  }
  // gives of a place / person: one entry per copy; different things handed over by the very same ways are one entry
  // (several items in one give), and one thing with several ways to it is one entry with the ways numbered
  const wayKey = (q) => JSON.stringify([recKey(q) || [q.t, q.s, q.how || q.n || ''], q.alt || [], q.t]);
  function giveEntries(gives) {
    const byItem = new Map();
    for (const o of gives) { if (!byItem.has(o.id)) byItem.set(o.id, []); byItem.get(o.id).push(o.q); }
    const entries = [];
    for (const [id, srcs] of byItem) {
      for (const alts of copyGroups(srcs)) entries.push({ items: [{ id, n: copyQty(alts) }], alts, sig: alts.map((g) => wayKey(g[0])).sort().join('|'), ch: Math.min(...alts.map((g) => g[0].ch || 0)) });
    }
    const out = [];
    for (const e of entries) { const m = out.find((x) => x.sig === e.sig); if (m) m.items.push(...e.items); else out.push(e); }
    return mergeMulti(out).sort((a, b) => a.ch - b.ch);
  }
  function giveHtml(e) {
    const name = `<b class="gname">${list(e.items.map((x) => `${aItem(x.id)}${x.n > 1 ? ` ×${x.n}` : ''}`))}</b>`;
    const one = (q) => Object.assign({}, q, { q: 1 });
    if (e.multi) return altWrap(`${name}<span>${esc(multiHead(e.alts.length))}</span>`, e.alts.map((g) => srcGroupHtml(g.map(one), e.items[0].id, { inAlt: true })));
    if (e.alts.length === 1) return srcGroupHtml(e.alts[0].map(one), e.items[0].id, { name });
    return altWrap(`${name}${pill(T`只有一件`, 'lim')}<span>${esc(altHead(e.alts))}</span>`, e.alts.map((g) => srcGroupHtml(g.map(one), e.items[0].id, { inAlt: true })));
  }
  function bookOf(id) {
    for (const [c, m] of Object.entries(D.art_books || {})) for (const [tier, b] of Object.entries(m)) if (b === Number(id)) return { c: Number(c), idx: Number(tier) };
    return null;
  }
  const artRow = (c, idx) => (D.arts[c] || []).find((a) => a.idx === idx) || null;

  PAGES.item = ([id]) => {
    const it = IT.items[id], x = D.items[id];
    if (!it || !x) return null;
    const cat = catName(it.c);
    const e = eqOf(id), p = passiveOf(id), a = itemAcq(id);
    const other = isEn() ? x.zh : x.en;
    const rows = [[T`类别`, esc(cat)], other ? [isEn() ? 'Chinese name' : '英文名', `<i>${esc(other)}</i>`] : null,
      [T`价格`, a.price !== null ? T`商店 ${num(a.price)}G` : T`非卖品`], [T`卖出`, x.price ? `${num(x.price >> 1)}G` : T`不能卖`],
      [T`获得方式`, esc(a.how)], a.qty ? [T`数量`, esc(a.unlimited ? T`无限量（能买 / 能反复换 / 野外怪物身上有）` : T`全游戏 ${a.n} 个`)] : null];
    if (e && it.c !== 'seru') {
      rows.push({ sec: T`装备` }, [T`部位`, esc(slotName(e[6]))], [T`能力`, esc(eqStats(e)) || '—'], [T`可装备`, list(whoMask(e[5]).map((c) => aChar(c)))]);
    }
    if (p) rows.push({ sec: T`饰品效果` }, [T`效果`, `<b>${esc(p.name)}</b><br><span class="small muted">${esc(p.desc)}</span>`]);
    if (it.c === 'seru') rows.push({ sec: T`圣瑟鲁` }, [T`等级`, `Lv${x.lv}`]);
    let h = crumbs([home(), ['items', T`物品`], [`items-${it.c}`, cat]]);
    h += `<h1>${esc(itemName(id))}</h1><div class="h1sub">${other ? `<span class="en">${esc(other)}</span> · ` : ''}${esc(cat)}</div>`;
    h += infobox(itemName(id), esc(cat), rows);
    const desc = itemDesc(id);
    if (desc) h += `<p class="lede">${esc(desc)}</p>`;
    if (it.fx && it.fx.length) h += h2('fx', T`效果`) + `<ul class="bul">${it.fx.map((f) => `<li>${esc(tr(f))}</li>`).join('')}</ul>`;
    const bk = bookOf(id);
    if (bk) {
      const r = artRow(bk.c, bk.idx);
      h += `<p>${T`在道具菜单里使用，${aChar(bk.c)}就学会超级招式${q2(`<a href="#arts-${bk.c}">${esc(artName(r))}</a>`)}${r ? T`（指令 ${keys(r.cmd)}，AP ${r.ap}）` : ''}。超级招式只能这样学，战斗中输入学不会。`}</p>`;
    }
    if (e && it.c === 'weapon') {
      const who = whoMask(e[5]);
      h += h2('hand', T`武器手指令消耗`) + `<p class="note">${T`每回合能输入的指令按敏捷算，每个方向消耗 30。拿不擅长的武器时，武器手方向（瓦恩、加拉是 ←，诺娅是 →）每按一次要消耗更多，一回合能输入的指令就少了。`}</p>`
        + table([T`角色`, [T`武器手`, 'c'], [T`每次消耗`, 'num'], T`说明`], who.map((c) => {
          const cost = armCost(c, Number(id));
          return `<tr><td>${aChar(c)}</td><td class="c">${WEAPON_HAND[c]}</td><td class="num">${cost}</td><td class="small">${cost <= CMD_COST ? `<span class="good">${T`擅长的武器`}</span>` : cost < 54 ? `<span class="warn">${T`不擅长`}</span>` : `<span class="bad">${T`很不擅长`}</span>`}</td></tr>`;
        }), { cls: 'compact' });
    }
    if (Number(id) === 137) {
      const names = uniq((D.doors || []).map((d) => d.zh));
      h += h2('wind', T`可以去的地方`) + `<p>${T`使用后瞬间回到去过的这些地方之一（要先去过才会出现在列表里）：${list(names.map((n) => { const P = placeByZh(n); return P ? aPlace(P.key) : esc(tr(n)); }))}。`}</p>`;
    }
    h += h2('src', T`获得方法`) + sourcesHtml(id);
    if (it.use && it.use.length) {
      h += h2('use', T`用途`) + `<ul class="bul">${it.use.map(([pl, n, k, s]) => `<li>${s ? aPlace(s) : esc(tr(pl))}${n ? colon() + esc(tr(n)) : ''} <span class="faint small">${k === 'take' ? T`（会被拿走 / 用掉）` : T`（要带在身上）`}</span></li>`).join('')}</ul>`;
    }
    if (it.note && it.note.length) h += h2('note', T`备注`) + `<ul class="bul">${it.note.map((n) => `<li>${esc(tr(n))}</li>`).join('')}</ul>`;
    return { title: itemName(id), html: h };
  };

  PAGES.items = ([cat]) => {
    const c = ITEM_CATS.some(([k]) => k === cat) ? cat : 'all';
    let ids = Object.keys(IT.items).filter((id) => D.items[id]);
    if (c === 'rare') ids = RARE.map(String).filter((id) => IT.items[id]);
    else if (c !== 'all') ids = ids.filter((id) => IT.items[id].c === c);
    const CAT_ORDER = ['use', 'weapon', 'armor', 'acc', 'key', 'seru'];
    if (c === 'all') ids.sort((a, b) => (CAT_ORDER.indexOf(IT.items[a].c) - CAT_ORDER.indexOf(IT.items[b].c)) || (a - b));
    const rows = ids.map((id) => {
      const a = itemAcq(id);
      return `<tr>${td(itemName(id), aItem(id), 'cell-n')}${td(catName(IT.items[id].c), undefined, 'nw')}${td(itemBrief(id), `<span class="small">${esc(itemBrief(id))}</span>`)}`
        + `${priceCell(a)}${td(a.how, `<span class="small">${esc(a.how)}</span>`)}${td(a.n, `<span class="small">${esc(a.qty)}</span>`, 'num')}</tr>`;
    });
    let h = crumbs([home(), ['', T`物品`]]) + `<h1>${T`物品`}</h1><div class="h1sub">${T`全部 ${Object.keys(IT.items).length} 种，含装备、饰品和重要物品。点名字看作用（包括游戏里不显示的实际数值）和每一种拿法。`}</div>`;
    h += `<div class="chips">${ITEM_CATS.map(([k, t]) => `<a href="#items-${k}" class="${k === c ? 'on' : ''}">${esc(tr(t))}</a>`).join('')}</div>`;
    h += `<p class="note">${T`价格是商店的最低价（卖出得一半）；“限量·N”是全游戏只有 N 个，“无限量”是能买、能反复兑换或野外怪物身上有。表头可以点击排序。`}${c === 'rare' ? T`“稀有·隐藏”是商店不卖、容易错过或藏得深的东西。` : ''}</p>`;
    h += table([T`名称`, T`类别`, T`简介`, [T`价格`, 'num'], T`获得`, [T`数量`, 'num']], rows, { sort: true });
    return { title: T`物品`, html: h };
  };

  PAGES.equip = () => {
    const slots = [[2, 'weapon', T`武器`], [0, 'armor', T`身体（铠甲 / 衣服）`], [1, 'armor', T`头部`], [3, 'armor', T`脚部`]];
    let h = crumbs([home(), ['', T`武器与防具`]]) + `<h1>${T`武器与防具`}</h1><div class="h1sub">${T`每件装备的实际能力值，和谁能装备。`}</div>`;
    h += `<p class="note">${T`武器一栏的“瓦恩 / 诺娅 / 加拉”写的是这个人拿它时武器手每按一次的指令消耗：30 是擅长的武器，42、54 是不擅长（每回合能输入的指令变少）。圣瑟鲁装备见<a href="#items-seru">圣瑟鲁装备</a>。`}</p>`;
    h += toc(slots.map(([s, , t]) => ['eq' + s, t]));
    for (const [slot, cat, t] of slots) {
      const ids = Object.keys(IT.items).filter((id) => IT.items[id].c === cat && eqOf(id) && eqOf(id)[6] === slot);
      const rows = ids.map((id) => {
        const e = eqOf(id), a = itemAcq(id);
        const who = [0, 1, 2].map((c) => {
          if (!(e[5] & (1 << c))) return td(-1, '<span class="faint">—</span>', 'c');
          if (slot !== 2) return td(1, '✓', 'c');
          const cost = armCost(c, Number(id));
          return td(cost, cost <= CMD_COST ? '<span class="good">30</span>' : `<span class="warn">${cost}</span>`, 'c');
        }).join('');
        return `<tr>${td(itemName(id), aItem(id), 'cell-n')}${[1, 2, 3, 4, 0].map((k) => td(e[k], e[k] ? num(e[k]) : '<span class="faint">·</span>', 'num')).join('')}${who}`
          + `${priceCell(a)}${td(a.how, `<span class="small">${esc(a.how)}</span>`)}</tr>`;
      });
      h += h2('eq' + slot, `${t}（${ids.length}）`) + table([T`名称`, [T`攻击`, 'num'], [T`上防`, 'num'], [T`下防`, 'num'], [T`速度`, 'num'], [T`智力`, 'num'], [charName(0), 'c'], [charName(1), 'c'], [charName(2), 'c'], [T`价格`, 'num'], T`获得`], rows, { sort: true });
    }
    return { title: T`武器与防具`, html: h };
  };

  PAGES.acc = () => {
    const ids = Object.keys(IT.items).filter((id) => passiveOf(id) && (IT.items[id].c === 'acc' || IT.items[id].c === 'key'));
    const rows = ids.map((id) => {
      const p = passiveOf(id), a = itemAcq(id);
      return `<tr>${td(itemName(id), aItem(id), 'cell-n')}${td(p.name, `<b>${esc(p.name)}</b>`)}${td(p.desc, `<span class="small">${esc(p.desc)}</span>`)}`
        + `${priceCell(a)}${td(a.how, `<span class="small">${esc(a.how)}</span>`)}${td(a.n, `<span class="small">${esc(a.qty)}</span>`, 'num')}</tr>`;
    });
    // the same effect on several items
    const by = new Map();
    for (const id of ids) { const p = passiveOf(id); if (!by.has(p.i)) by.set(p.i, []); by.get(p.i).push(id); }
    const twins = [...by.values()].filter((l) => l.length > 1);
    let h = crumbs([home(), ['', T`饰品`]]) + `<h1>${T`饰品`}</h1><div class="h1sub">${T`每件饰品（以及能当饰品戴的护符、蛋、宝石）的效果。`}</div>`;
    h += `<p class="note">${T`每人可以戴 3 件饰品。一些效果只要队伍里有一个人戴着就对全队生效（例如青铜之书、黄金之书、幸运铃），详细数值见每件饰品的页面。`}</p>`;
    h += table([T`名称`, T`效果`, T`说明`, [T`价格`, 'num'], T`获得`, [T`数量`, 'num']], rows, { sort: true });
    if (twins.length) h += h2('twins', T`效果完全相同的饰品`) + `<ul class="bul">${twins.map((l) => `<li><b>${esc(passiveOf(l[0]).name)}</b>${colon()}${list(l.map((id) => aItem(id)))}</li>`).join('')}</ul>`;
    return { title: T`饰品`, html: h };
  };

/* ---- 20-mons.js ---- */
  // ------------------------------------------------------------------ 怪物
  // battle values: the loader boosts the record (FUN_80054CB0) - random encounters UDF / LDF x7/4 and INT x5/4, scripted
  // fights (bosses) ATK x5/4, UDF / LDF x2, INT x9/8; HP / MP / SPD / AGL are used as they are
  function monBattle(m, scripted) {
    const [atk, udf, ldf, spd, int, agl] = m.st || [0, 0, 0, 0, 0, 0];
    return scripted
      ? { atk: atk + (atk >> 2), udf: udf * 2, ldf: ldf * 2, spd, int: int + (int >> 3), agl }
      : { atk, udf: udf + (udf >> 1) + (udf >> 2), ldf: ldf + (ldf >> 1) + (ldf >> 2), spd, int: int + (int >> 2), agl };
  }
  const elemPct = (a, d) => (D.elem && a !== undefined && d !== undefined && a < 8 && d < 8 ? D.elem.matrix[a][d] : 100);
  const signPct = (v) => `${v > 100 ? '+' : ''}${v - 100}%`;
  const clsText = (c) => (c === 2 ? T`飘在空中（普通攻击的下段多半打空）` : c === 3 ? T`个子矮（普通攻击的上段多半打空）` : '');
  const payExp = (m) => m.exp - (m.exp >> 2);
  const payGold = (m) => (m.g >> 1) - ((m.g >> 1) >> 1);
  const isBoss = (id) => bossesOf(id).length > 0;
  // monsters that are the same record under several ids (the Evil Bat x4): lists show the first one
  const MON_CANON = (() => {
    const by = new Map(), out = {};
    for (const id of Object.keys(D.mons).sort((a, b) => a - b)) {
      const m = D.mons[id];
      const k = JSON.stringify([m.n, m.st, m.hp, m.mp, m.exp, m.g, m.d, m.dp, m.s, m.c, m.el, m.cls, D.steal[id] || null, isBoss(id)]);
      if (!by.has(k)) by.set(k, id);
      out[id] = by.get(k);
    }
    return out;
  })();
  const isCanonMon = (id) => MON_CANON[id] === String(id);
  function monWeakTable(m) {
    if (m.el === undefined || m.el > 6) return `<p class="note">${T`无属性：所有属性的魔法和攻击都按 100% 计算。`}</p>`;
    const rows = [];
    for (let a = 0; a < 7; a++) {
      const v = elemPct(a, m.el);
      rows.push(`<tr><td>${T`${elTag(a)} 属性的瑟鲁魔法`}</td><td class="num ${v > 100 ? 'good' : v < 100 ? 'warn' : ''}">${v}%</td></tr>`);
    }
    const phys = [0, 1, 2].map((c) => {
      const v = elemPct(D.elem.char[c], m.el);
      return `<tr><td>${T`${aChar(c)}的物理攻击（${elTag(D.elem.char[c])}）`}</td><td class="num ${v > 100 ? 'good' : v < 100 ? 'warn' : ''}">${v}%　<span class="faint small">${T`招式 ${Math.round(v * v / 100)}%`}</span></td></tr>`;
    });
    return table([T`攻击`, [T`威力`, 'num']], rows.concat(phys), { cls: 'compact' });
  }
  // the formations a monster is part of, by place and story period
  function monFormations(id) {
    const out = [];
    for (const lab of Object.keys(MON_ENC[id] || {})) {
      const groups = encGroups(lab).filter((g) => !g.transient);
      for (const g of groups) {
        const fs = [];
        for (const z of g.zones) for (const f of z.rows) if (f.includes(Number(id))) fs.push(f);
        if (!fs.length) continue;
        const key = (f) => f.slice().sort((a, b) => a - b).join(',');
        const seen = new Set();
        out.push({ lab, g, groups, fs: fs.filter((f) => !seen.has(key(f)) && seen.add(key(f))) });
      }
    }
    return out;
  }
  const formText = (f) => {
    const cnt = new Map();
    for (const id of f) cnt.set(id, (cnt.get(id) || 0) + 1);
    return [...cnt].map(([id, n]) => `${aMon(id)}${n > 1 ? ` ×${n}` : ''}`).join(' + ');
  };
  PAGES.mon = ([id]) => {
    const m = D.mons[id];
    if (!m) return null;
    const same = Object.keys(D.mons).filter((x) => MON_CANON[x] === MON_CANON[id]);   // copies of this record
    const bs = same.flatMap((x) => bossesOf(x)).sort((a, b) => a.ch - b.ch);
    const rand = same.some((x) => Object.keys(MON_ENC[x] || {}).length > 0);
    const steal = D.steal[id];
    const other = isEn() ? m.n : monEn(id);
    const kind = bs.length ? (bs.some((b) => b.opt) ? T`隐藏头目` : T`头目`) : T`怪物`;
    const rows = [other ? [isEn() ? 'Chinese name' : '英文名', `<i>${esc(other)}</i>`] : null, [T`属性`, elTag(m.el) || T`无`], m.cls === 2 || m.cls === 3 ? [T`体型`, esc(clsText(m.cls))] : null,
      ['HP', num(m.hp)], ['MP', num(m.mp)], [T`经验`, `${num(m.exp)} <span class="faint small">${T`（实得 ${num(payExp(m))}，平分）`}</span>`],
      [T`金钱`, `${num(m.g)} <span class="faint small">${T`（实得约 ${num(payGold(m))}）`}</span>`],
      [T`掉落`, m.d ? `${aItem(m.d)} ${m.dp}%` : `<span class="faint">${T`无`}</span>`],
      [T`偷取`, steal ? `${aItem(steal[1])} ${steal[0]}%` : `<span class="faint">${T`无`}</span>`],
      [T`瑟鲁`, m.s ? `${aSpell(m.s + 0x80)} <span class="faint small">${T`吸收率`}</span> ${m.c}%` : `<span class="faint">${T`无`}</span>`],
      bs.length ? [T`头目`, list(bs.map((b) => aCh(b.ch, chLabel(b.ch)) + (b.opt ? ` <span class="pill mist">${T`隐藏`}</span>` : '')))] : null];
    let h = crumbs([home(), [bs.length ? 'bosses' : 'monsters', bs.length ? T`头目` : T`怪物`]]);
    h += `<h1>${esc(monName(id))}</h1><div class="h1sub">${other ? `<span class="en">${esc(other)}</span> · ` : ''}${kind}${m.el !== undefined && m.el < 8 ? ` · ${T`${elName(m.el)}属性`}` : ''}</div>`;
    h += infobox(monName(id), bs.length ? T`头目` : T`怪物`, rows, bs.length ? 'mist' : '');
    // stats
    h += h2('stats', T`能力`);
    const prof = [];
    if (rand || !bs.length) prof.push([T`野外遇到时`, monBattle(m, false)]);
    if (bs.length) prof.push([T`头目战`, monBattle(m, true)]);
    for (const [t, st] of prof) {
      h += `<h3>${t}</h3>` + statGrid([['HP', m.hp], ['MP', m.mp], [T`攻击`, st.atk], [T`上段防御`, st.udf], [T`下段防御`, st.ldf], [T`速度`, st.spd], [T`智力`, st.int], [T`敏捷`, st.agl]]);
    }
    const low = m.st[1] && m.st[2] ? (m.st[2] < m.st[1] * 0.9 ? T`它的<b>下段防御低</b>，多用打下段的招式。` : m.st[1] < m.st[2] * 0.9 ? T`它的<b>上段防御低</b>，多用打上段的招式。` : '') : '';
    h += `<p class="note">${T`表里是战斗中的实际数值：开战时怪物的能力会被强化（野外遇到：上下防 ×1.75、智力 ×1.25；头目战：攻击 ×1.25、上下防 ×2、智力 ×1.125）。强化前：攻击 ${m.st[0]}、上防 ${m.st[1]}、下防 ${m.st[2]}、速度 ${m.st[3]}、智力 ${m.st[4]}、敏捷 ${m.st[5]}。`}${low}${m.cls === 2 || m.cls === 3 ? clsText(m.cls) + T`。` : ''}</p>`;
    h += h2('elem', T`属性与弱点`) + `<p class="note">${m.el !== undefined && m.el < 7 ? T`${elTag(m.el)} 属性。` : ''}${T`魔法按施法的属性算，物理攻击按角色本身的属性算（招式按两次计算，所以差距更大）。`}</p>` + monWeakTable(m);
    if (bs.length) h += `<p class="note">${T`头目战里，攻击、防御、智力的降低效果无效（开战时已强化）；速度、敏捷的降低每场只生效一次。`}</p>`;
    // spoils
    h += h2('spoils', T`战利品`);
    const drop = m.d ? (m.dp >= 100 ? T`${aItem(m.d)}，几率 ${m.dp}%（必掉）` : T`${aItem(m.d)}，几率 ${m.dp}%；没戴${q2(aItem(241))}时还要再过 1/4 的判定，实际约 ${(m.dp / 4).toFixed(m.dp >= 4 ? 0 : 1)}%，戴上 ${Math.min(100, m.dp + 30)}%`) : T`不掉东西`;
    h += `<ul class="bul"><li>${T`经验：${num(m.exp)}，结算时 ×3/4 = ${num(payExp(m))}，由活着的人平分；戴${q2(aItem(239))}的人自己那份 ×2。`}</li>`
      + `<li>${T`金钱：${num(m.g)}，实得约 1/4 = ${num(payGold(m))}（戴${q2(aItem(240))}×1.25）。`}</li>`
      + `<li>${T`掉落：${drop}。`}</li>`
      + `<li>${steal ? T`偷取：${aItem(steal[1])}，${steal[0]}%（要戴${q2(aItem(208))}的人用攻击打倒它；青铜之书 ×2 = ${Math.min(100, steal[0] * 2)}%）。` : T`偷取：偷不到东西。`}</li>`
      + `<li>${m.s ? T`瑟鲁：${aSpell(m.s + 0x80)}，吸收率 ${m.c}%（装备圣瑟鲁的人打出最后一击才能吸收，戴${q2(aItem(238))}+30）。` : T`瑟鲁：不带瑟鲁。`}</li></ul>`;
    // where
    h += h2('where', T`出现地点`);
    if (bs.length) {
      h += `<h3>${T`头目战`}</h3><ul class="bul">` + bs.map((b) => {
        const scenes = Object.entries(D.boss).filter(([l, ids]) => ids.includes(b.id) && !isCut(l) && GUIDE.ch[b.ch].labels.includes(l)).map(([l]) => l);
        return `<li>${aCh(b.ch, chLabel(b.ch))}${scenes.length ? ' · ' + list(uniq(scenes.map((l) => aPlace(l)))) : ''}${b.opt ? ` <span class="pill mist">${T`隐藏 / 可选`}</span>` : ''}</li>`;
      }).join('') + '</ul>';
    }
    const forms = same.flatMap((x) => monFormations(x));
    if (forms.length) {
      h += `<h3>${T`野外随机遇敌`}</h3>`;
      const byPlace = new Map();
      for (const f of forms) { const k = PL_OF[f.lab]; if (!byPlace.has(k)) byPlace.set(k, []); byPlace.get(k).push(f); }
      for (const [k, lst] of byPlace) {
        const P = PL.get(k);
        h += `<div class="src"><div class="src-h"><b>${aPlace(P.key)}</b>${P.ch.length ? `<span class="faint small">${T`${chLabel(P.ch[0])}起`}</span>` : ''}</div>`;
        // the same formations in several story versions: one line naming them
        const lines = new Map();
        for (const f of lst) {
          const per = periodText(f.groups, f.g);
          const k2 = per + '|' + f.fs.map((x) => x.slice().sort((a, b) => a - b).join(',')).sort().join(';');
          const o = lines.get(k2) || { per, fs: f.fs, when: [] };
          if (P.labels.length > 1 && SCENE_WHEN[f.lab]) o.when.push(sceneWhen(f.lab));
          lines.set(k2, o);
        }
        for (const o of lines.values()) {
          h += `<div class="src-b small">${o.when.length ? `<span class="gm">${esc(uniq(o.when).join(' / '))}</span>` : ''}${o.per ? `<span class="gm">${esc(o.per)}</span>` : ''}${o.fs.map(formText).join('；')}</div>`;
        }
        h += '</div>';
      }
    } else if (!bs.length) h += `<p class="muted">${T`没有固定的出现地点（战斗中被召唤出来，或游戏里遇不到）。`}</p>`;
    return { title: monName(id), html: h };
  };

  const MON_FILTERS = [['all', '全部'], ['boss', '头目'], ['seru', '带瑟鲁'], ['steal', '能偷东西'], ['drop', '会掉东西']];
  PAGES.monsters = ([f]) => {
    const flt = MON_FILTERS.some(([k]) => k === f) ? f : 'all';
    let ids = Object.keys(D.mons).filter(isCanonMon).sort((a, b) => (monFirstCh(a) - monFirstCh(b)) || (a - b));
    if (flt === 'boss') ids = ids.filter(isBoss);
    else if (flt === 'seru') ids = ids.filter((id) => D.mons[id].s);
    else if (flt === 'steal') ids = ids.filter((id) => D.steal[id]);
    else if (flt === 'drop') ids = ids.filter((id) => D.mons[id].d);
    const rows = ids.map((id) => {
      const m = D.mons[id], st = D.steal[id], c = monFirstCh(id);
      return `<tr>${td(monName(id), aMon(id) + (isBoss(id) ? ` <span class="pill mist">${T`头目`}</span>` : ''), 'cell-n')}${td(m.el, elTag(m.el), 'c')}${td(m.hp, num(m.hp), 'num')}${td(m.exp, num(m.exp), 'num')}${td(m.g, num(m.g), 'num')}`
        + `${td(m.d ? itemName(m.d) : '', m.d ? `${aItem(m.d)} <span class="faint">${m.dp}%</span>` : '<span class="faint">—</span>')}`
        + `${td(st ? itemName(st[1]) : '', st ? `${aItem(st[1])} <span class="faint">${st[0]}%</span>` : '<span class="faint">—</span>')}`
        + `${td(m.s ? spellName(m.s + 0x80) : '', m.s ? `${aSpell(m.s + 0x80)} <span class="faint">${m.c}%</span>` : '<span class="faint">—</span>')}${td(c, c < 99 ? `${c + 1}` : '<span class="faint">—</span>', 'num')}</tr>`;
    });
    const total = Object.keys(D.mons).filter(isCanonMon).length;
    let h = crumbs([home(), ['', T`怪物`]]) + `<h1>${T`怪物`}</h1><div class="h1sub">${T`全部 ${total} 种敌人的资料：经验、金钱、掉落、偷取、身上的瑟鲁。按第一次遇到的章节排列，表头可以点击排序。`}</div>`;
    h += `<div class="chips">${MON_FILTERS.map(([k, t]) => `<a href="#monsters-${k}" class="${k === flt ? 'on' : ''}">${esc(tr(t))}</a>`).join('')}</div>`;
    h += `<p class="note">${T`经验、金钱是怪物的基础值（实得经验 ×3/4 由活着的人平分，金钱约 1/4）。掉落、偷取、吸收率是基础几率，见<a href="#mechanics">系统与公式</a>。`}</p>`;
    h += table([T`名称`, [T`属性`, 'c'], ['HP', 'num'], [T`经验`, 'num'], [T`金钱`, 'num'], T`掉落`, T`偷取`, T`瑟鲁`, [T`章`, 'num']], rows, { sort: true });
    return { title: T`怪物`, html: h };
  };

  PAGES.bosses = () => {
    let h = crumbs([home(), ['', T`头目`]]) + `<h1>${T`头目`}</h1><div class="h1sub">${T`按剧情顺序列出全部 ${BOSSES.length} 场头目战（含隐藏头目）。`}</div>`;
    h += `<p class="note">${T`头目战里怪物的攻击 ×1.25、上下防 ×2、智力 ×1.125（开战时强化）。弱点是对它威力超过 100% 的瑟鲁魔法属性。`}</p>`;
    const rows = [];
    // a header for each stretch of the story spent in one region (the story comes back to a region later)
    let i = 0;
    while (i < BOSSES.length) {
      const r = GUIDE.ch[BOSSES[i].ch].region;
      let j = i;
      while (j + 1 < BOSSES.length && GUIDE.ch[BOSSES[j + 1].ch].region === r) j++;
      const c0 = BOSSES[i].ch, c1 = BOSSES[j].ch;
      rows.push(`<tr class="sub"><td colspan="8">${esc(regionName(r))} · ${c0 === c1 ? chLabel(c0) : T`第${c0 + 1}–${c1 + 1}章`}</td></tr>`);
      for (let k = i; k <= j; k++) {
        const b = BOSSES[k], m = D.mons[b.id] || {};
        const weak = [];
        if (m.el !== undefined && m.el < 7) for (let a = 0; a < 7; a++) { const v = elemPct(a, m.el); if (v > 100) weak.push(`${elTag(a)}<span class="small">${signPct(v)}</span>`); }
        const st = D.steal[b.id];
        rows.push(`<tr><td class="nw">${aCh(b.ch, chLabel(b.ch))}</td><td class="cell-n">${aMon(b.id)}${b.opt ? ` <span class="pill mist">${T`隐藏`}</span>` : ''}</td><td class="num">${num(m.hp || 0)}</td><td class="c">${elTag(m.el)}</td>`
          + `<td>${weak.join(' ') || '<span class="faint">—</span>'}</td><td class="num">${num(m.exp || 0)}</td><td>${m.d ? `${aItem(m.d)} <span class="faint">${m.dp}%</span>` : '<span class="faint">—</span>'}</td>`
          + `<td>${st ? `${aItem(st[1])} <span class="faint">${st[0]}%</span>` : '<span class="faint">—</span>'}</td></tr>`);
      }
      i = j + 1;
    }
    h += table([T`章`, T`头目`, ['HP', 'num'], [T`属性`, 'c'], T`弱点`, [T`经验`, 'num'], T`掉落`, T`偷取`], rows);
    return { title: T`头目`, html: h };
  };

/* ---- 30-magic.js ---- */
  // ------------------------------------------------------------------ 魔法
  const SERU_GROUPS = [
    [2, [0x81, 0x86, 0x8C], '降低敌人攻击'], [0, [0x8D, 0x90, 0x93], '降低敌人防御'], [1, [0x84, 0x8A, 0x92], '降低敌人敏捷'],
    [3, [0x88, 0x8B, 0x8F], '降低敌人速度'], [4, [0x82, 0x87, 0x95], '降低敌人智力'], [6, [0x94], '降低敌人 MP'],
    [5, [0x83, 0x89, 0x91], '恢复魔法，顺带解除异常'],
  ];
  const SERU_SPECIAL = [0x8E, 0x85];
  const SERU_ALL = SERU_GROUPS.flatMap((g) => g[1]).concat(SERU_SPECIAL);
  const RA_MAGIC = [0x9E, 0x9F, 0xA0];
  const SUMMONS = [[0x9A, 114, 110], [0x9B, 115, 111], [0x9C, 116, 112], [0x9D, 117, 113], [0x99, 118, 191]];
  const HEAL = { 0x83: [32, 224, '单体'], 0x89: [64, 448, '每人'], 0x91: [128, 896, '每人'] };
  const FX_STAT = { 0: '防御', 1: '敏捷', 2: '攻击', 3: '速度', 4: '智力', 6: 'MP' };
  const FX_PCT = [5, 10, 15, 20];
  const FX_CURE = ['中毒、剧毒', '中毒、剧毒、腐烂', '中毒、剧毒、腐烂、麻痹', '中毒、剧毒、腐烂、麻痹，AP 翻倍'];
  // Seru-magic level effects (battle overlay FUN_801F3D3C, band (lv-3)>>1): the damaging elements lower one enemy stat
  // by 5 / 10 / 15 / 20% per hit, light cures ailments; Aluru's instant death is rand % (17 - lv) < 8
  function seruFx(id, lv) {
    if (id < 0x81 || id > 0x95 || id === 0x85) return '';
    if (id === 0x8E) return T`即死 ${Math.round(800 / (17 - lv))}%`;
    const el = (D.spells[id] || {}).el;
    if (lv < 3 || el === undefined) return '';
    const band = Math.min(3, (lv - 3) >> 1);
    if (el === 5) return T`解除${tr(FX_CURE[band])}`;
    return FX_STAT[el] ? T`敌人${tr(FX_STAT[el])} −${FX_PCT[band]}%` : '';
  }
  // magic EXP to reach the next level (cumulative), x1.5 for the six slow ones
  function spellThreshold(id, lv) {
    if (lv >= 9 || lv < 1) return null;
    const mult = D.spell_thr_x15.includes(id) ? 3 : 2;
    return (D.spell_thr[lv - 1] * mult) >> 1;
  }
  const spellKind = (id) => { const e = (D.spells[id] || {}).effect || ''; return e.includes('恢复') ? 'heal' : e.includes('单体') ? 'single' : (e.includes('全体') || e.includes('周围') || e.includes('多名')) ? 'group' : 'other'; };
  const spellText = (s) => [s.attack, s.effect && !/不明/.test(s.effect) ? s.effect : ''].filter(Boolean).map(tr).join(colon());
  const seruMons = (sid) => (D.seru_src[sid] || []).filter((m) => D.mons[m] && isCanonMon(m));
  function absorbList(sid) {
    return seruMons(sid).map((mid) => {
      const m = D.mons[mid], pl = randomPlaces(mid).filter((P) => !P.cut);
      return `${aMon(mid)} <b>${m.c}%</b>${pl.length ? `<span class="faint small">${paren(list(pl.slice(0, 4).map((P) => aPlace(P.key))) + (pl.length > 4 ? T` 等` : ''))}</span>` : isBoss(mid) ? `<span class="faint small">${T`（头目）`}</span>` : ''}`;
    }).join('<br>');
  }
  // enemy skills that are one skill under several ids: listed once
  function enemySkills() {
    const out = [], seen = new Set();
    const ids = Object.keys(D.spells).map(Number).filter((id) => id && !SERU_ALL.includes(id) && !RA_MAGIC.includes(id) && !SUMMONS.some((x) => x[0] === id) && D.spells[id].zh && id !== 150)
      .sort((a, b) => a - b);
    for (const id of ids) {
      const s = D.spells[id], k = [s.zh, s.en, s.mp].join('|');
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(id);
    }
    return out;
  }
  PAGES.magic = () => {
    let h = crumbs([home(), ['', T`魔法`]]) + `<h1>${T`魔法`}</h1><div class="h1sub">${T`瑟鲁魔法、圣瑟鲁的魔法、召唤魔法，以及敌人会用的特技。`}</div>`;
    h += toc([['seru', T`瑟鲁魔法`], ['ra', T`圣瑟鲁的魔法`], ['summon', T`召唤魔法`], ['enemy', T`敌人的特技`]]);
    h += h2('seru', T`瑟鲁魔法`) + `<p>${T`打倒身上带瑟鲁的怪物时，<b>装备着圣瑟鲁</b>、还没有这个魔法的角色打出最后一击，就有几率把瑟鲁吸收成自己的魔法（几率是下表的吸收率，戴${q2(aItem(238))}的人 +30）。用它打敌人涨魔法经验，最高 Lv9；Lv3 起每次施放还附带效果。21 种瑟鲁魔法在最终章都有 Lv3 版本可以吸收，不会错过。`}</p>`;
    const rows = [];
    for (const [el, ids, note] of SERU_GROUPS.concat([[null, SERU_SPECIAL, '即死 / 混乱']])) {
      rows.push(`<tr class="sub"><td colspan="6">${el === null ? T`特殊` : T`${elName(el)}属性`} · ${esc(tr(note))}</td></tr>`);
      for (const id of ids) {
        const s = D.spells[id] || {};
        rows.push(`<tr><td class="cell-n">${aSpell(id)}</td><td class="c">${elTag(s.el)}</td><td class="num">${s.mp || ''}</td><td class="small">${esc(spellText(s))}</td><td class="num">${s.pw ? num(s.pw) : '<span class="faint">—</span>'}</td><td class="small">${absorbList(id)}</td></tr>`);
      }
    }
    h += table([T`魔法`, [T`属性`, 'c'], ['MP', 'num'], T`效果`, [T`威力`, 'num'], T`在哪些怪物身上（吸收率）`], rows);
    h += h2('ra', T`圣瑟鲁的魔法`) + `<p>${T`圣瑟鲁升到最高级后，装备着它的人多出一招全体攻击魔法。条件见<a href="#secret">隐藏要素</a>。`}</p>`;
    h += table([T`魔法`, [T`属性`, 'c'], ['MP', 'num'], T`效果`, [T`威力`, 'num'], T`谁`], RA_MAGIC.map((id, c) => {
      const s = D.spells[id] || {};
      return `<tr><td>${aSpell(id)}</td><td class="c">${elTag(s.el)}</td><td class="num">${s.mp}</td><td class="small">${esc(spellText(s))}</td><td class="num">${num(s.pw || 0)}</td><td>${aChar(c)}${paren(raseruName(c))}</td></tr>`;
    }));
    h += h2('summon', T`召唤魔法`) + `<p>${T`戴着对应的护符（饰品）时才有这招魔法，取下护符就没有了。前四个护符由杰雷米的珠宝匠扎兰用蛋 / 黑暗之石加工。`}</p>`;
    h += table([T`魔法`, ['MP', 'num'], T`效果`, T`护符`, T`材料`], SUMMONS.map(([sp, tal, mat]) => {
      const s = D.spells[sp] || {};
      return `<tr><td>${aSpell(sp, sp === 0x99 ? T`札格诺特（邪恶瑟鲁魔法）` : undefined)}</td><td class="num">${s.mp}</td><td class="small">${esc(s.effect && !/不明/.test(s.effect) ? tr(s.effect) : sp === 0x99 ? T`邪恶瑟鲁札格诺特的力量` : '')}</td><td>${aItem(tal)}</td><td>${sp === 0x99 ? T`${aItem(mat)} 打开的门后宝箱` : aItem(mat)}</td></tr>`;
    }));
    const others = enemySkills();
    h += h2('enemy', T`敌人的特技（${others.length}）`) + `<p class="note">${T`怪物和头目在战斗中使用的特技和魔法。`}</p>`;
    h += table([T`名称`, isEn() ? 'Chinese' : T`英文`, ['MP', 'num']], others.map((id) => { const s = D.spells[id]; const o = isEn() ? s.zh : s.en; return `<tr>${td(spellName(id), `<a href="#spell-${id}">${esc(spellName(id))}</a>`)}${td(o, `<i class="small">${esc(o)}</i>`)}${td(s.mp, s.mp ? num(s.mp) : '<span class="faint">—</span>', 'num')}</tr>`; }), { sort: true, cls: 'compact' });
    return { title: T`魔法`, html: h };
  };

  PAGES.spell = ([sid]) => {
    const id = Number(sid), s = D.spells[id];
    if (!s) return null;
    const isSeru = SERU_ALL.includes(id), isRa = RA_MAGIC.includes(id), sum = SUMMONS.find((x) => x[0] === id);
    const kind = isSeru ? T`瑟鲁魔法` : isRa ? T`圣瑟鲁的魔法` : sum ? T`召唤魔法` : T`敌人的特技`;
    const other = isEn() ? s.zh : s.en;
    const rows = [[T`类别`, kind], other ? [isEn() ? 'Chinese name' : '英文名', `<i>${esc(other)}</i>`] : null, s.el !== undefined ? [T`属性`, elTag(s.el)] : null, ['MP', s.mp ? num(s.mp) : '—'],
      s.attack ? [T`招式名`, esc(tr(s.attack))] : null, s.effect && !/不明/.test(s.effect) ? [T`效果`, esc(tr(s.effect))] : null, s.pw ? [T`威力`, num(s.pw)] : null];
    const title = sum && id === 0x99 ? T`札格诺特（邪恶瑟鲁魔法）` : spellName(id);
    let h = crumbs([home(), ['magic', T`魔法`]]) + `<h1>${esc(title)}</h1><div class="h1sub">${other ? `<span class="en">${esc(other)}</span> · ` : ''}${kind}</div>`;
    h += infobox(spellName(id), kind, rows);
    if (isSeru) {
      const ms = seruMons(id);
      h += `<p class="lede">${s.effect ? esc(tr(s.effect)) : ''}${HEAL[id] ? T`恢复量 = ${HEAL[id][0]} × 等级 + ${HEAL[id][1]}（${tr(HEAL[id][2])}）。` : ''}</p>`;
      h += h2('get', T`在哪里吸收`) + (ms.length ? `<p>${absorbList(id)}</p>` : `<p class="muted">${T`没有怪物带这个瑟鲁。`}</p>`)
        + `<p class="note">${T`装备着圣瑟鲁、还没有这个魔法的角色打出最后一击时按吸收率判定；戴${q2(aItem(238))}的人 +30。`}</p>`;
      // levels
      const lv = range(1, 9);
      const thr = lv.map((l) => spellThreshold(id, l));
      const power = (l) => (HEAL[id] ? HEAL[id][0] * l + HEAL[id][1] : s.pw && (spellKind(id) === 'single' || spellKind(id) === 'group') ? Math.round((s.pw + s.pi / 2) * (1 + (l - 1) / 8)) : null);
      h += h2('lv', T`等级`);
      h += `<div class="tbl"><table class="data compact"><thead><tr><th>${T`等级`}</th>${lv.map((l) => `<th class="num">Lv${l}</th>`).join('')}</tr></thead><tbody>`
        + `<tr><td>${T`升到下一级要累计的魔法经验`}</td>${thr.map((t) => `<td class="num">${t === null ? '—' : num(t + 1)}</td>`).join('')}</tr>`
        + `<tr><td>${HEAL[id] ? T`恢复量` : T`攻击值（不含智力）`}</td>${lv.map((l) => { const v = power(l); return `<td class="num">${v === null ? '—' : num(v)}</td>`; }).join('')}</tr>`
        + `<tr><td>${T`附带效果`}</td>${lv.map((l) => `<td class="num small">${esc(seruFx(id, l)) || '—'}</td>`).join('')}</tr></tbody></table></div>`;
      h += `<ul class="bul small"><li>${T`魔法经验：单体攻击魔法每打中一次最多 +12，群体魔法每打中一个敌人最多 +4（按伤害占敌人最大 HP 的比例），<b>打倒敌人的那一下固定拿满</b>。每施放一次最多升 1 级。`}</li>`
        + `${HEAL[id] ? `<li>${T`恢复魔法：恢复量全部用上 +12（欧布、斯普恩每个队友 +4），只补一部分 +4（+2），目标满血不涨。`}</li>` : ''}`
        + `${!HEAL[id] && s.pw ? `<li>${T`攻击值 = 魔法威力 + 施法者智力 × 2，每升 1 级多 12.5%（Lv9 是 Lv1 的 2 倍）；表里没算智力。实际伤害 ≈（攻击值 × 属性相克 − 敌人的魔法防御）× 施法者的属性威力。`}</li>` : ''}`
        + `${D.spell_thr_x15.includes(id) ? `<li>${T`这个魔法升级要的经验是普通魔法的 1.5 倍。`}</li>` : ''}</ul>`;
      if (s.el !== undefined && s.el < 8 && !HEAL[id]) {
        h += h2('cast', T`谁来放`) + `<p class="note">${T`同一个魔法换人放威力不同，按魔法的属性和施法者的属性算。`}</p>`
          + table([T`角色`, [T`威力`, 'num']], [0, 1, 2].map((c) => { const v = D.elem.cast[c][s.el]; return `<tr><td>${aChar(c)}</td><td class="num ${v >= 100 ? 'good' : v < 80 ? 'warn' : ''}">${v}%</td></tr>`; }), { cls: 'compact' });
      }
    } else if (isRa) {
      const c = RA_MAGIC.indexOf(id);
      h += `<p class="lede">${T`${aChar(c)}的圣瑟鲁${raseruName(c)}升到最高级后，装备着它就多出这招魔法。`}${s.effect ? esc(tr(s.effect)) : ''}</p><p>${T`怎么让圣瑟鲁升到最高级，见<a href="#secret">隐藏要素 · 圣瑟鲁的真正力量</a>。`}</p>`;
    } else if (sum) {
      h += `<p class="lede">${T`戴着${q2(aItem(sum[1]))}（饰品）的人多出这招魔法，取下就没有。`}${sum[0] === 0x99 ? T`邪之护符在拉塔尤城地下札格诺特之室的宝箱里，那扇门要用${q2(aItem(191))}打开（三人都到 99 级时萨留才给）。` : T`${q2(aItem(sum[1]))}由杰雷米的珠宝匠扎兰用${q2(aItem(sum[2]))}加工。`}</p>`;
      h += h2('how', T`${itemName(sum[1])}的获得方法`) + sourcesHtml(String(sum[1]));
    } else {
      h += `<p class="lede">${T`敌人在战斗中使用的特技（我方不能使用）。`}</p>`;
      const users = Object.keys(D.mons).filter((m) => isCanonMon(m) && ((D.mons[m].sk || []).includes(id)));
      if (users.length) h += h2('users', T`会用的怪物`) + `<p>${list(users.map((m) => aMon(m)))}</p>`;
    }
    return { title, html: h };
  };

  // ------------------------------------------------------------------ 招式
  const HYPER_ORD = 3;                               // rows 1..3 of each character are the Hyper Arts (books only)
  const artCat = (ord) => (ord === 0 ? T`终极招式` : ord <= HYPER_ORD ? T`超级招式` : T`普通招式`);
  const bookFor = (c, idx) => (D.art_books && D.art_books[c] ? D.art_books[c][idx] : undefined);
  const hitsText = (hits) => (hits && hits.length ? hits.map(([u, p]) => `${u ? T`上` : T`下`}${p}`).join(' ') : T`特殊`);
  function bookWhere(id) {
    const src = (D.book_src || {})[id] || [];
    const chest = src.filter((x) => !x.includes('掉落')), drop = src.filter((x) => x.includes('掉落'));
    const parts = [];
    if (chest.length) parts.push(T`${list(chest.map(tr))}的宝箱`);
    if (drop.length) parts.push(T`${list(drop.map((x) => tr(x.replace('掉落', ''))))}必定掉落`);
    return parts.join(isEn() ? '; ' : '；');
  }
  PAGES.arts = ([cs]) => {
    const c = [0, 1, 2].includes(Number(cs)) ? Number(cs) : 0;
    const rows = D.arts[c];
    let h = crumbs([home(), ['', T`招式`]]) + `<h1>${T`招式`}</h1><div class="h1sub">${T`战斗中按方向键输入的“战术招式”（Tactical Arts）、超级招式、终极招式和连携招式。`}</div>`;
    h += `<div class="chips">${[0, 1, 2].map((i) => `<a href="#arts-${i}" class="${i === c ? 'on' : ''}">${esc(charName(i))}</a>`).join('')}</div>`;
    h += `<p>${T`战斗中选“攻击”后按顺序输入方向（↑上 ↓下 ←左 →右）。一串方向里包含某个招式的指令、而且 AP 够时，就会发动这个招式；<b>普通招式</b>第一次发动时就学会了。每个方向占 ${CMD_COST} 点敏捷，所以一回合能输入的方向数 = 敏捷 ÷ ${CMD_COST}（拿不擅长的武器时，武器手方向 ${WEAPON_HAND[c]} 更占格）。`}</p>`
      + `<ul class="bul small"><li>${T`<b>超级招式</b>只能用招式之书学（在道具菜单里使用），战斗中输入学不会；学会后要装备圣瑟鲁才能用。`}</li>`
      + `<li>${T`<b>终极招式</b>（AP 99）装备着圣瑟鲁时在战斗中输入就会学会。`}</li><li>${T`AP：每次行动 +8，挨打也会涨，“集气”+32；最多 100。`}</li></ul>`;
    const tr2 = rows.map((r, ord) => {
      const book = bookFor(c, r.idx);
      const learn = ord === 0 ? T`战斗中输入（要装备圣瑟鲁）` : book !== undefined ? `${T`用${aItem(book)}学`}${bookWhere(book) ? `<span class="faint small">${paren(esc(bookWhere(book)))}</span>` : ''}` : T`战斗中输入就学会`;
      const other = isEn() ? r.zh : r.en;
      return `<tr>${td(ord, `<span class="small">${artCat(ord)}</span>`, 'nw')}${td(artName(r), `<b>${esc(artName(r))}</b><div class="faint small"><i>${esc(other)}</i></div>`, 'cell-n')}${td(r.cmd, keys(r.cmd))}`
        + `${td(r.cmd.length, String(r.cmd.length), 'num')}${td(r.cmd.length * CMD_COST, num(r.cmd.length * CMD_COST), 'num')}${td(r.ap, String(r.ap), 'num')}${td((r.hits || []).length, `<span class="small">${esc(hitsText(r.hits))}</span>`)}`
        + `${td(r.desc, `<span class="small">${esc(tr(r.desc.replace(/\s+/g, '')))}</span>`)}${td(learn, `<span class="small">${learn}</span>`)}</tr>`;
    });
    h += h2('list', T`${charName(c)}的招式（${rows.length}）`) + table([T`类型`, T`招式`, T`指令`, [T`格`, 'num'], [T`敏捷`, 'num'], ['AP', 'num'], T`每段（上/下段 威力）`, T`说明`, T`学法`], tr2, { sort: true });
    const sup = D.supers.filter((s) => s.char === c);
    const artByZh = (n) => rows.find((r) => r.zh === n);
    h += h2('super', T`连携招式`) + `<p>${T`按顺序连着打出这几个普通招式（相邻招式首尾共用的方向已经合并在整串输入里）就会自动变成连携招式；不需要学，也不会被记录。`}</p>`;
    h += table([T`名称`, T`整串输入`, [T`格`, 'num'], ['AP', 'num'], T`由这些招式组成`], sup.map((s) => `<tr><td><b>${esc(artName(s))}</b><div class="faint small"><i>${esc(isEn() ? s.zh : s.en)}</i></div></td><td>${keys(s.input)}</td><td class="num">${s.input.length}</td><td class="num">${s.ap}</td><td class="small">${s.chain.map((n) => esc(artName(artByZh(n)) || n)).join(' + ')}</td></tr>`));
    h += `<p class="note">${T`“每段”是招式每一下打上段还是下段、威力多少（12 / 18 / 20 / 22 / 28）。敌人飘在空中时打下段的普通攻击多半打空，个子矮的敌人打上段的多半打空。伤害公式见<a href="#mechanics">系统与公式</a>。`}</p>`;
    return { title: T`招式 · ${charName(c)}`, html: h };
  };

  // ------------------------------------------------------------------ 角色
  const RASERU_ITEMS = [range(1, 9), range(10, 17), range(19, 25)];
  // when the Ra-Seru level up: the tree events swap the gear in the three Ra-Seru slots (field-VM op 0x3B on slots
  // 3 / 18 / 35: town0b P1[55], rikuroa P2[54], vozz P2[17], teien P2[2], retona P2[18], korb3 P2[14], noaru P2[31]);
  // the 7th tree (Buma, the debug menu's "7th Genesis Tree Resurrection") gives the step in between
  const RASERU_STEPS = [
    ['利姆艾姆的创世树：瓦恩与麦塔结合', 328, [1, 0, 0]], ['里库罗亚山的创世树', 650, [2, 1, 0]], ['东沃兹森林的创世树', 403, [3, 2, 1]],
    ['空中花园 · 杰雷米的创世树', 457, [4, 3, 2]], ['莱托纳山的创世树', 855, [5, 4, 3]], ['索尔的创世树', 1027, [6, 5, 4]],
    ['布玛的创世树', 981, [7, 6, 5]], ['诺阿鲁山谷的大创世树（最终章）', 1099, [8, 7, 6]],
  ];
  const stepChapter = (f) => GUIDE.ch.findIndex((c) => c.steps.some((s) => (s.f || []).includes(f)) || c.fl.includes(f));
  function raseruTable(only) {
    const cols = only === undefined ? [0, 1, 2] : [only];
    const rows = RASERU_STEPS.map(([t, f, lv]) => {
      const ci = stepChapter(f);
      return `<tr><td>${esc(tr(t))}${ci >= 0 ? ` <span class="faint small">${aCh(ci, chLabel(ci))}</span>` : ''}</td>${cols.map((c) => `<td class="c">${lv[c] ? `Lv${lv[c]}` : '<span class="faint">—</span>'}</td>`).join('')}</tr>`;
    });
    rows.push(`<tr><td>${T`真正的力量（满足条件后在创世树前）`} <a class="small" href="#secret">${T`条件`}</a></td>${cols.map((c) => `<td class="c"><b>Lv${[9, 8, 7][c]}</b></td>`).join('')}</tr>`);
    return table([T`时机`, ...cols.map((c) => [raseruName(c), 'c'])], rows, { cls: 'compact' });
  }
  PAGES.chars = () => {
    let h = crumbs([home(), ['', T`角色`]]) + `<h1>${T`角色`}</h1><div class="h1sub">${T`三位主角和他们的圣瑟鲁。`}</div>`;
    h += `<div class="cards">${[0, 1, 2].map((c) => `<a class="card" href="#char-${c}"><b>${esc(charName(c))}</b><span>${T`圣瑟鲁${raseruName(c)} · ${elName(D.elem.char[c])}属性 · 武器手 ${WEAPON_HAND[c]}`}</span></a>`).join('')}</div>`;
    return { title: T`角色`, html: h };
  };
  PAGES.char = ([cs]) => {
    const c = Number(cs);
    if (![0, 1, 2].includes(c)) return null;
    const el = D.elem.char[c];
    const rows = [[T`圣瑟鲁`, esc(raseruName(c))], [T`属性`, elTag(el)], [T`武器手`, `${WEAPON_HAND[c]}${paren(c === 1 ? T`右手` : T`左手`)}`],
      [T`终极招式`, `<a href="#arts-${c}">${esc(artName(D.arts[c][0]))}</a>`], [T`圣瑟鲁魔法`, aSpell(RA_MAGIC[c])]];
    let h = crumbs([home(), ['chars', T`角色`]]) + `<h1>${esc(charName(c))}</h1><div class="h1sub">${T`与圣瑟鲁${raseruName(c)}结合的${elName(el)}属性战士`}</div>`;
    h += infobox(charName(c), T`圣瑟鲁${raseruName(c)}`, rows);
    h += h2('raseru', T`圣瑟鲁装备`) + `<p>${T`圣瑟鲁${raseruName(c)}占一个装备栏，不能卸下，也不能另外获得：每唤醒一棵创世树，三只圣瑟鲁一起升一级。最高一级要满足额外条件，见<a href="#secret">隐藏要素</a>。`}</p>`;
    h += raseruTable(c);
    h += table([T`等级`, T`能力`], RASERU_ITEMS[c].map((id) => `<tr><td>${aItem(id)}</td><td class="small">${esc(tr(((IT.items[id] || {}).fx || [''])[0].replace(/；可装备.*$/, '')))}</td></tr>`), { cls: 'compact' });
    h += h2('elem', T`属性`) + `<p>${T`${charName(c)}的物理攻击带${elTag(el)}属性（打克制的敌人伤害更高，招式按两次计算）。放瑟鲁魔法的威力按魔法的属性算：`}</p>`;
    h += table(ELEMENTS_ZH.slice(0, 8).map((e, i) => [elTag(i), 'c']), [`<tr>${D.elem.cast[c].map((v) => `<td class="c ${v >= 95 ? 'good' : v < 80 ? 'warn' : ''}">${v}%</td>`).join('')}</tr>`], { cls: 'compact' });
    const gear = (cat, slot) => Object.keys(IT.items).filter((id) => IT.items[id].c === cat && eqOf(id) && eqOf(id)[6] === slot && (eqOf(id)[5] & (1 << c)));
    h += h2('gear', T`能装备的武器和防具`);
    for (const [cat, slot, t] of [['weapon', 2, T`武器`], ['armor', 0, T`身体`], ['armor', 1, T`头部`], ['armor', 3, T`脚部`]]) {
      const ids = gear(cat, slot).sort((a, b) => (eqOf(a)[1] + eqOf(a)[2] + eqOf(a)[3]) - (eqOf(b)[1] + eqOf(b)[2] + eqOf(b)[3]));
      h += `<p><b>${t}</b>（${ids.length}）${colon()}${list(ids.map((id) => {
        const cost = slot === 2 ? armCost(c, Number(id)) : CMD_COST;
        return `${aItem(id)}${cost > CMD_COST ? `<span class="faint small">${T`（不擅长）`}</span>` : ''}`;
      }))}</p>`;
    }
    h += h2('arts', T`招式`) + `<p>${T`${charName(c)}共有 ${D.arts[c].length} 个招式和 ${D.supers.filter((s) => s.char === c).length} 个连携招式，完整列表见<a href="#arts-${c}">招式 · ${esc(charName(c))}</a>。超级招式要用招式之书学：${list(Object.entries(D.art_books[c]).map(([idx, b]) => `${aItem(b)} → ${esc(artName(artRow(c, Number(idx))))}`))}。`}</p>`;
    return { title: charName(c), html: h };
  };

/* ---- 40-places.js ---- */
  // ------------------------------------------------------------------ 地点
  function chestSrc(c) {
    for (const id of c.it || []) {
      const it = IT.items[id];
      const q = it && it.src.find((x) => (x.once || []).includes(c.f) && x.s && placeOf(x.s) === placeOf(c.lab || x.s));
      if (q) return q;
    }
    for (const id of c.it || []) {
      const it = IT.items[id];
      const q = it && it.src.find((x) => (x.once || []).includes(c.f));
      if (q) return q;
    }
    return null;
  }
  // an NPC's line without its own name in front
  function npcLine(e) {
    if (isEn() && e.le && e.le.length) { const l = e.le[0], n = e.ne || ''; return n && l.startsWith(n + ': ') ? l.slice(n.length + 2) : l; }
    return e.n && (e.l[0] || '').startsWith(e.n + '：') ? e.l[0].slice(e.n.length + 1) : e.l[0] || '';
  }
  const npcLines = (e) => (isEn() && e.le && e.le.length ? e.le : e.l);
  const CHEST_KIND = (c, q) => (q && q.t === 'npc' ? T`人物给` : q && q.t === 'evt' ? T`事件` : q && q.t === 'obj' ? T`拾取` : q && q.t === 'floor' ? T`地上`
    : c.sage ? T`贤者宝箱` : c.hid ? T`调查${tr(c.n || '柜子')}` : c.box ? T`宝箱` : T`地上`);
  function placeChests(P) {
    const seen = new Set(), out = [];
    for (const l of P.labels) {
      for (const c of D.chests[l] || []) {
        const k = `${c.f}|${c.it.join(',')}`;
        if (seen.has(k)) continue;
        seen.add(k);
        out.push(Object.assign({ lab: l }, c));
      }
    }
    return out;
  }
  // chest rows: chests that read the same (three chests of Healing Leaf in one dungeon) are one row with their spots
  function chestRows(chests, cells) {
    const by = new Map(), out = [];
    for (const c of chests) {
      const q = chestSrc(c);
      const r = cells(c, q);
      const k = r.key;
      if (by.has(k)) { const o = by.get(k); o.n++; o.spots.push({ s: c.lab, w: c.w }); continue; }
      const o = Object.assign({ n: 1, spots: [{ s: c.lab, w: c.w }], c, q }, r);
      by.set(k, o);
      out.push(o);
    }
    return out;
  }
  const chestName = (o) => `${itemsLinks(o.c.it)}${o.n > 1 ? ` <span class="faint small">${T`（${o.n} 处）`}</span>` : ''}${chestImportant(o.c) ? ` <span class="pill lim">${T`稀有`}</span>` : ''}`;
  const chestNotes = (c, q, P) => {
    const notes = [];
    const alts = q ? srcAlts(q) : [];
    if (alts.length) notes.push(T`条件：${orList(alts.map((a) => list(a.map((x) => esc(condText(x))))))}`);
    if (q && isLimited(q)) notes.push(`<span class="warn">${T`限时：${deadline(q)}就拿不到了`}</span>`);
    if (q && q.share && q.share.length) notes.push(`<span class="warn">${T`和别处的柜子共用“已拿”记录`}</span>`);
    if (c.x) notes.push(esc(tr(c.x)));
    if (c.sage) notes.push(T`贤者宝箱：打开后再带着苏鲁面包调查一次喂它`);
    return notes;
  };
  // one-time gives here that are not on the chest list (people, events)
  function placeGives(P, chests) {
    const flags = new Set(chests.map((c) => c.f));
    const out = [];
    for (const [id, it] of Object.entries(IT.items)) {
      for (const q of it.src) {
        if (!q.s || !P.labels.includes(q.s) || !['npc', 'evt', 'hid', 'obj', 'craft'].includes(q.t)) continue;
        if ((q.once || []).some((f) => flags.has(f))) continue;
        out.push({ id, q });
      }
    }
    return out;
  }
  // a place's shops: the same shop in several story versions of the place is one shop; its stock listed once
  function placeShops(P) {
    const out = [], by = new Map();
    for (const s of IT.shops) {
      if (!P.labels.includes(s.s)) continue;
      const k = JSON.stringify([s.n, uniq(s.items), uniq(s.plat || [])]);
      const o = by.get(k);
      const alt = simplifyAlts(s.alt && s.alt.length ? s.alt : [[]]);
      if (o) { o.labs.push(s.s); o.alts.push([s.s, alt]); continue; }
      const c = Object.assign({}, s, { items: uniq(s.items), plat: uniq(s.plat || []), labs: [s.s], alts: [[s.s, alt]] });
      by.set(k, c);
      out.push(c);
    }
    return out;
  }
  // a place's people: one row per person and line (the same villager in several story versions, the stand-in actors)
  function npcGroups(recs) {
    const by = new Map(), out = [];
    for (const e of recs) {
      const k = `${e.n}|${e.l[0] || ''}`;
      const o = by.get(k);
      if (o) { o.recs.push(e); continue; }
      const g = { e, recs: [e] };
      by.set(k, g);
      out.push(g);
    }
    for (const g of out) {
      const per = new Map();
      for (const e of g.recs) per.set(e.s, (per.get(e.s) || 0) + 1);
      g.n = Math.max(...per.values());
      g.whens = uniq(g.recs.map((e) => e.s).filter((l) => SCENE_WHEN[l]).map(sceneWhen));
      g.spots = g.recs.filter((e) => e.w).map((e) => ({ s: e.s, w: e.w }));
    }
    return out;
  }
  const placeNpcs = (P) => NPC.npcs.map((e, i) => Object.assign({ i }, e)).filter((e) => P.labels.includes(e.s));
  const npcCell = (g, multi) => `${g.e.n ? aNpc(g.e.i) : `<span class="faint">${T`（无名）`}</span>${g.n > 1 ? ` ×${g.n}` : ''}`}${multi && g.whens.length ? `<div class="faint small">${esc(g.whens.join(' / '))}</div>` : ''}`;
  function placeExits(P) {
    const out = new Map();
    for (const l of P.labels) {
      for (const e of ((D.mapx || {})[l] || {}).exits || []) {
        for (const t of [e[2], e[3]].filter(Boolean)) {
          const Q = placeOf(t);
          if (!Q || Q === P || Q.cut) continue;
          out.set(Q.key, Q);
        }
      }
    }
    // the way back: places whose exits lead here
    for (const [l, x] of Object.entries(D.mapx || {})) {
      if (P.labels.includes(l) || isCut(l)) continue;
      for (const e of x.exits || []) if ([e[2], e[3]].some((t) => t && P.labels.includes(t))) { const Q = placeOf(l); if (Q && Q !== P && !Q.cut) out.set(Q.key, Q); }
    }
    return [...out.values()];
  }
  const placeBosses = (P) => BOSSES.filter((b) => P.labels.some((l) => (D.boss[l] || []).includes(b.id) && GUIDE.ch[b.ch].labels.includes(l)));
  function placeSteps(P) {
    const out = [];
    GUIDE.ch.forEach((c, ci) => c.steps.forEach((st, si) => {
      const at = st.at && P.labels.includes(st.at[0]);
      const wh = !st.at && st.where && st.where.split(' · ')[0].split(' → ')[0] === P.zh;
      if (at || wh) out.push({ ci, si, st });
    }));
    return out;
  }
  // which scenes have a map, known without loading the atlas itself
  const ATLAS_IDX = new Set(X.atlas_scenes || []);
  const hasMap = (P) => P.labels.some((l) => ATLAS_IDX.has(l));

  // random battles of a place: one block per story period; the same period and formations in several story versions
  // of the place are one block naming the versions
  function encounterHtml(P) {
    const labs = P.labels.filter((l) => D.enct[l] && !isCut(l));
    if (!labs.length) return '';
    const blocks = [], by = new Map();
    for (const l of labs) {
      const groups = encGroups(l).filter((g) => !g.transient);
      if (!groups.some((g) => g.zones.length)) continue;
      for (const g of groups) {
        const per = periodText(groups, g);
        const forms = new Map();
        for (const z of g.zones) for (const f of z.rows) {
          const k = f.slice().sort((a, b) => a - b).join(',');
          const o = forms.get(k) || { f, rate: 0 };
          o.rate = Math.max(o.rate, z.rate);
          forms.set(k, o);
        }
        const rates = uniq(g.zones.map((z) => z.rate));
        const key = JSON.stringify([per, [...forms.keys()].sort(), rates, g.zones.length]);
        const b = by.get(key);
        if (b) { b.labs.push(l); continue; }
        const nb = { key, per, forms, rates, zs: g.zones.length, labs: [l] };
        by.set(key, nb);
        blocks.push(nb);
      }
    }
    if (!blocks.length) return '';
    const multi = labs.length > 1;
    let h = '';
    for (const b of blocks) {
      const whens = multi ? uniq(b.labs.map((l) => sceneWhen(l) || placeName(l))) : [];
      const head = `<b>${esc(b.per || T`全程`)}</b>${whens.length && whens.length < labs.length ? `<span class="small">${esc(whens.join(' / '))}</span>` : ''}`;
      if (!b.forms.size) { h += `<div class="src"><div class="src-h">${head}<span class="faint small">${T`不会遇敌`}</span></div></div>`; continue; }
      h += `<div class="src"><div class="src-h">${head}<span class="faint small">${b.zs > 1 ? T`${b.zs} 个遇敌区域，` : ''}${T`遇敌率 ${b.rates.join(' / ')}`}</span></div>`
        + `<div class="src-b small">${[...b.forms.values()].map((o) => formText(o.f)).join('<br>')}</div></div>`;
    }
    return h2('enc', T`随机遇敌`) + `<p class="note">${T`剧情推进后遇到的敌人会变（例如迷雾散去后不再遇敌）。每一组写着从什么时候开始；遇敌率越高遇敌越频繁（熏香、幸运铃、邪之护符可以降低）。`}</p>` + h;
  }
  function shopHtml(s, P) {
    const row = (id, plat) => `<tr><td class="cell-n">${aItem(id)}${plat ? ` <span class="pill lim">${T`白金卡`}</span>` : ''}</td><td class="small">${esc(itemBrief(String(id)))}</td><td class="num">${num((D.items[id] || {}).price || 0)}G</td></tr>`;
    const multi = P && P.labels.length > 1 && s.labs.length < P.labels.filter((l) => !isCut(l)).length;
    const whens = multi ? uniq(s.labs.map((l) => sceneWhen(l)).filter(Boolean)) : [];
    const conds = s.alts.filter(([, a]) => a.length);
    let open = '';
    if (conds.length) {
      const one = (a) => orList(a.map((x) => list(x.map((c) => esc(condText(c))))));
      open = conds.length === s.alts.length && uniq(conds.map(([, a]) => JSON.stringify(a))).length === 1
        ? T`营业：${one(conds[0][1])}`
        : conds.map(([l, a]) => `${esc(sceneWhen(l) || placeName(l))}${colon()}${T`营业：${one(a)}`}`).join('<br>');
    }
    return `<div class="src"><div class="src-h"><b>${esc(tr(s.n))}</b>${whens.length ? `<span class="small">${esc(whens.join(' / '))}</span>` : ''}</div>${open ? `<div class="src-b small faint">${open}</div>` : ''}`
      + table([T`商品`, T`简介`, [T`价格`, 'num']], s.items.map((id) => row(id)).concat(s.plat.map((id) => row(id, true))), { cls: 'compact' }) + '</div>';
  }
  PAGES.place = ([key], R, spot) => {
    const P = PL.get(key) || placeOf(key);
    if (!P) return null;
    const chests = placeChests(P), gives = giveEntries(placeGives(P, chests)), shops = placeShops(P), npcs = npcGroups(placeNpcs(P));
    const exits = placeExits(P), bosses = placeBosses(P), steps = placeSteps(P);
    const prizes = [...Object.values(IT.casino || {}).map((x) => ({ k: 'c', x })), ...Object.values(IT.fish || {}).map((x) => ({ k: 'f', x }))].filter((o) => P.labels.includes(o.x.s));
    const doors = (D.doors || []).some((d) => placeByZh(d.zh) === P);
    const versions = P.labels.filter((l) => SCENE_WHEN[l] && !isCut(l));
    const multi = P.labels.filter((l) => !isCut(l)).length > 1;
    const named = npcs.filter((g) => g.e.n).length;
    const rows = [P.region !== null ? [T`地区`, esc(regionName(P.region))] : null,
      P.ch.length ? [T`章节`, P.world ? T`第${P.ch[0] + 1}–${P.ch[P.ch.length - 1] + 1}章` : list(P.ch.map((i) => aCh(i, chLabel(i))))] : null,
      versions.length > 1 ? [T`不同时期`, versions.map((l) => esc(sceneWhen(l))).join('<br>')] : null,
      chests.length ? [T`宝箱等`, T`${chests.length} 处`] : null, shops.length ? [T`商店`, T`${shops.length} 家`] : null,
      npcs.length ? [T`人物`, T`${npcs.length} 人（有名字的 ${named}）`] : null,
      doors ? [T`风之门`, T`可以用风之门直接回到这里`] : null];
    let h = crumbs([home(), ['places', T`地点`], ['', regionName(P.region)]]);
    h += `<h1>${esc(P.name)}</h1><div class="h1sub">${esc(regionName(P.region))}${P.ch.length && !P.world ? ` · ${T`${chLabel(P.ch[0])}${q2(chName(P.ch[0]))}起`}` : ''}${P.cut ? ` · ${T`过场 / 结局用的场景`}` : ''}</div>`;
    h += infobox(P.name, esc(regionName(P.region)), rows);
    const secs = [];
    if (hasMap(P)) secs.push(['map', T`地图`]);
    if (steps.length) secs.push(['story', T`剧情`]);
    if (chests.length || gives.length) secs.push(['chests', T`宝箱与道具`]);
    if (shops.length || prizes.length) secs.push(['shops', T`商店`]);
    if (npcs.length) secs.push(['people', T`人物`]);
    if (D.enct[P.labels.find((l) => D.enct[l])]) secs.push(['enc', T`随机遇敌`]);
    if (bosses.length) secs.push(['boss', T`头目`]);
    if (exits.length) secs.push(['exits', T`相连的地点`]);
    if (secs.length > 3) h += toc(secs);
    if (hasMap(P)) h += h2('map', T`地图`) + mapHtml(P, spot);
    if (steps.length) {
      h += h2('story', T`剧情`);
      let ci = -1;
      for (const { ci: c, st } of steps) {
        if (c !== ci) { if (ci >= 0) h += '</ol>'; ci = c; h += `<h3>${aCh(c)}</h3><ol class="steps">`; }
        h += stepHtml(st, true);
      }
      h += '</ol>';
    }
    if (chests.length || gives.length) {
      h += h2('chests', T`宝箱与道具`);
      if (chests.length) {
        const rs = chestRows(chests, (c, q) => {
          const when = multi && SCENE_WHEN[c.lab] ? sceneWhen(c.lab) : '';
          const notes = chestNotes(c, q, P);
          const near = q && q.near ? tr(q.near) : '';
          return { key: JSON.stringify([c.it, CHEST_KIND(c, q), notes, when, near]), when, notes, near };
        }).map((o) => `<tr><td class="cell-n">${chestName(o)}${o.when ? `<div class="faint small">${esc(o.when)}</div>` : ''}</td><td class="small nw">${esc(CHEST_KIND(o.c, o.q))}</td>`
          + `<td class="small">${o.notes.join('<br>') || '<span class="faint">—</span>'}${o.near ? `<div class="faint">${T`靠近${q2(esc(o.near))}`}</div>` : ''}</td><td class="small nw">${spotLinks(o.spots, T`地图`)}</td></tr>`);
        h += table([T`东西`, T`怎么拿`, T`条件 / 注意`, ''], rs);
      }
      if (gives.length) h += `<h3>${T`人物和事件给的东西`}</h3>` + gives.map(giveHtml).join('');
    }
    if (shops.length || prizes.length) {
      h += h2('shops', T`商店`) + (shops.length ? `<p class="note">${T`标着“白金卡”的是秘密商品：持有或装备白金卡时才会显示。`}</p>` : '');
      h += shops.map((s) => shopHtml(s, P)).join('');
      for (const o of prizes) h += prizeTable(o.k, o.x);
    }
    if (npcs.length) {
      h += h2('people', T`人物（${npcs.length}）`);
      const rs = npcs.slice().sort((a, b) => (!!b.e.n - !!a.e.n)).map((g) => `<tr><td class="cell-n">${npcCell(g, multi)}</td><td class="small nl">${esc(npcLine(g.e))}</td><td class="small nw">${g.spots.length ? spotLinks(g.spots, T`地图`) : `<span class="faint">${T`剧情时出现`}</span>`}</td></tr>`);
      h += table([T`人物`, T`说的话`, ''], rs);
    }
    h += encounterHtml(P);
    if (bosses.length) {
      h += h2('boss', T`头目`) + `<ul class="bul">${bosses.map((b) => { const m = D.mons[b.id] || {}; return `<li>${aMon(b.id)} <span class="faint small">HP ${num(m.hp || 0)} · ${aCh(b.ch, chLabel(b.ch))}</span>${b.opt ? ` <span class="pill mist">${T`隐藏`}</span>` : ''}</li>`; }).join('')}</ul>`;
    }
    if (exits.length) h += h2('exits', T`相连的地点`) + `<p>${list(exits.map((Q) => aPlace(Q.key)))}</p>`;
    return { title: P.name, html: h, after: (root) => initMaps(root) };
  };
  PAGES.spot = ([lab, x, z]) => {
    const out = PAGES.place([PL_OF[lab] || lab], null, { s: lab, x: Number(x), z: Number(z) });
    if (!out) return out;
    const after = out.after;
    out.after = (root) => { after(root); const mb = $('.mapbox', root); if (mb) mb.scrollIntoView({ block: 'start' }); window.scrollBy(0, -70); };
    return out;
  };

  PAGES.places = () => {
    let h = crumbs([home(), ['', T`地点`]]) + `<h1>${T`地点`}</h1><div class="h1sub">${T`按剧情顺序排列的城镇、迷宫和大地图。每个地点有地图、宝箱、商店、人物和遇敌资料。`}</div>`;
    const all = placeList().filter((P) => !P.cut);
    for (let r = 0; r < GUIDE.regions.length; r++) {
      const ps = all.filter((P) => P.region === r);
      h += h2('r' + r, regionName(r));
      h += `<div class="cards">${ps.map((P) => {
        const nc = placeChests(P).length, ns = placeShops(P).length, nn = npcGroups(placeNpcs(P)).filter((g) => g.e.n).length;
        const chs = P.ch.map((i) => i + 1);
        const bits = [P.world ? T`大地图` : T`第${chs.slice(0, 4).join(isEn() ? ', ' : '、')}${chs.length > 4 ? '…' : ''}章`];
        if (nc) bits.push(T`宝箱 ${nc}`);
        if (ns) bits.push(T`商店 ${ns}`);
        if (nn) bits.push(T`人物 ${nn}`);
        return `<a class="card" href="#place-${P.key}"><b>${esc(P.name)}</b><span>${bits.join(' · ')}</span></a>`;
      }).join('')}</div>`;
    }
    const other = all.filter((P) => P.region === null);
    if (other.length) h += h2('other', T`其他`) + `<p>${list(other.map((P) => aPlace(P.key)))}</p>`;
    h += `<p class="note">${T`用${q2(aItem(137))}可以瞬间回到去过的城镇：${list(uniq((D.doors || []).map((d) => d.zh)).map((n) => { const P = placeByZh(n); return P ? aPlace(P.key) : esc(tr(n)); }))}。`}</p>`;
    const cut = placeList().filter((P) => P.cut);
    if (cut.length) h += `<details class="fold"><summary>${T`过场和结局用的场景（${cut.length}）`}</summary><div class="fb small">${list(cut.map((P) => aPlace(P.key)))}</div></details>`;
    return { title: T`地点`, html: h };
  };

  PAGES.chests = () => {
    let h = crumbs([home(), ['', T`宝箱`]]) + `<h1>${T`宝箱`}</h1><div class="h1sub">${T`全游戏的宝箱、柜子 / 书架里的东西、地上的发光处和贤者宝箱，按地点排列。`}</div>`;
    h += `<p class="note">${T`“限时”的东西过了那段剧情就拿不到了；有条件的写在旁边。点“地图”看位置。重要物品和稀有物品标着“稀有”。`}</p>`;
    let total = 0;
    const body = [];
    for (let r = 0; r < GUIDE.regions.length; r++) {
      body.push(h2('r' + r, regionName(r)));
      for (const P of placeList().filter((x) => !x.cut && x.region === r)) {
        const cs = placeChests(P);
        if (!cs.length) continue;
        total += cs.length;
        const lim = cs.filter((c) => { const q = chestSrc(c); return q && isLimited(q); }).length;
        const rs = chestRows(cs, (c, q) => {
          const note = q && isLimited(q) ? `<span class="warn">${T`限时：${deadline(q)}`}</span>` : q && srcAlts(q).length ? esc(list(srcAlts(q)[0].map(condText))) : '';
          return { key: JSON.stringify([c.it, CHEST_KIND(c, q), note]), note };
        }).map((o) => `<tr><td class="cell-n">${chestName(o)}</td><td class="small nw">${esc(CHEST_KIND(o.c, o.q))}</td><td class="small">${o.note}</td><td class="small nw">${spotLinks(o.spots, T`地图`)}</td></tr>`);
        body.push(`<details class="fold"><summary><b>${esc(P.name)}</b><span class="faint small">${T`${cs.length} 处`}${lim ? T`，限时 ${lim}` : ''}</span><a class="small" href="#place-${P.key}">${T`地点页`}</a></summary><div class="fb">${table([T`东西`, T`怎么拿`, T`注意`, ''], rs, { cls: 'compact' })}</div></details>`);
      }
    }
    h += `<p>${T`共 ${total} 处。`}</p>` + body.join('');
    return { title: T`宝箱`, html: h };
  };

  PAGES.shops = () => {
    let h = crumbs([home(), ['', T`商店`]]) + `<h1>${T`商店`}</h1><div class="h1sub">${T`每家商店的货单和价格（卖出得一半）。`}</div>`;
    h += `<p class="note">${T`标“白金卡”的是秘密商品，持有或装备${q2(aItem(255))}时才显示。有营业条件的商店写在店名旁边。赌场和钓鱼的奖品见<a href="#minigames">小游戏</a>。`}</p>`;
    for (let r = 0; r < GUIDE.regions.length; r++) {
      h += h2('r' + r, regionName(r));
      for (const P of placeList().filter((x) => !x.cut && x.region === r)) {
        const ss = placeShops(P);
        if (!ss.length) continue;
        h += `<h3><a href="#place-${P.key}">${esc(P.name)}</a></h3>` + ss.map((s) => shopHtml(s, P)).join('');
      }
    }
    return { title: T`商店`, html: h };
  };

  // ------------------------------------------------------------------ 人物
  PAGES.npcs = () => {
    const nNamed = new Set(NPC.npcs.filter((e) => e.n).map((e) => e.n)).size;
    let h = crumbs([home(), ['', T`人物`]]) + `<h1>${T`人物（NPC）`}</h1><div class="h1sub">${T`游戏里的人物按地点排列：有名字的 ${nNamed} 位，加上没有名字的村民等。`}</div>`;
    h += `<p><input id="npcq" type="search" placeholder="${esc(T`筛选：名字、地点或说的话`)}" style="width:min(420px,100%);height:34px;border:1px solid var(--line);border-radius:8px;padding:0 10px;background:var(--sunk);color:var(--ink);font:inherit"> <label class="small"><input type="checkbox" id="npcanon"> ${T`也显示无名的人`}</label></p>`;
    h += '<div id="npclist"></div>';
    return {
      title: T`人物`, html: h, after: (root) => {
        const q = $('#npcq', root), an = $('#npcanon', root), box = $('#npclist', root);
        q.value = store.get('npcq', ''); an.checked = store.get('npcanon', false);
        const draw = () => {
          const f = q.value.trim().toLowerCase();
          store.set('npcq', q.value); store.set('npcanon', an.checked);
          let out = '';
          for (const P of placeList()) {
            const multi = P.labels.filter((l) => !isCut(l)).length > 1;
            const hit = (e) => !f || (e.n || '').includes(f) || (e.ne || '').toLowerCase().includes(f) || P.name.toLowerCase().includes(f)
              || e.l.some((x) => x.includes(f)) || (e.le || []).some((x) => x.toLowerCase().includes(f));
            const gs = npcGroups(placeNpcs(P).filter((e) => (an.checked || e.n || f) && hit(e)));
            if (!gs.length) continue;
            out += `<details class="fold"${f ? ' open' : ''}><summary><b>${esc(P.name)}</b><span class="faint small">${T`${gs.length} 人`}</span></summary><div class="fb">${table([T`人物`, T`说的话`], gs.map((g) => `<tr><td class="cell-n">${npcCell(g, multi)}</td><td class="small nl">${esc(npcLine(g.e))}</td></tr>`), { cls: 'compact' })}</div></details>`;
          }
          box.innerHTML = out || `<div class="empty">${T`没有符合的人物`}</div>`;
        };
        q.addEventListener('input', draw);
        an.addEventListener('change', draw);
        draw();
      },
    };
  };
  PAGES.npc = ([i]) => {
    const e0 = NPC.npcs[Number(i)];
    if (!e0) return null;
    const name = e0.n;
    const recs = name ? NPC.npcs.map((e, k) => Object.assign({ i: k }, e)).filter((e) => e.n === name) : [Object.assign({ i: Number(i) }, e0)];
    const gives = [];
    if (name) for (const [id, it] of Object.entries(IT.items)) for (const q of it.src) if (q.n === name && (q.t === 'npc' || q.t === 'evt')) gives.push({ id, q });
    const steps = [];
    if (name) GUIDE.ch.forEach((c, ci) => c.steps.forEach((st) => { if (st.npc && st.npc.split(/[、，]/).includes(name)) steps.push({ ci, st }); }));
    const shown = npcName(e0) || T`无名人物`;
    let h = crumbs([home(), ['npcs', T`人物`]]) + `<h1>${esc(shown)}</h1><div class="h1sub">${list(uniq(recs.map((e) => PL_OF[e.s])).filter(Boolean).map((k) => esc(PL.get(k).name)))}</div>`;
    h += h2('where', T`在哪里`);
    // the same person saying the same in several story versions of a place: one block naming the versions
    const by = new Map();
    for (const e of recs) {
      const k = `${PL_OF[e.s]}|${e.l.join('\n')}`;
      if (!by.has(k)) by.set(k, []);
      by.get(k).push(e);
    }
    for (const g of by.values()) {
      const e = g[0];
      const whens = uniq(g.map((x) => sceneWhen(x.s)).filter(Boolean));
      const spots = g.filter((x) => x.w).map((x) => ({ s: x.s, w: x.w }));
      h += `<div class="src"><div class="src-h"><b>${aPlace(e.s)}</b>${whens.length ? `<span class="faint small">${esc(whens.join(' / '))}</span>` : ''}${spots.length ? spotLinks(spots) : `<span class="faint small">${T`剧情时才出现`}</span>`}</div><div class="src-b">${npcLines(e).map((x) => `<div class="quote">${esc(x)}</div>`).join('')}</div></div>`;
    }
    if (gives.length) h += h2('gives', T`给的东西`) + giveEntries(gives).map(giveHtml).join('');
    if (steps.length) h += h2('story', T`剧情中`) + `<ul class="bul">${steps.map(({ ci, st }) => `<li>${aCh(ci, chLabel(ci))}${colon()}${esc(tr(st.t))}</li>`).join('')}</ul>`;
    return { title: shown, html: h };
  };

/* ---- 45-map.js ---- */
  // ------------------------------------------------------------------ static maps (the tracker's connected-map atlas:
  // every scene's rooms joined at their doors, teleports and exits, one map per area; cell code 0 none, 2p+1 floor of
  // room p, 2p+2 its wall). No player, no live state: chests, cabinets, shops, save points, exits, NPCs, a marked spot.
  let ATL = null;
  const atlWait = [];
  function withAtlas(cb) {
    if (ATL) { cb(); return; }
    atlWait.push(cb);
    if (atlWait.length > 1) return;
    const done = () => { ATL = window.LG_ATLAS || { err: 'load' }; if (!ATL.err) ATL.cache = {}; atlWait.splice(0).forEach((f) => f()); };
    if (window.LG_ATLAS) { done(); return; }
    const sc = document.createElement('script');
    sc.src = 'data/atlas.js';
    sc.onload = done;
    sc.onerror = () => { window.LG_ATLAS = { err: 'load' }; done(); };
    document.head.appendChild(sc);
  }
  const ATLAS_SCENES = () => (ATL && !ATL.err ? ATL.scenes : {});
  function atlasArea(ai) {
    if (ATL.cache[ai]) return ATL.cache[ai];
    const ar = ATL.areas[ai];
    const A = { i: ai, ar, sc: {}, imgs: [] };
    for (const s of ar.scenes) {
      const d = ATL.scenes[s];
      const code = new Uint16Array(65536);
      for (let i = 0, p = 0; i < d.m.length; i += 2) { if (d.m[i]) code.fill(d.m[i], p, p + d.m[i + 1]); p += d.m[i + 1]; }
      A.sc[s] = { code, off: d.n.map(() => null), lay: d.n.map(() => 0), n: d.n, tele: d.tele || [], main: null, mainLay: 0, bb: d.n.map(() => [256, 256, -1, -1]) };
    }
    for (const [s, p, dx, dz, f] of ar.pieces) if (A.sc[s]) { A.sc[s].off[p] = [dx * 128, dz * 128]; A.sc[s].lay[p] = f || 0; }
    A.nl = (ar.lbox || []).length || 1;
    A.lbox = (ar.lbox || []).map((b) => (b ? { x0: b[0], z0: b[1], x1: b[2], z1: b[3] } : null));
    for (const s of ar.scenes) {
      const SC = A.sc[s];
      let best = -1;
      SC.off.forEach((o, p) => { if (o && (best < 0 || SC.n[p] > SC.n[best])) best = p; });
      SC.main = best >= 0 ? SC.off[best] : [0, 0];
      SC.mainLay = best >= 0 ? SC.lay[best] : 0;
      for (let c = 0; c < 65536; c++) {
        const v = SC.code[c];
        if (!v) continue;
        const b = SC.bb[(v - 1) >> 1], x = c & 255, z = c >> 8;
        if (x < b[0]) b[0] = x; if (z < b[1]) b[1] = z; if (x > b[2]) b[2] = x; if (z > b[3]) b[3] = z;
      }
      SC.bb.forEach((b, p) => {
        if (!SC.off[p] || b[2] < 0) return;
        const w = b[2] - b[0] + 1, hh = b[3] - b[1] + 1;
        const cv = document.createElement('canvas');
        cv.width = w; cv.height = hh;
        const cx = cv.getContext('2d');
        const id = cx.createImageData(w, hh);
        for (let z = b[1]; z <= b[3]; z++) {
          for (let x = b[0]; x <= b[2]; x++) {
            const v = SC.code[z * 256 + x];
            if (!v || ((v - 1) >> 1) !== p) continue;
            const q = ((b[3] - z) * w + (x - b[0])) * 4;
            if (v & 1) { id.data[q] = 30; id.data[q + 1] = 40; id.data[q + 2] = 54; } else { id.data[q] = 124; id.data[q + 1] = 135; id.data[q + 2] = 154; }
            id.data[q + 3] = 255;
          }
        }
        cx.putImageData(id, 0, 0);
        const o = SC.off[p];
        A.imgs.push({ s, p, f: SC.lay[p], img: cv, x0: b[0] * 64 + o[0], z1: (b[3] + 1) * 64 + o[1], w: w * 64, h: hh * 64 });
      });
    }
    const bb = ar.bbox;
    A.bbox = { x0: bb[0], z0: bb[1], x1: bb[2], z1: bb[3] };
    ATL.cache[ai] = A;
    return A;
  }
  function atlasPiece(A, label, x, z, F, r = 6) {
    const SC = A.sc[label];
    if (!SC) return -1;
    const xs = Math.floor(x / 64), zs = Math.floor(z / 64);
    for (let rr = 0; rr <= r; rr++) {
      let best = -1, bd = 1e9;
      for (let dz = -rr; dz <= rr; dz++) {
        for (let dx = -rr; dx <= rr; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dz)) !== rr) continue;
          const cx = xs + dx, cz = zs + dz;
          if (cx < 0 || cx > 255 || cz < 0 || cz > 255) continue;
          const v = SC.code[cz * 256 + cx];
          if (!v) continue;
          const p = (v - 1) >> 1;
          if (SC.off[p] && (F === undefined || SC.lay[p] === F) && dx * dx + dz * dz < bd) { bd = dx * dx + dz * dz; best = p; }
        }
      }
      if (best >= 0) return best;
    }
    return -1;
  }
  // scene position -> map position [x, z, piece]; with a layer F only a room of that layer counts (a doorway between
  // two layers shows on both)
  function atlasPos(A, label, x, z, F) {
    const SC = A.sc[label];
    if (!SC) return null;
    const p = atlasPiece(A, label, x, z, F);
    if (F !== undefined && p < 0) return null;
    const o = p >= 0 ? SC.off[p] : SC.main;
    return [x + o[0], z + o[1], p];
  }
  const atlasLayer = (A, label, p) => { const SC = A.sc[label]; return !SC ? 0 : p >= 0 ? SC.lay[p] : SC.mainLay; };
  const LINK_EXIT = '232,238,247';
  const connLetter = (n) => (n < 26 ? '' : String.fromCharCode(65 + Math.floor(n / 26) - 1)) + String.fromCharCode(65 + (n % 26));
  const SHOP_TEXT = { arms: '武器防具店', items: '杂货店' };
  // the atlas areas a place covers (story versions can be separate areas), each named by what tells them apart
  function placeAreas(P) {
    const sc = ATLAS_SCENES();
    const ids = uniq(P.labels.filter((l) => sc[l]).map((l) => sc[l].a));
    return ids.map((ai) => {
      const scenes = ATL.areas[ai].scenes.filter((s) => PL_OF[s] === P.key);
      const tag = uniq(scenes.map((s) => sceneWhen(s)).filter(Boolean)).join(' / ');
      return { ai, scenes, tag };
    });
  }

  // one map widget: { el, A, F (layer shown), view {cx, cz, k}, marks [...], spot }
  const MAPS = [];
  // the one-letter tags drawn on the map
  const TAG = () => (isEn() ? { hid: 'C', sage: 'SG', save: 'SV', arms: 'W', items: 'I' } : { hid: '柜', sage: '贤', save: '存', arms: '武', items: '杂' });
  function mapHtml(P, spot) {
    const g = TAG();
    return `<div class="mapbox" data-map="${esc(P.key)}"${spot ? ` data-spot="${esc(spot.s)}|${spot.x}|${spot.z}"` : ''}><div class="mapbar"><span class="mapareas"></span><span class="spacer"></span>`
      + `<span class="maplayers"></span><label class="mb"><input type="checkbox" class="m-npc">${T`人物`}</label>`
      + `<button type="button" class="mb m-out" aria-label="${T`缩小`}">－</button><button type="button" class="mb m-in" aria-label="${T`放大`}">＋</button><button type="button" class="mb m-fit">${T`全图`}</button><button type="button" class="mb m-full">${T`全屏`}</button></div>`
      + `<div class="mapwrap"><canvas height="420"></canvas><div class="maptitle"></div></div></div>`
      + `<div class="legend"><span><i style="background:#f0b429"></i>${T`宝箱`}</span><span><b class="tag" style="background:#f0b429">${g.hid}</b>${T`柜子 / 书架等（调查）`}</span><span><b class="tag" style="background:#d9a066">${g.sage}</b>${T`贤者宝箱`}</span>`
      + `<span><b class="tag" style="background:#2ec4ff">${g.save}</b>${T`存档点`}</span><span><b class="tag" style="background:#ff6b5b">${g.arms}</b>${T`武器防具店`}</span><span><b class="tag" style="background:#6fdc8c">${g.items}</b>${T`杂货店`}</span>`
      + `<span><i style="background:#b46cff"></i>${T`传送点（门 / 楼梯）`}</span><span><b class="tag" style="background:#e8eef7">A</b>${T`同字母的两扇门相通`}</span><span><b class="tag" style="background:#e8eef7">→</b>${T`出口（点击前往）`}</span>`
      + `<span><i style="background:#5ee0d0;border-radius:50%"></i>${T`人物（打开“人物”后显示）`}</span><span>${T`点地图上的标记看详情，拖动平移，滚轮 / 双指缩放`}</span></div>`;
  }
  function initMaps(root) {
    MAPS.length = 0;
    const els = $$('.mapbox[data-map]', root);
    if (!els.length) return;
    withAtlas(() => {
      for (const el of els) {
        if (ATL.err) { el.innerHTML = `<div class="empty">${T`地图资料载入失败`}</div>`; continue; }
        const P = PL.get(el.dataset.map);
        const areas = placeAreas(P);
        if (!areas.length) { el.remove(); continue; }
        const sp = el.dataset.spot ? el.dataset.spot.split('|') : null;
        const spot = sp ? { s: sp[0], x: Number(sp[1]), z: Number(sp[2]) } : null;
        let ai = areas[0].ai;
        if (spot && ATL.scenes[spot.s]) ai = ATL.scenes[spot.s].a;
        const M = { el, wrap: $('.mapwrap', el), P, areas, ai, spot, npc: store.get('mapNpc', false), view: null, F: 0, pop: null };
        MAPS.push(M);
        setupMap(M);
        selectArea(M, ai);
      }
    });
  }
  function selectArea(M, ai) {
    M.ai = ai;
    M.A = atlasArea(ai);
    M.F = 0;
    if (M.spot && M.A.sc[M.spot.s]) { const q = atlasPos(M.A, M.spot.s, M.spot.x, M.spot.z); if (q) M.F = atlasLayer(M.A, M.spot.s, q[2]); }
    M.view = null;
    const box = $('.mapareas', M.el);
    box.innerHTML = M.areas.length > 1 ? M.areas.map((a, i) => `<button type="button" data-ai="${a.ai}" class="${a.ai === ai ? 'on' : ''}">${esc(a.tag || T`区域 ${i + 1}`)}</button>`).join('') : '';
    for (const b of $$('button[data-ai]', box)) b.onclick = () => selectArea(M, Number(b.dataset.ai));
    layerChips(M);
    closePop(M);
    drawMap(M);
  }
  // stacked places (a tower's floors, houses moved off the street): one chip per layer, with what is on it
  function layerChips(M) {
    const box = $('.maplayers', M.el);
    const A = M.A;
    if (A.nl < 2) { box.innerHTML = ''; return; }
    const cnt = new Array(A.nl).fill(0);
    for (const s of A.ar.scenes) for (const c of D.chests[s] || []) {
      if (!c.w) continue;
      const q = atlasPos(A, s, c.w[0], c.w[1]);
      if (q) cnt[atlasLayer(A, s, q[2])]++;
    }
    box.innerHTML = `<span class="small muted">${T`图层`}</span>` + cnt.map((n, f) => `<button type="button" data-f="${f}" class="${f === M.F ? 'on' : ''}" title="${n ? T`这一层有 ${n} 个宝箱 / 调查点` : T`这一层没有宝箱`}">${f + 1}${n ? `<small>${T`·宝箱 ${n}`}</small>` : ''}</button>`).join('');
    for (const b of $$('button', box)) b.onclick = () => { M.F = Number(b.dataset.f); M.view = null; closePop(M); layerChips(M); drawMap(M); };
  }
  function fitView(M, W, H) {
    const A = M.A;
    let bb = A.nl > 1 && A.lbox[M.F] ? A.lbox[M.F] : A.bbox;
    const w = Math.max(bb.x1 - bb.x0, 2048), h = Math.max(bb.z1 - bb.z0, 2048);
    M.view = { k: Math.min(W / (w * 1.08), H / (h * 1.08)), cx: (bb.x0 + bb.x1) / 2, cz: (bb.z0 + bb.z1) / 2 };
    if (M.spot && M.A.sc[M.spot.s] && !M.spotted) {
      const q = atlasPos(M.A, M.spot.s, M.spot.x, M.spot.z);
      if (q) { M.view.cx = q[0]; M.view.cz = q[1]; M.view.k = Math.max(M.view.k, 16 * (window.devicePixelRatio || 1) / 128); }
      M.spotted = true;
    }
  }
  function badgeFn(ctx, dpr) {
    return (x, y, text, bg, fg) => {
      ctx.font = `bold ${Math.round(11 * dpr)}px sans-serif`;
      const w = Math.max(ctx.measureText(text).width + 8 * dpr, 16 * dpr), h = 16 * dpr;
      ctx.fillStyle = bg;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x - w / 2, y - h / 2, w, h, 4 * dpr); else ctx.rect(x - w / 2, y - h / 2, w, h);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.lineWidth = dpr; ctx.stroke();
      ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(text, x, y + 0.5 * dpr);
      ctx.textBaseline = 'alphabetic';
      return { x0: x - w / 2, x1: x + w / 2, y0: y - h / 2, y1: y + h / 2 };
    };
  }
  const chestImportant = (c) => !!(c.it && c.it.some((id) => (IT.items[id] && IT.items[id].c === 'key') || RARE.includes(id)));
  function drawMap(M) {
    const cv = $('canvas', M.wrap);
    const dpr = window.devicePixelRatio || 1;
    const full = M.el.classList.contains('mapfull');
    const cw = Math.max(260, M.wrap.clientWidth);
    const W = Math.round(cw * dpr);
    const H = full ? Math.round(Math.max(200, M.wrap.clientHeight) * dpr) : Math.round(Math.min(cw * (window.innerWidth < 760 ? 0.95 : 0.62), 640) * dpr);
    if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; cv.style.height = full ? '100%' : `${H / dpr}px`; }
    if (!M.view) fitView(M, W, H);
    const A = M.A, F = M.F, V = M.view;
    const ctx = cv.getContext('2d');
    ctx.fillStyle = '#0b0e13';
    ctx.fillRect(0, 0, W, H);
    const k = V.k;
    const sx = (x) => (x - V.cx) * k + W / 2, sy = (z) => (V.cz - z) * k + H / 2;
    const onF = (lab, p) => A.nl < 2 || atlasLayer(A, lab, p) === F;
    const at = (lab, x, z) => { const q = atlasPos(A, lab, x, z); return q && onF(lab, q[2]) ? [sx(q[0]), sy(q[1])] : null; };
    const atEdge = (lab, x, z) => { const q = A.nl > 1 ? atlasPos(A, lab, x, z, F) : atlasPos(A, lab, x, z); return q ? [sx(q[0]), sy(q[1])] : null; };
    const atTile = (lab, tx, tz) => { const q = A.nl > 1 ? atlasPos(A, lab, tx * 128 + 64, tz * 128 + 64, F) : atlasPos(A, lab, tx * 128 + 64, tz * 128 + 64); return q ? [sx(q[0] - 64), sy(q[1] + 64)] : null; };
    ctx.imageSmoothingEnabled = false;
    const mine = (s) => PL_OF[s] === M.P.key;
    for (const g of A.imgs) {
      if (A.nl > 1 && g.f !== F) continue;
      const x = sx(g.x0), y = sy(g.z1), w = g.w * k, h = g.h * k;
      if (x > W || y > H || x + w < 0 || y + h < 0) continue;
      ctx.globalAlpha = mine(g.s) ? 1 : 0.45;
      ctx.drawImage(g.img, x, y, w, h);
    }
    ctx.globalAlpha = 1;
    const tile = 128 * k;
    const badge = badgeFn(ctx, dpr);
    const compact = tile < 4 * dpr;
    const marks = [];                                 // hit boxes for clicks
    const dot = (x, y, bg) => { ctx.fillStyle = bg; ctx.fillRect(x - 2.5 * dpr, y - 2.5 * dpr, 5 * dpr, 5 * dpr); };
    // teleports
    ctx.lineWidth = Math.max(1, 1.5 * dpr);
    for (const s of A.ar.scenes) {
      ctx.globalAlpha = mine(s) ? 1 : 0.5;
      ctx.strokeStyle = '#b46cff'; ctx.fillStyle = 'rgba(180,108,255,.25)';
      for (const t of A.sc[s].tele) { const q = atTile(s, t[0], t[1]); if (q) { ctx.fillRect(q[0], q[1], tile, tile); ctx.strokeRect(q[0], q[1], tile, tile); } }
    }
    ctx.globalAlpha = 1;
    // connectors between doors that could not be put side by side: near = dashed line, far = the same letter on both
    let nl = 0;
    const cOn = (c, e) => A.nl < 2 || (c[4 + e] || 0) === F;
    const tags = A.ar.conn.map((c) => {
      if (!cOn(c, 0) && !cOn(c, 1)) return { off: true };
      const far = Math.hypot(c[2] - c[0], c[3] - c[1]) > 16 * 128 || !cOn(c, 0) || !cOn(c, 1);
      return { t: far ? connLetter(nl++) : '', far };
    });
    ctx.save();
    ctx.strokeStyle = `rgba(${LINK_EXIT},.85)`; ctx.fillStyle = `rgba(${LINK_EXIT},.95)`;
    ctx.lineWidth = compact ? Math.max(1, dpr) : Math.max(1.5, 2 * dpr);
    ctx.setLineDash(compact ? [3 * dpr, 3 * dpr] : [6 * dpr, 4 * dpr]);
    A.ar.conn.forEach((c, i) => {
      if (tags[i].far || tags[i].off) return;
      ctx.beginPath(); ctx.moveTo(sx(c[0]), sy(c[1])); ctx.lineTo(sx(c[2]), sy(c[3])); ctx.stroke();
    });
    ctx.setLineDash([]);
    A.ar.conn.forEach((c, i) => {
      if (compact || tags[i].off) return;
      for (const [x, y, e] of [[sx(c[0]), sy(c[1]), 0], [sx(c[2]), sy(c[3]), 1]]) {
        if (!cOn(c, e) || x < -20 || x > W + 20 || y < -20 || y > H + 20) continue;
        if (tags[i].t) badge(x, y, tags[i].t, `rgb(${LINK_EXIT})`, '#0b0e13');
        else { ctx.beginPath(); ctx.arc(x, y, 3.5 * dpr, 0, Math.PI * 2); ctx.fill(); }
      }
    });
    ctx.restore();
    // exits out of this map: a label, clickable
    const exLab = [];
    for (const s of A.ar.scenes) {
      for (const e of ((D.mapx || {})[s] || {}).exits || []) {
        const q = atEdge(s, e[0], e[1]);
        if (!q) continue;
        const tos = uniq([e[2], e[3]].filter(Boolean)).filter((t) => !A.sc[t] && !isCut(t));
        if (!tos.length) continue;
        const to = tos[0];
        if (exLab.some((o) => o.to === to && Math.hypot(o.x - q[0], o.y - q[1]) < 60 * dpr)) continue;
        exLab.push({ to, x: q[0], y: q[1] });
        ctx.strokeStyle = `rgb(${LINK_EXIT})`; ctx.fillStyle = `rgba(${LINK_EXIT},.22)`;
        const tq = atTile(s, Math.floor(e[0] / 128), Math.floor(e[1] / 128));
        if (tq) { ctx.fillRect(tq[0], tq[1], tile, tile); ctx.strokeRect(tq[0], tq[1], tile, tile); }
        const y = q[1] < 24 * dpr ? q[1] + 14 * dpr : q[1] - 14 * dpr;
        ctx.globalAlpha = mine(s) ? 1 : 0.65;
        const b = badge(q[0], y, '→' + tos.map(placeName).join(' / '), `rgba(${LINK_EXIT},.95)`, '#0b0e13');
        marks.push(Object.assign({ kind: 'exit', to: tos, s }, b));
      }
    }
    ctx.globalAlpha = 1;
    // save points and shops
    for (const s of A.ar.scenes) {
      const X = (D.mapx || {})[s] || {};
      const items = [];
      const g = TAG();
      for (const p of X.save || []) items.push({ x: p[0], z: p[1], L: g.save, bg: '#2ec4ff', fg: '#04222e', kind: 'save', name: '存档点' });
      for (const sh of X.shops || []) {
        if (sh[0] === null) continue;
        if (items.some((o) => o.kind === sh[2] && Math.hypot(o.x - sh[0], o.z - sh[1]) < 256)) continue;
        items.push({ x: sh[0], z: sh[1], L: sh[2] === 'arms' ? g.arms : g.items, bg: sh[2] === 'arms' ? '#ff6b5b' : '#6fdc8c', fg: '#1a0a08', kind: 'shop', name: SHOP_TEXT[sh[2]], en: sh[3] });
      }
      for (const f of items) {
        const q = at(s, f.x, f.z);
        if (!q) continue;
        ctx.globalAlpha = mine(s) ? 1 : 0.6;
        if (compact) dot(q[0], q[1], f.bg);
        else marks.push(Object.assign({ kind: f.kind, s, name: f.name, en: f.en }, badge(q[0], q[1], f.L, f.bg, f.fg)));
      }
    }
    ctx.globalAlpha = 1;
    // NPCs (toggle)
    if (M.npc) {
      NPC.npcs.forEach((e, i) => {
        if (!e.w || !A.sc[e.s]) return;
        const q = at(e.s, e.w[0], e.w[1]);
        if (!q) return;
        ctx.globalAlpha = mine(e.s) ? 1 : 0.5;
        ctx.fillStyle = e.n ? '#5ee0d0' : 'rgba(94,224,208,.6)';
        ctx.beginPath(); ctx.arc(q[0], q[1], (e.n ? 4 : 3) * dpr, 0, Math.PI * 2); ctx.fill();
        if (e.n && !compact && tile > 10 * dpr) {
          ctx.font = `${Math.round(10.5 * dpr)}px sans-serif`; ctx.fillStyle = '#bff3ec'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
          ctx.fillText(npcName(e), q[0] + 6 * dpr, q[1]);
          ctx.textBaseline = 'alphabetic';
        }
        const r = 7 * dpr;
        marks.push({ kind: 'npc', i, x0: q[0] - r, x1: q[0] + r, y0: q[1] - r, y1: q[1] + r });
      });
      ctx.globalAlpha = 1;
    }
    // chests
    const r = compact ? 2.5 * dpr : Math.max(4 * dpr, 40 * k);
    const seen = new Set();
    for (const s of A.ar.scenes) {
      for (const c of D.chests[s] || []) {
        if (!c.w || seen.has(s + ':' + c.f + ':' + c.w)) continue;
        seen.add(s + ':' + c.f + ':' + c.w);
        const q = at(s, c.w[0], c.w[1]);
        if (!q) continue;
        ctx.globalAlpha = mine(s) ? 1 : 0.7;
        const [x, y] = q;
        let sr = r;
        if (compact) dot(x, y, '#f0b429');
        else if (c.hid) { badge(x, y, isEn() ? TAG().hid : (c.n ? c.n[0] : TAG().hid), '#f0b429', '#1a1405'); sr = 9 * dpr; }
        else if (c.sage) { badge(x, y, TAG().sage, '#d9a066', '#1a1405'); sr = 9 * dpr; }
        else {
          ctx.fillStyle = '#f0b429'; ctx.shadowColor = '#f0b429'; ctx.shadowBlur = 6 * dpr;
          ctx.fillRect(x - r, y - r * 0.8, 2 * r, 1.6 * r);
          ctx.shadowBlur = 0; ctx.strokeStyle = '#11151c'; ctx.lineWidth = Math.max(1, dpr); ctx.strokeRect(x - r, y - r * 0.8, 2 * r, 1.6 * r);
        }
        if (!compact && chestImportant(c)) {
          const cx = x + sr, cy = y - sr, R = Math.max(4.5 * dpr, sr * 0.7);
          ctx.beginPath();
          for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? R * 0.45 : R; ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); }
          ctx.closePath(); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.strokeStyle = '#11151c'; ctx.lineWidth = Math.max(1, dpr * 0.8); ctx.stroke();
        }
        const hr = Math.max(sr, 8 * dpr);
        marks.push({ kind: 'chest', c, s, x0: x - hr, x1: x + hr, y0: y - hr, y1: y + hr });
      }
    }
    ctx.globalAlpha = 1;
    // the marked spot
    if (M.spot && A.sc[M.spot.s]) {
      const q = at(M.spot.s, M.spot.x, M.spot.z);
      if (q) {
        const [x, y] = q;
        ctx.save();
        ctx.strokeStyle = '#ff5ad1'; ctx.lineWidth = 2.5 * dpr; ctx.shadowColor = '#ff5ad1'; ctx.shadowBlur = 10 * dpr;
        ctx.beginPath(); ctx.arc(x, y, 13 * dpr, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = '#ff5ad1';
        ctx.beginPath();
        for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r2 = (i % 2 ? 3.2 : 8) * dpr; ctx.lineTo(x + Math.cos(a) * r2, y + Math.sin(a) * r2); }
        ctx.closePath(); ctx.fill();
        ctx.restore();
      } else if (A.nl > 1) {
        const q2 = atlasPos(A, M.spot.s, M.spot.x, M.spot.z);
        if (q2) {
          const t = T`标记在图层 ${atlasLayer(A, M.spot.s, q2[2]) + 1}（点上面的图层按钮切换）`;
          ctx.font = `bold ${Math.round(12 * dpr)}px sans-serif`;
          const w = ctx.measureText(t).width + 16 * dpr;
          ctx.fillStyle = 'rgba(11,14,19,.85)'; ctx.fillRect(W / 2 - w / 2, H - 30 * dpr, w, 22 * dpr);
          ctx.fillStyle = '#ff9be2'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(t, W / 2, H - 19 * dpr);
          ctx.textBaseline = 'alphabetic';
        }
      }
    }
    M.marks = marks;
    $('.maptitle', M.wrap).textContent = `${A.ar.name ? tr(A.ar.name) : M.P.name}${A.nl > 1 ? T`（图层 ${F + 1}/${A.nl}）` : ''}`;
  }
  function closePop(M) { if (M.pop) { M.pop.remove(); M.pop = null; } }
  function popHtml(m) {
    if (m.kind === 'chest') {
      const c = m.c;
      const src = chestSrc(c);
      const kind = CHEST_KIND(c, src);
      return `<b>${kind}</b>${colon()}${itemsLinks(c.it)}${c.x ? `<br><span class="faint">${esc(tr(c.x))}</span>` : ''}`
        + `${src && srcAlts(src).length ? `<br><span style="color:#f2c879">${T`条件：${esc(list(srcAlts(src)[0].map(condText)))}`}</span>` : ''}${src && isLimited(src) ? `<br><span style="color:#ff9e7a">${T`限时：${esc(deadline(src))}就拿不到了`}</span>` : ''}`
        + `${c.sage ? `<br><span class="faint">${T`先打开拿道具，再带着苏鲁面包调查一次喂它`}</span>` : ''}`;
    }
    if (m.kind === 'npc') {
      const e = NPC.npcs[m.i];
      return `<b>${e.n ? aNpc(m.i) : T`（无名）`}</b>${SCENE_WHEN[e.s] && placeOf(e.s) && placeOf(e.s).labels.length > 1 ? ` <span class="faint">${esc(sceneWhen(e.s))}</span>` : ''}<br><span class="faint">${esc(npcLine(e))}</span>`;
    }
    if (m.kind === 'exit') return `${T`出口：`}${m.to.map((t) => aPlace(t, placeName(t))).join(' / ')}`;
    if (m.kind === 'shop') return `<b>${esc(tr(m.name))}</b>${m.en && !isEn() ? ` <span class="faint">${esc(m.en)}</span>` : ''}<br><a href="#" data-jump="shops">${T`看这里的货单`}</a>`;
    if (m.kind === 'save') return `<b>${T`存档点`}</b>`;
    return '';
  }
  function setupMap(M) {
    const cv = $('canvas', M.wrap);
    const dpr = () => window.devicePixelRatio || 1;
    const zoom = (f, px, py) => {
      const V = M.view;
      if (!V) return;
      const W = cv.width, H = cv.height;
      if (px !== undefined) { const wx = (px - W / 2) / V.k + V.cx, wz = V.cz - (py - H / 2) / V.k; V.k *= f; V.cx = wx - (px - W / 2) / V.k; V.cz = wz + (py - H / 2) / V.k; } else V.k *= f;
      closePop(M);
      drawMap(M);
    };
    $('.m-in', M.el).onclick = () => zoom(1.4);
    $('.m-out', M.el).onclick = () => zoom(1 / 1.4);
    $('.m-fit', M.el).onclick = () => { M.view = null; closePop(M); drawMap(M); };
    const npcBox = $('.m-npc', M.el);
    npcBox.checked = M.npc;
    npcBox.onchange = () => { M.npc = npcBox.checked; store.set('mapNpc', M.npc); closePop(M); drawMap(M); };
    const fullBtn = $('.m-full', M.el);
    fullBtn.onclick = () => {
      const on = !M.el.classList.contains('mapfull');
      M.el.classList.toggle('mapfull', on);
      fullBtn.textContent = on ? T`退出全屏` : T`全屏`;
      M.view = null;
      closePop(M);
      requestAnimationFrame(() => drawMap(M));
    };
    const pts = new Map();
    let moved = 0;
    cv.addEventListener('pointerdown', (e) => { cv.setPointerCapture(e.pointerId); pts.set(e.pointerId, { x: e.clientX, y: e.clientY }); moved = 0; cv.classList.add('drag'); });
    cv.addEventListener('pointermove', (e) => {
      if (!pts.has(e.pointerId) || !M.view) return;
      const prev = pts.get(e.pointerId);
      if (pts.size === 1) {
        const dx = (e.clientX - prev.x) * dpr(), dy = (e.clientY - prev.y) * dpr();
        moved += Math.abs(dx) + Math.abs(dy);
        M.view.cx -= dx / M.view.k; M.view.cz += dy / M.view.k;
      } else if (pts.size === 2) {
        const [a, b] = [...pts.values()];
        const other = a === prev ? b : a;
        const d0 = Math.hypot(prev.x - other.x, prev.y - other.y), d1 = Math.hypot(e.clientX - other.x, e.clientY - other.y);
        if (d0 > 10) M.view.k *= d1 / d0;
        moved += 99;
      }
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (moved > 4) closePop(M);
      drawMap(M);
    });
    const up = (e) => {
      const wasTap = pts.size === 1 && moved < 6;
      pts.delete(e.pointerId);
      cv.classList.remove('drag');
      if (!wasTap || e.type === 'pointercancel') return;
      const r = cv.getBoundingClientRect();
      const x = (e.clientX - r.left) * dpr(), y = (e.clientY - r.top) * dpr();
      const hit = (M.marks || []).slice().reverse().find((m) => x >= m.x0 && x <= m.x1 && y >= m.y0 && y <= m.y1);
      closePop(M);
      if (!hit) return;
      if (hit.kind === 'exit' && hit.to.length === 1) { location.hash = `#place-${PL_OF[hit.to[0]] || hit.to[0]}`; return; }
      const pop = document.createElement('div');
      pop.className = 'mappop';
      pop.innerHTML = `<span class="x" role="button" aria-label="${T`关闭`}">✕</span>${popHtml(hit)}`;
      M.wrap.appendChild(pop);
      const px = Math.min(Math.max(8, e.clientX - r.left + 10), M.wrap.clientWidth - pop.offsetWidth - 8);
      const py = Math.min(Math.max(8, e.clientY - r.top + 10), M.wrap.clientHeight - pop.offsetHeight - 8);
      pop.style.left = `${px}px`; pop.style.top = `${py}px`;
      $('.x', pop).onclick = () => closePop(M);
      hookPage(pop);
      M.pop = pop;
    };
    cv.addEventListener('pointerup', up);
    cv.addEventListener('pointercancel', up);
    cv.addEventListener('wheel', (e) => {
      e.preventDefault();
      const r = cv.getBoundingClientRect();
      zoom(e.deltaY < 0 ? 1.2 : 1 / 1.2, (e.clientX - r.left) * dpr(), (e.clientY - r.top) * dpr());
    }, { passive: false });
  }
  window.addEventListener('resize', () => { for (const M of MAPS) { if (document.body.contains(M.el)) { M.view = null; drawMap(M); } } });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    for (const M of MAPS) if (M.el.classList.contains('mapfull')) $('.m-full', M.el).click();
  });

/* ---- 50-guide.js ---- */
  // ------------------------------------------------------------------ 攻略
  const npcIdx = {};
  NPC.npcs.forEach((e, i) => { if (e.n && npcIdx[e.n] === undefined) npcIdx[e.n] = i; });
  // job titles, not one person: never auto-linked
  const NPC_GENERIC = /^(旅店老板|村长|镇长|武器商|道具商|小贩|老板|教头|老巫师|老巫婆|瑟鲁新娘|小猪|皮乌拉|苏鲁)$/;
  const npcLinks = (s) => s.split(/([、，,])/).map((p) => (npcIdx[p] !== undefined ? aNpc(npcIdx[p]) : /^[、，,]$/.test(p) ? (isEn() ? ', ' : p) : esc(tr(p)))).join('');
  // "利姆艾姆 · 瓦恩家" -> the place link + the rest
  function whereHtml(w) {
    if (!w) return '';
    const parts = w.split(' · ');
    const legs = parts[0].split(' → ');
    const lead = legs.map((n) => { const P = placeByZh(n); return P ? aPlace(P.key) : esc(tr(n)); }).join(' → ');
    return `${lead}${parts.length > 1 ? ' · ' + esc(tr(parts.slice(1).join(' · '))) : ''}`;
  }
  function stepHtml(st) {
    return `<li>${esc(tr(st.t))}${st.opt ? ` <span class="pill">${T`可选`}</span>` : ''}<div class="st-m">${whereHtml(st.where)}${st.npc ? `　<span class="gm">${T`找`}</span>${npcLinks(st.npc)}` : ''}${st.at ? ' · ' + spotLink({ s: st.at[0], w: [st.at[1], st.at[2]] }) : ''}</div>${st.hint ? `<div class="st-h">${esc(tr(st.hint))}</div>` : ''}</li>`;
  }
  function bossRow(b) {
    const m = D.mons[b.id] || {};
    const weak = [];
    if (m.el !== undefined && m.el < 7) for (let a = 0; a < 7; a++) { const v = elemPct(a, m.el); if (v > 100) weak.push(`${elTag(a)}`); }
    const tip = m.cls === 2 ? T`飘在空中：别打下段` : m.cls === 3 ? T`个子矮：别打上段` : m.st && m.st[2] < m.st[1] * 0.9 ? T`下段防御低` : m.st && m.st[1] < m.st[2] * 0.9 ? T`上段防御低` : '';
    return `<tr><td class="cell-n">${aMon(b.id)}${b.opt ? ` <span class="pill mist">${T`隐藏 / 可选`}</span>` : ''}</td><td class="num">${num(m.hp || 0)}</td><td class="c">${elTag(m.el)}</td><td>${weak.join(' ') || '<span class="faint">—</span>'}</td>`
      + `<td class="small">${tip}</td><td>${m.d ? `${aItem(m.d)} <span class="faint">${m.dp}%</span>` : ''}${D.steal[b.id] ? `<div class="small">${T`偷：${aItem(D.steal[b.id][1])} ${D.steal[b.id][0]}%`}</div>` : ''}</td></tr>`;
  }
  // the time-limited sources (a flag ends them, the place closes, or the story period passes)
  const STORY_KEYS = new Set([106, 179, 180, 188, 189, 190]);
  function limitedList() {
    const out = [];
    for (const [id, it] of Object.entries(IT.items)) {
      if (STORY_KEYS.has(Number(id))) continue;
      if (!it.src.some(isLimited)) continue;
      const rest = it.src.filter((q) => !isLimited(q) && !['none', 'raseru'].includes(q.t));
      // one row per copy; a copy is missable only when every way to it closes
      for (const alts of copyGroups(it.src)) {
        if (!alts.every((g) => isLimited(g[g.length - 1]))) continue;
        out.push({ id, alts, q: alts[0][0], rest, key: it.c === 'key', spots: [alts[0][0]] });
      }
    }
    out.sort((a, b) => ((a.q.ch || 0) - (b.q.ch || 0)) || (a.id - b.id));
    // the same thing the same way at several spots (two chests in one dungeon): one row with both spots
    const merged = [], by = new Map();
    for (const o of out) {
      const k = o.alts.length === 1 && o.alts[0].length === 1 ? JSON.stringify([o.id, o.q.t, o.q.s, o.q.how || '', o.q.n || '', o.q.alt || [], deadline(o.q)]) : null;
      if (k && by.has(k)) { by.get(k).spots.push(o.q); continue; }
      if (k) by.set(k, o);
      merged.push(o);
    }
    return merged;
  }
  const restText = (rest) => {
    if (!rest.length) return `<span class="bad">${T`只有这里有`}</span>`;
    const kinds = uniq(rest.map((q) => (q.t === 'shop' || q.t === 'plat' ? T`${tr(q.p || '')}有卖` : q.t === 'drop' ? T`怪物掉落` : q.t === 'steal' ? T`偷取` : q.t === 'casino' ? T`赌场奖品` : q.t === 'fish' ? T`钓鱼奖品` : q.p ? T`${tr(q.p)}也有` : T`别处也有`)));
    return `<span class="good">${esc(list(kinds.slice(0, 3)))}</span>`;
  };
  const howOf = (q) => (q.how ? tr(q.how) : q.t === 'box' || q.t === 'box2' ? T`宝箱` : q.t === 'hid' ? T`调查${tr(q.n || '柜子')}` : q.t === 'floor' ? T`地上的发光处` : q.t === 'obj' ? T`捡起${tr(q.n || '')}` : q.t === 'shop' || q.t === 'plat' ? T`${tr(q.n || '商店')}有卖` : q.n ? T`找${tr(q.n)}` : T`剧情事件`);
  function limitedRow(o) {
    const one = o.alts.length === 1;
    const ways = o.alts.map((g) => { const q = g[0]; return `${q.s ? aPlace(q.s) : esc(tr(q.p || ''))}${colon()}${esc(howOf(q))}${one && o.spots.length > 1 ? ` <span class="faint small">${T`（${o.spots.length} 处）`}</span>` : ''}${q.w && q.s ? ' · ' + (one ? spotLinks(o.spots, T`地图`) : spotLink(q, T`地图`)) : ''}`; });
    const dls = uniq(o.alts.map((g) => deadline(g[g.length - 1])));
    return `<tr><td class="cell-n">${aItem(o.id)}${o.key ? ` <span class="pill acc">${T`重要`}</span>` : ''}</td><td class="small">${ways.length > 1 ? `<span class="faint">${T`只有一件，任选一处：`}</span><br>${ways.join(`<br>${T`或`} `)}` : ways[0]}</td><td class="small warn">${dls.map(esc).join('<br>')}</td><td class="small">${restText(o.rest)}</td></tr>`;
  }
  PAGES.walkthrough = () => {
    let h = crumbs([home(), ['', T`剧情攻略`]]) + `<h1>${T`剧情攻略`}</h1><div class="h1sub">${T`全部 ${GUIDE.ch.length} 章流程：每一步去哪里、找谁、做什么，头目和这一章能拿的东西。`}</div>`;
    h += `<p>${T`想先看会错过的东西：<a href="#missable">限时道具</a>。隐藏的魔法、头目和练级：<a href="#secret">隐藏要素</a>。`}</p>`;
    let region = -1;
    GUIDE.ch.forEach((c, i) => {
      if (c.region !== region) { region = c.region; h += `<div class="region">${esc(regionName(region))}</div>`; }
      h += `<div class="chrow"><div class="no">${i + 1}</div><div><a href="#ch-${i + 1}"><b>${esc(chName(i))}</b></a>${(c.boss || []).length ? `<span class="faint small">　${T`头目：`}${esc(list(uniq(c.boss.map((b) => monName(b.id)))))}</span>` : ''}<div class="go">${esc(tr(c.goal))}</div></div></div>`;
    });
    h += h2('ref', T`参考资料`) + `<p class="small">${list(GUIDE.src.map(([t, u]) => `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(tr(t))}</a>`))}</p>`;
    return { title: T`剧情攻略`, html: h };
  };
  PAGES.ch = ([n]) => {
    const i = Number(n) - 1, c = GUIDE.ch[i];
    if (!c) return null;
    const places = uniq(c.labels.filter((l) => !/^urudre/.test(l) || c.labels.length < 3).map((l) => PL_OF[l]).filter(Boolean)).map((k) => PL.get(k));
    let h = crumbs([home(), ['walkthrough', T`剧情攻略`], ['', regionName(c.region)]]);
    h += `<h1>${T`第${i + 1}章 ${chName(i)}`}</h1><div class="h1sub">${esc(regionName(c.region))} · ${list(places.map((P) => aPlace(P.key)))}</div>`;
    h += `<p class="lede">${esc(tr(c.goal))}</p>`;
    h += h2('steps', T`流程`) + `<ol class="steps">${c.steps.map((st) => stepHtml(st)).join('')}</ol>`;
    if ((c.boss || []).length) h += h2('boss', T`头目`) + table([T`头目`, ['HP', 'num'], [T`属性`, 'c'], T`弱点`, T`打法`, T`掉落 / 偷取`], c.boss.map(bossRow));
    if (c.notes && c.notes.length) h += h2('notes', T`注意`) + `<ul class="bul">${c.notes.map((x) => `<li>${esc(tr(x))}</li>`).join('')}</ul>`;
    // things to take in this chapter's places
    const cs = [];
    const seenF = new Set();
    for (const l of c.labels) for (const ch of D.chests[l] || []) { const k = `${ch.f}|${ch.it.join(',')}`; if (!seenF.has(k)) { seenF.add(k); cs.push(Object.assign({ lab: l }, ch)); } }
    if (cs.length) {
      h += h2('chests', T`宝箱与道具（${cs.length}）`);
      const rs = chestRows(cs, (ch, q) => {
        const note = q && isLimited(q) ? `<span class="warn">${T`限时：${deadline(q)}`}</span>` : q && srcAlts(q).length ? esc(list(srcAlts(q)[0].map(condText))) : '';
        return { key: JSON.stringify([ch.it, PL_OF[ch.lab], CHEST_KIND(ch, q), q && q.near || '', note]), note };
      });
      h += table([T`东西`, T`地点`, T`注意`], rs.map((o) => `<tr><td class="cell-n">${chestName(o)}</td><td class="small">${aPlace(o.c.lab)} · ${esc(CHEST_KIND(o.c, o.q))}${o.q && o.q.near ? T`（靠近${q2(esc(tr(o.q.near)))}）` : ''}${o.spots.some((x) => x.w) ? ' · ' + spotLinks(o.spots, T`地图`) : ''}</td><td class="small">${o.note}</td></tr>`), { cls: 'compact' });
    }
    const lim = limitedList().filter((o) => (o.q.ch || 0) === i);
    if (lim.length) h += h2('limited', T`这一章的限时道具`) + `<p class="note">${T`过了写着的剧情就拿不到了。最后一栏是别处还能不能拿到。`}</p>` + table([T`东西`, T`在哪里`, T`截止`, T`别处`], lim.map(limitedRow));
    h += `<div class="nav2"><span>${i > 0 ? `<a href="#ch-${i}">← ${T`第${i}章 ${chName(i - 1)}`}</a>` : ''}</span><span>${i + 1 < GUIDE.ch.length ? `<a href="#ch-${i + 2}">${T`第${i + 2}章 ${chName(i + 1)}`} →</a>` : ''}</span></div>`;
    return { title: T`第${i + 1}章 ${chName(i)}`, html: h };
  };
  // a finite item: no shop sells it, no prize counter hands it out again, no monster drops or carries it
  function itemFinite(id) {
    const it = IT.items[id];
    return !!it && !it.src.some((q) => ((q.t === 'shop' || q.t === 'plat') && !q.warn && !q.unv) || q.t === 'drop' || q.t === 'steal'
      || ((q.t === 'casino' || q.t === 'fish') && !exOnce(q)));
  }
  PAGES.missable = ([f]) => {
    const imp = f === 'key';
    const all = limitedList().filter((o) => !imp || o.key || itemFinite(o.id));
    let h = crumbs([home(), ['', T`限时道具`]]) + `<h1>${T`限时道具`}</h1><div class="h1sub">${T`过了某段剧情就再也拿不到的宝箱、调查点、人物给的东西和限时商品，共 ${all.length} 项。`}</div>`;
    h += `<p>${T`“截止”是让它消失的那段剧情（地方进不去了，或者事件过去了）。最后一栏写着别处还能不能拿到：写着<span class="bad">只有这里有</span>的最要紧，尤其是重要物品。`}</p>`;
    h += `<div class="chips"><a href="#missable" class="${imp ? '' : 'on'}">${T`全部`}</a><a href="#missable-key" class="${imp ? 'on' : ''}">${T`只看重要物品和全游戏数量有限的`}</a></div>`;
    let ci = -1;
    let rows = [];
    const flush = () => { if (rows.length) { h += table([T`东西`, T`在哪里`, T`截止`, T`别处`], rows); rows = []; } };
    for (const o of all) {
      const c = o.q.ch || 0;
      if (c !== ci) { flush(); ci = c; h += h2('c' + c, T`第${c + 1}章 ${chName(c)}`); }
      rows.push(limitedRow(o));
    }
    flush();
    return { title: T`限时道具`, html: h };
  };

/* ---- 55-farm.js ---- */
  // ------------------------------------------------------------------ 练级与赚钱: every random-battle zone of the game with
  // what an average battle there pays (EXP x3/4 split over 3 members, gold about 1/4)
  function zoneStats(z) {
    let exp = 0, gold = 0, hp = 0;
    const ids = new Set();
    for (const f of z.rows) {
      for (const id of f) {
        const m = D.mons[id];
        if (!m) continue;
        ids.add(MON_CANON[id] || String(id)); exp += m.exp; gold += m.g; hp += m.hp;
      }
    }
    const n = z.rows.length || 1;
    return { exp: exp / n, gold: gold / n, hp: hp / n, ids: [...ids] };
  }
  // a world-map zone is named by the entrances inside its boxes (else the nearest one)
  function zonePlaces(lab, z) {
    const ex = ((D.mapx || {})[lab] || {}).exits || [];
    const inside = ex.filter((e) => z.boxes.some((b) => (e[0] >> 7) >= b[0] && (e[0] >> 7) <= b[2] && (e[1] >> 7) >= b[1] && (e[1] >> 7) <= b[3]));
    let pick = inside;
    if (!pick.length && ex.length) {
      const b = z.boxes[0], cx = (b[0] + b[2]) / 2, cz = (b[1] + b[3]) / 2;
      pick = [ex.reduce((a, e) => (Math.hypot((a[0] >> 7) - cx, (a[1] >> 7) - cz) <= Math.hypot((e[0] >> 7) - cx, (e[1] >> 7) - cz) ? a : e))];
    }
    return uniq(pick.map((e) => e[2]).filter((l) => l && !isCut(l)));
  }
  let FARM = null;
  function farmRows() {
    if (FARM) return FARM;
    const rows = [];
    for (const lab of Object.keys(D.enct)) {
      if (isCut(lab) || !PL_OF[lab]) continue;
      const P = placeOf(lab);
      const groups = encGroups(lab).filter((g) => !g.transient);
      for (const g of groups) {
        for (const z of g.zones) {
          const st = zoneStats(z);
          if (!st.ids.length) continue;
          const near = P.world ? zonePlaces(lab, z).slice(0, 2) : [];
          const sig = [P.key, near.map((l) => PL_OF[l] || l).join(','), st.ids.slice().sort((a, b) => a - b).join(','), Math.round(st.exp), g.flag].join('|');
          if (rows.some((r) => r.sig === sig)) continue;
          rows.push({ sig, P, lab, near, groups, g, ch: P.ch.length ? P.ch[0] : 99, st, each: Math.ceil((st.exp - st.exp / 4) / 3), gold: Math.round(st.gold / 4), rate: z.rate });
        }
      }
    }
    FARM = rows.sort((a, b) => (a.ch - b.ch) || (b.each - a.each));
    return FARM;
  }
  const farmPer = (r) => periodText(r.groups, r.g) || T`全程`;
  const farmNear = (r) => uniq(r.near.map((l) => placeName(l)));
  const farmName = (r) => `${aPlace(r.P.key)}${r.near.length ? `<span class="small">${T`（${list(farmNear(r))}一带）`}</span>` : r.P.labels.length > 1 && SCENE_WHEN[r.lab] ? `<span class="small faint">${esc(paren(sceneWhen(r.lab)))}</span>` : ''}`;
  const farmMons = (r) => list(r.st.ids.slice().sort((a, b) => D.mons[b].exp - D.mons[a].exp).slice(0, 5).map((id) => aMon(id)));
  PAGES.farm = () => {
    const rows = farmRows();
    let h = crumbs([home(), ['', T`练级与赚钱`]]) + `<h1>${T`练级与赚钱`}</h1><div class="h1sub">${T`全游戏每个会随机遇敌的区域，一场普通战斗平均能拿多少经验和金钱。`}</div>`;
    h += `<p>${T`每个区域按它会出现的敌人组合取平均。经验 = 敌人经验合计 ×3/4，按三人都活着平分；金钱约为敌人金钱合计的 1/4（戴${q2(aItem(240))}×1.25）。戴${q2(aItem(239))}的人经验再 ×2。“时期”写着这组敌人从什么时候开始出现（剧情推进后有的地方换成别的敌人，有的不再遇敌）。`}</p>`;
    const top = rows.slice().sort((a, b) => b.each - a.each).slice(0, 10);
    const topG = rows.slice().sort((a, b) => b.gold - a.gold).slice(0, 5);
    h += h2('best', T`经验最多的 10 个区域`) + table([T`地点`, T`时期`, [T`每人经验`, 'num'], [T`金钱`, 'num'], T`主要敌人`], top.map((r) => `<tr><td>${farmName(r)}</td><td class="small">${esc(farmPer(r))}</td><td class="num"><b>${num(r.each)}</b></td><td class="num">${num(r.gold)}</td><td class="small">${farmMons(r)}</td></tr>`));
    h += h2('gold', T`金钱最多的 5 个区域`) + table([T`地点`, T`时期`, [T`金钱`, 'num'], [T`每人经验`, 'num'], T`主要敌人`], topG.map((r) => `<tr><td>${farmName(r)}</td><td class="small">${esc(farmPer(r))}</td><td class="num"><b>${num(r.gold)}</b></td><td class="num">${num(r.each)}</td><td class="small">${farmMons(r)}</td></tr>`));
    h += h2('all', T`全部区域（${rows.length}）`) + `<p class="note">${T`按章节排列，表头可以点击排序。“敌人 HP”是一场战斗敌人的总血量，经验多的地方敌人也强。`}</p>`;
    h += table([T`地点`, [T`章`, 'num'], T`时期`, [T`每人经验`, 'num'], [T`金钱`, 'num'], [T`敌人 HP`, 'num'], [T`遇敌率`, 'num'], T`敌人`], rows.map((r) => `<tr>${td(r.P.name, farmName(r))}${td(r.ch, r.ch < 99 ? String(r.ch + 1) : '—', 'num')}${td(farmPer(r), `<span class="small">${esc(farmPer(r))}</span>`)}`
      + `${td(r.each, num(r.each), 'num')}${td(r.gold, num(r.gold), 'num')}${td(Math.round(r.st.hp), num(Math.round(r.st.hp)), 'num')}${td(r.rate, String(r.rate), 'num')}${td(r.st.ids.length, `<span class="small">${farmMons(r)}</span>`)}</tr>`), { sort: true });
    return { title: T`练级与赚钱`, html: h };
  };

/* ---- 60-misc.js ---- */
  // ------------------------------------------------------------------ 小游戏
  // k: 'c' the casino's prize counter (tokens), 'f' a fishing prize counter (points)
  function prizeTable(k, x) {
    const coins = k === 'c';
    const rows = x.rows.map(([id, cost, lim]) => {
      const once = coins ? lim !== 0 : lim === 1;
      const sell = (D.items[id] || {}).price >> 1;
      return `<tr><td class="cell-n">${aItem(id)}</td><td class="small">${esc(itemBrief(String(id)))}</td><td class="num">${num(cost)}</td><td class="c">${once ? `<span class="pill lim">${T`限一次`}</span>` : ''}</td><td class="num">${sell ? num(sell) + 'G' : '<span class="faint">—</span>'}</td></tr>`;
    });
    return `<div class="src"><div class="src-h"><b>${aPlace(x.s)} · ${coins ? T`赌场奖品兑换处（代币）` : T`钓鱼积分兑换处`}</b></div>${table([T`奖品`, T`简介`, [coins ? T`代币` : T`积分`, 'num'], ['', 'c'], [T`卖价`, 'num']], rows, { cls: 'compact' })}</div>`;
  }
  PAGES.minigames = () => {
    let h = crumbs([home(), ['', T`小游戏`]]) + `<h1>${T`小游戏`}</h1><div class="h1sub">${T`赌场、钓鱼、武斗大会和舞蹈大赛：玩法要点和奖品。`}</div>`;
    h += toc([['casino', T`赌场`], ['fish', T`钓鱼`], ['dome', T`武斗大会`], ['dance', T`舞蹈大赛`]]);
    h += h2('casino', T`赌场`) + `<p>${T`维德纳和索尔塔各有一家赌场，用代币玩老虎机，代币可以在奖品兑换处换东西。买来的代币换奖品再卖一定亏，只有赢来的代币才值得换。标“限一次”的奖品只能换一次。`}</p>`;
    for (const x of Object.values(IT.casino || {})) h += prizeTable('c', x);
    const egg = (IT.items[110] || { src: [] }).src.find((q) => q.s === 'koin1');
    if (egg) h += `<p>${T`另外，索尔塔的代币满 100,000 枚时，兑换处的小姐会问你要不要换${q2(aItem(110))}（帕尔玛的护符材料）：${srcHead(egg)}。`}</p>`;
    // tokens / points turned into gold: the repeatable prize that sells best per token / point
    const bestSale = (x, coins) => x.rows.filter(([, , lim]) => (coins ? lim === 0 : lim !== 1)).map(([id, cost]) => ({ id, cost, sell: (D.items[id] || {}).price >> 1 }))
      .filter((o) => o.sell).sort((a, b) => b.sell / b.cost - a.sell / a.cost)[0];
    const cs = Object.values(IT.casino || {}).map((x) => ({ x, b: bestSale(x, true) })).filter((o) => o.b);
    if (cs.length) h += `<p class="note">${T`赢来的代币想换钱：`}${cs.map((o) => T`${aPlace(o.x.s)}换${q2(aItem(o.b.id))}最划算（${num(o.b.cost)} 枚 → 卖 ${num(o.b.sell)}G，每枚约 ${num(Math.round(o.b.sell / o.b.cost))}G）`).join(isEn() ? '; ' : '；')}${T`。`}</p>`;
    h += h2('fish', T`钓鱼`) + `<p>${T`大地图上的钓鱼招牌（塞布库斯群岛和卡里斯托王国各一处）进入钓鱼场。钓到鱼得钓鱼积分，在两处的兑换处换奖品；标“限一次”的只能换一次，有些奖品要积分够多才会出现在列表里。钓竿：${list([160, 161, 162].filter((i) => D.items[i]).map((i) => aItem(i)))}；拟饵：${list([157, 158, 159].map((i) => aItem(i)))}。`}</p>`;
    for (const x of Object.values(IT.fish || {})) h += prizeTable('f', x);
    const fs = Object.values(IT.fish || {}).map((x) => ({ x, b: bestSale(x, false) })).filter((o) => o.b);
    if (fs.length) h += `<p class="note">${T`积分想换钱：`}${fs.map((o) => T`${aPlace(o.x.s)}可以反复换的${q2(aItem(o.b.id))}${num(o.b.cost)} 分 → 卖 ${num(o.b.sell)}G`).join(isEn() ? '; ' : '；')}${T`。只能换一次的饰品通常自己用更好。`}</p>`;
    h += h2('dome', T`武斗大会（肌肉天堂）`) + `<p>${T`索尔塔的武斗大会：选一名角色出场，一场接一场和怪物单挑，输入方式和普通战斗一样。分初级赛、高级赛、大师赛三个级别。大师赛能打的场数随剧情增加：打倒尼沃拉峡谷的科鲁之前 8 场，之后 11 场，逃出卓拉浮空城后 12 场，打倒杰特之后才有完整的 13 场。`}</p>`;
    h += '<ul class="bul">' + [205, 247].map((id) => {
      const q = (IT.items[id] || { src: [] }).src.find((s) => s.s === 'koin1');
      return q ? `<li>${aItem(id)}${colon()}${q.how ? esc(tr(q.how)) : srcHead(q)}</li>` : '';
    }).join('') + '</ul>';
    h += h2('dance', T`舞蹈大赛`) + `<p>${T`索尔塔迪斯科舞厅的舞蹈大赛由诺娅上场，跟着节拍按键。`}</p>`
      + giveEntries([88, 209].flatMap((id) => (IT.items[id] || { src: [] }).src.filter((s) => s.s === 'koin3').map((q) => ({ id: String(id), q })))).map(giveHtml).join('');
    return { title: T`小游戏`, html: h };
  };

  // ------------------------------------------------------------------ 隐藏要素 (every rule read off the scripts / SCUS)
  // Ra-Seru true power: the revived Genesis Tree actor starts korb3 P2[16] / rikuroa P2[63] / vozz P2[19]: `4C DC n` looks
  // for the tier-n gear among the party's equipment (n = 8 / 16 / 24), `4C 8D c a` for every art but the Miracle Art in
  // the learned list, then `3B` moves the gear to its top tier; worn, FUN_80042558 grants Meta / Terra / Ozma
  const RA_TRUE = [
    { c: 0, sp: 0x9E, need: 8, top: 9, arts: range(1, 14), tf: 1027, at: ['korb3', 4736, 3392], place: '索尔塔 · 战士广场的创世树' },
    { c: 1, sp: 0x9F, need: 16, top: 17, arts: [1, ...range(4, 16)], tf: 650, at: ['rikuroa', 8960, 9984], place: '里库罗亚山 · 山顶的创世树' },
    { c: 2, sp: 0xA0, need: 24, top: 25, arts: range(1, 14), tf: 403, at: ['vozz', 13184, 12864], place: '东沃兹森林 · 创世树' },
  ];
  const WISDOM = [
    { m: [131], labs: ['korb2', 'korb3'], end: 1027, why: '索尔的创世树复活后，战士广场一带不再遇敌' },
    { m: [132], labs: ['uru2'], end: 1312, why: '第一次飞往卓拉浮空城之后，乌鲁迈斯不再遇敌' },
    { m: [91, 112], labs: ['taiku'], end: 896, why: '逃出浮空城后就回不去了' },
    { m: [145], labs: ['conc', 'conc2'], end: 993, why: '只在昔日康克拉姆迷雾失控的那段时间遇到' },
    { m: [145], labs: ['concnow'], end: 1224, why: '逃出杰特要塞后康克拉姆消失，大地图上的入口关闭' },
    { m: [145, 154], labs: ['deroa', 'chitei2'], end: 1313, why: '柯特现身、要塞开始崩塌后不再遇敌' },
  ];
  const SECRET_ITEMS = [['强力饰品', [205, 234, 239, 247, 208, 209, 229, 204, 240, 237]], ['特殊道具', [101, 255, 254, 88, 235]]];
  const firstOneTime = (id) => { const it = IT.items[id]; return it ? it.src.find((q) => ONE_T.includes(q.t) || q.t === 'casino' || q.t === 'fish') || it.src[0] : null; };
  function howShort(s) {
    if (!s) return '';
    const pr = price(s), p = s.s ? placeName(s.s) : tr(s.p || '');
    switch (s.t) {
      case 'shop': case 'plat': return `${p} · ${tr(s.n)} ${pr}`;
      case 'casino': return T`${p}赌场 ${pr}`;
      case 'fish': return T`${p}钓鱼兑换 ${pr}`;
      case 'box': return T`${p}的宝箱`;
      case 'hid': return T`${p}：调查${tr(s.n || '')}`;
      case 'floor': return T`${p}地上的发光处`;
      case 'obj': return T`${p}：捡起${tr(s.n || '')}`;
      case 'drop': return T`${monName(s.m[0][0])}掉落`;
      case 'steal': return T`从${monName(s.m[0][0])}身上偷`;
      default: return `${p}${s.n ? colon() + tr(s.n) : ''}${pr ? ' ' + pr : ''}`;
    }
  }
  PAGES.secret = () => {
    let h = crumbs([home(), ['', T`隐藏要素`]]) + `<h1>${T`隐藏要素`}</h1><div class="h1sub">${T`隐藏的魔法、隐藏头目、强力饰品、限时刷取和练到 99 级（含剧透）。`}</div>`;
    h += toc([['ra', T`圣瑟鲁的真正力量`], ['summon', T`召唤魔法`], ['boss', T`隐藏头目`], ['items', T`强力饰品和道具`], ['wis', T`智慧之水`], ['lv', T`练到 99 级`], ['notes', T`常见误区`]]);
    // Ra-Seru
    h += h2('ra', T`圣瑟鲁的真正力量`) + `<p>${T`三只圣瑟鲁各有一招全体攻击魔法（${RA_TRUE.map((r) => aSpell(r.sp)).join(' / ')}，240 MP）。要满足这些条件：`}</p><ol class="bul"><li>${T`圣瑟鲁升到倒数第二级：最终章诺阿鲁山谷的大创世树复苏时，三只圣瑟鲁一起升到这一级。`}</li><li>${T`这个角色学会全部普通招式和 3 个超级招式（用招式之书学的）。<b>不需要终极招式。</b>`}</li><li>${T`对应的创世树已经复活。`}</li></ol><p>${T`条件都满足时去调查那棵创世树，圣瑟鲁升到最高级，装备着它就多出这招魔法。`}</p>`;
    h += table([T`角色`, T`魔法`, T`去哪里`, T`圣瑟鲁要到`, T`要学会的招式`], RA_TRUE.map((r) => {
      const arts = r.arts.map((idx) => { const a = artRow(r.c, idx); const b = bookFor(r.c, idx); return a ? `${esc(artName(a))}${b !== undefined ? `<span class="faint">${esc(paren(itemName(b)))}</span>` : ''}` : ''; }).filter(Boolean);
      return `<tr><td class="nw">${aChar(r.c)}</td><td class="nw">${aSpell(r.sp)}</td><td class="small">${esc(tr(r.place))}<br>${spotLink({ s: r.at[0], w: [r.at[1], r.at[2]] }, T`地图`)}<div class="faint">${T`创世树：`}${esc(flagName(r.tf))}</div></td><td class="small">${aItem(r.need)}<br>→ ${aItem(r.top)}</td><td class="small">${list(arts)}</td></tr>`;
    }));
    // summons
    h += h2('summon', T`召唤魔法`) + `<p>${T`戴着护符（饰品）的人多出对应的召唤魔法，取下就没有。前四个护符由杰雷米的珠宝匠扎兰用蛋 / 黑暗之石加工。札格诺特：三人都到 99 级时，拉塔尤城的萨留会给${q2(aItem(191))}；用它打开城里地下札格诺特之室的门，宝箱里是${q2(aItem(118))}（它同时有“低遇敌率”的效果）。`}</p>`;
    h += table([T`魔法`, T`护符`, T`材料`, T`材料在哪里`], SUMMONS.map(([sp, tal, mat]) => {
      const q = firstOneTime(mat);
      return `<tr><td>${aSpell(sp, sp === 0x99 ? T`札格诺特` : undefined)}</td><td>${aItem(tal)}</td><td>${aItem(mat)}</td><td class="small">${esc(howShort(q))}${sp === 0x99 ? T`（三人都 99 级）` : ''}</td></tr>`;
    }));
    // Lapis
    const lap = D.mons[167] || {};
    h += h2('boss', T`隐藏头目：拉比斯`) + `<p>${T`${aMon(167)}（HP ${num(lap.hp || 0)}、经验 ${num(lap.exp || 0)}、金钱 ${num(lap.g || 0)}）在${aPlace('deene')}山顶。第一次登上山顶会被梭伦族接走（剧情）；之后再上山顶，走到平台里侧就会开战（${spotLink({ s: 'deene', w: [8512, 10176] }, T`地图`)}），打赢后不再出现。必掉${q2(aItem(237))}：戴的人不受控制地乱行动；它在最终章也能从柯特身上偷到（100%）。`}</p>`;
    // items
    h += h2('items', T`强力饰品和特殊道具`);
    for (const [t, ids] of SECRET_ITEMS) {
      h += `<h3>${esc(tr(t))}</h3>` + table([T`名称`, T`效果`, T`怎么拿`], ids.filter((id) => D.items[id]).map((id) => `<tr><td class="cell-n">${aItem(id)}</td><td class="small">${esc(itemBrief(String(id)))}</td><td class="small">${esc(itemAcq(String(id)).how)} · ${esc(howShort(firstOneTime(id)))}</td></tr>`), { cls: 'compact' });
    }
    // Wisdom Water
    const rate = (m) => (D.steal[m] ? D.steal[m][0] : 0);
    h += h2('wis', T`限时刷取：智慧之水`) + `<p>${T`生命 / 力量 / 守护 / 迅速 / 魔力之水在最终章都还有怪物身上能偷，只有${q2(aItem(134))}（智力 +4）没有。下面是身上带它的怪物（偷取几率 5%，戴青铜之书 ×2），要戴${q2(aItem(208))}打倒它们才偷得到；每一行写着那个地方什么时候不再遇到它们。`}</p>`;
    h += table([T`地点`, T`怪物`, T`截止`], WISDOM.map((w) => `<tr><td>${aPlace(w.labs[0])}</td><td class="small">${list(w.m.map((m) => `${aMon(m)} ${rate(m)}%`))}</td><td class="small">${esc(tr(w.why))}</td></tr>`)
      .concat([[163, 'nilboa'], [170, 'deroa']].map(([m, l]) => `<tr><td>${aPlace(l)}</td><td class="small">${T`头目 ${aMon(m)} ${rate(m)}%`}</td><td class="small">${T`只有一次机会`}</td></tr>`)));
    // level 99
    const T99 = 9646483;
    const each = (m) => (m ? Math.ceil((m.exp * 3 - Math.floor(m.exp * 3 / 4)) / 3) : 0);
    const gil = D.mons[161], spo = D.mons[149];
    h += h2('lv', T`练到 99 级`) + `<p>${T`邪恶瑟鲁钥匙要三人都 99 级。99 级要累计 <b>${num(T99)}</b> 经验（瓦恩；诺娅略少、加拉略多，差别不到 1%），经验上限 9,999,999。`}</p>`
      + `<ul class="bul"><li>${T`一场战斗的经验 = 敌人经验合计 ×3/4，由活着的人平分；戴${q2(aItem(239))}的人自己那份算两次（只对戴的人有效）。`}</li>`
      + `<li>${T`最终迷宫${aPlace('jouina')}：${aMon(161)} 三只一组每人约 +${num(each(gil))}，${aMon(149)} 三只一组每人约 +${num(each(spo))}（三人都活着时）。`}</li>`
      + `<li>${T`搭配：${q2(aItem(239))}经验 ×2、${q2(aItem(205))}一回合攻击两轮、${q2(aItem(234))}AP 始终 100、${q2(aItem(247))}遇到不想打的必定逃跑（强制战斗除外）。`}</li></ul>`;
    // notes
    h += h2('notes', T`常见误区`) + `<ul class="bul">`
      + `<li>${T`麦塔 / 泰拉 / 奥兹：只要求学会全部普通招式和 3 个超级招式，<b>不需要终极招式</b>；另外圣瑟鲁要先升到倒数第二级（最终章诺阿鲁山谷的大创世树复苏时才升）。`}</li>`
      + `<li>${T`帕尔玛用的地之蛋在索尔塔赌场的奖品兑换处（代币满 10 万时兑换小姐会问你），不是武斗大会。`}</li>`
      + `<li>${T`召唤魔法还有<b>霍恩</b>（全体回复）：卡萝还给你的光之蛋交给扎兰做成光之护符。`}</li>`
      + `<li>${T`札格诺特：萨留给的是邪恶瑟鲁钥匙，开门后宝箱里是邪之护符，<b>戴着护符</b>才有这招（同时是“低遇敌率”饰品）。`}</li>`
      + `<li>${T`战神像：武斗大会大师赛要打倒杰特之后才有第 13 场，全胜第一次给；另外维德纳钓鱼积分 50,000 也能换一个（只能换一次）。`}</li>`
      + `<li>${T`邪恶勋章：除了拉比斯必掉，最终章也能从柯特身上偷（100%）；效果是戴的人不受控制地乱行动。`}</li>`
      + `<li>${T`瑟鲁魔法不会错过：21 种在最终章（回乡后的利姆艾姆、生物城堡）都有 Lv3 版本可以吸收。`}</li>`
      + `<li>${T`卓拉浮空城：逃出浮空城（6 分钟内跑回入口）之后就回不去了，里面的宝箱（邪神像等）要当场拿。`}</li></ul>`;
    return { title: T`隐藏要素`, html: h };
  };

  // ------------------------------------------------------------------ 系统与公式
  PAGES.mechanics = () => {
    let h = crumbs([home(), ['', T`系统与公式`]]) + `<h1>${T`系统与公式`}</h1><div class="h1sub">${T`战斗、成长和掉落的规则与公式。`}</div>`;
    h += toc([['exp', T`经验与金钱`], ['drop', T`掉落 · 偷取 · 吸收`], ['arts', T`招式与指令`], ['dmg', T`伤害`], ['elem', T`属性相克`], ['magic', T`瑟鲁魔法`], ['mon', T`怪物的强化`], ['enc', T`遇敌`], ['pas', T`饰品效果`]]);
    h += h2('exp', T`经验与金钱`) + `<ul class="bul"><li>${T`经验：敌人经验合计 ×3/4，由<b>活着</b>的队员平分（向上取整），倒下的人没有。戴${q2(aItem(239))}的人自己那份算两次。上限 9,999,999；99 级要 9,646,483。`}</li>`
      + `<li>${T`金钱：每个敌人的金钱减半后合计，戴${q2(aItem(240))}+25%，最后再减半，约为怪物金钱合计的 1/4。`}</li><li>${T`升级时 HP、MP 和各项能力按角色的成长表增长。`}</li></ul>`;
    h += h2('drop', T`掉落 · 偷取 · 吸收`) + `<ul class="bul"><li>${T`<b>掉落</b>：战斗胜利时每个敌人按自己的掉落率判定一次（戴${q2(aItem(241))}+30）；最后一个判定成功的敌人决定掉什么，一场<b>最多 1 件</b>。之后如果没有必掉的敌人、也没人戴青铜之书，还要再过一道 1/4 的判定。`}</li>`
      + `<li>${T`<b>偷取</b>：戴${q2(aItem(208))}的人用攻击（普通攻击或招式）打倒敌人时，按这个敌人的偷取几率偷到东西，每次攻击只判定第一个被打倒的敌人；青铜之书 ×2。偷到的东西战斗中途就进包。`}</li>`
      + `<li>${T`<b>吸收瑟鲁</b>：装备着圣瑟鲁、还没有这个魔法的人打出最后一击时，按怪物的吸收率判定；戴${q2(aItem(238))}的人 +30。`}</li></ul>`;
    h += h2('arts', T`招式与指令`) + `<ul class="bul"><li>${T`一回合能输入的方向数 = 敏捷 ÷ 每个方向的消耗。每个方向消耗 ${CMD_COST}；拿不擅长的武器时，武器手方向（瓦恩、加拉 ←，诺娅 →）每按一次消耗 42 或 54。`}</li>`
      + `<li>${T`AP：每次行动 +8，挨打也会涨，“集气”+32，最多 100。招式的 AP 消耗：终极招式 11、超级招式 10、普通招式 6，乘以指令的方向数（“AP 消耗减少”减半）。`}</li>`
      + `<li>${T`输入的一串方向从后往前匹配招式；AP 不够的招式只会打出普通攻击。招式的最后一个方向变成招式本身，前面的方向照样当普通攻击打出。`}</li>`
      + `<li>${T`普通招式第一次发动时学会；超级招式只能用招式之书学；终极招式装备着圣瑟鲁时输入就会学会。连携招式不需要学，连着打出组成它的招式就会发动。`}</li></ul>`;
    h += h2('dmg', T`伤害`) + `<ul class="bul"><li>${T`攻击力 = 角色本身的攻击 + 这一下用到的那件装备攻击力的一半：← → 用左右手的装备（武器或圣瑟鲁），↑ ↓ 用脚部装备。`}</li>`
      + `<li>${T`普通攻击的伤害 ≈ 攻击力 × 威力 ÷ 16 × 属性相克 − 敌人的上段或下段防御（看这一下打上段还是下段）。招式再 ×1.3（戴${q2(aItem(236))}×1.4），属性相克算两次。防御比攻击高时仍有一点保底伤害。`}</li>`
      + `<li>${T`每一下打上段或下段：飘在空中的敌人，打下段的普通攻击多半打空；个子矮的敌人，打上段的多半打空。防御低的那一段更好打。`}</li>`
      + `<li>${T`瑟鲁魔法：攻击值 =（魔法威力 + 施法者智力 × 2）×（1 + (等级 − 1) ÷ 8），乘属性相克，减去敌人的魔法防御（主要是智力），再乘施法者对这个属性的威力。`}</li></ul>`;
    // element matrix
    const M = D.elem.matrix;
    h += h2('elem', T`属性相克`) + `<p class="note">${T`行是攻击的属性，列是防守方的属性，数字是威力百分比。差距只有几个百分点，招式算两次。`}</p>`;
    h += table([T`攻击 \\ 防守`, ...ELEMENTS_ZH.map((e, i) => [elTag(i), 'c'])], M.slice(0, 8).map((row, a) => `<tr><td>${elTag(a)}</td>${row.map((v) => `<td class="c ${v > 100 ? 'good' : v < 100 ? 'warn' : 'faint'}">${v}</td>`).join('')}</tr>`), { cls: 'compact' });
    h += `<p class="note">${T`角色本身的属性：`}${list([0, 1, 2].map((c) => `${aChar(c)} ${elTag(D.elem.char[c])}`))}${T`。`}</p>`;
    // magic
    h += h2('magic', T`瑟鲁魔法的等级`) + `<ul class="bul"><li>${T`魔法经验：单体攻击魔法每打中一次最多 +12，群体魔法每打中一个敌人最多 +4（按伤害占敌人最大 HP 的比例），打倒敌人的那一下固定拿满。恢复魔法补满的量越多涨得越多，目标满血不涨。`}</li>`
      + `<li>${T`每施放一次最多升 1 级，最高 Lv9。升级要累计的经验：${list(range(1, 8).map((l) => `Lv${l + 1} ${num(spellThreshold(0x81, l) + 1)}`))}（${list(D.spell_thr_x15.map((id) => esc(spellName(id))))} 要 1.5 倍）。`}</li>`
      + `<li>${T`Lv3 起每次施放附带效果，等级越高越强：`}</li></ul>`;
    h += table([T`魔法`, 'Lv1–2', 'Lv3–4', 'Lv5–6', 'Lv7–8', 'Lv9'], SERU_GROUPS.map(([el, ids]) => `<tr><td>${elTag(el)} ${list(ids.map((id) => aSpell(id)))}</td>${[1, 3, 5, 7, 9].map((l) => `<td class="small">${esc(seruFx(ids[0], l)) || '—'}</td>`).join('')}</tr>`)
      .concat([`<tr><td>${aSpell(0x8E)}</td>${[1, 3, 5, 7, 9].map((l) => `<td class="small">${esc(seruFx(0x8E, l))}</td>`).join('')}</tr>`, `<tr><td>${aSpell(0x85)}</td><td class="small" colspan="5">${T`即死或混乱，几率不随等级变化`}</td></tr>`]), { cls: 'compact' });
    h += `<ul class="bul small"><li>${T`降低能力的效果按每次命中判定，普通战斗里可以叠加；水属性（敏捷）每场只生效一次。`}</li><li>${T`头目战里，除非克制，5 次里有 4 次不触发；攻击、防御、智力的降低对头目无效。`}</li><li>${T`光属性的解除异常作用在恢复的对象上；Lv9 还让 AP 翻倍（最多 100）。`}</li></ul>`;
    h += h2('mon', T`怪物的强化`) + `<p>${T`开战时怪物的能力会被强化：野外遇到的怪物上下防 ×1.75、智力 ×1.25；头目战（剧情安排的战斗）攻击 ×1.25、上下防 ×2、智力 ×1.125。HP、MP、速度、敏捷不变。怪物页面写的是强化后的数值。`}</p>`;
    h += h2('enc', T`遇敌`) + `<p>${T`每个地方有自己的遇敌设定：随剧情进度变化（例如迷雾散去后常常不再遇敌），再按你所在的区域决定会遇到哪些敌人组合。遇敌率越高遇敌越频繁。${q2(aItem(138))}可以降低遇敌，${q2(aItem(252))}和${q2(aItem(118))}让遇敌率减半。每个地点页面的“随机遇敌”列出了全部组合。`}</p>`;
    h += h2('pas', T`饰品效果`) + `<p class="note">${T`饰品效果共 64 种；“全队”的效果只要队里有一个人戴着就对全队生效。哪些饰品有哪种效果见<a href="#acc">饰品</a>。`}</p>`;
    h += table([T`效果`, T`说明`, [T`范围`, 'c']], Object.values(IT.pas).map(([party, n, d]) => `<tr><td><b>${esc(tr(n))}</b></td><td class="small">${esc(tr(d))}</td><td class="c small">${party ? T`全队` : T`戴的人`}</td></tr>`), { cls: 'compact' });
    return { title: T`系统与公式`, html: h };
  };

  PAGES.about = () => {
    let h = crumbs([home(), ['', T`关于本站`]]) + `<h1>${T`关于本站`}</h1>`;
    h += `<p>${T`这是《雷盖亚传说》（Legend of Legaia，北美版）的资料站：剧情攻略、物品、装备、怪物、魔法、招式、地图和隐藏要素。中文页面使用简体中文汉化版的译名；英文页面使用游戏原版的英文名称。`}</p>`;
    h += h2('use', T`使用`) + `<ul class="bul"><li>${T`上面的搜索框支持中文、拼音（例如 <kbd>shenhong</kbd>）、拼音首字母（<kbd>shzs</kbd>）和英文名。`}</li><li>${T`右上角可以切换中文 / 英文。`}</li><li>${T`地图可以拖动、缩放；点宝箱、出口、商店看详情，勾选“人物”显示 NPC 的位置。`}</li><li>${T`正文里提到的物品、怪物、魔法、地点和人物都可以直接点击，跳到它们的页面。`}</li><li>${T`整个网站是静态网页，可以放在任何网页空间，也可以直接双击 index.html 离线打开。`}</li></ul>`;
    h += `<p class="note">${T`本站与游戏的版权方无关。游戏本身请使用自己拥有的正版光盘。`}</p>`;
    return { title: T`关于本站`, html: h };
  };

  PAGES.home = () => {
    const nItems = Object.keys(IT.items).length, nMons = Object.keys(D.mons).filter(isCanonMon).length, nPlaces = [...PL.values()].filter((P) => !P.cut).length;
    let h = `<div class="hero"><div><h1>${siteName()}</h1><p>${T`《雷盖亚传说》的完整资料：剧情攻略、物品、装备、怪物、魔法、招式、地图和隐藏要素。`}</p></div>`
      + `<div class="figs"><div><b>${GUIDE.ch.length}</b><span>${T`章攻略`}</span></div><div><b>${nItems}</b><span>${T`种物品`}</span></div><div><b>${nMons}</b><span>${T`种怪物`}</span></div><div><b>${nPlaces}</b><span>${T`个地点`}</span></div></div></div>`;
    const card = (href, t, d) => `<a class="card" href="#${href}"><b>${t}</b><span>${d}</span></a>`;
    h += h2('start', T`从这里开始`) + `<div class="cards c3">${card('overview', L('游戏简介', 'About the game'), L('世界、主角、游戏系统和主要人物', 'World, party, gameplay and main characters'))}${card('story', L('剧情简介', 'Story'), L('按地区和章节的剧情梗概', 'The plot by region and chapter'))}${card('walkthrough', T`剧情攻略`, T`${GUIDE.ch.length} 章流程，每一步去哪里、找谁`)}${card('missable', T`限时道具`, T`过了就拿不到的东西`)}${card('secret', T`隐藏要素`, T`隐藏魔法、隐藏头目、强力饰品`)}${card('mechanics', T`系统与公式`, T`经验、掉落、伤害、魔法等级`)}</div>`;
    h += h2('data', T`资料`) + `<div class="cards c4">${card('items', T`物品`, T`${nItems} 种，含每一种拿法`)}${card('equip', T`武器与防具`, T`能力值和谁能装备`)}${card('acc', T`饰品`, T`64 种饰品效果`)}${card('monsters', T`怪物`, T`${nMons} 种敌人的资料`)}${card('bosses', T`头目`, T`${BOSSES.length} 场头目战`)}${card('magic', T`魔法`, T`瑟鲁魔法、召唤魔法`)}${card('arts', T`招式`, T`指令、AP、学法、连携招式`)}${card('chars', T`角色`, list([0, 1, 2].map(charName)))}</div>`;
    h += h2('world', T`世界`) + `<div class="cards c4">${card('places', T`地点`, T`${nPlaces} 个地点，带地图`)}${card('chests', T`宝箱`, T`全部宝箱和调查点`)}${card('shops', T`商店`, T`货单和价格`)}${card('npcs', T`人物`, T`谁在哪里、说什么`)}</div>`
      + `<p class="small">${T`另外：<a href="#farm">练级与赚钱</a>（每个区域一场战斗的经验和金钱）· <a href="#minigames">小游戏</a>（赌场、钓鱼、武斗大会、舞蹈大赛）· <a href="#about">关于本站</a>`}</p>`;
    h += h2('regions', T`三个地区`) + GUIDE.regions.map((r, ri) => `<p><b>${esc(regionName(ri))}</b>${colon()}${GUIDE.ch.map((c, i) => (c.region === ri ? aCh(i, `${i + 1}. ${chName(i)}`) : '')).filter(Boolean).join('　')}</p>`).join('');
    return { title: siteName(), html: h };
  };
  PAGES.notfound = () => ({ title: T`找不到页面`, html: `<h1>${T`找不到这个页面`}</h1><p>${T`链接可能写错了。<a href="#home">回到首页</a>，或者用上面的搜索框。`}</p>` });

/* ---- 65-game.js ---- */
  // ------------------------------------------------------------------ 游戏简介 / 剧情简介: the article a general wiki
  // opens with (facts about the release from the game's packaging and public records), and the story by region
  const bossOf = (zh) => { const b = BOSSES.find((x) => (D.mons[x.id] || {}).n === zh); return b ? b.id : null; };
  // main cast and foes: who they are in one line, linked to their person or boss page
  const CAST = [
    ['梅', 'Mei', '瓦恩的青梅竹马，住在利姆艾姆。', "Vahn's childhood friend in Rim Elm."],
    ['铁', 'Tetsu', '来自拜伦的武术家，瓦恩的师父，旅途中会多次和你过招。', 'A martial artist from Biron and Vahn\'s teacher; he tests you in battle several times.'],
    ['松吉', 'Songi', '加拉在拜伦修道院的旧友，投靠迷雾一方，是反复出现的对手。', "Gala's old friend from Biron Monastery who sides with the Mist; a recurring rival."],
    ['泽托', 'Zeto', '迷雾一方的国务大臣，盘踞在德雷克王国的迷宫里。', 'The Secretary of State on the Mist\'s side, holed up in a dungeon in Drake Kingdom.'],
    ['多哈提', 'Dohati', '迷雾一方的内务大臣，在塞布库斯群岛西海的城堡里用仿瑟鲁操纵人心。', "The Secretary of the Interior on the Mist's side; from his castle on the Western Sea he controls people with Sim-Seru."],
    ['凡・萨留', 'Van Saryu', '拉塔尤的领主，被仿瑟鲁控制。', 'The lord of Ratayu, controlled by a Sim-Seru.'],
    ['德利拉斯兄妹', 'Delilas Family', '吉、切、鲁三兄妹，在卡里斯托王国一再挡路。', 'Gi, Che and Lu Delilas, three siblings who keep getting in your way in Karisto Kingdom.'],
    ['卓拉', 'Zora', '迷雾一方的大祭司，坐镇浮空城。', "The High Priest on the Mist's side, ruling from the Floating Castle."],
    ['杰特', 'Jette', '迷雾一方的宫廷科学家，守在杰特要塞。', "The Court Scientist on the Mist's side, guarding Jette's Fortress."],
    ['柯特', 'Cort', '康克拉姆的王子，迷雾背后的主谋。', 'The prince of Conkram and the mastermind behind the Mist.'],
    ['乌莎博士', 'Dr. Usha', '在乌莎研究所研究迷雾的科学家。', 'A scientist studying the Mist at the Usha Research Center.'],
    ['卢克特斯', 'Luctes', '梭伦族的战士，用飞行瑟鲁载你们飞往浮空城。', 'A Soren warrior who flies you to the Floating Castle on his flying Seru.'],
  ];
  function castLink(zh, en) {
    if (npcIdx[zh] !== undefined) return aNpc(npcIdx[zh]);
    const m = bossOf(zh);
    if (m !== null) return aMon(m);
    if (zh === '德利拉斯兄妹') return list([162, 163, 164].map((id) => aMon(id)));
    return esc(L(zh, en));
  }
  PAGES.overview = () => {
    const rows = [[L('英文名', 'Chinese title'), L('<i>Legend of Legaia</i>', '雷盖亚传说')], [L('日文名', 'Japanese title'), 'レガイア伝説'],
      [L('平台', 'Platform'), 'PlayStation'], [L('开发', 'Developer'), 'Prokion / Contrail'], [L('发行', 'Publisher'), 'Sony Computer Entertainment'],
      [L('音乐', 'Music'), L('大岛满（Michiru Ōshima）', 'Michiru Ōshima')], [L('类型', 'Genre'), L('角色扮演', 'Role-playing game')],
      [L('发售', 'Release'), L('日本 1998-10-29<br>北美 1999-03-16<br>欧洲 2000-05-27', 'Japan 1998-10-29<br>North America 1999-03-16<br>Europe 2000-05-27')],
      [L('续作', 'Sequel'), '<i>Legaia 2: Duel Saga</i> (PS2)']];
    let h = crumbs([home(), ['', L('游戏简介', 'About the game')]]) + `<h1>${L('雷盖亚传说', 'Legend of Legaia')}</h1><div class="h1sub">${L('<span class="en">Legend of Legaia</span> · 1998 年 PlayStation 角色扮演游戏', 'レガイア伝説 · a 1998 role-playing game for the PlayStation')}</div>`;
    h += infobox(L('雷盖亚传说', 'Legend of Legaia'), 'PlayStation', rows);
    h += `<p class="lede">${L('《雷盖亚传说》是 1998 年在 PlayStation 上推出的角色扮演游戏（北美版 1999 年）。世界被不知从何而来的迷雾笼罩，原本与人类共生的瑟鲁在迷雾中失去理智、开始攻击人类。利姆艾姆村的少年瓦恩与圣瑟鲁麦塔结合，唤醒村里的创世树驱散迷雾，和诺娅、加拉一起踏上让世界各地的创世树复活的旅程。',
      'Legend of Legaia is a role-playing game released for the PlayStation in 1998 (1999 in North America). A mysterious Mist has covered the world, and the Seru — creatures that used to live together with humans — lose their minds inside it and turn on people. Vahn, a boy from the village of Rim Elm, merges with the Ra-Seru Meta, awakens his village\'s Genesis Tree to drive the Mist back, and sets out with Noa and Gala to revive the Genesis Trees all over the world.')}</p>`;
    h += toc([['world', L('世界', 'World')], ['party', L('主角', 'The party')], ['play', L('游戏系统', 'Gameplay')], ['cast', L('主要人物', 'Main characters')], ['story', L('剧情', 'Story')]]);
    h += h2('world', L('世界', 'World')) + `<p>${L('故事发生在三个地区，依次是：', 'The story moves through three regions, in this order:')}</p><ul class="bul">${GUIDE.regions.map((r, ri) => {
      const P = [...PL.values()].find((x) => x.world && x.region === ri);
      const chs = GUIDE.ch.map((c, i) => (c.region === ri ? i : -1)).filter((i) => i >= 0);
      return `<li>${P ? aPlace(P.key, regionName(ri)) : esc(regionName(ri))} <span class="faint small">${T`第${chs[0] + 1}–${chs[chs.length - 1] + 1}章`}</span></li>`;
    }).join('')}</ul><p>${L('每个地区都有被迷雾笼罩的城镇和迷宫。迷雾由迷雾发生器制造；每唤醒一棵创世树，周围的迷雾就会散去，三只圣瑟鲁也随之变强。',
      'Each region has towns and dungeons buried in the Mist, which is produced by Mist Generators. Every Genesis Tree you awaken clears the Mist around it and makes the three Ra-Seru stronger.')}</p>`;
    h += h2('party', L('主角', 'The party')) + `<div class="cards">${[0, 1, 2].map((c) => `<a class="card" href="#char-${c}"><b>${esc(charName(c))}</b><span>${T`圣瑟鲁${raseruName(c)} · ${elName(D.elem.char[c])}属性 · 武器手 ${WEAPON_HAND[c]}`}</span></a>`).join('')}</div>`;
    h += h2('play', L('游戏系统', 'Gameplay')) + '<ul class="bul">'
      + `<li>${L('<b>战术招式</b>：战斗中用方向键排出一串指令，排对了就会打出招式；招式要消耗 AP。详见<a href="#arts">招式</a>。', '<b>Tactical Arts</b>: in battle you line up a string of directions; the right sequences become Arts, which cost AP. See <a href="#arts">Arts</a>.')}</li>`
      + `<li>${L('<b>瑟鲁魔法</b>：装备着圣瑟鲁的角色打倒带瑟鲁的怪物时，有几率把瑟鲁吸收成自己的魔法，魔法越用等级越高。详见<a href="#magic">魔法</a>。', '<b>Seru Magic</b>: a character wearing a Ra-Seru can absorb the Seru of a defeated monster as a spell, which levels up with use. See <a href="#magic">Magic</a>.')}</li>`
      + `<li>${L('<b>圣瑟鲁</b>：麦塔、泰拉、奥兹玛随着创世树复活而升级，最终能解放真正的力量。详见<a href="#chars">角色</a>和<a href="#secret">隐藏要素</a>。', '<b>Ra-Seru</b>: Meta, Terra and Ozma grow stronger as the Genesis Trees come back to life, and can finally unleash their true power. See <a href="#chars">Characters</a> and <a href="#secret">Secrets</a>.')}</li>`
      + `<li>${L('<b>饰品</b>：每人可以戴 3 件饰品，有 64 种效果。详见<a href="#acc">饰品</a>。', '<b>Accessories</b>: each character wears up to three, with 64 different effects. See <a href="#acc">Accessories</a>.')}</li>`
      + `<li>${L('<b>小游戏</b>：钓鱼、赌场老虎机、武斗大会和舞蹈大赛，奖品里有不少强力饰品。详见<a href="#minigames">小游戏</a>。', '<b>Minigames</b>: fishing, casino slots, the Tournament and the Dance Contest, with some of the best accessories as prizes. See <a href="#minigames">Minigames</a>.')}</li>`
      + `<li>${L('有些东西过了某段剧情就拿不到了，见<a href="#missable">限时道具</a>。', 'Some things can no longer be obtained once the story moves on; see <a href="#missable">Missable items</a>.')}</li></ul>`;
    h += h2('cast', L('主要人物', 'Main characters')) + `<ul class="bul">${CAST.map(([zh, en, rz, re]) => `<li>${castLink(zh, en)}${colon()}${esc(L(rz, re))}</li>`).join('')}</ul>`;
    h += h2('story', L('剧情', 'Story')) + `<p>${L('按地区和章节整理的剧情梗概见<a href="#story">剧情简介</a>（含剧透），每一步怎么走见<a href="#walkthrough">剧情攻略</a>。', 'A chapter-by-chapter synopsis is on the <a href="#story">Story</a> page (spoilers); the step-by-step route is in the <a href="#walkthrough">Walkthrough</a>.')}</p>`;
    return { title: L('游戏简介', 'About the game'), html: h };
  };
  PAGES.story = () => {
    let h = crumbs([home(), ['', L('剧情简介', 'Story')]]) + `<h1>${L('剧情简介', 'Story')}</h1><div class="h1sub">${L('按地区和章节的剧情梗概（含剧透）。每一步怎么走见剧情攻略。', 'The plot by region and chapter (spoilers). For the route itself see the walkthrough.')}</div>`;
    h += toc(GUIDE.regions.map((r, ri) => ['r' + ri, regionName(ri)]));
    let region = -1;
    GUIDE.ch.forEach((c, i) => {
      if (c.region !== region) { region = c.region; h += h2('r' + region, regionName(region)); }
      h += `<p><b>${aCh(i)}</b>${colon()}${esc(tr(c.goal))}</p>`;
    });
    return { title: L('剧情简介', 'Story'), html: h };
  };

/* ---- 99-boot.js ---- */
  // ------------------------------------------------------------------ boot
  function boot() {
    if (!D || !IT || !NPC) {
      $('#page').innerHTML = '<h1>资料载入失败 / Data failed to load</h1><p>data/lg.js</p>';
      return;
    }
    paintShell();
    $('#navBtn').addEventListener('click', () => document.body.classList.toggle('nav-open'));
    $('#scrim').addEventListener('click', () => document.body.classList.remove('nav-open'));
    const lb = $('#langBtn');
    if (lb) lb.addEventListener('click', () => { setLang(isEn() ? 'zh' : 'en'); render(); });
    setupSearch();
    window.addEventListener('hashchange', render);
    render();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
