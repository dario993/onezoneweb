import { Injectable } from '@angular/core';
import { NavigatorService } from './navigator.service';
import { StorageService } from './storage.service';
import { isString, isset, clone } from '../helper';

type LanguageType = 'de' | 'en' | 'fr' | 'it';

@Injectable({
  providedIn: 'root',
})
export class I18nService {
  private readonly sLocale: string = 'de';
  private oLanguage: Record<string, unknown> = {};
  public currentLanguage: LanguageType = 'de';

  private storage: StorageService | undefined;
  private navigator: NavigatorService | undefined;
  private languagesAvailable: string[] = [];

  public init(
    storage: StorageService,
    navigator: NavigatorService,
    languagesAvailable: string[]
  ): void {
    this.storage = storage;
    this.navigator = navigator;
    this.languagesAvailable = languagesAvailable;
    this.currentLanguage = this.getSelectedLanguage();
  }

  public checkLanguage(): string {
    if (!this.navigator) {
      throw new Error('Naviagor not initialized');
    }

    const sBrowserLang: string = this.navigator.getLanguage();
    // Wenn Browsersprache vorhanden ist, diese ausgeben
    if (this.languagesAvailable.indexOf(sBrowserLang) !== -1) {
      return sBrowserLang;
    }
    // Zweiter versuch mit prefix only
    const iPos: number = this.languagesAvailable.findIndex(
      (sLang: string): boolean => sLang.slice(0, 2) === sBrowserLang.slice(0, 2)
    );
    if (iPos !== -1) {
      return this.languagesAvailable[iPos];
    }
    // Wenn nix geht, dann default-sprache laden
    return this.sLocale;
  }

  public getSelectedLanguage(): LanguageType {
    if (!this.storage) {
      throw new Error('Storage not initialized');
    }

    let sLanguage: LanguageType = 'de';
    const storageLanguage: string = this.storage.getItem('selectedLanguage');
    if (storageLanguage) {
      switch (storageLanguage) {
        case 'en':
        case 'english': {
          sLanguage = 'en';
          break;
        }
        case 'fr':
        case 'french': {
          sLanguage = 'fr';
          break;
        }
        case 'it':
        case 'italian': {
          sLanguage = 'it';
          break;
        }
        case 'de': {
          sLanguage = 'de';
          break;
        }
      }
    }
    // Wenn keine Sprache angegeben wurde, die systemsprache wählen
    if (!isset(sLanguage, true)) {
      sLanguage = this.checkLanguage() as LanguageType;
      if (!isset(sLanguage, true)) {
        console.error('Could not load Language: ' + sLanguage);
        sLanguage = this.sLocale as LanguageType;
      }
      this.storage.setItem('selectedLanguage', sLanguage);
    }

    return sLanguage;
  }

  public loadLanguage(oLang: Record<string, unknown>): void {
    this.oLanguage = oLang;
  }

  public getTranslation(...aGroups: string[]): string {
    let oGroup: Record<string, unknown> = clone(this.oLanguage);
    while (aGroups.length !== 0) {
      const sGroup: string = aGroups.shift() as string;
      if (!isset(oGroup[sGroup])) {
        break;
      }
      if (isString(oGroup[sGroup])) {
        return oGroup[sGroup] as string;
      }
      oGroup = oGroup[sGroup] as Record<string, unknown>;
    }
    return 'MISSINGTRANSLATION';
  }

  public getTypeAsNummeric(languageType: LanguageType): number {
    switch (languageType) {
      case 'en': {
        return 4;
      }
      case 'fr': {
        return 2;
      }
      case 'it': {
        return 3;
      }
      case 'de':
      default: {
        return 1;
      }
    }
  }
}
