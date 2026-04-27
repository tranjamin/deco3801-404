export type TLSCertificate = {
  id: string;
  protocol: string;
  cipher: string;
  subjectName: string;
  sanList: string[];
  issuer: string;
  validFrom: string; // or Date if parsed
  validTo: string;
};

export type TLSCertificateTransformed = TLSCertificate & {
  daysRemaining: number;
  status: "ok" | "warning" | "expired";
};