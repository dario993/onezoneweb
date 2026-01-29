import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoaderService } from '../../services/loader.service';
import { NavigatorService } from '../../services/navigator.service';
import { BrokerstarService } from '../../services/brokerstar.service';
import { I18nService } from '../../services/i18n.service';
import { I18nPipe } from '../../pipes/i18n.pipe';

@Component({
  selector: 'page-policyselect',
  standalone: true,
  templateUrl: './policyselect.component.html',
  styleUrls: ['./policyselect.component.scss'],
  imports: [CommonModule, I18nPipe],
})
export class PolicySelectComponent {
  public policies: Array<Record<string, any>> = [];

  constructor(
    private readonly navigator: NavigatorService,
    private readonly changeDetection: ChangeDetectorRef,
    private readonly brokerstarService: BrokerstarService,
    private readonly loaderService: LoaderService,
    public readonly i18n: I18nService
  ) {
    // load policies
    this.loaderService.show();
    this.brokerstarService.policyList().subscribe((response: any): void => {
      this.loaderService.hide();
      console.log(response.data);
      this.policies = response.data.map((policy: any): any => ({
        id: policy.id,
        insurance: policy.insurance.id,
        title: policy.branch.name,
        licencePlate:
          policy.insuredCars?.length > 0 ? policy.insuredCars[0].plate : '',
        selected: false,
      }));

      this.loadAvatars();
    });
  }

  public selectPolicy(policyid: string): void {
    this.navigator.navigateTo(`report/${policyid}`);
  }

  private loadAvatars(): void {
    this.policies.forEach((policy: any): void => {
      this.brokerstarService
        .contactGetAvatar(policy.insurance)
        .subscribe((avatar: any): void => {
          if (avatar instanceof Blob) {
            const reader = new FileReader();
            reader.readAsDataURL(avatar);
            reader.onloadend = () => {
              policy.img = <any>reader.result;
              this.changeDetection.detectChanges();
            };
          }
        });
    });
  }
}
