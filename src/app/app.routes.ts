// angular
import { Routes } from '@angular/router';

// guards
import {
  isAuthenticatedRoute,
  isNonAuthenticatedRoute,
} from './guards/group.guard';

// layouts
import { LayoutAuthedComponent } from './layouts/authed/authed.component';
import { LayoutUnauthedComponent } from './layouts/unauthed/unauthed.component';
import { LayoutPDFComponent } from './layouts/pdf/pdf.component';

// components
import { LoginComponent } from './pages/login/login.component';
import { RecoverComponent } from './pages/recover/recover.component';
import { RegisterComponent } from './pages/register/register.component';
import { LanguageComponent } from './pages/language/language.component';
import { HomeComponent } from './pages/home/home.component';
import { MenuComponent } from './pages/menu/menu.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { PoliciesComponent } from './pages/policies/policies.component';
import { PolicyComponent } from './pages/policy/policy.component';
import { PolicyAddComponent } from './pages/policyadd/policyadd.component';
import { PolicySelectComponent } from './pages/policyselect/policyselect.component';
import { PolicyCalculateComponent } from './pages/policycalculate/policycalculate.component';
import { ConsultantComponent } from './pages/consultant/consultant.component';
import { OffersComponent } from './pages/offers/offers.component';
import { ReportComponent } from './pages/report/report.component';
import { AgreementComponent } from './pages/agreement/agreement.component';
import { CustomersComponent } from './pages/customers/customers.component';
import { FileComponent } from './pages/file/file.component';
import { AutomationSetupComponent } from './pages/automation-setup/automation-setup.component';
import { AutomationFormComponent } from './pages/automation-form/automation-form.component';
import { FormMandateWefoxComponent } from './pages/form-mandate-wefox/form-mandate-wefox.component';
import { CustomersMandateComponent } from './pages/customers-mandate/customers-mandate.component';
import { CustomersMandateAddComponent } from './pages/customers-mandate-add/customers-mandate-add.component';
import { CustomersMandatePoliciesComponent } from './pages/customers-mandate-policies/customers-mandate-policies.component';
import { ConsultantAutomationComponent } from './pages/consultant-automation/consultant-automation.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  {
    path: '',
    component: LayoutUnauthedComponent,
    children: [
      { path: 'login', component: LoginComponent },
      { path: 'recover', component: RecoverComponent },
      { path: 'register', component: RegisterComponent },
      { path: 'register/:consultantCode', component: RegisterComponent },
      { path: 'language_unauthed', component: LanguageComponent }

    ],
    canActivate: [isNonAuthenticatedRoute],
  },
  {
    path: '',
    component: LayoutUnauthedComponent,
    children: [
      { path: 'automation-form-generic-client', component: AutomationFormComponent, data: { publicMode: true } },
    ],
  },
  {
    path: '',
    component: LayoutAuthedComponent,
    children: [
      { path: 'home', component: HomeComponent },
      { path: 'menu', component: MenuComponent },
      { path: 'language', component: LanguageComponent },
      { path: 'profile', component: ProfileComponent },
      { path: 'link/:contactid', component: RegisterComponent },
      { path: 'policies', component: PoliciesComponent },
      { path: 'policies/:clientid', component: PoliciesComponent },
      { path: 'policy/:policyid', component: PolicyComponent },
      { path: 'policyadd', component: PolicyAddComponent },
      { path: 'consultant', component: ConsultantComponent },
      { path: 'consultant/:policyid', component: ConsultantComponent },
      { path: 'offer', component: OffersComponent },
      { path: 'offer/:offerid', component: OffersComponent },
      { path: 'policy-select', component: PolicySelectComponent },
      { path: 'report/:policyid', component: ReportComponent },
      { path: 'compare', component: PolicyCalculateComponent },
      { path: 'agreement', component: AgreementComponent },
      { path: 'customers', component: CustomersComponent },
      { path: 'automation-setup', component: AutomationSetupComponent },
      { path: 'automation-form', component: AutomationFormComponent },
      { path: 'form-mandate-wefox', component: FormMandateWefoxComponent },
      { path: 'customers-mandate', component: CustomersMandateComponent },
      { path: 'customers-mandate-add', component: CustomersMandateAddComponent },
      { path: 'customers-mandate-policies/:id', component: CustomersMandatePoliciesComponent },
      { path: 'consultant-automation', component: ConsultantAutomationComponent },
    ],
    canActivate: [isAuthenticatedRoute],
  },
  {
    path: '',
    component: LayoutPDFComponent,
    children: [
      { path: 'file/:fileid', component: FileComponent },
      { path: 'jasper/:reportName/:contactId', component: FileComponent },
    ],
    canActivate: [isAuthenticatedRoute],
  },
  { path: '**', redirectTo: '/login', pathMatch: 'full' },
];
