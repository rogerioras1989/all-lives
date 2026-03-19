# QA Checklist

Base local homologada: `http://127.0.0.1:3001`

## Credenciais demo

- Consultor / owner: `consultor@alllives.com.br` / `consultor123`
- Admin empresa: CPF `000.000.000-00` / PIN `123456`
- Colaborador: CPF `111.111.111-11` / PIN `654321`

## 1. Acesso público

### Landing
- URL: `http://127.0.0.1:3001/`
- Esperado: landing carregar normalmente

### Rota protegida sem sessão
- URL: `http://127.0.0.1:3001/dashboard`
- Esperado: redirecionar para `/login`

### Link anônimo da campanha
- URL: `http://127.0.0.1:3001/r/avaliacao-drps-2025`
- Esperado: redirecionar para `/questionario?campaign=campaign-demo`

### Resultado público por slug
- URL: `http://127.0.0.1:3001/api/resultado/avaliacao-drps-2025`
- Esperado: `403` com resultados públicos desabilitados

## 2. Backoffice All Lives

### Login consultor
- URL: `http://127.0.0.1:3001/consultor/login`
- Usuário: `consultor@alllives.com.br`
- Senha: `consultor123`
- Esperado: login com sucesso

### Dashboard global
- URL: `http://127.0.0.1:3001/consultor`
- Esperado: ver `1` empresa, `1` campanha e total de respostas atualizado

### Tenant demo
- URL: `http://127.0.0.1:3001/consultor/empresas/company-demo?campaign=campaign-demo`
- Esperado: ver dados agregados da campanha demo
- Esperado: não existir identificação individual de colaborador

## 3. Empresa cliente

### Login admin
- URL: `http://127.0.0.1:3001/login`
- CPF: `000.000.000-00`
- PIN: `123456`
- Esperado: acesso ao dashboard da empresa

### Dashboard
- URL: `http://127.0.0.1:3001/dashboard`
- Esperado: campanha `Avaliação DRPS 2025` visível
- Esperado: métricas agregadas coerentes com as respostas recebidas

### Drill-down anônimo
- URL: `http://127.0.0.1:3001/api/campaigns/campaign-demo/anonymous-responses`
- Esperado: grupos pequenos ficam suprimidos
- Esperado: não expor resposta individual

## 4. Colaborador

### Login colaborador
- URL: `http://127.0.0.1:3001/login`
- CPF: `111.111.111-11`
- PIN: `654321`
- Esperado: acesso ao portal

### Portal
- URL: `http://127.0.0.1:3001/portal`
- Esperado: campanha ativa visível
- Esperado: mensagem explícita de modo anônimo
- Esperado: sem analytics corporativo

## 5. Pesquisa anônima

### Questionário
- URL: `http://127.0.0.1:3001/questionario?campaign=campaign-demo`
- Ação: responder o questionário completo
- Esperado: submissão com sucesso

### Validação no dashboard
- URL: `http://127.0.0.1:3001/api/campaigns/campaign-demo/results`
- Esperado: `totalResponses` e médias atualizados sem cache stale

### Regra de anonimização
- URL: `http://127.0.0.1:3001/api/campaigns/campaign-demo/anonymous-responses`
- Esperado: setores com menos de `3` respostas aparecem como suprimidos

## 6. Sessão e segurança

### Refresh token
- URL: `http://127.0.0.1:3001/api/auth/refresh`
- Esperado: rotação de sessão funcionar após login

### Logout
- Ação: sair da aplicação
- Esperado: rotas protegidas voltam a exigir autenticação

### Tentativas inválidas
- Ação: repetir login inválido várias vezes
- Esperado: rate limit e bloqueio temporário

## Resultado esperado geral

- Owner vê visão multi-tenant
- Empresa vê apenas o próprio tenant
- Colaborador não vê analytics corporativo
- Pesquisa permanece anônima
- Analytics atualiza em tempo real
- Resultado público por slug permanece bloqueado
