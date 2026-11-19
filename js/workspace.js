(function (root) {
  'use strict';
  const KEY = 'taskflow.workspace.v1';
  const kinds = ['users', 'teams', 'projects'];
  const empty = () => ({ version: 1, users: [], teams: [], projects: [] });
  const clone = value => JSON.parse(JSON.stringify(value));
  const isDate = value => { if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false; const date = new Date(`${value}T00:00:00.000Z`); return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value; };
  const id = prefix => `${prefix}-${root.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`}`;
  function validateState(state) {
    return Boolean(state && state.version === 1 && kinds.every(kind => Array.isArray(state[kind])));
  }
  function load(storage) {
    const target = storage || root.localStorage;
    try {
      const raw = target.getItem(KEY);
      if (raw === null) return { state: empty(), warning: null, raw };
      const parsed = JSON.parse(raw);
      if (!validateState(parsed)) return { state: empty(), warning: 'Os cadastros locais têm um formato inválido. O conteúdo original foi preservado e as alterações estão bloqueadas.', raw };
      return { state: parsed, warning: null, raw };
    } catch (error) {
      return { state: empty(), warning: error instanceof SyntaxError ? 'Os cadastros locais estão corrompidos. O conteúdo original foi preservado e as alterações estão bloqueadas.' : 'Não foi possível ler os cadastros locais deste navegador.', raw: null };
    }
  }
  function save(state, storage) {
    if (!validateState(state)) throw new Error('Não foi possível salvar: os cadastros estão inválidos.');
    const target = storage || root.localStorage;
    try { target.setItem(KEY, JSON.stringify(state)); }
    catch (_) { throw new Error('Não foi possível salvar os cadastros no navegador. Verifique o espaço disponível.'); }
  }
  function normalize(kind, input, previous, state, today) {
    if (!kinds.includes(kind)) throw new Error('Tipo de cadastro inválido.');
    const name = String(input.name || '').trim();
    if (!name) throw new Error('Informe o nome.');
    if (kind === 'users') {
      const email = String(input.email || '').trim().toLocaleLowerCase('pt-BR');
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Informe um e-mail válido.');
      if (state.users.some(user => user.email.toLocaleLowerCase('pt-BR') === email && user.id !== previous?.id)) throw new Error('Já existe um usuário com este e-mail.');
      return { id: previous?.id || id('user'), name, email, role: input.role === 'leader' ? 'leader' : 'member', teamIds: [...new Set((input.teamIds || []).filter(value => state.teams.some(team => team.id === value)))] };
    }
    if (kind === 'teams') {
      const parentId = state.teams.some(team => team.id === input.parentId && team.id !== previous?.id) ? input.parentId : '';
      return { id: previous?.id || id('team'), name, parentId, memberIds: [...new Set((input.memberIds || []).filter(value => state.users.some(user => user.id === value)))] };
    }
    const teamId = state.teams.some(team => team.id === input.teamId) ? input.teamId : '';
    if (input.dueDate && !isDate(input.dueDate)) throw new Error('Informe um prazo válido para o projeto.');
    const now = new Date();
    const currentDate = today || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    if (input.dueDate && input.dueDate < currentDate && input.dueDate !== previous?.dueDate) throw new Error('O prazo do projeto deve ser hoje ou uma data futura.');
    return { id: previous?.id || id('project'), name, description: String(input.description || '').trim(), teamId, dueDate: input.dueDate || '' };
  }
  function upsert(state, kind, input, recordId, today) {
    const next = clone(state);
    const collection = next[kind];
    const previous = recordId ? collection.find(record => record.id === recordId) : null;
    if (recordId && !previous) throw new Error('O cadastro não foi encontrado. Atualize a tela e tente novamente.');
    const record = normalize(kind, input, previous, next, today);
    const index = collection.findIndex(item => item.id === record.id);
    if (index < 0) collection.unshift(record); else collection[index] = record;
    if (kind === 'users') {
      next.teams.forEach(team => { team.memberIds = team.memberIds.filter(userId => userId !== record.id); if (record.teamIds.includes(team.id)) team.memberIds.push(record.id); });
    }
    if (kind === 'teams') {
      next.users.forEach(user => { user.teamIds = user.teamIds.filter(teamId => teamId !== record.id); if (record.memberIds.includes(user.id)) user.teamIds.push(record.id); });
    }
    return next;
  }
  function remove(state, kind, recordId) {
    if (!kinds.includes(kind)) throw new Error('Tipo de cadastro inválido.');
    const next = clone(state);
    if (!next[kind].some(record => record.id === recordId)) throw new Error('O cadastro não foi encontrado.');
    next[kind] = next[kind].filter(record => record.id !== recordId);
    if (kind === 'users') next.teams.forEach(team => { team.memberIds = team.memberIds.filter(userId => userId !== recordId); });
    if (kind === 'teams') {
      next.teams.forEach(team => { if (team.parentId === recordId) team.parentId = ''; team.memberIds = team.memberIds.filter(userId => next.users.some(user => user.id === userId)); });
      next.users.forEach(user => { user.teamIds = user.teamIds.filter(teamId => teamId !== recordId); });
      next.projects.forEach(project => { if (project.teamId === recordId) project.teamId = ''; });
    }
    if (kind === 'projects') return next;
    return next;
  }
  root.TaskFlowWorkspace = { KEY, empty, validateState, load, save, upsert, remove };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.TaskFlowWorkspace;
})(typeof globalThis !== 'undefined' ? globalThis : window);
