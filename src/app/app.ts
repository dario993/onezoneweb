import { Component, OnInit, inject } from '@angular/core';
import { I18nService } from './services/i18n.service';
import { I18nFileService } from './services/i18nfile.service';
import { StorageService } from './services/storage.service';
import { NavigatorService } from './services/navigator.service';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  template: `<router-outlet></router-outlet>`,
  imports: [RouterOutlet],
  standalone: true,
})
export class App implements OnInit {
  private readonly i18nService = inject(I18nService);
  private readonly i18nFileServce = inject(I18nFileService);
  private readonly storageService = inject(StorageService);
  private readonly navigatorService = inject(NavigatorService);
  private readonly authService = inject(AuthService);

  ngOnInit() {
    // Clear the storage on app start
    this.storageService.clearOldVersions();
    // Initialize I18nService when the app starts
    const languagesAvailable = ['de', 'en', 'fr', 'it']; // Adjust as needed
    this.i18nService.init(
      this.storageService,
      this.navigatorService,
      languagesAvailable
    );
    this.i18nService.loadLanguage(
      this.i18nFileServce.getLanguageFile(this.i18nService.currentLanguage)
    );

    this.authService.loadSession();
  }
}
