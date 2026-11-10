const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');

function prepare(root, install, runtime = `${process.platform}:${process.arch}:${process.versions.node}`) {
  const lock = fs.readFileSync(path.join(root, 'package-lock.json'));
  const manifest = fs.readFileSync(path.join(root, 'package.json'));
  const digest = crypto.createHash('sha256').update(lock).update(manifest).update(runtime).digest('hex');
  const marker = path.join(root, 'node_modules', '.pedeae-install-hash');
  const cli = path.join(root, 'node_modules', 'expo', 'bin', 'cli');
  if (fs.existsSync(cli) && fs.existsSync(marker) && fs.readFileSync(marker, 'utf8') === digest) return cli;
  console.log('Preparando os componentes. Esta etapa so se repete quando necessario.');
  // Invalidate a previous marker before installation, so a failed install cannot be reused.
  fs.rmSync(marker, { force: true });
  const result = install();
  if (result.error || result.status !== 0 || !fs.existsSync(cli))
    throw new Error('A instalacao nao terminou. Confira a internet e tente abrir novamente.');
  fs.writeFileSync(marker, digest);
  return cli;
}

if (require.main === module) {
  try {
    const root = path.resolve(__dirname, '..');
    const cli = prepare(root, () => spawnSync(
      process.platform === 'win32' ? 'cmd.exe' : 'npm',
      process.platform === 'win32' ? ['/d', '/s', '/c', 'npm.cmd ci'] : ['ci'],
      { cwd: root, stdio: 'inherit' },
    ));
    console.log('Abrindo o PedeAe. Voce pode minimizar esta janela; feche-a para encerrar.');
    const result = spawnSync(process.execPath, [cli, 'start', '--web', '--localhost'], { cwd: root, stdio: 'inherit' });
    if (result.error) throw result.error;
    process.exitCode = result.status ?? (result.signal === 'SIGINT' ? 0 : 1);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
module.exports = { prepare };
