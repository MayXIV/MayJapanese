"use strict";

// Reads the JSON written by the sync job (data/*.json) and renders the page.
// No external requests: everything is same-origin.

const DATA = "data/";
const FILES = ["meta", "wanikani_summary", "wanikani_items", "bunpro_summary"];
const WK_STAGES = ["apprentice", "guru", "master", "enlightened", "burned"];
const BP_STAGES = ["beginner", "adept", "seasoned", "expert", "master"];
const LANG_KEY = "jp-progress-lang";
const STRONG = 90; // accuracy % at or above: green bar
const WEAK = 30;   // accuracy % at or below: red bar

// --- Text -----------------------------------------------------------------------------

const STRINGS = {
  en: {
    page_title: "May's Japanese Progress",
    title: "May's Japanese Progress",
    loading: "Loading…",
    updated: (rel, date) => `Last updated ${rel} · ${date}`,
    just_now: "just now",
    mins_ago: (n) => `${n} min ago`,
    hours_ago: (n) => `${n} hour${n === 1 ? "" : "s"} ago`,
    days_ago: (n) => `${n} days ago`,
    nav_items: "Items",
    wk_sub: "kanji & vocabulary",
    current_level: "Current level",
    accuracy: "Overall accuracy",
    right_wrong: (r, w) => `${r} right · ${w} wrong`,
    items_learned: "Items learned",
    burned_sub: "learned for good",
    srs_title: "Items by SRS stage",
    stage: { apprentice: "Apprentice", guru: "Guru", master: "Master", enlightened: "Enlightened", burned: "Burned" },
    lesson: "Lesson",
    locked: "Locked",
    items_title: "Items by level",
    level: "Level",
    level_n: (n) => `Level ${n}`,
    type: "Type",
    type_all: "All types",
    type_radical: "Radicals",
    type_kanji: "Kanji",
    type_vocab: "Vocabulary",
    type_label: { radical: "Radical", kanji: "Kanji", vocabulary: "Vocab", kana_vocabulary: "Vocab" },
    sort: "Sort",
    sort_default: "WaniKani order",
    sort_weak: "Weakest first",
    sort_strong: "Strongest first",
    sort_srs: "SRS stage (lowest first)",
    items_summary: (n, l, w) => `${n} items on level ${l}${w === null ? "" : ` · ${w} at ${WEAK}% accuracy or lower`}.`,
    items_hint: "Hover or tap an item for details.",
    search_label: "Search all levels",
    search_placeholder: "English, kana or kanji (e.g. water, みず, 水)",
    search_clear: "Clear search",
    search_summary: (n, lv) => `${n} match${n === 1 ? "" : "es"} · level${lv.includes(",") ? "s" : ""} ${lv}. Choose one to jump to it.`,
    search_none: (q) => `No items match “${q}”.`,
    search_more: (n) => `Show more (${n} more)`,
    search_jump: "Show it in its level",
    search_level_count: (n) => `${n} match${n === 1 ? "" : "es"}`,
    item_acc: (a, n) => `${a}% accuracy · ${n} review${n === 1 ? "" : "s"}`,
    no_reviews: "No reviews yet",
    not_started: "Not started yet",
    bp_title: "What I'm working on",
    bp_level: "Bunpro level",
    jlpt_focus: "Current JLPT focus",
    jlpt_focus_sub: "grammar I'm studying now",
    bp_started: "Grammar points started",
    bp_jlpt_title: "JLPT grammar progress",
    bp_started_of: (s, n) => `${s} / ${n} started`,
    bp_stages_title: "SRS stages",
    bp_grammar: "Grammar",
    bp_stage: { beginner: "Beginner", adept: "Adept", seasoned: "Seasoned", expert: "Expert", master: "Master", ghost: "Ghosts" },
    bp_ghost_note: "Ghosts are extra reviews Bunpro adds for points I keep missing.",
    footer: "Data from WaniKani and Bunpro, synced daily.",
    load_error: (e) => `Couldn't load the progress data (${e}).`,
  },
  ja: {
    page_title: "メイの日本語の勉強記録",
    title: "メイの日本語の勉強記録",
    loading: "読み込み中…",
    updated: (rel, date) => `最終更新：${rel}（${date}）`,
    just_now: "たった今",
    mins_ago: (n) => `${n}分前`,
    hours_ago: (n) => `${n}時間前`,
    days_ago: (n) => `${n}日前`,
    nav_items: "アイテム",
    wk_sub: "漢字と単語",
    current_level: "現在のレベル",
    accuracy: "全体の正答率",
    right_wrong: (r, w) => `正解 ${r}・不正解 ${w}`,
    items_learned: "学習済みアイテム",
    burned_sub: "完全に覚えたもの",
    srs_title: "SRS段階別のアイテム数",
    stage: { apprentice: "見習", guru: "達人", master: "主人", enlightened: "悟り", burned: "焼却" },
    lesson: "レッスン前",
    locked: "未解放",
    items_title: "レベル別アイテム",
    level: "レベル",
    level_n: (n) => `レベル${n}`,
    type: "種類",
    type_all: "すべて",
    type_radical: "部首",
    type_kanji: "漢字",
    type_vocab: "単語",
    type_label: { radical: "部首", kanji: "漢字", vocabulary: "単語", kana_vocabulary: "単語" },
    sort: "並べ替え",
    sort_default: "WaniKaniの順番",
    sort_weak: "苦手な順",
    sort_strong: "得意な順",
    sort_srs: "SRS段階（低い順）",
    items_summary: (n, l, w) => `レベル${l}：${n}個${w === null ? "" : `（正答率${WEAK}%以下：${w}個）`}。`,
    items_hint: "カーソルを合わせるか、タップすると詳細が表示されます。",
    search_label: "全レベルから検索",
    search_placeholder: "英語・かな・漢字で検索（例：water、みず、水）",
    search_clear: "検索をクリア",
    search_summary: (n, lv) => `${n}件（レベル${lv}）。選ぶとそのレベルに移動します。`,
    search_none: (q) => `「${q}」に一致するアイテムはありません。`,
    search_more: (n) => `もっと見る（残り${n}件）`,
    search_jump: "そのレベルで表示",
    search_level_count: (n) => `${n}件`,
    item_acc: (a, n) => `正答率 ${a}%・復習 ${n}回`,
    no_reviews: "まだ復習していません",
    not_started: "まだ始めていません",
    bp_title: "今勉強していること",
    bp_level: "Bunproのレベル",
    jlpt_focus: "今取り組んでいるJLPTレベル",
    jlpt_focus_sub: "今勉強中の文法",
    bp_started: "始めた文法の数",
    bp_jlpt_title: "JLPTレベル別の文法の進み具合",
    bp_started_of: (s, n) => `${n}個中 ${s}個`,
    bp_stages_title: "SRS段階",
    bp_grammar: "文法",
    bp_stage: { beginner: "ビギナー", adept: "アデプト", seasoned: "シーズンド", expert: "エキスパート", master: "マスター", ghost: "ゴースト" },
    bp_ghost_note: "ゴーストは、よく間違える文法のためにBunproが追加する復習です。",
    footer: "データはWaniKaniとBunproから毎日自動で更新しています。",
    load_error: (e) => `データを読み込めませんでした（${e}）。`,
  },
};

let lang = "en";
const t = (key, ...args) => {
  const v = STRINGS[lang][key];
  return typeof v === "function" ? v(...args) : v;
};
const locale = () => (lang === "ja" ? "ja-JP" : undefined);

function initialLang() {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved === "en" || saved === "ja") return saved;
  } catch (e) { /* storage unavailable */ }
  return (navigator.language || "").toLowerCase().startsWith("ja") ? "ja" : "en";
}

// --- Helpers --------------------------------------------------------------------------

// h("div", {class: "x"}, "text", child, ...). Text is always set via text nodes, never
// innerHTML.
function h(tag, attrs, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === null || v === undefined || v === false) continue;
    if (k === "style") el.style.cssText = v;
    else el.setAttribute(k, v);
  }
  for (const c of children.flat(Infinity)) {
    if (c === null || c === undefined || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}
const $ = (id) => document.getElementById(id);
const fmtInt = (n) => (n ?? 0).toLocaleString(locale());
const fmtPct = (n) => (n === null || n === undefined ? "–" : `${Math.round(n * 10) / 10}%`);
const fmtDate = (iso, opts) => new Date(iso).toLocaleDateString(locale(),
  opts || { year: "numeric", month: "short", day: "numeric" });

function relTime(iso) {
  const mins = Math.round((Date.now() - new Date(iso)) / 60000);
  if (mins < 1) return t("just_now");
  if (mins < 60) return t("mins_ago", mins);
  const hrs = Math.round(mins / 60);
  if (hrs < 48) return t("hours_ago", hrs);
  return t("days_ago", Math.round(hrs / 24));
}

function stat(value, label, sub) {
  return h("div", { class: "stat" },
    h("div", { class: "v" }, value),
    h("div", { class: "k" }, label),
    sub ? h("div", { class: "s" }, sub) : null);
}

// --- WaniKani -------------------------------------------------------------------------

function renderWk(wk) {
  $("wk-stats").replaceChildren(
    stat(wk.level, t("current_level")),
    stat(fmtPct(wk.accuracy), t("accuracy"), t("right_wrong", fmtInt(wk.reviews_correct), fmtInt(wk.reviews_incorrect))),
    stat(fmtInt(wk.items_started), t("items_learned")),
    stat(fmtInt(wk.srs.burned), t("stage").burned, t("burned_sub")),
  );
  const parts = WK_STAGES.map((s) => ({ key: s, label: t("stage")[s], value: wk.srs[s] || 0 }));
  const sum = parts.reduce((a, p) => a + p.value, 0) || 1;
  $("wk-srs").replaceChildren(
    h("div", { class: "stack", role: "img", "aria-label": parts.map((p) => `${p.label} ${p.value}`).join(", ") },
      parts.filter((p) => p.value > 0).map((p) =>
        h("span", { style: `width:${(100 * p.value) / sum}%;background:var(--${p.key})`, title: `${p.label}: ${p.value}` }))),
    h("ul", { class: "legend" }, parts.map((p) =>
      h("li", {}, h("span", { class: "swatch", style: `background:var(--${p.key})` }), `${p.label} `, h("b", {}, fmtInt(p.value))))));
}

// --- Item browser ---------------------------------------------------------------------

const itemState = { level: null, type: "all", sort: "default", query: "", shown: 0 };
let itemsData = null;
const RESULTS_PAGE = 24;

function stageName(srs) {
  if (srs === null || srs === undefined) return t("locked");
  if (srs === 0) return t("lesson");
  const st = t("stage");
  if (srs <= 4) return `${st.apprentice} ${["I", "II", "III", "IV"][srs - 1]}`;
  if (srs <= 6) return `${st.guru} ${srs === 5 ? "I" : "II"}`;
  return [st.master, st.enlightened, st.burned][srs - 7];
}

const isLatinText = (s) => /^[\x00-\x7f]+$/.test(s);
const hasAccuracy = (it) => it.accuracy !== null && it.accuracy !== undefined;
const isStarted = (it) => it.srs !== null && it.srs !== undefined && it.srs > 0;
const bandOf = (it) => (!hasAccuracy(it) ? "" : it.accuracy >= STRONG ? " strong" : it.accuracy <= WEAK ? " weak" : "");

// The details shown in an expanded tile and in a search result card.
function cardBody(it, { level } = {}) {
  const chars = it.chars || "";
  const latin = isLatinText(chars); // image-only radicals fall back to their name
  const hasAcc = hasAccuracy(it);
  return [
    h("div", { class: "pop-chars", lang: latin ? null : "ja" }, chars),
    h("div", { class: "pop-meaning" }, it.meaning || ""),
    it.reading ? h("div", { class: "pop-reading", lang: "ja" }, it.reading) : null,
    h("div", { class: "pop-meta" }, level ? `${t("level_n", level)} · ` : "", `${stageName(it.srs)} · `,
      h("span", { class: "pop-type" }, t("type_label")[it.type] || it.type)),
    h("div", { class: "pop-acc" }, hasAcc ? t("item_acc", it.accuracy, it.reviews) : isStarted(it) ? t("no_reviews") : t("not_started")),
    hasAcc ? h("div", { class: "pop-bar" }, h("span", { style: `width:${it.accuracy}%` })) : null,
  ];
}

function itemTile(it, isMatch) {
  const chars = it.chars || "";
  const latin = isLatinText(chars);
  const size = latin ? "latin" : chars.length >= 4 ? "len4" : chars.length === 3 ? "len3" : chars.length === 2 ? "len2" : "len1";
  const label = [chars, it.meaning, stageName(it.srs), hasAccuracy(it) ? `${it.accuracy}%` : null].filter(Boolean).join(", ");
  return h("li", { class: `item${isStarted(it) ? "" : " unstarted"}${bandOf(it)}${isMatch ? " match" : ""}`,
    "data-type": it.type, "data-id": it.id, tabindex: "0", "aria-label": label },
  h("span", { class: `chars ${size}`, lang: latin ? null : "ja", "aria-hidden": "true" }, chars),
  hasAccuracy(it) ? h("span", { class: "acc", "aria-hidden": "true" }, h("span", { style: `width:${it.accuracy}%` })) : null,
  h("div", { class: "pop", "aria-hidden": "true" }, cardBody(it)));
}

// Keep an open popover inside the viewport horizontally. Closed popovers are
// display:none, so use the CSS width rather than measuring.
const POP_WIDTH = 200;
function placePop(tile) {
  const r = tile.getBoundingClientRect();
  const w = POP_WIDTH;
  const center = r.left + r.width / 2;
  const min = 8 + w / 2, max = document.documentElement.clientWidth - 8 - w / 2;
  const target = Math.min(Math.max(center, min), max);
  tile.style.setProperty("--dx", `${Math.round(target - center)}px`);
}

// --- Search ---

// Katakana -> hiragana, so ヘビ and へび match the same readings.
const toHira = (s) => s.replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));

// Simple Hepburn-ish romaji -> hiragana. Returns null if anything is left unconverted.
const ROMAJI = {
  kya: "きゃ", kyu: "きゅ", kyo: "きょ", gya: "ぎゃ", gyu: "ぎゅ", gyo: "ぎょ",
  sha: "しゃ", shu: "しゅ", sho: "しょ", shi: "し", sya: "しゃ", syu: "しゅ", syo: "しょ",
  ja: "じゃ", ju: "じゅ", jo: "じょ", jya: "じゃ", jyu: "じゅ", jyo: "じょ", zya: "じゃ", zyu: "じゅ", zyo: "じょ",
  cha: "ちゃ", chu: "ちゅ", cho: "ちょ", chi: "ち", tya: "ちゃ", tyu: "ちゅ", tyo: "ちょ", tsu: "つ",
  nya: "にゃ", nyu: "にゅ", nyo: "にょ", hya: "ひゃ", hyu: "ひゅ", hyo: "ひょ",
  bya: "びゃ", byu: "びゅ", byo: "びょ", pya: "ぴゃ", pyu: "ぴゅ", pyo: "ぴょ",
  mya: "みゃ", myu: "みゅ", myo: "みょ", rya: "りゃ", ryu: "りゅ", ryo: "りょ",
  ka: "か", ki: "き", ku: "く", ke: "け", ko: "こ", ga: "が", gi: "ぎ", gu: "ぐ", ge: "げ", go: "ご",
  sa: "さ", si: "し", su: "す", se: "せ", so: "そ", za: "ざ", ji: "じ", zi: "じ", zu: "ず", ze: "ぜ", zo: "ぞ",
  ta: "た", ti: "ち", tu: "つ", te: "て", to: "と", da: "だ", di: "ぢ", du: "づ", de: "で", do: "ど",
  na: "な", ni: "に", nu: "ぬ", ne: "ね", no: "の", ha: "は", hi: "ひ", fu: "ふ", hu: "ふ", he: "へ", ho: "ほ",
  ba: "ば", bi: "び", bu: "ぶ", be: "べ", bo: "ぼ", pa: "ぱ", pi: "ぴ", pu: "ぷ", pe: "ぺ", po: "ぽ",
  ma: "ま", mi: "み", mu: "む", me: "め", mo: "も", ya: "や", yu: "ゆ", yo: "よ",
  ra: "ら", ri: "り", ru: "る", re: "れ", ro: "ろ", wa: "わ", wo: "を",
  a: "あ", i: "い", u: "う", e: "え", o: "お", "-": "ー",
};
function romajiToHira(s) {
  let out = "", i = 0;
  while (i < s.length) {
    const c = s[i];
    if (c === "n" && (s[i + 1] === "n" || s[i + 1] === "'")) { out += "ん"; i += 2; continue; }
    if (c === "n" && (i + 1 === s.length || !/[aiueoy]/.test(s[i + 1]))) { out += "ん"; i += 1; continue; }
    if (c === s[i + 1] && /[bcdfghjkmpqrstvwxz]/.test(c)) { out += "っ"; i += 1; continue; }
    const hit = [3, 2, 1].map((n) => s.slice(i, i + n)).find((k) => ROMAJI[k]);
    if (!hit) return null;
    out += ROMAJI[hit];
    i += hit.length;
  }
  return out;
}

// Rank of how well an item matches: 0 exact, 1 prefix, 2 substring, 3 romaji reading; null = no match.
function matchRank(it, q) {
  const latin = isLatinText(q);
  let best = null;
  const consider = (text, needle, offset = 0) => {
    if (!text || !needle) return;
    const i = text.indexOf(needle);
    if (i < 0) return;
    // Exact beats prefix (incl. start of any word, e.g. "big one") beats mid-word.
    const wordStart = i === 0 || new RegExp(`(^|[\\s\\-/(])${needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`).test(text);
    const r = (text === needle ? 0 : wordStart ? 1 : 2) + offset;
    if (best === null || r < best) best = r;
  };
  if (latin) {
    const ql = q.toLowerCase();
    if (ql.length >= 2 || (it.chars || "").toLowerCase() === ql) {
      for (const m of it.meanings?.length ? it.meanings : [it.meaning]) consider((m || "").toLowerCase(), ql);
    }
    const kana = ql.length >= 2 ? romajiToHira(ql.replace(/\s+/g, "")) : null;
    if (kana) {
      for (const r of it.readings || []) consider(toHira(r), kana, 3);
      consider(toHira(it.chars || ""), kana, 3);
    }
  } else {
    consider(it.chars || "", q);
    const kana = toHira(q);
    consider(toHira(it.chars || ""), kana);
    for (const r of it.readings?.length ? it.readings : [it.reading]) consider(toHira(r || ""), kana);
  }
  return best;
}

function typeMatches(it) {
  return itemState.type === "all" || it.type === itemState.type ||
    (itemState.type === "vocabulary" && it.type === "kana_vocabulary");
}

function sortItems(items, fallback) {
  const accKey = (it, dir) => (hasAccuracy(it) ? it.accuracy : dir * Infinity);
  if (itemState.sort === "acc-asc") return [...items].sort((a, b) => accKey(a, 1) - accKey(b, 1));
  if (itemState.sort === "acc-desc") return [...items].sort((a, b) => accKey(b, -1) - accKey(a, -1));
  if (itemState.sort === "srs-asc") return [...items].sort((a, b) => (a.srs ?? -1) - (b.srs ?? -1));
  return fallback ? [...items].sort(fallback) : items;
}

// All matches across every level: [{it, level, rank}], best first.
function searchAll() {
  const q = itemState.query;
  if (!q) return [];
  const out = [];
  for (const lvl of itemsData.levels) {
    for (const it of lvl.items) {
      if (!typeMatches(it)) continue;
      const rank = matchRank(it, q);
      if (rank !== null) out.push({ it, level: lvl.level, rank });
    }
  }
  const byRank = (a, b) => a.rank - b.rank || a.level - b.level;
  if (itemState.sort === "default") return out.sort(byRank);
  const sorted = sortItems(out.map((m) => m.it));
  const order = new Map(sorted.map((it, i) => [it, i]));
  return out.sort((a, b) => order.get(a.it) - order.get(b.it));
}

function jumpToItem(level, id) {
  itemState.level = level;
  renderLevelPicker();
  renderItems();
  const tile = $("item-grid").querySelector(`[data-id="${id}"]`);
  if (tile) {
    tile.scrollIntoView({ block: "center", behavior: "smooth" });
    tile.focus({ preventScroll: true });
  }
}

function renderSearch() {
  const box = $("search-results");
  const status = $("search-status");
  $("search-clear").hidden = !itemState.query;
  if (!itemState.query) {
    box.replaceChildren();
    status.textContent = "";
    return [];
  }
  const matches = searchAll();
  const levels = [...new Set(matches.map((m) => m.level))].sort((a, b) => a - b);
  status.textContent = matches.length
    ? t("search_summary", matches.length, levels.join(", "))
    : t("search_none", itemState.query);
  const shown = matches.slice(0, itemState.shown);
  box.replaceChildren(...[
    shown.length ? h("ul", { class: "results" }, shown.map(({ it, level }) => {
      const b = h("button", { type: "button", class: `result${bandOf(it)}`, "data-type": it.type,
        "aria-label": `${it.chars || ""}, ${it.meaning || ""}, ${t("level_n", level)}. ${t("search_jump")}` },
      cardBody(it, { level }));
      b.addEventListener("click", () => jumpToItem(level, it.id));
      return h("li", {}, b);
    })) : null,
    matches.length > shown.length ? (() => {
      const more = h("button", { type: "button", class: "more" }, t("search_more", matches.length - shown.length));
      more.addEventListener("click", () => { itemState.shown += RESULTS_PAGE * 2; renderSearch(); });
      return more;
    })() : null,
  ].filter(Boolean));
  return matches;
}

// Level -> number of matches, for the level buttons.
function matchCounts() {
  const counts = new Map();
  if (!itemState.query) return counts;
  for (const m of searchAll()) counts.set(m.level, (counts.get(m.level) || 0) + 1);
  return counts;
}

function renderItems() {
  if (!itemsData) return;
  const lvl = itemsData.levels.find((l) => l.level === itemState.level);
  if (!lvl) return;
  const items = sortItems(lvl.items.filter(typeMatches));
  const q = itemState.query;
  const reviewed = items.filter(hasAccuracy);
  $("items-summary").textContent = t("items_summary", items.length, lvl.level,
    reviewed.length ? reviewed.filter((it) => it.accuracy <= WEAK).length : null);
  $("item-grid").replaceChildren(...items.map((it) => itemTile(it, q && matchRank(it, q) !== null)));
}

function renderLevelPicker() {
  const levels = itemsData.levels.map((l) => l.level);
  const counts = matchCounts();
  const buttons = levels.map((n) => {
    const c = counts.get(n) || 0;
    const b = h("button", { type: "button", class: c ? "has-match" : null, "aria-pressed": String(n === itemState.level),
      "aria-label": c ? `${t("level_n", n)} (${t("search_level_count", c)})` : t("level_n", n) },
    n, c ? h("span", { class: "count", "aria-hidden": "true" }, c) : null);
    b.addEventListener("click", () => {
      itemState.level = n;
      buttons.forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      renderItems();
    });
    return b;
  });
  $("level-picker").replaceChildren(...buttons);
}

function rerenderItemsArea() {
  renderSearch();
  renderLevelPicker();
  renderItems();
}

function setupItems(data, currentLevel) {
  itemsData = data;
  const levels = data.levels.map((l) => l.level);
  itemState.level = levels.includes(currentLevel) ? currentLevel : levels[levels.length - 1];
  $("type-filter").addEventListener("change", (e) => { itemState.type = e.target.value; rerenderItemsArea(); });
  $("sort").addEventListener("change", (e) => { itemState.sort = e.target.value; rerenderItemsArea(); });

  const input = $("search");
  let composing = false, timer;
  const run = () => {
    const q = input.value.trim().normalize("NFKC");
    if (q === itemState.query) return;
    itemState.query = q;
    itemState.shown = RESULTS_PAGE;
    rerenderItemsArea();
  };
  input.addEventListener("compositionstart", () => { composing = true; });
  input.addEventListener("compositionend", () => { composing = false; run(); });
  input.addEventListener("input", (e) => {
    if (composing || e.isComposing) return; // wait for the IME to finish
    clearTimeout(timer);
    timer = setTimeout(run, 180);
  });
  input.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && input.value) { input.value = ""; run(); }
  });
  $("search-form").addEventListener("submit", (e) => { e.preventDefault(); clearTimeout(timer); run(); });
  $("search-clear").addEventListener("click", () => { input.value = ""; run(); input.focus(); });

  const grid = $("item-grid");
  grid.addEventListener("pointerover", (e) => { const tile = e.target.closest(".item"); if (tile) placePop(tile); });
  grid.addEventListener("focusin", (e) => { const tile = e.target.closest(".item"); if (tile) placePop(tile); });
  grid.addEventListener("keydown", (e) => { if (e.key === "Escape") document.activeElement.blur(); });
}

// --- Bunpro ---------------------------------------------------------------------------

// A stacked bar. parts: [{key, label, value, color}]
function stackBar(parts, total, ariaLabel) {
  const sum = total || parts.reduce((a, p) => a + p.value, 0) || 1;
  return h("div", { class: "stack thin", role: "img", "aria-label": ariaLabel },
    parts.filter((p) => p.value > 0).map((p) =>
      h("span", { style: `width:${(100 * p.value) / sum}%;background:${p.color}`, title: `${p.label}: ${p.value}` })));
}

function legend(parts, withValues) {
  return h("ul", { class: "legend" }, parts.map((p) =>
    h("li", {}, h("span", { class: "swatch", style: `background:${p.color}` }), p.label,
      withValues ? [" ", h("b", {}, fmtInt(p.value))] : null)));
}

function renderBunpro(bp) {
  $("bp-stats").replaceChildren(
    stat(bp.jlpt_focus || "–", t("jlpt_focus"), t("jlpt_focus_sub")),
    stat(bp.level, t("bp_level")),
    stat(fmtPct(bp.accuracy), t("accuracy")),
    stat(fmtInt(bp.grammar_started), t("bp_started")),
  );

  const names = t("bp_stage");
  const color = (k) => `var(--bp-${k})`;
  const jlpt = bp.jlpt_grammar || {};
  $("bp-jlpt").replaceChildren(...Object.entries(jlpt).map(([n, lvl]) => {
    const started = BP_STAGES.reduce((a, k) => a + (lvl[k] || 0), 0);
    return h("div", { class: "bar-row" },
      h("div", { class: "head" }, h("b", {}, n), h("span", { class: "n" }, t("bp_started_of", started, lvl.total_count))),
      stackBar(BP_STAGES.map((k) => ({ label: names[k], value: lvl[k] || 0, color: color(k) })),
        lvl.total_count, `${n}: ${t("bp_started_of", started, lvl.total_count)}`));
  }), legend(BP_STAGES.map((k) => ({ label: names[k], color: color(k) })), false));

  const parts = (st) => [...BP_STAGES, "ghost"].map((k) => ({ label: names[k], value: st?.[k] || 0, color: color(k) }));
  const row = (title, st) => {
    const ps = parts(st);
    return h("div", { class: "bar-row" }, h("div", { class: "head" }, h("b", {}, title)),
      stackBar(ps, 0, ps.map((p) => `${p.label} ${p.value}`).join(", ")), legend(ps, true));
  };
  $("bp-stages").replaceChildren(
    row(t("bp_grammar"), bp.grammar_stages),
    h("p", { class: "hint", style: "margin:12px 0 0" }, t("bp_ghost_note")));
}

// --- Page -----------------------------------------------------------------------------

let data = null;

function section(name, fn) {
  try { fn(); } catch (e) { console.error(name, e); }
}

function applyStaticText() {
  document.documentElement.lang = lang;
  document.title = t("page_title");
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const v = t(el.dataset.i18n);
    if (typeof v === "string") el.textContent = v;
  });
  document.querySelectorAll(".lang button").forEach((b) =>
    b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
}

function renderAll() {
  applyStaticText();
  if (!data) return;
  const updated = data.meta.generated_at;
  $("updated").replaceChildren(h("time", { datetime: updated, title: new Date(updated).toLocaleString(locale()) },
    t("updated", relTime(updated), new Date(updated).toLocaleString(locale(), { dateStyle: "medium", timeStyle: "short" }))));
  section("wk", () => renderWk(data.wanikani_summary));
  section("items", () => {
    $("search").placeholder = t("search_placeholder");
    $("search-clear").setAttribute("aria-label", t("search_clear"));
    rerenderItemsArea();
  });
  section("bunpro", () => renderBunpro(data.bunpro_summary));
}

function setLang(next) {
  lang = next;
  try { localStorage.setItem(LANG_KEY, lang); } catch (e) { /* storage unavailable */ }
  renderAll();
}

async function load() {
  const entries = await Promise.all(FILES.map(async (f) => {
    const r = await fetch(`${DATA}${f}.json`, { cache: "no-cache" });
    if (!r.ok) throw new Error(`${f}.json: HTTP ${r.status}`);
    return [f, await r.json()];
  }));
  return Object.fromEntries(entries);
}

// Following a nav link opens the section it points to.
function openFromHash() {
  const target = location.hash && document.querySelector(location.hash);
  if (target && target.tagName === "DETAILS") target.open = true;
}

lang = initialLang();
applyStaticText();
document.querySelectorAll(".lang button").forEach((b) => b.addEventListener("click", () => setLang(b.dataset.lang)));
document.querySelectorAll("nav a").forEach((a) => a.addEventListener("click", () => setTimeout(openFromHash)));
window.addEventListener("hashchange", openFromHash);
openFromHash();

load().then((d) => {
  data = d;
  section("items-setup", () => setupItems(d.wanikani_items, d.wanikani_summary.level));
  renderAll();
}).catch((e) => {
  $("updated").textContent = "";
  const err = $("error");
  err.hidden = false;
  err.textContent = t("load_error", e.message);
});
