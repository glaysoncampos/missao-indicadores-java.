import { DatabaseSync } from "node:sqlite";

export class LocalD1 {
  constructor(filename = ":memory:") {
    this.db = new DatabaseSync(filename);
  }
  prepare(sql) {
    const database = this.db;
    let values = [];
    return {
      bind(...args) { values = args; return this; },
      async first() { return database.prepare(sql).get(...values) ?? null; },
      async all() { return { results: database.prepare(sql).all(...values) }; },
      async run() {
        const result = database.prepare(sql).run(...values);
        return { meta: { changes: Number(result.changes) } };
      },
    };
  }
  close() { this.db.close(); }
}
