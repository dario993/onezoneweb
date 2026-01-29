import {
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { I18nService } from '../../services/i18n.service';
import { LoaderService } from '../../services/loader.service';
import { NavigatorService } from '../../services/navigator.service';
import { AuthService } from '../../services/auth.service';
import { BrokerstarService } from '../../services/brokerstar.service';
import { StorageService } from '../../services/storage.service';
import { ToasterService } from '../../services/toaster.service';
import { I18nPipe } from '../../pipes/i18n.pipe';
import { convertStringToJSON } from '../../helper';
import statics from '../../../assets/statics.json';

@Component({
  selector: 'page-agreement',
  standalone: true,
  templateUrl: './agreement.component.html',
  styleUrls: ['./agreement.component.scss'],
  imports: [CommonModule, FormsModule, I18nPipe],
})
export class AgreementComponent implements OnInit, AfterViewInit {
  @ViewChild('signatureCanvas', { static: false }) signatureCanvas:
    | ElementRef<HTMLCanvasElement>
    | undefined;

  public keepConsultant: boolean = false;
  public insurances: any[] = [];
  public signatureDataUrl: string = '';

  /** Canvas drawing state */
  private isDrawing = false;
  private lastX = 0;
  private lastY = 0;
  private canvasContext: CanvasRenderingContext2D | null = null;

  constructor(
    private readonly storage: StorageService,
    private readonly auth: AuthService,
    private readonly loaderService: LoaderService,
    private readonly navigator: NavigatorService,
    private readonly toasterService: ToasterService,
    private readonly brokerstarService: BrokerstarService,
    public readonly i18n: I18nService
  ) {}

  public ngOnInit(): void {
    this.insurances = convertStringToJSON(
      this.storage.getItem('selectedPolicies'),
      []
    ).map((policy: any): any => ({
      id: policy.id,
      name: policy.name,
      selected: false,
    }));
  }

  public ngAfterViewInit(): void {
    if (this.signatureCanvas) {
      this.canvasContext = this.signatureCanvas.nativeElement.getContext('2d');
      if (this.canvasContext) {
        this.canvasContext.strokeStyle = '#000000';
        this.canvasContext.lineWidth = 3;
        this.canvasContext.lineCap = 'round';
        this.canvasContext.lineJoin = 'round';
      }
    }
  }

  public startDrawing(event: MouseEvent): void {
    if (!this.canvasContext) return;

    this.isDrawing = true;
    const rect = this.signatureCanvas!.nativeElement.getBoundingClientRect();
    this.lastX = event.clientX - rect.left;
    this.lastY = event.clientY - rect.top;
  }

  public draw(event: MouseEvent): void {
    if (!this.isDrawing || !this.canvasContext) return;

    const rect = this.signatureCanvas!.nativeElement.getBoundingClientRect();
    const currentX = event.clientX - rect.left;
    const currentY = event.clientY - rect.top;

    this.canvasContext.beginPath();
    this.canvasContext.moveTo(this.lastX, this.lastY);
    this.canvasContext.lineTo(currentX, currentY);
    this.canvasContext.stroke();

    this.lastX = currentX;
    this.lastY = currentY;
  }

  public stopDrawing(): void {
    this.isDrawing = false;
  }

  public clearSignature(): void {
    if (!this.canvasContext) return;

    this.canvasContext.clearRect(
      0,
      0,
      this.signatureCanvas!.nativeElement.width,
      this.signatureCanvas!.nativeElement.height
    );
  }

  public openConditions(): void {
    this.navigator.navigateTo(
      statics.LinkOneZoneAGB[this.i18n.currentLanguage]
    );
  }

  public downloadDokument(): void {
    this.navigator.navigateTo(
      `jasper/${this.getBrokermandatName()}/${this.auth.userData.contact.id}`
    );
  }

  public async submit(): Promise<void> {
    this.loaderService.show();

    // Capture signature from canvas
    if (this.signatureCanvas && this.canvasContext) {
      try {
        // Get canvas data as data URL
        this.signatureDataUrl =
          this.signatureCanvas.nativeElement.toDataURL('image/png');

        // Check if canvas is empty (just check if it's the default empty canvas)
        const isCanvasEmpty = this.isCanvasEmpty();

        if (isCanvasEmpty) {
          this.toasterService.alert('Please provide a signature.');
          this.loaderService.hide();
          return;
        }

        // Extract base64 data from data URL
        const base64Data = this.signatureDataUrl.split(',')[1];

        // save signature
        this.brokerstarService
          .createSignetJasperreport(
            this.getBrokermandatName(),
            this.auth.userData.contact.id,
            base64Data
          )
          .subscribe({
            next: (_response: any): void => {
              this.brokerstarService
                .mandateInformInsurances(
                  !this.keepConsultant,
                  this.insurances.reduce(
                    (
                      acc: Record<string, boolean>,
                      curr: any
                    ): Record<string, boolean> => {
                      acc[curr.id] = curr.selected;
                      return acc;
                    },
                    {}
                  )
                )
                .subscribe();

              this.toasterService.success(
                this.i18n.getTranslation('agreement', 'successsend')
              );

              this.navigator.navigateTo('home');
            },
            error: (_error: any): void => {
              this.toasterService.warn('Error generating report');
            },
            complete: (): void => {
              this.loaderService.hide();
            },
          });
      } catch (error) {
        this.toasterService.alert('Error while saving the signature.');
        console.log(error);
        this.loaderService.hide();
      }
    } else {
      this.toasterService.alert('Please provide a signature.');
      this.loaderService.hide();
    }
  }

  private isCanvasEmpty(): boolean {
    if (!this.signatureCanvas || !this.canvasContext) return true;

    const canvas = this.signatureCanvas.nativeElement;
    const imageData = this.canvasContext.getImageData(
      0,
      0,
      canvas.width,
      canvas.height
    );

    // Check if any pixel is not transparent
    for (let i = 3; i < imageData.data.length; i += 4) {
      if (imageData.data[i] !== 0) {
        return false;
      }
    }
    return true;
  }

  public onSignatureChange(dataUrl: string): void {
    this.signatureDataUrl = dataUrl;
  }

  private getBrokermandatName(): string {
    switch (this.i18n.currentLanguage) {
      case 'en': {
        return 'BrokermandatEN';
      }
      case 'it': {
        return 'BrokermandatIT';
      }
      case 'fr': {
        return 'BrokermandatFR';
      }
      case 'de':
      default: {
        return 'Brokermandat';
      }
    }
  }
}
