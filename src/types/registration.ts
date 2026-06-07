import type { GatedActionResponse, MemberActivationCodeCenter, MoneyMode } from './auth';

export type RegistrationOrigin = 'referral-link' | 'genealogy-slot';

export type RegistrationPreview = {
  moneyMode: MoneyMode;
  origin: RegistrationOrigin;
  canProceed: boolean;
  sponsor: {
    username: string;
    fullName: string;
    referralCode: string;
    packageTier: string;
  } | null;
  selectedPackage: string | null;
  placementSide: 'left' | 'right' | null;
  resolvedAccountType: string | null;
  matchingCode: MemberActivationCodeCenter['inventory'][number] | null;
  placement: {
    placementUsername: string;
    placementSide: 'left' | 'right';
    note: string;
  } | null;
  availableCodes: MemberActivationCodeCenter['inventory'];
  issues: string[];
  checklist: string[];
};

export type RegistrationSubmitResponse = GatedActionResponse & {
  createdMember?: {
    username: string;
    fullName: string;
    email: string;
    referralCode: string;
    sponsorUsername: string;
    packageTier: string;
    accountType: string;
    loginEmail: string;
  };
};
