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
```

## Executar localmente

Você pode acessar diretamente pelo navegador em https://augusto-datore.github.io/TaskFlow/ ou abrir `index.html` em um navegador moderno. Se o navegador restringir scripts ou armazenamento no endereço `file://`, abra um terminal nesta pasta e execute:

```bash
python -m http.server 8000
```

Depois acesse `http://localhost:8000`. Os dados pertencem ao perfil e à origem do navegador utilizados. Trocar de navegador, perfil ou endereço local poderá mostrar uma lista diferente.

## Uso

Use **Cadastros** para registrar usuários (nome, e-mail, perfil e equipes), equipes (nome, equipe principal e integrantes) e projetos (nome, descrição, equipe e prazo). O prazo de projeto aceita hoje ou datas futuras. Esses são registros de organização locais, não contas: não há senha, login, autenticação ou isolamento de dados por usuário. A exclusão de uma equipe atualiza as relações de equipes nos cadastros e projetos; as tarefas preservam os nomes dos responsáveis como histórico.

Use **Nova tarefa** para cadastrar. Título, responsável, data, horário e status são obrigatórios. O formulário destaca cada campo ausente ou inválido e mostra a mensagem “Preencha todos os campos obrigatórios”. Dias anteriores são indisponíveis; se a data for hoje, o horário mínimo é a hora/minuto atual. Ao editar, inclusive uma tarefa concluída, a data e o horário continuam disponíveis para alteração dentro dessas regras. O responsável pode ser selecionado entre os usuários cadastrados ou digitado livremente. Projeto e equipe são opcionais. Na tabela, altere o status com o seletor; use os ícones de edição e exclusão para as outras operações. A busca do cabeçalho e a busca da tela Tarefas são sincronizadas e também encontram o nome do projeto/equipe associado; a busca do cabeçalho fica disponível somente em **Tarefas**. No Kanban do Painel, selecione o status do cartão ou escolha **Editar**; a alteração é salva no mesmo registro local. Os filtros afetam as listas e o relatório imprimível, enquanto os indicadores e cartões do Kanban representam todos os registros armazenados. **Limpar filtros** restaura a lista completa.

**Exportar JSON** baixa uma cópia completa das tarefas. Em **Relatórios**, marque uma ou mais pessoas responsáveis antes de gerar o PDF; apenas tarefas dessas pessoas, combinadas com a busca e os filtros ativos, entram no relatório. Sem marcações, o relatório inclui todos os responsáveis dentro dos demais filtros. A impressão não salva automaticamente um PDF; escolha essa opção no navegador. Permita pop-ups se o navegador bloquear a janela.

## Testes

Execute a suíte sem instalar pacotes:

```sh
node tests/run-tests.js
```

O arquivo imprime identificador, requisito, cenário e resultado. A suíte cobre regras de cadastro/validação de tarefas e entidades, associação com projeto/equipe, edição, exclusão pura, status, atraso e indicadores, busca/filtros e armazenamento incluindo dados inválidos e falhas de escrita. Veja o registro de execução deste ciclo em `TEST_REPORT.md`.

Consulte [TEST_REPORT.md](TEST_REPORT.md) para resultados por requisito, incluindo verificações visuais e interativas no navegador que não fazem parte da suíte automatizada.

## Integridade e limitações

- Se o JSON armazenado não puder ser lido ou contiver registros inválidos, a aplicação avisa e bloqueia gravações para evitar sobrescrever os dados originais. **Exportar JSON** nesse estado baixa uma cópia exata do conteúdo original para recuperação.
- Erros de acesso, cota cheia ou bloqueio do navegador são apresentados ao usuário; o app não promete armazenamento permanente nem seguro.
- O relatório depende da janela de impressão oferecida pelo navegador; escolher e concluir “Salvar como PDF” é uma ação do usuário.
- Não há importação de JSON, backup automático, login, compartilhamento ou sincronização. Usuários/equipes/projetos ficam em `taskflow.workspace.v1`; tarefas continuam no formato existente em `taskflow.tasks.v1` e recebem apenas campos opcionais `projectId` e `teamId` quando associados.
- A obrigatoriedade de responsável e status e o prazo mínimo em hoje foram ajustados a pedido do usuário; isso diverge do documento técnico original, que permitia responsável opcional e definia status inicial automático `A fazer`.
- A referência visual oferece telas desktop e modal, mas não inclui especificação técnica responsiva. Os breakpoints foram definidos para reorganizar os cartões, os filtros e a navegação em telas estreitas; a tabela mantém rolagem horizontal.
- A inspeção visual da aplicação renderizada no navegador ainda está pendente. Os testes automatizados cobrem regras, armazenamento simulado e verificações estáticas; não validam interação visual, impressão ou responsividade renderizada.
