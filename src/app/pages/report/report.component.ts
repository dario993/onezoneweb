import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { I18nService } from '../../services/i18n.service';
import { LoaderService } from '../../services/loader.service';
import { NavigatorService } from '../../services/navigator.service';
import { AuthService } from '../../services/auth.service';
import { BrokerstarService } from '../../services/brokerstar.service';
import { ToasterService } from '../../services/toaster.service';
import { I18nPipe } from '../../pipes/i18n.pipe';
import { PolicyPremiumInterface } from '../../interfaces/policy.interface';
import { getDayFormatted, getMonthFormatted } from '../../helper';

@Component({
  selector: 'page-report',
  standalone: true,
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.scss'],
  imports: [CommonModule, FormsModule, I18nPipe],
})
export class ReportComponent implements OnInit {
  public policy: PolicyPremiumInterface = {
    id: 0,
    insurance: 0,
    img: '',
    title: '',
    nr: '',
    endDate: 0,
    amount: 0,
    invoicedate: '',
    invoiceamount: '',
  };

  public injure: any = {
    dateOfInjure: undefined,
    injureDescription: '',
  };

  public images: File[] = [];

  constructor(
    public readonly auth: AuthService,
    private readonly route: ActivatedRoute,
    private readonly changeDetection: ChangeDetectorRef,
    private readonly brokerstarService: BrokerstarService,
    private readonly navigator: NavigatorService,
    private readonly toasterService: ToasterService,
    public readonly i18n: I18nService,
    private readonly loaderService: LoaderService
  ) {}

  public ngOnInit(): void {
    this.route.params.subscribe((params: Record<string, any>) => {
      this.loadPolicy(params['policyid']);
    });
  }

  public async addImage(): Promise<void> {
    // Create a file input element programmatically
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;

    input.onchange = (event: Event) => {
      const target = event.target as HTMLInputElement;
      if (target.files) {
        const newFiles = Array.from(target.files);
        this.images = this.images.concat(newFiles);
        this.changeDetection.detectChanges();
      }
    };

    input.click();
  }

  public getImageUrl(file: File): string {
    return URL.createObjectURL(file);
  }

  public removeImage(index: number): void {
    this.images.splice(index, 1);
    this.changeDetection.detectChanges();
  }

  public async submit(): Promise<void> {
    // make datetimestring compatible with backend
    let dateTime: string = `${String(this.injure.dateOfInjure)} 00:00:00`;

    // Create Claim
    this.loaderService.show();
    this.brokerstarService
      .createClaim(this.policy.id, dateTime, this.injure.injureDescription)
      .subscribe(async (response: any): Promise<void> => {
        // Upload Pictures
        const dtNow: Date = new Date();
        const files: File[] = this.images; // Web files are already File objects

        if (files.length > 0) {
          await this.brokerstarService
            .uploadFile(
              files,
              [
                {
                  data: JSON.stringify({
                    claim: response.id,
                    documentDate:
                      String(dtNow.getFullYear()) +
                      '-' +
                      getMonthFormatted(dtNow) +
                      '-' +
                      getDayFormatted(dtNow),
                  }),
                  parameterName: 'data',
                },
              ],
              response.id
            )
            .catch((error: any): void => {
              console.error('Error uploading file:', error);
            });
        }
        this.loaderService.hide();

        // Versicherung benachrichtigen
        this.brokerstarService.claimInformInsurances(response.id).subscribe();

        this.toasterService.success(
          this.i18n.getTranslation('injure', 'injurecreated')
        );

        this.navigator.navigateTo('home');
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
        this.policy.title = String(response.branch.name);
        this.policy.endDate = new Date(String(response.endDate)).getTime();
        this.policy.nr = String(response.nr);

        this.loadAvatar(this.policy.insurance);
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
            this.changeDetection.detectChanges();
          };
        }
      });
  }
}
