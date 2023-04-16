import fs from 'fs'
import YAML from 'yaml'

console.log("Test");

const file = fs.readFileSync('./src/test/config.yml', 'utf8');
const comments = [...file.matchAll(/#.*/g)].map(m => m[0]);
const parsedFile = YAML.parse(file);

console.log(parsedFile);
console.log(comments);