const api = globalThis.browser ?? globalThis.chrome;
const status = document.getElementById("status");
const retry = document.getElementById("retry");

async function openConversation() {
  retry.hidden = true;
  retry.disabled = true;
  status.textContent = "Abrindo a conversa no WhatsApp Web…";
  try {
    const result = await api.runtime.sendMessage({
      type: "route-conversation",
      canGoBack: history.length > 1
    });
    if (!result?.ok) throw new Error(result?.error ?? "Recarregue a extensão e tente novamente.");
    status.textContent = "Conversa aberta. Você pode fechar esta aba.";
  } catch (error) {
    status.textContent = error.message;
    retry.hidden = false;
  } finally {
    retry.disabled = false;
  }
}

retry.addEventListener("click", openConversation);
openConversation();
