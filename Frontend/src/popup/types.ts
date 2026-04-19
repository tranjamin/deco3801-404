export type TLSData = {
  id: string;
  protocol: string;
  cipher: string;
  subjectName: string;
  sanList: string[];
  issuer: string;
  validFrom: string; // or Date if parsed
  validTo: string;
};
