import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { clone, isset, isTrue } from '../../helper';
import { LoaderService } from '../../services/loader.service';
import { NavigatorService } from '../../services/navigator.service';
import { BrokerstarService } from '../../services/brokerstar.service';
import { I18nPipe } from '../../pipes/i18n.pipe';
import { ActivatedRoute } from '@angular/router';
import { I18nService } from '../../services/i18n.service';

enum OfferStatusEnum {
  PENDENT = 1,
  ACCEPTED = 2,
  DECLINED = 3,
}

@Component({
  selector: 'page-offers',
  templateUrl: './offers.component.html',
  styleUrls: ['./offers.component.scss'],
  imports: [CommonModule, I18nPipe],
  standalone: true,
})
export class OffersComponent implements OnInit {
  public tab: OfferStatusEnum = OfferStatusEnum.PENDENT;
  public tenders: any[] = [];
  public tendersFiltered: any[] = [];

  public initialTenderID: number = 0;

  // enums
  public eOfferStatus: typeof OfferStatusEnum = OfferStatusEnum;

  constructor(
    private readonly navigator: NavigatorService,
    private readonly route: ActivatedRoute,
    private readonly brokerstarService: BrokerstarService,
    private readonly loaderService: LoaderService,
    public readonly i18n: I18nService
  ) {}

  public ngOnInit(): void {
    this.route.params.subscribe((params) => {
      if (params['offerid']) {
        this.initialTenderID = params['offerid'];
      }

      this.loadTenderList();
    });
  }

  private loadTenderList(): void {
    this.tenders = [];
    this.tendersFiltered = [];

    this.loaderService.show();
    this.brokerstarService.tender().subscribe((response: any): void => {
      this.loaderService.hide();

      // Check if response has data wrapper or is direct array
      const tendersData = response.data || response;
      this.tenders = tendersData.map((tender: any): any => {
        tender.open = false;
        tender.offers = [];
        return tender;
      });

      this.loadTenderOffers();
    });
  }

  private loadTenderOffers(): void {
    this.tenders.forEach((tender: any): void => {
      if (tender.offers && tender.offers.length > 0) {
        return;
      }
      this.loaderService.show();
      this.brokerstarService
        .tenderOffer(tender.id)
        .subscribe((response: any): void => {
          this.loaderService.hide();

          // Check if response has data wrapper or is direct array
          tender.offers = response.data || response || [];

          // Ensure offers is always an array
          if (!Array.isArray(tender.offers)) {
            tender.offers = [];
          }

          this.checkPreselection();
          this.filterVisibleOffers();
        });
    });
  }

  public selectTap(tab: OfferStatusEnum): void {
    this.tab = tab;
    this.filterVisibleOffers();
  }

  public consultant(contactid: number): void {
    this.navigator.navigateTo(`consultant/${contactid}`);
  }

  public async acceptOffer(offerID: string): Promise<void> {
    this.loaderService.show();
    this.brokerstarService.tenderOfferAccept(offerID).subscribe({
      next: (_response: any): void => {
        this.loadTenderList();
      },
      error: (error: any): void => {
        console.log(error);
      },
      complete: (): void => {
        this.loaderService.hide();
      },
    });
  }

  public async rejectOffer(offerID: string): Promise<void> {
    this.loaderService.show();
    this.brokerstarService.tenderOfferReject(offerID).subscribe({
      next: (_response: any): void => {
        this.loadTenderList();
      },
      error: (error: any): void => {
        console.log(error);
      },
      complete: (): void => {
        this.loaderService.hide();
      },
    });
  }

  public async downloadOffer(offer: any): Promise<void> {
    this.navigator.navigateTo(`file/${offer.attachment.id}`);
  }

  public trackByTenderId(index: number, tender: any): any {
    return tender?.id || index;
  }

  public trackByOfferId(index: number, offer: any): any {
    return offer?.id || index;
  }

  private filterVisibleOffers(): void {
    // Erst mal alle anzeigen
    this.tendersFiltered = [];

    // Sicherstellen dass tenders ein Array ist
    if (!Array.isArray(this.tenders)) {
      this.tenders = [];
      return;
    }

    // Jetzt nach status filtern
    this.tendersFiltered = this.tenders.reduce(
      (previous: any, branch: any): any => {
        // Saubere kopie erstellen
        const cleanBranch: any = clone(branch);

        // Sicherstellen dass offers existiert
        if (!cleanBranch.offers || !Array.isArray(cleanBranch.offers)) {
          cleanBranch.offers = [];
        }

        // Filtern für anzeige der liste
        cleanBranch.offers = cleanBranch.offers.filter(
          (offer: any): boolean => {
            if (!offer) return false;

            if (this.tab === OfferStatusEnum.PENDENT) {
              return offer.isAccepted === null;
            }
            if (this.tab === OfferStatusEnum.ACCEPTED) {
              return offer.isAccepted === true;
            }
            if (this.tab === OfferStatusEnum.DECLINED) {
              return offer.isAccepted === false;
            }
            return false;
          }
        );

        if (cleanBranch.offers.length > 0) {
          return previous.concat([cleanBranch]);
        }

        return previous;
      },
      []
    );
  }

  private checkPreselection(): boolean {
    if (this.initialTenderID > 0) {
      // get branch to offerid from oOffers
      const offer: any | undefined = this.tenders.find((o: any): boolean =>
        isset(
          o.offers?.find((o2: any): boolean => o2.id === this.initialTenderID)
        )
      );

      if (offer && offer.offers) {
        // Wenn alle offers nicht angenommen wurden dann ist der branch pendent
        const bPendent: boolean = offer.offers.every(
          (o: any): any => !isTrue(o.isAccepted)
        );

        // check if offer is accepted
        const bAccepted: boolean = isset(
          offer.offers.find(
            (o: any): any =>
              o.id === this.initialTenderID && isTrue(o.isAccepted)
          )
        );

        // depending on bPendent and bAccepted we set the menu
        if (bPendent) {
          this.selectTap(OfferStatusEnum.PENDENT);
        } else if (!bPendent && bAccepted) {
          this.selectTap(OfferStatusEnum.ACCEPTED);
        } else if (!bPendent && !bAccepted) {
          this.selectTap(OfferStatusEnum.DECLINED);
        }

        // open the offer
        this.tendersFiltered.forEach((o: any): void => {
          if (
            isset(
              o.offers?.find(
                (o2: any): boolean => o2.id === this.initialTenderID
              )
            )
          ) {
            o.open = true;
          }
        });
      }

      this.initialTenderID = 0;

      return true;
    }
    return false;
  }
}
