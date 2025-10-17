import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { ObjLoginResponse } from './models/ObjLoginResponse';
import { Roles } from './models/Roles';
import { AuthService } from './services/AuthService';
import { TenderSignalService } from './services/TenderSignalService';

@Component({
  selector: 'app-root',
  standalone: false,
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  userLogin = false;
  currentUser: ObjLoginResponse = new ObjLoginResponse();

  title = 'municipal-tender-app';
  isCollapsed = false;

  roles = Roles;

  constructor(
    private router: Router,
    public authService: AuthService,
    public tenderSignalService: TenderSignalService
  ) {
    this.authService.currentUser.subscribe((x) => (this.currentUser = x));

    this.userLogin =
      this.authService.currentUserValue.Token !== undefined &&
      this.authService.currentUserValue.Token !== '';

    if (!this.userLogin) {
      this.logout();
    }
  }

  ngOnInit(): void {}

  logout(): void {
    this.authService.logout();
    this.userLogin = false;
    this.router.navigate(['/login']);
  }
}
