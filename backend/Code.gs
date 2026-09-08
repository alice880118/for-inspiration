/**
 * 靈感收集器 — Google Sheet 後端
 *
 * 安裝方式：
 * 1. 打開你的 Google Sheet → 擴充功能 → Apps Script
 * 2. 把 Code.gs 的內容全部刪掉，貼上這整份檔案
 * 3. 把下面的 TOKEN 改成你自己的任意字串（等一下前端要填一樣的）
 *    這個 TOKEN 跟 Google 帳號無關，是你自己發明的通關密語
 * 4. 上方選單選 setup → 執行 → 授權（會跳「未驗證」警告，
 *    點「進階」→「前往專案（不安全）」，那是你自己的腳本，正常現象）
 * 5. 右上角「部署」→「新增部署作業」→ 類型選「網頁應用程式」
 *    執行身分：我自己　／　誰可以存取：所有人
 * 6. 複製部署後的網址（.../exec 結尾），貼進網頁的設定畫面
 *
 * 之後每次改這份腳本，都要重新「部署 → 管理部署作業 → 編輯 → 版本改成新版本」
 * 否則線上跑的還是舊版。
 */

const TOKEN = 'replace-with-your-private-token';

/** 縮圖存放的 Drive 資料夾 ID（從資料夾網址 /folders/ 後面那一段抓的） */
const FOLDER_ID = 'replace-with-your-drive-folder-id';

const LINK_COLS = ['id', 'title', 'url', 'categories', 'tags', 'thumb', 'created_at', 'sort_order', 'needs_review'];
const CAT_COLS  = ['id', 'name', 'color', 'locked'];

const DEFAULT_CATS = [
  ['uiux',    'UIUX',    '#3392ff', ''],
  ['graphic', 'graphic', '#f472b6', ''],
  ['motion',  'motion',  '#2dd4bf', ''],
  ['video',   'video',   '#c084fc', ''],
  ['web3',    'web3',    '#facc15', ''],
  ['others',  'others',  '#d4d4d4', 'yes']
];

/* ---------------------------------------------------------------- setup */

function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const links = sheetOf(ss, 'links', LINK_COLS);
  const cats  = sheetOf(ss, 'cats', CAT_COLS);
  if (cats.getLastRow() < 2) {
    cats.getRange(2, 1, DEFAULT_CATS.length, CAT_COLS.length).setValues(DEFAULT_CATS);
  }
  links.setFrozenRows(1);
  cats.setFrozenRows(1);

  let folderMsg;
  try {
    folderMsg = '縮圖資料夾：' + DriveApp.getFolderById(FOLDER_ID).getName();
  } catch (err) {
    folderMsg = '找不到 FOLDER_ID 指定的資料夾，請確認 ID 正確且你有存取權。';
  }
  SpreadsheetApp.getUi().alert('設定完成。\n' + folderMsg + '\n\n接下來去部署網頁應用程式。');
}

function sheetOf(ss, name, cols) {
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  const head = sh.getRange(1, 1, 1, cols.length).getValues()[0];
  if (head.join('') !== cols.join('')) {
    sh.getRange(1, 1, 1, cols.length).setValues([cols]).setFontWeight('bold');
  }
  return sh;
}

/* ------------------------------------------------------------ read API */

function doGet(e) {
  try {
    if ((e.parameter.token || '') !== TOKEN) return json({ error: 'bad token' });
    if (e.parameter.action === 'thumbs') return json({ ok: true, files: listThumbs() });
    return json(readAll());
  } catch (err) {
    return json({ error: String(err) });
  }
}

function readAll() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return { ok: true, links: readLinks(ss), cats: readCats(ss) };
}

function readLinks(ss) {
  const sh = sheetOf(ss, 'links', LINK_COLS);
  const n = sh.getLastRow() - 1;
  if (n < 1) return [];
  const rows = sh.getRange(2, 1, n, LINK_COLS.length).getValues();
  const out = [];
  let dirty = false;

  rows.forEach(function (r, i) {
    const url = String(r[2] || '').trim();
    if (!url) return;
    let id = String(r[0] || '').trim();
    if (!id) {                                  // 手動在表上貼的新列，補一個 id
      id = Utilities.getUuid().slice(0, 8);
      sh.getRange(i + 2, 1).setValue(id);
      dirty = true;
    }
    out.push({
      id: id,
      title: String(r[1] || '') || url,
      url: url,
      cats: splitList(r[3]),
      tags: splitList(r[4]),
      thumb: String(r[5] || '').trim(),
      createdAt: toMillis(r[6]),
      order: Number(r[7]) || 0,
      needsReview: String(r[8] || '').toLowerCase() === 'yes'
    });
  });
  if (dirty) SpreadsheetApp.flush();
  return out;
}

function readCats(ss) {
  const sh = sheetOf(ss, 'cats', CAT_COLS);
  const n = sh.getLastRow() - 1;
  if (n < 1) return [];
  return sh.getRange(2, 1, n, CAT_COLS.length).getValues()
    .filter(function (r) { return String(r[1] || '').trim(); })
    .map(function (r) {
      return {
        id: String(r[0] || '').trim() || String(r[1]).trim().toLowerCase(),
        name: String(r[1]).trim(),
        color: String(r[2] || '#d4d4d4').trim(),
        locked: String(r[3] || '').toLowerCase() === 'yes'
      };
    });
}

function splitList(v) {
  return String(v || '').split('|').map(function (s) { return s.trim(); }).filter(Boolean);
}

function toMillis(v) {
  if (v instanceof Date) return v.getTime();
  const n = Number(v);
  if (n > 0) return n;
  const p = Date.parse(v);
  return p || Date.now();
}

/* ----------------------------------------------------------- write API */

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    const body = JSON.parse(e.postData.contents || '{}');
    if ((body.token || '') !== TOKEN) return json({ error: 'bad token' });

    if (body.action === 'upload') return json({ ok: true, url: saveThumb(body.data, body.name) });

    if (body.action === 'save') {
      lock.waitLock(20000);
      writeAll(body.links || [], body.cats || []);
      return json(readAll());
    }
    return json({ error: 'unknown action' });
  } catch (err) {
    return json({ error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (ignore) {}
  }
}

function writeAll(links, cats) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const ls = sheetOf(ss, 'links', LINK_COLS);
  if (ls.getLastRow() > 1) ls.getRange(2, 1, ls.getLastRow() - 1, LINK_COLS.length).clearContent();
  if (links.length) {
    const rows = links.map(function (l) {
      return [
        l.id || Utilities.getUuid().slice(0, 8),
        l.title || '',
        l.url || '',
        (l.cats || []).join(' | '),
        (l.tags || []).join(' | '),
        l.thumb || '',
        new Date(l.createdAt || Date.now()),
        Number(l.order) || 0,
        l.needsReview ? 'yes' : ''
      ];
    });
    ls.getRange(2, 1, rows.length, LINK_COLS.length).setValues(rows);
  }

  const cs = sheetOf(ss, 'cats', CAT_COLS);
  if (cs.getLastRow() > 1) cs.getRange(2, 1, cs.getLastRow() - 1, CAT_COLS.length).clearContent();
  if (cats.length) {
    const crows = cats.map(function (c) {
      return [c.id || '', c.name || '', c.color || '#d4d4d4', c.locked ? 'yes' : ''];
    });
    cs.getRange(2, 1, crows.length, CAT_COLS.length).setValues(crows);
  }
  SpreadsheetApp.flush();
}

/* --------------------------------------------------------- thumbnails */

/** 列出 Drive 資料夾裡的圖片，讓前端可以直接挑既有的圖當縮圖 */
function listThumbs() {
  const folder = DriveApp.getFolderById(FOLDER_ID);
  const it = folder.getFiles();
  const out = [];
  while (it.hasNext() && out.length < 200) {
    const f = it.next();
    if (f.getMimeType().indexOf('image/') !== 0) continue;
    ensureShared(f);
    out.push({
      id: f.getId(),
      name: f.getName(),
      url: thumbUrl(f.getId()),
      updated: f.getLastUpdated().getTime()
    });
  }
  out.sort(function (a, b) { return b.updated - a.updated; });
  return out;
}

function saveThumb(dataUrl, name) {
  const m = /^data:([^;]+);base64,(.+)$/.exec(dataUrl || '');
  if (!m) throw new Error('圖片格式不對');
  const blob = Utilities.newBlob(Utilities.base64Decode(m[2]), m[1], (name || 'thumb') + '.jpg');
  const file = DriveApp.getFolderById(FOLDER_ID).createFile(blob);
  ensureShared(file);
  return thumbUrl(file.getId());
}

function ensureShared(file) {
  try {
    if (file.getSharingAccess() !== DriveApp.Access.ANYONE_WITH_LINK) {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    }
  } catch (ignore) {}   // 共用雲端硬碟等情況會擋，忽略即可
}

function thumbUrl(id) {
  return 'https://drive.google.com/thumbnail?id=' + id + '&sz=w800';
}

/* -------------------------------------------------------------- utils */

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
