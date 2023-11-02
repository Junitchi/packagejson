const { BrowserWindow } = require('electron');
const { remote, ipcRenderer } = require('electron');
const { spawn } = require('child_process'); // Import 'spawn' directly from 'child_process'

function runCommand(command, callback) {
  let cmd = process.platform === 'win32' ? 'cmd.exe' : '/bin/sh';
  let args = process.platform === 'win32' ? ['/c', command] : ['-c', command];

  let child = spawn(cmd, args);

  let stdoutData = ''; // Define variables to store the captured output
  let stderrData = '';

  child.stdout.on('data', (data) => {
    stdoutData += data.toString(); // Accumulate stdout data
    console.log(`stdout: ${data}`);
  });

  child.stderr.on('data', (data) => {
    stderrData += data.toString(); // Accumulate stderr data
    console.error(`stderr: ${data}`);
  });

  child.on('error', (error) => {
    console.error(`error: ${error.message}`);
    ipcRenderer.send('error');
  });

  child.on('close', (code) => {
    console.log(`child process exited with code ${code}`);
    if (typeof callback === 'function') {
      callback({ stdout: stdoutData, stderr: stderrData }); // Pass the captured data to the callback
    }
  });
}

module.exports = runCommand;
