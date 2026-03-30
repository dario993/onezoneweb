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
import { AutomationService } from '../../services/automation.service';
import { Quote } from '../../interfaces/quote.interface';
import { StorageService } from '../../services/storage.service';
import { firstValueFrom, timeout } from 'rxjs';
import { ToasterService } from '../../services/toaster.service';

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
  public isConsultant: boolean = false;
  public isVerifying: boolean = false;

  constructor(
    private readonly authService: AuthService,
    public readonly navigator: NavigatorService,
    private readonly brokerstarService: BrokerstarService,
    private readonly oneZoneService: OneZoneService,
    private readonly loaderService: LoaderService,
    public readonly i18n: I18nService,
    private readonly automationService: AutomationService,
    private readonly storageService: StorageService,
    private readonly toasterService: ToasterService
  ) {
    this.username = authService.getUserName();
    this.isConsultant = isTrue(this.authService.userData.login?.isSharer);

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

    // if consultant, fetch api_key from automation backend
    if (this.isConsultant) {
      const onezoneId = String(this.authService.userData?.contact?.id);
      this.automationService.getConsultant(onezoneId).subscribe({
        next: (res) => {
          if (res.api_key) {
            this.storageService.setItem('consultantApiKey', res.api_key);
          }
        },
        error: () => {
          // consultant not registered in automation system, ignore
        },
      });
    }
  }

  public async onGeneraPreventivi(): Promise<void> {
    const consultantId = this.authService.userData?.contact?.id;
    if (!consultantId) return;

    this.isVerifying = true;
    try {
      const result = await firstValueFrom(
        this.automationService.checkLogin(String(consultantId)).pipe(
          timeout(90000)
        )
      );
      if (result.login_check) {
        this.navigator.navigateTo('automation-form');
      } else {
        this.navigator.navigateTo('automation-setup');
      }
    } catch (err: any) {
      if (err?.name === 'TimeoutError') {
        this.toasterService.warn(
          'Login su EcoHub FALLITO. Ripetere la procedura. Se il problema persiste, contattare il webmaster.'
        );
      } else {
        // 404 = consulente non registrato, qualsiasi altro errore → setup
        this.navigator.navigateTo('automation-setup');
      }
    } finally {
      this.isVerifying = false;
    }
  }

  public getLocalizedText(text: string | Record<string, string>): string {
    if (typeof text === 'string') {
      return text;
    }
    return text[this.i18n.currentLanguage] || Object.values(text)[0] || '';
  }
}
