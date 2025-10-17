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
        return;
      }

      if (this.isAdmin()) {
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
    this.adminService.getTenderCounts().subscribe({
      next: (counts) => this.tenderSignalService.updateCounts(counts)
    });
  }

  private resetCounts(): void {
    this.tenderSignalService.updateCounts({ total: 0, open: 0, expired: 0 });
  }
}
