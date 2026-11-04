# Pesquisa pública — JáTá

Autoria: Klederson Bueno, 2026. Consulta: 4 de novembro de 2026.

## Pergunta e limites

Há relatos públicos de pessoas que querem abrir uma conversa a partir de um link sem passar pelo aplicativo errado, por outra instância do WhatsApp Web ou por um novo carregamento?

Sim: as fontes abaixo documentam situações concretas e pedidos relacionados. São evidências anedóticas e históricas, com sistemas, navegadores e ferramentas diferentes. Não medem a frequência do problema, não representam consenso e não demonstram que cada comportamento ainda ocorre hoje. A pesquisa foi somente de leitura, sem publicar, contatar usuários ou acessar grupos privados. Buscas em comunidades e chans públicos indexados não produziram outra fonte pertinente verificável; isso não demonstra ausência de reclamações nesses espaços.

“Exato” indica correspondência com uma parte do problema de uso; não significa reprodução técnica no produto. Nenhuma destas fontes demonstra preservação da identidade do documento, critério mais rigoroso adotado pela JáTá.

## Oito fontes

| Fonte pública | Data do relato | Síntese fiel | Relação e limites |
| --- | --- | --- | --- |
| [Hacker News — comentário de dearjames](https://news.ycombinator.com/item?id=25661105), também disponível no [contexto da conversa](https://news.ycombinator.com/item?id=25657603) | 06/01/2021 | Explica que, após escolher o WhatsApp Web na página intermediária, uma nova instância carrega mesmo quando outra aba já está aberta. No contexto, outra pessoa relata tentativa de abrir um aplicativo no Linux apesar de estar autenticada no Web. | **Exato:** ignora a instância Web existente. Relatos individuais de 2021, sem validação atual ou contagem de votos verificável. |
| [Stack Overflow — click-to-chat no OSX e WhatsApp Web](https://stackoverflow.com/questions/60254713/whatapp-click-to-chat-links-do-not-work-with-osx-native-client-and-whatsapp-web) | 17/02/2020 | Uma equipe usa links para conversar com clientes pelo painel administrativo. Relata que o fluxo Web abre outra instância em nova aba ou janela e leva segundos para carregar. | **Exato:** instância duplicada e espera em um fluxo profissional. A pergunta também trata de falhas no aplicativo nativo; não confundir os dois sintomas. |
| [Super User — impedir abertura do aplicativo desktop](https://superuser.com/questions/1634477/stop-whatsapp-desktop-app-from-opening-on-api-whatsapp-com-links-run-whatsapp-w) | 19/03/2021 | Pessoa usa conta pessoal no desktop e comercial no Web. Os links pedem para abrir o aplicativo; cancelar deixa a pessoa na página intermediária, sem chegar à conta Web desejada. | **Exato:** encaminhamento para aplicativo e conta diferentes dos pretendidos. Não descreve identidade do documento nem uma solução sem navegação. |
| [Reddit r/chrome — protocol handler por perfil](https://www.reddit.com/r/chrome/comments/whk4wd/disable_whatsapp_protocol_handler_in_specific/) | 06/08/2022 | Dois números eram usados em perfis Chrome diferentes. Após instalar o desktop, links para contatos não salvos passam a chamar o aplicativo ligado a apenas um telefone. A pessoa pede para desativar esse encaminhamento por perfil. | **Exato:** o aplicativo intercepta um fluxo destinado ao Web. Data confirmada pelo campo público de criação no [JSON do post](https://www.reddit.com/r/chrome/comments/whk4wd.json). |
| [Reddit r/whatsapp — wa.me no Firefox Ubuntu](https://www.reddit.com/r/whatsapp/comments/16pyo5e/unable_to_open_chat_using_wame_url_on_firefox/) | 23/09/2023 | Links wa.me e api.whatsapp.com abrem um seletor de aplicativos que informa não haver aplicativo instalado para atender ao protocolo solicitado. | **Adjacente:** falha de encaminhamento entre navegador e aplicativo; o autor não afirma haver uma aba Web previamente aberta. Data confirmada pelo [JSON público](https://www.reddit.com/r/whatsapp/comments/16pyo5e.json). |
| [GitHub PyWhatKit — Prevent new tab from opening if already open, #190](https://github.com/Ankit404butfound/PyWhatKit/issues/190) | 02/03/2022 | Usuário relata que a biblioteca abre nova aba para enviar uma mensagem e ignora a aba ativa do WhatsApp. Outra pessoa confirma no dia seguinte. A issue foi encerrada em 06/03 como duplicata de #120. | **Adjacente, com o mesmo incômodo:** o gatilho é uma biblioteca de automação de terceiros, não um teste isolado do fluxo nativo de wa.me. Não usar como prova de defeito exclusivo do WhatsApp. |
| [GitHub Tridactyl — abrir URL na aba existente, discussão #5275](https://github.com/tridactyl/tridactyl/discussions/5275) | 29/09/2025 | Usuário abre conversas a partir de números selecionados e quer localizar e ativar a aba Web existente, criando outra apenas quando necessário. | **Adjacente:** pedido explícito de reutilização de aba. A solução discutida altera sua URL; isso **não** atende ao requisito da JáTá de preservar o documento sem navegação ou recarga. |
| [Mozilla Support — WhatsApp chat not invoking from Firefox Android](https://support.mozilla.org/en-US/questions/1341933) | 25/06/2021 | Usuário relata que o botão para continuar a conversa passou a sugerir instalar o WhatsApp, embora o aplicativo esteja instalado e o fluxo funcione no Chrome. Posteriormente informa que uma variante de link funcionou. | **Adjacente:** encaminhamento no Android, sem evidência de aba Web duplicada. A página marca a questão como resolvida; preservar esse contexto. |

As datas do Reddit foram convertidas dos campos de criação em UTC. Pontuações foram omitidas: variam, não medem quantas pessoas enfrentam o problema e acrescentam pouco ao argumento. Não usar essas pessoas como clientes, depoentes ou apoiadores da extensão; elas não avaliaram a JáTá.

## O que a pesquisa permite dizer

- Há relatos públicos, em anos e ambientes diferentes, sobre links de conversa que abrem outra instância ou direcionam ao aplicativo errado.
- Reutilizar o WhatsApp Web existente aparece como desejo explícito de usuários.
- A promessa de produto deve mostrar a conversa entrando na interface já carregada, com o texto como rascunho e envio manual.

Não permite dizer que “todo mundo reclama”, que milhares de pessoas pediram a JáTá, que o problema ocorre em todos os navegadores ou que a extensão já o resolveu em sessões reais. O incômodo pode motivar uma demonstração; a demonstração precisa de evidência própria.

## Critério de produto e estado de validação

O resultado desejado é abrir a conversa no WhatsApp Web que já está carregado, preservando documento e sessão. Reutilizar o número identificador da aba é insuficiente: navegar nessa aba também pode manter esse identificador e destruir seu estado. Os critérios de aceite incluem identidade do documento, estado em memória, URL preservada, conversa correta e texto correto. Uma falha da integração deve apresentar erro e manter a aba existente intacta, sem recarga silenciosa.

**A integração com o aplicativo real autenticado não foi validada nesta sessão. Os testes de navegador simulam as interfaces do WhatsApp.** Navegadores reais exercitam mecanismos da extensão, mas isso não equivale a comprovar compatibilidade com uma sessão real. Não inventar resultados, tempos economizados, percentuais de sucesso ou depoimentos. Registrar uma validação real separadamente, com versão, navegador e data, sem expor contatos ou conversas.

## Referência oficial de marca

A [página oficial de diretrizes da marca WhatsApp, da Meta](https://www.meta.com/brand/resources/whatsapp/whatsapp-brand/) foi consultada em 04/11/2026. Ela restringe marcas confundíveis, variações do nome, uso como nome de produto e sugestões de patrocínio. A resposta proposta é identidade própria: JáTá, sem telefone, balão ou logo derivado do WhatsApp. Isso reduz confusão; não certifica disponibilidade do nome nem liberação jurídica. A aplicação editorial está em [brand-strategy.md](brand-strategy.md).

## Medição proporcional

Priorizar feedback voluntário: navegador e versão, formato do link com número fictício, resultado esperado e resultado observado. Não solicitar histórico de conversas, números reais, mensagens ou perfil autenticado. Quando alguém enviar material sensível por engano, removê-lo das evidências públicas e orientar a substituição por um caso sintético.

Comparar apenas totais agregados disponíveis na distribuição, relatos voluntários de sucesso ou falha e tempo até resposta das issues. Identificar a origem de cada métrica e seu denominador quando conhecido. Downloads não equivalem a usuários ativos; relatos voluntários não estimam a taxa geral de falhas. Não adicionar rastreamento de uso, identificadores persistentes ou coleta de conversas para medir a proposta.
