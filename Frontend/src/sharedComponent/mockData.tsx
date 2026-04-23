import type { TLSCertificate } from "./types";

export const mockTLSData: TLSCertificate[] = [
  {
    id: "1",
    protocol: "TLS 1.3",
    cipher: "TLS_AES_256_GCM_SHA384",
    subjectName: "example.com",
    sanList: ["example.com", "www.example.com"],
    issuer: "Let's Encrypt",
    validFrom: "2025-01-01T00:00:00Z",
    validTo: "2026-01-01T00:00:00Z"
  },
  {
    id: "2",
    protocol: "TLS 1.2",
    cipher: "ECDHE-RSA-AES128-GCM-SHA256",
    subjectName: "google.com",
    sanList: ["google.com", "www.google.com"],
    issuer: "Google Trust Services",
    validFrom: "2025-06-01T00:00:00Z",
    validTo: "2026-06-01T00:00:00Z"
  },
  {
    id: "3",
    protocol: "TLS 1.3",
    cipher: "TLS_CHACHA20_POLY1305_SHA256",
    subjectName: "myapp.dev",
    sanList: ["myapp.dev"],
    issuer: "Let's Encrypt",
    validFrom: "2025-07-01T00:00:00Z",
    validTo: "2025-04-01T00:00:00Z" // expired
  },
  {
    id: "4",
    protocol: "TLS 1.2",
    cipher: "ECDHE-RSA-AES256-SHA",
    subjectName: "legacy-site.net",
    sanList: ["legacy-site.net"],
    issuer: "DigiCert",
    validFrom: "2026-04-01T00:00:00Z",
    validTo: "2026-04-25T00:00:00Z" // expiring soon
  },
  {
    id: "5",
    protocol: "TLS 1.3",
    cipher: "TLS_AES_128_GCM_SHA256",
    subjectName: "api.service.io",
    sanList: ["api.service.io", "service.io"],
    issuer: "Cloudflare Inc ECC CA-3",
    validFrom: "2025-03-15T00:00:00Z",
    validTo: "2025-12-15T00:00:00Z"
  },
  {
    id: "6",
    protocol: "TLS 1.3",
    cipher: "TLS_AES_256_GCM_SHA384",
    subjectName: "internal.company.local",
    sanList: ["internal.company.local"],
    issuer: "Company Internal CA",
    validFrom: "2023-01-01T00:00:00Z",
    validTo: "2024-01-01T00:00:00Z" // expired
  },
  {
    id: "7",
    protocol: "TLS 1.2",
    cipher: "ECDHE-RSA-AES128-SHA",
    subjectName: "old-api.service.com",
    sanList: ["old-api.service.com"],
    issuer: "GlobalSign",
    validFrom: "2026-01-14T00:00:00Z",
    validTo: "2026-04-20T00:00:00Z" // very soon
  }
];