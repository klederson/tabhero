// The original URL travels in a fragment, so phone numbers and text never reach
// an intermediate server. URLSearchParams decodes exactly once.
export function conversationUrl(input) {
  let source;
  try {
    source = new URL(input);
  } catch {
    return null;
  }
  if (!["http:", "https:"].includes(source.protocol) || source.username || source.password || source.port) {
    return null;
  }

  let phone;
  if (source.hostname === "wa.me") {
    const match = source.pathname.match(/^\/(\+?\d+)\/?$/);
    if (match) phone = match[1];
    else if (source.pathname !== "/") return null;
    else phone = source.searchParams.get("phone");
  } else if (["api.whatsapp.com", "www.whatsapp.com"].includes(source.hostname) && /^\/send\/?$/.test(source.pathname)) {
    phone = source.searchParams.get("phone");
  } else {
    return null;
  }

  const target = new URL("https://web.whatsapp.com/send");
  if (phone) {
    // A literal + in query strings is decoded as a space, which is also a
    // permitted phone separator. Reject letters instead of silently removing them.
    if (!/^[+\d\s().-]+$/.test(phone)) return null;
    phone = phone.replace(/[^\d]/g, "");
    if (!phone) return null;
    target.searchParams.set("phone", phone);
  }
  if (source.searchParams.has("text")) {
    target.searchParams.set("text", source.searchParams.get("text"));
  }
  if (!phone) return null;
  return target.href;
}

export function redirectRules(handoffUrl) {
  // RE2-compatible expressions, limited to conversation links. Business short
  // codes, group invitations, channels and WhatsApp Web itself are left alone.
  const expressions = [
    "^https?://wa\\.me/(\\+?[0-9]+/?(\\?[^#]*)?|\\?([^&#]*&)*phone=[^#]*)(#.*)?$",
    "^https?://(api|www)\\.whatsapp\\.com/send/?\\?([^&#]*&)*phone=[^#]*(#.*)?$"
  ];
  return expressions.map((regexFilter, index) => ({
    id: index + 1,
    priority: 1,
    action: {
      type: "redirect",
      redirect: { regexSubstitution: `${handoffUrl}#\\0` }
    },
    condition: {
      regexFilter,
      isUrlFilterCaseSensitive: true,
      resourceTypes: ["main_frame"],
      requestMethods: ["get"]
    }
  }));
}
