const root = document.querySelector("#app");
const KEYS = { mode: "java-game-mode", teacher: "java-game-teacher", team: "java-game-team" };
const app = {
  mode: localStorage.getItem(KEYS.mode) || "home",
  teacher: readStored(KEYS.teacher),
  team: readStored(KEYS.team),
  state: null,
  stateSignature: "",
  draftChoice: null,
  draftFor: -1,
  error: "",
  busy: false,
};

function readStored(key) {
  try { return JSON.parse(localStorage.getItem(key) || "null"); }
  catch { return null; }
}

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char]);
}

function letter(index) { return "ABC"[index] || ""; }
function activeSession() {
  if (app.mode === "teacher") return app.teacher;
  if (app.mode === "team") return app.team;
  return null;
}

const logo = `<span class="brand-mark" aria-hidden="true"><svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 24.5V20h5v4.5m1-8V14h5v10.5m1-14V8h5v16.5m1-20V4h5v20.5M4 27h23M6 12l7-4 5 2 8-7" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>`;

function shell(content, narrow = false) {
  return `<div class="site-shell">
    <header class="topbar"><div class="topbar-inner">
      <a href="/" class="brand" data-action="home" aria-label="Página inicial Missão Indicadores">${logo}<span class="brand-name">J.A.V.A.<small>TREINAMENTOS</small></span></a>
      <span class="topbar-note">Missão Indicadores · recepção hospitalar</span>
    </div></header>
    <main class="page ${narrow ? "narrow" : ""}">${app.error ? `<div class="error" role="alert">${esc(app.error)}</div>` : ""}${content}</main>
    <footer class="footer">J.A.V.A. Treinamentos · simulação com dados fictícios · nenhum dado de paciente é usado</footer>
  </div>`;
}

function landing() {
  return shell(`<section class="hero">
    <div class="hero-copy"><div class="eyebrow">Aprender a decidir com dados</div>
      <h1>Os sinais contam uma história.</h1>
      <p>Em equipe, investigue um problema real da rotina hospitalar, interprete indicadores e escolha o melhor próximo passo.</p>
    </div>
    <div class="hero-art" aria-hidden="true"><div class="signal-graphic"><div class="graphic-header"></div><div class="graphic-row"><span></span></div><div class="graphic-row"><span></span></div><div class="graphic-row"><span></span></div><div class="graphic-trend"><svg viewBox="0 0 200 75" preserveAspectRatio="none"><path d="M0 68 L43 54 L82 57 L122 28 L155 33 L200 2" fill="none" stroke="white" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg></div></div></div>
  </section>
  <div class="role-grid">
    <button class="role-card" data-action="open-team"><span class="role-arrow">↗</span><span class="role-icon" aria-hidden="true">◉</span><strong>Entrar como equipe</strong><p>O líder responde pelo celular com a ajuda dos colegas.</p></button>
    <button class="role-card" data-action="open-teacher"><span class="role-arrow">↗</span><span class="role-icon" aria-hidden="true">▤</span><strong>Conduzir como professor</strong><p>Abra a sala e libere as perguntas no ritmo da turma.</p></button>
  </div>
  <div class="meta-strip"><span>5 decisões</span><span>3 alternativas por pergunta</span><span>Até 15 equipes</span><span>Placar no final</span></div>`);
}

function teamEntry() {
  return shell(`<button class="back-link" data-action="home">← Voltar</button>
    <section class="panel"><div class="eyebrow brand-eyebrow">Para o líder da equipe</div>
      <h1 class="form-title">Entre na sala</h1>
      <p class="form-lead">Conversem antes de marcar. Uma resposta representa os cinco integrantes da equipe.</p>
      <form id="join-form">
        <label class="field" for="room-code">Código da sala</label>
        <input class="text-input code" id="room-code" name="code" maxlength="7" placeholder="EX.: ABC2345" autocomplete="off" required>
        <label class="field" for="team-name">Nome da equipe</label>
        <input class="text-input" id="team-name" name="name" minlength="2" maxlength="28" placeholder="Ex.: Equipe Horizonte" autocomplete="off" required>
        <div class="form-actions"><button class="primary-button full" type="submit" ${app.busy ? "disabled" : ""}>${app.busy ? "Entrando…" : "Entrar na missão"}</button></div>
      </form>
      <p class="helper">Peça ao professor o código. A sala aceita até 15 equipes.</p>
    </section>`, true);
}

function teacherEntry() {
  return shell(`<button class="back-link" data-action="home">← Voltar</button>
    <section class="panel"><div class="eyebrow brand-eyebrow">Painel do professor</div>
      <h1 class="form-title">Prepare a missão</h1>
      <p class="form-lead">Crie uma sala, mostre o código às equipes e conduza cada pergunta quando a discussão estiver pronta.</p>
      <form id="create-form">
        <label class="field" for="teacher-pin">Senha do professor</label>
        <input class="text-input" id="teacher-pin" name="pin" type="password" autocomplete="off" required>
        <div class="form-actions"><button class="primary-button full" type="submit" ${app.busy ? "disabled" : ""}>${app.busy ? "Criando…" : "Criar sala"}</button></div>
      </form>
      <p class="helper">A senha evita que visitantes criem salas para a sua turma.</p>
    </section>`, true);
}

function roomHeader(state, teacher) {
  const title = teacher ? "Painel do professor" : esc(state.teamName);
  const actions = teacher
    ? `<button class="tiny-button" data-action="fullscreen" type="button">Modo projetor</button><button class="tiny-button" data-action="copy-code" type="button">Copiar código</button><button class="tiny-button" data-action="leave" type="button">Sair</button>`
    : `<button class="tiny-button" data-action="leave" type="button">Sair</button>`;
  return `<div class="room-heading"><div><div class="question-count">Sala ${esc(state.code)}</div><h1>${title}</h1><p>${teacher ? "Você controla o ritmo das perguntas e revela as respostas." : "Converse com a equipe e marque uma alternativa por pergunta."}</p></div><div class="room-actions">${actions}</div></div>`;
}

function signalCards(signals) {
  if (!signals?.length) return "";
  return `<div class="signals" aria-label="Indicadores do cenário">${signals.map((signal) => `<div class="signal"><span class="signal-label">${esc(signal.label)}</span><span class="signal-value">${esc(signal.value)}</span></div>`).join("")}</div>`;
}

function progress(index) {
  return `<div class="progress-track" aria-label="Pergunta ${index + 1} de 5">${[0,1,2,3,4].map((part) => `<span class="${part <= index ? "done" : ""}"></span>`).join("")}</div>`;
}

function explanation(question) {
  return `<div class="explanation"><h3>Por que a melhor resposta é ${letter(question.correct)}?</h3><p>${esc(question.explanation)}</p><p class="takeaway">${esc(question.takeaway)}</p></div>`;
}

function teamQuestion(state) {
  const q = state.question;
  const revealed = state.stage === "revealed";
  const selected = app.draftChoice;
  const submitted = state.myChoice !== null;
  const options = q.options.map((option, index) => {
    let cls = "option";
    if (!revealed && selected === index) cls += " selected";
    if (revealed && index === q.correct) cls += " correct";
    if (revealed && state.myChoice === index && index !== q.correct) cls += " wrong";
    const tag = revealed && index === q.correct ? `<span class="option-meta">Melhor escolha</span>` : "";
    return `<button class="${cls}" type="button" ${revealed ? "disabled" : `data-action="choose" data-choice="${index}"`}><span class="option-letter">${letter(index)}</span><span class="option-text">${esc(option)}</span>${tag}</button>`;
  }).join("");
  const note = revealed
    ? `<span class="answer-note">Aguarde o professor liberar a próxima pergunta.</span>`
    : `<span class="answer-note">${submitted ? "Resposta registrada. Você pode mudar até o professor encerrar a votação." : "Escolha uma alternativa e confirme."}</span>`;
  const button = revealed ? "" : `<button class="primary-button" data-action="submit-answer" type="button" ${selected === null || app.busy ? "disabled" : ""}>${app.busy ? "Enviando…" : submitted ? "Atualizar resposta" : "Confirmar resposta"}</button>`;
  return `<section class="panel">${progress(state.questionIndex)}<div class="question-count">Pergunta ${state.questionIndex + 1} de ${state.questionCount}</div><h2 class="question-title">${esc(q.title)}</h2><p class="question-story">${esc(q.story)}</p>${signalCards(q.signal)}<div class="options" role="group" aria-label="Alternativas">${options}</div><div class="question-footer">${note}${button}</div>${revealed ? explanation(q) : ""}</section>`;
}

function teacherQuestion(state) {
  const q = state.question;
  const revealed = state.stage === "revealed";
  const options = q.options.map((option, index) => {
    const count = state.distribution?.[index] || 0;
    const cls = revealed && index === q.correct ? "option correct" : "option";
    return `<div class="${cls}"><span class="option-letter">${letter(index)}</span><div class="option-text">${esc(option)}<div class="option-bar"><progress max="${Math.max(1, state.teamCount)}" value="${count}"></progress></div></div><span class="option-meta">${count} ${count === 1 ? "equipe" : "equipes"}</span></div>`;
  }).join("");
  let button;
  if (!revealed) button = `<button class="primary-button" data-action="control" data-control="reveal" type="button" ${app.busy ? "disabled" : ""}>Revelar resposta</button>`;
  else if (state.questionIndex === state.questionCount - 1) button = `<button class="primary-button" data-action="control" data-control="finish" type="button" ${app.busy ? "disabled" : ""}>Encerrar e mostrar placar</button>`;
  else button = `<button class="primary-button" data-action="control" data-control="next" type="button" ${app.busy ? "disabled" : ""}>Liberar próxima pergunta</button>`;
  return `<section class="panel">${progress(state.questionIndex)}<div class="question-count">Pergunta ${state.questionIndex + 1} de ${state.questionCount}</div><h2 class="question-title">${esc(q.title)}</h2><p class="question-story">${esc(q.story)}</p>${signalCards(q.signal)}<div class="options">${options}</div><div class="question-footer"><span class="answer-note">${state.answeredCount} de ${state.teamCount} equipes responderam</span>${button}</div>${revealed ? explanation(q) : ""}</section>`;
}

function lobby(state, teacher) {
  if (teacher) {
    return `<div class="teacher-grid"><section class="panel"><div class="room-code-box"><div class="eyebrow">Código para as equipes</div><div class="room-code">${esc(state.code)}</div><p>O líder entra no próprio celular e informa o nome da equipe.</p></div><div class="statline"><span class="stat-dot"></span>${state.teamCount} de 15 equipes na sala</div><button class="primary-button" data-action="control" data-control="start" type="button" ${state.teamCount < 1 || app.busy ? "disabled" : ""}>Iniciar primeira pergunta</button></section><aside class="panel"><div class="question-count">Equipes conectadas</div><div class="team-list">${state.teams?.length ? state.teams.map((name) => `<span class="team-pill">${esc(name)}</span>`).join("") : `<span class="small-muted">Aguardando as equipes…</span>`}</div></aside></div>`;
  }
  return `<section class="panel"><div class="waiting-icon" aria-hidden="true">✓</div><h2 class="waiting-title">Equipe conectada!</h2><p class="waiting-copy">Aguarde o professor iniciar. Enquanto isso, combinem como vão ouvir as ideias dos cinco integrantes antes de marcar cada resposta.</p><div class="notice">Sua equipe está na sala <strong>${esc(state.code)}</strong>. O jogo começará no ritmo da discussão em aula.</div><div class="waiting-steps"><div class="waiting-step"><b>1</b>Ler o caso e os indicadores</div><div class="waiting-step"><b>2</b>Conversar em equipe</div><div class="waiting-step"><b>3</b>O líder confirma uma alternativa</div></div></section>`;
}

function scoreboard(state) {
  const rows = (state.ranking || []).map((entry) => `<tr class="${state.role === "team" && entry.name === state.teamName ? "my-team" : ""}"><td>${entry.rank}º</td><td>${esc(entry.name)}</td><td>${entry.score}/5</td></tr>`).join("");
  return `<section class="panel"><div class="question-count">Missão concluída</div><h2 class="question-title">Placar final</h2><p class="question-story">As equipes investigaram o mesmo problema e tomaram decisões usando os indicadores apresentados.</p><table class="scoreboard"><thead><tr><th>Posição</th><th>Equipe</th><th>Acertos</th></tr></thead><tbody>${rows}</tbody></table><div class="recap"><strong>Para conversar com a turma:</strong> O que teríamos decidido se tivéssemos ouvido só a reclamação inicial? Qual indicador mudou o rumo da investigação?</div></section>`;
}

function roomView() {
  const state = app.state;
  const teacher = state.role === "teacher";
  const content = roomHeader(state, teacher)
    + (state.stage === "lobby" ? lobby(state, teacher)
      : state.stage === "finished" ? scoreboard(state)
      : teacher ? teacherQuestion(state) : teamQuestion(state));
  return shell(content, !teacher);
}

function render() {
  if (activeSession() && app.state) root.innerHTML = roomView();
  else if (app.mode === "team") root.innerHTML = teamEntry();
  else if (app.mode === "teacher") root.innerHTML = teacherEntry();
  else root.innerHTML = landing();
}

async function api(path, options = {}, token = "") {
  const response = await fetch(path, {
    ...options,
    headers: {
      ...(options.body ? { "content-type": "application/json" } : {}),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    cache: "no-store",
  });
  const data = await response.json().catch(() => ({ error: "Resposta inválida do servidor." }));
  if (!response.ok) throw new Error(data.error || "Não foi possível concluir esta ação.");
  return data;
}

async function refresh(force = false) {
  const session = activeSession();
  if (!session) return;
  try {
    const state = await api(`/api/rooms/${encodeURIComponent(session.code)}/state`, {}, session.token);
    const signature = JSON.stringify(state);
    if (force || signature !== app.stateSignature) {
      if (state.questionIndex !== app.draftFor || state.stage !== app.state?.stage) {
        app.draftChoice = state.myChoice ?? null;
        app.draftFor = state.questionIndex;
      }
      app.state = state;
      app.stateSignature = signature;
      app.error = "";
      render();
    }
  } catch (error) {
    if (String(error.message).includes("não autorizado") || String(error.message).includes("não encontrada")) {
      localStorage.removeItem(app.mode === "teacher" ? KEYS.teacher : KEYS.team);
      if (app.mode === "teacher") app.teacher = null;
      else app.team = null;
      app.state = null;
    }
    app.error = error.message || "Falha de conexão. Tente novamente.";
    render();
  }
}

function switchMode(mode) {
  app.mode = mode;
  app.state = null;
  app.stateSignature = "";
  app.error = "";
  localStorage.setItem(KEYS.mode, mode);
  render();
  if (activeSession()) refresh(true);
}

async function perform(action) {
  if (app.busy) return;
  app.busy = true;
  app.error = "";
  render();
  try { await action(); }
  catch (error) { app.error = error.message || "Falha de conexão. Tente novamente."; }
  finally { app.busy = false; render(); }
}

root.addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.target;
  if (form.id === "join-form") {
    const code = form.elements.code.value.trim().toUpperCase();
    const name = form.elements.name.value.trim();
    if (!/^[A-Z2-9]{7}$/.test(code)) { app.error = "O código da sala tem sete caracteres."; render(); return; }
    perform(async () => {
      const data = await api(`/api/rooms/${encodeURIComponent(code)}/join`, { method: "POST", body: JSON.stringify({ name }) });
      app.team = { code: data.code, token: data.token, name: data.name };
      localStorage.setItem(KEYS.team, JSON.stringify(app.team));
      await refresh(true);
    });
  }
  if (form.id === "create-form") {
    const pin = form.elements.pin.value.trim();
    perform(async () => {
      const data = await api("/api/rooms", { method: "POST", body: JSON.stringify({ pin }) });
      app.teacher = { code: data.code, token: data.token };
      localStorage.setItem(KEYS.teacher, JSON.stringify(app.teacher));
      await refresh(true);
    });
  }
});

root.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const action = button.dataset.action;
  if (action === "home") { event.preventDefault(); switchMode("home"); return; }
  if (action === "open-team") { switchMode("team"); return; }
  if (action === "open-teacher") { switchMode("teacher"); return; }
  if (action === "leave") {
    const key = app.mode === "teacher" ? KEYS.teacher : KEYS.team;
    localStorage.removeItem(key);
    if (app.mode === "teacher") app.teacher = null; else app.team = null;
    app.state = null;
    app.stateSignature = "";
    switchMode("home");
    return;
  }
  if (action === "choose") {
    app.draftChoice = Number(button.dataset.choice);
    render();
    return;
  }
  if (action === "submit-answer") {
    if (app.draftChoice === null || !app.team) return;
    perform(async () => {
      await api(`/api/rooms/${app.team.code}/answer`, { method: "POST", body: JSON.stringify({ choice: app.draftChoice }) }, app.team.token);
      await refresh(true);
    });
    return;
  }
  if (action === "control") {
    if (!app.teacher) return;
    perform(async () => {
      await api(`/api/rooms/${app.teacher.code}/control`, { method: "POST", body: JSON.stringify({ action: button.dataset.control }) }, app.teacher.token);
      await refresh(true);
    });
    return;
  }
  if (action === "copy-code") {
    navigator.clipboard?.writeText(app.teacher?.code || "").catch(() => {});
    return;
  }
  if (action === "fullscreen") {
    if (document.fullscreenElement) document.exitFullscreen?.();
    else document.documentElement.requestFullscreen?.();
  }
});

render();
if (activeSession()) refresh(true);
setInterval(() => {
  if (activeSession() && !app.busy && !document.hidden) refresh();
}, 2500);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden && activeSession()) refresh(true);
});
