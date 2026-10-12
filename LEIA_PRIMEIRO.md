# Missão Indicadores — J.A.V.A. Treinamentos

Jogo para até **15 equipes**, com um celular por equipe. O professor abre a sala, mostra o código no projetor e libera cada uma das **5 perguntas** no ritmo da discussão. Cada pergunta tem **3 alternativas**. O placar aparece somente no fim. Todos os dados dos casos são fictícios.

## 1. Colocar os arquivos no GitHub

1. Extraia o arquivo ZIP recebido.
2. Entre em [github.com/new](https://github.com/new) e crie um repositório chamado `missao-indicadores-java`.
3. Abra o repositório e escolha **Add file → Upload files**.
4. Arraste **o conteúdo da pasta extraída** para a página. Devem aparecer `worker`, `scripts`, `tests`, `package.json` e `wrangler.jsonc` na raiz do repositório. Não envie apenas o arquivo ZIP.
5. Clique em **Commit changes**.

O GitHub guarda os arquivos. Para várias equipes jogarem juntas e verem o mesmo placar, a parte do jogo que recebe as respostas precisa funcionar on-line. Os passos seguintes usam Cloudflare Workers e o banco D1.

## 2. Criar o banco do jogo

1. Entre em [dash.cloudflare.com](https://dash.cloudflare.com/).
2. Abra **Storage & Databases → D1 SQL Database → Create database**.
3. Use o nome `missao-indicadores-db` e crie o banco.
4. Copie o **Database ID** mostrado na página desse banco.
5. Volte ao repositório no GitHub, abra `wrangler.jsonc`, clique no ícone de lápis e substitua `SUBSTITUA_PELO_ID_DO_BANCO` pelo ID copiado. Mantenha as aspas. Salve em **Commit changes**.

O jogo cria as tabelas necessárias automaticamente quando a primeira sala é aberta.

## 3. Publicar o jogo

1. Na Cloudflare, abra **Workers & Pages → Create application → Import a repository**.
2. Conecte a conta do GitHub e selecione `missao-indicadores-java`.
3. Use o nome do Worker `missao-indicadores-java`.
4. Confira estas opções:

   - **Build command:** `npm run build`
   - **Deploy command:** `npx wrangler deploy`
   - **Root directory:** `/` (raiz do repositório)

5. Clique em **Save and Deploy**. Ao terminar, a Cloudflare mostrará o endereço público do jogo, geralmente terminado em `workers.dev`.

## 4. Criar a senha do professor

1. Abra o Worker publicado na Cloudflare.
2. Vá a **Settings → Variables and Secrets → Add**.
3. Selecione o tipo **Secret**. No nome, escreva exatamente `TEACHER_PIN`. No valor, escolha uma senha forte que somente o professor saberá.
4. Clique em **Deploy** para aplicar.

**Não coloque a senha em arquivos do GitHub.** Essa senha é usada apenas para criar uma sala. Depois disso, a página guarda o acesso do professor naquele navegador. Guarde o código da sala para mostrar aos alunos.

## 5. Conferir antes da aula

1. Abra o endereço publicado no computador e adicione `/api/health` no fim. Deve aparecer `"database":true` e `"configured":true`.
2. Volte à página inicial, escolha **Conduzir como professor**, informe a senha e crie uma sala.
3. Em outro celular, escolha **Entrar como equipe**, digite o código e um nome de equipe.
4. Inicie a primeira pergunta, confirme uma resposta no celular, revele a explicação e avance. Confira o placar depois da quinta pergunta.

Se quiser, faça esse teste com uma sala de ensaio. Para a aula, crie uma sala nova.

## Como o jogo funciona

- O líder registra a alternativa escolhida com apoio de mais quatro integrantes.
- A equipe pode alterar sua resposta até o professor revelar a alternativa indicada.
- O professor vê quantas equipes responderam e a distribuição das alternativas no projetor.
- Cada acerto vale um ponto. Empates compartilham a mesma posição no placar.
- Não há bônus por velocidade nem perguntas livres.
- As perguntas relacionam assinatura do paciente na guia, glosas, tendências e decisão baseada em indicadores.

## Para quem for ajudar na parte técnica

`worker/` contém a interface e as regras. `scripts/build.mjs` junta tudo em um único Worker. `tests/smoke.mjs` verifica as regras das 15 equipes e das 5 rodadas. Para rodar os testes localmente, use Node.js 22 ou mais recente e execute `npm test`. O pacote não precisa de serviços externos para os testes.

Fontes dos passos de publicação: [upload pelo navegador no GitHub](https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository), [importação de repositório na Cloudflare](https://developers.cloudflare.com/workers/ci-cd/builds/), [configuração do build](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/), [criação do D1](https://developers.cloudflare.com/d1/configuration/data-location/) e [segredos do Worker](https://developers.cloudflare.com/workers/configuration/secrets/).
