# SCTech-ClinicaMedica

## Sobre o projeto

**MedClinic API** é uma API REST para o gerenciamento de uma clínica médica.

Esta etapa do projeto entrega exclusivamente a **base de autenticação e autorização**
do sistema: cadastro de usuários, login com emissão de token JWT, middleware de
autenticação e controle de acesso baseado em perfis (RBAC). As funcionalidades de
domínio da clínica (especialidades, médicos, pacientes, consultas) ficam para uma
etapa futura, sobre esta mesma base de código.

## Tecnologias utilizadas

- Node.js + TypeScript
- Express.js
- TypeORM + PostgreSQL
- JWT (`jsonwebtoken`) para autenticação
- bcrypt (`bcryptjs`) para hash de senha
- class-validator / class-transformer para validação dos DTOs
- Docker / Docker Compose (para subir o PostgreSQL)

## Arquitetura do projeto

A aplicação segue uma arquitetura MVC organizada em camadas, dentro de `clinica/src`:

```
src/
├── server.ts           # ponto de entrada: inicializa o DataSource e o Express
├── config/              # leitura das variáveis de ambiente
├── routes/               # definição dos endpoints e associação aos controllers
├── middlewares/         # autenticação (JWT), autorização (RBAC), validação de DTO e tratamento de erros
├── controllers/         # recebem a requisição HTTP e acionam os services
├── services/            # regras de negócio (cadastro, login, etc.)
├── repositories/        # acesso a dados via TypeORM
├── entities/            # entidades do TypeORM (User)
├── dto/                  # objetos de entrada validados (RegisterDto, LoginDto)
├── enums/                # perfis de acesso (Role)
├── database/             # conexão (DataSource) e migrations
└── utils/                # hash de senha, JWT, tratamento de erros (AppError)
```

## Pré-requisitos

- Node.js instalado
- Docker e Docker Compose (para subir o PostgreSQL) — alternativamente, uma instância
  PostgreSQL própria, ajustando as variáveis de ambiente

## Configuração do banco de dados e variáveis de ambiente

O banco de dados sobe via Docker Compose (`clinica/postgress/docker-compose.yml`),
expondo o PostgreSQL em `localhost:5434` com usuário `admin`, senha `password123` e
banco `sctec`.

As variáveis de ambiente ficam em `clinica/.env` (veja `clinica/.env.example` como
modelo):

| Variável              | Descrição                              | Padrão                         |
| ---------------------- | --------------------------------------- | ------------------------------- |
| `NODE_ENV`              | Ambiente de execução                    | `development`                    |
| `PORT`                  | Porta em que a API escuta                | `3000`                           |
| `DB_HOST`               | Host do PostgreSQL                       | `localhost`                      |
| `DB_PORT`               | Porta do PostgreSQL                      | `5434`                           |
| `DB_USER`               | Usuário do PostgreSQL                    | `admin`                          |
| `DB_PASSWORD`           | Senha do PostgreSQL                      | `password123`                    |
| `DB_NAME`               | Nome do banco de dados                   | `sctec`                          |
| `JWT_SECRET`            | Chave secreta para assinatura do JWT     | `troque-este-valor-em-producao`  |
| `JWT_EXPIRES_IN`        | Tempo de expiração do token               | `1d`                              |
| `BCRYPT_SALT_ROUNDS`    | Custo do hash bcrypt                      | `10`                              |

Defina `JWT_SECRET` com um valor forte em qualquer ambiente que não seja local.

## Como executar

Na raiz do projeto, execute:

```bash
docker compose -f clinica/postgress/docker-compose.yml up -d
cd clinica
npm install
npm run migration:run
npm run build
npm start
```

A migração de usuários **não** roda automaticamente ao iniciar a API — é necessário
executar `npm run migration:run` (ela cria a tabela `users`) antes de subir a
aplicação pela primeira vez, ou sempre que houver uma migration nova.

Para desenvolvimento com reload automático, use `npm run dev` no lugar de
`npm run build` + `npm start` (ainda dentro de `clinica/`).

O servidor será iniciado em `http://localhost:3000`. Para usar outra porta, defina a
variável `PORT` antes de iniciar:

```bash
PORT=4000 npm start
```

## Rotas disponíveis

| Método | Rota              | Autenticação              | Descrição                                  |
| ------ | ------------------ | -------------------------- | -------------------------------------------- |
| GET    | `/`                 | -                           | Confirma que a API está disponível.          |
| GET    | `/health`           | -                           | Retorna o status de saúde da aplicação.      |
| POST   | `/auth/register`    | -                           | Cria um novo usuário.                        |
| POST   | `/auth/login`       | -                           | Autentica e retorna um token JWT.            |
| GET    | `/users/me`         | Bearer token                | Retorna os dados do usuário autenticado.     |
| GET    | `/admin/ping`       | Bearer token + role `ADMIN` | Rota de teste restrita a administradores.    |

As roles disponíveis são: `ADMIN`, `DOCTOR`, `ATTENDANT` e `PATIENT`.

### POST /auth/register

Corpo da requisição:

```json
{
  "name": "Karina Aparecida",
  "email": "karina@example.com",
  "password": "senha12345",
  "role": "PATIENT"
}
```

`role` é opcional (assume `ATTENDANT` se omitido). Valores aceitos: `ADMIN`, `DOCTOR`,
`ATTENDANT`, `PATIENT`.

Resposta `201 Created`:

```json
{
  "id": "b1f3...",
  "name": "Karina Aparecida",
  "email": "karina@example.com",
  "role": "PATIENT",
  "createdAt": "2026-09-11T12:00:00.000Z"
}
```

### POST /auth/login

Corpo da requisição:

```json
{
  "email": "karina@example.com",
  "password": "senha12345"
}
```

Resposta `200 OK`:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { "id": "b1f3...", "name": "Karina Aparecida", "email": "karina@example.com", "role": "PATIENT" }
}
```

Credenciais inválidas retornam `401 Unauthorized` com uma mensagem genérica (não
informa se o e-mail existe ou se a senha está incorreta).

### GET /users/me

Requer header `Authorization: Bearer <token>`.

Resposta `200 OK`:

```json
{
  "id": "b1f3...",
  "name": "Karina Aparecida",
  "email": "karina@example.com",
  "role": "PATIENT",
  "createdAt": "2026-09-11T12:00:00.000Z"
}
```

### GET /admin/ping

Requer header `Authorization: Bearer <token>` de um usuário com `role = ADMIN`.

Resposta `200 OK`:

```json
{
  "message": "pong",
  "requestedBy": { "id": "b1f3...", "email": "admin@example.com", "role": "ADMIN" },
  "timestamp": "2026-09-11T12:00:00.000Z"
}
```

Com um token de usuário que não seja `ADMIN`, a resposta é `403 Forbidden`.

## Testando pelo Postman

Com o servidor rodando em `http://localhost:3000`, siga os passos abaixo no Postman
(ou em qualquer cliente HTTP equivalente, como Insomnia).

### 1. Configure a base URL

Crie uma variável de ambiente/coleção chamada `base_url` com o valor
`http://localhost:3000`, para facilitar a troca de porta/ambiente depois.

### 2. Registrar um usuário

- Método: `POST`
- URL: `{{base_url}}/auth/register`
- Aba **Body** → selecione `raw` → tipo `JSON`:

```json
{
  "name": "Karina Aparecida",
  "email": "karina@example.com",
  "password": "senha12345",
  "role": "PATIENT"
}
```

- Resposta esperada: `201 Created` com os dados do usuário criado.

### 3. Fazer login

- Método: `POST`
- URL: `{{base_url}}/auth/login`
- Aba **Body** → `raw` → `JSON`:

```json
{
  "email": "karina@example.com",
  "password": "senha12345"
}
```

- Resposta esperada: `200 OK` com um token JWT (veja exemplo acima).

Copie o valor do token retornado — ele será usado nas próximas requisições.

Dica: no Postman, você pode salvar o token automaticamente em uma variável de
ambiente adicionando este script na aba **Tests** da requisição de login:

```js
const body = pm.response.json();
pm.environment.set('token', body.token);
```

### 4. Acessar uma rota autenticada

- Método: `GET`
- URL: `{{base_url}}/users/me`
- Aba **Authorization** → tipo `Bearer Token` → cole o token copiado (ou use
  `{{token}}` caso tenha salvado a variável no passo anterior).
  - Alternativa manual: na aba **Headers**, adicione
    `Authorization: Bearer <token>`.

- Resposta esperada: `200 OK` com os dados do usuário autenticado.

### 5. Acessar uma rota restrita por role (ADMIN)

- Método: `GET`
- URL: `{{base_url}}/admin/ping`
- Mesma configuração de autenticação do passo anterior.
- Só retorna `200 OK` se o usuário do token tiver `role = ADMIN`; caso contrário,
  retorna `403 Forbidden`. Para testar, registre/atualize um usuário com essa role.

### Erros comuns

- `401 Unauthorized`: token ausente, inválido ou expirado — refaça o login.
- `403 Forbidden`: token válido, mas o usuário não tem a role exigida pela rota.
- `400 Bad Request`: corpo da requisição não passou na validação (verifique os
  campos exigidos em cada DTO, ex.: senha com no mínimo 8 caracteres).
- `409 Conflict`: tentativa de cadastro com e-mail já existente.

## Testando via curl

Com o servidor rodando em `http://localhost:3000`, os comandos abaixo cobrem o mesmo
fluxo descrito na seção do Postman.

### 1. Registrar um usuário

```bash
curl -i -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Karina Aparecida",
    "email": "karina@sctech.com",
    "password": "senha12345",
    "role": "PATIENT"
  }'
```

- Resposta esperada: `201 Created` com os dados do usuário criado.

### 2. Fazer login

```bash
curl -i -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "karina@sctech.com",
    "password": "senha12345"
  }'
```

- Resposta esperada: `200 OK` com um token JWT (veja exemplo acima).

Para já guardar o token em uma variável e reutilizar nos próximos comandos (requer
`jq` instalado):

```bash
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{ "email": "karina@sctech.com", "password": "senha12345" }' \
  | jq -r '.token')
```

### 3. Acessar uma rota autenticada

```bash
curl -i http://localhost:3000/users/me \
  -H "Authorization: Bearer $TOKEN"
```

- Resposta esperada: `200 OK` com os dados do usuário autenticado.

### 4. Acessar uma rota restrita por role (ADMIN)

```bash
curl -i http://localhost:3000/admin/ping \
  -H "Authorization: Bearer $TOKEN"
```

- Só retorna `200 OK` se o usuário do token tiver `role = ADMIN`; caso contrário,
  retorna `403 Forbidden`. Para testar, registre/atualize um usuário com essa role.

Os mesmos erros descritos em [Erros comuns](#erros-comuns) se aplicam aqui.
