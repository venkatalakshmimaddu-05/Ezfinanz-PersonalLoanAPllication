export type Role = "CUSTOMER" | "ADMIN";

export type ApplicationStatus =
  | "DRAFT"
  | "KYC_PENDING"
  | "ELIGIBILITY_PENDING"
  | "EMI_PENDING"
  | "BANK_PENDING"
  | "DECLARATION_PENDING"
  | "SELFIE_PENDING"
  | "ADMIN_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "DISBURSED";

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  emailVerified?: boolean;
  phoneVerified?: boolean;
}

export interface LoanApplication {
  id: string;
  userId: string;
  status: ApplicationStatus;
  createdAt: string;
  updatedAt: string;
  user?: { id: string; name: string; email: string; phone?: string };
  kyc?: KYCDetail;
  eligibility?: EligibilityCheck;
  emiSelection?: EMISelection;
  bankAccount?: BankAccount;
  declaration?: Declaration;
  selfie?: SelfieVerification;
}

export interface KYCDetail {
  fullName: string;
  dob: string;
  gender: string;
  address: string;
  idType: string;
  idNumber: string;
  idPhotoUrl?: string;
}

export interface EligibilityCheck {
  monthlyIncome: number;
  requestedAmount: number;
  employer: string;
  creditScore: number;
  existingDebt: number;
  dtiRatio: number;
  result: "ELIGIBLE" | "PARTIALLY_ELIGIBLE" | "NOT_ELIGIBLE";
}

export interface EMISelection {
  amount: number;
  tenureMonths: number;
  interestRate: number;
  processingFee: number;
  gst: number;
  netDisbursement: number;
  emi: number;
  totalInterest: number;
  totalRepayment: number;
  irrAnnual: number;
}

export interface BankAccount {
  holderName: string;
  accountNumber: string;
  ifsc: string;
  bankName: string;
  verified: boolean;
}

export interface Declaration {
  acceptedTerms: boolean;
  acceptedAt: string;
}

export interface SelfieVerification {
  photoUrl: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  rejectionReason?: string;
}
