import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { isset } from '../../helper';
import { I18nService } from '../../services/i18n.service';
import { LoaderService } from '../../services/loader.service';
import { NavigatorService } from '../../services/navigator.service';
import { AuthService } from '../../services/auth.service';
import { BrokerstarService } from '../../services/brokerstar.service';
import { I18nPipe } from '../../pipes/i18n.pipe';
import { ToasterService } from '../../services/toaster.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  imports: [CommonModule, FormsModule, I18nPipe],
  standalone: true,
})
export class RegisterComponent implements OnInit {
  public registerType: 'person' | 'company' = 'person';

  public link: boolean = false;

  public securePass: boolean = true;

  public registerData: Record<string, unknown> = {};
  public birthday: Date = new Date();

  private code: string = '';
  private errorFields: Record<string, string | undefined> = {};

  constructor(
    private readonly route: ActivatedRoute,
    private readonly loaderService: LoaderService,
    private readonly navigator: NavigatorService,
    private readonly i18n: I18nService,
    private readonly auth: AuthService,
    private readonly brokerstarService: BrokerstarService,
    private readonly toasterService: ToasterService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  public ngOnInit(): void {
    this.route.params.subscribe((params) => {
      if (params['consultantCode']) {
        this.code = params['consultantCode'];
      }
      if (params['contactid']) {
        this.link = true;
      }
    });
  }

  public togglePasswordVisibility(): void {
    this.securePass = !this.securePass;
  }

  private checkData(): void {
    this.errorFields = {};
    if (this.registerType === 'person') {
      if (!isset(this.registerData['name1'])) {
        this.errorFields['name1'] = this.i18n.getTranslation(
          'register',
          'required'
        );
      }
    }
    if (!isset(this.registerData['name2'])) {
      this.errorFields['name2'] = this.i18n.getTranslation(
        'register',
        'required'
      );
    }
    if (!isset(this.registerData['address'])) {
      this.errorFields['address'] = this.i18n.getTranslation(
        'register',
        'required'
      );
    }
    if (!isset(this.registerData['postCode'])) {
      this.errorFields['postCode'] = this.i18n.getTranslation(
        'register',
        'required'
      );
    }
    if (!isset(this.registerData['city'])) {
      this.errorFields['city'] = this.i18n.getTranslation(
        'register',
        'required'
      );
    }
    if (!isset(this.registerData['mail'])) {
      this.errorFields['mail'] = this.i18n.getTranslation(
        'register',
        'required'
      );
    }
    if (!isset(this.registerData['birthday'])) {
      this.errorFields['birthday'] = this.i18n.getTranslation(
        'register',
        'required'
      );
    }
    if (!isset(this.registerData['password'])) {
      this.errorFields['password'] = this.i18n.getTranslation(
        'register',
        'required'
      );
    }
  }

  public async submit(): Promise<void> {
    this.loaderService.show();

    this.checkData();

    if (this.errorFields && Object.keys(this.errorFields).length > 0) {
      this.loaderService.hide();
      return;
    }

    const payload: Record<string, unknown> = {};
    payload['name1'] = ' ';
    payload['name2'] = ' ';

    if (isset(this.registerData['name1']) && this.registerType !== 'company') {
      payload['name1'] = this.registerData['name1'];
    }
    if (isset(this.registerData['name2'])) {
      payload['name2'] = this.registerData['name2'];
    }

    if (isset(this.registerData['address'])) {
      payload['address'] = this.registerData['address'];
    }
    if (isset(this.registerData['postCode'])) {
      payload['postCode'] = this.registerData['postCode'];
    }
    if (isset(this.registerData['city'])) {
      payload['city'] = this.registerData['city'];
    }
    if (isset(this.registerData['mobile'])) {
      payload['mobile'] = this.registerData['mobile'];
    }

    if (isset(this.registerData['mail'])) {
      // eslint-disable-next-line max-len, security/detect-unsafe-regex
      const oRegExp: RegExp =
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[(\d{1,3}\.){3}\d{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      if (!oRegExp.test(String(this.registerData['mail']).toLowerCase())) {
        this.toasterService.warn('Ungültige Email');
        this.errorFields['mail'] = this.i18n.getTranslation(
          'register',
          'invalid'
        );
        this.loaderService.hide();
        return;
      }
      payload['mail'] = this.registerData['mail'];
      payload['login'] = this.registerData['mail'];
    }
    payload['contactType'] = this.registerType === 'company' ? 1 : 2;
    if (isset(this.registerData['birthday'])) {
      const date: Date = new Date(String(this.registerData['birthday']));
      const day: number = date.getDate();
      const month: number = date.getMonth() + 1;
      payload['birthday'] = String(date.getFullYear());
      payload['birthday'] += '-' + (month < 10 ? '0' : '') + String(month);
      payload['birthday'] += '-' + (day < 10 ? '0' : '') + String(day);
    }
    if (isset(this.registerData['password'])) {
      payload['password'] = this.registerData['password'];
    }
    if (isset(this.code, true)) {
      payload['invitationCode'] = this.code;
    }
    if (!this.link) {
      payload['_sendMail'] = true;
    }

    payload['contactGroup'] = '3';
    payload['country'] = 1;
    payload['language'] = this.i18n.getTypeAsNummeric(
      this.i18n.getSelectedLanguage()
    );

    if (this.link) {
      payload['relationContactToCreator'] = this.registerData['relationship'];

      this.brokerstarService.addSubcontact(payload).subscribe({
        next: (_response: any) => {
          this.toasterService.success(
            this.i18n.getTranslation('profile', 'success')
          );
          this.navigator.back();
        },
        error: (error: any) => {
          this.toasterService.alert(
            this.i18n.getTranslation('profile', 'error')
          );
          console.log(error);
        },
        complete: () => this.loaderService.hide(),
      });
    } else {
      this.brokerstarService.registerUser(payload).subscribe({
        next: (response: any) => {
          this.toasterService.success(
            this.i18n.getTranslation('profile', 'success')
          );

          this.brokerstarService
            .login(
              String(this.registerData['mail']),
              String(this.registerData['password'])
            )
            .subscribe({
              next: async (data: any): Promise<void> => {
                if (isset(data.token)) {
                  this.brokerstarService.token = data.token;
                  if (await this.auth.startSession(data)) {
                    await this.navigator.navigateTo('policyadd');
                  }
                }
              },
              error: (error: any): void => {
                console.log(error);
              },
              complete: (): void => {
                this.loaderService.hide();
              },
            });
        },
        error: (error: any) => {
          if (error.error?.error) {
            this.toasterService.alert(error.error.error);
          } else {
            this.toasterService.alert(
              this.i18n.getTranslation('profile', 'error')
            );
          }

          if (error.error?.violations) {
            error.error.violations.forEach((violation: any) => {
              this.errorFields[violation.propertyPath] = violation.title;
            });
          }

          this.loaderService.hide();

          // Trigger Angular lifecycle
          this.cdr.detectChanges();
        },
        complete: () => this.loaderService.hide(),
      });
    }
  }

  public hasError(field: string): boolean {
    return isset(this.errorFields[field]);
  }

  public getError(field: string): string {
    return this.errorFields[field] || '';
  }
}
