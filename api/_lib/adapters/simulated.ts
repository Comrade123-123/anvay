import { DocumentCheck, DocumentVerifier, PaymentGateway, PaymentResult, SeedingService, SeedingStatus } from './types';

// Simulated services used while ANVAY is a prototype. They are deterministic on purpose so demos behave the same way
// every time: a file whose name contains "blur" fails the quality check, "mismatch" fails the name check.
export const documentVerifier: DocumentVerifier = {
  async verify({ fileName }): Promise<DocumentCheck> {
    const n = fileName.toLowerCase();
    const problems: DocumentCheck['problems'] = [];
    if (n.includes('blur')) problems.push('blurry');
    if (n.includes('mismatch')) problems.push('name_mismatch');
    return { ok: problems.length === 0, problems, source: 'DigiLocker (simulated)' };
  },
};

const seededDefault: SeedingStatus = { seeded: true, bank: 'State Bank of India', last4: '4417', npciMapped: true };

export const seedingService: SeedingService = {
  async status() {
    return seededDefault;
  },
  async fix() {
    return seededDefault;
  },
};

export const paymentGateway: PaymentGateway = {
  async credit({ studentId, amount }): Promise<PaymentResult> {
    return { ok: true, reference: `PFMS-${studentId.slice(0, 4).toUpperCase()}-${amount}-${Date.now() % 100000}` };
  },
};
