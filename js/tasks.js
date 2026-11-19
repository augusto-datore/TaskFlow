(function (root) {
  'use strict';
  const STATUS = Object.freeze(['A fazer', 'Em andamento', 'Concluída']);
  function isValidDate(value) { if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false; const date = new Date(`${value}T00:00:00.000Z`); return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value; }
  const isValidTime = value => typeof value === 'string' && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);
  const dueTime = task => isValidTime(task.dueTime) ? task.dueTime : '23:59';
  const isValidTask = task => Boolean(task && typeof task === 'object' && typeof task.id === 'string' && task.id && typeof task.title === 'string' && task.title.trim() && typeof task.description === 'string' && typeof task.assignee === 'string' && isValidDate(task.dueDate) && (task.dueTime === undefined || isValidTime(task.dueTime)) && (task.projectId === undefined || typeof task.projectId === 'string') && (task.teamId === undefined || typeof task.teamId === 'string') && STATUS.includes(task.status) && typeof task.createdAt === 'string');
  function validate(input, today, time) {
    const errors = {};
    if (!String(input.title || '').trim()) errors.title = 'Informe o título da tarefa.';
    if (!String(input.assignee || '').trim()) errors.assignee = 'Informe o responsável pela tarefa.';
    if (!String(input.dueDate || '').trim()) errors.dueDate = 'Informe o prazo da tarefa.';
    else if (!isValidDate(input.dueDate)) errors.dueDate = 'Informe uma data válida.';
    else if (input.dueDate < (today || localDate())) errors.dueDate = 'O prazo deve ser hoje ou uma data futura.';
    if (!String(input.dueTime || '').trim()) errors.dueTime = 'Informe o horário do prazo.';
    else if (!isValidTime(input.dueTime)) errors.dueTime = 'Informe um horário válido usando horas e minutos.';
    else if (input.dueDate === (today || localDate()) && input.dueTime < (time || localTime())) errors.dueTime = 'O horário deve ser atual ou futuro.';
    if (!STATUS.includes(input.status)) errors.status = 'Selecione um status.';
    return errors;
  }
  function create(input, now) {
    const errors = validate(input, now ? localDate(now) : undefined, now ? localTime(now) : undefined);
    if (Object.keys(errors).length) throw Object.assign(new Error('Verifique os campos obrigatórios.'), { errors });
    const date = now || new Date();
    return { id: (root.crypto && root.crypto.randomUUID) ? root.crypto.randomUUID() : `${date.getTime()}-${Math.random().toString(36).slice(2)}`, title: input.title.trim(), description: String(input.description || '').trim(), assignee: String(input.assignee).trim(), dueDate: input.dueDate, dueTime: input.dueTime, status: input.status, ...(input.projectId ? { projectId: String(input.projectId) } : {}), ...(input.teamId ? { teamId: String(input.teamId) } : {}), createdAt: date.toISOString() };
  }
  function update(tasks, id, input, today, time) {
    const errors = validate(input, today, time);
    if (Object.keys(errors).length) throw Object.assign(new Error('Verifique os campos obrigatórios.'), { errors });
    if (input.status && !STATUS.includes(input.status)) throw new Error('Status inválido.');
    let found = false;
    const result = tasks.map(task => {
      if (task.id !== id) return task;
      found = true;
      const next = { ...task, title: input.title.trim(), description: String(input.description || '').trim(), assignee: String(input.assignee || '').trim(), dueDate: input.dueDate, dueTime: input.dueTime, status: input.status || task.status };
      if (input.projectId) next.projectId = String(input.projectId); else delete next.projectId;
      if (input.teamId) next.teamId = String(input.teamId); else delete next.teamId;
      return next;
    });
    if (!found) throw new Error('A tarefa não foi encontrada. Atualize a lista e tente novamente.');
    return result;
  }
  function remove(tasks, id) { return tasks.filter(task => task.id !== id); }
  function setStatus(tasks, id, status) {
    if (!STATUS.includes(status)) throw new Error('Status inválido.');
    let found = false;
    const result = tasks.map(task => { if (task.id !== id) return task; found = true; return { ...task, status }; });
    if (!found) throw new Error('A tarefa não foi encontrada.');
    return result;
  }
  function isOverdue(task, today, time) {
    if (task.status === 'Concluída') return false;
    const currentDate = today || localDate();
    if (task.dueDate < currentDate) return true;
    return task.dueDate === currentDate && dueTime(task) < (time || localTime());
  }
  function localDate(date) { const d = date || new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
  function localTime(date) { const d = date || new Date(); return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`; }
  function dueWithinHours(task, hours, now) {
    if (task.status === 'Concluída') return false;
    const current = new Date(now || new Date());
    current.setSeconds(0, 0);
    const [year, month, day] = task.dueDate.split('-').map(Number);
    const [hour, minute] = dueTime(task).split(':').map(Number);
    const deadline = new Date(year, month - 1, day, hour, minute, 0, 0);
    const remaining = deadline.getTime() - current.getTime();
    return remaining >= 0 && remaining <= hours * 60 * 60 * 1000;
  }
  function calendarDays(year, month, today) {
    const first = new Date(year, month, 1);
    const offset = (first.getDay() + 6) % 7;
    const count = new Date(year, month + 1, 0).getDate();
    const current = today || localDate();
    const days = Array.from({ length: count }, (_, index) => {
      const day = index + 1;
      const iso = localDate(new Date(year, month, day));
      return { day, iso, past: iso < current, today: iso === current };
    });
    return { offset, days };
  }
  function summary(tasks, today, time) { return { total: tasks.length, todo: tasks.filter(t => t.status === 'A fazer').length, inProgress: tasks.filter(t => t.status === 'Em andamento').length, done: tasks.filter(t => t.status === 'Concluída').length, overdue: tasks.filter(t => isOverdue(t, today, time)).length }; }
  function filter(tasks, query, status, assignee, relatedText) {
    const needle = String(query || '').trim().toLocaleLowerCase('pt-BR');
    const person = String(assignee || '').trim().toLocaleLowerCase('pt-BR');
    return tasks.filter(task => {
      const fields = [task.title, task.description, task.assignee, ...(typeof relatedText === 'function' ? relatedText(task) : [])];
      return (!status || task.status === status) && (!person || task.assignee.toLocaleLowerCase('pt-BR') === person) && (!needle || fields.some(value => String(value || '').toLocaleLowerCase('pt-BR').includes(needle)));
    });
  }
  function filterByAssignees(tasks, assignees) {
    const selected = new Set((Array.isArray(assignees) ? assignees : []).map(name => String(name).trim()).filter(Boolean));
    return selected.size ? tasks.filter(task => selected.has(task.assignee.trim())) : tasks.slice();
  }
  root.TaskFlowTasks = { STATUS, isValidDate, isValidTime, isValidTask, dueTime, validate, create, update, remove, setStatus, isOverdue, dueWithinHours, localDate, localTime, calendarDays, summary, filter, filterByAssignees };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.TaskFlowTasks;
})(typeof globalThis !== 'undefined' ? globalThis : window);
