//const util = require('util');
//const exec = util.promisify(require('child_process').exec);

import util from "util"
import { exec as execX } from "child_process";
const exec = util.promisify(execX);

(async () => {

    try {
       const { stdout, stderr } = await exec('npm install npm');
       console.log(stdout);
    } catch (e) {
        console.error(e); // should contain code (exit code) and signal (that caused the termination).
    }
})();