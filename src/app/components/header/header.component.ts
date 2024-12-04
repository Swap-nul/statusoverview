import { Component, EventEmitter, HostBinding, Output } from '@angular/core';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  @HostBinding('class') className = '';
  @Output() cssRefreshDarkMode = new EventEmitter<boolean>();
  toggleControl = new FormControl(false);
  mode: boolean = false;   // light mode
  addCssDarkmode = false; // set 'initial state' based on your needs

  ngOnInit(): void {
    this.toggleControl.valueChanges.subscribe((darkMode) => {
      this.cssRefreshDarkMode.emit(darkMode!);
      this.mode = !this.mode;
      this.addCssDarkmode = this.mode;
    });
  }
}
