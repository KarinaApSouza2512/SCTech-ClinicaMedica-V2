# MedClinic API

API REST para o gerenciamento de uma clínica médica: usuários e perfis de acesso,
pacientes, médicos, escala de trabalho, agendamento de consultas com controle de
concorrência e prontuário com acesso por vínculo de atendimento.

Trabalho de conclusão de curso do SCTech, desenvolvido por Karina Ap. de Souza.

**URL pública:** https://medclinic-api-latest.onrender.com/api/v1
(verificação de saúde em [`/api/v1/health`](https://medclinic-api-latest.onrender.com/api/v1/health))

**Documentação interativa (Swagger):** https://medclinic-api-latest.onrender.com/api/docs

**Board do projeto:** <PREENCHER>

## Escopo da Etapa 2

A Etapa 1 entregou a base de autenticação e autorização. A Etapa 2 migra a aplicação
para NestJS e implementa o domínio da clínica sobre essa base:

- perfis `admin`, `secretary` e `doctor`, com administrador inicial criado por seed;
- CRUD de pacientes com CPF único, busca por nome e remoção lógica;
- cadastro de médico e do seu usuário de acesso numa única transação;
- escala de trabalho por turno, com validação de sobreposição;
- criação de consulta validada contra a escala, com bloqueio pessimista contra
  agendamento duplicado;
- ciclo de vida da consulta (agendada, em andamento, concluída, cancelada) com
  autoridade por perfil;
- agenda do médico por período e listagens paginadas com filtros;
- prontuário restrito ao médico que atendeu o paciente, com leitura de auditoria
  pelo admin;
- contrato de erros padronizado, cobertura mínima de 80% e CI/CD com deploy no Render.

## Tecnologias

- Node.js 22 e TypeScript (modo `strict`)
- NestJS 11 sobre Express 5
- TypeORM 0.3 e PostgreSQL
- class-validator e class-transformer na validação de entrada
- `@nestjs/swagger` na documentação interativa (OpenAPI)
- JWT (`jsonwebtoken`) e bcrypt (`bcryptjs`)
- Jest 30 com ts-jest
- ESLint e Prettier
- Docker (imagem da API e banco local) e GitHub Actions
- Render (API e PostgreSQL) e GitHub Container Registry (imagem)

## Execução local

### Pré-requisitos

- Node.js 20 ou superior (a imagem e o CI usam o 22)
- Docker com Docker Compose, para subir o PostgreSQL local

### Passo a passo

O código da aplicação fica em `clinica/`. Os comandos abaixo partem da raiz do repositório.

1. Crie o arquivo de ambiente a partir do modelo e preencha os valores obrigatórios
   (`DB_USER`, `DB_PASSWORD`, `JWT_SECRET`, `ADMIN_EMAIL` e `ADMIN_PASSWORD`):

   ```bash
   cp clinica/.env.example clinica/.env
   ```

2. Suba o PostgreSQL. O compose lê usuário, senha e banco do mesmo `.env` e expõe o
   banco em `localhost:5434`:

   ```bash
   docker compose --env-file clinica/.env -f clinica/postgress/docker-compose.yml up -d
   ```

3. Instale as dependências, aplique as migrations e crie o administrador inicial:

   ```bash
   cd clinica
   npm install
   npm run migration:run
   npm run seed
   ```

4. Inicie a API em modo de desenvolvimento (reinicia a cada alteração):

   ```bash
   npm run dev
   ```

A API responde em `http://localhost:3000/api/v1`. Ao iniciar, ela também aplica as
migrations pendentes e executa a seed do administrador. Por isso, rodar os passos 3 e 4
de novo não duplica nada.

Para executar o build de produção: `npm run build` seguido de `npm start`.

## Variáveis de ambiente

Os valores ficam em `clinica/.env`, que não é versionado. O modelo é
`clinica/.env.example`. Segredos não têm valor padrão: sem eles a aplicação não sobe.

| Variável | Papel | Padrão |
| :---- | :---- | :---- |
| `NODE_ENV` | Ambiente de execução; em `development` o TypeORM registra as queries | `development` |
| `PORT` | Porta HTTP da API | `3000` |
| `DATABASE_URL` | Conexão por URL única (Render, Neon). Tem prioridade sobre os campos `DB_*` | vazio |
| `DB_SSL` | `true` para banco gerenciado, que exige SSL | `false` |
| `DB_HOST` | Host do PostgreSQL | `localhost` |
| `DB_PORT` | Porta do PostgreSQL | `5432` (o compose local usa `5434`) |
| `DB_USER` | Usuário do PostgreSQL | obrigatória sem `DATABASE_URL` |
| `DB_PASSWORD` | Senha do PostgreSQL | obrigatória sem `DATABASE_URL` |
| `DB_NAME` | Nome do banco | `sctec` |
| `JWT_SECRET` | Chave de assinatura do token | obrigatória |
| `JWT_EXPIRES_IN` | Validade do token | `1d` |
| `BCRYPT_SALT_ROUNDS` | Custo do hash de senha | `10` |
| `ADMIN_NAME` | Nome do administrador inicial | `Administrador` |
| `ADMIN_EMAIL` | E-mail do administrador inicial | sem padrão; sem ele a seed não cria o admin |
| `ADMIN_PASSWORD` | Senha do administrador inicial | sem padrão; sem ela a seed não cria o admin |

O fuso da clínica (`America/Sao_Paulo`) é uma constante em `src/utils/clinicTime.ts`.

## Comandos

Executados dentro de `clinica/`:

| Comando | O que faz |
| :---- | :---- |
| `npm run dev` | Inicia a API com recarga automática |
| `npm run build` | Compila o TypeScript para `dist/` |
| `npm start` | Executa a versão compilada |
| `npm run migration:run` | Aplica as migrations pendentes |
| `npm run migration:revert` | Desfaz a última migration aplicada |
| `npm run seed` | Cria o administrador inicial, se ainda não existir |
| `npm test` | Executa os testes |
| `npm run test:cov` | Executa os testes com cobertura e aplica o mínimo de 80% |
| `npm run lint` | Verifica o código com ESLint |

## Arquitetura

### Camadas e fluxo da requisição

```
requisição HTTP
  -> JwtAuthGuard        valida o Bearer token e coloca o usuário na requisição
  -> RolesGuard          barra o perfil que nunca pode acessar a rota (@Roles)
  -> DtoValidationPipe   valida e converte corpo, parâmetros e query pelo DTO
  -> Controller          chama o service e converte a entidade pelo mapper
  -> Service             regras de negócio; lança DomainError(código, mensagem)
  -> Repository (porta)  interface em repositories/ports
  -> TypeOrm*Repository  implementação com TypeORM
  -> PostgreSQL
qualquer erro -> AppExceptionFilter -> { statusCode, error, message }
```

- **Controllers** não têm regra de negócio e não importam TypeORM.
- **Services** dependem das portas dos repositórios, injetadas por token, e não
  conhecem status HTTP. Por isso podem ser testados com dublês, sem banco.
- **AppExceptionFilter** é o único lugar que traduz código de erro em status HTTP. Ele
  também converte a violação de unique do Postgres no código do catálogo pelo nome da
  constraint (`UQ_users_email`, `UQ_patients_cpf`, `UQ_doctors_crm`).

### Estrutura de pastas

```
clinica/
├── src/
│   ├── main.ts            # bootstrap: seed do admin, prefixo /api/v1, pipe, filtro e Swagger
│   ├── config/            # leitura e validação das variáveis de ambiente (env.ts)
│   ├── modules/           # módulos do Nest, que ligam controllers, services e repositórios
│   ├── controllers/       # rotas HTTP
│   ├── guards/            # autenticação (JWT) e autorização por perfil
│   ├── decorators/        # @Roles e @CurrentUser
│   ├── pipes/             # validação dos DTOs no formato de erro do contrato
│   ├── filters/           # tratamento centralizado de erros
│   ├── dto/               # entrada validada de cada rota
│   ├── mappers/           # formato das respostas (a entidade nunca sai direto)
│   ├── services/          # regras de negócio e regras puras (AppointmentRules)
│   ├── repositories/
│   │   ├── ports/         # interfaces usadas pelos services
│   │   └── typeorm/       # implementações com TypeORM
│   ├── entities/          # entidades do TypeORM
│   ├── enums/             # perfis e status da consulta
│   ├── errors/            # DomainError e catálogo de códigos
│   ├── database/          # DataSource, migrations e seed
│   ├── types/             # tipos do usuário autenticado
│   └── utils/             # hash, JWT, paginação, horas e fuso da clínica
├── tests/                 # testes unitários (Jest)
├── postgress/             # docker-compose do banco local
└── Dockerfile             # imagem de produção
```

### Decisões de modelagem

- **Ids inteiros (`SERIAL`).** São sequenciais, curtos e fáceis de usar nas rotas e
  nos testes do contrato. O controle de acesso não depende do id ser difícil de
  adivinhar, e sim da posse conferida em cada rota.
- **Perfis como `text[]` em `users`.** Um usuário pode ter mais de um perfil (um
  médico que também é admin). Uma constraint `CHECK` limita os valores aos três
  perfis e exige pelo menos um, sem precisar de tabela de junção.
- **Escala com uma linha por turno (`work_shifts`).** Cada turno tem dia da semana,
  início, fim e duração da consulta. Isso permite manhã e tarde no mesmo dia com
  durações diferentes. `CHECK`s no banco garantem dia de 0 a 6, início antes do fim e
  duração positiva. O `PUT` substitui a escala inteira numa transação.
- **`endsAt` gravado na consulta (RN15).** O fim é calculado no agendamento a partir
  da duração do turno e fica salvo. Mudar a escala depois não encurta nem move
  consultas já marcadas.
- **Remoção lógica de paciente.** O `DELETE` preenche `deleted_at` (`@DeleteDateColumn`).
  O paciente some das listagens e consultas, mas o histórico de consultas e o
  prontuário continuam íntegros. O CPF segue reservado pela constraint unique.
- **Lock pessimista na linha do médico.** A criação de consulta abre uma transação e
  faz `SELECT ... FOR UPDATE` na linha do médico antes de verificar conflitos e
  gravar. Trava-se o médico, e não as consultas, porque `FOR UPDATE` só trava linhas
  que já existem: numa agenda vazia não haveria o que travar. A linha do paciente
  também é travada, sempre depois da do médico. Isso impede o mesmo paciente em duas
  consultas simultâneas, e a ordem fixa evita deadlock.
- **Fuso via `Intl.DateTimeFormat`.** O horário da escala é hora local da clínica. O
  instante recebido em ISO 8601 (com fuso obrigatório) é convertido para
  `America/Sao_Paulo` com `Intl`, sem biblioteca externa e sem fixar `-03:00`. Assim,
  uma eventual volta do horário de verão é respeitada. As datas são guardadas em
  `timestamptz` e devolvidas em UTC (`toISOString()`).

### Padrão de nomes (RNF06)

- **PascalCase** para classes e para os arquivos que as contêm (`PatientService.ts`,
  `CreatePatientDto.ts`).
- **camelCase** para funções, variáveis e arquivos de funções utilitárias
  (`clinicTime.ts`, `escapeLike.ts`).
- **kebab-case** nos segmentos das rotas (`/work-schedule`, `/medical-records`).
- **snake_case** nas tabelas e colunas do banco (`work_shifts`, `starts_at`).
- **Sufixos** por papel: `Service`, `Controller`, `Repository`, `Dto`, `Module`,
  `Mapper`, `Guard`. Portas de repositório começam com `I` (`IPatientRepository`).
- **Rotas:** no NestJS não há arquivo `xxx.routes.ts`. Cada rota é declarada no seu
  controller, com `@Controller('patients')` e os decorators `@Get`, `@Post` e demais.

## Testes e cobertura

A cobertura é medida em `src/services/**`, a camada de regras de negócio: os services
e as regras puras de `AppointmentRules.ts`. O `npm run test:cov` falha abaixo de 80% em
linhas, branches, funções ou statements, e o CI usa esse mesmo comando.

Ficam fora do cálculo:

- **controllers**, que só repassam para o service e convertem a resposta;
- **entidades e migrations**, que são declaração de estrutura, sem lógica;
- **repositórios TypeORM**, cuja correção depende do banco real, o que um teste
  unitário com dublê não comprova.

Esses pontos foram verificados contra um PostgreSQL de verdade: migrations aplicadas e
revertidas, conflitos de unique, transações e concorrência de agendamento.

Os testes também cobrem os DTOs (pelo `DtoValidationPipe`) e as funções de hora e fuso,
mesmo fora do recorte de cobertura.

## Endpoints

Todas as rotas ficam sob `/api/v1`. As rotas autenticadas exigem o header
`Authorization: Bearer <token>`, obtido em `POST /auth/login`.

Para testar pelo navegador, use a documentação interativa em `/api/docs` (local:
`http://localhost:3000/api/docs`). Faça o login em `POST /api/v1/auth/login` pelo botão
**Try it out**, copie o `accessToken` da resposta, clique em **Authorize** e cole o
token. A partir daí, todas as rotas podem ser executadas pela própria página.

| Método | Rota | Perfis |
| :---- | :---- | :---- |
| `GET` | `/health` | público |
| `POST` | `/auth/login` | público |
| `GET` | `/users/me` | autenticado |
| `POST` | `/users` | `admin` |
| `POST` | `/patients` | `admin`, `secretary` |
| `GET` | `/patients` | autenticado |
| `GET` | `/patients/{id}` | autenticado |
| `PATCH` | `/patients/{id}` | `admin`, `secretary` |
| `DELETE` | `/patients/{id}` | `admin` |
| `POST` | `/doctors` | `admin` |
| `GET` | `/doctors` | autenticado |
| `GET` | `/doctors/{id}` | autenticado |
| `PUT` | `/doctors/{id}/work-schedule` | `admin` |
| `GET` | `/doctors/{id}/work-schedule` | autenticado |
| `GET` | `/doctors/{id}/calendar?from=&to=` | autenticado |
| `POST` | `/appointments` | `admin`, `secretary` |
| `GET` | `/appointments` | autenticado; `doctor` sem `admin` só vê os próprios |
| `GET` | `/appointments/{id}` | autenticado; `doctor` sem `admin` só o próprio |
| `PATCH` | `/appointments/{id}/status` | conforme a transição |
| `POST` | `/patients/{id}/medical-records` | `doctor` com vínculo |
| `GET` | `/patients/{id}/medical-records` | `doctor` com vínculo, `admin` |

Transições de status permitidas:

| De | Para | Quem pode |
| :---- | :---- | :---- |
| `scheduled` | `in_progress` | o `doctor` da consulta, `admin` |
| `scheduled` | `cancelled` | `admin`, `secretary`, o `doctor` da consulta |
| `in_progress` | `done` | o `doctor` da consulta, `admin` |
| `in_progress` | `cancelled` | `admin`, o `doctor` da consulta |

Toda listagem é paginada (`page`, padrão 1; `pageSize`, padrão 20 e máximo 100) e
responde `{ data, meta: { total, page, pageSize, totalPages } }`.

Todo erro responde `{ statusCode, error, message }`, com `error` vindo do catálogo:

| `error` | Status | Quando |
| :---- | :---- | :---- |
| `DADOS_INVALIDOS` | 400 | entrada fora do formato ou de uma regra de validação |
| `NAO_AUTENTICADO` | 401 | token ausente, inválido ou expirado |
| `CREDENCIAIS_INVALIDAS` | 401 | e-mail ou senha incorretos no login |
| `ACESSO_NEGADO` | 403 | perfil ou posse sem permissão |
| `RECURSO_NAO_ENCONTRADO` | 404 | recurso ou rota inexistente |
| `EMAIL_JA_CADASTRADO` | 409 | e-mail já em uso |
| `CPF_JA_CADASTRADO` | 409 | CPF já em uso |
| `CRM_JA_CADASTRADO` | 409 | CRM já em uso |
| `HORARIO_INDISPONIVEL` | 409 | o médico já tem consulta ativa no período |
| `PACIENTE_INDISPONIVEL` | 409 | o paciente já tem consulta ativa no período |
| `HORARIO_FORA_DA_ESCALA` | 422 | o horário não existe na escala do médico |
| `TRANSICAO_INVALIDA` | 422 | mudança de status não permitida |
| `ERRO_INTERNO` | 500 | falha inesperada (registrada no log) |

## CI/CD

- **PR Validation** (`.github/workflows/pr-workflow.yml`): em todo pull request para a
  `main`, o job `build-and-test` instala as dependências com `npm ci` e executa lint,
  build e `test:cov`. Cobertura abaixo de 80% reprova o job.
- **Deploy** (`.github/workflows/deploy.yml`): a cada push na `main`, ou seja, a cada
  merge de PR, a imagem Docker é construída e publicada no GitHub Container Registry
  (`ghcr.io/<dono>/medclinic-api`, com as tags `latest` e o SHA do commit). Em seguida,
  o workflow chama o deploy hook do Render, guardado no segredo `RENDER_DEPLOY_HOOK_URL`.
  As variáveis da aplicação ficam no painel do Render, nunca no repositório.
- **Proteção da `main`:** a branch não aceita push direto. O merge só acontece por pull
  request, com o check `build-and-test` aprovado.

Na inicialização em produção, a API aplica as migrations pendentes e cria o
administrador inicial com `ADMIN_EMAIL` e `ADMIN_PASSWORD`, se ele ainda não existir.
