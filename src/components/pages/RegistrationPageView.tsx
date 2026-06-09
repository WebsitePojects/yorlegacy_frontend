import { useEffect, useState } from 'react';
import { Eye, EyeOff, KeyRound, Lock, Mail, Phone, User, X } from 'lucide-react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useFeedback } from '../feedback/FeedbackProvider';
import { fetchMemberActivationCodes, fetchRegistrationPreview, submitRegistration } from '../../lib/api';
import type { PageContent } from '../../types/content';
import type { MemberActivationCodeCenter } from '../../types/auth';
import type { RegistrationPreview, RegistrationSubmitResponse } from '../../types/registration';

type RegistrationPageViewProps = {
  content?: PageContent;
  variant?: 'page' | 'modal';
  initialContext?: {
    referralCode?: string;
    placementContext?: {
      parentUsername: string;
      side: 'left' | 'right';
    };
    placementSide?: 'left' | 'right';
    placementParentUsername?: string;
    placementParentLabel?: string;
    placementToken?: string;
  };
  onClose?: () => void;
  onSubmitted?: (result: RegistrationSubmitResponse) => void;
};

const REGISTRATION_PACKAGES = new Set(['BASIC', 'CLASSIC', 'STANDARD', 'BUSINESS', 'VIP']);

function toDisplaySide(side: 'left' | 'right') {
  return side === 'right' ? 'Right' : 'Left';
}

function normalizeUsername(value: string) {
  return value.trimStart();
}

export function RegistrationPageView({
  content: _content,
  variant = 'page',
  initialContext,
  onClose,
  onSubmitted
}: RegistrationPageViewProps) {
  const { confirmAction, presentNotice } = useFeedback();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [preview, setPreview] = useState<RegistrationPreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [availableCodes, setAvailableCodes] = useState<MemberActivationCodeCenter['inventory']>([]);
  const [codeLoading, setCodeLoading] = useState(false);
  const [isHiddenForFeedback, setIsHiddenForFeedback] = useState(false);
  const isModal = variant === 'modal';
  const origin = isModal ? 'genealogy-slot' : 'referral-link';
  const referralCode = initialContext?.referralCode ?? searchParams.get('ref') ?? '';
  const queryPlacementParentUsername = searchParams.get('parent') ?? searchParams.get('placementParentUsername') ?? '';
  const queryPlacementSide = searchParams.get('side') === 'right' ? 'right' : (searchParams.get('slot') === 'right' ? 'right' : 'left');
  const resolvedPlacementContext =
    initialContext?.placementContext ??
    (initialContext?.placementParentUsername
      ? {
          parentUsername: initialContext.placementParentUsername,
          side: initialContext.placementSide ?? 'left'
        }
      : queryPlacementParentUsername
        ? {
            parentUsername: queryPlacementParentUsername,
            side: queryPlacementSide
          }
        : null);
  const placementParentUsername = resolvedPlacementContext?.parentUsername ?? '';
  const placementParentLabel = initialContext?.placementParentLabel ?? placementParentUsername;
  const placementSide = resolvedPlacementContext?.side ?? null;
  const placementToken = initialContext?.placementToken ?? searchParams.get('token') ?? '';
  const hasLockedPlacement = Boolean(resolvedPlacementContext);
  const [form, setForm] = useState({
    fullName: '',
    username: '',
    email: '',
    phone: '',
    activationCode: '',
    password: '',
    confirmPassword: ''
  });
  const passwordsMatch = form.password.length > 0 && form.password === form.confirmPassword;

  useEffect(() => {
    if (!isModal) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isModal]);

  useEffect(() => {
    if (!isModal) {
      setAvailableCodes([]);
      return;
    }

    let active = true;
    setCodeLoading(true);
    void fetchMemberActivationCodes()
      .then((bundle) => {
        if (!active) {
          return;
        }

        setAvailableCodes(
          bundle.inventory.filter(
            (item) =>
              item.status === 'available' &&
              item.assignedTo === bundle.member.username &&
              REGISTRATION_PACKAGES.has(item.packageTier.toUpperCase())
          )
        );
      })
      .catch(() => {
        if (active) {
          setAvailableCodes([]);
        }
      })
      .finally(() => {
        if (active) {
          setCodeLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [isModal]);

  useEffect(() => {
    if (!form.activationCode.trim()) {
      setPreview(null);
      return;
    }

    let cancelled = false;
    const timeout = window.setTimeout(() => {
      setLoadingPreview(true);
      void fetchRegistrationPreview({
        origin,
        fullName: form.fullName,
        username: form.username,
        email: form.email,
        phone: form.phone,
        password: form.password,
        activationCode: form.activationCode,
        referralCode: origin === 'referral-link' ? referralCode : undefined,
        placementContext: hasLockedPlacement && placementParentUsername && placementSide
          ? {
              parentUsername: placementParentUsername,
              side: placementSide
            }
          : undefined,
        placementToken: placementToken || undefined
      })
        .then((result) => {
          if (!cancelled) {
            setPreview(result);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setPreview(null);
          }
        })
        .finally(() => {
          if (!cancelled) {
            setLoadingPreview(false);
          }
        });
    }, 280);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [
    form.activationCode,
    form.email,
    form.fullName,
    form.password,
    form.phone,
    form.username,
    hasLockedPlacement,
    origin,
    placementParentUsername,
    placementSide,
    placementToken,
    referralCode
  ]);

  const derivedPackageTier = preview?.selectedPackage ?? '';
  const derivedAccountType = preview?.resolvedAccountType ?? '';
  const placementSummary = hasLockedPlacement
    ? preview?.placement
      ? `${preview.placement.placementUsername} / ${toDisplaySide(preview.placement.placementSide)}`
      : `${placementParentLabel} / ${toDisplaySide(placementSide ?? 'left')}`
    : 'Pending — your sponsor will assign your position.';

  function handleBack() {
    if (location.key && window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate('/');
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.fullName.trim() || !form.username.trim() || !form.phone.trim() || !form.activationCode.trim()) {
      await presentNotice({
        title: 'Registration details incomplete',
        description: 'Fill in full name, username, phone number, and activation code before registering.',
        tone: 'warning'
      });
      return;
    }

    if (origin === 'referral-link' && !referralCode.trim()) {
      await presentNotice({
        title: 'Referral link required',
        description: 'Open this registration from a valid sponsor referral link so the sponsor can be resolved automatically.',
        tone: 'warning'
      });
      return;
    }

    if (!passwordsMatch) {
      await presentNotice({
        title: 'Passwords do not match',
        description: 'Please confirm the password before creating the account.',
        tone: 'warning'
      });
      return;
    }

    setIsHiddenForFeedback(true);

    try {
      const confirmed = await confirmAction({
        title: 'Register member?',
        description: [
          derivedPackageTier ? `Package: ${derivedPackageTier}` : null,
          derivedAccountType ? `Account type: ${derivedAccountType}` : null,
          `Placement: ${placementSummary}`
        ]
          .filter(Boolean)
          .join('\n'),
        confirmLabel: 'Register',
        tone: 'warning'
      });

      if (!confirmed) {
        setIsHiddenForFeedback(false);
        return;
      }

      setSubmitting(true);

      const result = await submitRegistration({
        origin,
        fullName: form.fullName,
        username: form.username,
        email: form.email,
        phone: form.phone,
        password: form.password,
        activationCode: form.activationCode,
        referralCode: origin === 'referral-link' ? referralCode : undefined,
        placementContext: hasLockedPlacement && placementParentUsername && placementSide
          ? {
              parentUsername: placementParentUsername,
              side: placementSide
            }
          : undefined,
        placementToken: placementToken || undefined
      });

      await presentNotice({
        title: result.createdMember ? 'Account created' : 'Registration committed',
        description: result.createdMember
          ? [
              `Username: ${result.createdMember.username}`,
              `Package: ${result.createdMember.packageTier}`,
              `Account type: ${result.createdMember.accountType}`,
              `Sponsor: ${result.createdMember.sponsorUsername}`
            ].join('\n')
          : result.detail ?? result.reason,
        tone: 'success'
      });

      onSubmitted?.(result);
    } catch (cause) {
      await presentNotice({
        title: 'Unable to submit registration',
        description: cause instanceof Error ? cause.message : 'Please try again.',
        tone: 'destructive'
      });
      setIsHiddenForFeedback(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section
      className={`registration-page registration-page--clean ${isModal ? 'registration-page--modal-shell' : ''} ${isHiddenForFeedback ? 'hidden-for-feedback' : ''}`}
      role={isModal ? 'dialog' : undefined}
      aria-modal={isModal ? 'true' : undefined}
      aria-labelledby={isModal ? 'registration-modal-title' : undefined}
    >
      {isModal ? <div className="registration-modal-backdrop" onClick={onClose} /> : null}
      <div className={`page-container registration-shell registration-shell--single ${isModal ? 'registration-shell--modal' : ''}`}>
        <div className={`registration-card registration-card--clean ${isModal ? 'registration-card--modal registration-card--encode' : ''}`}>
          {isModal ? (
            <div className="registration-modal-topbar">
              <div>
                <span className="eyebrow">Genealogy Encode</span>
                <p>Stay on the binary tree while you register the next downline under {placementParentUsername} / {toDisplaySide(placementSide ?? 'left')}.</p>
              </div>
              <button
                type="button"
                className="registration-modal-close"
                aria-label="Discard registration"
                onClick={onClose}
              >
                <X size={18} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="inline-flex items-center gap-2 text-sm font-medium text-[var(--yor-copper-soft)] transition hover:text-[var(--yor-gold)]"
              onClick={handleBack}
            >
              <span aria-hidden="true">←</span>
              Back
            </button>
          )}

          <div className="registration-clean-header">
            <span className="eyebrow">Official Registration</span>
            <h1 id={isModal ? 'registration-modal-title' : undefined}>
              {isModal ? 'Encode Member In Open Slot' : 'Create Member Account'}
            </h1>
          </div>

          {isModal && placementParentUsername && placementSide ? (
            <div className="registration-derived-grid" style={{ marginBottom: '24px' }}>
              <label className="reg-field">
                <span>Placement Under</span>
                <div className="reg-input-wrap">
                  <User className="reg-input-icon" size={15} />
                  <input readOnly type="text" value={placementParentUsername} style={{ color: 'var(--yor-gold, #c9a227)' }} />
                </div>
              </label>
              <label className="reg-field">
                <span>Placement Leg</span>
                <div className="reg-input-wrap">
                  <KeyRound className="reg-input-icon" size={15} />
                  <input readOnly type="text" value={toDisplaySide(placementSide).toUpperCase()} style={{ color: 'var(--yor-gold, #c9a227)' }} />
                </div>
              </label>
            </div>
          ) : null}

          <form className="registration-form-core registration-form-core--clean" id="registration-form" onSubmit={handleSubmit}>
            <div className="registration-form-group">
              <div className="reg-step-head">
                <span className="reg-step-badge">01</span>
                <div>
                  <div className="registration-form-group-title">Personal Information</div>
                  <div className="reg-step-sub">Member identity and contact details</div>
                </div>
              </div>
              <div className="reg-field-stack">
                <label className="reg-field">
                  <span>Full Name</span>
                  <div className="reg-input-wrap">
                    <User className="reg-input-icon" size={15} />
                    <input
                      placeholder="Jonathan Sterling"
                      type="text"
                      value={form.fullName}
                      onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
                      required
                    />
                  </div>
                </label>
                <div className="reg-field-row">
                <label className="reg-field">
                  <span>Username</span>
                    <div className="reg-input-wrap">
                      <User className="reg-input-icon" size={15} />
                      <input
                        placeholder="Choose a username"
                        type="text"
                        value={form.username}
                        onChange={(event) => setForm((current) => ({ ...current, username: normalizeUsername(event.target.value) }))}
                        required
                      />
                    </div>
                  </label>
                  <label className="reg-field">
                    <span>Phone Number</span>
                    <div className="reg-input-wrap">
                      <Phone className="reg-input-icon" size={15} />
                      <input
                        placeholder="+63 900 000 0000"
                        type="tel"
                        value={form.phone}
                        onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                        required
                      />
                    </div>
                  </label>
                </div>
                <label className="reg-field">
                  <span>Email Address (Optional)</span>
                  <div className="reg-input-wrap">
                    <Mail className="reg-input-icon" size={15} />
                    <input
                      placeholder="member@yorinternational.com"
                      type="email"
                      value={form.email}
                      onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                    />
                  </div>
                </label>
              </div>
            </div>

            <div className="registration-form-group">
              <div className="reg-step-head">
                <span className="reg-step-badge">02</span>
                <div>
                  <div className="registration-form-group-title">Activation Code</div>
                  <div className="reg-step-sub">{isModal ? 'Choose a released code from your registration inventory.' : 'Paste the code your sponsor gave you together with the referral link.'}</div>
                </div>
              </div>
              <div className="reg-field-stack">
                <label className="reg-field">
                  <span>Activation Code</span>
                  <div className="reg-input-wrap reg-input-wrap--select">
                    <KeyRound className="reg-input-icon" size={15} />
                    {isModal ? (
                      <select
                        value={form.activationCode}
                        onChange={(event) => setForm((current) => ({ ...current, activationCode: event.target.value }))}
                        disabled={codeLoading || availableCodes.length === 0}
                        required
                      >
                        <option value="">
                          {codeLoading
                            ? 'Loading usable codes...'
                            : availableCodes.length === 0
                              ? 'No available activation codes'
                              : 'Select usable activation code'}
                        </option>
                        {availableCodes.map((item) => (
                          <option key={item.code} value={item.code}>
                            {`${item.code} - ${item.accountType} - ${item.packageTier}`}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        placeholder="Paste activation code"
                        type="text"
                        value={form.activationCode}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, activationCode: event.target.value.toUpperCase().replace(/\s+/g, '') }))
                        }
                        required
                      />
                    )}
                  </div>
                  <p className="registration-inline-note">
                    {isModal
                      ? availableCodes.length === 0 && !codeLoading
                        ? 'No released registration code is assigned to this account yet. Ask admin or your sponsor to release and transfer one first.'
                        : 'Only released and unused registration codes are shown here.'
                      : 'Your sponsor should send this code privately. The form does not expose sponsor-owned codes.'}
                  </p>
                </label>
                <div className="registration-derived-grid">
                  <label className="reg-field">
                    <span>Derived Package</span>
                    <div className="reg-input-wrap">
                      <KeyRound className="reg-input-icon" size={15} />
                      <input
                        readOnly
                        type="text"
                        value={
                          derivedPackageTier
                            ? `${derivedPackageTier}`
                            : isModal && availableCodes.length === 0 && !codeLoading
                              ? 'Waiting for released code'
                              : 'Waiting for code validation'
                        }
                      />
                    </div>
                  </label>
                  <label className="reg-field">
                    <span>Account Type</span>
                    <div className="reg-input-wrap">
                      <KeyRound className="reg-input-icon" size={15} />
                      <input
                        readOnly
                        type="text"
                        value={
                          derivedAccountType ||
                          (isModal && availableCodes.length === 0 && !codeLoading
                            ? 'Waiting for released code'
                            : 'Waiting for code validation')
                        }
                      />
                    </div>
                  </label>
                </div>
                {preview?.issues.length ? (
                  <div className={`registration-preview-note ${preview.canProceed ? 'is-ready' : 'is-warning'}`}>
                    {preview.issues[0]}
                  </div>
                ) : (
                  <div className={`registration-preview-note ${loadingPreview ? 'is-pending' : 'is-ready'}`}>
                    {loadingPreview ? 'Validating code, sponsor context, and placement...' : 'Activation preview is synced.'}
                  </div>
                )}
              </div>
            </div>

            <div className="registration-form-group">
              <div className="reg-step-head">
                <span className="reg-step-badge">03</span>
                <div>
                  <div className="registration-form-group-title">Account Security</div>
                  <div className="reg-step-sub">Set the sandbox login password for this member.</div>
                </div>
              </div>
              <div className="reg-field-stack">
                <div className="reg-field-row">
                  <label className="reg-field">
                    <span>Password</span>
                    <div className="reg-input-wrap">
                      <Lock className="reg-input-icon" size={15} />
                      <input
                        placeholder="Create account password"
                        type={showPassword ? 'text' : 'password'}
                        value={form.password}
                        onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                        required
                      />
                      <button
                        type="button"
                        className="reg-pw-toggle"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        onClick={() => setShowPassword((value) => !value)}
                      >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </label>
                  <label className="reg-field">
                    <span>Confirm Password</span>
                    <div className="reg-input-wrap">
                      <Lock className="reg-input-icon" size={15} />
                      <input
                        className={form.confirmPassword && !passwordsMatch ? 'is-error' : passwordsMatch ? 'is-ok' : ''}
                        placeholder="Confirm password"
                        type={showConfirm ? 'text' : 'password'}
                        value={form.confirmPassword}
                        onChange={(event) => setForm((current) => ({ ...current, confirmPassword: event.target.value }))}
                        required
                      />
                      <button
                        type="button"
                        className="reg-pw-toggle"
                        aria-label={showConfirm ? 'Hide password' : 'Show password'}
                        onClick={() => setShowConfirm((value) => !value)}
                      >
                        {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <div className="registration-form-actions registration-form-actions--single">
              <button className="site-cta registration-primary-action" disabled={submitting || loadingPreview || (isModal && availableCodes.length === 0 && !codeLoading)} type="submit">
                {submitting ? 'Registering...' : 'Register'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
