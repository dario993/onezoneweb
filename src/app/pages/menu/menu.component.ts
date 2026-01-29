import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { I18nService } from '../../services/i18n.service';
import { LoaderService } from '../../services/loader.service';
import { NavigatorService } from '../../services/navigator.service';
import { AuthService } from '../../services/auth.service';
import { BrokerstarService } from '../../services/brokerstar.service';
import { I18nPipe } from '../../pipes/i18n.pipe';
import statics from '../../../assets/statics.json';

@Component({
  selector: 'page-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss'],
  imports: [CommonModule, I18nPipe],
  standalone: true,
})
export class MenuComponent {
  public menu: Array<Record<string, any>> = [];

  constructor(
    public readonly navigator: NavigatorService,
    private readonly authService: AuthService,
    private readonly brokerstarService: BrokerstarService,
    public readonly i18n: I18nService,
    private readonly loaderService: LoaderService
  ) {
    // load menu
    this.loaderService.show();
    brokerstarService.customerportalmenu(2).subscribe((response: any): void => {
      this.loaderService.hide();
      this.menu = response;
    });
  }

  public async logout(): Promise<void> {
    this.loaderService.show();
    await this.authService.logout();
    await this.navigator.navigateTo('login');
    this.loaderService.hide();
  }

  public openOneZoneWeb(): void {
    this.navigator.navigateTo(
      statics.LinkOneZoneWebsite[this.i18n.currentLanguage]
    );
  }
}
