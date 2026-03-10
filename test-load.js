try {
  require('./dist/extension.js');
} catch (e) {
  if (e.message.includes('vscode')) {
    console.log('Extension module loaded OK (stopped at vscode import - expected outside VS Code)');
  } else {
    console.log('UNEXPECTED ERROR:', e.message);
    console.log(e.stack);
  }
}
