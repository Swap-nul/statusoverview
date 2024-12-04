import { MatTableDataSource } from "@angular/material/table";
import { BehaviorSubject } from "rxjs";
import { AppsEndpoints } from "../AppsEndpoints";

export class AppsEndpointsDataSource extends MatTableDataSource<AppsEndpoints> {

  constructor(private appsEndpoints: BehaviorSubject<AppsEndpoints[]>) {
    super();
  }

  override connect(): BehaviorSubject<AppsEndpoints[]> {
    return this.appsEndpoints;
  }

  override disconnect(): void {
  }

}
