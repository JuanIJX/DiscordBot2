/**
 * Last modified: 19/04/2023
 */

import url from "url"
import path from "path"
import { exec } from "child_process";



// Private functions

function getZero(n = 0) {
	let cad = '0';
	for (let i = 0; i < n; i++)
		cad += '0';
	return cad;
}



// PROTOTYPES

// Array
Array.prototype.filter2 = function(func) {
	for (let i = 0; i < this.length; i++) {
		if(func(this[i]) !== true) {
			this.splice(i, 1);
			i--;
		}
	}
	return this;
};
Array.prototype.deleteElement = function(element) {
	var pos = this.indexOf(element);
	if(pos !== -1)
		this.splice(pos, 1);
	return this;
}
Array.prototype.unique = function() {
	var a = this.concat();
	for(var i=0; i<a.length; ++i) {
		for(var j=i+1; j<a.length; ++j) {
			if(a[i] === a[j])
				a.splice(j--, 1);
		}
	}
	return a;
};
Array.prototype.concat2 = function(...arrays) {
	for (let index = 0; index < arrays.length; index++) {
		for (let i = 0; i < arrays[index].length; i++) {
			if(!this.includes(arrays[index][i]))
				this.push(arrays[index][i]);
		}
	}
}

// Object
Object.prototype.getKeyByValue = function(value) {
	return Object.keys(this).find(key => this[key] === value);
}
Object.prototype.clone = function() {
	return JSON.parse(JSON.stringify(this));
}
Object.prototype.assign = function(obj) {
	for (const key in obj) {
		if (!Object.hasOwnProperty.call(obj, key)) continue;
		if (Object.hasOwnProperty.call(this, key)) {
			const oldElement = this[key];
			if(Array.isArray(oldElement) && Array.isArray(obj[key]))
				this[key].concat2(obj[key]);
			else if(typeof(oldElement)=="object" && oldElement!=null && !Array.isArray(oldElement) && typeof(obj[key])=="object" && obj[key]!=null && !Array.isArray(obj[key]))
				this[key].assign(obj[key]);
		}
		else
			this[key] = obj[key]; // Copiar bien copiao, pero temporalmente lo hacemos asi y ale
	}
	return this;
}

// String
String.prototype.camelCase = function(sep="_", type=true) {
	const arry = this.toLowerCase().split(sep);
	if(type)
		return arry.shift() + arry.reduce((a, b) => a + b.charAt(0).toUpperCase() + b.slice(1), "");
	return arry.reduce((a, b) => a + b.charAt(0).toUpperCase() + b.slice(1), "");
}
String.prototype.rellenar = function(size, character=' ') {
	var t = true;
	var r = this;
	while(r.length < size) {
		r = t ? r + character : character + r;
		t = !t;
	}
	return r;
};
String.prototype.delExt = function() {
	const pos = this.lastIndexOf(".");
	if(pos!=-1)
		return this.substring(0, pos);
	return this;
};
String.prototype.getExt = function() {
	const pos = this.lastIndexOf(".");
	if(pos!=-1)
		return this.substring(pos+1);
	return this;
};
String.prototype.zeroPad = function(n = 2) { return (getZero(n)+this).slice(-1 * (n < this.length ? this.length : n)); };
String.prototype.suspensivos = function(max, chars="...") { return this.length > max ? this.substring(0, max)+chars : this; }

// Number
Number.prototype.zeroPad = function(n = 2) { return (this+"").zeroPad(n) };

// Date
Date.prototype.format= function(format="d/m/Y") {
	const mes = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
	const semana = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
	let cad = "", aux;
	for (let i = 0; i < format.length; i++) {
		// https://www.php.net/manual/es/function.date.php
		switch(format[i]) {
			// AÑO
			case "Y": // Una representación numérica completa de un año, 4 dígitos	Ejemplos: 1999 o 2003
				cad += this.getFullYear();
				break;
			case "y": // Una representación de dos dígitos de un año
				cad += this.getFullYear().zeroPad(2);
				break;

			// MES
			case "m": // Representación numérica de un mes, con ceros iniciales	01 hasta 12
				cad += (this.getMonth() + 1).zeroPad(2);
				break;
			case "n": // Representación numérica de un mes, sin ceros iniciales
				cad += this.getMonth() + 1;
				break;
			case "M": // Una representación textual corta de un mes, tres letras
				cad += mes[this.getMonth()].slice(0, 3);
				break;
			case "F": // Una representación textual completa de un mes, como Enero o Marzo
				cad += mes[this.getMonth()];
				break;

			// DIA
			case "j": // Día del mes sin ceros iniciales 1 a 31
				cad += this.getDate();
				break;
			case "d": // Día del mes, 2 dígitos con ceros iniciales	01 a 31
				cad += this.getDate().zeroPad(2);
				break;
			case "D": // Una representación textual de un día, tres letras	Lunes hasta Domingo
				cad += semana[this.getDay() - 1].slice(0, 3);
				break;

			// AM / PM
			case "a": // Ante meridiem y Post meridiem en minúsculas
				cad += this.getHours() >= 12 ? "pm" : "am";
				break;
			case "A": // Ante meridiem y Post meridiem en mayúsculas
				cad += this.getHours() >= 12 ? "PM" : "AM";
				break;

			// HORA
			case "g": // Formato de 12 horas de una hora sin ceros iniciales
				aux = this.getHours() % 12;
				cad += aux == 0 ? 12 : aux;
				break;
			case "G": // Formato de 24 horas de una hora sin ceros iniciales
				cad += this.getHours();
				break;
			case "h": // Formato de 12 horas de una hora con ceros iniciales
				aux = this.getHours() % 12;
				cad += (aux == 0 ? 12 : aux).zeroPad(2);
				break;
			case "H": // Formato de 24 horas de una hora con ceros iniciales
				cad += this.getHours().zeroPad(2);
				break;
			
			// MINUTO
			case "i": // Minutos con ceros iniciales
				cad += this.getMinutes().zeroPad(2);
				break;
			
			// SEGUNDO
			case "s": // Segundos con ceros iniciales
				cad += this.getSeconds().zeroPad(2);
				break;
			
			// MILISEGUNDO
			case "v": // Milisegundos
				cad += this.getMilliseconds();
				break;
			case "V": // Milisegundos con 3 ceros iniciales
				cad += this.getMilliseconds().zeroPad(3);
				break;
			
			// Caracteres
			default:
				cad += format[i];
				break;
		}
	}
	return cad;
};



// EXPORTABLE FUNCTIONS

export function getName(obj) { 
	var funcNameRegex = /function (.{1,})\(/;
	var results = (funcNameRegex).exec((obj).constructor.toString());
	return (results && results.length > 1) ? results[1] : "";
};

export function defObject(destino, fuente) {
	for (const [key, value] of Object.entries(fuente))
		if(destino[key]===undefined) {
			if(Array.isArray(value))
				destino[key] = [...value];
			else if(typeof(value) == "object")
				destino[key] = {...value};
			else
				destino[key] = value;
		}
	return destino;
};

export const getMethods = obj => {
	let properties = new Set()
	let currentObj = obj
	do {
		Object.getOwnPropertyNames(currentObj).map(item => properties.add(item))
	} while ((currentObj = Object.getPrototypeOf(currentObj)))
	return [...properties.keys()].filter(item => typeof obj[item] === 'function')
}

export const wait = (time=1) => new Promise(resolve => setTimeout(resolve, time));
export const thread = func => new Promise((async resolve => {
		await wait();
		resolve(await func());
}));

export function echo(cad) {
	if(cad)
		console.log(cad);
	else
		console.log();
}

export function getTimestamp() {
	return Math.floor(Func.getSysMs() / 1000);
}

export function getDate(...t) {
	return new Date(...t);
}

export function getRelative(metaurl, ...file) {
	return path.join(path.relative(process.cwd(), path.dirname(url.fileURLToPath(metaurl))), ...file);
}

export function makeid(length=5) {
	const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	var result = '';
	for (var i = 0; i < length; i++)
		result += characters.charAt(Math.floor(Math.random() * characters.length));
	return result;
}

export function getIp(req) {
	return req.ip.substring(req.ip.lastIndexOf(":")+1);
}

export function isInteger(num) {
	let newInt = parseInt(num);
	if(isNaN(newInt))
		return false;
	return newInt == num;
}

export function isFloat(num) {
	return !isNaN(parseFloat(num));
}

/**
 * Convierte un int en string hexadecimal
 * 
 * @param num: int comprendido en [0, 255]
 * @return: string con el dato en hexadecimal, ej: 0d
 */
export function decToHex(num) {
	var cad = parseInt(num).toString(16);
	return (cad.length === 1) ? `0${cad}` : `${cad}`;
}

export function base64_encode(data) {
	return Buffer.from(data).toString('base64');
}

export function base64_decode(data) {
	return Buffer.from(data, 'base64').toString('ascii');
}

/**
 * Ajuste decimal de un número.
 * 
 * @param {Number}  value El numero.
 * @param {Integer} exp   El exponente (el logaritmo 10 del ajuste base).
 * @param {String}  type  El tipo de ajuste (round, floor, ceil).
 * @returns {Number} El valor ajustado.
 */
export function decimalAdjust(value, exp=0, type="round") {
	if(!["round", "ceil", "floor"].includes(type))
		throw new Error("Invalid type");
	const mult = Math.pow(10, exp >=0 ? parseInt(exp) : 0);
	return Math[type](value * mult) / mult;
}

export function secondsToDhms(seconds) {
	seconds = Number(seconds);
	return {
		d: Math.floor(seconds / (3600*24)),
		h: Math.floor(seconds % (3600*24) / 3600),
		m: Math.floor(seconds % 3600 / 60),
		s: Math.floor(seconds % 60)
	};
}

export const ejc = cmd => {
	return new Promise((resolve, reject) => {
		exec(cmd, function(err, stdout, stderr) {
			err ? reject(err) : resolve({ stdout, stderr });
		})
	});
};

export function stringifyNoCircular(obj, space=null) {
	var cache = [];
	return JSON.stringify(obj, (_, value) => {
	if (typeof value === 'object' && value !== null) {
		if (cache.includes(value)) return;
		cache.push(value);
	}
	return value;
	}, space);
}