# Bora tirar uma volta do caminho?

JáTá tem uma tarefa: abrir uma conversa dentro do WhatsApp Web já carregado. Preservar o documento da aba é critério de aceite, não otimização opcional. Leia [AGENTS.md](AGENTS.md) antes de mexer no fluxo.

Use Node 22+, execute `npm ci`, `npm test` e `npm run build`. Para os testes de navegador, instale o Chromium com `npx playwright install chromium`, execute `npm run test:browser` e `npm run test:firefox` (Firefox e geckodriver instalados). Esses testes simulam os contratos internos do WhatsApp e não substituem validação autenticada real.

Reporte bugs com navegador, versões, resultado esperado e mensagem de erro. Nunca inclua telefone real, rascunho, cookies, QR code ou dados de clientes numa issue. Em mudanças de compatibilidade, descreva a versão do WhatsApp validada e como verificou a preservação do documento sem enviar mensagens.

Para o site, `npm run build:site` e `npm run test:site`. Os arquivos estáticos ficam em `website/dist/`. Os assets de marca são vetoriais e ficam em `brand/` e `website/assets/`. Fontes auto-hospedadas têm licença OFL junto dos arquivos.

Contribuições seguem a licença MIT do projeto. Não inclua logos de terceiros, scripts remotos, telemetria ou fallback que recarregue o WhatsApp. Use linguagem acolhedora com pessoas e irreverente com a fricção.
