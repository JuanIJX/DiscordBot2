import path from "path"
import fs, { constants } from "fs"
import fsPromise from "fs/promises"
import crypto from "crypto"

export function crypt(cad) {
	return crypto.createHash('sha256').update(cad).digest('hex');
}

export function NewError(msg, code, errno) {
	const error = new Error(msg);
	error.code = code === undefined ? msg : code;
	error.errno = errno;
	return error;
}

export function NewErrorFormat(arry, ...words) {
	words.forEach(word => arry[0] = arry[0].replace(/%s/, word))
	return NewError(...arry);
}

export async function fileExistProm(file, flags = constants.F_OK) {
	try {
		await fsPromise.access(file, flags);
		return true;
	} catch (error) {}
	return false;
}

export function fileExist(file) {
	return fs.existsSync(path.normalize(file));
}

export function createDir(dir) {
	dir = path.normalize(dir);
	if(!fs.existsSync(dir))
		fs.mkdirSync(dir);
}

export function getEmbed(...emb) {
	return { embeds: emb };
}