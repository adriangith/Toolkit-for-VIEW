import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom/client';

//===========================================================================
// 1. UTILITY & HELPER COMPONENTS
//===========================================================================

/**
 * A debounce function to delay execution of a function.
 * This prevents saving to storage on every single keystroke.
 * @param {Function} func The function to debounce.
 * @param {number} delay The delay in milliseconds.
 * @returns {Function} The debounced function.
 */
function debounce<T extends (...args: unknown[]) => void>(
    func: T,
    delay: number
): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout | undefined;

    return function (this: ThisParameterType<T>, ...args: Parameters<T>) {
        // Clear the previous timeout if a new call is made before the delay has passed
        if (timeoutId) {
            clearTimeout(timeoutId);
        }

        // Set a new timeout
        timeoutId = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
}


/**
 * Renders a complete block of 6 address fields.
 */
const AddressBlock = ({ addressData, onAddressChange, isDisabled = false }) => {
    const addressFields = [
        { label: 'Contact Name', id: 'contactName' }, { label: 'Organisation', id: 'organisation' },
        { label: 'Street', id: 'street' }, { label: 'Town', id: 'town' },
        { label: 'State', id: 'state' }, { label: 'Postcode', id: 'postcode' },
    ];

    return (
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
                            <div>
                                <input type="text" maxLength="100" tabIndex="41" className="textbox x"
                                    id={field2.id} value={addressData[field2.id] || ''} onChange={onAddressChange} disabled={isDisabled} />
                            </div>
                        </td>
                    </tr>
                );
            })}
        </>
    );
};

/**
 * Renders a single, generic input field based on a configuration object.
 */
const FormField = ({ config, value, onChange, isDisabled = false }) => {
    const commonProps = {
        id: config.id,
        tabIndex: "60",
        onChange: onChange,
        disabled: isDisabled,
    };

    switch (config.type) {
        case 'checkbox':
            return <input type="checkbox" {...commonProps} checked={!!value} />;
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
                { type: 'checkbox', label: '3rd Party Application:', id: 'isThirdParty' },
                { type: 'checkbox', label: 'Legal Centre:', id: 'isLegalCentre' }
            ]
        },
        {
            type: 'addressBlock',
            id: 'mainAddress',
            disabledCondition: (formData) => !formData.isThirdParty
        },
        {
            type: 'radioGroup',
            id: 'addressTo',
            label: 'Address debtor letters:',
            disabledCondition: (formData) => !formData.isThirdParty,
            options: [
                { value: '3rd Party', label: 'To the 3rd Party' },
                { value: 'Debtor', label: 'To the debtor' },
                {
                    value: 'Alt 3rd Party',
                    label: 'To an alternative 3rd Party',
                    revealedField: { type: 'checkbox', label: 'Legal Centre:', id: 'altIsLegalCentre' }
                }
            ]
        },
        {
            type: 'addressBlock',
            id: 'altAddress',
            renderCondition: (formData) => formData.addressTo === 'Alt 3rd Party',
            // THIS IS THE FIX: Added a disabled condition here as well.
            disabledCondition: (formData) => !formData.isThirdParty
        }
    ]
};

// Define the initial structure of the form's data
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

    // Effect to get the Debtor ID from the DOM when the component mounts
    useEffect(() => {
        try {
            const id = document.querySelector("#DebtorDetailsCtrl_DebtorIdSearch")?.defaultValue;
            if (id) {
                setDebtorId(id);
                console.log(`Debtor ID found: ${id}`);
            } else {
                console.warn("Could not find Debtor ID element in the DOM.");
            }
        } catch (error) {
            console.error("Error finding debtor ID:", error);
        }
    }, []);

    // Effect to LOAD data from chrome.storage when debtorId is found
    useEffect(() => {
        if (debtorId && chrome.storage && chrome.storage.local) {
            chrome.storage.local.get([debtorId], (result) => {
                if (result[debtorId]) {
                    console.log(`Loading data for debtor ${debtorId}`, result[debtorId]);
                    // Merge loaded data with initial state to prevent errors if data structure changes
                    setFormData(prevData => ({ ...prevData, ...result[debtorId] }));
                } else {
                    console.log(`No data found for debtor ${debtorId}. Using initial state.`);
                    // Reset to initial state for a new debtor
                    setFormData(initialFormData);
                }
            });
        }
    }, [debtorId]);

    // Debounced function to SAVE data to chrome.storage
    const debouncedSave = useCallback(debounce((id, data) => {
        if (id && chrome.storage && chrome.storage.local) {
            console.log(`Saving data for debtor ${id}`, data);
            chrome.storage.local.set({ [id]: data });
        }
    }, 500), []); // 500ms delay

    // Effect to trigger the debounced save when formData changes
    useEffect(() => {
        // Only save if we have a debtorId
        if (debtorId) {
            debouncedSave(debtorId, formData);
        }
    }, [formData, debtorId, debouncedSave]);

    // --- NEW: Load panel visibility from localStorage on component mount ---
    useEffect(() => {
        const savedState = localStorage.getItem(panelVisibleStorageKey);
        if (savedState !== null) {
            setIsPanelVisible(JSON.parse(savedState));
        }
    }, []);

    // --- NEW: Save panel visibility to localStorage whenever it changes ---
    useEffect(() => {
        localStorage.setItem(panelVisibleStorageKey, JSON.stringify(isPanelVisible));
    }, [isPanelVisible]);

    // --- NEW: Memoized functions to control panel visibility ---
    const togglePanel = useCallback(() => {
        setIsPanelVisible(prev => !prev);
    }, []);

    const hidePanel = useCallback(() => {
        setIsPanelVisible(false);
    }, []);

    // --- NEW: Effect to create and inject the toggle button ---
    useEffect(() => {
        const targetElement = document.querySelector("#DebtorDetailsCtrl_editDetailsButton");
        const buttonId = 'toggleApplicationOptionsBtn';
        const existingButton = document.getElementById(buttonId);

        if (targetElement && !existingButton) {
            const button = document.createElement('button');
            button.id = buttonId;
            button.type = 'button';
            button.textContent = 'Application Options';
            // Copying class list from the close button and adding a right margin
            button.className = `!box-border h-[14px] cursor-pointer bg-purple-900 rounded-[0.15rem] border border-solid text-gray-200 text-opacity-90 font-verdana text-xs leading-none select-none no-underline blur-[0.30px]
        outline-1 outline-[#5f5867]
        border-t-[hsl(266_49%_45%)] border-l-[hsl(266_49%_45%)] border-b-purple-950 border-r-purple-950
        hover:bg-[#ac9ebe] hover:border-t-[#c5bfd4] hover:border-l-[#c5bfd4] hover:border-b-[#937fa8] hover:border-r-[#937fa8]
        active:bg-purple-900 active:shadow-inner active:border-t-purple-950 active:border-l-purple-950 active:border-b-purple-800 active:border-r-purple-800
        shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),inset_0_-1px_1px_rgba(0,0,0,0.2)]
        px-2 items-center justify-center transition-all duration-75 text-[10px] mr-2
        align-top mt-[1px]`; // Added mr-2 for spacing

            button.addEventListener('click', togglePanel);
            targetElement.parentNode.insertBefore(button, targetElement);

            // Cleanup function to remove the button when the component unmounts
            return () => {
                button.removeEventListener('click', togglePanel);
                if (button.parentNode) {
                    button.parentNode.removeChild(button);
                }
            };
        }
    }, [togglePanel]); // Dependency array ensures the effect runs only when togglePanel function is created

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
        <table border="0" cellPadding="0" cellSpacing="0" className="childTable form-container" width="100%">
            <tbody>
                <tr>
                    <td>
                        <div id="DebtorAddressPanel" style={{ display: isPanelVisible ? 'inline' : 'none' }}>
                            <table cellPadding="0" cellSpacing="0" width="100%">
                                <tbody>
                                    <tr>
                                        <td className="menu-header w-1/4 py-1 px-[9px]"> Application Options </td>
                                        <td>&nbsp;</td>
                                    </tr>
                                </tbody>
                            </table>
                            <table className="bordertable">
                                <tbody>
                                    <tr><td className="tdRowspace" colSpan="4"></td></tr>

                                    {formConfig.rows.map((row, index) => {
                                        if (row.renderCondition && !row.renderCondition(formData)) {
                                            return null;
                                        }

                                        switch (row.type) {
                                            case 'fieldRow':
                                                return (
                                                    <tr key={index}>
                                                        {row.fields.map(field => (
                                                            <React.Fragment key={field.id}>
                                                                <td className="table-label-column"><span className="label-text">{field.label}</span></td>
                                                                <td className="table-value-column">
                                                                    <FormField config={field} value={formData[field.id]} onChange={() => handleStateChange(field.id, null, 'checkbox')} />
                                                                </td>
                                                            </React.Fragment>
                                                        ))}
                                                    </tr>
                                                );

                                            case 'addressBlock':
                                                const isDisabled = row.disabledCondition ? row.disabledCondition(formData) : false;
                                                return <AddressBlock key={index} addressData={formData[row.id]} onAddressChange={handleAddressChange(row.id)} isDisabled={isDisabled} />;

                                            case 'radioGroup':
                                                const isRadioDisabled = row.disabledCondition ? row.disabledCondition(formData) : false;
                                                return (
                                                    <tr key={index}>
                                                        <td className="table-label-column"><span className="label-text">{row.label}</span></td>
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
                                                                            disabled={isRadioDisabled}
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
                                            <button type="button" onClick={hidePanel} className="!box-border h-[14px] cursor-pointer bg-purple-900 rounded-[0.15rem] border border-solid text-gray-200 text-opacity-90 font-verdana text-xs leading-none select-none no-underline blur-[0.30px]
                     outline-1 outline-[#5f5867]
                     border-t-[hsl(266_49%_45%)] border-l-[hsl(266_49%_45%)] border-b-purple-950 border-r-purple-950
                     hover:bg-[#ac9ebe] hover:border-t-[#c5bfd4] hover:border-l-[#c5bfd4] hover:border-b-[#937fa8] hover:border-r-[#937fa8]
                     active:bg-purple-900 active:shadow-inner active:border-t-purple-950 active:border-l-purple-950 active:border-b-purple-800 active:border-r-purple-800
                     shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),inset_0_-1px_1px_rgba(0,0,0,0.2)]
                     px-2 items-center justify-center transition-all duration-75 text-[10px]" id="sub">Close</button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </td>
                </tr>
            </tbody>
        </table>
    );
}

const previousElement = document.querySelector("#DebtorDetailsInfo");
const container = document.createElement("div");
// Ensure the container is inserted after the previous element
if (previousElement) {
    previousElement.insertAdjacentElement("afterend", container);
}
const root = ReactDOM.createRoot(container);
root.render(<ApplicationForm />);