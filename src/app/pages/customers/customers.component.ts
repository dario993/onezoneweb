import { ChangeDetectorRef, Component, OnDestroy } from '@angular/core';
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
  selector: 'page-customers',
  standalone: true,
  templateUrl: './customers.component.html',
  styleUrls: ['./customers.component.scss'],
  imports: [CommonModule, FormsModule, I18nPipe],
})
export class CustomersComponent implements OnDestroy {
  public customers: any[] = [];
  public searchValueSubject: BehaviorSubject<string> =
    new BehaviorSubject<string>('');
  private readonly destroy$ = new Subject<void>();

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
    // Initialer Load wird durch das BehaviorSubject mit leerem String getriggert
    this.searchValueSubject
      .pipe(
        debounceTime(300), // Wartet 300ms nach dem letzten Tastendruck
        distinctUntilChanged(), // Führt nur aus wenn sich der Wert geändert hat
        takeUntil(this.destroy$) // Verhindert Memory Leaks
      )
      .subscribe((searchValue) => {
        this.loadCustomers(searchValue);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  public addCustomer(): void {
    // Navigate to customer creation page - implementation depends on your routing setup
    this.router.navigate(['/customer/add']);
  }

  public async openCustomer(customer: any): Promise<void> {
    await this.router.navigate(['/policies/' + customer.id]);
  }

  public mail(customer: any): void {
    if (customer.data?.mail) {
      window.open(`mailto:${customer.data?.mail}`, '_blank');
    } else if (customer.data?.mailPrivate) {
      window.open(`mailto:${customer.data?.mailPrivate}`, '_blank');
    }
  }

  public phone(customer: any): void {
    if (customer.data?.phoneDirect) {
      window.open(`tel:${customer.data?.phoneDirect}`, '_blank');
    } else if (customer.data?.phonePrivate) {
      window.open(`tel:${customer.data?.phonePrivate}`, '_blank');
    } else if (customer.data?.phoneWork) {
      window.open(`tel:${customer.data?.phoneWork}`, '_blank');
    } else if (customer.data?.mobile) {
      window.open(`tel:${customer.data?.mobile}`, '_blank');
    }
  }

  private loadCustomers(search: string = ''): void {
    this.loaderService.show();
    this.brokerstarService
      .contactContactList({
        q: search,
        'filters[show_contacts]': 2,
        'add[has_mandate_file]': true,
        'add[policy_count]': true,
        'add[sub_contact_count]': true,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe((response: any): void => {
        this.loaderService.hide();
        if (response.data) {
          this.customers = response.data.map((profile: any) => ({
            id: profile.id,
            data: null, // Explizit null setzen für bessere Typisierung
          }));

          // sort auth user to the top
          this.customers.sort((a: any, b: any): number => {
            if (a.id === this.auth.userData.contact.id) {
              return -1;
            }
            if (b.id === this.auth.userData.contact.id) {
              return 1;
            }
            return 0;
          });

          this.customers.forEach((profile: any) => {
            this.loadCustomer(profile.id);
          });

          this.changeDetection.detectChanges();
        }
      });
  }

  private loadCustomer(contactid: number): void {
    // check if data is already set on profile
    const profile = this.customers.find((item: any) => item.id === contactid);
    if (profile?.data) {
      return;
    }

    this.loaderService.show();
    this.brokerstarService
      .contact(contactid)
      .pipe(takeUntil(this.destroy$))
      .subscribe((response: any): void => {
        this.loaderService.hide();

        // update profile in profiles
        const profileIndex = this.customers.findIndex(
          (item: any) => item.id === contactid
        );

        if (profileIndex !== -1) {
          this.customers[profileIndex] = {
            ...this.customers[profileIndex],
            name: this.auth.getUserName(
              response.contactType.id as number,
              String(response.name1),
              String(response.name2)
            ),
            data: response,
          };

          this.changeDetection.detectChanges();
        }
      });
  }
}
