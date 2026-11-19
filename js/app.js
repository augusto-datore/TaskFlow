(function () {
  'use strict';
  const T = window.TaskFlowTasks;
  const S = window.TaskFlowStorage;
  const W = window.TaskFlowWorkspace;
  const byId = id => document.getElementById(id);
  const elements = {
    search: byId('search'), searchSecondary: byId('search-secondary'), status: byId('status-filter-secondary'), assignee: byId('assignee-filter-secondary'), dialog: byId('task-dialog'), confirmDialog: byId('confirm-dialog'), form: byId('task-form'), toast: byId('toast')
  };
  const loaded = S.load();
  let tasks = loaded.tasks;
  let storageBlocked = Boolean(loaded.warning);
  const workspaceLoaded = W.load();
  let workspace = workspaceLoaded.state;
  let workspaceBlocked = Boolean(workspaceLoaded.warning);
  let registryKind = 'users';
  let editingRegistryId = '';
  let projectCalendarCursor = new Date();
  let pendingDeleteId = null;
  let toastTimer;
  let calendarCursor = new Date();
  const today = () => T.localDate();
  function notify(message, kind) {
    elements.toast.textContent = message;
    elements.toast.dataset.kind = kind || 'success';
    elements.toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { elements.toast.hidden = true; }, 4200);
  }
  function persist(next) {
    if (storageBlocked) throw new Error('O armazenamento contém dados que não foram lidos com segurança. Para evitar sobrescrevê-los, as alterações estão bloqueadas. Exporte ou recupere o conteúdo original antes de continuar.');
    S.save(next);
    tasks = next;
    render();
  }
  function safeRun(action) { try { action(); } catch (error) { render(); notify(error.message || 'Não foi possível concluir a operação.', 'error'); } }
  function activeFilters() { return { query: elements.search.value, status: elements.status.value, assignee: elements.assignee.value }; }
  function filteredTasks() { const f = activeFilters(); return T.filter(tasks, f.query, f.status, f.assignee, task => [recordName('projects', task.projectId), recordName('teams', task.teamId)]); }
  function setText(id, value) { byId(id).textContent = String(value); }
  function formatDate(value) { const [year, month, day] = value.split('-'); return `${day}/${month}/${year}`; }
  function formatDeadline(task) { return `${formatDate(task.dueDate)} ${T.dueTime(task)}`; }
  function dateFromISO(value) { const [year, month, day] = value.split('-').map(Number); return new Date(year, month - 1, day); }
  function renderCalendar() {
    const year = calendarCursor.getFullYear();
    const month = calendarCursor.getMonth();
    const first = new Date(year, month, 1);
    const minMonth = dateFromISO(today());
    const currentDate = today();
    const calendar = T.calendarDays(year, month, currentDate);
    byId('calendar-month').textContent = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(first);
    byId('calendar-prev').disabled = year < minMonth.getFullYear() || (year === minMonth.getFullYear() && month <= minMonth.getMonth());
    const cells = Array.from({ length: calendar.offset }, () => { const blank = document.createElement('span'); blank.className = 'calendar-empty'; blank.setAttribute('aria-hidden', 'true'); return blank; });
    for (const { day, iso, past } of calendar.days) {
      const date = new Date(year, month, day);
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'calendar-day'; button.textContent = String(day); button.dataset.date = iso;
      button.disabled = past; button.setAttribute('role', 'gridcell');
      button.setAttribute('aria-label', past ? `${day} de ${new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(date)}, data anterior indisponível` : `${day} de ${new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(date)}${iso === currentDate ? ', hoje' : ''}`);
      if (past) { button.classList.add('calendar-day-past'); button.title = 'Data anterior — indisponível'; }
      else button.classList.add('calendar-day-available');
      if (iso === currentDate) button.classList.add('calendar-day-today');
      if (iso === byId('task-due-date').dataset.iso && !past) { button.classList.add('calendar-day-selected'); button.setAttribute('aria-selected', 'true'); }
      cells.push(button);
    }
    byId('calendar-days').replaceChildren(...cells);
  }
  function updateTimeConstraint() {
    const date = byId('task-due-date').dataset.iso || '';
    const time = byId('task-due-time');
    if (date === today()) {
      time.min = T.localTime();
      if (time.value && time.value < time.min) time.value = time.min;
    }
    else time.removeAttribute('min');
  }
  function openDatePicker() {
    const picker = byId('calendar-picker');
    if (!picker.hidden) { picker.hidden = true; byId('task-due-date').setAttribute('aria-expanded', 'false'); return; }
    const selected = byId('task-due-date').dataset.iso;
    calendarCursor = selected && selected >= today() ? dateFromISO(selected) : new Date();
    calendarCursor = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth(), 1);
    picker.hidden = false;
    byId('task-due-date').setAttribute('aria-expanded', 'true');
    renderCalendar();
    const target = picker.querySelector('.calendar-day-available:not(:disabled)');
    if (target) target.focus();
  }
  function chooseCalendarDate(iso) {
    if (!iso || iso < today()) return;
    const input = byId('task-due-date');
    input.dataset.iso = iso;
    input.value = formatDate(iso);
    updateTimeConstraint();
    const timeInput = byId('task-due-time');
    if (iso === today() && timeInput.value < T.localTime()) timeInput.value = T.localTime();
    byId('calendar-picker').hidden = true;
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-invalid');
    setText('date-error', '');
    input.focus();
  }
  function metric(id, value) { const target = byId(id); if (target) target.textContent = String(value); }
  function dueSoonTasks() { return tasks.filter(task => T.dueWithinHours(task, 24, new Date())); }
  function renderAssigneeCounts() {
    const container = byId('assignee-counts');
    const groups = new Map();
    tasks.forEach(task => {
      const name = task.assignee.trim();
      if (!name) return;
      if (!groups.has(name)) groups.set(name, { total: 0, 'A fazer': 0, 'Em andamento': 0, 'Concluída': 0 });
      const stats = groups.get(name); stats.total += 1; stats[task.status] += 1;
    });
    const ranked = [...groups.entries()].sort((a, b) => b[1].total - a[1].total || a[0].localeCompare(b[0], 'pt-BR')).slice(0, 5);
    if (!ranked.length) {
      const empty = document.createElement('p'); empty.className = 'chart-empty'; empty.textContent = 'As tarefas com responsável aparecerão aqui.'; container.replaceChildren(empty); return;
    }
    const rows = ranked.map(([name, stats]) => {
      const row = document.createElement('div'); row.className = 'assignee-count-row';
      const label = document.createElement('span'); label.className = 'assignee-name'; label.textContent = name; label.title = name;
      const statusCounts = document.createElement('div'); statusCounts.className = 'assignee-status-counts'; statusCounts.setAttribute('aria-label', `Status das tarefas de ${name}`);
      [['A fazer', 'todo'], ['Em andamento', 'progress'], ['Concluída', 'done']].forEach(([status, className]) => {
        const badge = document.createElement('span'); badge.className = `assignee-status-count ${className}`;
        badge.append(document.createTextNode(`${status}: `));
        const number = document.createElement('strong'); number.textContent = String(stats[status]); badge.append(number);
        statusCounts.append(badge);
      });
      const track = document.createElement('span'); track.className = 'assignee-track'; track.setAttribute('aria-hidden', 'true');
      const fill = document.createElement('span'); fill.style.width = `${Math.max(12, stats.total / ranked[0][1].total * 100)}%`; track.append(fill);
      const value = document.createElement('strong'); value.textContent = String(stats.total); value.setAttribute('aria-label', `${stats.total} tarefas no total`);
      row.append(label, value, statusCounts, track); return row;
    });
    container.replaceChildren(...rows);
  }
  function persistWorkspace(next) {
    if (workspaceBlocked) throw new Error('Os cadastros locais não puderam ser lidos com segurança. As alterações foram bloqueadas para preservar o conteúdo original.');
    W.save(next); workspace = next; renderRegistry(); refreshTaskRelations();
  }
  function recordName(kind, id) { return workspace[kind].find(record => record.id === id)?.name || ''; }
  function refreshTaskRelations() {
    const userList = byId('registered-users');
    if (userList) userList.replaceChildren(...workspace.users.map(user => { const option = document.createElement('option'); option.value = user.name; option.label = user.email; return option; }));
    const projectSelect = byId('task-project');
    const teamSelect = byId('task-team');
    if (projectSelect) { const selected = projectSelect.value; projectSelect.replaceChildren(new Option('Sem projeto', ''), ...workspace.projects.map(project => new Option(project.name, project.id))); if (workspace.projects.some(project => project.id === selected)) projectSelect.value = selected; }
    if (teamSelect) { const selected = teamSelect.value; teamSelect.replaceChildren(new Option('Sem equipe', ''), ...workspace.teams.map(team => new Option(team.name, team.id))); if (workspace.teams.some(team => team.id === selected)) teamSelect.value = selected; }
  }
  function registryCollection() { return workspace[registryKind]; }
  function registryLabel(kind) { return kind === 'users' ? 'usuário' : kind === 'teams' ? 'equipe' : 'projeto'; }
  function renderProjectCalendar() {
    const year = projectCalendarCursor.getFullYear(); const month = projectCalendarCursor.getMonth();
    const first = new Date(year, month, 1); const currentDate = today(); const calendar = T.calendarDays(year, month, currentDate);
    byId('project-calendar-month').textContent = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(first);
    const minMonth = dateFromISO(currentDate);
    byId('project-calendar-prev').disabled = year < minMonth.getFullYear() || (year === minMonth.getFullYear() && month <= minMonth.getMonth());
    const cells = Array.from({ length: calendar.offset }, () => { const blank = document.createElement('span'); blank.className = 'calendar-empty'; blank.setAttribute('aria-hidden', 'true'); return blank; });
    const selected = byId('project-due-date').dataset.iso;
    for (const { day, iso, past } of calendar.days) {
      const date = new Date(year, month, day); const button = document.createElement('button');
      button.type = 'button'; button.className = `calendar-day ${past ? 'calendar-day-past' : 'calendar-day-available'}`; button.textContent = String(day); button.dataset.projectDate = iso; button.disabled = past;
      button.setAttribute('role', 'gridcell');
      button.setAttribute('aria-label', `${day} de ${new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(date)}${past ? ', data anterior indisponível' : iso === currentDate ? ', hoje' : ''}`);
      if (past) button.title = 'Data anterior — indisponível';
      if (iso === currentDate) button.classList.add('calendar-day-today');
      if (iso === selected && !past) { button.classList.add('calendar-day-selected'); button.setAttribute('aria-selected', 'true'); }
      cells.push(button);
    }
    byId('project-calendar-days').replaceChildren(...cells);
  }
  function toggleProjectCalendar() {
    const picker = byId('project-calendar-picker'); const input = byId('project-due-date');
    if (!picker.hidden) { picker.hidden = true; input.setAttribute('aria-expanded', 'false'); return; }
    const selected = input.dataset.iso;
    projectCalendarCursor = selected && selected >= today() ? dateFromISO(selected) : new Date();
    projectCalendarCursor = new Date(projectCalendarCursor.getFullYear(), projectCalendarCursor.getMonth(), 1);
    picker.hidden = false; input.setAttribute('aria-expanded', 'true'); renderProjectCalendar();
    picker.querySelector('.calendar-day-available:not(:disabled)')?.focus();
  }
  function chooseProjectDate(iso) {
    if (!iso || iso < today()) return;
    const input = byId('project-due-date'); input.dataset.iso = iso; input.value = formatDate(iso);
    byId('project-calendar-picker').hidden = true; input.setAttribute('aria-expanded', 'false'); input.removeAttribute('aria-invalid'); input.focus();
  }
  function renderRegistry() {
    const labels = {
      users: { title: 'Usuários cadastrados', copy: 'Pessoas disponíveis para atribuição.', form: 'Novo usuário', action: 'Adicionar usuário', fields: `<label>Nome completo<input name="name" required maxlength="80" placeholder="Nome da pessoa"></label><label>E-mail<input name="email" type="email" required maxlength="160" placeholder="nome@exemplo.com"></label><label>Perfil<select name="role"><option value="member">Membro</option><option value="leader">Líder</option></select></label><label>Equipes vinculadas<select name="teamIds" multiple size="4">${workspace.teams.map(team => `<option value="${escapeHtml(team.id)}">${escapeHtml(team.name)}</option>`).join('')}</select><small>Opcional. Use Ctrl ou Command para selecionar mais de uma equipe.</small></label>` },
      teams: { title: 'Equipes cadastradas', copy: 'Agrupe responsáveis e relacione-os aos projetos.', form: 'Nova equipe', action: 'Adicionar equipe', fields: `<label>Nome da equipe<input name="name" required maxlength="80" placeholder="Nome da equipe"></label><label>Equipe principal<select name="parentId"><option value="">Equipe principal</option>${workspace.teams.map(team => `<option value="${escapeHtml(team.id)}">${escapeHtml(team.name)}</option>`).join('')}</select></label><label>Integrantes<select name="memberIds" multiple size="4">${workspace.users.map(user => `<option value="${escapeHtml(user.id)}">${escapeHtml(user.name)}</option>`).join('')}</select><small>Opcional. Use Ctrl ou Command para selecionar várias pessoas.</small></label>` },
      projects: { title: 'Projetos cadastrados', copy: 'Vincule tarefas e equipes a uma iniciativa.', form: 'Novo projeto', action: 'Adicionar projeto', fields: `<label>Nome do projeto<input name="name" required maxlength="120" placeholder="Nome do projeto"></label><label>Descrição<textarea name="description" maxlength="600" placeholder="Objetivo do projeto (opcional)"></textarea></label><label>Equipe responsável<select name="teamId"><option value="">Sem equipe</option>${workspace.teams.map(team => `<option value="${escapeHtml(team.id)}">${escapeHtml(team.name)}</option>`).join('')}</select></label><div class="project-date-control"><label for="project-due-date">Prazo do projeto</label><div class="project-date-input"><input id="project-due-date" name="dueDate" type="text" readonly aria-haspopup="dialog" aria-expanded="false" aria-controls="project-calendar-picker" placeholder="Selecione uma data"><button id="project-date-toggle" type="button" class="date-picker-toggle" aria-label="Abrir calendário do prazo do projeto" aria-controls="project-calendar-picker">▦</button></div><div id="project-calendar-picker" class="calendar-picker" role="group" aria-label="Selecionar prazo do projeto" hidden><div class="calendar-head"><button id="project-calendar-prev" type="button" aria-label="Mês anterior">‹</button><strong id="project-calendar-month"></strong><button id="project-calendar-next" type="button" aria-label="Próximo mês">›</button></div><div class="calendar-weekdays" aria-hidden="true"><span>Seg</span><span>Ter</span><span>Qua</span><span>Qui</span><span>Sex</span><span>Sáb</span><span>Dom</span></div><div id="project-calendar-days" class="calendar-days" role="grid" aria-label="Dias do mês"></div><p class="calendar-legend">Datas anteriores indisponíveis; hoje e datas futuras podem ser selecionadas.</p></div></div>` }
    };
    const config = labels[registryKind];
    document.querySelectorAll('[data-registry-kind]').forEach(tab => { const active = tab.dataset.registryKind === registryKind; tab.classList.toggle('active', active); tab.setAttribute('aria-selected', String(active)); });
    const target = editingRegistryId ? registryCollection().find(record => record.id === editingRegistryId) : null;
    byId('registry-form-title').textContent = target ? `Editar ${registryLabel(registryKind)}` : config.form;
    byId('registry-form-copy').textContent = config.copy;
    byId('registry-submit').textContent = target ? 'Salvar alterações' : config.action;
    byId('registry-cancel').hidden = !target;
    byId('registry-fields').innerHTML = config.fields;
    byId('registry-error').hidden = true; byId('registry-error').textContent = '';
    if (target) {
      const form = byId('registry-form');
      Object.entries(target).forEach(([key, value]) => {
        const field = form.elements.namedItem(key); if (!field) return;
        if (field instanceof HTMLSelectElement && field.multiple) [...field.options].forEach(option => { option.selected = value.includes(option.value); });
        else if (key === 'dueDate' && registryKind === 'projects') { field.dataset.iso = value || ''; field.value = value ? formatDate(value) : ''; }
        else field.value = value;
      });
    }
    byId('registry-list-title').textContent = config.title;
    byId('registry-list-copy').textContent = config.copy;
    const records = registryCollection();
    byId('registry-count').textContent = String(records.length);
    byId('registry-empty').hidden = records.length > 0;
    const list = byId('registry-list');
    list.replaceChildren(...records.map(record => {
      const card = document.createElement('article'); card.className = 'registry-card';
      const main = document.createElement('div'); main.className = 'registry-card-main';
      const title = document.createElement('strong'); title.textContent = record.name; main.append(title);
      const details = registryKind === 'users' ? [record.email, record.role === 'leader' ? 'Líder' : 'Membro', `${tasks.filter(task => task.assignee.toLocaleLowerCase('pt-BR') === record.name.toLocaleLowerCase('pt-BR')).length} tarefas`] : registryKind === 'teams' ? [record.parentId ? `Subequipe de ${recordName('teams', record.parentId)}` : 'Equipe principal', `${record.memberIds.length} integrantes`, `${tasks.filter(task => task.teamId === record.id).length} tarefas`] : [record.description, record.teamId ? recordName('teams', record.teamId) : 'Sem equipe', record.dueDate ? `Prazo: ${formatDate(record.dueDate)}` : 'Sem prazo', `${tasks.filter(task => task.projectId === record.id).length} tarefas`];
      const meta = document.createElement('div'); meta.className = 'registry-card-meta';
      details.filter(Boolean).forEach(value => { const chip = document.createElement('span'); chip.className = 'registry-chip'; chip.textContent = value; meta.append(chip); });
      main.append(meta);
      const actions = document.createElement('div'); actions.className = 'registry-card-actions';
      [['edit-registry','Editar','✎'],['delete-registry','Excluir','×']].forEach(([action,label,icon]) => { const button = document.createElement('button'); button.type = 'button'; button.className = `row-action${action === 'delete-registry' ? ' delete' : ''}`; button.dataset.action = action; button.dataset.kind = registryKind; button.dataset.id = record.id; button.setAttribute('aria-label', `${label} ${record.name}`); button.title = label; button.textContent = icon; actions.append(button); });
      card.append(main, actions); return card;
    }));
  }
  function submitRegistry(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const raw = Object.fromEntries(new FormData(form).entries());
    raw.teamIds = new FormData(form).getAll('teamIds'); raw.memberIds = new FormData(form).getAll('memberIds');
    if (registryKind === 'projects') raw.dueDate = byId('project-due-date').dataset.iso || '';
    try {
      const next = W.upsert(workspace, registryKind, raw, editingRegistryId, today());
      persistWorkspace(next); editingRegistryId = ''; renderRegistry(); notify(`${registryLabel(registryKind)} salvo com sucesso.`);
    } catch (error) { byId('registry-error').textContent = error.message; byId('registry-error').hidden = false; }
  }
  function renderDashboardCharts(counts) {
    const total = counts.total || 0;
    const doneAngle = total ? counts.done / total * 360 : 0;
    const todoAngle = doneAngle + (total ? counts.todo / total * 360 : 0);
    const donut = byId('status-donut');
    donut.dataset.empty = String(total === 0);
    donut.style.setProperty('--done-angle', `${doneAngle}deg`);
    donut.style.setProperty('--todo-angle', `${todoAngle}deg`);
    donut.setAttribute('aria-label', `${counts.done} concluídas, ${counts.todo} a fazer e ${counts.inProgress} em andamento, de ${total} tarefas`);
    metric('dashboard-total', total); metric('dashboard-total-label', `${total} ${total === 1 ? 'tarefa' : 'tarefas'}`);
    metric('donut-done', counts.done); metric('donut-todo', counts.todo); metric('donut-progress', counts.inProgress);
    const soon = dueSoonTasks();
    const completion = total ? Math.round(counts.done / total * 100) : 0;
    metric('due-soon-count', soon.length);
    metric('dashboard-task-count', `${total} ${total === 1 ? 'tarefa' : 'tarefas'}`);
    const pct = value => `${total ? value / total * 100 : 0}%`;
    [['completion-meter', counts.done], ['progress-meter', counts.inProgress], ['overdue-meter', counts.overdue], ['due-soon-meter', soon.length]].forEach(([id, count]) => { const node = byId(id); node.style.width = pct(count); });
    const badge = byId('notification-count'); badge.textContent = String(soon.length); badge.hidden = soon.length === 0;
    renderAssigneeCounts();
  }
  function updateMetrics() {
    const counts = T.summary(tasks, today(), T.localTime());
    const selectedReportTasks = reportTasks();
    const reportCounts = T.summary(selectedReportTasks, today(), T.localTime());
    const soon = dueSoonTasks();
    const reportSoon = selectedReportTasks.filter(task => T.dueWithinHours(task, 24, new Date()));
    const setMeter = (id, value, total) => { const node = byId(id); if (node) node.style.width = `${total ? value / total * 100 : 0}%`; };
    metric('overdue-count', counts.overdue); metric('overdue-count-tasks', counts.overdue);
    metric('due-soon-count', soon.length); metric('due-soon-count-tasks', soon.length);
    metric('dashboard-todo-count', counts.todo); metric('todo-count', counts.todo);
    metric('progress-count', counts.inProgress); metric('progress-count-tasks', counts.inProgress);
    metric('done-count', counts.done); metric('done-count-tasks', counts.done);
    metric('report-overdue', reportCounts.overdue); metric('report-due-soon', reportSoon.length);
    metric('report-todo', reportCounts.todo); metric('report-progress', reportCounts.inProgress); metric('report-done', reportCounts.done);
    [['overdue-meter-tasks',counts.overdue],['due-soon-meter-tasks',soon.length],['todo-meter-tasks',counts.todo],['progress-meter-tasks',counts.inProgress],['done-meter-tasks',counts.done]].forEach(([id,value]) => setMeter(id,value,counts.total));
    [['report-overdue-meter',reportCounts.overdue],['report-due-soon-meter',reportSoon.length],['report-todo-meter',reportCounts.todo],['report-progress-meter',reportCounts.inProgress],['report-done-meter',reportCounts.done]].forEach(([id,value]) => setMeter(id,value,reportCounts.total));
    metric('completion-rate', `${counts.total ? Math.round(counts.done / counts.total * 100) : 0}% do total`);
    renderDashboardCharts(counts);
    metric('bar-todo-value', reportCounts.todo); metric('bar-progress-value', reportCounts.inProgress); metric('bar-done-value', reportCounts.done); metric('bar-overdue-value', reportCounts.overdue);
    [['bar-todo', reportCounts.todo], ['bar-progress', reportCounts.inProgress], ['bar-done', reportCounts.done], ['bar-overdue', reportCounts.overdue]].forEach(([id, value]) => { byId(id).style.width = `${reportCounts.total ? value / reportCounts.total * 100 : 0}%`; });
    setText('report-date', new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(new Date()));
    setText('today-label', new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date()));
  }
  function updateAssignees() {
    const names = [...new Set(tasks.map(t => t.assignee.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
    const selectedAssignee = elements.assignee.value;
    const assigneeOptions = [new Option('Todos os responsáveis', ''), ...names.map(name => new Option(name, name))];
    elements.assignee.replaceChildren(...assigneeOptions);
    elements.assignee.value = names.includes(selectedAssignee) ? selectedAssignee : '';
    const options = byId('report-assignee-options');
    const selectedReportAssignees = new Set([...options.querySelectorAll('input:checked')].map(input => input.value));
    if (!names.length) {
      const empty = document.createElement('p'); empty.className = 'chart-empty'; empty.textContent = 'Nenhum responsável cadastrado.'; options.replaceChildren(empty); return;
    }
    options.replaceChildren(...names.map(name => {
      const label = document.createElement('label'); label.className = 'report-assignee-option';
      const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.value = name; checkbox.checked = selectedReportAssignees.has(name);
      const text = document.createElement('span'); text.textContent = name;
      label.append(checkbox, text); return label;
    }));
  }
  function reportTasks() {
    const list = filteredTasks();
    const selected = [...byId('report-assignee-options').querySelectorAll('input:checked')].map(input => input.value);
    return T.filterByAssignees(list, selected);
  }
  function makeStatus(task) {
    const select = document.createElement('select');
    select.className = 'status-select'; select.dataset.id = task.id; select.dataset.status = task.status;
    select.setAttribute('aria-label', `Status de ${task.title}`);
    T.STATUS.forEach(status => select.add(new Option(status, status)));
    select.value = task.status;
    return select;
  }
  function makeRow(task) {
    const row = document.createElement('tr');
    const titleCell = document.createElement('td');
    const title = document.createElement('span'); title.className = 'task-name'; title.textContent = task.title; title.title = task.title; titleCell.append(title);
    if (task.description) { const description = document.createElement('span'); description.className = 'task-description'; description.textContent = task.description; titleCell.append(description); }
    const relations = [task.projectId && recordName('projects', task.projectId), task.teamId && recordName('teams', task.teamId)].filter(Boolean);
    if (relations.length) { const meta = document.createElement('span'); meta.className = 'task-relations'; relations.forEach(value => { const chip = document.createElement('span'); chip.className = 'registry-chip'; chip.textContent = value; meta.append(chip); }); titleCell.append(meta); }
    const assignee = document.createElement('td'); assignee.className = 'assignee-cell'; assignee.textContent = task.assignee || '—';
    const overdue = T.isOverdue(task, today());
    const date = document.createElement('td'); date.className = 'date-cell';
    const dateBadge = document.createElement('span'); dateBadge.className = `date-badge${overdue ? ' date-overdue' : ''}`; dateBadge.textContent = formatDeadline(task); date.append(dateBadge); if (overdue) date.title = 'Prazo encerrado';
    const status = document.createElement('td'); status.append(makeStatus(task));
    const actions = document.createElement('td'); const group = document.createElement('div'); group.className = 'row-actions';
    const edit = document.createElement('button'); edit.className = 'row-action'; edit.type = 'button'; edit.dataset.action = 'edit-task'; edit.dataset.id = task.id; edit.setAttribute('aria-label', `Editar ${task.title}`); edit.title = 'Editar'; edit.textContent = '✎';
    const remove = document.createElement('button'); remove.className = 'row-action delete'; remove.type = 'button'; remove.dataset.action = 'delete-task'; remove.dataset.id = task.id; remove.setAttribute('aria-label', `Excluir ${task.title}`); remove.title = 'Excluir'; remove.textContent = '×';
    group.append(edit, remove); actions.append(group);
    row.append(titleCell, assignee, date, status, actions);
    return row;
  }
  function makeKanbanCard(task) {
    const card = document.createElement('article'); card.className = 'kanban-task-card';
    const title = document.createElement('h4'); title.textContent = task.title; card.append(title);
    if (task.description) { const description = document.createElement('p'); description.className = 'kanban-task-description'; description.textContent = task.description; card.append(description); }
    const meta = document.createElement('div'); meta.className = 'kanban-task-meta';
    const assignee = document.createElement('span'); assignee.textContent = task.assignee || 'Sem responsável'; meta.append(assignee);
    const deadline = document.createElement('span'); deadline.textContent = formatDeadline(task); meta.append(deadline); card.append(meta);
    const relations = [task.projectId && recordName('projects', task.projectId), task.teamId && recordName('teams', task.teamId)].filter(Boolean);
    if (relations.length) { const tags = document.createElement('div'); tags.className = 'kanban-task-relations'; relations.forEach(value => { const tag = document.createElement('span'); tag.textContent = value; tags.append(tag); }); card.append(tags); }
    const actions = document.createElement('div'); actions.className = 'kanban-task-actions';
    const status = makeStatus(task); status.classList.add('kanban-status-select'); actions.append(status);
    const edit = document.createElement('button'); edit.className = 'button button-quiet kanban-edit'; edit.type = 'button'; edit.dataset.action = 'edit-task'; edit.dataset.id = task.id; edit.textContent = 'Editar'; edit.setAttribute('aria-label', `Editar ${task.title}`); actions.append(edit);
    card.append(actions); return card;
  }
  function renderKanban() {
    const columns = [
      { status: 'A fazer', key: 'todo' },
      { status: 'Em andamento', key: 'progress' },
      { status: 'Concluída', key: 'done' }
    ];
    columns.forEach(({ status, key }) => {
      const list = tasks.filter(task => task.status === status);
      byId(`kanban-count-${key}`).textContent = String(list.length);
      byId(`kanban-list-${key}`).replaceChildren(...list.map(makeKanbanCard));
      byId(`kanban-empty-${key}`).hidden = list.length > 0;
    });
  }
  function renderList(tbodyId, emptyId, titleId, copyId, summaryId, list) {
    const tbody = byId(tbodyId);
    tbody.replaceChildren(...list.map(makeRow));
    const empty = byId(emptyId); empty.hidden = list.length > 0;
    if (!list.length) {
      const isFiltered = Boolean(elements.search.value.trim() || elements.status.value || elements.assignee.value);
      setText(titleId, isFiltered ? 'Nenhuma tarefa encontrada' : 'Sua lista está vazia');
      setText(copyId, isFiltered ? 'Tente ajustar a busca ou os filtros aplicados.' : 'Adicione uma tarefa para começar a organizar suas atividades.');
    }
    setText(summaryId, `${list.length} ${list.length === 1 ? 'tarefa' : 'tarefas'}`);
  }
  function render() {
    updateAssignees(); updateMetrics();
    renderKanban();
    const list = filteredTasks();
    renderList('task-list-secondary','empty-state-secondary','empty-title-secondary','empty-copy-secondary','list-summary-secondary',list);
    renderNotifications();
  }
  function renderNotifications() {
    const list = dueSoonTasks();
    byId('notification-list').replaceChildren(...list.map(makeRow));
    byId('notification-empty').hidden = list.length > 0;
    setText('notification-summary', `${list.length} ${list.length === 1 ? 'tarefa' : 'tarefas'}`);
  }
  function switchView(name) {
    const known = ['dashboard','tarefas','cadastros','notificacoes','relatorios','projeto'];
    const view = known.includes(name) ? name : 'tarefas';
    byId('global-search-wrap').hidden = view !== 'tarefas';
    const nextSection = byId(`view-${view}`);
    document.querySelectorAll('.view').forEach(section => { section.hidden = section !== nextSection; });
    if (nextSection) {
      nextSection.classList.remove('view-entering');
      void nextSection.offsetWidth;
      nextSection.classList.add('view-entering');
    }
    if (view === 'cadastros') renderRegistry();
    document.querySelectorAll('.nav-link').forEach(link => { const active = link.dataset.view === view; link.classList.toggle('active', active); if (active) link.setAttribute('aria-current','page'); else link.removeAttribute('aria-current'); });
    if (location.hash !== `#${view}`) history.replaceState(null, '', `#${view}`);
  }
  function clearErrors() {
    ['title-error','assignee-error','date-error','time-error','status-error'].forEach(id => setText(id, ''));
    ['task-title','task-assignee','task-due-date','task-due-time','task-status'].forEach(id => byId(id).removeAttribute('aria-invalid'));
    byId('form-error-summary').hidden = true;
    byId('form-error-summary').textContent = '';
  }
  function openForm(task) {
    elements.form.reset(); clearErrors();
    refreshTaskRelations();
    const editing = Boolean(task);
    setText('dialog-title', editing ? 'Editar tarefa' : 'Nova tarefa');
    byId('save-task').textContent = editing ? 'Salvar alterações' : 'Criar tarefa';
    byId('task-id').value = editing ? task.id : '';
    byId('task-title').value = editing ? task.title : '';
    byId('task-description').value = editing ? task.description : '';
    byId('task-assignee').value = editing ? task.assignee : '';
    byId('task-project').value = editing ? task.projectId || '' : '';
    byId('task-team').value = editing ? task.teamId || '' : '';
    const dueDate = editing ? task.dueDate : '';
    byId('task-due-date').dataset.iso = dueDate;
    byId('task-due-date').value = dueDate ? formatDate(dueDate) : '';
    byId('task-due-time').value = editing ? T.dueTime(task) : T.localTime();
    updateTimeConstraint();
    byId('calendar-picker').hidden = true;
    byId('task-due-date').setAttribute('aria-expanded', 'false');
    byId('task-status').value = editing ? task.status : 'A fazer';
    if (!editing) byId('task-status').value = '';
    byId('task-status').dataset.status = byId('task-status').value;
    byId('status-field').hidden = false;
    elements.dialog.showModal();
    byId('task-title').focus();
  }
  function saveForm(event) {
    event.preventDefault(); clearErrors();
    const input = { title: byId('task-title').value, description: byId('task-description').value, assignee: byId('task-assignee').value, dueDate: byId('task-due-date').dataset.iso || '', dueTime: byId('task-due-time').value, status: byId('task-status').value, projectId: byId('task-project').value, teamId: byId('task-team').value };
    const errors = T.validate(input, today(), T.localTime());
    if (errors.title) { setText('title-error', errors.title); byId('task-title').setAttribute('aria-invalid','true'); }
    if (errors.assignee) { setText('assignee-error', errors.assignee); byId('task-assignee').setAttribute('aria-invalid','true'); }
    if (errors.dueDate) { setText('date-error', errors.dueDate); byId('task-due-date').setAttribute('aria-invalid','true'); }
    if (errors.dueTime) { setText('time-error', errors.dueTime); byId('task-due-time').setAttribute('aria-invalid','true'); }
    if (errors.status) { setText('status-error', errors.status); byId('task-status').setAttribute('aria-invalid','true'); }
    if (Object.keys(errors).length) {
      setText('form-error-summary', 'Preencha todos os campos obrigatórios. Confira os campos destacados abaixo.');
      byId('form-error-summary').hidden = false;
      (errors.title ? byId('task-title') : errors.assignee ? byId('task-assignee') : errors.dueDate ? byId('task-due-date') : errors.dueTime ? byId('task-due-time') : byId('task-status')).focus();
      return;
    }
    safeRun(() => {
      const id = byId('task-id').value;
      if (id) persist(T.update(tasks, id, input, today(), T.localTime()));
      else persist([...tasks, T.create(input)]);
      elements.dialog.close(); notify(id ? 'Tarefa atualizada com sucesso.' : 'Tarefa criada com sucesso.');
    });
  }
  function askDelete(id) {
    pendingDeleteId = id;
    const task = tasks.find(item => item.id === id);
    byId('confirm-copy').textContent = task ? `“${task.title}” será removida permanentemente deste navegador.` : 'Esta tarefa será removida do armazenamento local.';
    elements.confirmDialog.showModal();
  }
  function confirmDelete(event) {
    if (event.target !== byId('confirm-delete')) return;
    event.preventDefault();
    const id = pendingDeleteId; pendingDeleteId = null;
    safeRun(() => { if (!tasks.some(task => task.id === id)) throw new Error('A tarefa não foi encontrada.'); persist(T.remove(tasks, id)); elements.confirmDialog.close(); notify('Tarefa excluída.'); });
  }
  function exportJson() {
    const backup = storageBlocked && loaded.raw !== null;
    const blob = new Blob([backup ? loaded.raw : JSON.stringify(tasks, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob); const link = document.createElement('a');
    link.href = url; link.download = `taskflow-tarefas-${today()}.json`; document.body.append(link); link.click(); link.remove(); URL.revokeObjectURL(url);
    notify(backup ? 'Cópia exata do conteúdo original foi exportada para recuperação.' : 'Arquivo JSON exportado.');
  }
  function escapeHtml(value) { return String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char])); }
  function printReport() {
    const list = reportTasks();
    const counts = T.summary(list, today(), T.localTime());
    let popup;
    try { popup = window.open('', '_blank'); } catch (_) { popup = null; }
    if (!popup) { notify('O navegador bloqueou a janela de impressão. Permita pop-ups para este arquivo e tente novamente.', 'error'); return; }
    const rows = list.map(task => `<tr><td>${escapeHtml(task.title)}${task.description ? `<small>${escapeHtml(task.description)}</small>` : ''}</td><td>${escapeHtml(task.assignee || '—')}</td><td>${escapeHtml(recordName('projects', task.projectId) || '—')}</td><td>${escapeHtml(recordName('teams', task.teamId) || '—')}</td><td>${formatDeadline(task)}</td><td>${escapeHtml(task.status)}</td></tr>`).join('');
    const f = activeFilters();
    const reportPeople = [...byId('report-assignee-options').querySelectorAll('input:checked')].map(input => input.value);
    const active = [f.query && `Busca: ${f.query}`, f.status && `Status: ${f.status}`, f.assignee && `Responsável: ${f.assignee}`, reportPeople.length && `Responsáveis do relatório: ${reportPeople.join(', ')}`].filter(Boolean).map(escapeHtml).join(' · ') || 'Nenhum filtro aplicado';
    const report = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Relatório de tarefas — TaskFlow</title><style>body{font:14px Arial,sans-serif;color:#222;margin:36px}h1{font-size:24px;margin:0 0 4px}.muted{color:#666;font-size:12px}.summary{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:24px 0}.card{padding:12px;border:1px solid #ddd;border-radius:8px}.card strong{display:block;font-size:22px;margin-top:6px}table{width:100%;border-collapse:collapse;margin-top:16px}th,td{text-align:left;padding:10px 8px;border-bottom:1px solid #ddd;vertical-align:top}th{background:#f4f3f3;font-size:11px}small{display:block;color:#666;margin-top:4px}@media print{body{margin:0}}</style></head><body><h1>Relatório de tarefas</h1><p class="muted">Gerado em ${new Intl.DateTimeFormat('pt-BR',{dateStyle:'long',timeStyle:'short'}).format(new Date())}</p><p class="muted">Filtros: ${active}</p><div class="summary"><div class="card">Total<strong>${counts.total}</strong></div><div class="card">A fazer<strong>${counts.todo}</strong></div><div class="card">Em andamento<strong>${counts.inProgress}</strong></div><div class="card">Concluídas<strong>${counts.done}</strong></div></div><p class="muted">Tarefas atrasadas: ${counts.overdue}</p><table><thead><tr><th>Tarefa</th><th>Responsável</th><th>Projeto</th><th>Equipe</th><th>Prazo</th><th>Status</th></tr></thead><tbody>${rows || '<tr><td colspan="6">Nenhuma tarefa corresponde aos filtros selecionados.</td></tr>'}</tbody></table><script>window.addEventListener('load',()=>window.print());<\/script></body></html>`;
    popup.document.open(); popup.document.write(report); popup.document.close();
    notify('Relatório preparado. Na impressão, selecione “Salvar como PDF”.');
  }
  document.addEventListener('click', event => {
    if (event.target.closest('#project-date-toggle')) { toggleProjectCalendar(); return; }
    if (event.target.closest('#project-calendar-prev')) { if (!byId('project-calendar-prev').disabled) { projectCalendarCursor = new Date(projectCalendarCursor.getFullYear(), projectCalendarCursor.getMonth() - 1, 1); renderProjectCalendar(); } return; }
    if (event.target.closest('#project-calendar-next')) { projectCalendarCursor = new Date(projectCalendarCursor.getFullYear(), projectCalendarCursor.getMonth() + 1, 1); renderProjectCalendar(); return; }
    const projectDate = event.target.closest('[data-project-date]');
    if (projectDate && !projectDate.disabled) { chooseProjectDate(projectDate.dataset.projectDate); return; }
    const registryTab = event.target.closest('[data-registry-kind]');
    if (registryTab) { registryKind = registryTab.dataset.registryKind; editingRegistryId = ''; renderRegistry(); return; }
    if (event.target.closest('#registry-cancel')) { editingRegistryId = ''; renderRegistry(); return; }
    const registryAction = event.target.closest('[data-action="edit-registry"], [data-action="delete-registry"]');
    if (registryAction) {
      const { kind, id } = registryAction.dataset;
      if (registryAction.dataset.action === 'edit-registry') { registryKind = kind; editingRegistryId = id; renderRegistry(); byId('registry-form-title').scrollIntoView({ behavior: 'smooth', block: 'start' }); }
      else if (window.confirm(`Excluir este ${registryLabel(kind)}?`)) {
        safeRun(() => { persistWorkspace(W.remove(workspace, kind, id)); notify(`${registryLabel(kind)} excluído.`); });
      }
      return;
    }
    const action = event.target.closest('[data-action]'); if (!action) return;
    switch (action.dataset.action) {
      case 'new-task': openForm(); break;
      case 'close-dialog': elements.dialog.close(); break;
      case 'edit-task': { const task = tasks.find(item => item.id === action.dataset.id); if (task) openForm(task); else notify('A tarefa não foi encontrada.', 'error'); break; }
      case 'delete-task': askDelete(action.dataset.id); break;
      case 'export-json': safeRun(exportJson); break;
      case 'print-report': printReport(); break;
      case 'go-tasks': switchView('tarefas'); break;
    }
  });
  elements.form.addEventListener('submit', saveForm);
  byId('registry-form').addEventListener('submit', submitRegistry);
  byId('registry-fields').addEventListener('keydown', event => {
    if (event.key === 'Escape' && !byId('project-calendar-picker').hidden) { byId('project-calendar-picker').hidden = true; byId('project-due-date').setAttribute('aria-expanded', 'false'); byId('project-due-date').focus(); }
  });
  byId('task-due-date').addEventListener('click', openDatePicker);
  byId('open-date-picker').addEventListener('click', openDatePicker);
  byId('task-due-date').addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openDatePicker(); }
  });
  byId('open-time-picker').addEventListener('click', () => {
    const input = byId('task-due-time'); updateTimeConstraint();
    try { if (typeof input.showPicker === 'function') input.showPicker(); else input.focus(); }
    catch (_error) { input.focus(); }
  });
  byId('task-due-time').addEventListener('input', () => { setText('time-error', ''); byId('task-due-time').removeAttribute('aria-invalid'); });
  byId('report-assignee-options').addEventListener('change', updateMetrics);
  byId('calendar-prev').addEventListener('click', () => { if (byId('calendar-prev').disabled) return; calendarCursor = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth() - 1, 1); renderCalendar(); });
  byId('calendar-next').addEventListener('click', () => { calendarCursor = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth() + 1, 1); renderCalendar(); });
  byId('calendar-days').addEventListener('click', event => { const day = event.target.closest('[data-date]'); if (day && !day.disabled) chooseCalendarDate(day.dataset.date); });
  byId('calendar-picker').addEventListener('keydown', event => { if (event.key === 'Escape') { byId('calendar-picker').hidden = true; byId('task-due-date').setAttribute('aria-expanded', 'false'); byId('task-due-date').focus(); } });
  elements.confirmDialog.addEventListener('click', confirmDelete);
  function syncSearch(source) { const value = source.value; [elements.search,elements.searchSecondary].forEach(input => { if (input !== source) input.value = value; }); render(); }
  elements.search.addEventListener('input', () => syncSearch(elements.search));
  elements.searchSecondary.addEventListener('input', () => syncSearch(elements.searchSecondary));
  elements.status.addEventListener('change', render);
  elements.assignee.addEventListener('change', render);
  function clearFilters() { elements.search.value = ''; elements.searchSecondary.value = ''; elements.status.value = ''; elements.assignee.value = ''; render(); notify('Busca e filtros foram limpos.'); }
  byId('clear-filters-secondary').addEventListener('click', clearFilters);
  document.addEventListener('click', event => {
    const control = event.target.closest('button, .nav-link');
    if (!control || control.disabled) return;
    control.classList.remove('click-feedback');
    void control.offsetWidth;
    control.classList.add('click-feedback');
    window.setTimeout(() => control.classList.remove('click-feedback'), 1000);
  });
  byId('task-status').addEventListener('change', event => { event.target.dataset.status = event.target.value; });
  document.addEventListener('change', event => {
    if (!event.target.matches('.status-select')) return;
    safeRun(() => { persist(T.setStatus(tasks, event.target.dataset.id, event.target.value)); notify('Status atualizado.'); });
  });
  document.querySelectorAll('.nav-link').forEach(link => link.addEventListener('click', () => switchView(link.dataset.view)));
  window.addEventListener('hashchange', () => switchView(location.hash.slice(1)));
  // Sempre iniciar na lista de tarefas; a navegação do usuário passa a controlar as visitas seguintes.
  switchView('tarefas'); render(); refreshTaskRelations();
  window.setInterval(() => { updateMetrics(); renderNotifications(); if (elements.dialog.open) updateTimeConstraint(); }, 60000);
  if (loaded.warning) notify(loaded.warning, 'error');
  if (workspaceLoaded.warning) notify(workspaceLoaded.warning, 'error');
})();
