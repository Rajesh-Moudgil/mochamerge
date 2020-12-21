const fs=require('fs');
const path = require('path');

module.exports = {
    getCWD : () => {
        return path.basename(process.cwd());
    },
    pathExists: (path) => {
        return fs.existsSync(path);
    },
    readFile : (path) => {
       // if (! this.pathExists(path))
       //     return '';
        return fs.readFileSync(path);
    },
    writeFile : (path,data) => {
        fs.writeFileSync(path,data);
    }
}