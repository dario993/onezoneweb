import { ChangeDetectorRef, Component, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LoaderService } from '../../services/loader.service';
import { AuthService } from '../../services/auth.service';
import { BrokerstarService } from '../../services/brokerstar.service';
import { I18nPipe } from '../../pipes/i18n.pipe';
import { BehaviorSubject, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'page-customers-mandate',
  standalone: true,
  templateUrl: './customers-mandate.component.html',
  styleUrls: ['./customers-mandate.component.scss'],
  imports: [CommonModule, FormsModule, I18nPipe],
})
export class CustomersMandateComponent implements OnDestroy, AfterViewInit {
  public customers: any[] = [];
  public searchValueSubject: BehaviorSubject<string> =
    new BehaviorSubject<string>('');
  private readonly destroy$ = new Subject<void>();
  private currentPage = 0;
  private totalPages = 0;
  public isLoadingPage = false;
  public allPagesLoaded = false;

  private scrollHandler: (() => void) | null = null;
  private mainElement: HTMLElement | null = null;

  private readonly requestParams: Record<string, any> = {
    'filters[show_contacts]': 2,
    'add[has_mandate_file]': true,
    'add[policy_count]': true,
    'add[sub_contact_count]': true,
  };

  get searchvalue(): string {
    return this.searchValueSubject.value;
  }

  set searchvalue(value: string) {
    this.searchValueSubject.next(value);
  }

  constructor(
    private readonly router: Router,
    private readonly auth: AuthService,
    private readonly changeDetection: ChangeDetectorRef,
    private readonly brokerstarService: BrokerstarService,
    private readonly loaderService: LoaderService
  ) {
    this.searchValueSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe((searchValue) => {
        this.resetAndLoad(searchValue);
      });
  }

  ngAfterViewInit(): void {
    this.mainElement = document.querySelector('main');
    if (this.mainElement) {
      this.scrollHandler = () => this.onMainScroll();
      this.mainElement.addEventListener('scroll', this.scrollHandler);
    }
  }

  ngOnDestroy(): void {
    if (this.mainElement && this.scrollHandler) {
      this.mainElement.removeEventListener('scroll', this.scrollHandler);
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  private onMainScroll(): void {
    if (!this.mainElement) {
      return;
    }
    const nearBottom =
      this.mainElement.scrollHeight - this.mainElement.scrollTop - this.mainElement.clientHeight < 200;
    if (nearBottom && !this.isLoadingPage && !this.allPagesLoaded) {
      this.loadNextPage();
    }
  }

  public addCustomer(): void {
    this.router.navigate(['/customers-mandate-add']);
  }

  public async openCustomer(customer: any): Promise<void> {
    await this.router.navigate(['/customers-mandate-policies/' + customer.id]);
  }

  public mail(customer: any): void {
    if (customer.mail) {
      window.open(`mailto:${customer.mail}`, '_blank');
    } else if (customer.mailPrivate) {
      window.open(`mailto:${customer.mailPrivate}`, '_blank');
    }
  }

  public phone(customer: any): void {
    if (customer.phoneDirect) {
      window.open(`tel:${customer.phoneDirect}`, '_blank');
    } else if (customer.phonePrivate) {
      window.open(`tel:${customer.phonePrivate}`, '_blank');
    } else if (customer.phoneWork) {
      window.open(`tel:${customer.phoneWork}`, '_blank');
    } else if (customer.mobile) {
      window.open(`tel:${customer.mobile}`, '_blank');
    }
  }

  private resetAndLoad(search: string): void {
    this.customers = [];
    this.currentPage = 0;
    this.totalPages = 0;
    this.allPagesLoaded = false;
    this.loadNextPage(search);
  }

  private loadNextPage(search?: string): void {
    if (this.isLoadingPage) {
      return;
    }

    const nextPage = this.currentPage + 1;
    this.isLoadingPage = true;
    this.loaderService.show();

    const params: Record<string, any> = {
      ...this.requestParams,
      q: search ?? this.searchvalue,
    };

    this.brokerstarService
      .loadContactPage(nextPage, params)
      .pipe(takeUntil(this.destroy$))
      .subscribe((response: any): void => {
        this.isLoadingPage = false;
        this.loaderService.hide();

        if (response?.data) {
          this.totalPages = response.pages || 1;
          this.currentPage = nextPage;
          this.allPagesLoaded = this.currentPage >= this.totalPages;

          const newCustomers = response.data.map((contact: any) => ({
            id: contact.id,
            name: this.auth.getUserName(
              contact.contactType?.id as number,
              String(contact.name1),
              String(contact.name2)
            ),
            address: contact.address,
            postcode: contact.postcode,
            city: contact.city,
            mail: contact.mail,
            mailPrivate: contact.mailPrivate,
            phoneDirect: contact.phoneDirect,
            phonePrivate: contact.phonePrivate,
            phoneWork: contact.phoneWork,
            mobile: contact.mobile,
            hasMandateFile: contact.hasMandateFile,
            policyCount: contact.policyCount || 0,
            subContactCount: contact.subContactCount || 0,
          }));

          if (this.currentPage === 1) {
            const authUserId = this.auth.userData?.contact?.id;
            const authUserIndex = newCustomers.findIndex(
              (c: any) => c.id === authUserId
            );
            if (authUserIndex > 0) {
              const [authUser] = newCustomers.splice(authUserIndex, 1);
              newCustomers.unshift(authUser);
            }
          }

          this.customers = [...this.customers, ...newCustomers];
          this.changeDetection.detectChanges();
        }
      });
  }
}
