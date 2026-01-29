import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { isset } from '../../helper';
import { I18nService } from '../../services/i18n.service';
import { LoaderService } from '../../services/loader.service';
import { NavigatorService } from '../../services/navigator.service';
import { AuthService } from '../../services/auth.service';
import { BrokerstarService } from '../../services/brokerstar.service';
import { StorageService } from '../../services/storage.service';
import { ToasterService } from '../../services/toaster.service';
import { I18nPipe } from '../../pipes/i18n.pipe';

@Component({
  selector: 'page-policyadd',
  standalone: true,
  templateUrl: './policyadd.component.html',
  styleUrls: ['./policyadd.component.scss'],
  imports: [CommonModule, FormsModule, I18nPipe],
})
export class PolicyAddComponent {
  public insurances: Array<{
    id: number;
    name: string;
    selected: boolean;
  }> = [];

  // debug variable to always go to agreement page
  private alwaysToAgreement: boolean = false;

  constructor(
    private readonly storage: StorageService,
    private readonly i18n: I18nService,
    private readonly toasterService: ToasterService,
    private readonly navigator: NavigatorService,
    private readonly brokerstarService: BrokerstarService,
    private readonly loaderService: LoaderService,
    private readonly auth: AuthService
  ) {
    this.loadInsurance();
  }

  private loadInsurance(): void {
    this.loaderService.show();
    this.brokerstarService.insurance().subscribe((response: any): void => {
      this.loaderService.hide();
      this.insurances = response.data.map((insurance: any): any => ({
        id: insurance.id,
        name: insurance.name,
        selected: false,
      }));
    });
  }

  public submit(): void {
    this.loaderService.show();
    // eslint-disable-next-line max-len
    this.brokerstarService
      .getDocumentCategoryItemInfo(String(this.auth.userData.contact.id))
      .subscribe(async (data: any): Promise<any> => {
        const selectedPolicies: any[] = this.insurances.filter(
          (policy: any): any => policy.selected
        );
        if (!this.alwaysToAgreement && this.hasFileResponseValidID(data)) {
          // inform insurances
          this.brokerstarService
            .mandateInformInsurances(
              false,
              selectedPolicies.reduce(
                (
                  acc: Record<string, boolean>,
                  curr: any
                ): Record<string, boolean> => {
                  acc[curr.id] = false;
                  return acc;
                },
                {}
              )
            )
            .subscribe();

          // open snackbar and inform user
          this.toasterService.success(
            this.i18n.getTranslation('agreement', 'successsend')
          );
          await this.navigator.navigateTo('home');
        } else {
          this.storage.setItem(
            'selectedPolicies',
            JSON.stringify(selectedPolicies)
          );
          await this.navigator.navigateTo('agreement');
        }
        this.loaderService.hide();
      });
  }

  private hasFileResponseValidID(responseData: any): boolean {
    let hasValidID: boolean = false;
    // check if data is set
    if (responseData.data.length > 0) {
      // go through each data entry and check if file has an id
      responseData.data.forEach((data: any): void => {
        if (isset(data.file?.id)) {
          hasValidID = true;
        }
      });
    }
    return hasValidID;
  }
}
