import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AutomationService } from '../../services/automation.service';
import { NavigatorService } from '../../services/navigator.service';
import { LoaderService } from '../../services/loader.service';
import { ConsultantItem } from '../../interfaces/automation.interface';

const ALL_SCRAPERS = ['axa', 'Allianz', 'Helvetia', 'Generali', 'Simpego', 'Zurich', 'Vaudoise', 'Automate', 'Mobiliar'];

@Component({
  selector: 'page-consultant-automation',
  templateUrl: './consultant-automation.component.html',
  styleUrls: ['./consultant-automation.component.scss'],
  imports: [CommonModule, FormsModule],
  standalone: true,
})
export class ConsultantAutomationComponent {
  public consultants: ConsultantItem[] = [];
  public searchvalue: string = '';
  public isLoading: boolean = false;
  public selectedConsultant: ConsultantItem | null = null;
  public readonly allScrapers = ALL_SCRAPERS;

  constructor(
    private readonly automationService: AutomationService,
    public readonly navigator: NavigatorService,
    private readonly loaderService: LoaderService
  ) {
    this.isLoading = true;
    this.loaderService.show();
    this.automationService.getConsultants().subscribe({
      next: (data) => {
        this.consultants = data;
        this.isLoading = false;
        this.loaderService.hide();
      },
      error: () => {
        this.isLoading = false;
        this.loaderService.hide();
      },
    });
  }

  public get filteredConsultants(): ConsultantItem[] {
    const q = this.searchvalue.toLowerCase().trim();
    if (!q) return this.consultants;
    return this.consultants.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.surname.toLowerCase().includes(q) ||
        c.ecohub_username.toLowerCase().includes(q)
    );
  }

  public openModal(consultant: ConsultantItem): void {
    this.selectedConsultant = { ...consultant, disabled_scrapers: [...consultant.disabled_scrapers] };
  }

  public closeModal(): void {
    this.selectedConsultant = null;
  }

  public isScraperEnabled(scraper: string): boolean {
    const lower = scraper.toLowerCase();
    return !this.selectedConsultant!.disabled_scrapers.some((s) => s.toLowerCase() === lower);
  }

  public toggleScraper(scraper: string): void {
    const c = this.selectedConsultant!;
    const scraperLower = scraper.toLowerCase();
    const isDisabled = c.disabled_scrapers.some((s) => s.toLowerCase() === scraperLower);
    const newDisabled = isDisabled
      ? c.disabled_scrapers.filter((s) => s.toLowerCase() !== scraperLower)
      : [...new Set([...c.disabled_scrapers.map((s) => s.toLowerCase()), scraperLower])];
    const prevDisabled = [...c.disabled_scrapers];

    c.disabled_scrapers = newDisabled;

    this.automationService.patchConsultant(c.id, { disabled_scrapers: newDisabled }).subscribe({
      next: (updated) => {
        c.disabled_scrapers = updated.disabled_scrapers ?? newDisabled;
        this.syncListItem(updated);
      },
      error: () => {
        c.disabled_scrapers = prevDisabled;
      },
    });
  }

  public toggleActive(): void {
    const c = this.selectedConsultant!;
    const newActive = !c.is_active;
    const prevActive = c.is_active;

    c.is_active = newActive;

    this.automationService.patchConsultant(c.id, { is_active: newActive }).subscribe({
      next: (updated) => {
        c.is_active = updated.is_active ?? newActive;
        this.syncListItem(updated);
      },
      error: () => {
        c.is_active = prevActive;
      },
    });
  }

  private syncListItem(updated: ConsultantItem): void {
    const idx = this.consultants.findIndex((c) => c.id === updated.id);
    if (idx !== -1) {
      this.consultants[idx] = { ...this.consultants[idx], ...updated };
    }
  }
}
