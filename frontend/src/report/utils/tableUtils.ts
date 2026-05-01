import type { TLSCertificateTransformed } from "../../sharedComponent/types";


type Filters = {
    status: string[];
    protocol: string[];
}



export function filterCertificates( data: TLSCertificateTransformed[], filters:Filters) {
    return data.filter(cert => {

        const statusFilters = filters.status.length === 0 || filters.status.includes(cert.status);

        const protocolFilters = filters.protocol.length === 0 || filters.protocol.includes(cert.protocol);

        return statusFilters && protocolFilters;
    });
};


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
};


export function searchCertificates(data: TLSCertificateTransformed[], query: string) {

    if (!query.trim()) return data; // checks if query is empty. if so, return the entire data

    const lowerQuery = query.toLowerCase(); // convert query to lower case

    return data.filter(cert => 
        cert.subjectName.toLowerCase().includes(lowerQuery) || // checks if part of the domain includes the query
        cert.issuer.toLowerCase().includes(lowerQuery) // checks if part of the issuer includes the query
    );
};