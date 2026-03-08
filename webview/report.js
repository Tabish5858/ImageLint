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

var allRows = [];

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
  loadingState.style.display = 'flex';
  tableArea.style.display = 'none';
  emptyState.style.display = 'none';
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

    var acts =
      '<button class="btn-ghost" data-action="compress" data-issue-id="' +
      esc(r.id) +
      '" title="Compress in place">Compress</button>';
    if (r.canConvert) {
      acts +=
        '<button class="btn-ghost btn-convert" data-action="convert-modern" data-issue-id="' +
        esc(r.id) +
        '" title="Convert to WebP">\u2192 WebP</button>';
    }
    if (r.canResize) {
      acts +=
        '<button class="btn-ghost" data-action="resize" data-issue-id="' +
        esc(r.id) +
        '" title="Resize to 1600px width">Resize</button>';
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
  if (msg.type !== 'reportData') return;

  loadingState.style.display = 'none';
  rescanBtn.disabled = false;
  allRows = msg.rows;

  var s = msg.summary;

  /* Stats */
  statsSection.style.display = 'grid';
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
    optProgress.style.display = 'block';
    optFill.style.width = pct + '%';
    optPct.textContent = pct + '%';
  } else {
    optProgress.style.display = 'none';
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
    tableArea.style.display = 'none';
    emptyState.style.display = 'flex';
    footerEl.style.display = 'block';
    return;
  }

  emptyState.style.display = 'none';
  tableArea.style.display = 'block';
  footerEl.style.display = 'block';
  renderTable();
});
