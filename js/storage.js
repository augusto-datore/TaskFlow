(function (root) {
  'use strict';
  const KEY = 'taskflow.tasks.v1';
  function load(storage) {
    let raw = null;
    try {
      raw = (storage || root.localStorage).getItem(KEY);
      if (raw === null) return { tasks: [], warning: null, raw };
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return { tasks: [], warning: 'Os dados salvos não têm o formato esperado. O conteúdo original foi preservado; exporte ou revise os dados antes de substituí-los.', raw };
      const valid = parsed.filter(root.TaskFlowTasks.isValidTask);
      return { tasks: valid, warning: valid.length !== parsed.length ? 'Algumas tarefas inválidas foram ignoradas ao carregar. O conteúdo original permanece salvo até você fazer uma alteração.' : null, raw };
    } catch (error) {
      return { tasks: [], warning: error instanceof SyntaxError ? 'Os dados salvos estão corrompidos. O conteúdo original foi preservado; faça uma exportação/recuperação antes de gravar alterações.' : 'Não foi possível ler o armazenamento local deste navegador.', raw };
    }
  }
  function save(tasks, storage) {
    const target = storage || root.localStorage;
    let previous;
    try { previous = target.getItem(KEY); target.setItem(KEY, JSON.stringify(tasks)); }
    catch (error) {
      try { if (previous === null) target.removeItem(KEY); else if (previous !== undefined) target.setItem(KEY, previous); } catch (_) { /* Best effort rollback. */ }
      throw new Error('Não foi possível salvar no armazenamento local. Verifique o espaço disponível ou as permissões do navegador.');
    }
  }
  root.TaskFlowStorage = { KEY, load, save };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.TaskFlowStorage;
})(typeof globalThis !== 'undefined' ? globalThis : window);
