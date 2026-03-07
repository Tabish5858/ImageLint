const vscode = acquireVsCodeApi();

const summaryEl = document.getElementById('summary');
const bodyEl = document.getElementById('reportBody');
const fixAllBtn = document.getElementById('fixAllBtn');

fixAllBtn.addEventListener('click', () => {
  vscode.postMessage({ type: 'fixAll' });
});

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
      <td>${row.path}</td>
      <td>${row.format}</td>
      <td>${row.size}</td>
      <td>${row.estimated}</td>
      <td>${row.savingsPct}%</td>
      <td>${row.suggestions}</td>
    `;
    bodyEl.appendChild(tr);
  }
});
