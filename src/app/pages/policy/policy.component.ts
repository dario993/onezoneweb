import {
  Component,
  OnInit,
  ChangeDetectorRef,
  computed,
  signal,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { LoaderService } from '../../services/loader.service';
import { NavigatorService } from '../../services/navigator.service';
import { BrokerstarService } from '../../services/brokerstar.service';
import { I18nService } from '../../services/i18n.service';
import { I18nPipe } from '../../pipes/i18n.pipe';
import { PolicyPremiumInterface } from '../../interfaces/policy.interface';
import { getDatetimeFromTimestamp } from '../../helper';

@Component({
  selector: 'page-policy',
  standalone: true,
  templateUrl: './policy.component.html',
  styleUrls: ['./policy.component.scss'],
  imports: [CommonModule, DatePipe, I18nPipe],
})
export class PolicyComponent implements OnInit {
  public policy: PolicyPremiumInterface = {
    id: 0,
    insurance: 0,
    img: '',
    title: '',
    licencePlate: null,
    nr: '',
    endDate: 0,
    amount: 0,
    invoicedate: '',
    invoiceamount: '',
  };
  public policyDocument = signal<any>({ id: null });
  public hasBilling = signal(false);
  public hasPolicyDocument = computed(
    () => this.policyDocument() && this.policyDocument().id !== null
  );

  constructor(
    private readonly navigator: NavigatorService,
    private readonly route: ActivatedRoute,
    private readonly changeDetection: ChangeDetectorRef,
    private readonly brokerstarService: BrokerstarService,
    private readonly loaderService: LoaderService,
    public readonly i18n: I18nService
  ) {}

  public ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.loadPolicy(params['policyid']);
    });
  }

  private loadPolicy(policyid: number) {
    this.loaderService.show();
    this.brokerstarService
      .policy(String(policyid))
      .subscribe((response: any): void => {
        this.loaderService.hide();

        this.policy.id = policyid;
        this.policy.insurance = response.insurance.id;
        this.policy.title = response.branch.name;
        this.policy.licencePlate =
          response.insuredCars?.length > 0
            ? response.insuredCars[0].plate
            : null;
        this.policy.endDate = new Date(String(response.endDate)).getTime();
        this.policy.nr = String(response.nr);

        this.policyDocument.set(response.policyDocument);

        this.loadAvatar(this.policy.insurance);
        this.loadPremiumData(policyid);
      });
  }

  private loadAvatar(insuranceid: number): void {
    this.brokerstarService
      .contactGetAvatar(insuranceid)
      .subscribe((avatar: any): void => {
        if (avatar instanceof Blob) {
          const reader = new FileReader();
          reader.readAsDataURL(avatar);
          reader.onloadend = () => {
            this.policy.img = <any>reader.result;
          };
        }
        this.changeDetection.detectChanges();
      });
  }

  private loadPremiumData(policyid: number): void {
    this.loaderService.show();
    this.brokerstarService
      .premiumInvoice(String(policyid))
      .subscribe((response: any): void => {
        this.loaderService.hide();
        if (response && response.amountBrutto !== undefined) {
          this.hasBilling.set(true);

          this.policy.amount = response.amountBrutto;
          this.policy.invoiceamount = String(this.policy.amount) + ' CHF';
          this.policy.invoicedate =
            getDDMMYYYY(response.startDate) +
            ' bis ' +
            getDDMMYYYY(response.endDate);
        }
      });
  }

  public downloadPolicy(): void {
    const doc = this.policyDocument();
    if (doc && doc.id) {
      this.navigator.navigateTo(`file/${doc.id}`);
    }
  }

  public createReport(): void {
    this.navigator.navigateTo(`report/${this.policy.id}`);
  }

  public gotoConsultant(): void {
    this.navigator.navigateTo(`consultant/${this.policy.id}`);
  }
}

function getDDMMYYYY(dtString: string): string {
  const dtDate: Date = new Date(dtString);
  return getDatetimeFromTimestamp(dtDate.getTime(), false, true, false);
}
