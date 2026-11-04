// English remains usable in tests and environments without WebExtension i18n.
export const englishMessages = Object.freeze({
  language: "en",
  brandName: "TabHero",
  extensionName: "TabHero — New chat. Same tab.",
  extensionDescription: "Open WhatsApp conversation links in your existing WhatsApp Web tab, keeping the phone number and message.",
  actionTitle: "TabHero — open WhatsApp Web",
  activationFailed: "Couldn't activate. Reload the extension and check its permissions for WhatsApp websites.",
  handoffTitle: "TabHero — opening your conversation",
  headlineFirst: "New chat.",
  headlineSecond: "Same tab.",
  opening: "Opening the conversation in WhatsApp Web…",
  opened: "Conversation opened. You can close this tab.",
  retry: "Try again",
  openWhatsApp: "Open WhatsApp Web",
  errorInvalidRequest: "Invalid conversation link.",
  errorUnavailable: "This version of WhatsApp doesn't support the integration. Your tab wasn't reloaded.",
  errorNotReady: "Sign in to WhatsApp Web and wait for your chats to load. Then try again.",
  errorContactNotFound: "Couldn't open a conversation with this number. Check the number and your connection.",
  errorOpenFailed: "WhatsApp didn't confirm that the conversation opened. Your tab wasn't reloaded. Try again.",
  errorInternal: "Couldn't open the conversation inside WhatsApp. Your tab wasn't reloaded. Check your connection and try again.",
  errorDocumentUnavailable: "Couldn't access the loaded WhatsApp page. Your tab wasn't reloaded.",
  errorInjectionFailed: "Couldn't connect to the loaded WhatsApp page. Your tab wasn't reloaded. Check the extension's permissions and try again.",
  errorLoadTimeout: "Wait for WhatsApp to finish loading and try again. Your tab wasn't reloaded.",
  errorUnauthorizedSource: "This page isn't authorized to open a conversation.",
  errorInvalidLink: "This link doesn't contain a valid conversation number or message.",
  errorRouting: "Couldn't open the conversation. Your existing WhatsApp tab wasn't reloaded.",
  errorExtensionUnavailable: "Couldn't reach the extension. Reload the extension and try again."
});

const errorKeys = Object.freeze({
  "invalid-request": "errorInvalidRequest",
  unavailable: "errorUnavailable",
  "not-ready": "errorNotReady",
  "contact-not-found": "errorContactNotFound",
  "open-failed": "errorOpenFailed",
  "internal-error": "errorInternal",
  "document-unavailable": "errorDocumentUnavailable",
  "injection-failed": "errorInjectionFailed",
  "load-timeout": "errorLoadTimeout",
  "unauthorized-source": "errorUnauthorizedSource",
  "invalid-link": "errorInvalidLink",
  "routing-failed": "errorRouting",
  "extension-unavailable": "errorExtensionUnavailable"
});

export function message(key, api = globalThis.browser ?? globalThis.chrome) {
  return api?.i18n?.getMessage?.(key) || englishMessages[key] || key;
}

export function normalizeErrorCode(code, fallback = "routing-failed") {
  return Object.hasOwn(errorKeys, code) ? code : fallback;
}

export function errorMessage(code, api) {
  return message(errorKeys[normalizeErrorCode(code)], api);
}

export function localizedError(code, api) {
  const error = new Error(errorMessage(code, api));
  error.code = normalizeErrorCode(code);
  return error;
}
