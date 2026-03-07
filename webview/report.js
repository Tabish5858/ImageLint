const vscode = acquireVsCodeApi();

const summaryEl = document.getElementById('summary');
const bodyEl = document.getElementById('reportBody');
const fixAllBtn = document.getElementById('fixAllBtn');

fixAllBtn.addEventListener('click', () => {
  vscode.postMessage({ type: 'fixAll' });
});

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

window.addEventListener('message', (event) => {
  const message = event.data;
  if (message.type !== 'reportData') {
    return;
  }

  summaryEl.textContent = `${message.summary.count} issues found. Potential savings: ${message.summary.totalSavings}`;

  bodyEl.innerHTML = '';
  for (const row of message.rows) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${escapeHtml(row.path)}</td>
      <td>${escapeHtml(row.format)}</td>
      <td>${escapeHtml(row.size)}</td>
      <td>${escapeHtml(row.estimated)}</td>
      <td>${escapeHtml(row.savingsPct)}%</td>
      <td>${escapeHtml(row.suggestions)}</td>
    `;
    bodyEl.appendChild(tr);
  }
});
