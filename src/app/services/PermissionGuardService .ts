import { Injectable, inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from './AuthService';
import { ObjLoginResponse } from '../models/ObjLoginResponse';
import { Roles } from '../models/Roles';

@Injectable()
export class PermissionsService {
    private currentUser: ObjLoginResponse = new ObjLoginResponse();
    private roles = Roles;

    constructor(
        private router: Router,
        private authService: AuthService) {
    }
    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
        //console.log('canActivate', state.url, this.currentUser.User);

        this.authService.currentUser.subscribe(x => this.currentUser = x);

        if (state.url.startsWith('/contractor') && !this.currentUser.User.Roles.includes(this.roles.Contractor)) {
            this.router.navigate(['/', 'access-denied']);
            return true;
        }
        if (state.url.startsWith('/admin') && !this.currentUser.User.Roles.includes(this.roles.Admin)) {
            this.router.navigate(['/', 'access-denied']);
            return true;
        }

        return true;
    }
    canMatch(): boolean {
        console.log('canMatch');
        return true;
    }
}

