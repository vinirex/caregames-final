<div align="center">
  <img src="./assets/icon.png" width="150" alt="CareGames+ Logo" />
  
  # 📘 CareGames+

  *Portal de Saúde, Bem-Estar e Gamificação Cyber-Athletic*
</div>

## 👥 Integrantes do Projeto

* Vinicius Silva RM553240
* Victor Didoff RM552965
* Matheus Zottiz RM94119
* Diogo Julio RM553837
* Jonata Rafael RM552939

---

## 📱 Sobre o Projeto

**CareGames+** é um aplicativo mobile desenvolvido com **React Native**, **Expo** (SDK 52), **Expo Router** e **NativeWind (TailwindCSS)**.

A plataforma permite que os usuários invistam em sua saúde, acompanhem seu progresso e participem de rankings competitivos em tempo real. O aplicativo utiliza a gamificação para promover hábitos saudáveis, hidratação, exercícios físicos e cuidado com a saúde mental.

### ✨ Destaques da Versão Atual (Cyber-Athletic Pro)
* 🎨 **Design System Cyber-Athletic Pro**: Interface moderna com vidro fosco (glassmorphic cards), acentos em neon ciano/azul, modo escuro/claro dinâmico e tipografia com Google Fonts (`Sora`, `Hanken Grotesk`, `JetBrains Mono`).
* 🔔 **Pop-up de Notificações Independente**: Modal dedicado acionado pelo ícone de sino no topo, com contadores de não lidas, alertas de hidratação/ranking e botão "Marcar todas como lidas".
* 👤 **Menu Dropdown de Perfil & Compartilhamento**: Menu flutuante com foto de perfil customizável da galeria, dados do usuário e recurso **"Convidar Amigo"** via API nativa `Share`.
* 🛡️ **Guarda de Autenticação (Auth Guard)**: Redirecionamento automático para a tela de login (`/`) ao realizar logout, limpando totalmente o cache local do `AsyncStorage`.
* 🇧🇷 **100% Traduzido para Português (pt-BR)**: Interface, navegação, alertas, notificações e botões inteiramente em português.

---

## 🚀 Iniciando

Siga as instruções para rodar o projeto localmente em modo de desenvolvimento.

### ✅ Pré-requisitos

* **Node.js** (versão LTS recomendada)
* **npm** ou **yarn**
* **Expo CLI** (integrado no npx/expo)
* **Expo Go** (no celular para testar) ou emulador Android/iOS

---

## 📦 Instalação

1. Clone o repositório:

```sh
git clone <caregames-final>
```

2. Acesse o diretório do projeto:

```sh
cd care-games-final
```

3. Instale as dependências:

```sh
npm install
```

---

## ▶️ Scripts Disponíveis

No diretório do projeto, execute:

* `npm start`
  Inicia o projeto no modo desenvolvimento com Expo Dev Server.

  * Leia o QR code com o **Expo Go**
  * Pressione `a` para abrir no Android
  * Pressione `i` para abrir no iOS
  * Pressione `w` para abrir na Web

* `npm run android`
  Roda o app em um dispositivo/emulador Android conectado.

* `npm run ios`
  Roda o app no simulador iOS (macOS necessário).

* `npm run web`
  Abre a versão web no navegador.

---

## 📂 Estrutura do Projeto

O projeto utiliza **Expo Router**, onde arquivos em `app/` definem rotas de navegação.

```
caregames-final/
├── .expo/                    # Arquivos internos do Expo
├── app/                      # Rotas e telas do aplicativo
│   ├── home/                 # Grupo de rotas autenticadas (Drawer)
│   │   ├── _layout.tsx       # Auth Guard + Layout Drawer
│   │   ├── homeScreen.tsx    # Tela Principal (Dashboard)
│   │   ├── settings.tsx      # Configurações do App
│   │   ├── profile.tsx       # Perfil do Usuário (edição de dados)
│   │
│   ├── _layout.tsx           # Root Layout (Providers + Splash + Fonts)
│   ├── index.tsx             # Tela de Login (Redirecionamento automático)
│   ├── register.tsx          # Tela de Cadastro de Usuário
│   ├── rankings.tsx          # Tela: Ranking Global de Saúde
│   ├── wearables.tsx         # Tela: Conexão IoT & Wearables (Passos/BPM)
│   ├── desafios.tsx          # Tela: Desafios Diários e Conclusão
│   ├── beneficios.tsx        # Tela: Benefícios e Resgate por Pontos
│
├── assets/                   # Ícones, imagens e recursos gráficos
│
├── components/               # Componentes reutilizáveis
│   ├── TopAppBar.tsx         # Barra superior com notificações e menu dropdown
│   ├── BottomNav.tsx         # Barra de navegação inferior em abas
│   ├── CustomButton.tsx      # Botão estilizado com acento neon
│   ├── Container.tsx         # Container com padding responsivo
│
├── context/                  # Contextos globais (Estado da aplicação)
│   ├── AuthContext.tsx       # Sessão do usuário + AsyncStorage logout
│   ├── PointsContext.tsx     # Pontuação ativa, histórico e sincronização
│   ├── ThemeContext.tsx      # Alternância de tema Dark/Light
│
├── services/                 # Serviços e APIs
│   ├── api.ts                # API simulada com persistência em AsyncStorage
│   ├── IoTService.ts         # Serviço IoT via WebSocket (telemetria em tempo real)
│
├── global.css                # Estilos globais Tailwind + Google Fonts
├── tailwind.config.js        # Configuração do Design System Cyber-Athletic
├── package.json              # Dependências do projeto
└── tsconfig.json             # Configuração TypeScript
```

---

## 📑 Descrição das Telas

### `/app/index.tsx` — **Login**
* Autenticação com e-mail e senha forte.
* Validação de campos e feedback de erros.
* **Auto-redirect**: se já houver uma sessão ativa no `AsyncStorage`, redireciona diretamente para a `/home`.

### `/app/register.tsx` — **Cadastro**
* Registro de novos usuários com validação completa de idade e requisitos de senha.
* Persiste novo usuário no banco de dados simulado (`services/api.ts`).

### `/app/home/homeScreen.tsx` — **Início (Dashboard)**
* Resumo diário do usuário: passos, meta de água e pontuação total.
* Cartões interativos para acesso rápido a Desafios, Ranking, Dispositivos e Benefícios.
* Integração com `TopAppBar` e `BottomNav`.

### `/app/desafios.tsx` — **Desafios**
* Desafios diários de saúde (caminhada, hidratação, meditação) com pontuação ao concluir.
* Suporte a upload de foto de comprovação via `expo-image-picker`.
* Atualiza a pontuação global e persiste em tempo real no `PointsContext`.

### `/app/rankings.tsx` — **Rankings**
* Leaderboard global com posições dos usuários e temporada ativa.
* Posição dinâmica calculada a partir dos pontos reais do usuário logado.

### `/app/wearables.tsx` — **Dispositivos (IoT)**
* Conexão em tempo real via WebSocket com simulação de wearable fitness.
* Exibe métricas de frequência cardíaca (BPM) e passos contados ao vivo.

### `/app/beneficios.tsx` — **Benefícios**
* Loja de recompensas (descontos em academias, consultas e produtos).
* Validação de saldo de pontos para resgate imediato.

### `/app/home/profile.tsx` — **Perfil**
* Edição de nome, data de nascimento e endereço.
* Alteração de foto de perfil com salvar automático no `AsyncStorage`.
* Botão de logout com confirmação e limpeza total de cache.

---

## 📸 Imagens das Telas

<div align="center">
  <img src="https://github.com/user-attachments/assets/2960d58d-c8ef-4847-97fa-462c341d5f04" width="220" alt="logo" />
  <img src="https://github.com/user-attachments/assets/91edaa47-d846-4b59-b6a6-e37a79047d48" width="220" alt="home" />
  <img src="https://github.com/user-attachments/assets/e53d48a5-43bc-4f0c-a335-4e4ab03162dd" width="220" alt="IOT" />
  <img src="https://github.com/user-attachments/assets/d2f24550-b642-44db-8419-2b51d0556057" width="220" alt="challenges" />
  <img src="https://github.com/user-attachments/assets/63acb2a0-87cf-4452-bdb6-d3ad2f18bd2e" width="220" alt="login" />
  <img src="https://github.com/user-attachments/assets/fa3235f0-c5ce-4a1a-9165-ded0dd6698fa" width="220" alt="register" />
</div>

---

## 🎥 Vídeo de Demonstração

<a href="https://www.youtube.com/shorts/ahtzK5m1Sm8">
  <img src="https://img.youtube.com/vi/ahtzK5m1Sm8/0.jpg" width="300" alt="Vídeo YouTube Shorts">
</a>

---

## 🆕 Novas Funcionalidades

### 🔔 Pop-up de Notificações
* Sino de notificações no `TopAppBar` abre um modal dedicado com acento Cyber-Athletic.
* Badge dinâmico de contagem de notificações não lidas.
* Opção **"Marcar todas como lidas"**.

### 👤 Menu Dropdown de Perfil & Compartilhamento
* Clique na foto/nome abre menu flutuante.
* Alteração de foto de perfil direta pela câmera/galeria via `expo-image-picker`.
* Opção **"Convidar Amigo"** via `Share.share` nativo.

### 🔐 Autenticação & Cache Reset
* Ao clicar em **"Sair da Conta"**, o método `logout()` executa `AsyncStorage.clear()`.
* O `DrawerLayout` em `app/home/_layout.tsx` detecta a mudança e redireciona automaticamente com `<Redirect href="/" />`.

---

## 🧭 Tecnologias Utilizadas

* **React Native / Expo SDK 52**
* **Expo Router** (File-based Routing)
* **NativeWind / TailwindCSS**
* **Google Fonts (`Sora`, `Hanken Grotesk`, `JetBrains Mono`)**
* **AsyncStorage** (Persistência Local)
* **WebSocket / IoTService** (Telemetria em Tempo Real)
* **Expo Image Picker & Share API**
