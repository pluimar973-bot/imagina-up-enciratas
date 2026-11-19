// Abre el panel lateral (chatbot) al hacer clic en el ícono de la extensión.
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((e) => console.error(e));
