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
        case "expiryAsc":
            return sorted.sort((a, b) => a.daysRemaining - b.daysRemaining);

        case "domainAsc":
            return sorted.sort((a, b) => a.subjectName.localeCompare(b.subjectName));

        case "issuerAsc":
            return sorted.sort((a, b) => a.issuer.localeCompare(b.issuer));

        case "expiryDesc":
            return sorted.sort((a, b) => b.daysRemaining - a.daysRemaining);
        
        case "domainDesc":
            return sorted.sort((a, b) => b.subjectName.localeCompare(a.subjectName));

        case "issuerDesc":
            return sorted.sort((a, b) => b.issuer.localeCompare(a.issuer));

        default:
            return sorted.sort((a, b) => Number(b.id) - Number(a.id));
    }
}