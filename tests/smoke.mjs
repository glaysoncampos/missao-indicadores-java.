import assert from "node:assert/strict";
import worker from "../dist/server/index.js";
import { LocalD1 } from "./d1-adapter.mjs";

const db = new LocalD1();
const env = { DB: db, TEACHER_PIN: "LOCAL-TEST-PIN" };

async function call(path, { method = "GET", token = "", body } = {}) {
  const response = await worker.fetch(new Request(`http://localhost${path}`, {
    method,
    headers: {
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(body === undefined ? {} : { "content-type": "application/json" }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  }), env);
  const data = await response.json();
  return { status: response.status, data };
}

assert.deepEqual((await call("/api/health")).data, { ok: true, database: true, configured: true });
assert.equal((await call("/api/rooms", { method: "POST", body: { pin: "wrong" } })).status, 401);
assert.equal((await call("/api/rooms", { method: "POST", body: null })).status, 400);

const created = await call("/api/rooms", { method: "POST", body: { pin: env.TEACHER_PIN } });
assert.equal(created.status, 201);
const { code, token: teacherToken } = created.data;
assert.match(code, /^[A-Z2-9]{7}$/);

const teams = [];
for (let index = 1; index <= 15; index++) {
  const joined = await call(`/api/rooms/${code}/join`, { method: "POST", body: { name: `Equipe ${index}` } });
  assert.equal(joined.status, 201);
  teams.push(joined.data);
}
assert.equal((await call(`/api/rooms/${code}/join`, { method: "POST", body: { name: "Equipe extra" } })).status, 409);
assert.equal((await call(`/api/rooms/${code}/join`, { method: "POST", body: { name: "equipe 1" } })).status, 409);
assert.equal((await call(`/api/rooms/${code}/state`, { token: "invalid" })).status, 401);

let teacher = (await call(`/api/rooms/${code}/state`, { token: teacherToken })).data;
assert.equal(teacher.teamCount, 15);
assert.equal(teacher.stage, "lobby");
assert.equal((await call(`/api/rooms/${code}/control`, { method: "POST", token: teams[0].token, body: { action: "start" } })).status, 403);

const correct = [1, 2, 0, 1, 2];
for (let question = 0; question < 5; question++) {
  const action = question === 0 ? "start" : "next";
  const advanced = await call(`/api/rooms/${code}/control`, { method: "POST", token: teacherToken, body: { action } });
  assert.equal(advanced.status, 200);
  assert.equal(advanced.data.stage, "question");
  assert.equal(advanced.data.questionIndex, question);
  const teamState = (await call(`/api/rooms/${code}/state`, { token: teams[0].token })).data;
  assert.equal(teamState.question.correct, undefined);
  assert.equal(teamState.question.options.length, 3);
  assert.equal((await call(`/api/rooms/${code}/join`, { method: "POST", body: { name: "Late team" } })).status, 409);

  const one = await call(`/api/rooms/${code}/answer`, { method: "POST", token: teams[0].token, body: { choice: correct[question] } });
  assert.equal(one.status, 200);
  const two = await call(`/api/rooms/${code}/answer`, { method: "POST", token: teams[1].token, body: { choice: (correct[question] + 1) % 3 } });
  assert.equal(two.status, 200);
  const three = await call(`/api/rooms/${code}/answer`, { method: "POST", token: teams[2].token, body: { choice: correct[question] } });
  assert.equal(three.status, 200);
  if (question === 0) {
    const changed = await call(`/api/rooms/${code}/answer`, { method: "POST", token: teams[0].token, body: { choice: correct[question] } });
    assert.equal(changed.status, 200);
  }
  teacher = (await call(`/api/rooms/${code}/state`, { token: teacherToken })).data;
  assert.equal(teacher.answeredCount, 3);
  assert.equal(teacher.distribution.reduce((sum, value) => sum + value, 0), 3);
  const revealed = await call(`/api/rooms/${code}/control`, { method: "POST", token: teacherToken, body: { action: "reveal" } });
  assert.equal(revealed.status, 200);
  assert.equal(revealed.data.question.correct, correct[question]);
  assert.equal((await call(`/api/rooms/${code}/answer`, { method: "POST", token: teams[1].token, body: { choice: correct[question] } })).status, 409);
  const after = (await call(`/api/rooms/${code}/state`, { token: teams[0].token })).data;
  assert.equal(after.question.correct, correct[question]);
}

const finished = await call(`/api/rooms/${code}/control`, { method: "POST", token: teacherToken, body: { action: "finish" } });
assert.equal(finished.status, 200);
assert.equal(finished.data.stage, "finished");
assert.deepEqual(finished.data.ranking.slice(0, 2).map(({ name, score, rank }) => ({ name, score, rank })), [
  { name: "Equipe 1", score: 5, rank: 1 },
  { name: "Equipe 3", score: 5, rank: 1 },
]);
assert.deepEqual(finished.data.ranking.find(({ name }) => name === "Equipe 2"), { name: "Equipe 2", score: 0, rank: 3 });
assert.equal((await call(`/api/rooms/${code}/state`, { token: teams[2].token })).data.ranking.length, 15);

const second = await call("/api/rooms", { method: "POST", body: { pin: env.TEACHER_PIN } });
assert.equal(second.status, 201);
assert.notEqual(second.data.code, code);
assert.equal((await call(`/api/rooms/${second.data.code}/state`, { token: teacherToken })).status, 401);

db.close();
console.log("Smoke test passed: 15 teams, five questions, private votes, teacher pacing, answer changes, tied scoreboard, room isolation.");
