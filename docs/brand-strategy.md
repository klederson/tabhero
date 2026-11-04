# Estratégia de marca — JáTá

Autoria: Klederson Bueno, 2026. Proposta de identidade e lançamento, 4 de novembro de 2026.

## Resultado que a marca deve tornar claro

Uma pessoa clica em um link para começar uma conversa e quer continuar no WhatsApp Web que já usa. A JáTá existe para encurtar esse caminho: abrir a conversa dentro da interface carregada, preservar a sessão e preparar o rascunho para envio manual. A comunicação deve explicar esse resultado antes de falar de arquitetura.

Nome proposto: **JáTá**. Forma técnica sem acento: **jata**. Repositório de destino proposto: **klederson/jata**. Esses nomes são decisões de identidade e destino, não confirmação de disponibilidade de marca, domínio ou criação do repositório.

Frase principal: **“Outra aba? Poxa, já tá aberto.”**

Promessa complementar: **“Uma conversa nova. A aba de sempre.”**

A graça está no desvio desnecessário do fluxo, com uma observação falada e fácil de reconhecer. A marca não depende de xingar uma empresa, hostilizar quem construiu o produto ou exagerar o tamanho do problema.

## Posição e voz

Usuários primeiro: servir quem trabalha, compra, atende ou combina algo pelo navegador. Uma pequena melhoria verificável vale mais que um manifesto de indignação. A [pesquisa pública](research.md) dá contexto histórico, sem funcionar como prova de popularidade ou depoimento sobre a extensão.

Tom: direto, brasileiro e levemente irreverente. Usar frases curtas, humor sobre abrir outra aba e instruções claras quando algo falhar. Evitar “revolucionário”, “a comunidade inteira pediu”, insultos, urgência fabricada e promessas universais.

Subtexto de adoção nativa: **“Se isso virar padrão, a gente aposenta a extensão feliz.”** A frase comunica uma aspiração: o melhor resultado é o próprio fluxo resolver o problema. Não é uma negociação, solicitação de compra, pedido de emprego, anúncio de parceria ou alegação de interesse da Meta. Uma formulação de apoio é: “Código aberto. A ideia também pode virar recurso.”

## Sistema visual

| Elemento | Direção |
| --- | --- |
| Lima ácida — `#C7F65A` | Cor de assinatura, botões principais, destaque do retorno à aba. |
| Ink — `#17231B` | Texto principal e formas do símbolo. |
| Creme — `#F7F7EF` | Fundo claro, áreas de leitura e respiro. |
| Coral — `#FF795A` | Pontuação visual, situações de atrito e destaques secundários. |
| Símbolo | Aba de navegador com uma seta retornando para dentro. Desenho próprio, simples e legível em tamanho de ícone. |
| Tipografia | Sans legível, com suporte correto a “JáTá”; hierarquia firme e linguagem de interface familiar. |

Não usar balão de conversa, telefone, combinação derivada de logo do WhatsApp ou selo que pareça oficial. O símbolo precisa continuar reconhecível sem depender da cor. Nas aplicações, conferir contraste de texto e foco de teclado; o coral não deve ser o único sinal de erro. A palavra JáTá permanece como assinatura mais visível.

## Landing: ordem da conversa

1. **Reconhecer o incômodo.** “Outra aba? Poxa, já tá aberto.” Seguir com uma frase concreta: “A JáTá abre o link de conversa no WhatsApp Web que você já deixou aberto.”
2. **Demonstrar o resultado.** Mostrar origem do clique, conversa de destino e rascunho na mesma interface. Usar números e conteúdo fictícios. Demonstração de interface simulada deve trazer esse rótulo no próprio bloco; não apresentá-la como gravação autenticada.
3. **Explicar o alcance.** Mensagem preparada, envio manual, mesmo navegador e perfil. Falha de integração vira erro visível e preserva a aba. Não prometer funcionar com todos os tipos de link ou todas as versões.
4. **Dar confiança verificável.** Código disponível, instruções de instalação, permissões explicadas e limites de compatibilidade próximos da chamada de instalação. Licença de distribuição pretendida: **MIT**, acompanhada de arquivo de licença e aviso de autoria de 2026 Klederson Bueno nos artefatos publicados.
5. **Convidar a contribuir.** “Ver o código” e “Relatar um problema” são chamadas úteis. Fechar com “Se isso virar padrão, a gente aposenta a extensão feliz.”

O bloco de demonstração pode usar “Uma conversa nova. A aba de sempre.” Para casos de erro, preferir “Não consegui abrir a conversa. Sua aba continua como estava.” Somente usar esse texto quando o comportamento descrito estiver implementado.

## Credibilidade técnica e limites

**A integração com o aplicativo real autenticado não foi validada nesta sessão. Os testes de navegador simulam as interfaces do WhatsApp.** Essa informação deve estar legível na documentação e no bloco de compatibilidade; a landing não deve esconder a limitação em um rodapé genérico.

O critério central é preservar o documento já carregado, sem navegar, atualizar URL ou recarregar a aba para trocar de conversa. Uma demonstração de reutilização do identificador da aba, sozinha, não comprova isso. A validação técnica deve conferir também identidade do documento e seu estado, conversa e rascunho, além da falha sem fallback de navegação.

Antes de apresentar compatibilidade real como comprovada, registrar uma sessão autenticada de teste autorizada com conta de teste, navegador e versão, data, links sintéticos e resultado. Qualquer gravação pública deve excluir dados pessoais. Até lá, tratar a proposta como implementação com testes simulados e compatibilidade real pendente. A dependência de interfaces internas torna necessário comunicar que atualizações do WhatsApp podem afetá-la.

## Independência e cuidados de marca

As [diretrizes oficiais da Meta para WhatsApp](https://www.meta.com/brand/resources/whatsapp/whatsapp-brand/) orientam preservar a grafia “WhatsApp”, evitar protagonismo de seus recursos de marca e não sugerir parceria ou endosso. Usar o nome apenas para explicar compatibilidade, em texto comum. A assinatura e o símbolo são da JáTá.

Aviso sugerido: **“Projeto independente, sem vínculo, patrocínio ou endosso do WhatsApp ou da Meta.”**

Essas escolhas são mitigação editorial e visual, não garantia de aprovação, disponibilidade do nome JáTá ou liberação jurídica. Confirmar colisões de nome e adequação dos materiais antes da distribuição pública; a consulta realizada aqui não constitui pesquisa completa de marcas. Não usar “oficial”, “aprovado pela Meta” ou um cartão de parceria fictício.

## Open source e documentação acessível

O projeto deve ser fácil de instalar, inspecionar e corrigir. Organizar README em português com acesso claro a uma versão em inglês; publicar instruções equivalentes, limites conhecidos, política de privacidade e orientação de contribuição. A voz brasileira pode continuar na marca, enquanto títulos técnicos e relatos de erro permanecem fáceis de entender por pessoas de fora do Brasil.

Usar MIT de forma explícita nos arquivos de distribuição. Explicar permissões com relação ao que fazem pelo usuário. Distinguir release instalável, versão de desenvolvimento e qualquer assinatura exigida pelo navegador. Não apresentar cadastro, rastreamento ou compartilhamento de dados como condição para usar a extensão.

O formulário de issue deve pedir versão do navegador, versão da extensão, tipo de link sem telefone real, resultado esperado e resultado observado. Orientar reprodução com dados fictícios. Não pedir número pessoal, texto real, conversas, QR de acesso, cookies ou exportação de perfil. Aceitar feedback em português e inglês e responder com respeito, inclusive quando a solução adequada for uma limitação documentada.

## Plano sugerido de lançamento

Este plano não autoriza publicações ou contato com terceiros; nenhuma postagem foi feita nesta pesquisa.

| Etapa | Entrega e condição |
| --- | --- |
| Preparar | Consolidar identidade, licença MIT, documentação bilíngue, artefatos instaláveis e explicação de permissões. Verificar links e instruções. |
| Validar | Executar testes existentes e registrar separadamente a sessão real autenticada. Se ela continuar pendente, manter a limitação explícita e apresentar a versão como experimental. |
| Demonstrar | Produzir uma demonstração curta com dados fictícios, indicando com precisão se a interface é simulada ou real. Mostrar resultado e comportamento em falha. |
| Publicar, quando autorizado | Disponibilizar repositório e release; apresentar o projeto em espaços que aceitem esse tipo de contribuição, seguindo as regras locais e declarando autoria. Não repetir a mesma mensagem em massa. |
| Escutar | Acompanhar issues voluntárias, agrupar causas reproduzíveis e publicar limites e correções. Oferecer detalhes técnicos úteis a quem quiser investigar a proposta. |

Uma futura contribuição para adoção nativa pode reunir problema, reprodução, comportamento desejado e evidência de preservação do documento. A proposta aberta pode ser útil sem apelo público insistente ou marcação de funcionários.

## Medir utilidade sem vigiar conversas

Usar somente métricas agregadas já disponíveis na distribuição e contribuições voluntárias: downloads por release, issues por categoria, tempo de resposta e resultados de reprodução relatados com dados sintéticos. Identificar fonte, período e limites de cada total.

Não instrumentar links clicados, números, mensagens, destinatários, histórico, perfis, identificadores persistentes ou sessões do WhatsApp. Não instalar analytics comportamental como atalho para medir valor. Uma enquete opcional e anônima pode perguntar se a extensão resolveu o fluxo, deixando claro que é voluntária; suas respostas representam somente participantes.

O sinal de utilidade é haver casos reproduzíveis resolvidos e instruções compreensíveis. Downloads não demonstram usuários ativos; estrelas não comprovam compatibilidade; poucas issues não demonstram ausência de falhas. Publicar aprendizados com contexto, sem fabricar prova social.
