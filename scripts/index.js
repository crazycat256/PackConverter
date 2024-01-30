const dropzone = document.getElementById('dropzone');
const uploadIcon = dropzone.querySelector('i');
const uploadText = dropzone.querySelector('span');
const fileInput = document.getElementById('file-input');
const downloadButton = document.getElementById('download-button');
const typeSelector = document.getElementById("type-selector");
const modeSelector = document.getElementById("mode-selector");
const modeSrc = document.getElementById("src");
const modeDst = document.getElementById("dst");

const typeNames = {
    "Paladium": "palamod",
    "Bloodshed": "bloodshed",
}

var src = typeNames[modeSrc.textContent]
var dst = typeNames[modeDst.textContent]
var inputFile;
var outputFileContent = {}
var outputFileName;

var convertionData;
fetch("data/convert.json").then(response => {
    response.json().then(data => {
        convertionData = data;
    });
});


['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, preventDefaults, false);
});

['dragenter', 'dragover'].forEach(eventName => {
    dropzone.addEventListener(eventName, highlight, false);
});

['dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, unhighlight, false);
});

fileInput.addEventListener('change', handleFiles, false);
dropzone.addEventListener('drop', handleFiles, false);
modeSelector.addEventListener('click', function(e){
    [modeSrc.textContent, modeDst.textContent] = [modeDst.textContent, modeSrc.textContent];
    src = typeNames[modeSrc.textContent]
    dst = typeNames[modeDst.textContent]
    if (!outputFileContent[dst]) {
        convertFile()
    };
    
}, false);
downloadButton.addEventListener('click', function() {
    saveAs(outputFileContent[dst], outputFileName);
});
modeSelector.addEventListener('click', function(e){

}, false);

let highlighting = false;
let textContent;
let color;

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function highlight() {
    if (highlighting) return;
    highlighting = true;
    textContent = uploadText.textContent;
    color = dropzone.style.color;
    uploadText.textContent = 'Déposez le fichier ici';
    dropzone.style.color = '#555';
}

function unhighlight() {
    if (!highlighting) return;
    highlighting = false;
    uploadText.textContent = textContent;
    dropzone.style.color = color;
}

function handleFiles(e) {
    outputFileContent = {};
    if (e.dataTransfer && e.dataTransfer.items[0].webkitGetAsEntry().isFile) {
        inputFile = e.dataTransfer ? e.dataTransfer.files[0] : e.target.files[0];
    } else {
        inputFile = e.dataTransfer.items[0].webkitGetAsEntry();
    }
    convertFile();
}

function convertDirectoryToJSZip(directoryEntry, zip) {
    return new Promise((resolve, reject) => {
        directoryEntry.createReader().readEntries((entries) => {
            if (entries.length === 0) {
                resolve(zip);
                return;
            }

            let promises = [];
            entries.forEach((entry) => {
                if (entry.isDirectory) {
                    let newZip = zip.folder(entry.name);
                    promises.push(convertDirectoryToJSZip(entry, newZip));
                } else {
                    promises.push(new Promise((resolveFile, rejectFile) => {
                        entry.file((file) => {
                            const reader = new FileReader();

                            reader.onload = function (e) {
                                zip.file(entry.name, e.target.result);
                                resolveFile();
                            };

                            reader.readAsArrayBuffer(file);
                        });
                    }));
                }
            });

            Promise.all(promises)
                .then(() => resolve(zip));
        });
    });
}

function convertFile() {

    if (!inputFile) return;

    if (!inputFile.name.endsWith('.zip') && !inputFile.isDirectory) {
        let spl = inputFile.name.split('.');
        alert('Le fichier doit être un .zip ou un dossier, pas un .' + spl[spl.length - 1]);
        return;
    }

    var pack = new JSZip();

    uploadText.textContent = inputFile.name;
    dropzone.style.color = '#efefef';
    downloadButton.textContent = "Conversion en cours...";
    downloadButton.disabled = true;

    let promise;
    if (!inputFile.isDirectory) {
        promise = pack.loadAsync(inputFile);
    } else {
        promise = convertDirectoryToJSZip(inputFile, pack);
    }
    

    promise.then(function() {
        convertPack(pack).then(function(convertedPack) {

            if (!convertedPack) {
                  uploadText.textContent = "Glissez-déposez votre resourcepack ici ou cliquez pour sélectionner un fichier"
                  dropzone.style.color = '#555';
                  downloadButton.textContent = "Télécharger";
                  downloadButton.disabled = true;
                  fileInput.files = null;
                  alert("Le pack n'est pas valide.")
            }
  
              convertedPack.generateAsync({type:"blob"}).then(function(content) {
                  outputFileContent[dst] = content;
                  outputFileName = inputFile.name;
                  downloadButton.disabled = false;
                  downloadButton.textContent = "Télécharger";
  
              });
          });
    })
}
