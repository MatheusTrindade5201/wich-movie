# 🎬 Which Movie

Uma aplicação inteligente de recomendação de filmes que utiliza IA para analisar suas preferências e sugerir filmes personalizados. Desenvolvida com React, TypeScript e integração com a API do TMDB.

## ✨ Funcionalidades

### 🎯 **Recomendação Inteligente**

- **Sugestão Personalizada**: Receba recomendações baseadas nos filmes que você já assistiu
- **Filtros por Gênero**: Inclua ou exclua gêneros específicos
- **Informações Completas**: Poster, sinopse, trailers e onde assistir

### 📊 **Análise de Preferências**

- **Dashboard de Análise**: Visualize estatísticas detalhadas dos seus filmes assistidos
- **Gráficos de Gêneros**: Veja quais gêneros você mais consome
- **Análise de Avaliações**: Estatísticas de suas notas e preferências
- **Recomendações IA**: Sugestões personalizadas geradas por inteligência artificial

### 🎭 **Gestão de Filmes**

- **Lista de Assistidos**: Mantenha um registro dos filmes que você assistiu
- **Sistema de Avaliação**: Avalie filmes de 1 a 5 estrelas
- **Histórico Completo**: Visualize todos os filmes assistidos e recomendados
- **Adicionar/Remover**: Controle total sobre sua lista pessoal

### 🎨 **Interface Moderna**

- **Tema Escuro**: Interface elegante com tema escuro
- **Design Responsivo**: Funciona perfeitamente em desktop e mobile
- **Componentes Modernos**: UI construída com Material-UI e Tailwind CSS
- **Animações Suaves**: Transições e feedback visual aprimorados

### 🔧 **Funcionalidades Avançadas**

- **Sugestão de Gêneros**: IA sugere gêneros baseado em suas preferências
- **Zona de Conforto vs Experiência Nova**: Escolha entre filmes similares ou explore novos gêneros
- **Análise de Reviews**: IA analisa reviews de filmes para você
- **Provedores de Streaming**: Veja onde assistir cada filme

## 🚀 Tecnologias Utilizadas

### **Frontend**

- **React 18** com TypeScript
- **Material-UI (MUI)** para componentes
- **Tailwind CSS** para estilização
- **Vite** para build e desenvolvimento
- **TanStack Query** para gerenciamento de estado

### **Backend**

- **Deco Platform** com Cloudflare Workers
- **Drizzle ORM** com SQLite
- **Zod** para validação de schemas
- **TMDB API** para dados de filmes
- **OpenAI GPT** para análises com IA

### **Infraestrutura**

- **Cloudflare Workers** para deploy
- **Durable Objects** para persistência
- **Model Context Protocol (MCP)** para comunicação

## 🛠️ Instalação e Configuração

### **Pré-requisitos**

- Node.js ≥18.0.0
- npm ≥8.0.0
- [Deco CLI](https://deco.chat): `deno install -Ar -g -n deco jsr:@deco/cli`

### **Setup Inicial**

```bash
# Clone o repositório
git clone <repository-url>
cd which-movie

# Instale as dependências
npm install

# Configure a aplicação
npm run configure

# Configure a API key do TMDB
# (será solicitado durante o primeiro uso)
```

### **Configuração da API TMDB**

1. Acesse [TMDB](https://www.themoviedb.org/settings/api)
2. Crie uma conta e solicite uma API key
3. Use a tool `SET_TMDB_API_KEY` na aplicação para configurar

## 🚀 Desenvolvimento

### **Comandos Disponíveis**

```bash
# Iniciar desenvolvimento
npm run dev

# Gerar tipos para integrações externas
npm run gen

# Gerar tipos para suas próprias tools/workflows
npm run gen:self

# Deploy para produção
npm run deploy
```

### **Estrutura do Projeto**

```
which-movie/
├── server/                 # Backend (MCP Server)
│   ├── main.ts            # Ponto de entrada do servidor
│   ├── tools.ts           # Tools do MCP (recomendações, análise, etc.)
│   ├── workflows.ts       # Workflows complexos
│   ├── schema.ts          # Schema do banco de dados
│   ├── db.ts              # Configuração do banco
│   └── deco.gen.ts        # Tipos gerados automaticamente
├── view/                  # Frontend (React)
│   ├── src/
│   │   ├── App.tsx        # Componente principal
│   │   ├── lib/
│   │   │   ├── rpc.ts     # Cliente RPC tipado
│   │   │   └── hooks.ts   # Hooks personalizados
│   │   └── main.tsx       # Ponto de entrada React
│   └── package.json
└── package.json           # Workspace principal
```

## 🎯 Como Usar

### **1. Primeiro Acesso**

- Configure sua API key do TMDB
- Explore os gêneros disponíveis
- Receba sua primeira recomendação

### **2. Construindo seu Perfil**

- Adicione filmes que você assistiu
- Avalie os filmes (1-5 estrelas)
- Explore diferentes gêneros

### **3. Análise e Insights**

- Use o botão "Análise dos Filmes Assistidos"
- Visualize estatísticas detalhadas
- Receba recomendações personalizadas

### **4. Sugestões Inteligentes**

- Escolha entre "Zona de Conforto" ou "Experiência Nova"
- Receba sugestões de gêneros baseadas em IA
- Explore filmes similares ou completamente diferentes

## 🔧 Tools Disponíveis

### **Recomendação de Filmes**

- `RECOMMEND_MOVIE`: Recomenda filmes com filtros de gênero
- `LIST_MOVIE_GENRES`: Lista todos os gêneros disponíveis
- `GET_MOVIE_REVIEWS`: Analisa reviews de filmes com IA

### **Gestão de Filmes**

- `GET_WATCHED_MOVIES`: Lista filmes assistidos
- `ADD_WATCHED_MOVIE`: Adiciona filme à lista
- `REMOVE_WATCHED_MOVIE`: Remove filme da lista
- `UPDATE_MOVIE_RATING`: Atualiza avaliação de filme

### **Análise e IA**

- `ANALYZE_WATCHED_MOVIES`: Análise completa com IA
- `SUGGEST_GENRES`: Sugestões de gêneros personalizadas

### **Configuração**

- `SET_TMDB_API_KEY`: Configura API key do TMDB

## 🎨 Interface

### **Tema Escuro**

- Interface elegante com cores escuras
- Contraste otimizado para leitura
- Componentes Material-UI adaptados

### **Componentes Principais**

- **Cards de Filmes**: Exibição rica com poster, título e ações
- **Modal de Histórico**: Visualização organizada por abas
- **Modal de Análise**: Dashboard com gráficos e estatísticas
- **Sistema de Avaliação**: Estrelas interativas
- **Chips de Gêneros**: Labels visuais para categorias

### **Responsividade**

- Layout adaptativo para diferentes telas
- Navegação otimizada para mobile
- Componentes que se ajustam automaticamente

## 🔍 Funcionalidades Detalhadas

### **Sistema de Recomendação**

1. **Filtros Inteligentes**: Inclua gêneros que gosta, exclua os que não gosta
2. **Popularidade**: Recomendações baseadas em filmes populares
3. **Provedores**: Mostra onde assistir cada filme
4. **Trailers**: Links diretos para trailers no YouTube

### **Análise com IA**

1. **Análise Geral**: Resumo das suas preferências
2. **Estatísticas de Avaliação**: Média, distribuição de notas
3. **Gráficos de Gêneros**: Visualização das suas preferências
4. **Recomendações Personalizadas**: Sugestões baseadas em IA

### **Gestão de Estado**

- **Loading States**: Feedback visual para todas as ações
- **Error Handling**: Tratamento elegante de erros
- **Optimistic Updates**: Interface responsiva
- **Cache Inteligente**: Dados em cache para performance

## 🚀 Deploy

### **Deploy Automático**

```bash
npm run deploy
```

### **Ambiente de Produção**

- **URL**: Disponível após deploy
- **Performance**: Otimizado com Cloudflare Workers
- **Escalabilidade**: Suporte a múltiplos usuários
- **Segurança**: API keys protegidas

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 🙏 Agradecimentos

- **TMDB**: Por fornecer a API de filmes
- **Deco Platform**: Pela infraestrutura MCP
- **Material-UI**: Pelos componentes React
- **OpenAI**: Pela integração com IA

---

**🎬 Descubra seu próximo filme favorito com inteligência artificial!**
