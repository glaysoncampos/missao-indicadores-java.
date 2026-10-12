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

// Execute esta função uma vez no editor da planilha antes de publicar.
function prepararJogo() {
  const book = SpreadsheetApp.getActiveSpreadsheet();
  if (!book) throw new Error("Abra a planilha e execute esta função pelo menu Extensões > Apps Script.");
  PropertiesService.getScriptProperties().setProperty("SHEET_ID", book.getId());
  const config = ensureSheet_(book, "Configuracao", ["Campo", "Valor"]);
  ensureSheet_(book, "Salas", ["Codigo", "AcessoProfessor", "Etapa", "Pergunta", "CriadaEm"]);
  ensureSheet_(book, "Equipes", ["Id", "CodigoSala", "Nome", "AcessoEquipe", "EntradaEm"]);
  ensureSheet_(book, "Respostas", ["CodigoSala", "IdEquipe", "Pergunta", "Alternativa", "RespondidaEm"]);
  config.getRange(2, 1).setValue("Senha do professor");
  if (!config.getRange(2, 2).getValue()) config.getRange(2, 2).setValue(randomText_(10));
  SpreadsheetApp.flush();
  return "Pronto. A senha do professor está na aba Configuracao, célula B2.";
}

function doGet() {
  return HtmlService.createHtmlOutputFromFile("Index")
    .setTitle("Missão Indicadores · J.A.V.A. Treinamentos")
    .addMetaTag("viewport", "width=device-width, initial-scale=1");
}

function ensureSheet_(book, name, headers) {
  let sheet = book.getSheetByName(name);
  if (!sheet) sheet = book.insertSheet(name);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#7d0909").setFontColor("#ffffff");
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, headers.length);
  }
  return sheet;
}

function book_() {
  const id = PropertiesService.getScriptProperties().getProperty("SHEET_ID");
  if (!id) throw new Error("O jogo ainda não foi preparado. Execute prepararJogo na planilha.");
  return SpreadsheetApp.openById(id);
}

function sheet_(book, name) {
  const sheet = book.getSheetByName(name);
  if (!sheet) throw new Error("A aba " + name + " não foi encontrada. Execute prepararJogo novamente.");
  return sheet;
}

function rows_(sheet, columns) {
  const count = sheet.getLastRow() - 1;
  if (count < 1) return [];
  return sheet.getRange(2, 1, count, columns).getValues().map((values, index) => ({ row: index + 2, values }));
}

function room_(book, code) {
  return rows_(sheet_(book, "Salas"), 5).find((item) => item.values[0] === code) || null;
}

function teams_(book, code) {
  return rows_(sheet_(book, "Equipes"), 5).filter((item) => item.values[1] === code);
}

function answers_(book, code) {
  return rows_(sheet_(book, "Respostas"), 5).filter((item) => item.values[0] === code);
}

function randomText_(length) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  while (result.length < length) {
    const uuid = Utilities.getUuid().replace(/-/g, "");
    for (let index = 0; index < uuid.length && result.length < length; index += 2) {
      result += chars[parseInt(uuid.slice(index, index + 2), 16) % chars.length];
    }
  }
  return result;
}

function newToken_() {
  return Utilities.getUuid().replace(/-/g, "") + Utilities.getUuid().replace(/-/g, "");
}

function writeLock_(callback) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const result = callback();
    SpreadsheetApp.flush();
    return result;
  } finally {
    lock.releaseLock();
  }
}

function cleanCode_(value) {
  return typeof value === "string" ? value.trim().toUpperCase() : "";
}

function cleanName_(value) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

function actor_(book, room, token) {
  if (!token) throw new Error("Acesso à sala não autorizado.");
  if (token === room.values[1]) return { role: "teacher" };
  const team = teams_(book, room.values[0]).find((item) => item.values[3] === token);
  if (!team) throw new Error("Acesso à sala não autorizado.");
  return { role: "team", team };
}

function question_(index, reveal) {
  const item = QUESTIONS[index];
  if (!item) return null;
  const result = {
    eyebrow: item.eyebrow,
    title: item.title,
    story: item.story,
    signal: item.signal,
    options: item.options,
  };
  if (reveal) {
    result.correct = item.correct;
    result.explanation = item.explanation;
    result.takeaway = item.takeaway;
  }
  return result;
}

function state_(book, room, actor) {
  const code = room.values[0];
  const stage = room.values[2];
  const index = Number(room.values[3]);
  const teams = teams_(book, code);
  const answers = answers_(book, code);
  const state = {
    code,
    stage,
    questionIndex: index,
    questionCount: QUESTIONS.length,
    teamCount: teams.length,
    role: actor.role,
  };
  if (actor.role === "teacher") {
    state.teams = teams.map((item) => item.values[2]);
  } else {
    state.teamName = actor.team.values[2];
  }
  if (index >= 0 && index < QUESTIONS.length) {
    state.question = question_(index, stage === "revealed" || stage === "finished");
    const current = answers.filter((item) => Number(item.values[2]) === index);
    if (actor.role === "teacher") state.answeredCount = current.length;
    if (actor.role === "teacher" || stage === "revealed" || stage === "finished") {
      state.distribution = [0, 1, 2].map((choice) => current.filter((item) => Number(item.values[3]) === choice).length);
    }
    if (actor.role === "team") {
      const own = current.find((item) => item.values[1] === actor.team.values[0]);
      state.myChoice = own ? Number(own.values[3]) : null;
    }
  }
  if (stage === "finished") {
    const scoreByTeam = {};
    teams.forEach((team) => { scoreByTeam[team.values[0]] = 0; });
    answers.forEach((answer) => {
      const q = QUESTIONS[Number(answer.values[2])];
      if (q && q.correct === Number(answer.values[3])) scoreByTeam[answer.values[1]] += 1;
    });
    const ranking = teams.map((team) => ({ name: team.values[2], score: scoreByTeam[team.values[0]] || 0 }))
      .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, "pt-BR"));
    let previous = -1;
    let rank = 0;
    state.ranking = ranking.map((entry, position) => {
      if (entry.score !== previous) rank = position + 1;
      previous = entry.score;
      return { name: entry.name, score: entry.score, rank };
    });
  }
  return state;
}

function createRoom(pin) {
  return writeLock_(() => {
    const book = book_();
    const expected = String(sheet_(book, "Configuracao").getRange(2, 2).getValue()).trim();
    if (!expected || String(pin).trim() !== expected) throw new Error("Senha do professor incorreta.");
    let code;
    do { code = randomText_(7); } while (room_(book, code));
    const token = newToken_();
    sheet_(book, "Salas").appendRow([code, token, "lobby", -1, Date.now()]);
    return { code, token };
  });
}

function joinRoom(codeValue, nameValue) {
  return writeLock_(() => {
    const code = cleanCode_(codeValue);
    const name = cleanName_(nameValue);
    if (name.length < 2 || name.length > 28 || !/^[\p{L}\p{N} ._-]+$/u.test(name)) {
      throw new Error("Use um nome de equipe com 2 a 28 caracteres.");
    }
    const book = book_();
    const room = room_(book, code);
    if (!room) throw new Error("Sala não encontrada. Confira o código.");
    if (room.values[2] !== "lobby") throw new Error("Esta sala já começou.");
    const teams = teams_(book, code);
    if (teams.length >= 15) throw new Error("A sala já tem 15 equipes.");
    if (teams.some((item) => String(item.values[2]).toLocaleLowerCase("pt-BR") === name.toLocaleLowerCase("pt-BR"))) {
      throw new Error("Esse nome de equipe já está em uso.");
    }
    const id = newToken_();
    const token = newToken_();
    sheet_(book, "Equipes").appendRow([id, code, name, token, Date.now()]);
    return { code, token, name };
  });
}

function getState(codeValue, token) {
  const book = book_();
  const room = room_(book, cleanCode_(codeValue));
  if (!room) throw new Error("Sala não encontrada. Confira o código.");
  return state_(book, room, actor_(book, room, token));
}

function submitAnswer(codeValue, token, choice) {
  return writeLock_(() => {
    const book = book_();
    const room = room_(book, cleanCode_(codeValue));
    if (!room) throw new Error("Sala não encontrada. Confira o código.");
    const actor = actor_(book, room, token);
    if (actor.role !== "team") throw new Error("Apenas equipes podem responder.");
    if (room.values[2] !== "question") throw new Error("A votação desta pergunta está encerrada.");
    if (!Number.isInteger(choice) || choice < 0 || choice > 2) throw new Error("Escolha uma das três alternativas.");
    const index = Number(room.values[3]);
    const previous = answers_(book, room.values[0]).find((item) => item.values[1] === actor.team.values[0] && Number(item.values[2]) === index);
    const values = [room.values[0], actor.team.values[0], index, choice, Date.now()];
    const answersSheet = sheet_(book, "Respostas");
    if (previous) answersSheet.getRange(previous.row, 1, 1, 5).setValues([values]);
    else answersSheet.appendRow(values);
    return { ok: true, choice };
  });
}

function controlRoom(codeValue, token, action) {
  return writeLock_(() => {
    const book = book_();
    const room = room_(book, cleanCode_(codeValue));
    if (!room) throw new Error("Sala não encontrada. Confira o código.");
    const actor = actor_(book, room, token);
    if (actor.role !== "teacher") throw new Error("Apenas o professor pode controlar a sala.");
    const stage = room.values[2];
    const index = Number(room.values[3]);
    let nextStage;
    let nextIndex = index;
    if (action === "start" && stage === "lobby") {
      if (!teams_(book, room.values[0]).length) throw new Error("Aguarde pelo menos uma equipe entrar.");
      nextStage = "question";
      nextIndex = 0;
    } else if (action === "reveal" && stage === "question") {
      nextStage = "revealed";
    } else if (action === "next" && stage === "revealed" && index < QUESTIONS.length - 1) {
      nextStage = "question";
      nextIndex = index + 1;
    } else if (action === "finish" && stage === "revealed" && index === QUESTIONS.length - 1) {
      nextStage = "finished";
    } else {
      throw new Error("Essa ação não está disponível agora. Atualize a tela.");
    }
    sheet_(book, "Salas").getRange(room.row, 3, 1, 2).setValues([[nextStage, nextIndex]]);
    SpreadsheetApp.flush();
    room.values[2] = nextStage;
    room.values[3] = nextIndex;
    return state_(book, room, actor);
  });
}


