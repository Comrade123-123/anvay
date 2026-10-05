// Stand-ins for the government systems ANVAY talks to (DigiLocker, NPCI / PFMS, institute records). Each one is an
// interface with a simulated implementation, so the rest of the backend never knows whether the answer is real.
// Replacing a simulator with the real integration later means changing one file.

export type DocumentCheck = {
  ok: boolean;
  problems: ('blurry' | 'name_mismatch' | 'expired' | 'unreadable')[];
  source: string;
};

export interface DocumentVerifier {
  verify(input: { kind: string; fileName: string; studentName: string }): Promise<DocumentCheck>;
}

export type SeedingStatus = { seeded: boolean; bank: string; last4: string; npciMapped: boolean };

export interface SeedingService {
  status(studentId: string): Promise<SeedingStatus>;
  fix(studentId: string): Promise<SeedingStatus>;
}

export type PaymentResult = { ok: boolean; reference: string; reason?: string };

export interface PaymentGateway {
  credit(input: { studentId: string; amount: number; scheme: string }): Promise<PaymentResult>;
}
