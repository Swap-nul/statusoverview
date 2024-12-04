import { MatTableDataSource } from "@angular/material/table";
import { BehaviorSubject } from "rxjs";
import { Builds } from "../tagsVersionModels/Builds";

export class BuildsDataSource extends MatTableDataSource<Builds> {

  constructor(private apps: BehaviorSubject<Builds[]>) {
    super();
  }

  override connect(): BehaviorSubject<Builds[]> {
    return this.apps;
  }

  override disconnect(): void {
  }

}
