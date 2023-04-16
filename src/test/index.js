import path from "path"
//import * as Util from "../libraries/utils.mjs"
import Config from "../libraries/config.js"

var cnf = new Config("hola/prueba.js", {
	key1: "value",
	key2: true,
	key3: [],
	key4: {
		key4_1: "feo",
		key4_2: "caca"
	}
});
console.log(cnf);