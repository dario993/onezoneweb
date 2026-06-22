import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { LoaderService } from '../../services/loader.service';
import { NavigatorService } from '../../services/navigator.service';
import { AuthService } from '../../services/auth.service';
import { BrokerstarService } from '../../services/brokerstar.service';
import { I18nService } from '../../services/i18n.service';
import { ToasterService } from '../../services/toaster.service';
import { I18nPipe } from '../../pipes/i18n.pipe';
import { PolicyByClient } from '../../interfaces/policy-by-client.interface';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'page-customers-mandate-policies',
  standalone: true,
  templateUrl: './customers-mandate-policies.component.html',
  styleUrls: ['./customers-mandate-policies.component.scss'],
  imports: [CommonModule, I18nPipe],
})
export class CustomersMandatePoliciesComponent implements OnInit {
  public policies: Array<Record<string, any>> = [];
  public policiesByClient: PolicyByClient[] = [];
  public contactname: string = '';
  public loaded = false;

  public hasMandateFile: boolean = true;
  public insurances: Array<{ id: number; name: string; selected: boolean }> = [];
  public mandatePdfFile: File | null = null;
  public isProduction: boolean = environment.production;
  private clientId: string = '';
  private contactLoginId: number = 0;

  constructor(
    private readonly auth: AuthService,
    private readonly navigator: NavigatorService,
    private readonly route: ActivatedRoute,
    private readonly changeDetection: ChangeDetectorRef,
    private readonly brokerstarService: BrokerstarService,
    private readonly loaderService: LoaderService,
    private readonly toasterService: ToasterService,
    public readonly i18n: I18nService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      if (params['id']) {
        this.clientId = params['id'];
        this.loadPolicies(params['id']);
        this.loadContact(params['id']);
      }
    });
  }

  private loadInsurances(): void {
    this.brokerstarService.insurance().subscribe((response: any): void => {
      this.insurances = response.data.map((insurance: any) => ({
        id: insurance.id,
        name: insurance.name,
        selected: false,
      }));
    });
  }

  public onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.mandatePdfFile = input.files?.[0] ?? null;
  }

  public async submitMandate(): Promise<void> {
    if (!this.mandatePdfFile) {
      this.toasterService.warn('Bitte eine PDF-Datei auswählen');
      return;
    }

    if (!this.insurances.some((i) => i.selected)) {
      this.toasterService.warn(this.i18n.getTranslation('agreement', 'selectInsurance'));
      return;
    }

    this.loaderService.show();
    try {
      await this.brokerstarService.uploadProfileFile(
        {
          currentUploadEntryid: 1,
          profileid: this.clientId,
          currentLanguage: this.i18n.currentLanguage,
        },
        this.mandatePdfFile
      );

      const insurancesMap = this.insurances
        .filter((i) => i.selected)
        .reduce(
          (acc: Record<string, boolean>, curr): Record<string, boolean> => {
            acc[curr.id] = true;
            return acc;
          },
          {}
        );

      this.brokerstarService.mandateInformInsurances(true, insurancesMap, this.contactLoginId).subscribe();

      this.toasterService.success(this.i18n.getTranslation('agreement', 'successsend'));
      this.navigator.navigateTo('home');
    } catch (_error) {
      this.toasterService.alert('Fehler beim Hochladen des Mandats');
    } finally {
      this.loaderService.hide();
    }
  }

  public loadPolicies(clientid: string): void {
    this.loaderService.show();
    this.brokerstarService
      .policyList({ contact: clientid })
      .subscribe((response: any): void => {
        this.policies = response.data.map((policy: any): any => ({
          id: policy.id,
          contactname: policy.contact.name,
          insurance: policy.insurance.id,
          title: policy.branch.name,
          licencePlate:
            policy.insuredCars?.length > 0 ? policy.insuredCars[0].plate : null,
          selected: false,
        }));

        this.policiesByClient = [];
        this.policies.forEach((policy: any): void => {
          const client = this.policiesByClient.find(
            (item: PolicyByClient): boolean => item.name === policy.contactname
          );
          if (client) {
            client.clientPolicies.push(policy);
          } else {
            this.policiesByClient.push({
              name: policy.contactname,
              clientPolicies: [policy],
            });
          }
        });

        this.loadAvatars();
        this.loaded = true;
        this.loaderService.hide();
      });
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

  private loadContact(contactid: string, attempt: number = 0): void {
    this.loaderService.show();
    this.brokerstarService
      .contact(Number(contactid))
      .subscribe((response: any): void => {
        // brokerstarService.contact() cattura gli errori e ritorna {}.
        // Subito dopo la creazione del contact si verifica una race con lo share
        // consulente↔contact: la GET può tornare 403 → response vuota.
        // Ritentare fino a 3 volte (1s di delay) e, se fallisce ancora, forzare un reload.
        if (!response || !response.contactType) {
          if (attempt < 2) {
            setTimeout(() => this.loadContact(contactid, attempt + 1), 1000);
            return;
          }
          window.location.reload();
          return;
        }
        this.loaderService.hide();
        this.contactname = this.auth.getUserName(
          response.contactType.id as number,
          String(response.name1),
          String(response.name2)
        );
        this.hasMandateFile = response.hasMandateFile ?? true;
        this.contactLoginId = response.permissions?.id ?? 0;
        if (!this.hasMandateFile || !this.isProduction) {
          this.loadInsurances();
        }
        this.changeDetection.detectChanges();
      });
  }

  public openPolicy(id: any): void {
    this.navigator.navigateTo('policy/' + id);
  }
}
