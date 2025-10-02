import { Routes } from '@angular/router';


import { HomeComponent } from './home/home.component';
import { AccessDeniedComponent } from './access-denied/access-denied.component';
import { LoginComponent } from './login/login.component';

import { AdminHomeComponent } from './admin/home/home.component';
import { AdminTenderOffersComponent } from './admin/tender-offers/tender-offers.component';

import { ContractorHomeComponent } from './contractor/home/home.component';
import { ContractorMyOffersComponent } from './contractor/my-offers/my-offers.component';
import { ContractorTenderOffersComponent } from './contractor/tender-offers/tender-offers.component';

import { Injectable, inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { PermissionsService } from './services/PermissionGuardService ';



const canActivateTeam: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
    //console.log(route, state);
    return inject(PermissionsService).canActivate(route, state);
};
 
export const routes: Routes = [
    //{path: '**', component: PageNotFoundComponent},
    {path: 'access-denied', component: AccessDeniedComponent},

    { path: '', component: HomeComponent },
    { path: 'home', component: HomeComponent },
    { path: 'login', component: LoginComponent },
    
    { path: 'admin', component: AdminHomeComponent },
    { path: 'admin/home', component: AdminHomeComponent },
    { path: 'admin/tender-offers', component: AdminTenderOffersComponent },

    { path: 'contractor', component: ContractorHomeComponent, canActivate : [canActivateTeam] },
    { path: 'contractor/home', component: ContractorHomeComponent, canActivate : [canActivateTeam]  },
    { path: 'contractor/my-offers', component: ContractorMyOffersComponent, canActivate : [canActivateTeam]  },
    { path: 'contractor/tender-offers', component: ContractorTenderOffersComponent, canActivate : [canActivateTeam]  },

];
