import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, switchMap, takeUntil } from 'rxjs/operators';
import { isset } from '../../helper';
import { I18nService } from '../../services/i18n.service';
import { LoaderService } from '../../services/loader.service';
import { BrokerstarService } from '../../services/brokerstar.service';
import { AutomationService } from '../../services/automation.service';
import { I18nPipe } from '../../pipes/i18n.pipe';
import { ToasterService } from '../../services/toaster.service';
import { LocalityEntry, StreetEntry } from '../../interfaces/automation.interface';

@Component({
  selector: 'page-customers-mandate-add',
  standalone: true,
  templateUrl: './customers-mandate-add.component.html',
  styleUrls: ['./customers-mandate-add.component.scss'],
  imports: [CommonModule, FormsModule, I18nPipe],
})
export class CustomersMandateAddComponent implements OnInit, OnDestroy {
  public registerType: 'person' | 'company' = 'person';
  public registerData: Record<string, unknown> = {};
  private errorFields: Record<string, string | undefined> = {};

  public plzSuggestions: LocalityEntry[] = [];
  public areaSuggestions: LocalityEntry[] = [];
  public streetSuggestions: StreetEntry[] = [];
  public showPlzDropdown = false;
  public showAreaDropdown = false;
  public showAddressDropdown = false;
  public addressLoading = false;
  public plzActiveIndex = -1;
  public areaActiveIndex = -1;
  public addressActiveIndex = -1;
  private readonly validAddresses = new Set<string>();
  private readonly addressInput$ = new Subject<string>();
  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly router: Router,
    private readonly loaderService: LoaderService,
    private readonly i18n: I18nService,
    private readonly brokerstarService: BrokerstarService,
    private readonly automationService: AutomationService,
    private readonly toasterService: ToasterService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  public ngOnInit(): void {
    this.addressInput$
      .pipe(
        debounceTime(350),
        distinctUntilChanged(),
        filter((v) => v.length >= 3 && this.canQueryStreets()),
        switchMap((name) => {
          this.addressLoading = true;
          const plz = String(this.registerData['postCode'] || '');
          const area = String(this.registerData['city'] || '');
          return this.automationService.searchStreets(name, plz, area);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((streets) => {
        this.streetSuggestions = streets;
        streets.forEach((s) => this.validAddresses.add(s.name.toLowerCase()));
        this.showAddressDropdown = streets.length > 0;
        this.addressActiveIndex = -1;
        this.addressLoading = false;
        this.cdr.detectChanges();
      });
  }

  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Autocomplete CAP ──────────────────────────────────────────────────────
  public onPlzInput(): void {
    this.resetAddressContext();
    const val = String(this.registerData['postCode'] || '');
    if (val.length >= 2) {
      this.plzSuggestions = this.automationService.searchByPlz(val);
      this.showPlzDropdown = this.plzSuggestions.length > 0;
    } else {
      this.plzSuggestions = [];
      this.showPlzDropdown = false;
    }
    this.plzActiveIndex = -1;
  }

  public selectPlz(entry: LocalityEntry): void {
    this.registerData['postCode'] = entry.plz;
    this.registerData['city'] = entry.locality;
    this.showPlzDropdown = false;
    this.plzSuggestions = [];
    this.plzActiveIndex = -1;
    this.resetAddressContext();
  }

  public hidePlzDropdown(): void {
    setTimeout(() => {
      this.showPlzDropdown = false;
      this.plzActiveIndex = -1;
    }, 200);
  }

  // ── Autocomplete Località ─────────────────────────────────────────────────
  public onAreaFocus(): void {
    const plz = String(this.registerData['postCode'] || '');
    if (plz.length === 4) {
      this.areaSuggestions = this.automationService.getLocalitiesByPlz(plz);
      this.showAreaDropdown = this.areaSuggestions.length > 1;
    }
    this.areaActiveIndex = -1;
  }

  public onAreaInput(): void {
    this.resetAddressContext();
    this.areaActiveIndex = -1;
  }

  public selectArea(entry: LocalityEntry): void {
    this.registerData['city'] = entry.locality;
    this.showAreaDropdown = false;
    this.areaSuggestions = [];
    this.areaActiveIndex = -1;
    this.resetAddressContext();
  }

  public hideAreaDropdown(): void {
    setTimeout(() => {
      this.showAreaDropdown = false;
      this.areaActiveIndex = -1;
    }, 200);
  }

  // ── Autocomplete Indirizzo ────────────────────────────────────────────────
  public canQueryStreets(): boolean {
    const plz = String(this.registerData['postCode'] || '');
    const area = String(this.registerData['city'] || '').trim();
    if (plz.length !== 4 || area.length === 0) return false;
    const localities = this.automationService.getLocalitiesByPlz(plz);
    if (localities.length === 0) return false;
    return localities.some((l) => l.locality === area);
  }

  public onAddressInput(value: string): void {
    if (!this.canQueryStreets()) {
      this.streetSuggestions = [];
      this.showAddressDropdown = false;
      this.addressActiveIndex = -1;
      return;
    }
    if (value.length >= 3) {
      this.addressInput$.next(value);
    } else {
      this.streetSuggestions = [];
      this.showAddressDropdown = false;
      this.addressActiveIndex = -1;
    }
  }

  public selectStreet(s: StreetEntry): void {
    this.validAddresses.add(s.name.toLowerCase());
    this.registerData['address'] = s.name;
    this.showAddressDropdown = false;
    this.streetSuggestions = [];
    this.addressActiveIndex = -1;
  }

  public hideAddressDropdown(): void {
    setTimeout(() => {
      this.showAddressDropdown = false;
      this.addressActiveIndex = -1;
    }, 200);
  }

  private resetAddressContext(): void {
    this.streetSuggestions = [];
    this.showAddressDropdown = false;
    this.addressActiveIndex = -1;
    this.validAddresses.clear();
    if (this.registerData['address']) {
      this.registerData['address'] = '';
    }
  }

  public onDropdownKeydown(event: KeyboardEvent, kind: 'plz' | 'area' | 'address'): void {
    const state = this.getDropdownState(kind);
    if (!state.isOpen || state.items.length === 0) return;
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.setActiveIndex(kind, (state.activeIndex + 1) % state.items.length);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.setActiveIndex(kind, (state.activeIndex - 1 + state.items.length) % state.items.length);
        break;
      case 'Home':
        event.preventDefault();
        this.setActiveIndex(kind, 0);
        break;
      case 'End':
        event.preventDefault();
        this.setActiveIndex(kind, state.items.length - 1);
        break;
      case 'Enter':
        if (state.activeIndex >= 0 && state.activeIndex < state.items.length) {
          event.preventDefault();
          const item = state.items[state.activeIndex];
          if (kind === 'plz') this.selectPlz(item as LocalityEntry);
          else if (kind === 'area') this.selectArea(item as LocalityEntry);
          else this.selectStreet(item as StreetEntry);
        }
        break;
      case 'Escape':
        event.preventDefault();
        this.closeDropdown(kind);
        break;
    }
  }

  private getDropdownState(kind: 'plz' | 'area' | 'address'):
    { items: (LocalityEntry | StreetEntry)[]; isOpen: boolean; activeIndex: number } {
    if (kind === 'plz') return { items: this.plzSuggestions, isOpen: this.showPlzDropdown, activeIndex: this.plzActiveIndex };
    if (kind === 'area') return { items: this.areaSuggestions, isOpen: this.showAreaDropdown, activeIndex: this.areaActiveIndex };
    return { items: this.streetSuggestions, isOpen: this.showAddressDropdown, activeIndex: this.addressActiveIndex };
  }

  private setActiveIndex(kind: 'plz' | 'area' | 'address', i: number): void {
    if (kind === 'plz') this.plzActiveIndex = i;
    else if (kind === 'area') this.areaActiveIndex = i;
    else this.addressActiveIndex = i;
  }

  private closeDropdown(kind: 'plz' | 'area' | 'address'): void {
    if (kind === 'plz') { this.showPlzDropdown = false; this.plzActiveIndex = -1; }
    else if (kind === 'area') { this.showAreaDropdown = false; this.areaActiveIndex = -1; }
    else { this.showAddressDropdown = false; this.addressActiveIndex = -1; }
  }

  // ── Validazione ───────────────────────────────────────────────────────────
  private checkData(): void {
    this.errorFields = {};
    if (this.registerType === 'person') {
      if (!isset(this.registerData['gender'])) {
        this.errorFields['gender'] = this.i18n.getTranslation('register', 'required');
      }
      if (!isset(this.registerData['name1'])) {
        this.errorFields['name1'] = this.i18n.getTranslation('register', 'required');
      }
    }
    if (!isset(this.registerData['name2'])) {
      this.errorFields['name2'] = this.i18n.getTranslation('register', 'required');
    }

    const plz = String(this.registerData['postCode'] || '');
    const city = String(this.registerData['city'] || '').trim();
    const address = String(this.registerData['address'] || '').trim();

    if (!plz) {
      this.errorFields['postCode'] = this.i18n.getTranslation('register', 'required');
    } else if (!/^\d{4}$/.test(plz) || this.automationService.getLocalitiesByPlz(plz).length === 0) {
      this.errorFields['postCode'] = this.i18n.getTranslation('register', 'invalid');
    }

    if (!city) {
      this.errorFields['city'] = this.i18n.getTranslation('register', 'required');
    } else if (!this.errorFields['postCode']) {
      const localities = this.automationService.getLocalitiesByPlz(plz);
      if (!localities.some((l) => l.locality === city)) {
        this.errorFields['city'] = this.i18n.getTranslation('register', 'invalid');
      }
    }

    if (!address) {
      this.errorFields['address'] = this.i18n.getTranslation('register', 'required');
    } else if (!this.validAddresses.has(address.toLowerCase())) {
      this.errorFields['address'] = this.i18n.getTranslation('register', 'invalid');
    }

    if (!isset(this.registerData['address_number'])) {
      this.errorFields['address_number'] = this.i18n.getTranslation('register', 'required');
    }

    if (!isset(this.registerData['mail'])) {
      this.errorFields['mail'] = this.i18n.getTranslation('register', 'required');
    }
    if (!isset(this.registerData['mobile'])) {
      this.errorFields['mobile'] = this.i18n.getTranslation('register', 'required');
    }
    if (this.registerType === 'person' && !isset(this.registerData['birthday'])) {
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
      const num = String(this.registerData['address_number'] || '').trim();
      payload['address'] = num
        ? `${this.registerData['address']} ${num}`
        : this.registerData['address'];
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
        sessionStorage.removeItem('customers-mandate-cache');
        const contactId = response?.contact?.id || response?.id;
        this.loaderService.hide();
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
    });
  }

  public hasError(field: string): boolean {
    return isset(this.errorFields[field]);
  }

  public getError(field: string): string {
    return this.errorFields[field] || '';
  }
}
