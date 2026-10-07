// The six milestones every application moves through, with the wording the Journey screen shows.
export const STAGE_DESC: Record<number, string> = {
  1: 'Application auto-filled & submitted successfully via DigiLocker credential link.',
  2: 'Aadhaar, ST Caste Certificate & Income e-verified instantly through government databases.',
  3: 'Institute Nodal Officer verified bonafide, enrolment, attendance & fee ledger.',
  4: 'Scrutiny of ST welfare quotas & final nodal sign-off for state treasury sanction batch.',
  5: 'State Tribal Welfare Department sanction order generation & treasury allocation.',
  6: 'Direct credit via RBI-PFMS gateway into your validated Aadhaar-linked account.',
};

export const STAGE_ICON: Record<number, string> = {
  1: 'account-check-outline',
  2: 'robot-outline',
  3: 'school-outline',
  4: 'shield-check-outline',
  5: 'clock-outline',
  6: 'bank-outline',
};

// What the application's overall status is once stage `n` is the one in progress.
export function statusAtStage(current: number, finished: boolean): 'submitted' | 'in_review' | 'sanctioned' | 'credited' {
  if (finished) return 'credited';
  if (current <= 3) return 'submitted';
  if (current <= 5) return 'in_review';
  return 'sanctioned';
}

// Notification sent when a stage is completed.
export const STAGE_DONE_NOTE: Record<number, { title: string; body: string; icon: string }> = {
  1: { title: 'Application submitted', body: 'Your application has been received.', icon: 'check-decagram-outline' },
  2: { title: 'Auto-verification complete', body: 'Your documents were verified automatically.', icon: 'robot-outline' },
  3: { title: 'Institute verified your application', body: 'Your institute confirmed your enrolment for 2026-27.', icon: 'check-decagram-outline' },
  4: { title: 'District review complete', body: 'The District Welfare Officer cleared your application.', icon: 'shield-check-outline' },
  5: { title: 'State sanction issued', body: 'Your scholarship has been sanctioned and sent for payment.', icon: 'file-certificate-outline' },
  6: { title: 'Scholarship credited', body: 'Your scholarship amount has been credited to your bank account.', icon: 'cash-multiple' },
};
