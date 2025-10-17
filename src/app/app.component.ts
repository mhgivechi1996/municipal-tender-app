import { Component } from '@angular/core';
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
export class AppComponent {
  userLogin = false;
  currentUser: ObjLoginResponse = new ObjLoginResponse();

  title = 'municipal-tender-app';
  isCollapsed = false;

  roles = Roles;

  private hasFetchedTenderCounts = false;
  private isFetchingTenderCounts = false;

  constructor(
    private router: Router,
    public authService: AuthService,
    public tenderSignalService: TenderSignalService,
    private adminService: AdminService
  ) {
    this.authService.currentUser.subscribe((user) => {
      this.currentUser = user;
      this.userLogin = !!user?.Token;

      if (!this.userLogin) {
        this.resetCounts();
        return;
      }

      if (this.isAdmin() && !this.hasFetchedTenderCounts) {
        this.fetchTenderCounts();
      }
    });

    if (!this.authService.currentUserValue?.Token) {
      this.logout();
    }
  }


  logout(): void {
    this.authService.logout();
    this.userLogin = false;
    this.resetCounts();
    this.router.navigate(['/login']);
  }

  private isAdmin(): boolean {
    return this.currentUser?.User?.Roles?.includes(Roles.Admin) ?? false;
  }

  private fetchTenderCounts(): void {
    if (this.isFetchingTenderCounts) {
      return;
    }

    this.isFetchingTenderCounts = true;
    this.adminService.getTenderCounts().subscribe({
      next: (counts) => {
        this.tenderSignalService.updateCounts(counts);
        this.hasFetchedTenderCounts = true;
        this.isFetchingTenderCounts = false;
      },
      error: () => {
        this.hasFetchedTenderCounts = false;
        this.isFetchingTenderCounts = false;
      }
    });
  }

  private resetCounts(): void {
    this.hasFetchedTenderCounts = false;
    this.isFetchingTenderCounts = false;
    this.tenderSignalService.updateCounts({ total: 0, open: 0, expired: 0 });
  }
}
