# 📊 Sistema de Controle de Quilometragem - Documentação Completa

## 🎯 Visão Geral
Sistema web completo para controle de quilometragem de frotas, desenvolvido em Next.js com Firebase, oferecendo gestão completa de viagens, usuários, vans e relatórios detalhados.

---

## 👥 Perfis de Usuário

### 🔐 **Administrador**
- Acesso total ao sistema
- Gerenciamento de usuários, vans e rotas
- Relatórios completos e exportações
- Controle de permissões

### 🚗 **Motorista**
- Registro de abertura/fechamento de viagens
- Controle de quilometragem inicial e final
- Seleção de van e rota
- Diário de bordo

### 👥 **Mentora (Monitora)**
- Registro de ponto de entrada/saída
- Seleção de rota (sem controle de van/KM)
- Acompanhamento de viagens
- Diário de bordo

---

## 🔄 Fluxos Operacionais

### **Fluxo do Motorista:**
1. **Login** → Autenticação Firebase
2. **Seleção de Van** → Modal com busca por placa
3. **Confirmação de KM** → Validação automática com KM atual da van
4. **Seleção de Rota** → Modal com busca origem/destino
5. **Abertura de Viagem** → Registro com timestamp
6. **Durante Viagem** → Sistema bloqueia nova abertura
7. **Fechamento** → KM final + diário de bordo
8. **Finalização** → Cálculo automático de distância

### **Fluxo da Mentora:**
1. **Login** → Autenticação Firebase
2. **Seleção de Rota** → Modal com busca origem/destino
3. **Ponto Entrada** → Registro de entrada (sem van/KM)
4. **Durante Trajeto** → Aguarda finalização do motorista
5. **Ponto Saída** → Registro de saída + observações
6. **Finalização** → Controle de jornada completo

### **Fluxo do Administrador:**
1. **Dashboard** → Visão geral do sistema
2. **Gestão** → Usuários, vans, rotas
3. **Monitoramento** → Registros em tempo real
4. **Relatórios** → Análises e exportações
5. **Configurações** → Parâmetros do sistema

---

## 🗃️ Estrutura de Dados

### **Usuários (Firebase Auth + Firestore)**
```json
{
  "uid": "firebase_uid",
  "nome": "Nome Completo",
  "email": "usuario@email.com",
  "perfil": "admin|user",
  "tipo": "motorista|copiloto",
  "ativo": true,
  "criadoEm": "timestamp"
}
```

### **Vans**
```json
{
  "id": "van_id",
  "placa": "ABC-1234",
  "kmAtual": 15000,
  "kmInicial": 0,
  "ativa": true,
  "criadaEm": "timestamp",
  "atualizadaEm": "timestamp"
}
```

### **Rotas**
```json
{
  "id": "rota_id",
  "origem": "São Paulo",
  "destino": "Rio de Janeiro",
  "ativa": true,
  "criadaEm": "timestamp"
}
```

### **Registros de Viagem**
```json
{
  "id": "registro_id",
  "userId": "firebase_uid",
  "vanId": "van_id",
  "placa": "ABC-1234",
  "origem": "São Paulo",
  "destino": "Rio de Janeiro",
  "abertura": {
    "kmInicial": 15000,
    "dataHora": "2025-01-15T08:00:00Z"
  },
  "fechamento": {
    "kmFinal": 15250,
    "dataHora": "2025-01-15T18:00:00Z",
    "diarioBordo": "Viagem sem intercorrências"
  }
}
```

---

## 📱 Funcionalidades por Tela

### **🔐 Tela de Login**
- Autenticação Firebase
- Validação de credenciais
- Redirecionamento por perfil
- Logo personalizada
- Recuperação de senha

### **🏠 Tela Home (Motorista/Mentora)**
- **Cards de Abertura/Fechamento**
- **Seleção de Van** (apenas motorista)
  - Modal com busca por placa
  - Filtro em tempo real
  - Exibição de KM atual
  - Validação de disponibilidade
- **Seleção de Rota**
  - Modal com busca origem/destino
  - Filtro em tempo real
  - Interface mobile otimizada
- **Controle de KM** (apenas motorista)
  - Validação automática
  - KM inicial ≥ KM atual da van
  - KM final ≥ KM inicial
- **Diário de Bordo**
  - Máximo 100 caracteres
  - Contador em tempo real
  - Observações opcionais
- **Histórico Pessoal**
  - Modal com registros do usuário
  - Tabela responsiva
  - Cálculo automático de distâncias

### **⚙️ Painel Administrativo**
#### **Gestão de Usuários**
- **Criação de Usuários**
  - Nome, email, senha
  - Definição de perfil (admin/user)
  - Tipo (motorista/mentora)
  - Geração automática de credenciais
- **Edição de Usuários**
  - Alteração de nome
  - Mudança de tipo
  - Reset de senha
  - Exclusão com confirmação
- **Filtros e Busca**
  - Busca por nome/email
  - Filtros por tipo
  - Listagem paginada

#### **Gestão de Vans**
- **Cadastro de Vans**
  - Placa (formato validado)
  - KM inicial
  - Status ativo/inativo
- **Edição de Vans**
  - Atualização de placa
  - Correção de KM atual
  - Ativação/desativação
- **Controle de Status**
  - Vans ativas/inativas
  - Disponibilidade em tempo real
  - Histórico de alterações

#### **Gestão de Rotas**
- **Cadastro de Rotas**
  - Origem e destino
  - Validação de duplicatas
- **Edição de Rotas**
  - Alteração origem/destino
  - Exclusão com validação
- **Listagem Completa**
  - Todas as rotas cadastradas
  - Contador de registros

#### **Controle de Registros**
- **Visualização Completa**
  - Todos os registros do sistema
  - Dados diferenciados por tipo de usuário
  - Status em tempo real
- **Filtros Avançados**
  - Por período (data início/fim)
  - Por usuário específico
  - Por rota (busca textual)
  - Apenas registros em aberto
- **Edição Completa**
  - Todos os campos editáveis
  - Validação de dados
  - Fechamento manual de registros
- **Exclusão de Registros**
  - Confirmação obrigatória
  - Log de ações

---

## 📊 Relatórios e Análises

### **📈 Gráficos Disponíveis**
#### **Gráfico Pizza - Registros por Tipo**
- Distribuição motoristas vs mentoras
- Percentuais automáticos
- Cores diferenciadas
- Legenda interativa

#### **Gráfico Barras - KM por Tipo**
- Total de quilômetros por categoria
- Número de viagens
- Comparativo visual
- Escala automática

#### **Gráfico Van x Motorista**
- Uso de vans por motorista
- KM total por combinação
- Ranking de utilização
- Análise de produtividade

### **📋 Relatório de Registros**
#### **Dados Inclusos:**
- Nome do usuário
- Tipo (motorista/mentora)
- Van utilizada (apenas motoristas)
- Rota (origem → destino)
- KM inicial/final (apenas motoristas)
- Datas de abertura/fechamento
- Distância percorrida (apenas motoristas)
- Diário de bordo

#### **Filtros Disponíveis:**
- Período específico
- Usuário individual
- Busca por rota
- Apenas registros em aberto

### **⏰ Relatório de Jornadas**
#### **Controle de Horas:**
- Entrada e saída por usuário
- Cálculo de horas trabalhadas
- Comparação com jornada normal
- Horas extras/déficit
- Agrupamento por data

#### **Configurações:**
- Jornada normal configurável
- Formato HH:MM
- Múltiplas entradas/saídas por dia
- Totalização automática

---

## 📤 Exportações

### **Formatos Disponíveis:**
- **CSV** - Compatível com Excel/Sheets
- **Excel** - Arquivo .xlsx nativo
- **PDF** - Relatório formatado

### **Personalizações:**
- **Rodapé Automático** (quando filtrado por usuário):
  - Data de exportação
  - Nome do funcionário
  - Período analisado
  - Jornada normal (relatório de jornadas)
  - Campo para assinatura

### **Dados Específicos por Tipo:**
- **Motoristas**: Todos os campos
- **Mentoras**: Apenas dados relevantes (sem van/KM)

---

## 🔧 Funcionalidades Técnicas

### **🔐 Autenticação e Segurança**
- Firebase Authentication
- Controle de sessão
- Redirecionamento automático
- Validação de perfis
- Logout seguro

### **📱 Interface Responsiva**
- Design mobile-first
- Modais otimizadas para touch
- Bottom sheets no mobile
- Scroll suave
- Feedback visual

### **🔍 Busca e Filtros**
- Busca em tempo real
- Filtros combinados
- Case insensitive
- Resultados instantâneos
- Limpeza de filtros

### **⚡ Performance**
- Carregamento otimizado
- Paginação automática
- Cache inteligente
- Atualizações em tempo real
- Validações client-side

### **🌐 Internacionalização**
- Formato brasileiro (dd/mm/aaaa)
- Fuso horário UTC-3
- Moeda e números localizados
- Datas em português

---

## 🎨 Interface e UX

### **🎨 Design System**
- Logo personalizada em todas as telas
- Cores consistentes
- Tipografia padronizada
- Ícones intuitivos
- Feedback visual

### **📱 Mobile Experience**
- Touch otimizado
- Modais bottom sheet
- Scroll nativo
- Teclado adaptativo
- Gestos intuitivos

### **♿ Acessibilidade**
- Contraste adequado
- Textos legíveis
- Botões com tamanho mínimo
- Navegação por teclado
- Labels descritivos

---

## 🔄 Integrações

### **🔥 Firebase**
- **Authentication**: Gestão de usuários
- **Firestore**: Banco de dados NoSQL
- **Hosting**: Deploy automático
- **Security Rules**: Controle de acesso

### **📊 Bibliotecas**
- **Next.js**: Framework React
- **React Hook Form**: Formulários
- **XLSX**: Exportação Excel
- **jsPDF**: Geração de PDF

---

## 📈 Métricas e KPIs

### **📊 Indicadores Disponíveis**
- Total de registros por período
- Quilometragem por motorista
- Utilização de vans
- Jornadas de trabalho
- Registros em aberto
- Produtividade por usuário

### **📋 Relatórios Gerenciais**
- Ranking de motoristas
- Eficiência de rotas
- Controle de combustível (via KM)
- Análise de jornadas
- Histórico de utilização

---

## 🚀 Benefícios do Sistema

### **💼 Para Gestores**
- Controle total da frota
- Relatórios detalhados
- Exportações personalizadas
- Análises em tempo real
- Redução de custos

### **🚗 Para Motoristas**
- Interface simples e intuitiva
- Registro rápido de viagens
- Histórico pessoal
- Validações automáticas
- Mobile otimizado

### **👥 Para Mentoras**
- Controle de ponto simplificado
- Acompanhamento de rotas
- Registro de observações
- Interface dedicada

### **🏢 Para Empresa**
- Compliance regulatório
- Auditoria completa
- Redução de erros
- Automatização de processos
- Escalabilidade

---

## 🔮 Possibilidades de Expansão

### **📱 Mobile App**
- App nativo iOS/Android
- Sincronização offline
- GPS integrado
- Notificações push

### **🌐 Integrações Externas**
- ERP corporativo
- Sistemas de combustível
- Rastreamento GPS
- APIs de mapas

### **📊 Analytics Avançado**
- Dashboard executivo
- Previsões de manutenção
- Otimização de rotas
- Machine Learning

### **🔧 Automações**
- Alertas automáticos
- Relatórios agendados
- Backup automático
- Manutenção preventiva

---

## 💡 Diferenciais Competitivos

### **🎯 Simplicidade**
- Interface intuitiva
- Curva de aprendizado mínima
- Processo otimizado
- UX focada no usuário

### **📊 Completude**
- Sistema completo end-to-end
- Todos os perfis contemplados
- Relatórios abrangentes
- Exportações flexíveis

### **🔧 Flexibilidade**
- Configurações personalizáveis
- Adaptável a diferentes negócios
- Escalável conforme crescimento
- Integrações possíveis

### **💰 Custo-Benefício**
- Solução completa
- Redução de custos operacionais
- ROI rápido
- Manutenção simplificada

---

*Sistema desenvolvido com tecnologias modernas, focado na experiência do usuário e resultados mensuráveis para gestão eficiente de frotas.*