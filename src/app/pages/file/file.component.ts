import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { LoaderService } from '../../services/loader.service';
import { NavigatorService } from '../../services/navigator.service';
import { AuthService } from '../../services/auth.service';
import { BrokerstarService } from '../../services/brokerstar.service';
import { ToasterService } from '../../services/toaster.service';
import { I18nPipe } from '../../pipes/i18n.pipe';

@Component({
  selector: 'page-file',
  standalone: true,
  templateUrl: './file.component.html',
  styleUrls: ['./file.component.scss'],
  imports: [CommonModule, I18nPipe],
})
export class FileComponent implements OnInit {
  @ViewChild('pdfViewer', { static: false }) pdfViewer:
    | ElementRef<HTMLIFrameElement>
    | undefined;

  pdfUrl: SafeResourceUrl | string = '';
  imageUrl: string = '';
  fileInfo: any = {};
  filetype: 'pdf' | 'image' | 'other' | 'loading' = 'loading';
  tmp: any = {};

  constructor(
    private readonly authService: AuthService,
    private readonly route: ActivatedRoute,
    public readonly navigator: NavigatorService,
    private readonly toasterService: ToasterService,
    private readonly brokerstarService: BrokerstarService,
    private readonly changeDetection: ChangeDetectorRef,
    private readonly loaderService: LoaderService,
    private readonly sanitizer: DomSanitizer
  ) {}

  public ngOnInit(): void {
    this.route.params.subscribe((params) => {
      // Download file by id and display it
      if (params['fileid']) {
        this.loadFile(params['fileid']);
      }

      // Generate jasper resport and display it
      if (params['reportName'] && params['contactId']) {
        this.filetype = 'pdf';
        this.loadJasperReport(params['reportName'], params['contactId']);
      }
    });
  }

  private loadFile(fileid: number): void {
    this.loaderService.show();
    this.brokerstarService
      .fileInfo(String(fileid))
      .subscribe((fileInfoResponse: any): void => {
        if (fileInfoResponse) {
          this.fileInfo = fileInfoResponse;
          this.brokerstarService
            .file(String(fileid))
            .subscribe((fileResponse: any): void => {
              if (fileResponse) {
                const reader = new FileReader();
                reader.readAsDataURL(fileResponse);
                reader.onloadend = () => {
                  if (this.isPdf()) {
                    this.filetype = 'pdf';
                    this.pdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
                      <string>reader.result
                    );
                  } else if (this.isImage()) {
                    this.filetype = 'image';
                    this.imageUrl = <any>reader.result;
                  } else {
                    this.filetype = 'other';
                  }
                  this.changeDetection.detectChanges();
                };
              }
            });
        }
        this.loaderService.hide();
      });
  }

  private loadJasperReport(reportName: string, contactId: number): void {
    this.loaderService.show();
    this.brokerstarService.createJasperreport(reportName, contactId).subscribe({
      next: (response: any): void => {
        this.filetype = 'pdf';
        this.pdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
          `data:application/pdf;base64,${response.fileBase64}`
        );
        this.changeDetection.detectChanges();
      },
      error: (error: any): void => {
        console.log(error);
        this.toasterService.warn('Error generating report');
      },
      complete: (): void => {
        this.loaderService.hide();
      },
    });
  }

  private isPdf(): boolean {
    return (
      this.fileInfo.mimeType === 'application/pdf' ||
      String(this.fileInfo.extension).toLocaleLowerCase() === 'pdf'
    );
  }

  private isImage(): boolean {
    return (
      this.fileInfo.mimeType === 'image/png' ||
      this.fileInfo.mimeType === 'image/jpeg' ||
      this.fileInfo.mimeType === 'image/jpg' ||
      this.fileInfo.mimeType === 'image/gif' ||
      this.fileInfo.mimeType === 'image/bmp' ||
      this.fileInfo.mimeType === 'image/heic' ||
      this.fileInfo.mimeType === 'image/heif' ||
      String(this.fileInfo.extension).toLocaleLowerCase() === 'png' ||
      String(this.fileInfo.extension).toLocaleLowerCase() === 'jpeg' ||
      String(this.fileInfo.extension).toLocaleLowerCase() === 'jpg' ||
      String(this.fileInfo.extension).toLocaleLowerCase() === 'gif' ||
      String(this.fileInfo.extension).toLocaleLowerCase() === 'bmp' ||
      String(this.fileInfo.extension).toLocaleLowerCase() === 'heic' ||
      String(this.fileInfo.extension).toLocaleLowerCase() === 'heif'
    );
  }
}
