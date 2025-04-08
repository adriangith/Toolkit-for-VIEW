import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { saveIT } from './sharedUtils';

const DebtorAdder = () => {
    // State for form data
    const [formData, setFormData] = useState({
        thirdParty: false,
        contactName: '',
        organisation: '',
        street: '',
        town: '',
        state: '',
        postCode: '',
        to3rdParty: false,
        toTheDebtor: false,
        alt3rdParty: false,
        altName: '',
        altOrganisation: '',
        altStreet: '',
        altTown: '',
        altState: '',
        altPostCode: '',
        legalCentre: false,
        altLegalCentre: false
    });

    // State for UI control
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [progressValue, setProgressValue] = useState(0);
    const [inputsDisabled, setInputsDisabled] = useState(true);
    const progressBarRef = useRef(null);
    let bar = null;

    // Initialize bar reference after component mounts
    useEffect(() => {
        if (progressBarRef.current) {
            // Assuming ldBar is available globally
            bar = new ldBar(progressBarRef.current);
        }
    }, []);

    // Load saved form data when component mounts
    useEffect(() => {
        chrome.storage.local.get(['formPopupStatus'], function (items) {
            setIsFormVisible(items.formPopupStatus === 'block');
        });

        chrome.storage.local.get(['value'], function (items) {
            if (Object.entries(items).length !== 0 &&
                document.querySelector('html > head > title')?.textContent?.match(/Civica Debtors (.*)/)) {
                const debtorId = document.querySelector('html > head > title').textContent.match(/Civica Debtors (.*)/)[1];

                const debtorData = items.value?.find(item => item[0] === debtorId);
                if (debtorData) {
                    fillFormData(debtorData);
                } else {
                    setInputsDisabled(true);
                }
            } else {
                setInputsDisabled(true);
            }
        });

        // Listen for storage changes
        chrome.storage.onChanged.addListener(handleStorageChanges);

        return () => {
            chrome.storage.onChanged.removeListener(handleStorageChanges);
        };
    }, []);

    // Save form state on page unload
    useEffect(() => {
        const handleBeforeUnload = () => {
            if (document.querySelector('html > head > title')?.textContent?.match(/Civica Debtors (.*)/)) {
                // Uncomment to enable automatic saving
                // saveIT();
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, []);

    // Handler for storage changes
    const handleStorageChanges = (changes, namespace) => {
        if (changes.obligationsCount !== undefined) {
            chrome.storage.local.get(['obligationsCountFixed'], function (items) {
                const newValue = Math.ceil(100 - (changes.obligationsCount.newValue - 1) / items.obligationsCountFixed * 100);
                setProgressValue(newValue);
                if (bar) bar.set(newValue);

                // Update button disabled state
                const tableButton = document.getElementById("tableButton");
                const letterButton = document.getElementById("letterButton");

                if (tableButton && letterButton) {
                    const shouldDisable = changes.obligationsCount.newValue > 1;
                    tableButton.disabled = shouldDisable;
                    letterButton.disabled = shouldDisable;
                }
            });
        }
    };

    // Fill form with saved data
    const fillFormData = (value) => {
        setFormData({
            thirdParty: value[1],
            contactName: value[2],
            organisation: value[3],
            street: value[4],
            town: value[5],
            state: value[6],
            postCode: value[7],
            to3rdParty: value[8],
            toTheDebtor: value[9],
            alt3rdParty: value[10],
            altName: value[11],
            altOrganisation: value[12],
            altStreet: value[13],
            altTown: value[14],
            altState: value[15],
            altPostCode: value[16],
            legalCentre: value[17],
            altLegalCentre: value[18]
        });

        setInputsDisabled(!value[1]);
    };

    // Toggle form visibility
    const toggleForm = () => {
        const newState = !isFormVisible;
        setIsFormVisible(newState);
        chrome.storage.local.set({ 'formPopupStatus': newState ? 'block' : 'none' });
    };

    // Close form
    const closeForm = () => {
        setIsFormVisible(false);
        chrome.storage.local.set({ 'formPopupStatus': 'none' });
    };

    // Handle checkbox change
    const handleThirdPartyChange = (e) => {
        const isChecked = e.target.checked;
        setFormData(prev => ({ ...prev, thirdParty: isChecked }));
        setInputsDisabled(!isChecked);

        // If third party is checked and no address option is selected, default to to3rdParty
        if (isChecked &&
            !formData.to3rdParty &&
            !formData.toTheDebtor &&
            !formData.alt3rdParty) {
            setFormData(prev => ({ ...prev, to3rdParty: true }));
        }
    };

    // Handle input changes
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // Handle radio button changes
    const handleRadioChange = (e) => {
        const { name, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            to3rdParty: name === 'to3rdParty' ? checked : false,
            toTheDebtor: name === 'toTheDebtor' ? checked : false,
            alt3rdParty: name === 'alt3rdParty' ? checked : false
        }));
    };

    // Add bankruptcy link to sidebar
    useEffect(() => {
        const host = window.location.host.split(".")[0];
        const bankruptcyLink = document.createElement('tr');
        bankruptcyLink.innerHTML = `
      <td class="leftmenufirstcol">&nbsp; </td> 
      <td class="leftmenumiddlecol"> 
        <img src="https://${host}.view.civicacloud.com.au/Common/Images/BulletPnt.gif">&nbsp;<a href="https://${host}.view.civicacloud.com.au/Traffic/Debtors/Forms/DebtorDetails.aspx?mode=bankruptcy" accesskey="i" style="VERTICAL-ALIGN: top" target="">Bankruptcy</a>
      </td>
      <td class="leftmenulastcol">&nbsp; </td>
    `;

        const sendURL = () => {
            chrome.runtime.sendMessage({ URLHost: host }, function (response) {
                console.log(response);
            });
        };

        bankruptcyLink.querySelector("td > a").addEventListener("mouseup", sendURL);

        const sibling = document.querySelector("#dvInformation > table > tbody").children.item(9);
        document.querySelector("#dvInformation > table > tbody").insertBefore(bankruptcyLink, sibling.nextSibling);

        // Add progress indicator
        const decisionMakerCol1 = document.createElement('tr');
        decisionMakerCol1.innerHTML = `
      <tr>
        <td class="table-label-column">
          <img id="appButton" src="${chrome.runtime.getURL("Images/applicationOptions.png")}" style="float:right">
        </td>
        <td class="table-value-column">
          <div id="myItem1" data-preset="stripe"></div>
        </td>
        <td class="table-label-column">
          <span id="DebtorDetailsCtrl_lblNominationCount" class="label-text">Nomination count:</span>
        </td>
        <td class="table-value-column">
          <span id="DebtorDetailsCtrl_nominationCountTxt" class="label-text-value">2</span>
        </td>
      </tr>
    `;

        const sibling2 = document.querySelector("#DebtorDetailsCtrl_debtorDetailsPanel > table > tbody").children.item(7);
        document.querySelector("#DebtorDetailsCtrl_debtorDetailsPanel > table > tbody").insertBefore(decisionMakerCol1, sibling2.nextSibling);

        // Add event listener to app button
        document.getElementById('appButton').addEventListener("click", toggleForm);
    }, []);

    return (
        <div id="myForm" className="form-popup" style={{ display: isFormVisible ? 'block' : 'none' }}>
            <table border="0" cellPadding="0" cellSpacing="0" className="childTable" width="100%">
                <tbody>
                    <tr>
                        <td>
                            <div id="DebtorAddressPanel" style={{ display: 'inline' }}>
                                <table cellPadding="0" cellSpacing="0" width="100%">
                                    <tbody>
                                        <tr>
                                            <td>
                                                <tr>
                                                    <td className="menu-header" width="20%">&nbsp; Application Options &nbsp;</td>
                                                    <td>&nbsp;</td>
                                                </tr>
                                                <div>
                                                    <table className="bordertable">
                                                        <tbody id="radioGroup">
                                                            <tr>
                                                                <td className="tdRowspace" colSpan="9"></td>
                                                            </tr>
                                                            <tr>
                                                                <td className="table-label-column">
                                                                    <span className="label-text">3rd Party Application:</span>
                                                                </td>
                                                                <td className="table-value-column">
                                                                    <input
                                                                        tabIndex="60"
                                                                        type="checkbox"
                                                                        id="3PA"
                                                                        name="thirdParty"
                                                                        checked={formData.thirdParty}
                                                                        onChange={handleThirdPartyChange}
                                                                    />
                                                                </td>
                                                                <td className="table-label-column">
                                                                    <span className="label-text">Legal Centre:</span>
                                                                </td>
                                                                <td className="table-value-column">
                                                                    <input
                                                                        tabIndex="60"
                                                                        type="checkbox"
                                                                        id="3LC"
                                                                        name="legalCentre"
                                                                        checked={formData.legalCentre}
                                                                        onChange={handleInputChange}
                                                                        disabled={inputsDisabled}
                                                                    />
                                                                </td>
                                                            </tr>
                                                            <tr>
                                                                <td className="table-label-column">
                                                                    <span className="label-text">Contact Name:</span>
                                                                </td>
                                                                <td className="table-value-column">
                                                                    <input
                                                                        type="text"
                                                                        maxLength="100"
                                                                        tabIndex="41"
                                                                        className="textbox x"
                                                                        name="contactName"
                                                                        id="Name"
                                                                        value={formData.contactName}
                                                                        onChange={handleInputChange}
                                                                        disabled={inputsDisabled}
                                                                    />
                                                                </td>
                                                                <td className="table-label-column">
                                                                    <span className="label-text">Organisation:</span>
                                                                </td>
                                                                <td className="table-value-column">
                                                                    <div id="DebtorAddressCtrl_sourceCatalogueField">
                                                                        <input
                                                                            type="text"
                                                                            maxLength="100"
                                                                            tabIndex="41"
                                                                            className="textbox x"
                                                                            name="organisation"
                                                                            id="Organisation"
                                                                            value={formData.organisation}
                                                                            onChange={handleInputChange}
                                                                            disabled={inputsDisabled}
                                                                        />
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                            <tr>
                                                                <td className="table-label-column">
                                                                    <span className="label-text">Street:</span>
                                                                </td>
                                                                <td className="table-value-column">
                                                                    <input
                                                                        type="text"
                                                                        maxLength="100"
                                                                        tabIndex="41"
                                                                        className="textbox x"
                                                                        name="street"
                                                                        id="Street"
                                                                        value={formData.street}
                                                                        onChange={handleInputChange}
                                                                        disabled={inputsDisabled}
                                                                    />
                                                                </td>
                                                                <td className="table-label-column">
                                                                    <span className="label-text">Town:</span>
                                                                </td>
                                                                <td className="table-value-column">
                                                                    <div>
                                                                        <input
                                                                            type="text"
                                                                            maxLength="100"
                                                                            tabIndex="41"
                                                                            className="textbox x"
                                                                            name="town"
                                                                            id="Town"
                                                                            value={formData.town}
                                                                            onChange={handleInputChange}
                                                                            disabled={inputsDisabled}
                                                                        />
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                            <tr>
                                                                <td className="table-label-column">
                                                                    <span className="label-text">State:</span>
                                                                </td>
                                                                <td className="table-value-column">
                                                                    <input
                                                                        type="text"
                                                                        maxLength="100"
                                                                        tabIndex="41"
                                                                        className="textbox x"
                                                                        name="state"
                                                                        id="State"
                                                                        value={formData.state}
                                                                        onChange={handleInputChange}
                                                                        disabled={inputsDisabled}
                                                                    />
                                                                </td>
                                                                <td className="table-label-column">
                                                                    <span className="label-text">Postcode:</span>
                                                                </td>
                                                                <td className="table-value-column">
                                                                    <input
                                                                        type="text"
                                                                        maxLength="100"
                                                                        tabIndex="41"
                                                                        className="textbox x"
                                                                        name="postCode"
                                                                        id="PostCode"
                                                                        value={formData.postCode}
                                                                        onChange={handleInputChange}
                                                                        disabled={inputsDisabled}
                                                                    />
                                                                </td>
                                                            </tr>
                                                            <tr>
                                                                <td className="table-label-column" style={{ minHeight: '8px' }}>
                                                                    <span className="label-text">Address debtor letters:</span>
                                                                </td>
                                                                <td className="table-value-column" colSpan="9" style={{ minHeight: '8px' }}>
                                                                    <label>
                                                                        <input
                                                                            id="to3rdParty"
                                                                            className="textbox x"
                                                                            name="to3rdParty"
                                                                            style={{ verticalAlign: 'middle', height: '13px' }}
                                                                            tabIndex="60"
                                                                            type="radio"
                                                                            checked={formData.to3rdParty}
                                                                            onChange={handleRadioChange}
                                                                            disabled={inputsDisabled}
                                                                        />
                                                                        <span className="label-text">To the 3rd Party</span>
                                                                    </label>
                                                                </td>
                                                            </tr>
                                                            <tr>
                                                                <td className="table-label-column" style={{ minHeight: '8px' }}></td>
                                                                <td className="table-value-column" colSpan="9" style={{ minHeight: '8px' }}>
                                                                    <label>
                                                                        <input
                                                                            id="toTheDebtor"
                                                                            className="textbox x"
                                                                            name="toTheDebtor"
                                                                            style={{ verticalAlign: 'middle', height: '13px' }}
                                                                            tabIndex="60"
                                                                            type="radio"
                                                                            checked={formData.toTheDebtor}
                                                                            onChange={handleRadioChange}
                                                                            disabled={inputsDisabled}
                                                                        />
                                                                        <span className="label-text">To the debtor</span>
                                                                    </label>
                                                                </td>
                                                            </tr>
                                                            <tr style={{ minHeight: '0px' }}>
                                                                <td className="table-label-column" style={{ minHeight: '0px' }}></td>
                                                                <td className="table-value-column" style={{ minHeight: '0px' }}>
                                                                    <label>
                                                                        <input
                                                                            id="Alt3rdParty"
                                                                            className="textbox x"
                                                                            name="alt3rdParty"
                                                                            style={{ verticalAlign: 'middle', height: '13px', minHeight: '0px' }}
                                                                            tabIndex="60"
                                                                            type="radio"
                                                                            checked={formData.alt3rdParty}
                                                                            onChange={handleRadioChange}
                                                                            disabled={inputsDisabled}
                                                                        />
                                                                        <span className="label-text">To an alternative 3rd Party</span>
                                                                    </label>
                                                                </td>
                                                                <td className="table-label-column" style={{ minHeight: '0px' }}>
                                                                    <span
                                                                        className="label-text Hidable"
                                                                        style={{
                                                                            minHeight: '0px',
                                                                            verticalAlign: 'middle',
                                                                            display: formData.alt3rdParty ? 'inline' : 'none'
                                                                        }}
                                                                    >
                                                                        Legal Centre:
                                                                    </span>
                                                                </td>
                                                                <td className="table-value-column" style={{ minHeight: '0px' }}>
                                                                    <input
                                                                        className="Hidable"
                                                                        tabIndex="60"
                                                                        style={{
                                                                            minHeight: '0px',
                                                                            display: formData.alt3rdParty ? 'inline' : 'none'
                                                                        }}
                                                                        type="checkbox"
                                                                        id="Alt3LC"
                                                                        name="altLegalCentre"
                                                                        checked={formData.altLegalCentre}
                                                                        onChange={handleInputChange}
                                                                        disabled={inputsDisabled}
                                                                    />
                                                                </td>
                                                            </tr>
                                                            {/* Alternative 3rd Party fields - shown conditionally */}
                                                            <tr className="Hidable" style={{ display: formData.alt3rdParty ? '' : 'none' }}>
                                                                <td className="table-label-column">
                                                                    <span className="label-text">Contact Name:</span>
                                                                </td>
                                                                <td className="table-value-column">
                                                                    <input
                                                                        type="text"
                                                                        maxLength="100"
                                                                        tabIndex="41"
                                                                        className="textbox x"
                                                                        name="altName"
                                                                        id="AltName"
                                                                        value={formData.altName}
                                                                        onChange={handleInputChange}
                                                                        disabled={inputsDisabled}
                                                                    />
                                                                </td>
                                                                <td className="table-label-column">
                                                                    <span className="label-text">Organisation:</span>
                                                                </td>
                                                                <td className="table-value-column">
                                                                    <div id="DebtorAddressCtrl_sourceCatalogueField">
                                                                        <input
                                                                            type="text"
                                                                            maxLength="100"
                                                                            tabIndex="41"
                                                                            className="textbox x"
                                                                            name="altOrganisation"
                                                                            id="AltOrganisation"
                                                                            value={formData.altOrganisation}
                                                                            onChange={handleInputChange}
                                                                            disabled={inputsDisabled}
                                                                        />
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                            <tr className="Hidable" style={{ display: formData.alt3rdParty ? '' : 'none' }}>
                                                                <td className="table-label-column">
                                                                    <span className="label-text">Street:</span>
                                                                </td>
                                                                <td className="table-value-column">
                                                                    <input
                                                                        type="text"
                                                                        maxLength="100"
                                                                        tabIndex="41"
                                                                        className="textbox x"
                                                                        name="altStreet"
                                                                        id="AltStreet"
                                                                        value={formData.altStreet}
                                                                        onChange={handleInputChange}
                                                                        disabled={inputsDisabled}
                                                                    />
                                                                </td>
                                                                <td className="table-label-column">
                                                                    <span className="label-text">Town:</span>
                                                                </td>
                                                                <td className="table-value-column">
                                                                    <div>
                                                                        <input
                                                                            type="text"
                                                                            maxLength="100"
                                                                            tabIndex="41"
                                                                            className="textbox x"
                                                                            name="altTown"
                                                                            id="AltTown"
                                                                            value={formData.altTown}
                                                                            onChange={handleInputChange}
                                                                            disabled={inputsDisabled}
                                                                        />
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                            <tr className="Hidable" style={{ display: formData.alt3rdParty ? '' : 'none' }}>
                                                                <td className="table-label-column">
                                                                    <span className="label-text">State:</span>
                                                                </td>
                                                                <td className="table-value-column">
                                                                    <input
                                                                        type="text"
                                                                        maxLength="100"
                                                                        tabIndex="41"
                                                                        className="textbox x"
                                                                        name="altState"
                                                                        id="AltState"
                                                                        value={formData.altState}
                                                                        onChange={handleInputChange}
                                                                        disabled={inputsDisabled}
                                                                    />
                                                                </td>
                                                                <td className="table-label-column">
                                                                    <span className="label-text">Postcode:</span>
                                                                </td>
                                                                <td className="table-value-column">
                                                                    <input
                                                                        type="text"
                                                                        maxLength="100"
                                                                        tabIndex="41"
                                                                        className="textbox x"
                                                                        name="altPostCode"
                                                                        id="AltPostCode"
                                                                        value={formData.altPostCode}
                                                                        onChange={handleInputChange}
                                                                        disabled={inputsDisabled}
                                                                    />
                                                                </td>
                                                            </tr>
                                                            <tr>
                                                                <td className="tdRowspace" colSpan="9"></td>
                                                            </tr>
                                                            <tr>
                                                                <td className="tdButtons" colSpan="9">
                                                                    <button
                                                                        type="button"
                                                                        className="btn cancel"
                                                                        id="sub"
                                                                        onClick={closeForm}
                                                                    >
                                                                        Close
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
            <div ref={progressBarRef} id="myItem1" data-preset="stripe" style={{ display: 'none' }}></div>
        </div>
    );
};

// Main entry point - find the container and render the React component
const initializeDebtorAdder = () => {
    const referenceNode = document.querySelector('#DebtorInfo') || document.querySelector('#DebtorDetailsInfo');
    if (!referenceNode) return;

    // Create container for React component
    const container = document.createElement('div');
    container.id = 'debtorAdderContainer';
    referenceNode.after(container);

    // Render React component
    ReactDOM.render(<DebtorAdder />, container);
};

// Run initialization when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initializeDebtorAdder);

export default DebtorAdder;