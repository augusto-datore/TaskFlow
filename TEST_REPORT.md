# Registro de testes — TaskFlow

Execução local de `node tests/run-tests.js` em 23/11/2026. Resultado: **31 aprovados, 0 reprovados**.

A suíte contém 31 casos automatizados. Ela cobre regras de negócio, armazenamento simulado e verificações estáticas de conteúdo. Não equivale a uma regressão visual ou interativa no navegador e não valida impressão, responsividade renderizada ou integrações externas.

| ID | Cenário | Resultado |
|---|---|---|
| TF01 | Cria tarefa válida com responsável e status informados | Aprovado |
| TF02 | Rejeita responsável, título, prazo ou status ausentes e data inválida ou passada | Aprovado |
| TF03 | Edita a tarefa correta sem duplicar e valida campos obrigatórios | Aprovado |
| TF04 | Altera status para uma das opções definidas | Aprovado |
| TF05 | Marca atraso por data local e ignora tarefas concluídas | Aprovado |
| TF06 | Calcula indicadores usando todas as tarefas | Aprovado |
| TF07 | Busca título, descrição e responsável e combina filtros | Aprovado |
| TF08 | Remove apenas o registro selecionado | Aprovado |
| TF09 | Persiste JSON, trata ausência e mantém conteúdo inválido intacto ao ler | Aprovado |
| TF10 | Informa falha de gravação e conserva o valor anterior | Aprovado |
| TF11 | Permite alterar o prazo de uma tarefa concluída | Aprovado |
| TF12 | Marca dias anteriores no calendário e mantém hoje/futuro selecionáveis | Aprovado |
| TF16 | Verifica no HTML as cinco etapas do Kanban, o escopo do MVP e três histórias | Aprovado |
| TF19 | Persiste hora/minuto e bloqueia horário passado no dia atual | Aprovado |
| TF20 | Carrega tarefas antigas sem `dueTime` usando o prazo legado `23:59` | Aprovado |
| TF21 | Filtra o relatório por um ou mais responsáveis | Aprovado |
| TF22 | Considera tarefas não concluídas com vencimento nas próximas 24 horas | Aprovado |
| TF23 | Verifica navegação, notificações e seleção de responsáveis para o relatório | Aprovado |
| TF24 | Verifica estrutura do formulário, prazo e cores por status | Aprovado |
| TF25 | Verifica controles de data/horário e contagens por responsável | Aprovado |
| TF26 | Verifica a sequência dos indicadores nas três telas e as animações declaradas | Aprovado |
| TF27 | Verifica o layout do painel e a ausência da tabela de tarefas nessa tela | Aprovado |
| TF28 | Cadastra pessoas, equipes e projetos e rejeita e-mail duplicado | Aprovado |
| TF29 | Remove uma equipe e limpa referências relacionadas | Aprovado |
| TF30 | Persiste relações opcionais entre tarefas, projetos e equipes | Aprovado |
| TF31 | Verifica a área Cadastros e a ausência de login ou recursos remotos | Aprovado |
| TF32 | Verifica a altura da descrição, o placeholder de status e o ícone SVG | Aprovado |
| TF33 | Verifica a rejeição de prazos passados e a disponibilidade de datas futuras | Aprovado |
| TF34 | Verifica o Kanban alimentado por tarefas locais, a tela inicial e a busca | Aprovado |
| TF35 | Verifica a ordem lateral e a tela inicial Tarefas | Aprovado |
| TF36 | Verifica o destaque das setas no hover e no foco | Aprovado |

## Verificações manuais fora da suíte automatizada

| ID | Verificação | Resultado |
|---|---|---|
| TF17 | Inspeção estática dos pontos de montagem dos gráficos, IDs e navegação | Pendente de confirmação manual; não faz parte dos 31 testes automatizados |

A versão anterior deste relatório registrava TF17 como aprovado. Como ele não aparece em `tests/run-tests.js`, mantenha esse resultado somente se a verificação manual foi realmente realizada e houver evidência para registrar.

## Validações não executadas

| ID | Verificação | Resultado |
|---|---|---|
| TF13 | Abrir o relatório, verificar seu conteúdo e acionar a impressão no navegador | Não executado |
| TF14 | Validar teclado, diálogos, foco, contraste e layout renderizado em diferentes tamanhos de tela | Não executado |
| TF15 | Verificar no navegador o funcionamento offline, requisições de rede e persistência após recarga | Não executado |
| TF18 | Verificar visualmente gráficos, cores e responsividade da interface renderizada | Não executado |

Essas verificações dependem de interação ou observação no navegador e não fazem parte do resultado de 31 testes automatizados.

Para repetir a suíte, execute:

```sh
node tests/run-tests.js
```

Se o código mudar antes da publicação deste relatório, execute novamente a suíte e atualize a data e o resultado conforme a saída obtida.
