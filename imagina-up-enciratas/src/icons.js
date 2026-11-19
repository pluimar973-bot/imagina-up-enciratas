// Íconos de línea (24x24, trazo 1.6) — uno por categoría + interfaz. Sin dependencias.
(function (root) {
  const P = {
    ropa: '<path d="M8 3 3 6l2 4 3-1v11h8V9l3 1 2-4-5-3a4 4 0 0 1-8 0z"/>',
    calzado: '<path d="M3 17v-4l4-1 2-4 3 2 3 1c3 1 6 2 6 5v1H3z"/><path d="M3 20h18"/>',
    perfumes: '<rect x="6" y="9" width="12" height="12" rx="3"/><path d="M10 9V6h4v3M9 4h6"/>',
    belleza: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18"/>',
    comida: '<path d="M7 3v7M5 3v4a2 2 0 0 0 4 0V3M7 10v11M17 3c-2 2-3 5-3 8h3v10"/>',
    cafe: '<path d="M5 9h11v5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5zM16 10h2a2.5 2.5 0 0 1 0 5h-2M8 4v2M12 4v2"/>',
    postres: '<path d="M8 11h8l-4 10zM8 11a4 4 0 1 1 8 0"/>',
    super: '<path d="M3 4h2l2.4 11h10L20 7H6.5M9 20h.01M17 20h.01"/>',
    juguetes: '<rect x="3" y="12" width="8" height="8" rx="1"/><rect x="13" y="12" width="8" height="8" rx="1"/><rect x="8" y="4" width="8" height="8" rx="1"/>',
    regalos: '<rect x="4" y="10" width="16" height="10" rx="1"/><path d="M3 7h18v3H3zM12 7v13M12 7c-3 0-4-3-2-3s2 3 2 3zm0 0c3 0 4-3 2-3s-2 3-2 3z"/>',
    deportes: '<path d="M6 7v10M3 9v6M18 7v10M21 9v6M6 12h12"/>',
    hogar: '<path d="M4 11l8-7 8 7v9H4zM10 20v-6h4v6"/>',
    decoracion: '<path d="M7 4h10l2 8H5zM12 12v7M8 20h8"/>',
    tecnologia: '<rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M11 18h2"/>',
    entretenimiento: '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M14 6v12" stroke-dasharray="2 2"/>',
    mascotas: '<circle cx="7" cy="10" r="1.6"/><circle cx="12" cy="7" r="1.6"/><circle cx="17" cy="10" r="1.6"/><path d="M8 17c0-3 2-5 4-5s4 2 4 5c0 2-2 2-4 1-2 1-4 1-4-1z"/>',
    papeleria: '<path d="M4 20l1-5L16 4l4 4L9 19zM14 6l4 4"/>',
    opticas: '<circle cx="7" cy="14" r="4"/><circle cx="17" cy="14" r="4"/><path d="M11 14h2M3 14l2-7M21 14l-2-7"/>',
    otros: '<path d="M4 9l1-5h14l1 5M4 9v11h16V9M4 9a3 3 0 0 0 5 1 3 3 0 0 0 6 0 3 3 0 0 0 5-1M10 20v-5h4v5"/>',
    // interfaz
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    back: '<path d="M15 5l-7 7 7 7"/>',
    chevron: '<path d="M7 10l5 5 5-5"/>',
    send: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    bell: '<path d="M6 17V11a6 6 0 0 1 12 0v6l1.500 2h-15z"/><path d="M10 21a2 2 0 0 0 4 0"/>',
    pin: '<path d="M12 21s-6.500-5.800-6.500-11a6.500 6.500 0 0 1 13 0c0 5.200-6.500 11-6.500 11z"/><circle cx="12" cy="10" r="2.300"/>',
    bag: '<path d="M5 8h14l-1 12H6z"/><path d="M9 8a3 3 0 0 1 6 0"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.8 3.4-5.5 6.5-5.5s5.700 1.700 6.500 5.500"/><circle cx="17" cy="9" r="2.5"/><path d="M17 14.200c2.500.2 4.200 1.800 4.800 4.800"/>',
    heart: '<path d="M12 20.500S3.500 15.200 3.500 9.200A4.700 4.700 0 0 1 12 6.700a4.700 4.700 0 0 1 8.500 2.500c0 6-8.500 11.300-8.500 11.300z"/>',
    flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
    star: '<path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.9 6.8 19.7l1-5.9L3.5 9.7l5.9-.8z"/>',
    tag: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17h.01"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    alert: '<path d="M12 4 3 20h18z"/><path d="M12 10v4M12 17h.01"/>',
    external: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
    edit: '<path d="M4 20l1-4L16 5l3 3L8 19zM14 7l3 3"/>',
    download: '<path d="M12 4v11M7 11l5 5 5-5M5 20h14"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>'
  };
  function svg(name, size = 20, sw = 1.6) {
    return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name] || P.otros}</svg>`;
  }
  const LABEL = { ropa: "Ropa", calzado: "Calzado", perfumes: "Perfume", belleza: "Belleza", comida: "Comida", cafe: "Café", postres: "Postres", super: "Súper", juguetes: "Juguetes", regalos: "Regalos", deportes: "Deportes", hogar: "Hogar", decoracion: "Decoración", tecnologia: "Tecnología", entretenimiento: "Entretenimiento", mascotas: "Mascotas", papeleria: "Papelería", opticas: "Ópticas", otros: "Otros" };
  root.GastaIcons = { svg, LABEL, has: (n) => !!P[n] };
  if (typeof module !== "undefined") module.exports = root.GastaIcons;
})(typeof window !== "undefined" ? window : globalThis);
