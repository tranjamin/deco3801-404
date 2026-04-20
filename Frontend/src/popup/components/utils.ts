import type { TLSData } from "../types";
import type { TLSDataTransformed } from "../types";


export function transformCertificate(
    cert: TLSData[]
): TLSDataTransformed[] {
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

        let status: TLSDataTransformed["status"];

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
    cert: TLSData
): TLSDataTransformed {
    const formattedValidTo = new Intl.DateTimeFormat("en-CA").format(
        new Date(cert.validTo)
    );

    const formattedValidFrom = new Intl.DateTimeFormat("en-CA").format(
        new Date(cert.validFrom)
    );

    const now = Date.now();
    const diff = new Date(cert.validTo).getTime() - now;
    const daysRemaining = Math.ceil(diff / (1000*60*60*24));
    let status: TLSDataTransformed["status"];

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