import type { TLSCertificate } from "../types";
import type { TLSCertificateTransformed } from "../types";


export function transformCertificates(
    data: TLSCertificate[]
): TLSCertificateTransformed[] {
    const now = Date.now();

    return data.map( cert => {
        const diff = new Date(cert.validTo).getTime() - now;

        const daysRemaining = Math.ceil(diff / (1000*60*60*24));

        let status: TLSCertificateTransformed["status"];

        if (daysRemaining < 0) status = "expired";
        else if (daysRemaining < 15) status = "warning";
        else status = "ok";

        return {
            ...cert,
            daysRemaining,
            status
        };
    })
}