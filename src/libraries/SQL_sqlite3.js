import Sqlite3 from "sqlite3"
import Sqlstring from "sqlstring"

export default class Sqlite {

	constructor(memoryPath=":memory:") {
		Object.defineProperty(this, "_idbd", { value: null, writable: true });
		Object.defineProperty(this, "_memoryPath", { value: memoryPath });
		Object.defineProperty(this, "_lastQuery", { value: "", writable: true });
		Object.defineProperty(this, "_connected", { value: false, writable: true });
	}

	async connect(defaultSql = []) {
		return new Promise((resolve, reject) => {
			if(this._idbd != null)
				return reject(new Error("Connector should be empty"));
			this._idbd = new Sqlite3.Database(this._memoryPath, async err => {
				if(err) return reject(err);
				this._connected = true;
				try {
					Object.defineProperty(this, "_version", { value: (await this.row("SELECT sqlite_version() as version;")).version });
					for (const sql of defaultSql)
						await this.execute(sql);
					await this.rows("SELECT * FROM sqlite_master;");
					resolve();
				} catch (error) { reject(error); }
			});
		})
	}

	isConnected() {
		return this._idbd != null && this._connected;
	}

	get idbd() { return this._idbd; }
	get lastQuery() { return this._lastQuery; }
	get version() { return this._version }

	async close() {
		if(this._connected) {
			return new Promise((resolve, reject) => this.idbd.close(function(err) {
				if(err) return reject(err);
				this._connected = false;
				resolve();
			}));
		}
	}

	async execute(command, ...params) {
		params = Array.isArray(params[0]) ? params[0] : params;
		return new Promise((resolve, reject) => {
			this._lastQuery = Sqlstring.format(command, params);
			this.idbd.run(command, params, function(err) {
				if(err) return reject(err);
				resolve(this);
			});
		});
	}

	async rows(command, ...params) {
		params = Array.isArray(params[0]) ? params[0] : params;
		return new Promise((resolve, reject) => {
			this._lastQuery = Sqlstring.format(command, params);
			this.idbd.all(command, params, function(err, result) {
				if(err) return reject(err);
				resolve(result);
			});
		});
	}

	async row(command, ...params) {
		params = Array.isArray(params[0]) ? params[0] : params;
		return new Promise((resolve, reject) => {
			this._lastQuery = Sqlstring.format(command, params);
			this.idbd.get(command, params, function(err, result) {
				if(err) return reject(err);
				resolve(result);
			});
		});
	}
}