/**
 * This file will automatically be loaded by webpack and run in the "renderer" context.
 * To learn more about the differences between the "main" and the "renderer" context in
 * Electron, visit:
 *
 * https://electronjs.org/docs/tutorial/application-architecture#main-and-renderer-processes
 *
 * By default, Node.js integration in this file is disabled. When enabling Node.js integration
 * in a renderer process, please be aware of potential security implications. You can read
 * more about security risks here:
 *
 * https://electronjs.org/docs/tutorial/security
 *
 * To enable Node.js integration in this file, open up `main.js` and enable the `nodeIntegration`
 * flag:
 *
 * ```
 *  // Create the browser window.
 *  mainWindow = new BrowserWindow({
 *    width: 800,
 *    height: 600,
 *    webPreferences: {
 *      nodeIntegration: true
 *    }
 *  });
 * ```
 */

import './index.css';
import './index.scss';

console.log('👋 This message is being logged by "renderer.js", included via webpack');


ipcRenderer.on('displayCommandResult', (event, data) => {
    removeLoadingScreen();
    console.log(data);

    // Check if overlayingDiv already exists
    let existingOverlay = document.getElementById('overlayingDiv');
    if (existingOverlay) {
      // If it exists, remove it
      existingOverlay.remove();
    }

    // Create a new overlaying div
    let overlayingDiv = document.createElement('div');
    overlayingDiv.id = 'overlayingDiv';

    // Create an exit button
    let exitButton = document.createElement('button');
    exitButton.textContent = 'Exit';
    exitButton.id = "exitButton";
    exitButton.classList.add("exitButtonOverride")
    exitButton.onclick = function() {
      overlayingDiv.remove(); // Remove the overlaying div when the exit button is clicked
    };
    overlayingDiv.appendChild(exitButton);

    // Create a paragraph to display data
    let dataParagraph = document.createElement('p');
    dataParagraph.id = 'console-output';
    dataParagraph.textContent = JSON.stringify(data, null, 2); // Convert data to string with indentation
    overlayingDiv.appendChild(dataParagraph);

    // Append the new overlaying div to the body
    document.body.appendChild(overlayingDiv);
});


  ipcRenderer.on('fetchedPackageVersion', (event, data) => {
    console.log(data);

    // Check if overlayingDiv already exists
    let existingOverlay = document.getElementById('overlayingDiv');
    if (existingOverlay) {
      // If it exists, remove it
      existingOverlay.remove();
    }

    // Create a new overlaying div
    let overlayingDiv = document.createElement('div');
    overlayingDiv.id = 'overlayingDiv';

    // Create an exit button
    let exitButton = document.createElement('button');
    exitButton.textContent = 'Exit';
    exitButton.id = "exitButton";
    exitButton.classList.add("exitButtonOverride")
    exitButton.onclick = function() {
      overlayingDiv.remove(); // Remove the overlaying div when the exit button is clicked
    };
    overlayingDiv.appendChild(exitButton);

    // Iterate over each key in data
    for (let key in data) {
      console.log(`Key: ${key}`);

      // Create a button for each key
      let button = document.createElement('button');
      button.textContent = key;

      // Add an onclick method to the button
      button.onclick = function() {
        console.log(this.textContent);
        ipcRenderer.send('managePackage', { package: packageName, version: key, dependency: data["key"] });
        overlayingDiv.remove();
        setTimeout(createLoadingScreen(),1000);
        
      };

      // Append the button to the overlaying div
      overlayingDiv.appendChild(button);
      
    }
    
    // Append the new overlaying div to the body
    document.body.appendChild(overlayingDiv);
    
});

ipcRenderer.on('packageJsonData', (event, data) => {
    let form = document.getElementById('form-id');
    console.log(data)
    form.innerHTML = "";
    for (let key in data) {
      let label = document.createElement('label');
      label.textContent = key;
      // label.id = ""
      let input;
      
      if (key === 'dependencies' || key === 'devDependencies') {
        // Output the name of the field before the buttons
        form.appendChild(label);
        // Create a button for each versioned package
        for (let pkg in data[key]) {
          // Create a container div
          let containerDiv = document.createElement('div');

          // Create the main button
          let button = document.createElement('button');
          button.textContent = `${pkg}: ${data[key][pkg]}`;
          button.onclick = (event) => dependencyButtonHandler(event, button, key);
          button.setAttribute('buttonTextualSource', pkg + ": " + data[key][pkg]);
          button.setAttribute('buttonDependencies', key);
          button.id = 'packageVersionsButton';

          // Create the Uninstall button
          let uninstallButton = document.createElement('button');
          uninstallButton.textContent = 'Uninstall';
          uninstallButton.id = "uninstallButton";
          uninstallButton.onclick = (event)=>{
            event.preventDefault();

            ipcRenderer.send('uninstall', pkg);
            setTimeout(createLoadingScreen(),1500);
          }
          // Add an event handler for the Uninstall button if needed

          // Create the Edit buttont
          let editButton = document.createElement('button');
          editButton.textContent = 'Edit';
          editButton.id = "editButton";
          // Add an event handler for the Edit button if needed

          // Append the buttons to the container div
          containerDiv.appendChild(button);
          containerDiv.appendChild(uninstallButton);
          containerDiv.id = "containerDiv";
          // containerDiv.appendChild(editButton);

          // Append the container div to the form
          form.appendChild(containerDiv);
        }

        let installButton = document.createElement('button');
        installButton.textContent = 'Install as ' + key;
        // installButton.type = 'submit';
        
        installButton.onclick = (event) => {
          event.preventDefault();

          let overlayBox = document.createElement('div');
          overlayBox.style.position = 'fixed';
          overlayBox.style.top = '0';
          overlayBox.style.right = '0';
          overlayBox.style.bottom = '0';
          overlayBox.style.left = '0';
          overlayBox.style.display = 'flex';
          overlayBox.style.alignItems = 'center';
          overlayBox.style.justifyContent = 'center';
          overlayBox.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'; // Semi-transparent background

          // Create form
          let form = document.createElement('form');
          form.style.backgroundColor = 'white';
          form.style.padding = '20px';

          // Create input field
          let inputField = document.createElement('input');
          inputField.type = 'text';
          inputField.placeholder = 'Enter package name';

          // Create submit button
          let submitButton = document.createElement('button');
          submitButton.type = 'submit';
          submitButton.textContent = 'Submit';
          submitButton.classList.add("submitButton");

          let cancelButton = document.createElement('button');
          cancelButton.textContent = 'Cancel';
          cancelButton.id = 'cancelButton';
          cancelButton.onclick = (event) => {
            overlayBox.remove();
          };
          // Append input field and submit button to form
          form.appendChild(inputField);
          form.appendChild(submitButton);
          form.appendChild(cancelButton);

          // Append form to overlay box
          overlayBox.appendChild(form);

          // Append overlay box to body
          document.body.appendChild(overlayBox);

         
          form.onsubmit = (event) => {
            event.preventDefault();
            setTimeout(createLoadingScreen(),1000);
            // Retrieve string from input field
            let packageName = inputField.value;
            
            if(packageName.length >= 1){
              // Send package name in 'storePackageJSON' message
            ipcRenderer.send('install', packageName, key === 'dependencies');
            overlayBox.remove();
            }
            
            
          };

          
          
          
          // console.log(collectData());
          // let packagejson = collectData();
          // ipcRenderer.send("storePackageJSON", packagejson);
        };
        
        // Append the submit button to the form
        form.appendChild(installButton);
      } else if (typeof data[key] === 'string') {
        input = document.createElement('input');
        input.type = 'text';
        input.value = data[key];
        form.appendChild(label);
        form.appendChild(input);
      } else if (typeof data[key] === 'number') {
        input = document.createElement('input');
        input.type = 'number';
        input.value = data[key];
        form.appendChild(label);
        form.appendChild(input);
      } else if (typeof data[key] === 'boolean') {
        input = document.createElement('input');
        input.type = 'checkbox';
        input.checked = data[key];
        form.appendChild(label);
        form.appendChild(input);
      } else if (Array.isArray(data[key])) {
        input = document.createElement('textarea');
        input.value = JSON.stringify(data[key], null, 2);
        form.appendChild(label);
        form.appendChild(input);
      } else if (typeof data[key] === 'object') {
        input = document.createElement('textarea');
        input.value = JSON.stringify(data[key], null, 2);
        form.appendChild(label);
        form.appendChild(input);
      }
}

let submitButton = document.createElement('button');
submitButton.textContent = 'Submit';
submitButton.type = 'submit';
submitButton.classList.add('submitButton');

let fileSelector = document.createElement('button');
fileSelector.textContent = 'Load Package.json';
fileSelector.id = 'fileSelector';
fileSelector.onclick = (event) => {
  event.preventDefault();
  ipcRenderer.send('loadPackageJSON');
};

submitButton.onclick = (event) => {
  event.preventDefault();
  console.log(collectData());
  let packagejson = collectData();
  ipcRenderer.send("storePackageJSON", packagejson);
};

// Append the submit button to the form
form.appendChild(submitButton);
form.appendChild(fileSelector);


document.body.appendChild(form);
const fileSelectorButton = document.getElementById('fileSelector'); 
fileSelectorButton.classList.add('fileSelectorHidden');// Handle form submission

});

