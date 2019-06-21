var fs = require("fs");
var path = require('path');
var crypto = require('crypto');



if (!fs.existsSync("./www_root/hotupdate")) {
	console.log("hotupdate foled not found");
	return;
}

var file_num = 0;
function readDir(dir, obj) {
    var stat = fs.statSync(dir);
    if (!stat.isDirectory()) {
        return;
    }
    var subpaths = fs.readdirSync(dir), subpath, size, md5, compressed, relative;
    for (var i = 0; i < subpaths.length; ++i) {
        if (subpaths[i][0] === '.') {
            continue;
        }
        subpath = path.join(dir, subpaths[i]);
        stat = fs.statSync(subpath);
        if (stat.isDirectory()) {
            readDir(subpath, obj);
        }
        else if (stat.isFile()) {
            // Size in Bytes
            size = stat['size'];
            md5 = crypto.createHash('md5').update(fs.readFileSync(subpath)).digest('hex');
            compressed = path.extname(subpath).toLowerCase() === '.zip';

            // relative = path.relative(src, subpath);
            relative = subpath;
            relative = relative.replace(/\\/g, '/');
            relative = encodeURI(relative);

            out_dir = dir.replace(/\\/g, '/');
            obj[relative] = {
                'md5' : md5,
                'file': relative,
                'dir': out_dir,
            };

            file_num ++;
            if (compressed) {
                obj[relative].compressed = true;
            }
        }
    }
}

var obj = {};
process.chdir("./www_root");
readDir("hotupdate/res", obj);
readDir("hotupdate/src", obj);
console.log(obj);

var str = JSON.stringify(obj);
fs.writeFile("./hotupdate/hotupdate.json", str);

str = "var hotupdate = \n" + str + "\nmodule.exports = hotupdate";
fs.writeFile("./hotupdate/hotupdate.js", str);
