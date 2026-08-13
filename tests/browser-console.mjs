const FIREFOX_SCROLL_LINKED_WARNING = "This site appears to use a scroll-linked positioning effect";

export function isKnownBrowserWarning(message, browserName) {
  return browserName === "firefox"
    && message.type() === "warning"
    && message.text().includes(FIREFOX_SCROLL_LINKED_WARNING);
}
