'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Tasks = require('../js/tasks.js');
const Storage = require('../js/storage.js');
const Workspace = require('../js/workspace.js');
let passed = 0;
let failed = 0;
function test(id, requirement, scenario, run) {
  try { run(); passed++; process.stdout.write(`APROVADO ${id} | ${requirement} | ${scenario}\n`); }
  catch (error) { failed++; process.stdout.write(`REPROVADO ${id} | ${requirement} | ${scenario}\n  ${error.stack || error}\n`); }
}
const fixedNow = new Date('2026-10-17T12:00:00.000Z');
function input(overrides = {}) { return { title: 'Revisar relatório', description: '', assignee: 'Ana Souza', dueDate: '2026-10-20', dueTime: '23:59', status: 'A fazer', ...overrides }; }
function task(overrides = {}) { return { id: 'id-1', title: 'Revisar relatório', description: '', assignee: '', dueDate: '2026-10-20', dueTime: '23:59', status: 'A fazer', createdAt: fixedNow.toISOString(), ...overrides }; }

test('TF01','RF01 / HU01','cria tarefa válida com responsável e status informados',() => {
  const result = Tasks.create(input(), fixedNow);
  assert.equal(result.title, 'Revisar relatório'); assert.equal(result.status, 'A fazer'); assert.equal(result.description, ''); assert.equal(result.assignee, 'Ana Souza'); assert.ok(result.id); assert.equal(result.dueDate, '2026-10-20'); assert.equal(result.dueTime, '23:59');
});
test('TF02','RF01 / HU01','rejeita responsável, título, prazo, status ausentes e data inválida ou passada',() => {
  assert.ok(Tasks.validate(input({ title: '  ' }), '2026-10-17', '12:00').title); assert.ok(Tasks.validate(input({ assignee: '' }), '2026-10-17', '12:00').assignee); assert.ok(Tasks.validate(input({ dueDate: '' }), '2026-10-17', '12:00').dueDate); assert.ok(Tasks.validate(input({ dueTime: '' }), '2026-10-17', '12:00').dueTime); assert.ok(Tasks.validate(input({ dueTime: '25:00' }), '2026-10-17', '12:00').dueTime); assert.ok(Tasks.validate(input({ dueDate: '2026-10-17', dueTime: '11:59' }), '2026-10-17', '12:00').dueTime); assert.ok(Tasks.validate(input({ status: '' }), '2026-10-17', '12:00').status); assert.ok(Tasks.validate(input({ dueDate: 'amanhã' }), '2026-10-17', '12:00').dueDate); assert.ok(Tasks.validate(input({ dueDate: '2026-02-31' }), '2026-10-17', '12:00').dueDate); assert.ok(Tasks.validate(input({ dueDate: '2026-10-16' }), '2026-10-17', '12:00').dueDate); assert.throws(() => Tasks.create(input({ title: '' }), fixedNow), /Verifique/);
});
test('TF03','RF01 / HU04','edita a tarefa correta, sem duplicar, e valida obrigatórios',() => {
  const result = Tasks.update([task(), task({ id: 'id-2', title: 'Outra' })], 'id-1', input({ title: 'Atualizada', status: 'Em andamento' }), '2026-10-17');
  assert.equal(result.length, 2); assert.equal(result[0].id, 'id-1'); assert.equal(result[0].title, 'Atualizada'); assert.equal(result[0].status, 'Em andamento'); assert.equal(result[1].title, 'Outra'); assert.throws(() => Tasks.update([task()], 'id-1', input({ title: '' }), '2026-10-17'), /Verifique/); assert.throws(() => Tasks.update([], 'missing', input(), '2026-10-17'), /não foi encontrada/);
});
test('TF11','RF01 / HU04','permite alterar o prazo de uma tarefa concluída',() => {
  const result = Tasks.update([task({ status: 'Concluída' })], 'id-1', input({ status: 'Concluída', dueDate: '2026-10-21' }), '2026-10-17');
  assert.equal(result[0].status, 'Concluída'); assert.equal(result[0].dueDate, '2026-10-21');
});
test('TF12','RNF03 / regra de prazo','calendário marca dias anteriores como indisponíveis e mantém hoje/futuro selecionáveis',() => {
  const month = Tasks.calendarDays(2026, 9, '2026-10-17');
  assert.equal(month.days.find(day => day.iso === '2026-10-16').past, true);
  assert.equal(month.days.find(day => day.iso === '2026-10-17').today, true);
  assert.equal(month.days.find(day => day.iso === '2026-10-17').past, false);
  assert.equal(month.days.find(day => day.iso === '2026-10-18').past, false);
  assert.equal(month.offset, 3);
});
test('TF19','RF01 / prazo com hora','persiste somente hora/minuto e bloqueia horário passado no dia atual',() => {
  assert.equal(Tasks.isValidTime('09:05'), true); assert.equal(Tasks.isValidTime('9:05'), false); assert.equal(Tasks.isValidTime('09:05:00'), false);
  assert.equal(Tasks.isOverdue(task({ dueDate: '2026-10-17', dueTime: '11:59' }), '2026-10-17', '12:00'), true);
  assert.equal(Tasks.isOverdue(task({ dueDate: '2026-10-17', dueTime: '12:00' }), '2026-10-17', '12:00'), false);
  const created = Tasks.create(input({ dueDate: '2026-10-17', dueTime: '12:01' }), fixedNow); assert.equal(created.dueTime, '12:01');
});
test('TF20','RNF01 / compatibilidade','carrega tarefas antigas sem dueTime usando o prazo legado 23:59',() => {
  const legacy = task({ dueTime: undefined }); delete legacy.dueTime;
  assert.equal(Tasks.isValidTask(legacy), true); assert.equal(Tasks.dueTime(legacy), '23:59');
});
test('TF21','HU08 / privacidade local','filtra relatório para um ou mais responsáveis sem incluir os demais',() => {
  const tasks = [task({ assignee: 'Ana' }), task({ id: '2', assignee: 'Bia' }), task({ id: '3', assignee: 'Caio' })];
  assert.deepEqual(Tasks.filterByAssignees(tasks, ['Ana', 'Caio']).map(item => item.assignee), ['Ana', 'Caio']);
  assert.deepEqual(Tasks.filterByAssignees(tasks, ['Bia']).map(item => item.assignee), ['Bia']);
  assert.equal(Tasks.filterByAssignees(tasks, []).length, 3);
});
test('TF22','Notificações / prazos','considera apenas tarefas não concluídas no intervalo das próximas 24 horas',() => {
  const now = new Date(2026, 9, 17, 12, 0, 0);
  assert.equal(Tasks.dueWithinHours(task({ dueDate: '2026-10-17', dueTime: '12:30' }), 24, now), true);
  assert.equal(Tasks.dueWithinHours(task({ dueDate: '2026-10-17', dueTime: '11:59' }), 24, now), false);
  assert.equal(Tasks.dueWithinHours(task({ dueDate: '2026-10-17', dueTime: '12:30', status: 'Concluída' }), 24, now), false);
  assert.equal(Tasks.dueWithinHours(task({ dueDate: '2026-10-18', dueTime: '12:01' }), 24, now), false);
});
test('TF16','Visão Projeto / conteúdo','mantém as cinco etapas do Kanban, escopo do MVP e três histórias no HTML',() => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  for (const expected of ['id="view-projeto"', 'Backlog', 'A Fazer', 'Em Desenvolvimento', 'Em Revisão', 'Concluído', 'US01', 'US02', 'US03', 'MVP sem backend', 'localStorage']) assert.ok(html.includes(expected), `Conteúdo ausente: ${expected}`);
});
test('TF23','Navegação / relatórios','mostra Notificações, remove Projeto da navegação e oferece seleção de responsáveis para o relatório',() => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.ok(html.includes('data-view="notificacoes"')); assert.ok(!html.includes('data-view="projeto"'));
  assert.ok(html.includes('id="report-assignee-options"')); assert.ok(html.includes('id="task-due-time"'));
  const css = fs.readFileSync(path.join(__dirname, '..', 'style.css'), 'utf8'); assert.ok(!css.includes('.calendar-day-past::after'));
});
test('TF24','Interface / formulário e status','organiza descrição e prazo em duas colunas, une data/hora e aplica cores por status',() => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.ok(html.includes('class="task-details-grid"')); assert.ok(html.includes('class="deadline-input-wrap"'));
  assert.ok(html.includes('Prazo e horário')); assert.ok(html.includes('id="task-description"'));
  const css = fs.readFileSync(path.join(__dirname, '..', 'style.css'), 'utf8');
  for (const status of ['A fazer', 'Em andamento', 'Concluída']) assert.ok(css.includes(`data-status="${status}"`), `Estilo ausente para ${status}`);
  assert.ok(css.includes('linear-gradient(90deg,#111c31,#2563eb)')); assert.ok(css.includes('.deadline-input-wrap'));
});
test('TF25','Interface / calendário, horário e responsáveis','abre data e horário por ícones dedicados e apresenta contagens por status para cada responsável',() => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.ok(html.includes('id="open-date-picker"')); assert.ok(html.includes('id="open-time-picker"'));
  assert.match(html, /id="task-due-date"[^>]*required/); assert.match(html, /id="task-due-time"[^>]*required/);
  const app = fs.readFileSync(path.join(__dirname, '..', 'js', 'app.js'), 'utf8');
  for (const status of ['A fazer', 'Em andamento', 'Concluída']) assert.ok(app.includes(`['${status}'`), `Contagem ausente para ${status}`);
  assert.ok(app.includes('input.showPicker()')); assert.ok(app.includes('openDatePicker()'));
});
test('TF26','Interface / consistência e movimento','mantém a sequência dos cinco indicadores nas três telas e anima abas/cliques',() => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  for (const view of ['Painel de gestão e produtividade','Gerenciamento de tarefas','Relatórios de tarefas']) {
    const heading = html.indexOf(`<h1>${view}</h1>`); assert.notEqual(heading, -1);
    const start = html.indexOf('class="metrics kpi-metrics', heading); assert.notEqual(start, -1, `${view}: cards ausentes`);
    const endMarker = view === 'Painel de gestão e produtividade' ? 'class="dashboard-grid"' : view === 'Gerenciamento de tarefas' ? 'class="panel task-panel"' : 'class="panel report-panel"';
    const end = html.indexOf(endMarker, start); const snippet = html.slice(start, end);
    const positions = ['overdue-card', 'metric-upcoming', 'metric-todo', 'metric-in-progress', 'metric-done'].map(token => snippet.indexOf(token));
    assert.ok(positions.every((position, index) => position >= 0 && (index === 0 || position > positions[index - 1])), `${view}: ordem/classes inconsistentes`);
  }
  const css = fs.readFileSync(path.join(__dirname, '..', 'style.css'), 'utf8');
  assert.ok(css.includes('@keyframes view-enter')); assert.ok(css.includes('@keyframes button-feedback')); assert.ok(css.includes('button-feedback 1s'));
  const app = fs.readFileSync(path.join(__dirname, '..', 'js', 'app.js'), 'utf8'); assert.ok(app.includes("classList.add('view-entering')")); assert.ok(app.includes("classList.add('click-feedback')"));
});
test('TF35','Navegação / ordem lateral','mostra Tarefas antes do Painel e mantém a primeira tela como Tarefas',() => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.ok(html.indexOf('data-view="tarefas"') < html.indexOf('data-view="dashboard"'));
  const app = fs.readFileSync(path.join(__dirname, '..', 'js', 'app.js'), 'utf8'); assert.ok(app.includes("switchView('tarefas'); render(); refreshTaskRelations();"));
});
test('TF36','Interface / setas e controles','destaca setas de selects e navegação de calendário ao passar o mouse e ao focar',() => {
  const css = fs.readFileSync(path.join(__dirname, '..', 'style.css'), 'utf8');
  assert.ok(css.includes('select:not([multiple]){appearance:none'));
  assert.ok(css.includes('select:not([multiple]):hover:not(:disabled)'));
  assert.ok(css.includes('select:not([multiple]):focus-visible'));
  assert.ok(css.includes('.calendar-head button:hover:not(:disabled){background:#2563eb;color:#fff'));
});
test('TF27','Painel / layout e escopo','evita esticar o gráfico pela lista de responsáveis e remove a tabela de tarefas do Painel',() => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const start = html.indexOf('<section id="view-dashboard"'); const end = html.indexOf('<section id="view-tarefas"', start);
  const dashboard = html.slice(start, end); assert.ok(!dashboard.includes('class="panel task-panel"')); assert.ok(!dashboard.includes('id="task-list"'));
  assert.ok(html.includes('id="task-list-secondary"'));
  const app = fs.readFileSync(path.join(__dirname, '..', 'js', 'app.js'), 'utf8');
  assert.ok(app.includes("renderList('task-list-secondary'")); assert.ok(!app.includes("renderList('task-list',"));
  const css = fs.readFileSync(path.join(__dirname, '..', 'style.css'), 'utf8'); assert.ok(css.includes('.dashboard-grid{align-items:start}'));
});
test('TF28','Cadastros / usuários, equipes e projetos','cadastra pessoas sem login, associa a equipe e impede e-mail duplicado',() => {
  let state = Workspace.empty();
  state = Workspace.upsert(state, 'users', { name: 'Ana Souza', email: 'ana@example.com', role: 'member' });
  const ana = state.users[0];
  assert.equal(ana.name, 'Ana Souza'); assert.equal(ana.role, 'member');
  assert.throws(() => Workspace.upsert(state, 'users', { name: 'Ana duplicada', email: 'ANA@example.com' }), /Já existe/);
  state = Workspace.upsert(state, 'teams', { name: 'Design', memberIds: [ana.id] });
  assert.ok(state.users[0].teamIds.includes(state.teams[0].id));
  state = Workspace.upsert(state, 'projects', { name: 'Site TaskFlow', description: 'Redesign', teamId: state.teams[0].id, dueDate: '2026-11-01' }, '', '2026-10-24');
  assert.equal(state.projects[0].teamId, state.teams[0].id);
  assert.throws(() => Workspace.upsert(state, 'projects', { name: 'Projeto inválido', dueDate: '2026-02-31' }), /prazo válido/);
});
test('TF29','Cadastros / integridade de relações','remove equipe sem deixar referências inválidas nos usuários e projetos',() => {
  let state = Workspace.empty();
  state = Workspace.upsert(state, 'users', { name: 'Bruno', email: 'bruno@example.com' });
  state = Workspace.upsert(state, 'teams', { name: 'Engenharia', memberIds: [state.users[0].id] });
  state = Workspace.upsert(state, 'projects', { name: 'Aplicativo', teamId: state.teams[0].id });
  state = Workspace.remove(state, 'teams', state.teams[0].id);
  assert.equal(state.teams.length, 0); assert.deepEqual(state.users[0].teamIds, []); assert.equal(state.projects[0].teamId, '');
});
test('TF30','Tarefas / projeto e equipe associados','persiste as relações opcionais sem afetar tarefas antigas nem busca existente',() => {
  const created = Tasks.create(input({ projectId: 'p-1', teamId: 't-1' }), fixedNow);
  assert.equal(created.projectId, 'p-1'); assert.equal(created.teamId, 't-1');
  assert.equal(Tasks.isValidTask(task()), true);
  assert.equal(Tasks.filter([task({ projectId: 'p-1' })], 'site', '', '', item => item.projectId === 'p-1' ? ['Site TaskFlow'] : []).length, 1);
  const changed = Tasks.update([created], created.id, input({ projectId: '', teamId: 't-2' }), '2026-10-17');
  assert.equal(changed[0].projectId, undefined); assert.equal(changed[0].teamId, 't-2');
});
test('TF31','Cadastros / navegação e privacidade','adiciona a área Cadastros sem introduzir tela de autenticação ou recursos externos',() => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.ok(html.includes('data-view="cadastros"')); assert.ok(html.includes('id="view-cadastros"'));
  assert.ok(html.includes('não criam login ou senha'));
  assert.ok(html.includes('js/workspace.js')); assert.ok(!/<script[^>]+src="https?:\/\//i.test(html));
  const app = fs.readFileSync(path.join(__dirname, '..', 'js', 'app.js'), 'utf8');
  assert.ok(app.includes('name="email"')); assert.ok(app.includes('name="memberIds"')); assert.ok(app.includes('name="teamId"'));
});
test('TF32','Interface / descrição, status e ícone de notificação','limita a altura da descrição, esconde o placeholder do menu e substitui o emoji por SVG linear',() => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.match(html, /<option value="" selected disabled hidden>Selecione um status<\/option>/);
  assert.ok(html.includes('<svg class="line-icon"'));
  assert.ok(!html.includes('🔔'));
  const css = fs.readFileSync(path.join(__dirname, '..', 'style.css'), 'utf8');
  assert.ok(css.includes('.description-field textarea{height:156px;min-height:156px}'));
  assert.ok(css.includes('.description-field textarea{height:104px;min-height:104px}'));
});
test('TF33','Projetos / validação e aparência do calendário','impede selecionar ou salvar prazo anterior a hoje e distingue datas futuras sem alterar o visual das passadas',() => {
  const state = Workspace.empty();
  assert.throws(() => Workspace.upsert(state, 'projects', { name: 'Prazo passado', dueDate: '2026-10-23' }, '', '2026-10-24'), /hoje ou uma data futura/);
  const todayProject = Workspace.upsert(state, 'projects', { name: 'Prazo hoje', dueDate: '2026-10-24' }, '', '2026-10-24');
  const futureProject = Workspace.upsert(state, 'projects', { name: 'Prazo futuro', dueDate: '2026-10-25' }, '', '2026-10-24');
  assert.equal(todayProject.projects[0].dueDate, '2026-10-24'); assert.equal(futureProject.projects[0].dueDate, '2026-10-25');
  const app = fs.readFileSync(path.join(__dirname, '..', 'js', 'app.js'), 'utf8');
  assert.ok(app.includes('id="project-calendar-picker"')); assert.ok(app.includes('id="project-calendar-days"'));
  assert.ok(app.includes("past ? 'calendar-day-past' : 'calendar-day-available'")); assert.ok(app.includes('button.disabled = past'));
  const css = fs.readFileSync(path.join(__dirname, '..', 'style.css'), 'utf8');
  assert.ok(css.includes('.calendar-day-past{background:#f2f1f1;color:#bcb9b9'));
  assert.ok(css.includes('.calendar-day-available{background:#fff;color:#171717'));
  assert.ok(css.includes('.calendar-day-available:hover:not(:disabled)'));
});
test('TF34','Painel / Kanban e navegação','renderiza cartões a partir das tarefas locais, inicia na aba Tarefas e oculta a busca fora dela',() => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  for (const id of ['kanban-list-todo', 'kanban-list-progress', 'kanban-list-done', 'kanban-count-todo', 'kanban-count-progress', 'kanban-count-done']) assert.ok(html.includes(`id="${id}"`), `Alvo Kanban ausente: ${id}`);
  assert.ok(html.includes('class="task-kanban-board"')); assert.ok(html.includes('global-search-wrap" class="global-search" hidden'));
  const app = fs.readFileSync(path.join(__dirname, '..', 'js', 'app.js'), 'utf8');
  assert.ok(app.includes('function renderKanban()')); assert.ok(app.includes('tasks.filter(task => task.status === status)'));
  assert.ok(app.includes("renderKanban();")); assert.ok(app.includes("switchView('tarefas'); render(); refreshTaskRelations();"));
  assert.ok(app.includes("byId('global-search-wrap').hidden = view !== 'tarefas'"));
  assert.ok(app.includes('makeStatus(task)')); assert.ok(app.includes("dataset.action = 'edit-task'"));
  const css = fs.readFileSync(path.join(__dirname, '..', 'style.css'), 'utf8'); assert.ok(css.includes('.task-kanban-board{display:grid;grid-template-columns:repeat(3'));
});
test('TF04','RF03 / HU03','altera status para uma das opções definidas',() => {
  assert.equal(Tasks.setStatus([task()], 'id-1', 'Concluída')[0].status, 'Concluída'); assert.throws(() => Tasks.setStatus([task()], 'id-1', 'Pendente'), /inválido/);
});
test('TF05','RF04 / HU02','marca atraso por data local e ignora concluídas',() => {
  assert.equal(Tasks.isOverdue(task({ dueDate: '2026-10-16' }), '2026-10-17'), true); assert.equal(Tasks.isOverdue(task({ dueDate: '2026-10-16', status: 'Concluída' }), '2026-10-17'), false); assert.equal(Tasks.isOverdue(task({ dueDate: '2026-10-17' }), '2026-10-17'), false);
});
test('TF06','RF04 / HU02','calcula indicadores usando todas as tarefas',() => {
  const counts = Tasks.summary([task(), task({ id: '2', status: 'Em andamento', dueDate: '2026-10-16' }), task({ id: '3', status: 'Concluída', dueDate: '2026-10-10' })], '2026-10-17');
  assert.deepEqual(counts, { total: 3, todo: 1, inProgress: 1, done: 1, overdue: 1 });
});
test('TF07','RF02 / HU06','busca em título, descrição, responsável e combina filtros',() => {
  const tasks = [task({ title: 'Escrever plano', description: 'revisão trimestral', assignee: 'Ana' }), task({ id: '2', title: 'Outra atividade', assignee: 'Bruno', status: 'Em andamento' })];
  assert.equal(Tasks.filter(tasks, 'plano', '', '').length, 1); assert.equal(Tasks.filter(tasks, 'trimestral', '', '').length, 1); assert.equal(Tasks.filter(tasks, 'ana', '', '').length, 1); assert.equal(Tasks.filter(tasks, '', 'Em andamento', 'Bruno').length, 1); assert.equal(Tasks.filter(tasks, '', '', '').length, 2);
});
test('TF08','RF01 / HU05','remove apenas o registro selecionado',() => {
  const result = Tasks.remove([task(), task({ id: '2' })], 'id-1'); assert.equal(result.length, 1); assert.equal(result[0].id, '2');
});
test('TF09','RF05 / HU07','persiste JSON, trata ausência e mantém conteúdo inválido intacto ao ler',() => {
  const map = new Map(); const mock = { getItem: key => map.has(key) ? map.get(key) : null, setItem: (key, value) => map.set(key, value), removeItem: key => map.delete(key) };
  assert.deepEqual(Storage.load(mock), { tasks: [], warning: null, raw: null }); Storage.save([task()], mock); assert.equal(Storage.load(mock).tasks[0].id, 'id-1');
  map.set(Storage.KEY, '{broken'); const broken = Storage.load(mock); assert.equal(broken.tasks.length, 0); assert.ok(broken.warning); assert.equal(map.get(Storage.KEY), '{broken');
  map.set(Storage.KEY, JSON.stringify([task(), { nonsense: true }])); const partial = Storage.load(mock); assert.equal(partial.tasks.length, 1); assert.ok(partial.warning);
});
test('TF10','RF05 / RNF05','informa falha de gravação e conserva valor anterior',() => {
  let value = JSON.stringify([task()]); const mock = { getItem: () => value, setItem: (_key, next) => { value = next; throw new Error('quota'); }, removeItem: () => { value = null; } };
  assert.throws(() => Storage.save([], mock), /Não foi possível salvar/); assert.equal(value, JSON.stringify([task()]));
});
process.stdout.write(`\nResultado: ${passed} aprovados, ${failed} reprovados.\n`);
if (failed) process.exitCode = 1;
