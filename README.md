<div align="center">
  <img src="./assets/icon.png" width="150" alt="CareGames+ Logo" />
  
  # 📘 CareGames+
</div>

## 👥 Integrantes do Projeto

* Vinicius Silva RM553240
* Victor Didoff RM552965
* Matheus Zottiz RM94119
* Diogo Julio RM94119
* Jonata Rafael RM552939
---

## 📱 Sobre o Projeto

**CareGames+** é um aplicativo mobile desenvolvido com **React Native**, **Expo** e Expo Router.
A plataforma permite que os usuários invistam em sua saúde, acompanhem seu progresso e participem de rankings competitivos.
O aplicativo tem como principal objetivo incentivar hábitos saudáveis por meio da gamificação, promovendo também o cuidado com a saúde mental de forma interativa e motivadora.
Além disso, o app é integrado a dispositivos wearables e conta com um sistema de recompensas, que estimula os usuários a manterem consistência em suas atividades e metas de saúde.

---

## 🚀 Iniciando

Siga as instruções para rodar o projeto localmente em modo de desenvolvimento.

### ✅ Pré-requisitos

* **Node.js** (versão LTS recomendada)
* **npm** ou **yarn**
* **Expo CLI** (opcional, mas útil)
* **Expo Go** (no celular para testar) ou emulador Android/iOS

---

## 📦 Instalação

1. Clone o repositório:

```sh
git clone <seu-repositorio>
```

2. Acesse o diretório do projeto:

```sh
cd my-expo-app
```

3. Instale as dependências:

```sh
npm install
# ou
yarn install
```

---

## ▶️ Scripts Disponíveis

No diretório do projeto, execute:

* `npm start`
  Inicia o projeto no modo desenvolvimento (abre Expo Developer Tools).

  * Leia o QR code com o **Expo Go**
  * Pressione `a` para abrir no Android
  * Pressione `i` para abrir no iOS

* `npm run android`
  Roda o app em um dispositivo/emulador Android conectado.

* `npm run ios`
  Roda o app no simulador iOS (macOS necessário).

* `npm run web`
  Abre a versão web (se configurado).

---

## 📂 Estrutura do Projeto

O projeto usa **Expo Router**, portanto arquivos dentro de `app/` viram automaticamente rotas.

```
caregames-final/
├── .expo/                    # Arquivos internos gerados pelo Expo
├── app/                      # Rotas e telas do aplicativo
│   ├── home/                 # Seção Home (rotas agrupadas)
│   │   ├── _layout.tsx       # Layout da Home (Drawer + navegação)
│   │   ├── homeScreen.tsx    # Tela principal Home
│   │   ├── settings.tsx      # Tela: Configurações (Dark Mode)
│   │   ├── profile.tsx       # Tela: Perfil do Usuário (upload de foto)
│   │
│   ├── _layout.tsx           # Layout raiz (Providers globais)
│   ├── index.tsx             # Tela de Login (rota inicial)
│   ├── register.tsx          # Tela de Cadastro de Usuário
│   ├── rankings.tsx          # Tela: Ranking de Usuários
│   ├── wearables.tsx         # Tela: Conexão IoT com wearable (WebSocket)
│   ├── desafios.tsx          # Tela: Lista de Desafios (com upload de foto)
│   ├── beneficios.tsx        # Tela: Benefícios e resgate por pontos
│
├── assets/                   # Imagens, ícones, fontes
│   ├── images/
│
├── components/               # Componentes reutilizáveis
│   ├── Container.tsx
│   ├── CustomButton.tsx
│   ├── EditScreenInfo.tsx
│   ├── ScreenContent.tsx
│
├── context/                  # Contextos globais (estado da aplicação)
│   ├── AuthContext.tsx       # Autenticação + sessão persistida (AsyncStorage)
│   ├── PointsContext.tsx     # Sistema de pontos (gamificação)
│   ├── ThemeContext.tsx      # Tema claro/escuro persistido (AsyncStorage)
│   ├── theme.ts              # Definição de cores dos temas
│
├── services/                 # Serviços e integrações
│   ├── api.ts                # API simulada (banco de dados via AsyncStorage)
│   ├── IoTService.ts         # Serviço IoT via WebSocket (dados em tempo real)
│
├── node_modules/             # Dependências instaladas
├── .gitignore                # Arquivos ignorados pelo Git
├── app.json                  # Configuração do Expo
├── babel.config.js           # Configuração do Babel (nativewind/expo)
├── package.json              # Metadados e dependências do projeto
└── tsconfig.json             # Configuração do TypeScript
```

---

## 📑 Descrição das Telas (pasta `app`)

### `/app/index.tsx` — **Login**

* Tela inicial do aplicativo.
* Realiza autenticação e valida credenciais do usuário.
* Validação de e-mail, senha forte e idade mínima (18 anos).
* **Sessão persistida com AsyncStorage** — se o usuário já estiver logado, redireciona automaticamente para `/home`.
* Integra `AuthContext` para gerenciar sessão e `api.ts` para autenticação no banco simulado.

### `/app/register.tsx` — **Cadastro**

* Tela de registro de novos usuários.
* Validação completa de campos (e-mail, senha forte, idade).
* **Salva credenciais no banco de dados simulado via API** (`AsyncStorage`).
* Redireciona para a tela de login após cadastro bem-sucedido.

### `/app/home/homeScreen.tsx` — **Home**

* Tela principal após autenticação.
* Exibe saudação personalizada, pontuação atual e progresso do usuário.
* Botões de navegação rápida para Desafios, Ranking, Wearables e Benefícios.
* **Botão de logout** com confirmação para sair da conta.
* Tema dinâmico via `ThemeContext`.

### `/app/home/settings.tsx` — **Configurações**

* Gerencia preferências do usuário (modo escuro/claro).
* Integrada com `ThemeContext` para alternância de tema.
* **Preferência de tema persistida com AsyncStorage** por usuário.

### `/app/home/profile.tsx` — **Perfil**

* Exibe informações do usuário logado (nome, e-mail, aniversário, endereço).
* **Upload de foto de perfil** via `expo-image-picker` (acesso à galeria nativa).
* **Foto salva localmente no AsyncStorage** para carregamento instantâneo.
* **Foto enviada para a API simulada** para persistência no banco de dados.
* **Botão de logout** com confirmação.

### `/app/desafios.tsx` — **Desafios**

* Lista desafios disponíveis com pontuação associada.
* Cada desafio exibe descrição e recompensa em pontos.
* **Desafios com comprovação por foto** via `expo-image-picker`.
* Integrado com `PointsContext` para atualizar pontuação ao completar.

### `/app/rankings.tsx` — **Ranking**

* Leaderboard de usuários ordenado por pontuação.
* Consome dados do `PointsContext`.
* Destaca posição do usuário atual ("Você").

### `/app/wearables.tsx` — **Wearables (IoT)**

* **Conexão em tempo real via WebSocket** com servidor de eco.
* Simula recebimento de dados IoT de um wearable (passos, BPM).
* Dados atualizados automaticamente a cada 3 segundos.
* Pontos adicionados dinamicamente conforme passos recebidos.
* Instruções de integração com broker MQTT real documentadas no código.

### `/app/beneficios.tsx` — **Benefícios**

* Catálogo de resgates disponíveis (spa, massagem, nutricionista, academia).
* Exibe custo em pontos para cada benefício.
* Integrado com `PointsContext` para validar saldo antes de resgate.

### `/app/home/_layout.tsx` — **Layout da Home**

* Define navegação via Drawer para seções internas de Home (Início, Perfil, Configurações).
* Providers globais configurados em nível raiz (`app/_layout.tsx`).


⭐ Imagens das Telas
<div align="center">
  <img src="https://github.com/user-attachments/assets/2cc39b73-f94d-4c28-899e-96e55a0fb71e" width="220" />
  <img src="https://github.com/user-attachments/assets/91edaa47-d846-4b59-b6a6-e37a79047d48" width="220" alt="home" />
  <img src="https://github.com/user-attachments/assets/e53d48a5-43bc-4f0c-a335-4e4ab03162dd" width="220" alt="IOT" />
  <img src="https://github.com/user-attachments/assets/d2f24550-b642-44db-8419-2b51d0556057" width="220" alt="challenges" />
  <img src="https://github.com/user-attachments/assets/2960d58d-c8ef-4847-97fa-462c341d5f04" width="220" alt="logo" />
  <img src="https://github.com/user-attachments/assets/41373d5b-e31a-487a-9dd0-37314348e845" width="220" alt="login" />
  <img src="https://github.com/user-attachments/assets/fa3235f0-c5ce-4a1a-9165-ded0dd6698fa" width="220" alt="register" />
  <img src="https://github.com/user-attachments/assets/3cd78d73-bb19-4420-b41a-aad395d7ad72" width="220" />
  <img src="https://github.com/user-attachments/assets/92355a6c-0bfb-4d5c-b2d2-986d9cc0aa61" width="220" />
  <img src="https://github.com/user-attachments/assets/431ab2a5-e166-4c74-a885-69c12fa00ede" width="220" />
  <img src="https://github.com/user-attachments/assets/c307bb41-0fd2-4fbe-b7f7-2aba6409b7b0" width="220" />
  <img src="https://github.com/user-attachments/assets/41fdd077-4066-4afb-94f8-e0d4b836e04e" width="220" />
  <img src="https://github.com/user-attachments/assets/1780072d-6060-449e-8316-2415112214d6" width="220" />
</div>


## 🎥 Vídeo de Demonstração

<a href="https://www.youtube.com/shorts/dlENchEyoeY">
  <img src="https://img.youtube.com/vi/dlENchEyoeY/0.jpg" width="300" alt="Vídeo YouTube Shorts">
</a>


</div>

---

## 🆕 Funcionalidades da Sprint 4

### 📦 Persistência de Dados com AsyncStorage

* **Sessão do usuário** — Login persistido, o app lembra do usuário logado ao reabrir.
* **Preferência de tema** — Dark mode salvo por usuário, carregado automaticamente.
* **Foto de perfil** — URI da foto salva localmente por usuário para carregamento instantâneo.
* **Banco de dados simulado** — Credenciais e dados de perfil salvos em AsyncStorage simulando um backend.

### 🔌 Integração com API Simulada (`services/api.ts`)

* `register(email, password, age)` — Cadastro de novos usuários no banco simulado.
* `login(email, password)` — Autenticação com validação de credenciais.
* `uploadProfilePhoto(email, photoUri)` — Upload de foto de perfil para o banco.
* `getProfilePhoto(email)` — Recuperação de foto de perfil do banco.
* Usuário de teste padrão: `test@test.com` / `Test1234`.

### 📷 Integração com API Nativa — `expo-image-picker`

* **Foto de perfil** — Usuário pode selecionar foto da galeria com recorte 1:1.
* **Comprovação de desafios** — Alguns desafios exigem foto como prova de conclusão.
* Permissões de acesso à galeria solicitadas automaticamente.

### 🌐 Comunicação em Tempo Real — WebSocket (IoT)

* **Serviço IoT** (`services/IoTService.ts`) conecta via WebSocket a um servidor de eco.
* Simula recebimento de dados de um wearable: **passos**, **BPM** e **temperatura**.
* Dados atualizados a cada 3 segundos em tempo real.
* Código documentado com instruções para integração com broker **MQTT real** (ex.: `test.mosquitto.org`).

### 🔐 Autenticação Completa

* Registro e login com validação de e-mail, senha forte e idade.
* Logout com confirmação disponível na Home e no Perfil.
* Sessão persistida — não precisa logar novamente ao reabrir o app.

---

## 🧭 Boas práticas e observações

* Use o `ThemeContext` para alternar tema claro/escuro globalmente.
* Use `NativeWind` (Tailwind) com `NativeWindStyleSheet.setOutput({ default: "native" })` no ponto de entrada para garantir `className` funcionando.
* Evite colocar classes de layout diretamente em `ScrollView`; use `contentContainerStyle` ou um `View` interno.
* Para sombras cross-platform, aplique `shadow-*` em `View` e `elevation` para Android; `TouchableOpacity` não recebe sombra diretamente.
* Arquivos em `app/` criam rotas automaticamente com Expo Router; use `_layout.tsx` para layouts e providers de rota.
* Contextos utilizam `useCallback` e `useMemo` para otimização de performance e evitar re-renders desnecessários.
