# Firebase Setup - Sistema de Administração de Shapes

## 📋 Visão Geral

Este projeto agora possui um sistema de administração de shapes CAGED integrado com Firebase, permitindo:
- ✅ Armazenamento dos shapes no Firestore
- ✅ Interface de administração com autenticação
- ✅ Edição visual de shapes de acordes
- ✅ Carregamento dinâmico com fallback para shapes hardcoded

## 🔧 Configuração Inicial

### 1. Criar Projeto no Firebase

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Crie um novo projeto (ou use um existente)
3. Ative **Authentication** com Email/Password
4. Ative **Firestore Database** no modo de produção

### 2. Obter Credenciais

1. No Firebase Console, vá em **Project Settings** (⚙️)
2. Na aba **General**, role até **Your apps**
3. Clique em **Web app** (</>) para criar um app web
4. Copie as credenciais do `firebaseConfig`

### 3. Configurar Credenciais no Projeto

#### Arquivo: `firebase/config.ts`

Substitua os valores de `YOUR_*` pelas suas credenciais:

```typescript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

#### Arquivo: `scripts/migrateShapesToFirebase.ts`

Também substitua as credenciais no script de migração (mesmas credenciais).

### 4. Criar Usuário Admin

No Firebase Console:
1. Vá em **Authentication** > **Users**
2. Clique em **Add user**
3. Crie um usuário com email e senha (ex: admin@seuapp.com)
4. Anote o email e senha para fazer login na tela de admin

### 5. Configurar Regras do Firestore

No Firebase Console, vá em **Firestore Database** > **Rules** e configure:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir leitura pública dos shapes (para o app funcionar)
    match /shapes/{shapeId} {
      allow read: if true;
      allow write: if request.auth != null; // Apenas usuários autenticados podem escrever
    }
  }
}
```

**Publique as regras** clicando em **Publish**.

## 🚀 Executar Migração

Após configurar as credenciais, execute a migração **uma única vez**:

```bash
yarn migrate-shapes
```

Ou:

```bash
npm run migrate-shapes
```

Este comando irá:
- ✅ Exportar todos os shapes hardcoded para o Firestore
- ✅ Criar 20+ documentos com tipos de acordes (major, minor, dom7, etc.)
- ✅ Adicionar metadados (nome, updatedAt)

**Saída esperada:**
```
🔥 Iniciando migração de shapes para Firebase...

Migrando: Maior (Tríade) (major)...
✅ major migrado com sucesso!
...
📊 Resumo da migração:
   ✅ Sucesso: 20
   ❌ Erros: 0
   📦 Total: 20

🎉 Migração concluída com sucesso!
```

## 🎨 Usar Tela de Administração

### Acessar

1. No aplicativo, clique na aba **Admin** (ícone de engrenagem)
2. Faça login com o email/senha criado no Firebase Auth
3. Você verá a interface de administração

### Funcionalidades

#### Listar Tipos de Acordes
- Veja todos os tipos disponíveis (Maior, Menor, Dominante, etc.)
- Clique em um tipo para ver seus shapes

#### Editar Shapes
- Clique no botão **✏️ Editar** em qualquer shape
- Modifique:
  - Nome do shape
  - Corda base (6, 5 ou 4)
  - Frets (casas) - array de 6 valores
  - Fingers (dedos) - array de 6 valores
  - Root Fret Offset
- Clique em **Salvar Shape**

#### Adicionar Novo Shape
- Clique em **➕ Adicionar Shape**
- Preencha os campos
- Clique em **Salvar Shape**

#### Deletar Shape
- Clique no botão **🗑️ Deletar**
- Confirme a exclusão

#### Salvar Alterações
- Após editar/adicionar/deletar shapes
- Clique em **💾 Salvar Alterações**
- As mudanças serão sincronizadas com o Firestore

### Logout
- Clique em **Sair** no canto superior direito

## 🔄 Como Funciona o Carregamento

### Fluxo de Dados

```
App carrega shape → useShapes hook
  ↓
  1. Busca no Firebase (getShapes)
  ↓
  2. Se encontrado: usa shapes do Firebase
  ↓
  3. Se não encontrado/erro: usa fallback hardcoded
```

### Cache Local
- Os shapes buscados do Firebase são armazenados em cache local
- Isso melhora a performance e reduz chamadas ao Firestore
- O cache é limpo quando shapes são atualizados

### Fallback Inteligente
- Se o Firebase estiver indisponível, o app continua funcionando
- Usa os shapes hardcoded como backup
- Nenhum erro para o usuário final

## 📁 Estrutura de Arquivos

```
ichords/
├── firebase/
│   ├── config.ts              # Configuração do Firebase
│   └── shapesService.ts       # Serviço de leitura/escrita de shapes
├── hooks/
│   └── useShapes.ts          # Hook para buscar shapes com fallback
├── pages/
│   └── AdminPage.tsx         # Tela de administração
├── scripts/
│   └── migrateShapesToFirebase.ts  # Script de migração
└── components/
    ├── GuitarChordModal.tsx   # Usa useShapes
    └── HarmonicFieldChordModal.tsx  # Usa useShapes
```

## ⚠️ Importante

1. **Nunca commite credenciais no Git**
   - Adicione `firebase/config.ts` ao `.gitignore` se necessário
   - Use variáveis de ambiente em produção

2. **Execute a migração apenas uma vez**
   - Rodar múltiplas vezes sobrescreve os dados
   - Não há problema se já existirem dados

3. **Backup dos Shapes**
   - Os shapes hardcoded ainda estão no código
   - Servem como fallback e backup

4. **Segurança**
   - Apenas usuários autenticados podem editar
   - Configure as regras do Firestore corretamente

## 🐛 Troubleshooting

### Erro: "Firebase not configured"
- Verifique se as credenciais estão corretas em `firebase/config.ts`

### Erro na migração: "Permission denied"
- Crie um usuário admin no Firebase Auth
- Faça login na tela de admin antes de rodar a migração
- OU: Temporariamente permita escrita pública nas regras do Firestore

### Shapes não carregam
- Abra o Console do navegador (F12)
- Verifique erros no Firebase
- Se houver erro, o fallback hardcoded será usado

### Login não funciona
- Verifique se Authentication está ativado no Firebase Console
- Confirme que o método Email/Password está habilitado

## 🎉 Pronto!

Agora você tem um sistema completo de administração de shapes com:
- ✅ Firebase Firestore para armazenamento
- ✅ Firebase Auth para segurança
- ✅ Interface de administração completa
- ✅ Fallback automático para garantir funcionamento
- ✅ Cache local para performance

