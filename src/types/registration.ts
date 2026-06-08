import type { GatedActionResponse, MemberActivationCodeCenter, MoneyMode } from './auth';

export type RegistrationOrigin = 'referral-link' | 'genealogy-slot';

export type RegistrationPayload = {
  origin: RegistrationOrigin;
  fullName: string;
  username: string;
  email?: string;
  phone: string;
  password: string;
  activationCode: string;
  referralCode?: string;
  sponsorReferralCode?: string;
  placementContext?: {
    parentUsername: string;
    side: 'left' | 'right';
  };
  placementToken?: string;
  placementReservationId?: string;
};

export type RegistrationPreview = {
  moneyMode: MoneyMode;
  origin: RegistrationOrigin;
  canProceed: boolean;
  sponsorResolutionMode?: 'referral-link' | 'manual-sponsor' | 'signed-in-member' | null;
  sponsor: {
    username: string;
    fullName: string;
    referralCode: string;
    packageTier: string;
  } | null;
  selectedPackage: string | null;
  derivedPackage?: string | null;
  derivedPackageLabel?: string | null;
  placementSide: 'left' | 'right' | null;
  resolvedAccountType: string | null;
  placementReservationId?: string | null;
  placementToken?: string | null;
  placementState?: 'pending' | 'placed' | null;
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
  placementReservationId?: string | null;
  queuedCompensation?: string[];
  createdMember?: {
    username: string;
    fullName: string;
    email?: string;
    referralCode: string;
    sponsorUsername: string;
    packageTier: string;
    accountType: string;
    loginEmail?: string;
  };
};
