import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { I18nService } from '../../services/i18n.service';
import { LoaderService } from '../../services/loader.service';
import { NavigatorService } from '../../services/navigator.service';
import { AuthService } from '../../services/auth.service';
import { BrokerstarService } from '../../services/brokerstar.service';
import { I18nPipe } from '../../pipes/i18n.pipe';
import statics from '../../../assets/statics.json';

@Component({
  selector: 'page-policycalculate',
  standalone: true,
  templateUrl: './policycalculate.component.html',
  styleUrls: ['./policycalculate.component.scss'],
  imports: [I18nPipe],
})
export class PolicyCalculateComponent {
  public buttons: Array<{
    icon: string;
    label: string;
  }>;

  private cid: string = '';

  constructor(
    private readonly navigator: NavigatorService,
    private readonly loaderService: LoaderService,
    private readonly auth: AuthService,
    private readonly brokerstarService: BrokerstarService,
    public readonly i18n: I18nService
  ) {
    this.buttons = [
      {
        icon: 'file-search-light',
        label: 'insurance',
      },
      {
        icon: 'car-light',
        label: 'car',
      },
      {
        icon: 'home-lg-light-white',
        label: 'household',
      },
      {
        icon: 'mietkaution',
        label: 'rent',
      },
      {
        icon: 'gavel-light',
        label: 'law',
      },
      {
        icon: 'plane-light',
        label: 'travel',
      },
      {
        icon: 'file-light',
        label: 'pension',
      },
      {
        icon: 'animal',
        label: 'animal',
      },
    ];
  }

  public ngOnInit(): void {
    this.loadContactID();
  }

  private loadContactID(): void {
    this.loaderService.show();
    this.brokerstarService
      .contact(this.auth.userData.contact.id)
      .subscribe((response: any): void => {
        this.loaderService.hide();
        this.cid = response.uniqueId;
      });
  }

  private replaceCID(sLink: any): string {
    return sLink.replace('%CID%', this.cid);
  }

  public openCompare(oButton: Record<string, unknown>): void {
    switch (oButton['label']) {
      case 'travel': {
        this.navigator.navigateTo(
          this.replaceCID(
            statics.LinkOneZoneCompareTravel[this.i18n.currentLanguage]
          )
        );
        break;
      }
      case 'household': {
        this.navigator.navigateTo(
          this.replaceCID(
            statics.LinkOneZoneCompareHousehold[this.i18n.currentLanguage]
          )
        );
        break;
      }
      case 'pension': {
        this.navigator.navigateTo(
          this.replaceCID(
            statics.LinkOneZoneComparePension[this.i18n.currentLanguage]
          )
        );
        break;
      }
      case 'rent': {
        this.navigator.navigateTo(
          this.replaceCID(
            statics.LinkOneZoneCompareRent[this.i18n.currentLanguage]
          )
        );
        break;
      }
      case 'law': {
        this.navigator.navigateTo(
          this.replaceCID(
            statics.LinkOneZoneCompareLaw[this.i18n.currentLanguage]
          )
        );
        break;
      }
      case 'cyber': {
        this.navigator.navigateTo(
          this.replaceCID(
            statics.LinkOneZoneCompareCyber[this.i18n.currentLanguage]
          )
        );
        break;
      }
      case 'animal': {
        this.navigator.navigateTo(
          this.replaceCID(
            statics.LinkOneZoneCompareAnimal[this.i18n.currentLanguage]
          )
        );
        break;
      }
      case 'car': {
        this.navigator.navigateTo(
          this.replaceCID(
            statics.LinkOneZoneCompareCar[this.i18n.currentLanguage]
          )
        );
        break;
      }
      case 'insurance': {
        this.navigator.navigateTo(
          this.replaceCID(
            statics.LinkOneZoneCompareInsurance[this.i18n.currentLanguage]
          )
        );
        break;
      }
      case 'other':
      default: {
        this.navigator.navigateTo(
          this.replaceCID(
            statics.LinkOneZoneCompareOther[this.i18n.currentLanguage]
          )
        );
      }
    }
  }
}
