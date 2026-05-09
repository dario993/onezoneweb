import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { isset } from '../../helper';
import { I18nService } from '../../services/i18n.service';
import { LoaderService } from '../../services/loader.service';
import { BrokerstarService } from '../../services/brokerstar.service';
import { I18nPipe } from '../../pipes/i18n.pipe';
import { ToasterService } from '../../services/toaster.service';

@Component({
  selector: 'page-customers-mandate-add',
  standalone: true,
  templateUrl: './customers-mandate-add.component.html',
  styleUrls: ['./customers-mandate-add.component.scss'],
  imports: [CommonModule, FormsModule, I18nPipe],
})
export class CustomersMandateAddComponent implements OnInit {
  public registerType: 'person' | 'company' = 'person';
  public registerData: Record<string, unknown> = {};
  private errorFields: Record<string, string | undefined> = {};

  constructor(
    private readonly router: Router,
    private readonly loaderService: LoaderService,
    private readonly i18n: I18nService,
    private readonly brokerstarService: BrokerstarService,
    private readonly toasterService: ToasterService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  public ngOnInit(): void {}

  private checkData(): void {
    this.errorFields = {};
    if (this.registerType === 'person') {
      if (!isset(this.registerData['name1'])) {
        this.errorFields['name1'] = this.i18n.getTranslation('register', 'required');
      }
    }
    if (!isset(this.registerData['name2'])) {
      this.errorFields['name2'] = this.i18n.getTranslation('register', 'required');
    }
    if (!isset(this.registerData['address'])) {
      this.errorFields['address'] = this.i18n.getTranslation('register', 'required');
    }
    if (!isset(this.registerData['postCode'])) {
      this.errorFields['postCode'] = this.i18n.getTranslation('register', 'required');
    }
    if (!isset(this.registerData['city'])) {
      this.errorFields['city'] = this.i18n.getTranslation('register', 'required');
    }
    if (!isset(this.registerData['mail'])) {
      this.errorFields['mail'] = this.i18n.getTranslation('register', 'required');
    }
    if (!isset(this.registerData['birthday'])) {
      this.errorFields['birthday'] = this.i18n.getTranslation('register', 'required');
    }
  }

  public async submit(): Promise<void> {
    this.loaderService.show();

    this.checkData();

    if (this.errorFields && Object.keys(this.errorFields).length > 0) {
      this.loaderService.hide();
      return;
    }

    const userMe: any = await firstValueFrom(this.brokerstarService.userMe());
    const userContact = userMe?.contact;

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
        this.errorFields['mail'] = this.i18n.getTranslation('register', 'invalid');
        this.loaderService.hide();
        return;
      }
      payload['mail'] = this.registerData['mail'];
      payload['login'] = this.registerData['mail'];
    }

    payload['password'] = '123456789';
    payload['contactType'] = this.registerType === 'company' ? 1 : 2;

    if (isset(this.registerData['birthday'])) {
      const date: Date = new Date(String(this.registerData['birthday']));
      const day: number = date.getDate();
      const month: number = date.getMonth() + 1;
      payload['birthday'] = String(date.getFullYear());
      payload['birthday'] += '-' + (month < 10 ? '0' : '') + String(month);
      payload['birthday'] += '-' + (day < 10 ? '0' : '') + String(day);
    }

    payload['country'] = 1;
    payload['language'] = this.i18n.getTypeAsNummeric(this.i18n.getSelectedLanguage());
    payload['contactGroup'] = '3';
    if (userContact?.id) {
      payload['sharer'] = {
        id: userContact.id,
        name: userContact.name,
        name1: userContact.name1,
        name2: userContact.name2,
        updatedAt: userContact.updatedAt,
      };
    }
    if (userContact?.fax) {
      payload['invitationCode'] = userContact.fax;
    }
    payload['_sendMail'] = false;

    this.brokerstarService.registerUser(payload).subscribe({
      next: (response: any) => {
        this.toasterService.success(this.i18n.getTranslation('profile', 'success'));
        const contactId = response?.contact?.id || response?.id;
        this.router.navigate(['/customers-mandate-policies/' + contactId]);
      },
      error: (error: any) => {
        if (error.error?.error) {
          this.toasterService.alert(error.error.error);
        } else {
          this.toasterService.alert(this.i18n.getTranslation('profile', 'error'));
        }
        if (error.error?.violations) {
          error.error.violations.forEach((violation: any) => {
            this.errorFields[violation.propertyPath] = violation.title;
          });
        }
        this.loaderService.hide();
        this.cdr.detectChanges();
      },
      complete: () => this.loaderService.hide(),
    });
  }

  public hasError(field: string): boolean {
    return isset(this.errorFields[field]);
  }

  public getError(field: string): string {
    return this.errorFields[field] || '';
  }
}
