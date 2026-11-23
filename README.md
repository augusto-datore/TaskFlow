# TaskFlow

Aplicação local para cadastro, consulta e acompanhamento de tarefas, usuários, equipes e projetos. O MVP usa HTML, CSS e JavaScript puro e guarda os dados no `localStorage` do navegador. Não requer backend, conta de acesso, conexão com a internet ou dependências de terceiros.

## Requisitos e identidade visual

O escopo funcional foi extraído da documentação técnica atualizada. A pasta `stitch/` e as capturas de tela anexadas orientam o dashboard. A interface usa navegação lateral azul-marinho, cabeçalho claro, cartões de indicadores e acentos de cor para atraso, vencimento próximo e status, mantendo as operações locais do MVP. Painel, Tarefas e Relatórios compartilham os mesmos cinco cartões, dimensões, cores e sequência; abas e botões têm transições suaves, respeitando a preferência do sistema por movimento reduzido.

Os nomes e dados que aparecem nas capturas de referência não foram copiados. A aba Cadastros permite que a própria pessoa crie registros locais de usuários, equipes e projetos; não há contas ou autenticação. Os gráficos do dashboard usam tarefas e responsáveis do `localStorage`; nenhuma fonte, biblioteca ou serviço externo é necessário.

## Funcionalidades

- Criar tarefas com título, responsável, prazo, horário e status obrigatórios; descrição continua opcional. O calendário desabilita dias anteriores sem o “X” vermelho. O horário usa apenas horas e minutos e não aceita horários passados quando a data selecionada é hoje.
- Cadastrar usuários, equipes e projetos na aba **Cadastros**; editar/excluir registros e relacionar pessoas a equipes e projetos a equipes.
- Associar opcionalmente uma tarefa a um projeto e a uma equipe. Usuários cadastrados aparecem como sugestões para o campo Responsável, que continua aceitando texto livre para manter o fluxo atual.
- Editar e excluir tarefas; exclusão solicita confirmação.
- Alterar o status entre `A fazer`, `Em andamento` e `Concluída`.
- Buscar por título, descrição ou responsável; filtrar por status e responsável em conjunto.
- Acessar a aba **Notificações** na navegação lateral para ver tarefas não concluídas com prazo nas próximas 24 horas.
- A tela **Tarefas** é a primeira exibida ao abrir a aplicação. O Painel mostra indicadores, gráficos de status/responsáveis e um quadro Kanban alimentado pelas tarefas reais salvas localmente; permite editar uma tarefa ou alterar seu status diretamente no cartão. A busca global aparece apenas em **Tarefas**, onde ficam a tabela detalhada e os filtros.
- Indicadores na sequência **atrasadas → próximas do vencimento → a fazer → em andamento → concluídas**, com o mesmo layout no Painel, em Tarefas e em Relatórios; distribuição por status e tarefas por responsável em barras horizontais com gradiente marinho-azul, total numérico e contagem por status para cada pessoa. Uma tarefa vence quando sua data/hora local passa e ela não está concluída.
- Exportar todas as tarefas atuais para JSON.
- Preparar um relatório imprimível para um ou mais responsáveis. Busca, filtros e responsáveis marcados limitam as tarefas incluídas; sem responsáveis marcados, todos os responsáveis dentro dos filtros ativos são incluídos. Na caixa de impressão, selecione **Salvar como PDF**.
- Preservar os registros na chave histórica `taskflow.tasks.v1` do `localStorage`.

## Tecnologias e arquivos

```text
index.html          Estrutura semântica, navegação, telas e diálogos
style.css           Identidade visual, responsividade, foco e estilos de impressão
js/tasks.js         Validações e regras de negócio puras
js/storage.js       Leitura e gravação em localStorage
js/workspace.js     Cadastro local de usuários, equipes e projetos
js/app.js           Interface, filtros, indicadores e exportações
Notificações        Tarefas com prazo dentro das próximas 24 horas
tests/run-tests.js  Testes sem dependências externas
