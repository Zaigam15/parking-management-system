import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/navbar/navbar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent],
  templateUrl: './app.html',
  styles: [`
    .main-content {
      min-height: calc(100vh - 65px);
      background: #f0f2f5;
    }
  `]
})
export class App {
  title = 'parking-management-system';
}
