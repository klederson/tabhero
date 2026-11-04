# Regras de trabalho

Antes de implementar, entenda o problema no contexto de uso e derive critérios de aceite a partir do resultado que a pessoa quer. Não substitua esse resultado por uma aproximação técnica conveniente. Os testes precisam verificar o comportamento pedido, não apenas repetir a implementação escolhida.

## Critério central desta extensão

Ao capturar um link de conversa, abrir a conversa dentro do WhatsApp Web que já está carregado. Preservar o documento e a sessão da aba existente. Não usar navegação, atualização de URL ou recarga dessa aba para trocar de conversa. Não introduzir recarga como fallback silencioso. Se a integração interna falhar, apresentar erro e manter a aba intacta.

Os testes de navegador devem verificar a identidade do documento e seu estado, além da conversa e do texto. Reutilizar apenas o ID da aba não comprova o comportamento correto. Distinguir claramente testes com interface simulada de validação em uma sessão autenticada real.

<!-- nyanaia:voice-rule:begin pre=0 new=1 -->
## Nyanaia: linha de voz

Só quando você parar e passar a vez para a pessoa (terminou o que ela pediu, precisa de uma resposta ou de uma permissão), termine a resposta com uma linha que comece com 🔊 e diga, numa frase curta e falada (até 220 caracteres), o que aconteceu ou do que você precisa. Sem código, caminhos, hashes, ids ou links.

Não escreva a linha 🔊 em atualizações de andamento, em respostas intermediárias, em turnos de um loop automático que continua sozinho, nem para repetir algo que já disse numa linha 🔊 anterior.
<!-- nyanaia:voice-rule:end -->
