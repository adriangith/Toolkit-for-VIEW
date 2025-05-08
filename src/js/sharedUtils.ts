// TypeScript version of sharedUtils

// Define interfaces for your data structures
export interface DebtorData {
    id: string;
    thirdParty: boolean;
    contactName: string;
    organisation: string;
    street: string;
    town: string;
    state: string;
    postCode: string;
    to3rdParty: boolean;
    toTheDebtor: boolean;
    alt3rdParty: boolean;
    altName: string;
    altOrganisation: string;
    altStreet: string;
    altTown: string;
    altState: string;
    altPostCode: string;
    legalCentre: boolean;
    altLegalCentre: boolean;
}

// Typed function - better code completion and error checking
export function saveIT(): void {
    if (document.querySelector('html > head > title')?.textContent?.match(/Civica Debtors (.*)/)) {
        const titleElement = document.querySelector('html > head > title');
        const debtorId = titleElement?.textContent?.match(/Civica Debtors (.*)/)![1] || '';

        // Type-safe form element access with null checking
        const thirdParty = (document.getElementById('3PA') as HTMLInputElement)?.checked || false;
        const contactName = (document.getElementById('Name') as HTMLInputElement)?.value || '';
        const organisation = (document.getElementById('Organisation') as HTMLInputElement)?.value || '';
        // Add the rest of your form fields here

        // Type-safe array with proper structure
        const debtorData: DebtorData = {
            id: debtorId,
            thirdParty,
            contactName,
            organisation,
            // Add other properties
            street: (document.getElementById('Street') as HTMLInputElement)?.value || '',
            town: (document.getElementById('Town') as HTMLInputElement)?.value || '',
            state: (document.getElementById('State') as HTMLInputElement)?.value || '',
            postCode: (document.getElementById('PostCode') as HTMLInputElement)?.value || '',
            to3rdParty: (document.getElementById('to3rdParty') as HTMLInputElement)?.checked || false,
            toTheDebtor: (document.getElementById('toTheDebtor') as HTMLInputElement)?.checked || false,
            alt3rdParty: (document.getElementById('Alt3rdParty') as HTMLInputElement)?.checked || false,
            altName: (document.getElementById('AltName') as HTMLInputElement)?.value || '',
            altOrganisation: (document.getElementById('AltOrganisation') as HTMLInputElement)?.value || '',
            altStreet: (document.getElementById('AltStreet') as HTMLInputElement)?.value || '',
            altTown: (document.getElementById('AltTown') as HTMLInputElement)?.value || '',
            altState: (document.getElementById('AltState') as HTMLInputElement)?.value || '',
            altPostCode: (document.getElementById('AltPostCode') as HTMLInputElement)?.value || '',
            legalCentre: (document.getElementById('3LC') as HTMLInputElement)?.checked || false,
            altLegalCentre: (document.getElementById('Alt3LC') as HTMLInputElement)?.checked || false
        };

        // Type-safe Chrome API usage
        chrome.storage.local.get(['value'], (items) => {
            const existingValues: DebtorData[] = items.value || [];

            const index = existingValues.findIndex(item => item.id === debtorId);
            if (index !== -1) {
                existingValues[index] = debtorData;
            } else {
                existingValues.push(debtorData);
            }

            chrome.storage.local.set({ 'value': existingValues });
            console.log('Data saved for debtor:', debtorId);
        });
    }
}

