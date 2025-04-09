// @ts-nocheck

export function createBankruptcy(properties) {
    return `Bankruptcy investigated and processed.

Copy of bankruptcy letter and schedule uploaded to task.
${properties.holdsRemoved ? `
Holds removed on obligations:
${properties.holdsRemoved.replace(/,/g, '\n')}
` : ''}${properties.holdsPlaced ? `
Provable obligations subject to bankruptcy placed on hold:
${properties.holdsPlaced.replace(/,/g, '\n')}
` : ''}${properties.proceduralHoldsPlaced ? `
Procedural holds placed on provable warrant obligations:
${properties.proceduralHoldsPlaced.replace(/,/g, '\n')}

` : ''}`
}

export function updateBankruptcy(properties) {
    return `Additional correspondence received.
    
${properties.holdsRemoved ? `
Holds removed on obligations:
${properties.holdsRemoved.replace(/,/g, '\n')}
` : ''}${properties.holdsPlaced ? `
Provable obligations subject to bankruptcy placed on hold:
${properties.holdsPlaced.replace(/,/g, '\n')}
` : ''}${properties.proceduralHoldsPlaced ? `
Procedural holds placed on provable warrant obligations:
${properties.proceduralHoldsPlaced.replace(/,/g, '\n')}

` : ''}`
}