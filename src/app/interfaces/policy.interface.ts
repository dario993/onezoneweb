export interface PolicyInterface {
  id: number;
  insurance: number;
  img: string;
  title: any;
  licencePlate?: string | null;
  contactname?: string;
  raw?: any;
  contact?: any;
}

export interface PolicyPremiumInterface extends PolicyInterface {
  nr: string;
  endDate: number;
  amount: number;
  invoicedate: string;
  invoiceamount: string;
}
