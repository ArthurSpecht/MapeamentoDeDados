# Debug Session: login-refresh-loop

Status: [OPEN]

## Symptom
- Ao clicar em "Fazer login", a tela apenas recarrega e o acesso não é concluído.

## Hypotheses
1. A rota `/api/auth/login` falha no backend e retorna erro não visível no front.
2. O cookie de sessão é criado incorretamente ou não persiste no navegador.
3. A leitura da sessão em `getCurrentUser()` falha e a navegação volta para `/login`.
4. O PostgreSQL local ou a tabela `User` não estão disponíveis.
5. O formulário recebe uma resposta inesperada e não faz a transição corretamente.

## Evidence Plan
- Instrumentar o submit do login no cliente.
- Instrumentar a rota `/api/auth/login`.
- Instrumentar a leitura da sessão em `getCurrentUser()`.
- Coletar resposta HTTP, presença de cookie e decisão de redirecionamento.

## Findings
- Pendente.

## Fix
- Pendente.

## Verification
- Pendente.
