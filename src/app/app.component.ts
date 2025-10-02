import { Component, OnInit } from '@angular/core';

import { Router } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { of } from 'rxjs';

import { AuthService } from './services/AuthService';
import { ObjLoginResponse } from './models/ObjLoginResponse';
import { Roles } from './models/Roles';

@Component({
  selector: 'app-root',
  standalone: false,
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})

export class AppComponent implements OnInit {
  userLogin: boolean = false;
  currentUser: ObjLoginResponse = new ObjLoginResponse();
  //currentUserSubscription: Subscription = new Subscription();

  title = 'municipal-tender-app';
  isCollapsed = false;

  roles = Roles;

  constructor(
    private router: Router,
    public authService: AuthService

  ) {
    this.authService.currentUser.subscribe(x => this.currentUser = x);

    this.userLogin = this.authService.currentUserValue.Token != undefined && this.authService.currentUserValue.Token != "";

    if (!this.userLogin) { this.logout(); }
  }

  ngOnInit() {
    
  }

  logout() {
    this.authService.logout();
    this.userLogin = false;
    this.router.navigate(['/login']);
  }
}
