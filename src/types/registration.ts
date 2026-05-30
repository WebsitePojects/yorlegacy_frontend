import type { GatedActionResponse, MemberActivationCodeCenter, MoneyMode } from './auth';

export type RegistrationPreview = {
  moneyMode: MoneyMode;
  canProceed: boolean;
  sponsor: {
    username: string;
    fullName: string;
    referralCode: string;
    packageTier: string;
  } | null;
  selectedPackage: string | null;
  preferredSide: 'left' | 'right' | null;
  matchingCode: MemberActivationCodeCenter['inventory'][number] | null;
  placement: {
    placementUsername: string;
    placementSide: string;
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
    loginEmail: string;
  };
};
