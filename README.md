# 📘 CareGames

## 👥 Integrantes do Projeto

* Vinicius Silva RM553240
* Victor Didoff RM552965
* Matheus Zottiz RM94119
* Diogo Julio RM94119
* Jonata Rafael RM552939
---

## 📱 Sobre o Projeto

**CareGames** é um aplicativo mobile desenvolvido com **React Native**, **Expo** e **Expo Router**.
O app permite que usuários explorem cursos, acompanhem progresso, disputem rankings e desenvolvam habilidades essenciais para o mercado de trabalho do futuro, com foco em gamificação e saúde mental.

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
│   ├── wearables.tsx         # Tela: Conexão com wearable
│   ├── desafios.tsx          # Tela: Lista de Desafios e pontos
│   ├── beneficios.tsx        # Tela: Lista de Beneficios e seus preços/pontos necessários
│
├── assets/                   # imagens, ícones, fontes
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

⭐ Imagens das Telas
<div align="center">
  
![Screenshot_20251127_131452_Expo Go](https://github.com/user-attachments/assets/2cc39b73-f94d-4c28-899e-96e55a0fb71e) width="30"
![Screenshot_20251127_131438_Expo Go](https://github.com/user-attachments/assets/88d188aa-20be-49a5-96de-db205f699005) width="30"
![Screenshot_20251126_234624_Expo Go](https://github.com/user-attachments/assets/3cd78d73-bb19-4420-b41a-aad395d7ad72) width="30"
![Screenshot_20251126_234613_Expo Go](https://github.com/user-attachments/assets/92355a6c-0bfb-4d5c-b2d2-986d9cc0aa61) width="30"
![Screenshot_20251126_234601_Expo Go](https://github.com/user-attachments/assets/431ab2a5-e166-4c74-a885-69c12fa00ede) width="30"
![Screenshot_20251126_234555_Expo Go](https://github.com/user-attachments/assets/c307bb41-0fd2-4fbe-b7f7-2aba6409b7b0) width="30"
![Screenshot_20251126_234530_Expo Go](https://github.com/user-attachments/assets/41fdd077-4066-4afb-94f8-e0d4b836e04e) width="30"
![Screenshot_20251126_234516_Expo Go](https://github.com/user-attachments/assets/1780072d-6060-449e-8316-2415112214d6) width="30"
</div>


## 🎥 Vídeo de Demonstração

<div align="center">
<a href="[URL_DO_VIDEO_DEMONSTRACAO]">
  <img src="[URL_DA_THUMBNAIL_DO_VIDEO]" width="300" />
</a>

</div>


## 🧭 Boas práticas e observações

* Use o `ThemeContext` para alternar tema claro/escuro globalmente.
* Use `NativeWind` (Tailwind) com `NativeWindStyleSheet.setOutput({ default: "native" })` no ponto de entrada para garantir `className` funcionando.
* Evite colocar classes de layout diretamente em `ScrollView`; use `contentContainerStyle` ou um `View` interno.
* Para sombras cross-platform, aplique `shadow-*` em `View` e `elevation` para Android; `TouchableOpacity` não recebe sombra diretamente.
* Arquivos em `app/` criam rotas automaticamente com Expo Router; use `_layout.tsx` para layouts e providers de rota.
