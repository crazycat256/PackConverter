/**
 * @param {JSZip} pack
 * @returns {JSZip}
 */
async function convertPack(pack) {
    // Check if the pack is valid
    var assetsExists = false;
    for (let file in pack.files) {
        if (file.startsWith("assets/")) {
            assetsExists = true;
            break;
        }
    }
    if (!assetsExists || !pack.file("pack.mcmeta")) {
        console.error("The pack is not valid.");
        return;
    }


    // Convert the lang files
    for (let lang of convertionData.lang_paths) {
        let srcLangFile = lang[src]
        let dstLangFile = lang[dst]
        
        if (pack.file(srcLangFile)) {

            let srcLangDict = await langToDict(await pack.file(srcLangFile).async("string"));
            let dstLangDict;
            if (pack.file(dstLangFile)) {
                dstLangDict = await langToDict(await pack.file(dstLangFile).async("string"));
            } else {
                dstLangDict = {};
            }
            
            for (let item of convertionData.items) {
                if (item[src] in srcLangDict) {
                    if (item[dst]) {
                        dstLangDict[item[dst]] = srcLangDict[item[src]];
                    }
                }
            }

            pack.file(dstLangFile, await dictToLang(dstLangDict));

        }
    }


    // Convert the assets
    for (let asset of convertionData.assets) {

        let srcAsset = asset[src];
        let dstAsset = asset[dst];

        for (ext of ["png", "png.mcmeta", "properties"]) {
            let srcAssetFile = "assets/" + srcAsset + "." + ext;
            let dstAssetFile = "assets/" + dstAsset + "." + ext;

            if (pack.file(srcAssetFile)) {
                pack.file(dstAssetFile, pack.file(srcAssetFile).async("uint8array"));
            }
        }
    }

    return pack;
}



async function langToDict(file) {
    var fileLines = {};

    file.split("\n").forEach(function(line) {
        line = line.split("#")[0].split("=", 2);
        if (line.length === 2) {
            fileLines[line[0]] = line[1];
        }
    });

    return fileLines;
}

async function dictToLang(dict) {
    var lines = [];

    Object.entries(dict).forEach(function([key, value]) {
        lines.push(key + "=" + value);
    });

    return lines.join("\n");
}