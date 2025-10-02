import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormControl, FormGroup, NonNullableFormBuilder, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgZorroAntdModule } from '../../Modules/ng-zorro-antd.module';

import { AuthService } from '../services/AuthService';


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgZorroAntdModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})

export class LoginComponent implements OnInit {
  validateForm: FormGroup<{ username: FormControl<string>; password: FormControl<string>; }> = this.fb.group({ username: ['', [Validators.required]], password: ['', [Validators.required]] });
  loading = false;
  submitted = false;
  returnUrl: string = "";

  constructor(
    private fb: NonNullableFormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {

    let userLogin = this.authService.currentUserValue.Token != undefined && this.authService.currentUserValue.Token != "";
    if (userLogin) {
      this.router.navigate(['/']);
    }
  }


  ngOnInit() {
  }


  submitForm() {
    this.submitted = true;

    if (this.validateForm.invalid) {
      return;
    }

    this.loading = true;
    this.authService.login(this.validateForm.controls.username.value, this.validateForm.controls.password.value)
      .subscribe(data => {
        if (data.IsSuccess === true)
          window.location.href = "/";
        this.loading = false;
      });
  }
}
