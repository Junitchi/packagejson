const { app, BrowserWindow, dialog, ipcMain} = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');
const runCommand = require('./runCommand');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

let currentDirectory = null;
let file = null;

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      nodeIntegration: true,
      contextIsolation: false
    },
  });

  // and load the index.html of the app.
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  // Open the DevTools.
  mainWindow.webContents.openDevTools({mode: 'detach'});
};

ipcMain.on('openFile', async (event, data) => {
  dialog.showOpenDialog({
      properties: ['openFile']
  }).then(result => {
      if (!result.canceled) {
          let filePath = result.filePaths[0];
          console.log('User selected file: ', filePath);
          currentDirectory = path.dirname(filePath);
          file = filePath;
          // Read the file and send the JSON data
          fs.readFile(filePath, 'utf8', (err, fileData) => {
              if (err) {
                  console.error('An error occurred while reading the file: ', err);
              } else {
                  try {
                      const jsonData = JSON.parse(fileData);
                      event.sender.send('packageJsonData', jsonData);
                  } catch (jsonError) {
                      console.error('An error occurred while parsing JSON: ', jsonError);
                  }
              }
          });
      }
  }).catch(err => {
      console.error('An error occurred: ', err);
  });
});

ipcMain.on('storePackageJSON', (event, data) => {
  // Assuming 'file' is a global variable that contains the path to the file
  fs.writeFile(file, JSON.stringify(data, null, 2), 'utf8', (err) => {
    if (err) {
      console.error('An error occurred while writing the file: ', err);
    } else {
      console.log('File has been successfully saved: ', file);
    }
  });
});

function refreshFile(event) {
  // Check if filePath is defined
  console.log("refreshing");
  if (!file) {
    console.error('file is not defined');
    return;
  }

  // Read the file and send the JSON data
  fs.readFile(file, 'utf8', (err, fileData) => {
    if (err) {
      console.error('An error occurred while reading the file: ', err);
    } else {
      try {
        const jsonData = JSON.parse(fileData);
        event.sender.send('packageJsonData', jsonData);
      } catch (jsonError) {
        console.error('An error occurred while parsing JSON: ', jsonError);
      }
    }
  });
}




  ipcMain.on('fetchPackage', async(event, data) => {
    console.log(data.packageName);
    https.get('https://registry.npmjs.org/'+ data.packageName, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      const jsonData = JSON.parse(data);
      // console.log(jsonData.versions);
      event.sender.send('fetchedPackageVersion', jsonData.versions)
    });

  }).on("error", (err) => {
    console.log("Error: " + err.message);
    });
  });

  ipcMain.on('managePackage', (event, data) => {
    let specialInstallCommands = {
      'package1': 'special command for package1',
      'package2': 'special command for package2'
    };
    console.table(data)
    managePackage(currentDirectory, data.package, data.version, specialInstallCommands, event);
  });

  function managePackage(folderPath, packageName, version, specialInstallCommands, event) {
    if (version.startsWith('^')) {
      version = version.replace('^', '');
    }
    let cdCommand = 'cd ' + folderPath;
    let uninstallCommand = 'npm uninstall ' + packageName;
    let installCommand = (typeof(specialInstallCommands[packageName]) === "undefined") ? 
      "npm install " + packageName + "@" + version : 
      specialInstallCommands[packageName] + " " + packageName + "@" + version;

    let fullCommand = cdCommand + ' && ' + uninstallCommand + ' && ' + installCommand;
    runCommand(fullCommand, () => {
      refreshFile(event)
    });
    // Now you can run fullCommand in the terminal
}

// In your main process
ipcMain.on('install', (event, packageName, isDev ) => {
  let saveFlag = isDev ? ' --save ' : ' --save-dev ';
  let fullCommand = `cd ${currentDirectory} && npm install ${saveFlag} ${packageName}`;
  console.log(fullCommand)
  runCommand(fullCommand, () => {
    refreshFile(event);
  });
});

ipcMain.on('uninstall', (event, packageName) => {
  let fullCommand = `cd ${currentDirectory} && npm uninstall ${packageName}`;
  console.log(fullCommand)
  runCommand(fullCommand, () => {
    refreshFile(event);
  });
});



// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
