let spawn = require("child_process").spawn;
const { BrowserWindow } = require('electron');
const {remote} = require ("electron");

function runCommand(command, callback) {
  let cmd = process.platform === "win32" ? "cmd.exe" : "/bin/sh";
  let args = process.platform === "win32" ? ["/c", command] : ["-c", command];

  let child = spawn(cmd, args);

  child.stdout.on("data", (data) => {
    console.log(`stdout: ${data}`);
  });

  child.stderr.on("data", (data) => {
    console.error(`stderr: ${data}`);
  });

  child.on('error', (error) => {
    console.error(`error: ${error.message}`);
  });

  child.on("close", (code) => {
    console.log(`child process exited with code ${code}`);
    if (typeof callback === 'function') {
      callback();
    }
  });
}

module.exports = runCommand;
