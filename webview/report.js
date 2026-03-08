const vscode = acquireVsCodeApi();

/* ─── DOM refs ─── */
const fixAllBtn = document.getElementById('fixAllBtn');
const rescanBtn = document.getElementById('rescanBtn');
const bodyEl = document.getElementById('reportBody');
const tableContainer = document.getElementById('tableContainer');
const emptyState = document.getElementById('emptyState');
const loadingState = document.getElementById('loadingState');
const savingsBarSection = document.getElementById('savingsBarSection');
const savingsBarFill = document.getElementById('savingsBarFill');
const savingsPctEl = document.getElementById('savingsPct');

const issueCountEl = document.getElementById('issueCount');
const totalSavingsEl = document.getElementById('totalSavings');
const totalSizeEl = document.getElementById('totalSize');
const formatBreakdownEl = document.getElementById('formatBreakdown');

/* ─── Helpers ─── */
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatBytesJs(bytes) {
  if (bytes < 1024) {
    return bytes + ' B';
  }
  if (bytes < 1048576) {
    return (bytes / 1024).toFixed(1) + ' KB';
  }
  return (bytes / 1048576).toFixed(2) + ' MB';
}

function fileName(filePath) {
  const parts = filePath.split('/');
  return parts[parts.length - 1] || filePath;
}

function dirPath(filePath) {
  const parts = filePath.split('/');
  if (parts.length <= 1) {
    return '';
  }
  return parts.slice(0, -1).join('/');
}

function setLoading(on) {
  loadingState.style.display = on ? 'flex' : 'none';
}

/* ─── Button handlers ─── */
fixAllBtn.addEventListener('click', () => {
  fixAllBtn.disabled = true;
  fixAllBtn.textContent = 'Fixing…';
  vscode.postMessage({ type: 'fixAll' });
});

rescanBtn.addEventListener('click', () => {
  rescanBtn.disabled = true;
  setLoading(true);
  tableContainer.style.display = 'none';
  emptyState.style.display = 'none';
  vscode.postMessage({ type: 'rescan' });
});

/* ─── Row action handlers (delegated) ─── */
bodyEl.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-action]');
  if (!btn) {
    return;
  }
  const issueId = btn.dataset.issueId;
  const action = btn.dataset.action;
  if (!issueId || !action) {
    return;
  }

  // Disable button, show feedback
  btn.disabled = true;
  btn.textContent = '…';
  vscode.postMessage({ type: 'fix', issueId: issueId, action: action });
});

/* ─── Receive data ─── */
window.addEventListener('message', (event) => {
  const message = event.data;
  if (message.type !== 'reportData') {
    return;
  }

  setLoading(false);
  rescanBtn.disabled = false;

  const { summary, rows } = message;

  // Update summary cards
  issueCountEl.textContent = summary.count;
  totalSavingsEl.textContent = summary.totalSavings;
  totalSizeEl.textContent = formatBytesJs(summary.totalOriginalBytes);

  // Format breakdown
  const fmtParts = [];
  for (const [fmt, count] of Object.entries(summary.formatCounts)) {
    fmtParts.push(fmt + ': ' + count);
  }
  formatBreakdownEl.textContent = fmtParts.join(', ') || '—';

  // Savings bar
  if (summary.totalOriginalBytes > 0 && summary.count > 0) {
    const pct = Math.round((summary.totalSavingsBytes / summary.totalOriginalBytes) * 100);
    savingsBarSection.style.display = 'block';
    savingsBarFill.style.width = pct + '%';
    savingsPctEl.textContent = pct + '%';
  } else {
    savingsBarSection.style.display = 'none';
  }

  // Fix All button state
  fixAllBtn.disabled = rows.length === 0;
  fixAllBtn.innerHTML =
    '<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M14.431 3.323l-8.47 10-4.39-3.391.943-1.219 3.25 2.512 7.53-8.9 1.137.998z"/></svg> Fix All';

  if (rows.length === 0) {
    tableContainer.style.display = 'none';
    emptyState.style.display = 'flex';
    return;
  }

  emptyState.style.display = 'none';
  tableContainer.style.display = 'block';

  // Build table rows
  bodyEl.innerHTML = '';
  for (const row of rows) {
    const tr = document.createElement('tr');
    const name = escapeHtml(fileName(row.path));
    const dir = escapeHtml(dirPath(row.path));
    const fmtLower = row.format.toLowerCase();
    const severity = row.savingsPct >= 40 ? 'error' : 'warning';

    // Build action buttons
    let actionsHtml =
      '<button class="btn btn-ghost" data-action="compress" data-issue-id="' +
      escapeHtml(row.id) +
      '" title="Compress in place">Compress</button>';

    if (row.canConvert) {
      actionsHtml +=
        '<button class="btn btn-ghost" data-action="convert-modern" data-issue-id="' +
        escapeHtml(row.id) +
        '" title="Convert to modern format">→ WebP</button>';
    }

    tr.innerHTML =
      '<td class="td-severity-cell"><span class="severity-dot ' +
      severity +
      '"></span></td>' +
      '<td><div class="file-cell"><span class="file-name">' +
      name +
      '</span>' +
      (dir ? '<span class="file-path">' + dir + '</span>' : '') +
      '</div></td>' +
      '<td><span class="format-badge ' +
      fmtLower +
      '">' +
      escapeHtml(row.format) +
      '</span></td>' +
      '<td><span class="size-value">' +
      escapeHtml(row.size) +
      '</span></td>' +
      '<td><span class="size-value">' +
      escapeHtml(row.estimated) +
      '</span></td>' +
      '<td><div class="savings-cell">' +
      '<div class="savings-bar-inline"><div class="savings-bar-inline-fill" style="width:' +
      row.savingsPct +
      '%"></div></div>' +
      '<span class="savings-pct">' +
      row.savingsPct +
      '%</span>' +
      '</div></td>' +
      '<td><div class="actions-cell">' +
      actionsHtml +
      '</div></td>';

    bodyEl.appendChild(tr);
  }
});
