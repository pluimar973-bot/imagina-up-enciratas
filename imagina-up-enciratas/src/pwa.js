// Sólo en la versión web: registra el service worker y ofrece «Instalar». En la extensión no hace nada.
(function () {
  if (!/^https?:$/.test(location.protocol)) return;
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
  let deferred;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault(); deferred = e;
    const b = document.getElementById("installBtn"); if (b) b.hidden = false;
  });
  document.addEventListener("click", async (e) => {
    if (!e.target.closest("#installBtn") || !deferred) return;
    deferred.prompt(); await deferred.userChoice; deferred = null;
    document.getElementById("installBtn").hidden = true;
  });
  // iPhone no dispara beforeinstallprompt: se muestra una guía en Ayuda
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !navigator.standalone;
  if (ios) document.documentElement.classList.add("ios-install");
})();
