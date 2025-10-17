import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { ObjLoginResponse } from './models/ObjLoginResponse';
import { Roles } from './models/Roles';
import { AuthService } from './services/AuthService';
import { TenderSignalService } from './services/TenderSignalService';
import { AdminService } from './services/AdminService';

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
  private hasFetchedTenderCounts = false;

  constructor(
    private router: Router,
    public authService: AuthService,
    public tenderSignalService: TenderSignalService,
    private adminService: AdminService
  ) {
    this.authService.currentUser.subscribe((user) => {
      this.currentUser = user;
      this.userLogin = !!user?.Token;

      if (!this.userLogin || !this.isAdmin()) {
        this.hasFetchedTenderCounts = false;
        return;
      }

      if (!this.hasFetchedTenderCounts) {
        this.fetchTenderCounts();
      }
    });

    if (!this.authService.currentUserValue?.Token) {
      this.logout();
    }
  }

  ngOnInit(): void {
    if (this.userLogin && this.isAdmin() && !this.hasFetchedTenderCounts) {
      this.fetchTenderCounts();
    }
  }

  logout(): void {
    this.authService.logout();
    this.userLogin = false;
    this.hasFetchedTenderCounts = false;
    this.tenderSignalService.updateCounts({ total: 0, open: 0, expired: 0 });
    this.router.navigate(['/login']);
  }

  private isAdmin(): boolean {
    return this.currentUser?.User?.Roles?.includes(Roles.Admin) ?? false;
  }

  private fetchTenderCounts(): void {
    this.adminService.getTenderCounts().subscribe({
      next: (counts) => {
        this.tenderSignalService.updateCounts(counts);
        this.hasFetchedTenderCounts = true;
      },
      error: () => {
        this.hasFetchedTenderCounts = false;
      }
    });
  }
}
