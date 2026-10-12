# Missão Indicadores pela planilha do Google

Esta versão usa **uma planilha do Google** para guardar salas, equipes e respostas. O professor e as equipes abrem **o mesmo link do jogo** no navegador. A planilha fica apenas com o professor.

## Arquivos

- `Code.gs`: regras das cinco rodadas e registro das respostas na planilha.
- `Index.html`: tela para celular e projetor, com as cores da J.A.V.A. Treinamentos.

## Preparação

1. No Google Drive, crie uma **Planilha Google em branco** chamada `Missão Indicadores — J.A.V.A.`.
2. Na planilha, abra **Extensões → Apps Script**.
3. No arquivo `Code.gs` que aparece no editor, apague o conteúdo inicial e cole todo o conteúdo do `Code.gs` deste pacote.
4. No editor, clique em **+ → HTML**, dê o nome `Index` e cole todo o conteúdo do `Index.html` deste pacote. Salve.
5. Na lista de funções no alto do editor, selecione `prepararJogo` e clique em **Executar**. O Google pedirá autorização para o script usar a planilha; revise a solicitação e autorize. Essa função cria as abas **Configuracao**, **Salas**, **Equipes** e **Respostas**.
6. Volte à planilha. A senha do professor aparecerá em **Configuracao!B2**. Guarde essa senha e mantenha a planilha privada. Os alunos receberão somente o link do jogo.

## Publicação do link para a turma

1. Volte ao editor Apps Script e clique em **Implantar → Nova implantação**.
2. Selecione o tipo **Aplicativo da Web**.
3. Em **Executar como**, escolha **Eu**.
4. Em **Quem pode acessar**, escolha **Qualquer pessoa** para que as equipes entrem pelo celular sem pedir acesso à planilha. Se essa opção não aparecer, a conta do Google pode ter uma restrição da instituição.
5. Clique em **Implantar** e copie o endereço do aplicativo da Web. Esse é o link público do jogo.

## Ensaio rápido

1. Abra o link no computador e escolha **Conduzir como professor**. Digite a senha da célula `Configuracao!B2` e crie uma sala.
2. Abra o mesmo link em outro celular. Escolha **Entrar como equipe**, digite o código da sala e um nome de equipe.
3. No computador, inicie a primeira pergunta. Responda no celular, revele a explicação e avance.
4. Na quinta pergunta, use **Encerrar e mostrar placar**. Para a aula, crie uma sala nova.

## Durante a aula

- Uma pessoa lidera cada equipe de cinco e registra uma alternativa por pergunta.
- Podem participar até **15 equipes**.
- O professor decide quando iniciar, revelar e avançar; o jogo não tem cronômetro.
- As equipes podem alterar a resposta até a revelação.
- O placar aparece no fim. Acertos empatados recebem a mesma posição.
- Os casos usam dados fictícios; não registre informações reais de pacientes.

O repositório do GitHub que você já criou pode continuar como cópia dos arquivos. Esta versão não precisa de Cloudflare.

Referências oficiais: [criar um script vinculado à planilha](https://developers.google.com/apps-script/guides/bound), [publicar um aplicativo da Web](https://developers.google.com/apps-script/guides/web), [comunicação entre a tela e o script](https://developers.google.com/apps-script/guides/html/communication) e [acesso público do aplicativo](https://developers.google.com/apps-script/manifest/web-app-api-executable).
