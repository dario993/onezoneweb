import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class LoaderService {
  public loading$ = new BehaviorSubject<boolean>(false);

  private loadingCounter: number = 0;

  public hide(): void {
    this.loadingCounter -= 1;
    this.checkLoader();
  }

  public show(): void {
    this.loadingCounter += 1;
    this.checkLoader();
  }

  public reset(): void {
    this.loadingCounter = 0;
    this.checkLoader();
  }

  private checkLoader(): void {
    queueMicrotask(() => this.loading$.next(this.loadingCounter > 0));
  }
}
