import { errorMessage, localizedError, message, normalizeErrorCode } from "./i18n.js";

const api = globalThis.browser ?? globalThis.chrome;
const status = document.getElementById("status");
const retry = document.getElementById("retry");

document.documentElement.lang = message("language", api);
document.title = message("handoffTitle", api);
for (const element of document.querySelectorAll("[data-i18n]")) {
  element.textContent = message(element.dataset.i18n, api);
}
document.querySelector(".symbol").alt = message("brandName", api);

async function openConversation() {
  retry.hidden = true;
  retry.disabled = true;
  delete document.body.dataset.errorCode;
  status.textContent = message("opening", api);
  try {
    const result = await api.runtime.sendMessage({
      type: "route-conversation",
      canGoBack: history.length > 1
    });
    if (!result?.ok) throw localizedError(result?.code ?? "extension-unavailable", api);
    status.textContent = message("opened", api);
  } catch (error) {
    const code = normalizeErrorCode(error?.code, "extension-unavailable");
    document.body.dataset.errorCode = code;
    status.textContent = errorMessage(code, api);
    retry.hidden = false;
  } finally {
    retry.disabled = false;
  }
}

retry.addEventListener("click", openConversation);
openConversation();
