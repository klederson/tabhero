<p align="center"><img src="brand/logo.svg" width="230" alt="JáTá"></p>

<h1 align="center">Uma conversa nova. A aba de sempre.</h1>

<p align="center">Outra aba? Poxa, já tá aberto.</p>

<p align="center"><a href="https://klederson.github.io/jata/">Site</a> · <a href="https://github.com/klederson/jata/releases">Downloads</a> · <a href="docs/brand-strategy.md">Marca e estratégia</a> · <a href="docs/research.md">Pesquisa pública</a> · <a href="docs/funding.md">Apoio</a></p>

**JáTá** is an independent, MIT-licensed browser extension for Chrome and Firefox. It opens chat links inside an already loaded WhatsApp Web tab, preserving its document and session. It does not send messages automatically. **Experimental:** browser integration tests use a simulated app; an authenticated WhatsApp session has not been validated in this development session.

Projeto independente, sem vínculo, patrocínio ou endosso de WhatsApp ou Meta. WhatsApp é marca de seus respectivos titulares.

Extensão para Chrome e Firefox que intercepta links de conversa e troca a conversa dentro do WhatsApp Web já carregado, preservando o documento da aba e preenchendo o rascunho sem enviar mensagens.

## Atualizar uma instalação existente

Recarregue **somente a extensão**: no Chrome, use o botão de recarregar do cartão em `chrome://extensions`; no Firefox, use **Recarregar** ao lado da extensão em `about:debugging`. A marca agora aparece como **JáTá — a conversa na aba de sempre**, versão **1.2.0**. Não é necessário atualizar a aba do WhatsApp, pois a integração é executada sob demanda.

## Instalar no Chrome

Os arquivos prontos estão em `dist/chrome`. Não é necessário instalar Node ou executar comandos para usar a extensão.

1. Abra `chrome://extensions`.
2. Ative **Modo do desenvolvedor**.
3. Clique em **Carregar sem compactação**.
4. Selecione a pasta `dist/chrome` deste projeto.
5. Deixe o WhatsApp Web aberto e clique em um link `wa.me` ou `api.whatsapp.com/send`.

Se usar o pacote `artifacts/whatsapp-mesma-aba-chrome.zip`, extraia o ZIP antes de selecionar a pasta. Chrome 120 ou superior.

## Instalar no Firefox

1. Abra `about:debugging#/runtime/this-firefox`.
2. Clique em **Carregar extensão temporária**.
3. Selecione `dist/firefox/manifest.json` deste projeto.
4. Deixe o WhatsApp Web aberto e clique em um link de conversa.

Firefox 142 ou superior. Essa instalação é temporária e precisa ser repetida após reiniciar o Firefox. A instalação permanente no Firefox comum requer assinatura da Mozilla; o ZIP fornecido ainda não é assinado nem publicado em uma loja.

## Comportamento

- Captura `https://wa.me/NUMERO`, `https://api.whatsapp.com/send?phone=NUMERO` e `https://www.whatsapp.com/send?phone=NUMERO`, incluindo variantes com barra final e HTTP.
- Preserva a mensagem de `text`, incluindo acentos, emojis, quebras de linha e caracteres especiais. Sem `text`, preserva o rascunho existente do destinatário.
- Reutiliza uma aba do WhatsApp na mesma janela quando possível. Se estiver em outra janela, foca essa janela. Troca de conversa pelo comando interno do aplicativo, sem navegar, trocar a URL ou recarregar a aba.
- Se não houver uma aba do WhatsApp, transforma a aba intermediária no WhatsApp Web.
- Fecha uma aba intermediária nova. Quando há histórico anterior, volta à página de origem para preservá-la. Ao digitar um link em uma aba vazia já existente, ela pode voltar para uma página em branco.
- O botão da extensão também abre ou foca o WhatsApp Web.
- A mensagem fica preenchida para envio manual. A extensão não envia mensagens automaticamente.

A aba precisa pertencer ao mesmo navegador e perfil da extensão. Se você usa WhatsApp no Chrome e clica no Firefox, uma extensão comum do Firefox não consegue controlar a aba do Chrome. Esta versão é destinada a janelas normais; navegação privada não foi validada.

A integração usa os módulos internos já carregados do WhatsApp para localizar o contato, abrir a conversa e preencher o campo de mensagem. Essas interfaces não são uma API pública estável. Se os módulos estiverem indisponíveis, a extensão apresenta um erro na página intermediária e mantém a aba existente sem recarga; não há fallback de navegação. O código não carrega bibliotecas ou scripts remotos e não altera o carregador de módulos do aplicativo.

A rota `https://web.whatsapp.com/send` é usada somente para a primeira abertura, quando nenhuma aba do WhatsApp existe. Se o WhatsApp estiver desconectado, será necessário vincular a conta normalmente.

Convites de grupo, canais, links de compartilhamento sem número e códigos de negócio (`wa.me/message/...`) seguem seu fluxo normal. Se esse fluxo depois chegar a um link de conversa compatível, a extensão o intercepta nesse ponto. Links já direcionados a `web.whatsapp.com` seguem seu fluxo normal.

## Permissões e privacidade

O acesso é limitado a `wa.me`, `api.whatsapp.com`, `www.whatsapp.com` e `web.whatsapp.com`. A extensão usa `declarativeNetRequestWithHostAccess` para redirecionar navegações antes da página intermediária e `scripting` para executar a abertura da conversa dentro do documento carregado. O navegador pode pedir a concessão de acesso a esses sites; no Chrome, deixe o acesso aos sites declarados habilitado para a captura automática.

Apenas a página intermediária local é declarada acessível por outros sites, permitindo que um link de qualquer site chegue a ela. Isso não concede acesso de leitura a outros sites. A execução sob demanda é restrita ao WhatsApp Web e usa o modelo do contato de destino para abrir a conversa e preencher seu rascunho; não consulta o histórico das mensagens. Não há telemetria, servidores próprios ou armazenamento de números e mensagens pela extensão.

## Desenvolver e testar

Node 22 ou superior:

```sh
npm ci
npm test
npm run build
```

Os pacotes usam JavaScript nativo, sem bibliotecas de execução ou compilador. `npm run build` gera manifestos separados: service worker no Chrome e background script modular no Firefox.

Testes de integração:

```sh
npx playwright install chromium
npm run test:browser
npm run test:firefox
```

O teste do Firefox usa Selenium, Firefox instalado e geckodriver. Selenium Manager procura o driver; `FIREFOX_BINARY` permite especificar um executável. Os testes abrem perfis isolados e simulam as respostas de páginas comuns e os contratos dos módulos internos do WhatsApp. O redirecionamento, a injeção no contexto da página e as APIs de abas são exercitados pelos navegadores reais.

As verificações conferem que o documento original, seu identificador em memória, o rascunho anterior e a URL permanecem intactos; que a conversa e o rascunho de destino mudam; e que nenhum novo documento do WhatsApp é solicitado. Também verificam que uma falha da integração preserva a aba sem fallback de navegação. Esses testes **não comprovam compatibilidade com uma sessão autenticada real** e não enviam mensagens.

Para validar o manifesto do Firefox e gerar os ZIPs (o empacotamento requer `zip`):

```sh
npx web-ext lint --source-dir dist/firefox
npm run package
```

Validação manual com sua conta:

1. Abra e autentique o WhatsApp Web.
2. Em outra aba, clique em um link `wa.me/NUMERO?text=Ol%C3%A1` para um número de teste seu.
3. Confira que a conversa muda dentro da interface já carregada, sem tela de carregamento, navegação ou recarga, e que o texto está preenchido sem envio automático.
4. Repita com `api.whatsapp.com/send/?phone=NUMERO&text=Ol%C3%A1`.

Referências: [regras de redirecionamento no Chrome](https://developer.chrome.com/docs/extensions/reference/api/declarativeNetRequest), [background scripts no Firefox](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/background), [instalação temporária no Firefox](https://extensionworkshop.com/documentation/develop/temporary-installation-in-firefox/).

Contratos internos consultados no código público de WPPConnect/WA-JS: [abertura de conversa](https://github.com/wppconnect-team/wa-js/blob/main/src/chat/functions/openChatBottom.ts), [preenchimento do rascunho](https://github.com/wppconnect-team/wa-js/blob/main/src/chat/functions/setInputText.ts), [resolução do contato](https://github.com/wppconnect-team/wa-js/blob/main/src/whatsapp/functions/findOrCreateLatestChat.ts). O adaptador local é independente dessas bibliotecas e não as inclui na extensão.

## Site, identidade e apoio

O site é estático, sem framework ou backend, e publicado no GitHub Pages pela ação [pages.yml](.github/workflows/pages.yml). O código fica em `website/`; os vetores, guia PDF e cartão social ficam em `brand/`. As fontes são auto-hospedadas com suas licenças OFL. Execute `npm run package` e `npm run build:site` para gerar `website/dist/`. O kit de marca e os dois pacotes são incluídos nos downloads do site.

`npm run build:brand` regenera ícones, cartão social e guia PDF com o Chromium do Playwright. Para regenerar os contornos dos wordmarks, instale `fonttools` num ambiente Python e execute `scripts/wordmark.py`. Não é necessário regenerar esses arquivos para construir ou publicar o site: os assets finais estão versionados.

O apoio escolhido é **GitHub Sponsors a partir de US$ 1**, com opções de valores e campo livre no próprio GitHub. Enquanto o perfil de recebimento do mantenedor não estiver habilitado, o site mostra o estado de preparação e não oferece uma cobrança inexistente. Depois da inscrição, `node scripts/enable-sponsors.mjs` verifica a página pública antes de ativar a configuração local. Veja [funding.md](docs/funding.md).

O código e os assets originais são distribuídos sob [licença MIT](LICENSE); as fontes mantêm suas licenças próprias. Contribuições são bem-vindas: [CONTRIBUTING.md](CONTRIBUTING.md).
