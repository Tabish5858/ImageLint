const vscode = acquireVsCodeApi();

/* --- DOM --- */
const fixAllBtn = document.getElementById('fixAllBtn');
const rescanBtn = document.getElementById('rescanBtn');
const emptyRescanBtn = document.getElementById('emptyRescanBtn');
const bodyEl = document.getElementById('reportBody');
const tableArea = document.getElementById('tableArea');
const emptyState = document.getElementById('emptyState');
const loadingState = document.getElementById('loadingState');
const statsSection = document.getElementById('statsSection');
const optProgress = document.getElementById('optProgress');
const optFill = document.getElementById('optFill');
const optPct = document.getElementById('optPct');
const issueCountEl = document.getElementById('issueCount');
const totalSavingsEl = document.getElementById('totalSavings');
const totalSizeEl = document.getElementById('totalSize');
const formatBreakdownEl = document.getElementById('formatBreakdown');
const toolbarCount = document.getElementById('toolbarCount');
const sortSelect = document.getElementById('sortSelect');
const filterSelect = document.getElementById('filterSelect');
const footerEl = document.getElementById('footer');

/* Settings DOM */
const settingsPanel = document.getElementById('settingsPanel');
const settingsToggle = document.getElementById('settingsToggle');
const settingsBody = document.getElementById('settingsBody');
const settingsChevron = document.getElementById('settingsChevron');
const diagEnabledEl = document.getElementById('diagEnabled');
const diagSeverityEl = document.getElementById('diagSeverity');
const fileTypeChipsEl = document.getElementById('fileTypeChips');

var allRows = [];
var currentFileTypes = [];
var allFileTypes = ['js', 'jsx', 'ts', 'tsx', 'html', 'css', 'scss', 'vue', 'svelte', 'md', 'mdx'];

/* --- Helpers --- */
function esc(v) {
  return String(v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
function fmtBytes(b) {
  if (b < 1024) return b + ' B';
  if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
  return (b / 1048576).toFixed(2) + ' MB';
}
function basename(p) {
  var s = p.split('/');
  return s[s.length - 1] || p;
}
function dirname(p) {
  var s = p.split('/');
  return s.length > 1 ? s.slice(0, -1).join('/') : '';
}

/* --- Controls --- */
fixAllBtn.addEventListener('click', function () {
  fixAllBtn.disabled = true;
  fixAllBtn.textContent = 'Fixing...';
  vscode.postMessage({ type: 'fixAll' });
});

rescanBtn.addEventListener('click', function () {
  startRescan();
});

if (emptyRescanBtn) {
  emptyRescanBtn.addEventListener('click', function () {
    startRescan();
  });
}

function startRescan() {
  rescanBtn.disabled = true;
  loadingState.classList.remove('hidden');
  tableArea.classList.add('hidden');
  emptyState.classList.add('hidden');
  vscode.postMessage({ type: 'rescan' });
}

/* Row click delegation */
bodyEl.addEventListener('click', function (e) {
  var btn = e.target.closest('[data-action]');
  if (!btn) return;
  var id = btn.dataset.issueId;
  var action = btn.dataset.action;
  if (!id || !action) return;
  btn.disabled = true;
  btn.textContent = '...';
  vscode.postMessage({ type: 'fix', issueId: id, action: action });
});

/* --- Sort / Filter --- */
sortSelect.addEventListener('change', renderTable);
filterSelect.addEventListener('change', renderTable);

function getVisibleRows() {
  var fmt = filterSelect.value;
  var rows =
    fmt === 'all'
      ? allRows.slice()
      : allRows.filter(function (r) {
          return r.format.toLowerCase() === fmt;
        });
  var sort = sortSelect.value;
  rows.sort(function (a, b) {
    if (sort === 'savings-desc') return b.savingsPct - a.savingsPct;
    if (sort === 'savings-asc') return a.savingsPct - b.savingsPct;
    if (sort === 'size-desc') return b.sizeBytes - a.sizeBytes;
    if (sort === 'size-asc') return a.sizeBytes - b.sizeBytes;
    if (sort === 'name-asc') return a.path.localeCompare(b.path);
    if (sort === 'name-desc') return b.path.localeCompare(a.path);
    return 0;
  });
  return rows;
}

function renderTable() {
  var rows = getVisibleRows();
  toolbarCount.textContent = rows.length + (rows.length === 1 ? ' image' : ' images');
  bodyEl.innerHTML = '';

  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    var tr = document.createElement('tr');
    var nm = esc(basename(r.path));
    var dir = esc(dirname(r.path));
    var fl = r.format.toLowerCase();
    var sev = r.savingsPct >= 40 ? 'err' : 'warn';

    var acts = '';
    if (r.canCompress) {
      acts +=
        '<button class="act-btn act-btn-compress" data-action="compress" data-issue-id="' +
        esc(r.id) +
        '" title="Compress in current format">' +
        '<svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M14 1H2L1 2v12l1 1h12l1-1V2l-1-1zm0 12H2V2h12v11zM4 6h8v1H4V6zm0 3h8v1H4V9z"/></svg>' +
        'Compress</button>';
    }
    if (r.canConvert) {
      acts +=
        '<button class="act-btn act-btn-webp" data-action="convert-modern" data-issue-id="' +
        esc(r.id) +
        '" title="Convert to WebP format">' +
        '<svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1v3.6l3.1-1.8.5.9L8.5 5.5 12 7l-.5.9L8 6.1V10H7V6.1L3.5 7.9 3 7l3.5-1.5L3.4 3.7l.5-.9L7 4.6V1h1z"/></svg>' +
        'WebP</button>';
    }
    if (r.canResize) {
      acts +=
        '<button class="act-btn act-btn-resize" data-action="resize" data-issue-id="' +
        esc(r.id) +
        '" title="Resize to 1600px width">' +
        '<svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M1.5 1h13l.5.5v13l-.5.5h-13l-.5-.5v-13l.5-.5zM2 14h12V2H2v12zm2.5-3.5l2-3 1.5 2 1-1.5 2.5 3h-7z"/></svg>' +
        'Resize</button>';
    }

    tr.innerHTML =
      '<td><span class="dot dot-' +
      sev +
      '"></span></td>' +
      '<td><div class="file-cell"><span class="file-name">' +
      nm +
      '</span>' +
      (dir ? '<span class="file-dir">' + dir + '</span>' : '') +
      '</div></td>' +
      '<td><span class="fmt fmt-' +
      fl +
      '">' +
      esc(r.format) +
      '</span></td>' +
      '<td><span class="mono">' +
      esc(r.size) +
      '</span></td>' +
      '<td><span class="mono">' +
      esc(r.estimated) +
      '</span></td>' +
      '<td><div class="sav-cell"><div class="sav-bar"><div class="sav-fill" style="width:' +
      r.savingsPct +
      '%"></div></div><span class="sav-pct">' +
      r.savingsPct +
      '%</span></div></td>' +
      '<td><div class="act-cell">' +
      acts +
      '</div></td>';
    bodyEl.appendChild(tr);
  }
}

/* --- Receive data --- */
window.addEventListener('message', function (event) {
  var msg = event.data;

  if (msg.type === 'settingsData') {
    applySettingsData(msg);
    return;
  }

  if (msg.type !== 'reportData') return;

  loadingState.classList.add('hidden');
  rescanBtn.disabled = false;
  allRows = msg.rows;

  var s = msg.summary;

  /* Stats */
  statsSection.classList.remove('hidden');
  issueCountEl.textContent = s.count;
  totalSavingsEl.textContent = s.totalSavings;
  totalSizeEl.textContent = fmtBytes(s.totalOriginalBytes);

  var fp = [];
  for (var f in s.formatCounts) {
    fp.push(f.toUpperCase() + ' ' + s.formatCounts[f]);
  }
  formatBreakdownEl.textContent = fp.join(' \u00b7 ') || '\u2014';

  /* Progress */
  if (s.totalOriginalBytes > 0 && s.count > 0) {
    var pct = Math.round((s.totalSavingsBytes / s.totalOriginalBytes) * 100);
    optProgress.classList.remove('hidden');
    optFill.style.width = pct + '%';
    optPct.textContent = pct + '%';
  } else {
    optProgress.classList.add('hidden');
  }

  /* Filter dropdown */
  var fmts = {};
  for (var i = 0; i < allRows.length; i++) {
    fmts[allRows[i].format.toLowerCase()] = true;
  }
  var cur = filterSelect.value;
  filterSelect.innerHTML = '<option value="all">All Formats</option>';
  Object.keys(fmts)
    .sort()
    .forEach(function (f) {
      var o = document.createElement('option');
      o.value = f;
      o.textContent = f.toUpperCase();
      filterSelect.appendChild(o);
    });
  filterSelect.value = cur in fmts || cur === 'all' ? cur : 'all';

  /* Fix All */
  fixAllBtn.disabled = allRows.length === 0;
  fixAllBtn.innerHTML =
    '<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M14.431 3.323l-8.47 10-4.39-3.391.943-1.219 3.25 2.512 7.53-8.9 1.137.998z"/></svg> Fix All Issues';

  if (allRows.length === 0) {
    tableArea.classList.add('hidden');
    emptyState.classList.remove('hidden');
    footerEl.classList.remove('hidden');
    return;
  }

  emptyState.classList.add('hidden');
  tableArea.classList.remove('hidden');
  footerEl.classList.remove('hidden');
  renderTable();
});

/* --- Settings Panel --- */
settingsToggle.addEventListener('click', function () {
  var isOpen = !settingsBody.classList.contains('hidden');
  if (isOpen) {
    settingsBody.classList.add('hidden');
    settingsChevron.classList.remove('settings-chevron-open');
  } else {
    settingsBody.classList.remove('hidden');
    settingsChevron.classList.add('settings-chevron-open');
  }
});

diagEnabledEl.addEventListener('change', function () {
  vscode.postMessage({
    type: 'updateSettings',
    diagnosticsEnabled: diagEnabledEl.checked
  });
});

diagSeverityEl.addEventListener('change', function () {
  vscode.postMessage({
    type: 'updateSettings',
    severity: diagSeverityEl.value
  });
});

function renderFileTypeChips() {
  fileTypeChipsEl.innerHTML = '';
  for (var i = 0; i < allFileTypes.length; i++) {
    var ft = allFileTypes[i];
    var chip = document.createElement('button');
    chip.className =
      'filetype-chip' + (currentFileTypes.indexOf(ft) !== -1 ? ' filetype-chip-active' : '');
    chip.textContent = '.' + ft;
    chip.dataset.ft = ft;
    fileTypeChipsEl.appendChild(chip);
  }
}

fileTypeChipsEl.addEventListener('click', function (e) {
  var chip = e.target.closest('[data-ft]');
  if (!chip) return;
  var ft = chip.dataset.ft;
  var idx = currentFileTypes.indexOf(ft);
  if (idx !== -1) {
    currentFileTypes.splice(idx, 1);
  } else {
    currentFileTypes.push(ft);
  }
  renderFileTypeChips();
  vscode.postMessage({
    type: 'updateSettings',
    fileTypes: currentFileTypes.slice()
  });
});

function applySettingsData(msg) {
  settingsPanel.classList.remove('hidden');
  diagEnabledEl.checked = msg.diagnosticsEnabled;
  diagSeverityEl.value = msg.severity;
  currentFileTypes = msg.fileTypes.slice();
  renderFileTypeChips();
}

/* Request current settings on load */
vscode.postMessage({ type: 'getSettings' });
