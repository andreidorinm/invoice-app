
document.addEventListener('DOMContentLoaded', () => {
  const dropZone = document.getElementById('drop_zone');
  const selectFilesBtn = document.getElementById('select-files');

  // Open File Dialog
  selectFilesBtn.addEventListener('click', () => {
    window.api.openFileDialog();
  });

  // Receive and Display Data
  window.api.receive('file-processed', (data) => {
    const parsedData = JSON.parse(data);
    displayData(parsedData);
  });

  window.api.receive('display-json', (data) => {
    const displayArea = document.getElementById('json-display'); // Make sure you have this element in your HTML
    if (displayArea) {
      displayArea.textContent = data; // Display formatted JSON
    }
  });

  // Adjusted code for renderer.js when using context isolation
  window.api.receive('display-json', (data) => {
    const displayElement = document.getElementById('jsonDataDisplay');
    if (displayElement) {
      displayElement.textContent = data;
    }
  });

});

// Function to Display Data
function displayData(data) {
  const pre = document.createElement('pre');
  pre.textContent = JSON.stringify(data, null, 2);
  document.body.appendChild(pre);
}
