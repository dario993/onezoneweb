import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { I18nService } from '../../services/i18n.service';
import { LoaderService } from '../../services/loader.service';
import { NavigatorService } from '../../services/navigator.service';
import { AuthService } from '../../services/auth.service';
import { BrokerstarService } from '../../services/brokerstar.service';
import { I18nPipe } from '../../pipes/i18n.pipe';
import { StorageService } from '../../services/storage.service';
import { I18nFileService } from '../../services/i18nfile.service';
import { ToasterService } from '../../services/toaster.service';

@Component({
  selector: 'app-language',
  templateUrl: './language.component.html',
  styleUrls: ['./language.component.scss'],
  imports: [CommonModule, I18nPipe],
  standalone: true,
})
export class LanguageComponent {
  selectedLanguage = 'german'; // Aktuelle Sprache
  showLanguageList = false; // Ob die Sprachenliste angezeigt werden soll
  languages: Array<Record<string, any>> = [
    {
      id: 1,
      code: 'de',
      name: 'german',
    },
    {
      id: 2,
      code: 'fr',
      name: 'french',
    },
    {
      id: 3,
      code: 'it',
      name: 'italian',
    },
    {
      id: 4,
      code: 'en',
      name: 'english',
    },
  ];
  languagesToChooseFrom: Array<Record<string, any>> = [];

  constructor(
    private readonly auth: AuthService,
    private readonly storage: StorageService,
    private readonly i18n: I18nService,
    private readonly i18nFile: I18nFileService,
    public readonly navigator: NavigatorService,
    private readonly brokerstarService: BrokerstarService,
    private readonly toasterService: ToasterService,
    private readonly loaderService: LoaderService
  ) {
    const storageLanguage = this.storage.getItem('selectedLanguage');
    // if storage language code matches any language code in the languages array then set the selected language to the language name
    const result = this.languages.find((language) => {
      return language['code'] === storageLanguage;
    });
    if (result) {
      this.selectedLanguage = result['name'];
    }
  }

  public showLanguages(): void {
    this.filterLanguages();
    this.showLanguageList = !this.showLanguageList;
  }

  public selectLanguage(language: any): void {
    this.loaderService.show();

    this.selectedLanguage = language.name;
    this.showLanguageList = false;

    // Save selection in local storage
    this.storage.setItem('selectedLanguage', language.code);

    // Load language file
    this.i18n.loadLanguage(this.i18nFile.getLanguageFile(language.code));

    if (this.auth.isLogged()) {
      this.saveLanguageToUser();
    } else {
      this.loaderService.hide();
      window.location.reload();
    }
  }

  private filterLanguages(): void {
    this.languagesToChooseFrom = this.languages.filter((language) => {
      return (
        language['name']
          .toLowerCase()
          .indexOf(this.selectedLanguage.toLowerCase()) === -1
      );
    });
  }

  private saveLanguageToUser() {
    const payload: Record<string, unknown> = {};

    // language is the current id of the language
    const newLanguage: Record<string, unknown> | undefined =
      this.languages.find((language) => {
        return language['name'] === this.selectedLanguage;
      });

    if (!newLanguage) {
      return;
    }

    payload['language'] = newLanguage['id'];

    this.brokerstarService
      .changeContact(this.auth.userData.contact.id, payload)
      .subscribe({
        next: (_result: any) => {
          this.toasterService.success(
            this.i18n.getTranslation('profile', 'success')
          );
          this.loaderService.hide();
          window.location.reload();
        },
        error: (error: any) => {
          this.toasterService.alert(
            this.i18n.getTranslation('profile', 'error')
          );
          console.log(error);
          this.loaderService.hide();
        },
      });
  }
}
