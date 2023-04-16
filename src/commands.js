import { wait } from "./libraries/utils.mjs";

export default async (Main, cadena, cmdName, args) => {
	await wait(500);
	console.log("Comando escrito: "+cadena+", cndname: "+cmdName);
};