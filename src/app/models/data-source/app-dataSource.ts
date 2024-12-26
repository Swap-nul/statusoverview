import { MatTableDataSource } from "@angular/material/table";
import { BehaviorSubject } from "rxjs";
import { App } from "../tag-version/app";

export class AppDataSource extends MatTableDataSource<App> {

  constructor(private apps: BehaviorSubject<App[]>) {
    super();
  }

  override connect(): BehaviorSubject<App[]> {
    return this.apps;
  }

  override disconnect(): void {
  }

}
