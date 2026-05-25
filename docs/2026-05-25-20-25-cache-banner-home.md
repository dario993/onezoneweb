# Cache-first banner Home

Stessa logica di `consultantData`: la risposta di `GET https://onezone.ch/wp-json/wp/v2/banner` (`OneZoneService.banner()`) viene salvata in localStorage con chiave `bannerData`. Se presente, lo slider viene popolato dalla cache e la chiamata API è saltata. Pulita al logout da `StorageService.clear()`.

Modifica: `src/app/pages/home/home.component.ts` (blocco "load banner").
