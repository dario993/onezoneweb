import { Injectable } from "@angular/core";

import * as locale_DE from "../../assets/i18n/de.json";
import * as locale_EN from "../../assets/i18n/en.json";
import * as locale_FR from "../../assets/i18n/fr.json";
import * as locale_IT from "../../assets/i18n/it.json";

@Injectable({
  providedIn: "root",
})
export class I18nFileService {
  getLanguageFile(code: string): Record<string, any> {
    switch (code) {
      case "en": {
        return locale_EN;
      }
      case "fr": {
        return locale_FR;
      }
      case "it": {
        return locale_IT;
      }
      case "de":
      default:
        return locale_DE;
    }
  }
}
