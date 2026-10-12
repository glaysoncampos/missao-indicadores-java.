const QUESTIONS = [
  {
    eyebrow: "Decisão 1 · Antes dos dados",
    title: "A reclamação que chegou à direção",
    story: "O gestor diz: “As glosas por medicamentos estão aumentando.” Antes de alterar o trabalho da recepção, o que a equipe deve consultar?",
    signal: null,
    options: [
      "A última conta glosada por medicamento.",
      "As glosas por motivo nos últimos meses.",
      "Apenas o faturamento total do hospital.",
    ],
    correct: 1,
    explanation: "Uma conta chama atenção, mas o indicador por motivo mostra se existe um padrão. Ele ajuda a testar a hipótese antes de mudar a rotina.",
    takeaway: "Indicadores ajudam a confirmar ou corrigir uma impressão inicial.",
  },
  {
    eyebrow: "Decisão 2 · Ler a tendência",
    title: "O que o painel está mostrando?",
    story: "O painel fictício resume três meses de contas. Qual situação merece investigação primeiro?",
    signal: [
      { label: "Guias sem assinatura do paciente", value: "Em alta", tone: "up" },
      { label: "Pendências de autorização", value: "Estável", tone: "flat" },
      { label: "Glosas por medicamentos", value: "Em queda", tone: "down" },
    ],
    options: [
      "A cobertura de todos os medicamentos.",
      "Todas as autorizações, sem distinguir o motivo.",
      "As guias sem assinatura do paciente.",
    ],
    correct: 2,
    explanation: "A falta de assinatura é o sinal que cresce. O painel muda o foco da reclamação isolada para a pendência que se repete.",
    takeaway: "A tendência aponta onde investigar; ela ainda não explica a causa.",
  },
  {
    eyebrow: "Decisão 3 · Agir no processo",
    title: "Onde a pendência aparece?",
    story: "Ao examinar o indicador, a equipe percebe que a maioria das guias sem assinatura do paciente chega à etapa final da recepção. Qual ação inicial faz mais sentido?",
    signal: [
      { label: "Etapa com mais pendências", value: "Encerramento da guia", tone: "focus" },
      { label: "Documento", value: "Guia do paciente", tone: "flat" },
    ],
    options: [
      "Revisar essa etapa e conferir a assinatura antes de encaminhar a guia.",
      "Pedir ao faturamento que confira todas as guias depois.",
      "Fazer um treinamento geral sem examinar o fluxo.",
    ],
    correct: 0,
    explanation: "A decisão usa o indicador para localizar um ponto do processo. A conferência no momento certo permite corrigir a pendência antes que a conta siga adiante.",
    takeaway: "O indicador orienta uma ação específica e verificável.",
  },
  {
    eyebrow: "Decisão 4 · Conferir o efeito",
    title: "A rotina mudou. E agora?",
    story: "Depois da nova conferência, as guias sem assinatura diminuem, mas o total de glosas fica estável. Qual é a leitura mais cuidadosa?",
    signal: [
      { label: "Guias sem assinatura", value: "Diminuíram", tone: "down" },
      { label: "Glosas totais", value: "Estáveis", tone: "flat" },
    ],
    options: [
      "A mudança certamente não funcionou.",
      "A pendência na recepção melhorou; ainda é preciso acompanhar as glosas por motivo.",
      "Já não é necessário acompanhar indicadores.",
    ],
    correct: 1,
    explanation: "A recepção melhorou um ponto do processo. As glosas totais incluem outros motivos e podem refletir contas de atendimentos anteriores. É preciso olhar o motivo e o período.",
    takeaway: "Um indicador mostra avanço; outro ajuda a conferir o resultado final.",
  },
  {
    eyebrow: "Decisão 5 · Sustentar a melhora",
    title: "O que apresentar ao gestor?",
    story: "O gestor pergunta se vale manter a nova conferência da guia. Qual conjunto de informações ajuda mais a decidir?",
    signal: null,
    options: [
      "Apenas o total de atendimentos.",
      "Apenas o total de glosas.",
      "A evolução das guias sem assinatura e das glosas por esse motivo.",
    ],
    correct: 2,
    explanation: "Acompanhar a pendência na recepção e a glosa pelo mesmo motivo conecta a ação ao resultado. Os dois indicadores ajudam a decidir se a rotina deve continuar ou ser ajustada.",
    takeaway: "Medir, decidir e voltar a medir permite aprender com a ação.",
  },
];

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS rooms (
    code TEXT PRIMARY KEY,
    teacher_token TEXT NOT NULL,
    stage TEXT NOT NULL DEFAULT 'lobby',
    question_index INTEGER NOT NULL DEFAULT -1,
    created_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS teams (
    id TEXT PRIMARY KEY,
    room_code TEXT NOT NULL,
    name TEXT NOT NULL COLLATE NOCASE,
    token TEXT NOT NULL,
    joined_at INTEGER NOT NULL,
    UNIQUE(room_code, name)
  )`,
  `CREATE TABLE IF NOT EXISTS answers (
    room_code TEXT NOT NULL,
    team_id TEXT NOT NULL,
    question_index INTEGER NOT NULL,
    choice INTEGER NOT NULL,
    answered_at INTEGER NOT NULL,
    PRIMARY KEY(team_id, question_index)
  )`,
  "CREATE INDEX IF NOT EXISTS teams_by_room ON teams(room_code)",
  "CREATE INDEX IF NOT EXISTS answers_by_room_question ON answers(room_code, question_index)",
];

let schemaReady = false;
let schemaPromise = null;

async function ensureSchema(db) {
  if (schemaReady) return;
  if (!schemaPromise) {
    schemaPromise = (async () => {
      for (const statement of SCHEMA) await db.prepare(statement).run();
      schemaReady = true;
    })().catch((error) => {
      schemaPromise = null;
      throw error;
    });
  }
  await schemaPromise;
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
}

function fail(message, status = 400) {
  return json({ error: message }, status);
}

async function bodyJson(request) {
  const raw = await request.text();
  if (raw.length > 2500) throw new Error("Pedido muito grande.");
  try {
    const value = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error();
    return value;
  }
  catch { throw new Error("Dados inválidos."); }
}

function tokenFrom(request) {
  const header = request.headers.get("authorization") || "";
  return header.startsWith("Bearer ") ? header.slice(7) : "";
}

function randomHex(bytes = 24) {
  const data = new Uint8Array(bytes);
  crypto.getRandomValues(data);
  return [...data].map((value) => value.toString(16).padStart(2, "0")).join("");
}

function randomRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(7);
  crypto.getRandomValues(bytes);
  return [...bytes].map((value) => chars[value % chars.length]).join("");
}

function cleanCode(value) {
  return typeof value === "string" ? value.trim().toUpperCase() : "";
}

function cleanTeamName(value) {
  if (typeof value !== "string") return "";
  return value.trim().replace(/\s+/g, " ");
}

function publicQuestion(index, reveal) {
  const q = QUESTIONS[index];
  if (!q) return null;
  const result = {
    eyebrow: q.eyebrow,
    title: q.title,
    story: q.story,
    signal: q.signal,
    options: q.options,
  };
  if (reveal) {
    result.correct = q.correct;
    result.explanation = q.explanation;
    result.takeaway = q.takeaway;
  }
  return result;
}

async function roomByCode(db, code) {
  return db.prepare("SELECT code, teacher_token, stage, question_index, created_at FROM rooms WHERE code = ?")
    .bind(code).first();
}

async function actorFor(db, room, token) {
  if (!token) return null;
  if (token === room.teacher_token) return { role: "teacher" };
  const team = await db.prepare("SELECT id, name FROM teams WHERE room_code = ? AND token = ?")
    .bind(room.code, token).first();
  return team ? { role: "team", team } : null;
}

async function allRows(statement) {
  const result = await statement.all();
  return result.results || [];
}

async function buildState(db, room, actor) {
  const teams = await allRows(db.prepare("SELECT id, name, joined_at FROM teams WHERE room_code = ? ORDER BY joined_at, name").bind(room.code));
  const state = {
    code: room.code,
    stage: room.stage,
    questionIndex: room.question_index,
    questionCount: QUESTIONS.length,
    teamCount: teams.length,
    role: actor.role,
  };

  if (actor.role === "teacher") {
    state.teams = teams.map(({ name }) => name);
  } else {
    state.teamName = actor.team.name;
  }

  if (room.question_index >= 0 && room.question_index < QUESTIONS.length) {
    state.question = publicQuestion(room.question_index, room.stage === "revealed" || room.stage === "finished");
    const rows = await allRows(db.prepare("SELECT team_id, choice FROM answers WHERE room_code = ? AND question_index = ?")
      .bind(room.code, room.question_index));
    if (actor.role === "teacher") state.answeredCount = rows.length;
    if (actor.role === "teacher" || room.stage === "revealed" || room.stage === "finished") {
      state.distribution = [0, 1, 2].map((choice) => rows.filter((row) => row.choice === choice).length);
    }
    if (actor.role === "team") {
      state.myChoice = rows.find((row) => row.team_id === actor.team.id)?.choice ?? null;
    }
  }

  if (room.stage === "finished") {
    const rows = await allRows(db.prepare("SELECT team_id, question_index, choice FROM answers WHERE room_code = ?")
      .bind(room.code));
    const scoreByTeam = new Map(teams.map((team) => [team.id, 0]));
    for (const row of rows) {
      if (QUESTIONS[row.question_index]?.correct === row.choice) {
        scoreByTeam.set(row.team_id, (scoreByTeam.get(row.team_id) || 0) + 1);
      }
    }
    const ranking = teams.map((team) => ({ name: team.name, score: scoreByTeam.get(team.id) || 0 }))
      .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, "pt-BR"));
    let previous = -1;
    let rank = 0;
    state.ranking = ranking.map((entry, index) => {
      if (entry.score !== previous) rank = index + 1;
      previous = entry.score;
      return { ...entry, rank };
    });
  }

  return state;
}

async function createRoom(request, env) {
  if (!env.TEACHER_PIN) return fail("Senha do professor não configurada.", 503);
  const body = await bodyJson(request);
  if (typeof body.pin !== "string" || body.pin !== env.TEACHER_PIN) return fail("Senha do professor incorreta.", 401);
  for (let attempt = 0; attempt < 8; attempt++) {
    const code = randomRoomCode();
    const token = randomHex();
    try {
      await env.DB.prepare("INSERT INTO rooms (code, teacher_token, stage, question_index, created_at) VALUES (?, ?, 'lobby', -1, ?)")
        .bind(code, token, Date.now()).run();
      return json({ code, token }, 201);
    } catch (error) {
      if (!String(error).toLowerCase().includes("unique")) throw error;
    }
  }
  return fail("Não foi possível criar uma sala. Tente novamente.", 503);
}

async function joinRoom(request, db, room) {
  if (room.stage !== "lobby") return fail("Esta sala já começou.", 409);
  const body = await bodyJson(request);
  const name = cleanTeamName(body.name);
  if (name.length < 2 || name.length > 28 || !/^[\p{L}\p{N} ._-]+$/u.test(name)) {
    return fail("Use um nome de equipe com 2 a 28 caracteres.");
  }
  const token = randomHex();
  const id = randomHex(16);
  try {
    const result = await db.prepare(`INSERT INTO teams (id, room_code, name, token, joined_at)
      SELECT ?, ?, ?, ?, ?
      WHERE (SELECT stage FROM rooms WHERE code = ?) = 'lobby'
      AND (SELECT COUNT(*) FROM teams WHERE room_code = ?) < 15`)
      .bind(id, room.code, name, token, Date.now(), room.code, room.code).run();
    if (!result.meta?.changes) return fail("A sala está cheia ou já começou.", 409);
    return json({ code: room.code, token, name }, 201);
  } catch (error) {
    if (String(error).toLowerCase().includes("unique")) return fail("Esse nome de equipe já está em uso.", 409);
    throw error;
  }
}

async function answerQuestion(request, db, room, actor) {
  if (actor.role !== "team") return fail("Apenas equipes podem responder.", 403);
  if (room.stage !== "question") return fail("A votação desta pergunta está encerrada.", 409);
  const body = await bodyJson(request);
  if (!Number.isInteger(body.choice) || body.choice < 0 || body.choice > 2) return fail("Escolha uma das três alternativas.");
  const result = await db.prepare(`INSERT INTO answers (room_code, team_id, question_index, choice, answered_at)
    SELECT ?, ?, ?, ?, ?
    WHERE EXISTS (SELECT 1 FROM rooms WHERE code = ? AND stage = 'question' AND question_index = ?)
    ON CONFLICT(team_id, question_index) DO UPDATE SET choice = excluded.choice, answered_at = excluded.answered_at`)
    .bind(room.code, actor.team.id, room.question_index, body.choice, Date.now(), room.code, room.question_index).run();
  if (!result.meta?.changes) return fail("A votação foi encerrada. Atualize a tela.", 409);
  return json({ ok: true, choice: body.choice });
}

async function controlRoom(request, db, room, actor) {
  if (actor.role !== "teacher") return fail("Apenas o professor pode controlar a sala.", 403);
  const body = await bodyJson(request);
  const action = body.action;
  let target;
  if (action === "start" && room.stage === "lobby") {
    const count = await db.prepare("SELECT COUNT(*) AS total FROM teams WHERE room_code = ?").bind(room.code).first();
    if (!count?.total) return fail("Aguarde pelo menos uma equipe entrar.", 409);
    target = ["question", 0];
  } else if (action === "reveal" && room.stage === "question") {
    target = ["revealed", room.question_index];
  } else if (action === "next" && room.stage === "revealed" && room.question_index < QUESTIONS.length - 1) {
    target = ["question", room.question_index + 1];
  } else if (action === "finish" && room.stage === "revealed" && room.question_index === QUESTIONS.length - 1) {
    target = ["finished", room.question_index];
  } else {
    return fail("Essa ação não está disponível agora. Atualize a tela.", 409);
  }
  const result = await db.prepare("UPDATE rooms SET stage = ?, question_index = ? WHERE code = ? AND stage = ? AND question_index = ?")
    .bind(target[0], target[1], room.code, room.stage, room.question_index).run();
  if (!result.meta?.changes) return fail("A sala mudou. Atualize a tela.", 409);
  const updated = { ...room, stage: target[0], question_index: target[1] };
  return json(await buildState(db, updated, actor));
}

const STATIC_HEADERS = {
  "x-content-type-options": "nosniff",
  "referrer-policy": "no-referrer",
  "permissions-policy": "camera=(), microphone=(), geolocation=()",
  "cache-control": "no-store",
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/") {
      return new Response(PAGE, {
        headers: {
          ...STATIC_HEADERS,
          "content-type": "text/html; charset=utf-8",
          "content-security-policy": "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; form-action 'self'",
        },
      });
    }
    if (request.method === "GET" && url.pathname === "/app.css") {
      return new Response(CSS, { headers: { ...STATIC_HEADERS, "content-type": "text/css; charset=utf-8" } });
    }
    if (request.method === "GET" && url.pathname === "/app.js") {
      return new Response(CLIENT, { headers: { ...STATIC_HEADERS, "content-type": "text/javascript; charset=utf-8" } });
    }
    if (request.method === "GET" && url.pathname === "/api/health") {
      return json({ ok: true, database: Boolean(env.DB), configured: Boolean(env.TEACHER_PIN) });
    }
    if (!url.pathname.startsWith("/api/")) return new Response("Página não encontrada", { status: 404 });
    if (!env.DB) return fail("Banco de dados indisponível.", 503);

    try {
      await ensureSchema(env.DB);
      if (url.pathname === "/api/rooms" && request.method === "POST") return await createRoom(request, env);
      const match = /^\/api\/rooms\/([A-Z2-9]{7})\/(join|state|answer|control)$/.exec(url.pathname);
      if (!match) return fail("Rota não encontrada.", 404);
      const code = cleanCode(match[1]);
      const operation = match[2];
      const room = await roomByCode(env.DB, code);
      if (!room) return fail("Sala não encontrada. Confira o código.", 404);
      if (operation === "join" && request.method === "POST") return await joinRoom(request, env.DB, room);
      const actor = await actorFor(env.DB, room, tokenFrom(request));
      if (!actor) return fail("Acesso à sala não autorizado.", 401);
      if (operation === "state" && request.method === "GET") return json(await buildState(env.DB, room, actor));
      if (operation === "answer" && request.method === "POST") return await answerQuestion(request, env.DB, room, actor);
      if (operation === "control" && request.method === "POST") return await controlRoom(request, env.DB, room, actor);
      return fail("Método não permitido.", 405);
    } catch (error) {
      if (error instanceof SyntaxError || ["Pedido muito grande.", "Dados inválidos."].includes(error.message)) {
        return fail(error.message);
      }
      console.error("Game request failed", error);
      return fail("Não foi possível concluir esta ação. Tente novamente.", 500);
    }
  },
};
