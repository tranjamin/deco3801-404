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
    validTo: "2025-04-01T00:00:00Z"
  },
  {
    id: "4",
    protocol: "TLS 1.2",
    cipher: "ECDHE-RSA-AES256-SHA",
    subjectName: "legacy-site.net",
    sanList: ["legacy-site.net"],
    issuer: "DigiCert",
    validFrom: "2026-04-01T00:00:00Z",
    validTo: "2026-05-25T00:00:00Z"
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
    validTo: "2024-01-01T00:00:00Z"
  },
  {
    id: "7",
    protocol: "TLS 1.2",
    cipher: "ECDHE-RSA-AES128-SHA",
    subjectName: "old-api.service.com",
    sanList: ["old-api.service.com"],
    issuer: "GlobalSign",
    validFrom: "2026-01-14T00:00:00Z",
    validTo: "2026-04-20T00:00:00Z"
  },
  {
    id: "8",
    protocol: "TLS 1.3",
    cipher: "TLS_AES_256_GCM_SHA384",
    subjectName: "microsoft.com",
    sanList: ["microsoft.com", "://microsoft.com", "://microsoft.com"],
    issuer: "Microsoft Azure TLS Issuing CA 01",
    validFrom: "2025-10-01T00:00:00Z",
    validTo: "2026-10-01T00:00:00Z"
  },
  {
    id: "9",
    protocol: "TLS 1.3",
    cipher: "TLS_AES_128_GCM_SHA256",
    subjectName: "github.com",
    sanList: ["github.com", "://github.com"],
    issuer: "DigiCert High Assurance TLS Hybrid ECC SHA256 CA G2",
    validFrom: "2025-02-01T00:00:00Z",
    validTo: "2026-02-01T00:00:00Z"
  },
  {
    id: "10",
    protocol: "TLS 1.2",
    cipher: "ECDHE-RSA-CHACHA20-POLY1305",
    subjectName: "dev-portal.local",
    sanList: ["dev-portal.local"],
    issuer: "Local Development CA",
    validFrom: "2024-01-01T00:00:00Z",
    validTo: "2024-06-01T00:00:00Z"
  },
  {
    id: "11",
    protocol: "TLS 1.3",
    cipher: "TLS_AES_256_GCM_SHA384",
    subjectName: "bank-secure.com",
    sanList: ["bank-secure.com", "://bank-secure.com"],
    issuer: "Entrust Certification Authority",
    validFrom: "2026-01-01T00:00:00Z",
    validTo: "2026-12-31T00:00:00Z"
  },
  {
    id: "12",
    protocol: "TLS 1.2",
    cipher: "AES256-GCM-SHA384",
    subjectName: "legacy-api.oldcorp.org",
    sanList: ["legacy-api.oldcorp.org"],
    issuer: "Sectigo Public Cloud RSA CA",
    validFrom: "2023-05-20T00:00:00Z",
    validTo: "2024-05-20T00:00:00Z"
  },
  {
    id: "13",
    protocol: "TLS 1.3",
    cipher: "TLS_AES_256_GCM_SHA384",
    subjectName: "staging.dashboard.io",
    sanList: ["staging.dashboard.io"],
    issuer: "Let's Encrypt",
    validFrom: "2026-01-25T00:00:00Z",
    validTo: "2026-04-25T00:00:00Z"
  },
  {
    id: "14",
    protocol: "TLS 1.2",
    cipher: "ECDHE-RSA-AES128-GCM-SHA256",
    subjectName: "payment-gateway.net",
    sanList: ["payment-gateway.net", "api.payment-gateway.net"],
    issuer: "DigiCert TLS RSA SHA256 2020 CA1",
    validFrom: "2025-04-28T00:00:00Z",
    validTo: "2026-04-28T00:00:00Z"
  },
  {
    id: "15",
    protocol: "TLS 1.3",
    cipher: "TLS_CHACHA20_POLY1305_SHA256",
    subjectName: "vpn.internal.corp",
    sanList: ["vpn.internal.corp"],
    issuer: "Company Internal CA",
    validFrom: "2025-05-01T00:00:00Z",
    validTo: "2026-05-01T00:00:00Z"
  },
  {
    id: "16",
    protocol: "TLS 1.3",
    cipher: "TLS_AES_128_GCM_SHA256",
    subjectName: "://service.com",
    sanList: ["://service.com"],
    issuer: "Cloudflare Inc ECC CA-3",
    validFrom: "2026-02-05T00:00:00Z",
    validTo: "2026-05-05T00:00:00Z"
  },
  {
    id: "17",
    protocol: "TLS 1.2",
    cipher: "ECDHE-RSA-AES256-GCM-SHA384",
    subjectName: "enterprise.com",
    sanList: ["enterprise.com"],
    issuer: "Sectigo RSA Organization Validation Secure Server CA",
    validFrom: "2025-05-07T00:00:00Z",
    validTo: "2026-05-07T00:00:00Z"
  }
];