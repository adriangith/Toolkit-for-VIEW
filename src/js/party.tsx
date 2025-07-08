import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom/client';

//===========================================================================
// 1. UTILITY & HELPER COMPONENTS
//===========================================================================

function debounce<T extends (...args: unknown[]) => void>(
    func: T,
    delay: number
): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout | undefined;
    return function (this: ThisParameterType<T>, ...args: Parameters<T>) {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
}


const AddressBlock = ({ addressData, onAddressChange, isDisabled = false }) => {
    const addressFields = [
        { label: 'Contact Name', id: 'contactName' }, { label: 'Organisation', id: 'organisation' },
        { label: 'Street', id: 'street' }, { label: 'Town', id: 'town' },
        { label: 'State', id: 'state' }, { label: 'Postcode', id: 'postcode' },
    ];

    return (
        // This component now returns a fragment of rows, which is correct.
        // The parent component will handle wrapping it correctly.
        <>
            {Array.from({ length: addressFields.length / 2 }).map((_, rowIndex) => {
                const field1 = addressFields[rowIndex * 2];
                const field2 = addressFields[rowIndex * 2 + 1];
                return (
                    <tr key={rowIndex}>
                        <td className="table-label-column"><span className="label-text">{field1.label}:</span></td>
                        <td className="table-value-column">
                            <input type="text" maxLength="100" tabIndex="41" className="textbox x"
                                id={field1.id} value={addressData[field1.id] || ''} onChange={onAddressChange} disabled={isDisabled} />
                        </td>
                        <td className="table-label-column"><span className="label-text">{field2.label}:</span></td>
                        <td className="table-value-column">
                            <input type="text" maxLength="100" tabIndex="41" className="textbox x"
                                id={field2.id} value={addressData[field2.id] || ''} onChange={onAddressChange} disabled={isDisabled} />
                        </td>
                    </tr>
                );
            })}
        </>
    );
};

const FormField = ({ config, value, onChange, isDisabled = false }) => {
    const commonProps = {
        id: config.id,
        tabIndex: "60",
        onChange: onChange,
        disabled: isDisabled,
    };

    switch (config.type) {
        case 'checkbox':
            // Removed the relative positioning as the stable layout should fix the alignment.
            return <input
                type="checkbox"
                {...commonProps}
                checked={!!value}
                style={{ position: 'relative', top: '-3px' }}
            />;
        default:
            return null;
    }
};

//===========================================================================
// 2. FORM CONFIGURATION
//===========================================================================

const formConfig = {
    rows: [
        {
            type: 'fieldRow',
            fields: [
                { type: 'checkbox', label: '3rd Party Application:', id: 'isThirdParty' }
            ]
        },
        {
            type: 'fieldRow',
            fields: [
                { type: 'checkbox', label: 'Legal Centre:', id: 'isLegalCentre' }
            ],
            renderCondition: (formData) => formData.isThirdParty
        },
        {
            type: 'addressBlock',
            id: 'mainAddress',
            renderCondition: (formData) => formData.isThirdParty
        },
        {
            type: 'radioGroup',
            id: 'addressTo',
            label: 'Address debtor letters:',
            renderCondition: (formData) => formData.isThirdParty,
            options: [
                { value: '3rd Party', label: 'To the 3rd Party' },
                { value: 'Debtor', label: 'To the debtor' },
                {
                    value: 'Alt 3rd Party',
                    label: 'To an alternative 3rd Party'//,
                    //       revealedField: { type: 'checkbox', label: 'Legal Centre:', id: 'altIsLegalCentre' }
                }
            ]
        },
        {
            type: 'fieldRow',
            fields: [
                { type: 'checkbox', label: 'Legal Centre:', id: 'altIsLegalCentre' }
            ],
            renderCondition: (formData) => formData.isThirdParty && formData.addressTo === 'Alt 3rd Party',
            disabledCondition: (formData) => !formData.isThirdParty
        },
        {
            type: 'addressBlock',
            id: 'altAddress',
            renderCondition: (formData) => formData.isThirdParty && formData.addressTo === 'Alt 3rd Party',
            disabledCondition: (formData) => !formData.isThirdParty
        }
    ]
};


const initialFormData = {
    isThirdParty: false,
    isLegalCentre: false,
    addressTo: '3rd Party',
    altIsLegalCentre: false,
    mainAddress: { contactName: '', organisation: '', street: '', town: '', state: '', postcode: '' },
    altAddress: { contactName: '', organisation: '', street: '', town: '', state: '', postcode: '' },
};


//===========================================================================
// 3. MAIN APPLICATION FORM COMPONENT
//===========================================================================

function ApplicationForm() {
    const [debtorId, setDebtorId] = useState(null);
    const [isPanelVisible, setIsPanelVisible] = useState(false);
    const panelVisibleStorageKey = 'applicationOptionsPanelVisible';
    const [formData, setFormData] = useState(initialFormData);

    useEffect(() => {
        try {
            const id = document.querySelector("#DebtorDetailsCtrl_DebtorIdSearch")?.defaultValue;
            if (id) setDebtorId(id);
        } catch (error) {
            console.error("Error finding debtor ID:", error);
        }
    }, []);

    useEffect(() => {
        if (debtorId && chrome.storage && chrome.storage.local) {
            chrome.storage.local.get([debtorId], (result) => {
                if (result[debtorId]) {
                    setFormData(prevData => ({ ...prevData, ...result[debtorId] }));
                } else {
                    setFormData(initialFormData);
                }
            });
        }
    }, [debtorId]);

    const debouncedSave = useCallback(debounce((id, data) => {
        if (id && chrome.storage && chrome.storage.local) {
            chrome.storage.local.set({ [id]: data });
        }
    }, 500), []);

    useEffect(() => {
        if (debtorId) {
            debouncedSave(debtorId, formData);
        }
    }, [formData, debtorId, debouncedSave]);

    useEffect(() => {
        const savedState = localStorage.getItem(panelVisibleStorageKey);
        if (savedState !== null) setIsPanelVisible(JSON.parse(savedState));
    }, []);

    useEffect(() => {
        localStorage.setItem(panelVisibleStorageKey, JSON.stringify(isPanelVisible));
    }, [isPanelVisible]);

    const togglePanel = useCallback(() => setIsPanelVisible(prev => !prev), []);
    const hidePanel = useCallback(() => setIsPanelVisible(false), []);

    useEffect(() => {
        const targetElement = document.querySelector("#DebtorDetailsCtrl_editDetailsButton");
        const buttonId = 'toggleApplicationOptionsBtn';
        if (targetElement && !document.getElementById(buttonId)) {
            const button = document.createElement('button');
            button.id = buttonId;
            button.type = 'button';
            button.textContent = 'Application Options';
            button.className = `!box-border h-[14px] cursor-pointer bg-purple-900 rounded-[0.15rem] border border-solid text-gray-200 text-opacity-90 font-verdana text-xs leading-none select-none no-underline blur-[0.30px] outline-1 outline-[#5f5867] border-t-[hsl(266_49%_45%)] border-l-[hsl(266_49%_45%)] border-b-purple-950 border-r-purple-950 hover:bg-[#ac9ebe] hover:border-t-[#c5bfd4] hover:border-l-[#c5bfd4] hover:border-b-[#937fa8] hover:border-r-[#937fa8] active:bg-purple-900 active:shadow-inner active:border-t-purple-950 active:border-l-purple-950 active:border-b-purple-800 active:border-r-purple-800 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),inset_0_-1px_1px_rgba(0,0,0,0.2)] px-2 items-center justify-center transition-all duration-75 text-[10px] mr-2 align-top mt-[1px]`;
            button.addEventListener('click', togglePanel);
            targetElement.parentNode.insertBefore(button, targetElement);
            return () => {
                button.removeEventListener('click', togglePanel);
                if (button.parentNode) button.parentNode.removeChild(button);
            };
        }
    }, [togglePanel]);

    const handleStateChange = (id, value, type = 'value') => {
        setFormData(prev => ({
            ...prev,
            [id]: type === 'checkbox' ? !prev[id] : value
        }));
    };

    const handleAddressChange = (addressType) => (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [addressType]: { ...prev[addressType], [id]: value }
        }));
    };

    return (
        <div id="DebtorAddressPanel" style={{ display: isPanelVisible ? 'block' : 'none' }}>
            <table cellPadding="0" cellSpacing="0" width="100%">
                <tbody>
                    <tr>
                        <td className="menu-header w-1/4 py-1 px-[9px]"> Application Options </td>
                        <td>&nbsp;</td>
                    </tr>
                </tbody>
            </table>
            <table className="bordertable" style={{ tableLayout: 'fixed' }}>
                <tbody>
                    <tr><td className="tdRowspace" colSpan="4"></td></tr>

                    {formConfig.rows.map((row, index) => {
                        if (row.renderCondition && !row.renderCondition(formData)) {
                            return null;
                        }
                        const isDisabled = row.disabledCondition ? row.disabledCondition(formData) : false;

                        switch (row.type) {
                            case 'fieldRow':
                                return (
                                    <tr key={index}>
                                        <td className="table-label-column" style={{ verticalAlign: 'middle' }}>
                                            <span className="label-text">{row.fields[0].label}</span>
                                        </td>
                                        <td className="table-value-column" style={{ verticalAlign: 'middle' }}>
                                            <FormField
                                                config={row.fields[0]}
                                                value={formData[row.fields[0].id]}
                                                onChange={() => handleStateChange(row.fields[0].id, null, 'checkbox')}
                                                isDisabled={isDisabled}
                                            />
                                        </td>
                                        {/* Always render two empty cells to maintain the 4-column structure */}
                                        <td></td>
                                        <td></td>
                                    </tr>
                                );

                            case 'addressBlock':
                                // The AddressBlock component returns its own <tr> elements, which is valid.
                                return <AddressBlock key={index} addressData={formData[row.id]} onAddressChange={handleAddressChange(row.id)} isDisabled={isDisabled} />;

                            case 'radioGroup':
                                return (
                                    <tr key={index}>
                                        <td className="table-label-column" style={{ verticalAlign: 'top' }}>
                                            <span className="label-text">{row.label}</span>
                                        </td>
                                        <td className="table-value-column" colSpan="3">
                                            {row.options.map(opt => (
                                                <div key={opt.value}>
                                                    <label style={{ display: 'flex', alignItems: 'center' }}>
                                                        <input
                                                            type="radio"
                                                            name={row.id}
                                                            value={opt.value}
                                                            checked={formData[row.id] === opt.value}
                                                            onChange={(e) => handleStateChange(row.id, e.target.value)}
                                                            disabled={isDisabled}
                                                        />
                                                        <span className="label-text" style={{ marginLeft: '5px' }}>{opt.label}</span>
                                                    </label>
                                                    {opt.revealedField && formData[row.id] === opt.value && (
                                                        <div style={{ marginLeft: '25px', marginTop: '5px', display: 'flex', alignItems: 'center' }}>
                                                            <FormField config={opt.revealedField} value={formData[opt.revealedField.id]} onChange={() => handleStateChange(opt.revealedField.id, null, 'checkbox')} />
                                                            <span className="label-text" style={{ marginLeft: '5px' }}>{opt.revealedField.label}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </td>
                                    </tr>
                                );

                            default:
                                return null;
                        }
                    })}

                    <tr><td className="tdRowspace" colSpan="4"></td></tr>
                    <tr>
                        <td className="tdButtons" colSpan="4">
                            <button type="button" onClick={hidePanel} className="!box-border h-[14px] cursor-pointer bg-purple-900 rounded-[0.15rem] border border-solid text-gray-200 text-opacity-90 font-verdana text-xs leading-none select-none no-underline blur-[0.30px] outline-1 outline-[#5f5867] border-t-[hsl(266_49%_45%)] border-l-[hsl(266_49%_45%)] border-b-purple-950 border-r-purple-950 hover:bg-[#ac9ebe] hover:border-t-[#c5bfd4] hover:border-l-[#c5bfd4] hover:border-b-[#937fa8] hover:border-r-[#937fa8] active:bg-purple-900 active:shadow-inner active:border-t-purple-950 active:border-l-purple-950 active:border-b-purple-800 active:border-r-purple-800 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),inset_0_-1px_1px_rgba(0,0,0,0.2)] px-2 items-center justify-center transition-all duration-75 text-[10px] mr-2 align-top mt-[1px]" id="sub">Close</button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
}

const previousElement = document.querySelector("#DebtorDetailsInfo");
const container = document.createElement("div");
if (previousElement) {
    previousElement.insertAdjacentElement("afterend", container);
}
const root = ReactDOM.createRoot(container);
root.render(<ApplicationForm />);