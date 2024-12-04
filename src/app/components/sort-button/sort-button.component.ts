import { Component, EventEmitter, Output } from '@angular/core';
import { Sort, SortDirection } from '@angular/material/sort';

@Component({
  selector: 'app-sort-button',
  templateUrl: './sort-button.component.html',
  styleUrls: ['./sort-button.component.scss']
})
export class SortButtonComponent {
  @Output() dataEmitter = new EventEmitter<Sort>();

  selectedFieldLabel: string = '';
  tempSelectedField: string = '';
  tempSortDirection: SortDirection = ''
  isSorting: boolean;

  selectField(field: string) {
    let sortBy: Sort = {
      active: '',
      direction: ''
    };

    let directionIndicator: string = '';

    if (field === '') {
      // Clear sorting if field is empty
      sortBy.direction = '';
      directionIndicator = '';
      this.tempSortDirection = '';
      this.selectedFieldLabel = field;
      this.tempSelectedField = field;
      this.isSorting= false;
    } else if (this.tempSelectedField === field) {
      // Toggle sorting direction if same field is selected
      this.tempSortDirection = (this.tempSortDirection === 'asc') ? 'desc' : 'asc';
      sortBy.direction = this.tempSortDirection;
      directionIndicator = (this.tempSortDirection === 'asc') ? 'Asc ⇑ ' : 'Desc ⇓ ';
      this.isSorting= true;
    } else {
      // Default sorting direction for a new field
      sortBy.direction = 'asc';
      directionIndicator = 'Asc ⇑ ';
      this.tempSortDirection = 'asc';
      this.isSorting= true;
    }

    if (field != '') {
      this.tempSelectedField = field;
      switch (field) {
        case 'tag': this.selectedFieldLabel = directionIndicator + 'Current Tag'; break;
        case 'branch': this.selectedFieldLabel = directionIndicator + 'Deployed Branch'; break;
        case 'status': this.selectedFieldLabel = directionIndicator + 'Status'; break;
        case 'cluster': this.selectedFieldLabel = directionIndicator + 'Cluster'; break;
        case 'commitby': this.selectedFieldLabel = directionIndicator + 'Commit By'; break;
        case 'commit_id': this.selectedFieldLabel = directionIndicator + 'Commit Id'; break;
        case 'namespace': this.selectedFieldLabel = directionIndicator + 'Namespace'; break;
        case 'previous_tag': this.selectedFieldLabel = directionIndicator + 'Previous Tag'; break;
        case 'commitmessage': this.selectedFieldLabel = directionIndicator + 'Commit message'; break;
        case 'image_created_at': this.selectedFieldLabel = directionIndicator + 'Image Created at'; break;
        case 'image_deployed_at': this.selectedFieldLabel = directionIndicator + 'Deployed At'; break;
        case 'image_deployed_by': this.selectedFieldLabel = directionIndicator + 'Deployed By'; break;
        case 'latest_build_tag': this.selectedFieldLabel = directionIndicator + 'Lastest Build Tag'; break;
        default: this.selectedFieldLabel = '';
      }
    }

    sortBy.active = field;
    console.log(sortBy)
    this.dataEmitter.emit(sortBy);
  }
}
