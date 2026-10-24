# Meu Controle Financeiro

App de controle financeiro mensal para celular (painel, contas, visão anual, alertas de vencimento,
renda extra, curva S, foto de perfil e backup JSON). Dados no **Supabase**, hospedagem no **GitHub Pages**.

Na aba **Mais**, use **Exportar dados** para baixar um backup JSON completo, ou **Importar dados**
para restaurá-lo. A importação substitui contas, rendas e categorias existentes na conta. O fundo
de emergência também é incluído no backup.

## Estrutura

```
index.html          página principal
css/style.css       visual (cores, layout, tema claro/escuro)
js/config.js        URL e chave do Supabase  <- único arquivo que você edita
js/app.js           lógica do app
supabase/schema.sql tabelas e regras de segurança do banco
```

## Como publicar

1. **Supabase:** no SQL Editor, rode o conteúdo de `supabase/schema.sql`.
   Rode o schema novamente para adicionar a coluna de pagamentos parciais em instalações existentes.
   Depois crie seu usuário em Authentication > Users e desligue o cadastro aberto.
2. **Chaves:** edite `js/config.js` com a Project URL e a chave publishable (ou anon).
3. **GitHub:** envie todos os arquivos e pastas deste projeto para a raiz do repositório
   (`index.html` precisa ficar na raiz). Em Settings > Pages, escolha *Deploy from a branch*, branch `main`, pasta `/ (root)`.
4. **Supabase:** em Authentication > URL Configuration, coloque o endereço do GitHub Pages em *Site URL*.

## Personalizar

- **Cor principal:** variáveis `--pr`, `--g1` e `--g2` no começo de `css/style.css` (hoje `#002060`).
- **Fonte:** adicione o `@font-face` no começo de `css/style.css` e troque a variável `--font`.
- **Categorias padrão:** lista `DCATS` no começo de `js/app.js`.

## Segurança

A chave publishable fica visível no código, o que é esperado: quem protege os dados são as regras
de segurança (RLS) criadas pelo `schema.sql`. Nunca publique a chave `secret` ou `service_role`.
