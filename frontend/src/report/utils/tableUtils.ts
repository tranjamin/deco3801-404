import type { TLSCertificateTransformed } from "../../sharedComponent/types";


export function filterCertificates( data: TLSCertificateTransformed[], statusFilters:string[]) {
    if (statusFilters.length === 3) {
        return data;
    }

    return data.filter(cert => statusFilters.includes(cert.status));
}


export function sortCertificates( data: TLSCertificateTransformed[], sortBy: string) {
    const sorted = [...data];

    switch (sortBy) {
        case "expiry":
            return sorted.sort((a, b) => b.daysRemaining - a.daysRemaining);
        
        case "domain":
            return sorted.sort((a, b) => b.subjectName.localeCompare(a.subjectName));

        case "issuer":
            return sorted.sort((a, b) => b.issuer.localeCompare(a.issuer));

        default:
            return sorted.sort((a, b) => Number(b.id) - Number(a.id));
    }
}