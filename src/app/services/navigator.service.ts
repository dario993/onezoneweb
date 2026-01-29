import { Location } from '@angular/common';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { I18nService } from './i18n.service';

@Injectable({
  providedIn: 'root',
})
export class NavigatorService {
  public inMenu: boolean = false;

  constructor(
    private readonly router: Router,
    private readonly location: Location,
    private readonly i18n: I18nService
  ) {}

  public async navigateTo(
    destination: string | Record<string, string>,
    isMenu: boolean = false
  ): Promise<void> {
    this.inMenu = isMenu;
    let link: string = '';

    // check if destination is an object
    if (destination instanceof Object) {
      link =
        destination['destinationUrl' + this.getSuffix()] ||
        destination['destinationUrl'];
    } else {
      link = destination;
    }

    // if link contains app// then it is an internal link otherwise it is an external link
    if (link.indexOf('app://home') > -1) {
      link = link.replace('app://home', '');
    }
    if (link.indexOf('app://') > -1) {
      link = link.replace('app://', '');
    }

    // check if link is a relative path or an absolute url
    console.log('navigateTo', link);
    if (link.indexOf('http') === -1) {
      await this.router.navigate(['/' + link]);
    } else {
      // open url in new tab
      window.open(link, '_blank');
    }
  }

  public back(): void {
    this.inMenu = false;
    this.location.back();
  }

  public getLanguage(): string {
    return navigator.language || navigator.languages[0] || 'de';
  }

  private getSuffix(): string {
    switch (this.i18n.currentLanguage) {
      case 'en': {
        return 'E';
      }
      case 'it': {
        return 'I';
      }
      case 'fr': {
        return 'F';
      }
      case 'de':
      default: {
        return '';
      }
    }
  }
}
