import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoaderService } from '../../services/loader.service';
import { NavigatorService } from '../../services/navigator.service';
import { AuthService } from '../../services/auth.service';
import { isArray, isTrue } from '../../helper';
import { OneZoneService } from '../../services/onezone.service';
import { BrokerstarService } from '../../services/brokerstar.service';
import { I18nPipe } from '../../pipes/i18n.pipe';
import { I18nService } from '../../services/i18n.service';
import { Quote } from '../../interfaces/quote.interface';

@Component({
  selector: 'page-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  imports: [CommonModule, I18nPipe],
  standalone: true,
})
export class HomeComponent {
  public slider: any[] = [];
  public activeSlide: number = 0;
  public username: string = '';
  public menu: Array<Record<string, any>> = [];
  public quote: Quote = {
    header: '',
    body: '',
    footer: '',
  };

  constructor(
    private readonly authService: AuthService,
    public readonly navigator: NavigatorService,
    private readonly brokerstarService: BrokerstarService,
    private readonly oneZoneService: OneZoneService,
    private readonly loaderService: LoaderService,
    public readonly i18n: I18nService
  ) {
    this.username = authService.getUserName();

    // load banner
    this.loaderService.show();
    oneZoneService.banner().subscribe({
      next: (response: any): void => {
        if (isArray(response)) {
          this.slider = response.map((slide: any, idx: number): any => {
            slide.app_data.id = idx;
            return slide.app_data;
          });
        }
      },
      error: (error: any): void => {
        console.log(error);
      },
      complete: (): void => {
        this.loaderService.hide();
      },
    });

    // load menu
    let menuType: number = 1;
    if (isTrue(this.authService.userData.login.isSharer)) {
      menuType = 3;
    }
    this.loaderService.show();
    brokerstarService
      .customerportalmenu(menuType)
      .subscribe((response: any): void => {
        this.menu = response;
        this.loaderService.hide();
      });

    // load qoute
    brokerstarService.quotation().subscribe((response: any): void => {
      if (response.data) {
        this.quote =
          response.data[Math.floor(Math.random() * response.data.length)];
      }
    });
  }

  public getLocalizedText(text: string | Record<string, string>): string {
    if (typeof text === 'string') {
      return text;
    }
    return text[this.i18n.currentLanguage] || Object.values(text)[0] || '';
  }
}
