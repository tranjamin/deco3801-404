import type { TLSCertificate, TLSCertificateTransformed } from "./types";

// Converts datetime into YYYY-MM-DD instead of YYYY-MM-DDT[TIME]Z
export function transformCertificates(
    cert: TLSCertificate[]
): TLSCertificateTransformed[] {
    const now = Date.now();

    return cert.map( cert => {
        const formattedValidTo = new Intl.DateTimeFormat("en-CA").format(
            new Date(cert.validTo)
        );
        const formattedValidFrom = new Intl.DateTimeFormat("en-CA").format(
            new Date(cert.validFrom)
        );
    
        const diff = new Date(cert.validTo).getTime() - now;
        const daysRemaining = Math.ceil(diff / (1000*60*60*24));

        let status: TLSCertificateTransformed["status"];
        if (daysRemaining < 0) status = "expired";
        else if (daysRemaining < 15) status = "warning";
        else status = "ok";

        return {
            ...cert,
            validTo: formattedValidTo,
            validFrom: formattedValidFrom,
            daysRemaining,
            status
        };
    })
}


export function transformSingleCert(
    cert: TLSCertificate
): TLSCertificateTransformed {
    const formattedValidTo = new Intl.DateTimeFormat("en-CA").format(
        new Date(cert.validTo)
    );
    const formattedValidFrom = new Intl.DateTimeFormat("en-CA").format(
        new Date(cert.validFrom)
    );

    const now = Date.now();
    const diff = new Date(cert.validTo).getTime() - now;
    const daysRemaining = Math.ceil(diff / (1000*60*60*24));
    
    let status: TLSCertificateTransformed["status"];
    if (daysRemaining <= 0) status = "expired";
    else if (daysRemaining < 15) status = "warning";
    else status = "ok";

    return {
        ...cert,
        validTo: formattedValidTo,
        validFrom: formattedValidFrom,
        daysRemaining,
        status
    };
}



export function transformCertificatesKeepTime(
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