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
    inputFile = e.dataTransfer ? e.dataTransfer.files[0] : e.target.files[0];
    outputFileContent = {};
    convertFile();
}

function convertFile() {

    if (!inputFile) return;

    if (!inputFile.name.endsWith('.zip')) {
        alert('Le fichier doit être un .zip, pas un .' + inputFile.name.split('.')[-1]);
        return;
    }

    var pack = new JSZip();

    uploadText.textContent = inputFile.name;
    dropzone.style.color = '#efefef';
    downloadButton.textContent = "Conversion en cours...";
    downloadButton.disabled = true;

    pack.loadAsync(inputFile).then(function() {

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

    });
}
