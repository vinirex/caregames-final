# 📘 Future Skillzz

## 👥 Integrantes do Projeto

* Vinicius Silva RM553240
* Victor Didoff RM552965
* Matheus Zottiz RM94119
---

## 📱 Sobre o Projeto

**Future Skillzz** é um aplicativo mobile desenvolvido com **React Native**, **Expo** e **Expo Router**.
O app permite que usuários explorem cursos, acompanhem progresso, disputem rankings e desenvolvam habilidades essenciais para o mercado de trabalho do futuro.

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
my-expo-app/
├── .expo/                    # Arquivos internos gerados pelo Expo
├── app/                      # Rotas e telas do aplicativo
│   ├── home/                 # Seção Home (rotas agrupadas)
│   │   ├── _layout.tsx       # Layout da Home (Stack/Drawer/tema)
│   │   ├── homeScreen.tsx    # Tela principal Home
│   │   ├── settings.tsx      # Tela: Configurações (Dark Mode)
│   │   ├── profile.tsx       # Tela: Informações de Usuário
│   │
│   ├── index.tsx             # Tela de Login (rota inicial)
│   ├── rankings.tsx          # Tela: Ranking de Usuários
│   ├── courses.tsx           # Tela: Lista de Cursos
│
├── assets/                   # Vídeos, imagens, ícones, fontes
│   ├── videos/
│   ├── images/
│
├── components/               # Componentes reutilizáveis
│   ├── Container.tsx
│   ├── CustomButton.tsx
│   ├── EditScreenInfo.tsx
│   ├── ScreenContent.tsx
│
├── context/                  # Contextos globais
│   ├── AuthContext.tsx
│   ├── PointsContext.tsx
│   ├── ThemeContext.tsx
│   ├── theme.ts
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
* Realiza autenticação (placeholder) e redireciona para `/home`.
* Integração com `AuthContext` para armazenar informações do usuário.

### `/app/home/homeScreen.tsx` — **Home**

* Tela principal após login.
* Exibe vídeo de fundo, boas-vindas, botões de navegação (Cursos, Ranking) e pontuação do usuário.

### `/app/courses.tsx` — **Cursos**

* Lista os cursos disponíveis.
* Cada card abre os detalhes do curso.
* Implementado com `ScrollView` e compatível com tema claro/escuro.

### `/app/rankings.tsx` — **Ranking**

* Exibe o ranking de usuários (leaderboard).
* Usa `PointsContext` para obter a pontuação dos usuários.

### `/app/home/_layout.tsx` — **Layout da Home**

* Define a navegação (Drawer/Stack) para a área de Home.
* Não deve duplicar providers (ThemeProvider deve ser global em `app/_layout.tsx` quando aplicável).

⭐ Imagem das Telas
<div align="center"> <img src="https://github.com/user-attachments/assets/80e2857e-8d30-457e-82f3-dd260ab08e64" width="300" /> <img src="https://github.com/user-attachments/assets/f694e7dd-28bf-464c-bec5-25fdb261317d" width="300" /> <img src="https://github.com/user-attachments/assets/e00f84d6-5e29-4ba2-aa12-92f78ba6527e" width="300" /> <img src="https://github.com/user-attachments/assets/cd7e52fe-c830-4979-a09b-490416917e95" width="300" /> <img src="https://github.com/user-attachments/assets/468ed70b-0928-49d1-b92d-666a011c1cfb" width="300" /> <img src="https://github.com/user-attachments/assets/f5d0960a-88b6-4691-9361-86810d2efc66" width="300" /> <img src="https://github.com/user-attachments/assets/e073cc18-c1a3-4ab6-bbdc-06f0e6c24c0f" width="300" /> <img src="https://github.com/user-attachments/assets/1ab0c957-aff8-4a3a-b03d-2b0fcf831f61" width="300" /> 
</div>


## 🎥 Vídeo de Demonstração

<div align="center">

<a href="https://youtube.com/shorts/mH-3y1-NzCU?feature=share">
  <img src="https://img.youtube.com/vi/mH-3y1-NzCU/0.jpg" width="300" />
</a>

</div>


## 🧭 Boas práticas e observações

* Use o `ThemeContext` para alternar tema claro/escuro globalmente.
* Use `NativeWind` (Tailwind) com `NativeWindStyleSheet.setOutput({ default: "native" })` no ponto de entrada para garantir `className` funcionando.
* Evite colocar classes de layout diretamente em `ScrollView`; use `contentContainerStyle` ou um `View` interno.
* Para sombras cross-platform, aplique `shadow-*` em `View` e `elevation` para Android; `TouchableOpacity` não recebe sombra diretamente.
* Arquivos em `app/` criam rotas automaticamente com Expo Router; use `_layout.tsx` para layouts e providers de rota.

