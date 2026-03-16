import React, { HTMLProps, useState, useEffect, useRef, useMemo, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import { createPortal } from 'react-dom';
import { attributesToProps } from 'html-react-parser';
// @ts-expect-error - CSS import
import '../css/External/initial.css';
import { initialiseWorkbookProcesser } from './xlsxConverter';
import { BulkAction, DataFieldArray, DebtorSummaryObligationTable, FieldSetSheetRecord, Message, backgroundData, MasterFieldDefinition, XlSXExportColumnDefinition } from './types';
import { handleSelectActionable, handleSelectEnforcementReview, handleSelectFVSHolds, handleSelectPAHolds } from './select';
import { defaultTargetFields, CONFIG_WORKBOOK_URL, fieldsForXLSXexport, allDataFields } from './config';
import {
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    useReactTable,
    Table,
    HeaderGroup,
    Header,
    Row,
    Cell,
    ColumnSizingState,
    ColumnOrderState,
    RowSelectionState,
    OnChangeFn,
} from '@tanstack/react-table';

/** Current environment, 'djr' for production. */
const VIEWEnvironment = window.location.hostname.split('.')[0].toLowerCase();

import { Input, VIEWDebtorSummaryObligation, TemplateSheetRecord, Button, RadioButton, DropDown, SplitButton } from './types';
import { movePagerControl } from './utils';

/**
 * Utility to send chrome messages with error handling.
 * Prevents silent fails when extension context is invalidated.
 */
function sendExtensionMessage<T = unknown>(message: Message | unknown): Promise<T> {
    return new Promise((resolve, reject) => {
        try {
            if (!chrome.runtime?.id) {
                return reject(new Error("Extension context invalidated. Please refresh the page."));
            }
            chrome.runtime.sendMessage(message, (response) => {
                if (chrome.runtime.lastError) {
                    return reject(new Error(chrome.runtime.lastError.message));
                }
                resolve(response);
            });
        } catch (err) {
            reject(err);
        }
    });
}


const selectionButtons: Button[] = [
    { name: "select_fvs_holds", type: "button", description: "Select all FVS Pending holds", text: "Select FVSPEND", onClick: handleSelectFVSHolds },
    { name: "select_p_a_holds", type: "button", description: "Select all PA Holds", text: "Select PA", onClick: handleSelectPAHolds },
    { name: "select_enforcement_review", type: "button", description: "Select all Enforcement Review", text: "Select Enf Review", onClick: handleSelectEnforcementReview },
    { name: "select_applicable", type: "button", description: "Select all Actionable", text: "Select Actionable", onClick: handleSelectActionable },
];

/**
 * Parses an HTML table element and extracts data into an array of VIEWDebtorSummaryObligation records.
 */
function parseHTMLTableElem(tableEl: HTMLElement | null): VIEWDebtorSummaryObligation[] {
    if (!tableEl) {
        console.error("Table element is null");
        return [];
    }

    if (!(tableEl instanceof HTMLTableElement)) {
        console.error("Element is not a table");
        return [];
    }

    const headerCells = Array.from(tableEl.querySelectorAll('thead th'));
    const columns = headerCells.map(th => {
        const idParts = th.id.split("HeaderCell");
        return idParts.length > 1 ? idParts[1] : th.id;
    });

    const rows = tableEl.querySelectorAll('tbody > tr');
    return Array.from(rows).map(row => {
        const cells = Array.from(row.querySelectorAll('td'));
        return columns.reduce<VIEWDebtorSummaryObligation>((obj, col, idx) => {
            if (cells[idx]) {
                obj[col as keyof VIEWDebtorSummaryObligation] = cells[idx].textContent?.trim() || '';
                if (col === 'ContraventionCode') {
                    (obj as Record<string, unknown>)['offence_description'] = cells[idx].getAttribute('title')?.trim() || '';
                }
                if (col === 'InfringementNo') {
                    (obj as Record<string, unknown>)['infringement_number'] = cells[idx].textContent?.trim() || '';
                }
            } else {
                obj[col as keyof VIEWDebtorSummaryObligation] = '';
            }
            return obj;
        }, {} as VIEWDebtorSummaryObligation);
    });
}

function getParentElement(element: HTMLElement | null): HTMLElement {
    if (!element) throw new Error("Element is null");
    if (!element.parentElement) throw new Error("Element has no parent");
    return element.parentElement;
}

interface PostBackForm extends HTMLFormElement {
    __EVENTTARGET: HTMLInputElement;
    __EVENTARGUMENT: HTMLInputElement;
}

function __doPostBack(eventTarget: string, eventArgument: string) {
    const theForm = document.forms[0] as PostBackForm;

    if (!theForm) {
        console.error("Form not found for __doPostBack");
        return;
    }

    if (!theForm.__EVENTTARGET) {
        const eventTargetField = document.createElement('input');
        eventTargetField.type = 'hidden';
        eventTargetField.name = '__EVENTTARGET';
        theForm.appendChild(eventTargetField);
        theForm.__EVENTTARGET = eventTargetField;
    }
    if (!theForm.__EVENTARGUMENT) {
        const eventArgumentField = document.createElement('input');
        eventArgumentField.type = 'hidden';
        eventArgumentField.name = '__EVENTARGUMENT';
        theForm.appendChild(eventArgumentField);
        theForm.__EVENTARGUMENT = eventArgumentField;
    }

    // Fixed: Passed a SubmitEvent instead of a generic Event to satisfy TypeScript requirements
    if (!theForm.onsubmit || (theForm.onsubmit && theForm.onsubmit(new SubmitEvent('submit')) !== false)) {
        theForm.__EVENTTARGET.value = eventTarget;
        theForm.__EVENTARGUMENT.value = eventArgument;
        theForm.submit();
    }
}

function cleanProps(attribs: Record<string, string> | undefined): React.HTMLAttributes<HTMLElement> {
    const newAttribs = { ...attribs };

    if (newAttribs && newAttribs.onmouseover) delete newAttribs.onmouseover;
    if (newAttribs && newAttribs.onmouseout) delete newAttribs.onmouseout;

    // Convert legacy bgcolor attribute to inline style if present
    const props = attributesToProps(newAttribs || {}) as React.HTMLAttributes<HTMLElement>;
    if (newAttribs && newAttribs.bgcolor) {
        props.style = {
            ...(props.style || {}),
            backgroundColor: newAttribs.bgcolor
        };
    }

    if (!newAttribs || !newAttribs.onclick) {
        return props;
    }

    const onclickValue = newAttribs.onclick;
    delete props.onClick;

    const match = onclickValue.match(/__doPostBack\('([^']*)',\s*'([^']*)'\)/);
    if (match && match[1] && match[2]) {
        const eventTarget = match[1];
        const eventArgument = match[2];
        let startX = 0;
        let startY = 0;
        const clickThreshold = 5;
        props.onMouseDown = (e: React.MouseEvent) => {
            startX = e.pageX;
            startY = e.pageY;
        }

        props.onMouseUp = (e: React.MouseEvent) => {
            const deltaX = Math.abs(e.pageX - startX);
            const deltaY = Math.abs(e.pageY - startY);
            const selection = window.getSelection()?.toString() || '';

            if (selection.length === 0 && deltaX < clickThreshold && deltaY < clickThreshold) {
                __doPostBack(eventTarget, eventArgument);
            }
        }
    }
    return props;
}

let workbook = initialiseWorkbookProcesser(
    CONFIG_WORKBOOK_URL
);

async function bulkAction({ subType, table }: { subType: BulkAction['subType'], table: Table<VIEWDebtorSummaryObligation> }) {
    if (table.getSelectedRowModel().rows.length === 0) {
        alert('You need to select at least one obligation');
        return;
    }

    try {
        const selectedRows = table.getSelectedRowModel().rows.map(row => row.original);
        await sendExtensionMessage({
            type: 'bulkAction',
            data: {
                obligations: selectedRows,
                VIEWEnvironment: VIEWEnvironment || 'djr',
                subType
            },
        });
    } catch (error: unknown) {
        console.error("Bulk Action Error:", error);
        alert(`Action Failed: ${error instanceof Error ? error.message : String(error)}`);
    }
}

async function handleBulkNotes(_: string | null, table: Table<VIEWDebtorSummaryObligation>) {
    await bulkAction({ subType: "Bulk Notes Update", table });
}
async function handleBulkWriteoff(_: string | null, table: Table<VIEWDebtorSummaryObligation>) {
    await bulkAction({ subType: "Bulk Writeoff Update", table });
}
async function handleBulkHold(_: string | null, table: Table<VIEWDebtorSummaryObligation>) {
    await bulkAction({ subType: "Bulk Hold Update", table });
}

async function handleGenerateLetter(selectedOption: string | null, table: Table<VIEWDebtorSummaryObligation>) {
    if (table.getSelectedRowModel().rows.length === 0) {
        alert('You need to select at least one obligation');
        return;
    }

    if (!selectedOption) {
        alert('No option selected');
        return;
    }

    try {
        const wb = await workbook;
        const optionSheetData = await wb.fetchAndProcessOptions("Options");
        const selectedOptionData = optionSheetData.find(option => option.description === selectedOption);

        if (!selectedOptionData) {
            throw new Error(`Configuration Error: Could not find template mapping for "${selectedOption}".`);
        }

        const templateSheetData = await wb.fetchAndConvertXlsxToJson<TemplateSheetRecord>({ Sheet: "Templates" });
        const fieldSetSheetData = await wb.fetchAndConvertXlsxToJson<FieldSetSheetRecord>({ Sheet: "FieldSets" });

        const selectedTemplates = templateSheetData.filter(template =>
            selectedOptionData.letters.includes(template.Correspondence)
        );

        if (selectedTemplates.length === 0) {
            alert('No templates configured for the selected option.');
            workbook = initialiseWorkbookProcesser(CONFIG_WORKBOOK_URL);
            return;
        }

        const targetFields = getTemplateFields(selectedTemplates, fieldSetSheetData);
        if (process.env.IS_DEV) console.log("DEBUG: Target Fields sent to scraper:", targetFields);
        const selectedRows = table.getSelectedRowModel().rows.map(row => row.original);

        const debtorId = (document.querySelector("#DebtorDetailsCtrl_DebtorIdSearch") as HTMLInputElement)?.defaultValue;

        const response = await sendExtensionMessage<backgroundData>({
            type: 'generateCorrespondence',
            data: {
                obligations: selectedRows,
                VIEWEnvironment: VIEWEnvironment || 'djr',
                documentTemplateProperties: selectedTemplates,
                targetFields: targetFields,
                debtorId: debtorId
            },
        });

        if (response?.response === 'Failed to fetch') {
            workbook = initialiseWorkbookProcesser(CONFIG_WORKBOOK_URL);
            alert('Unable to fetch the template. Template may be configured incorrectly.');
            return;
        }

        if (response?.response === 'Scraper is already active.') {
            alert('Scraper is already active.');
            return;
        }

        if (typeof response?.response === 'string' && response.response.includes('File is not a Word or email template')) {
            alert('Unable to access the selected template(s). Please check your SharePoint access.');
            return;
        }

        if (typeof response?.response === 'string' && response.response.startsWith('Fatal Error')) {
            throw new Error(response.response);
        }

        if (typeof response?.response === 'string') {
            throw new Error(response.response);
        }

    } catch (error: unknown) {
        console.error("Letter Generation Error:", error);
        alert(`Letter Generation Failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    function getTemplateFields(selectedTemplates: TemplateSheetRecord[], fieldSetSheetData: FieldSetSheetRecord[]): DataFieldArray {
        const allTokens = new Set<string>();

        selectedTemplates.forEach(template => {
            const fieldSetString = template.FieldSet;
            if (!fieldSetString || fieldSetString.trim() === '') {
                allTokens.add("Default");
            } else {
                fieldSetString.split(/\s+/).forEach(token => {
                    if (token.trim()) allTokens.add(token.trim());
                });
            }
        });

        const resolvedFields = new Set<string>();

        allTokens.forEach(token => {
            if (token === "Default") {
                defaultTargetFields.forEach(f => resolvedFields.add(f));
            } else {
                const fieldSetRecord = fieldSetSheetData.find(fs => fs.FieldSet === token);
                if (fieldSetRecord) {
                    fieldSetRecord.Fields.split(/\s+/).forEach(f => {
                        if (f.trim()) resolvedFields.add(f.trim());
                    });
                } else {
                    resolvedFields.add(token);
                }
            }
        });

        // Always include UserID and debtor_id as they are critical for system function
        const criticalFields = ["UserID", "debtor_id", "Obligation", "name", "dt", "Debtor_ID"];
        criticalFields.forEach(f => resolvedFields.add(f));

        return Array.from(resolvedFields) as DataFieldArray;
    }
}

function measureColumnWidth(columnId: string): number {
    const headerCell = document.getElementById(`DebtorNoticesCtrl_DebtorNoticesTable_HeaderCell${columnId}`);
    if (!headerCell) return 150;
    return headerCell.getBoundingClientRect().width;
}

function getInitialColumnSizing(columnsToSize: Array<{ id: string }>): ColumnSizingState {
    return columnsToSize.reduce<ColumnSizingState>((acc, column) => {
        acc[column.id] = column.id === 'select' ? 40 : measureColumnWidth(column.id);
        return acc;
    }, {});
}

const getTemplateOptions = async (): Promise<string[]> => {
    try {
        const wb = await workbook;
        const dropDownOptions = await wb.fetchAndProcessOptions("Options");
        return dropDownOptions.map(option => option.description);
    } catch (error: unknown) {
        console.error("Dropdown Fetch Error:", error);
        workbook = initialiseWorkbookProcesser(CONFIG_WORKBOOK_URL);
        if (error instanceof Error && (error.message.includes("CORS") || error.message.includes("401"))) {
            alert("SharePoint session expired. Please log in and refresh.");
        } else {
            alert("Unable to load correspondence options. Please try refreshing the page or contact support if the issue persists.");
        }
        return [];
    }
};

const columnHelper = createColumnHelper<VIEWDebtorSummaryObligation>();

const dataColumns = [
    columnHelper.accessor('NoticeNumber', { header: () => 'Notice Number', id: 'NoticeNumber', enableResizing: true }),
    columnHelper.accessor('InfringementNo', { header: () => 'Infringement No.', id: 'InfringementNo', enableResizing: true }),
    columnHelper.accessor('NoticeType', { header: () => 'Input Type', id: 'NoticeType', enableResizing: true }),
    columnHelper.accessor('OffenceDate', { header: () => 'Offence Date', id: 'OffenceDate', enableResizing: true }),
    columnHelper.accessor('Issued', { header: () => 'Issued', id: 'Issued', enableResizing: true }),
    columnHelper.accessor('BalanceOutstanding', { header: () => 'Balance Outstanding', id: 'BalanceOutstanding', enableResizing: true }),
    columnHelper.accessor('NoticeStatus', { header: () => 'Notice Status/Previous Status', id: 'NoticeStatus', enableResizing: true }),
    columnHelper.accessor('ContraventionCode', { header: () => 'Offence', id: 'ContraventionCode', enableResizing: true }),
    columnHelper.accessor('HoldCodeEndDate', { header: () => 'Hold Code-End Date', id: 'HoldCodeEndDate', enableResizing: true }),
    columnHelper.accessor('EOTCount', { header: () => 'EOT Count', id: 'EOTCount', enableResizing: true }),
    columnHelper.accessor('CurrentChallengeLogged', { header: () => 'Current Challenge Logged?', id: 'CurrentChallengeLogged', enableResizing: true }),
    columnHelper.accessor('VRM', { header: () => 'VRM', id: 'VRM', enableResizing: true }),
    columnHelper.accessor('DueDate', { header: () => 'Due Date', id: 'DueDate', enableResizing: true }),
    columnHelper.accessor('EnforcementActionIds', { header: () => 'Enforcement Action Id(s)', id: 'EnforcementActionIds', enableResizing: true }),
    columnHelper.accessor('KeyActiveWarrantExecutionActions', { header: () => 'Key Active Warrant Execution Actions', id: 'KeyActiveWarrantExecutionActions', enableResizing: true }),
    columnHelper.accessor('RecentDEBTDVSANCholds', { header: () => 'Recent DEBT DVSAN Cholds', id: 'RecentDEBTDVSANCholds', enableResizing: true })
];

let lastSelectedOption: string | null = null;
if (typeof localStorage !== 'undefined') {
    lastSelectedOption = localStorage.getItem("selectedOption");
}

const ButtonComponent = ({ button, selectedOption, table }: { button: Button, selectedOption: string | null, table: Table<VIEWDebtorSummaryObligation> }) => {
    return (
        <button
            className="!box-border h-[14px] cursor-pointer bg-purple-900 rounded-[0.15rem] border border-solid text-gray-200 text-opacity-90 font-verdana text-xs leading-none select-none no-underline blur-[0.30px] outline-1 outline-[#5f5867] border-t-[hsl(266_49%_45%)] border-l-[hsl(266_49%_45%)] border-b-purple-950 border-r-purple-950 hover:bg-[#ac9ebe] hover:border-t-[#c5bfd4] hover:border-l-[#c5bfd4] hover:border-b-[#937fa8] hover:border-r-[#937fa8] active:bg-purple-900 active:shadow-inner active:border-t-purple-950 active:border-l-purple-950 active:border-b-purple-800 active:border-r-purple-800 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),inset_0_-1px_1px_rgba(0,0,0,0.2)] px-2 flex items-center justify-center transition-all duration-75 text-[10px] disabled:opacity-50"
            type={button.type as "button" | "submit" | "reset" | undefined}
            {...button.attributes}
            onClick={() => button.onClick && button.onClick(selectedOption, table)}
            disabled={button.name === "generate_letter" && !selectedOption}
        >
            <span className="relative -top-[0px]">{button.text || button.name}</span>
        </button>
    );
}

const SplitButtonComponent = ({ splitButton, selectedOption, table }: { splitButton: SplitButton, selectedOption: string | null, table: Table<VIEWDebtorSummaryObligation> }) => {
    return (
        <div className="flex flex-row">
            {splitButton.buttons.map((button, index) => {
                const isFirst = index === 0;
                const isLast = index === splitButton.buttons.length - 1;
                const isGear = button.name === 'configure_export';

                const commonClass = "!box-border h-[14px] cursor-pointer border border-solid text-gray-200 text-opacity-90 font-verdana text-xs leading-none select-none no-underline blur-[0.30px] outline-1 outline-[#5f5867] shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),inset_0_-1px_1px_rgba(0,0,0,0.2)] flex items-center justify-center transition-all duration-75 text-[10px] disabled:opacity-50";
                const purpleClass = "bg-purple-900 border-t-[hsl(266_49%_45%)] border-l-[hsl(266_49%_45%)] border-b-purple-950 border-r-purple-950 hover:bg-[#ac9ebe] hover:border-t-[#c5bfd4] hover:border-l-[#c5bfd4] hover:border-b-[#937fa8] hover:border-r-[#937fa8] active:bg-purple-900 active:shadow-inner active:border-t-purple-950 active:border-l-purple-950 active:border-b-purple-800 active:border-r-purple-800 px-2";
                const orangeClass = "bg-orange-700 border-t-orange-500 border-l-orange-500 border-b-orange-900 border-r-orange-900 hover:bg-orange-600 hover:border-t-orange-400 hover:border-l-orange-400 hover:border-b-orange-800 hover:border-r-orange-800 active:bg-orange-800 active:shadow-inner active:border-t-orange-950 active:border-l-orange-950 active:border-b-orange-900 active:border-r-orange-900 px-1";

                let styleClass = "";
                if (isFirst) styleClass = "rounded-l-[0.15rem] border-r-0";
                else if (isLast) styleClass = "rounded-r-[0.15rem]";
                else styleClass = "border-r-0";

                return (
                    <button key={index} className={`${commonClass} ${isGear ? orangeClass : purpleClass} ${styleClass}`} type={button.type as "button" | "submit" | "reset" | undefined} {...button.attributes} onClick={() => button.onClick && button.onClick(selectedOption, table)} disabled={button.name === "generate_letter" && !selectedOption}>
                        <span className="relative -top-[0px]">{button.text || button.name}</span>
                    </button>
                );
            })}
        </div>
    );
};

const RadioButtonComponent = ({ radioButton }: { radioButton: RadioButton }) => (
    <div className="mr-2">
        <input type="radio" name={radioButton.name} value={radioButton.value} {...radioButton.attributes} id={radioButton.name + radioButton.value} />
        <label htmlFor={radioButton.name + radioButton.value} className="ml-1 text-[10px]">{radioButton.description}</label>
    </div>
);

const DropDownComponent = ({ dropdown, onChange, initialSelectedOption }: { dropdown: DropDown; onChange: (option: string) => void; initialSelectedOption: string | null }) => {
    const [options, setOptions] = useState<string[]>([]);
    const [currentValue, setCurrentValue] = useState<string>(initialSelectedOption || '');

    useEffect(() => {
        const fetchOptions = async () => {
            let fetchedOptions: string[] = [];
            if (typeof dropdown.options === 'string' && dropdown.options === "getTemplateOptions") {
                fetchedOptions = await getTemplateOptions();
            } else if (Array.isArray(dropdown.options)) {
                fetchedOptions = dropdown.options;
            }

            setOptions(fetchedOptions);
            if (fetchedOptions.length > 0) {
                const defaultVal = initialSelectedOption && fetchedOptions.includes(initialSelectedOption) ? initialSelectedOption : fetchedOptions[0];
                setCurrentValue(defaultVal);
                onChange(defaultVal);
            }
        };
        fetchOptions();
    }, [dropdown.options, initialSelectedOption, onChange]);

    return (
        <select {...dropdown.attributes} value={currentValue} onChange={(e) => { setCurrentValue(e.target.value); onChange(e.target.value); }} className="listitem text-[10px]">
            {options.map((option, index) => <option key={index} value={option}>{option}</option>)}
        </select>
    );
}

const ButtonGroup: React.FC<{ buttons: Input[]; table: Table<VIEWDebtorSummaryObligation>; }> = ({ buttons, table }) => {
    const [selectedOption, setSelectedOption] = useState<string>(lastSelectedOption || "");
    const handleDropdownChange = useCallback((option: string) => {
        if (typeof localStorage !== 'undefined') localStorage.setItem("selectedOption", option);
        setSelectedOption(option);
    }, []);
    return (
        <div className="flex flex-row justify-start items-center space-x-2 p-2 bg-gray-100 rounded">
            {buttons.map((button, index) => {
                if (button.type === "button") return <ButtonComponent key={index} button={button as Button} selectedOption={selectedOption} table={table} />;
                if (button.type === "split_button") return <SplitButtonComponent key={index} splitButton={button as SplitButton} selectedOption={selectedOption} table={table} />;
                if (button.type === "dropdown") return <DropDownComponent key={index} dropdown={button as DropDown} onChange={handleDropdownChange} initialSelectedOption={selectedOption} />;
                if (button.type === "radio") return <RadioButtonComponent key={index} radioButton={button as RadioButton} />;
                return null;
            })}
        </div>
    );
}

function IndeterminateCheckbox({ indeterminate, className = '', style, ...rest }: { indeterminate?: boolean } & HTMLProps<HTMLInputElement>) {
    const ref = useRef<HTMLInputElement>(null!);
    useEffect(() => {
        if (typeof indeterminate === 'boolean') ref.current.indeterminate = !rest.checked && indeterminate;
    }, [ref, indeterminate, rest.checked]);
    return (
        <div
            className="flex items-center justify-center w-full h-full"
            onMouseDown={(e) => e.stopPropagation()}
            onMouseUp={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            style={style}
        >
            <input type="checkbox" ref={ref} className={className + ' cursor-pointer'} {...rest} />
        </div>
    );
}

function getAttributes(element: Element): Record<string, string> {
    const attrs: Record<string, string> = {};
    if (element.hasAttributes()) {
        for (let i = 0; i < element.attributes.length; i++) {
            const attr = element.attributes[i];
            attrs[attr.name] = attr.value;
        }
    }
    return attrs;
}

function extractTableStyles(tableEl: HTMLElement) {
    const tableProps = getAttributes(tableEl);
    const thead = tableEl.querySelector('thead');
    const theadProps = thead ? getAttributes(thead) : {};
    const theadTr = thead ? thead.querySelector('tr') : null;
    const theadRowProps = theadTr ? getAttributes(theadTr) : {};

    const headerCells = Array.from(tableEl.querySelectorAll('thead th'));
    const headerProps = headerCells.map(th => getAttributes(th));

    const tbody = tableEl.querySelector('tbody');
    const tbodyProps = tbody ? getAttributes(tbody) : {};

    const rows = Array.from(tableEl.querySelectorAll('tbody > tr'));
    const rowStyles = rows.map(row => {
        const cells = Array.from(row.querySelectorAll('td'));
        return {
            props: getAttributes(row),
            cellProps: cells.map(cell => getAttributes(cell))
        };
    });

    return { tableProps, theadProps, theadRowProps, tbodyProps, headerProps, rowStyles };
}

function getCaseRefMap(): Record<string, string> {
    const map: Record<string, string> = {};
    const courtTable = document.getElementById('DebtorCourtOrdersCtrl_DebtorCourtFinesTable_tblData');
    if (!courtTable) return map;

    const rows = courtTable.querySelectorAll('tbody > tr');
    rows.forEach(row => {
        const noticeCell = row.querySelector('td[id$="NoticeNumber"]');
        const caseRefCell = row.querySelector('td[id$="CaseRef"]');

        if (noticeCell && caseRefCell) {
            const noticeNumber = noticeCell.textContent?.trim();
            const caseRef = caseRefCell.textContent?.trim();
            if (noticeNumber && caseRef) {
                map[noticeNumber] = caseRef;
            }
        }
    });
    return map;
}

interface ObligationTableProps extends React.HTMLAttributes<HTMLTableElement> {
    tableStyles: ReturnType<typeof extractTableStyles>;
    table: Table<VIEWDebtorSummaryObligation>;
    draggedColumnId: string | null;
    onDragStartColumn: (id: string) => void;
    onDragOverColumn: (e: React.DragEvent<HTMLElement>) => void;
    onDropColumn: (id: string) => void;
    onDragEndColumn: () => void;
    tableState: unknown;
}

const ObligationTable = React.memo(({ tableStyles, table, draggedColumnId, onDragStartColumn, onDragOverColumn, onDropColumn, onDragEndColumn }: ObligationTableProps) => {
    const { tableProps, theadProps, theadRowProps, tbodyProps, headerProps, rowStyles } = tableStyles;
    const cleanedTableProps = cleanProps(tableProps);

    return (
        <table {...cleanedTableProps} style={{ ...cleanedTableProps.style, tableLayout: "fixed", width: "100%" }}>
            <thead {...cleanProps(theadProps)}>
                {table.getHeaderGroups().map((hg: HeaderGroup<VIEWDebtorSummaryObligation>) => (
                    <tr key={hg.id} {...cleanProps(theadRowProps)}>
                        {hg.headers.map((header: Header<VIEWDebtorSummaryObligation, unknown>, index: number) => {
                            const isDraggable = header.column.id !== 'select';
                            const isResizing = header.column.getIsResizing();
                            const originalIndex = index - 1;
                            const thProps = (header.column.id !== 'select' && headerProps[originalIndex])
                                ? cleanProps(headerProps[originalIndex])
                                : {};

                            return (
                                <th key={header.id} draggable={isDraggable}
                                    {...thProps}
                                    onDragStart={() => {
                                        if (isDraggable) onDragStartColumn(header.column.id);
                                    }}
                                    onDragOver={onDragOverColumn}
                                    onDrop={() => onDropColumn(header.column.id)}
                                    onDragEnd={onDragEndColumn}
                                    style={{
                                        ...thProps.style,
                                        width: header.getSize(),
                                        position: 'relative',
                                        opacity: draggedColumnId === header.column.id ? 0.5 : 1,
                                        cursor: isDraggable ? 'grab' : (thProps.style?.cursor || 'default'),
                                        backgroundColor: thProps.style?.backgroundColor || (thProps as Record<string, unknown>).bgcolor as string || undefined
                                    }}
                                    className={(thProps.className as string) || ''}
                                >
                                    {header.column.id === 'select'
                                        ? flexRender(header.column.columnDef.header, header.getContext())
                                        : flexRender(header.column.columnDef.header, header.getContext())
                                    }
                                    {header.column.getCanResize() && (
                                        <div
                                            onMouseDown={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                header.getResizeHandler()(e);
                                            }}
                                            onTouchStart={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                header.getResizeHandler()(e);
                                            }}
                                            className={`resizer absolute right-0 top-0 h-full w-1 cursor-col-resize ${isResizing ? 'bg-blue-400' : ''}`} />
                                    )}
                                </th>
                            );
                        })}
                    </tr>
                ))}
            </thead>
            <tbody {...cleanProps(tbodyProps)}>
                {table.getRowModel().rows.map((row: Row<VIEWDebtorSummaryObligation>, rowIndex: number) => {
                    const currentStyle = rowStyles[rowIndex] || { props: {}, cellProps: [] };
                    const rowProps = cleanProps(currentStyle.props);

                    return (
                        <tr key={row.id} {...rowProps} className={`${rowProps.className || ''} hover:!bg-blue-300 cursor-pointer`}>
                            {row.getVisibleCells().map((cell: Cell<VIEWDebtorSummaryObligation, unknown>, index: number) => {
                                const originalIndex = index - 1;
                                const cellProps = (cell.column.id !== 'select' && currentStyle.cellProps[originalIndex])
                                    ? cleanProps(currentStyle.cellProps[originalIndex])
                                    : {};

                                return (
                                    <td key={cell.id}
                                        {...cellProps}
                                        style={{
                                            ...cellProps.style,
                                            width: cell.column.getSize()
                                        }}
                                        className={(cellProps.className as string) || ''}
                                    >
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </td>
                                );
                            })}
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
});
ObligationTable.displayName = 'ObligationTable';

const NATIVE_BUTTON_CLASS = "!box-border h-[14px] cursor-pointer bg-purple-900 rounded-[0.15rem] border border-solid text-gray-200 text-opacity-90 font-verdana text-xs leading-none select-none no-underline blur-[0.30px] outline-1 outline-[#5f5867] border-t-[hsl(266_49%_45%)] border-l-[hsl(266_49%_45%)] border-b-purple-950 border-r-purple-950 hover:bg-[#ac9ebe] hover:border-t-[#c5bfd4] hover:border-l-[#c5bfd4] hover:border-b-[#937fa8] hover:border-r-[#937fa8] active:bg-purple-900 active:shadow-inner active:border-t-purple-950 active:border-l-purple-950 active:border-b-purple-800 active:border-r-purple-800 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),inset_0_-1px_1px_rgba(0,0,0,0.2)] px-2 inline-flex items-center justify-center transition-all duration-75 text-[10px] mr-2 disabled:opacity-50";

type ExportColumnConfig = XlSXExportColumnDefinition[number];

interface SelectableExportColumn extends ExportColumnConfig {
    selected: boolean;
}

interface FieldWithExport extends MasterFieldDefinition {
    xlsxExport?: {
        header: string;
        width: number;
        isCurrency?: boolean;
        isDate?: boolean;
    };
}

interface ExportConfigPanelProps {
    currentConfig: XlSXExportColumnDefinition;
    onChange: (config: XlSXExportColumnDefinition) => void;
    onClose: () => void;
}

const ExportConfigPanel = ({ currentConfig, onChange, onClose }: ExportConfigPanelProps) => {
    const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
    const [items, setItems] = useState<SelectableExportColumn[]>(() => {
        const currentHeaders = new Set(currentConfig.map((c) => c.header));
        const configItems = currentConfig.map((c) => {
            // Ensure name is present. If loading from old storage, lookup name by header.
            let name = c.name;
            if (!name) {
                const match = (allDataFields as unknown as FieldWithExport[]).find(f => (f.xlsxExport?.header || f.name) === c.header);
                name = match?.name || c.header;
            }
            return { ...c, name, selected: true };
        });

        const missingItems = (allDataFields as unknown as FieldWithExport[])
            .filter(f => {
                const header = f.xlsxExport?.header || f.name;
                return !currentHeaders.has(header as ExportColumnConfig['header']);
            })
            .map(f => ({
                name: f.name,
                header: (f.xlsxExport?.header || f.name) as ExportColumnConfig['header'],
                width: f.xlsxExport?.width || 15,
                isCurrency: f.xlsxExport?.isCurrency,
                isDate: f.xlsxExport?.isDate,
                selected: false
            }));
        return [...configItems, ...missingItems];
    });

    const toggleSelection = (index: number) => {
        const newItems = [...items];
        newItems[index].selected = !newItems[index].selected;
        setItems(newItems);
    };

    const move = (direction: -1 | 1) => {
        if (focusedIndex === null) return;
        const newIndex = focusedIndex + direction;
        if (newIndex < 0 || newIndex >= items.length) return;
        const newItems = [...items];
        const temp = newItems[focusedIndex];
        newItems[focusedIndex] = newItems[newIndex];
        newItems[newIndex] = temp;
        setItems(newItems);
        setFocusedIndex(newIndex);
    };

    const handleReset = () => {
        const defaultItems = fieldsForXLSXexport.map((c) => ({ ...c, selected: true }));
        const defaultHeaders = new Set(defaultItems.map((c) => c.header));

        const missingItems = (allDataFields as unknown as FieldWithExport[])
            .filter(f => {
                const header = f.xlsxExport?.header || f.name;
                return !defaultHeaders.has(header as ExportColumnConfig['header']);
            })
            .map(f => ({
                name: f.name,
                header: (f.xlsxExport?.header || f.name) as ExportColumnConfig['header'],
                width: f.xlsxExport?.width || 15,
                isCurrency: f.xlsxExport?.isCurrency,
                isDate: f.xlsxExport?.isDate,
                selected: false
            }));
        setItems([...defaultItems, ...missingItems]);
    };

    const handleToggleSelectAll = () => {
        const allSelected = items.every((i) => i.selected);
        setItems(items.map((i) => ({ ...i, selected: !allSelected })));
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            const finalConfig = items.filter((i) => i.selected).map((i) => {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { selected, ...rest } = i;
                return rest;
            });
            onChange(finalConfig);
        }, 300);
        return () => clearTimeout(timer);
    }, [items, onChange]);

    const [container] = useState(() => document.createElement('div'));

    useEffect(() => {
        const target = document.getElementById('DebtorNoticesInfo');
        if (target && target.parentNode) {
            target.parentNode.insertBefore(container, target.nextSibling);
        }
        return () => {
            container.remove();
        };
    }, [container]);

    return createPortal(
        <div className="mb-2">
            <table cellPadding="0" cellSpacing="0" width="100%">
                <tbody>
                    <tr>
                        <td className="menu-header w-1/4 py-1 px-[9px]"> Configure Export Fields </td>
                        <td>&nbsp;</td>
                    </tr>
                </tbody>
            </table>
            <table className="bordertable" style={{ tableLayout: 'fixed', width: '100%' }}>
                <tbody>
                    <tr><td className="tdRowspace" colSpan={4}></td></tr>
                    <tr>
                        <td colSpan={4} className="p-2">
                            <div className="flex flex-row">
                                <div className="flex-grow max-h-48 overflow-y-auto border border-[#cccccc]">
                                    {items.map((item, index: number) => (
                                        <div
                                            key={item.header}
                                            className={`flex items-center px-1 py-[2px] border-b border-[#cccccc] cursor-pointer font-verdana text-[8pt] text-black ${index === focusedIndex ? 'bg-blue-100' : 'hover:bg-gray-50'}`}
                                            onClick={() => setFocusedIndex(index)}
                                        >
                                            <input type="checkbox" checked={item.selected} onChange={(e) => { e.stopPropagation(); toggleSelection(index); }} className="mr-2" />
                                            <span className="flex-grow">{item.header}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex flex-col justify-center ml-2 space-y-2">
                                    <button type="button" onClick={() => move(-1)} disabled={focusedIndex === null || focusedIndex === 0} className={NATIVE_BUTTON_CLASS + " mb-1 !mr-0"}>Move Up</button>
                                    <button type="button" onClick={() => move(1)} disabled={focusedIndex === null || focusedIndex === items.length - 1} className={NATIVE_BUTTON_CLASS + " !mr-0"}>Move Down</button>
                                </div>
                            </div>
                        </td>
                    </tr>
                    <tr><td className="tdRowspace" colSpan={4}></td></tr>
                    <tr>
                        <td className="tdButtons" colSpan={4} style={{ textAlign: 'right', padding: '4px' }}>
                            <button type="button" onClick={handleToggleSelectAll} className={NATIVE_BUTTON_CLASS}>
                                {items.every((i) => i.selected) ? "Deselect All" : "Select All"}
                            </button>
                            <button type="button" onClick={handleReset} className={NATIVE_BUTTON_CLASS}>Reset Default</button>
                            <button type="button" onClick={onClose} className={NATIVE_BUTTON_CLASS}>Close</button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>,
        container
    );
};

function App({ data, tableStyles, storageKey }: { data: VIEWDebtorSummaryObligation[], tableStyles: ReturnType<typeof extractTableStyles>, storageKey: string }) {
    const isProgrammaticSelection = useRef(false);
    const lastActionStorageKey = `lastSelectionAction_${storageKey}`;
    const lastSelectedRowId = useRef<string | null>(null);

    const columns = useMemo(() => [
        columnHelper.display({
            id: 'select',
            header: ({ table }) => (
                <IndeterminateCheckbox
                    {...{
                        checked: table.getIsAllRowsSelected(),
                        indeterminate: table.getIsSomeRowsSelected(),
                        onChange: table.getToggleAllRowsSelectedHandler(),
                    }}
                />
            ),
            cell: ({ row, table }) => (
                <IndeterminateCheckbox
                    {...{
                        checked: row.getIsSelected(),
                        disabled: !row.getCanSelect(),
                        indeterminate: row.getIsSomeSelected(),
                        onChange: row.getToggleSelectedHandler(),
                        onClick: (e: React.MouseEvent) => {
                            if (e.shiftKey) {
                                const { rows } = table.getRowModel();
                                const rowsById = rows.map(r => r.id);
                                const currentIndex = rowsById.indexOf(row.id);
                                const lastIndex = lastSelectedRowId.current ? rowsById.indexOf(lastSelectedRowId.current) : -1;

                                const newSelection = { ...table.getState().rowSelection };

                                const shouldSelect = !row.getIsSelected();

                                if (lastIndex !== -1 && currentIndex !== -1) {
                                    const start = Math.min(currentIndex, lastIndex);
                                    const end = Math.max(currentIndex, lastIndex);
                                    const rangeRows = rows.slice(start, end + 1);
                                    rangeRows.forEach(r => {
                                        if (shouldSelect) {
                                            newSelection[r.id] = true;
                                        } else {
                                            delete newSelection[r.id];
                                        }
                                    });
                                } else {
                                    if (shouldSelect) newSelection[row.id] = true;
                                    else delete newSelection[row.id];
                                }
                                table.setRowSelection(newSelection);
                            }
                            lastSelectedRowId.current = row.id;
                        }
                    }}
                />
            ),
            size: 30,
            minSize: 30,
            maxSize: 30,
            enableResizing: false,
        }),
        ...dataColumns
    ], []);

    const defaultColumnOrder = useMemo(() => columns.map(c => c.id!), [columns]);

    const [rowSelection, setRowSelection] = useState(() => {
        try {
            const saved = localStorage.getItem(storageKey);
            return saved ? JSON.parse(saved) : {};
        } catch { return {}; }
    });

    const handleRowSelectionChange: OnChangeFn<RowSelectionState> = useCallback((updater) => {
        setRowSelection(updater);
        if (isProgrammaticSelection.current) {
            isProgrammaticSelection.current = false;
        } else {
            localStorage.removeItem(lastActionStorageKey);
        }
    }, [lastActionStorageKey]);

    useEffect(() => {
        localStorage.setItem(storageKey, JSON.stringify(rowSelection));
    }, [rowSelection, storageKey]);

    const [columnSizing, setColumnSizing] = useState<ColumnSizingState>(() =>
        getInitialColumnSizing(defaultColumnOrder.map(id => ({ id })))
    );
    const [columnOrder, setColumnOrder] = useState<ColumnOrderState>(defaultColumnOrder);
    const [draggedColumnId, setDraggedColumnId] = useState<string | null>(null);

    const tableOptions = useMemo(() => ({
        data,
        columns,
        state: { columnSizing, columnOrder, rowSelection },
        onColumnSizingChange: setColumnSizing,
        onColumnOrderChange: setColumnOrder,
        onRowSelectionChange: handleRowSelectionChange,
        getCoreRowModel: getCoreRowModel(), // getCoreRowModel is a stable function import
        getRowId: (row: VIEWDebtorSummaryObligation) => row.NoticeNumber,
        columnResizeMode: 'onChange' as const,
    }), [data, columns, columnSizing, columnOrder, rowSelection, handleRowSelectionChange]);

    const table = useReactTable(tableOptions);

    const [isConfigOpen, setIsConfigOpen] = useState(false);
    const [exportColumns, setExportColumns] = useState<XlSXExportColumnDefinition>(() => {
        const saved = localStorage.getItem('xlsxExportConfig');
        let initialConfig: XlSXExportColumnDefinition = saved ? JSON.parse(saved) : fieldsForXLSXexport;

        // Ensure name property exists (migration for old configs)
        initialConfig = initialConfig.map((c) => {
            if (!c.name) {
                const match = (allDataFields as unknown as FieldWithExport[]).find(f => (f.xlsxExport?.header || f.name) === c.header);
                return { ...c, name: match?.name || c.header };
            }
            return c;
        });
        return initialConfig;
    });

    const handleConfigChange = useCallback((newConfig: XlSXExportColumnDefinition) => {
        setExportColumns(newConfig);
        localStorage.setItem('xlsxExportConfig', JSON.stringify(newConfig));
    }, []);

    const handleCustomExport = useCallback(async (_: string | null, tableObj: DebtorSummaryObligationTable) => {
        if (tableObj.getSelectedRowModel().rows.length === 0) {
            alert('You need to select at least one obligation');
            return;
        }
        try {
            const selectedRows = tableObj.getSelectedRowModel().rows.map(row => row.original);
            await sendExtensionMessage({
                type: 'generateXLSX',
                data: {
                    obligations: selectedRows,
                    VIEWEnvironment: VIEWEnvironment || 'djr',
                    exportColumns: exportColumns
                }
            });
        } catch (error: unknown) {
            console.error("Export Error:", error);
            alert(`Export Failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }, [exportColumns]);

    const buttons: Input[] = useMemo(() => [
        {
            type: "split_button", buttons: [
                { name: "export_table", type: "button", description: "Export obligations", text: "xlsx", onClick: handleCustomExport },
                { name: "configure_export", type: "button", description: "Configure Export", text: "⚙", onClick: () => setIsConfigOpen(prev => !prev), attributes: { title: "Configure Export Fields" } }
            ]
        },
        { name: "select_correspondence", type: "dropdown", description: "Select correspondence", options: "getTemplateOptions", attributes: { "data-type": "dropdown" } },
        { name: "generate_letter", type: "button", description: "Generate letter(s)", text: "Generate letter(s)", onClick: handleGenerateLetter },
        { name: "insert_notes", type: "button", description: "Bulk Notes Update", text: "Bulk Notes", onClick: handleBulkNotes },
        { name: "place_holds", type: "button", description: "Bulk Hold Update", text: "Bulk Hold", onClick: handleBulkHold },
        { name: "writeoff", type: "button", description: "Bulk Writeoff Update", text: "Bulk Writeoff", onClick: handleBulkWriteoff },
    ] as Input[], [handleCustomExport]);

    useEffect(() => {
        const lastAction = localStorage.getItem(lastActionStorageKey);
        if (lastAction) {
            const actionButton = selectionButtons.find(btn => btn.name === lastAction);
            if (actionButton?.onClick) {
                isProgrammaticSelection.current = true;
                actionButton.onClick(null, table);
            }
        }
    }, [lastActionStorageKey, table]);

    const selectionButtonsWithTracking = selectionButtons.map(button => ({
        ...button,
        onClick: (_: string | null, tableObj: Table<VIEWDebtorSummaryObligation>) => {
            if (button.onClick) {
                isProgrammaticSelection.current = true;
                button.onClick(null, tableObj);
                localStorage.setItem(lastActionStorageKey, button.name);
            }
        }
    }));

    const handleDragOverColumn = useCallback((e: React.DragEvent<HTMLElement>) => {
        e.preventDefault();
    }, []);

    const handleDropColumn = useCallback((id: string) => {
        if (!draggedColumnId || draggedColumnId === id) return;
        const newOrder = [...columnOrder];
        const from = newOrder.indexOf(draggedColumnId);
        const to = newOrder.indexOf(id);
        newOrder.splice(from, 1);
        newOrder.splice(to, 0, draggedColumnId);
        setColumnOrder(newOrder);
        setDraggedColumnId(null);
    }, [draggedColumnId, columnOrder]);

    const handleDragEndColumn = useCallback(() => {
        setDraggedColumnId(null);
    }, []);

    return (
        <div className="">
            {isConfigOpen && <ExportConfigPanel currentConfig={exportColumns} onChange={handleConfigChange} onClose={() => setIsConfigOpen(false)} />}
            <ButtonGroup buttons={selectionButtonsWithTracking} table={table} />
            <ObligationTable
                tableStyles={tableStyles}
                table={table}
                draggedColumnId={draggedColumnId}
                onDragStartColumn={setDraggedColumnId}
                onDragOverColumn={handleDragOverColumn}
                onDropColumn={handleDropColumn}
                onDragEndColumn={handleDragEndColumn}
                tableState={table.getState()}
            />
            <ButtonGroup buttons={buttons} table={table} />
        </div>
    );
}

// Global execution
try {
    const sourceTable = document.getElementById('DebtorNoticesCtrl_DebtorNoticesTable_tblData');
    if (!sourceTable) throw new Error("Initialization Error: Target data table not found on page.");

    const records = parseHTMLTableElem(sourceTable);

    const caseRefMap = getCaseRefMap();
    records.forEach(record => {
        if (record.NoticeNumber && caseRefMap[record.NoticeNumber]) {
            record.CaseRef = caseRefMap[record.NoticeNumber];
        }
    });

    const container = getParentElement(sourceTable);
    const debtorId = (document.querySelector("#DebtorDetailsCtrl_DebtorIdSearch") as HTMLInputElement)?.defaultValue || 'unknown';
    const storageKey = `tableRowSelection_${debtorId}`;
    const tableStyles = extractTableStyles(sourceTable);

    const root = ReactDOM.createRoot(container);
    root.render(<App data={records} tableStyles={tableStyles} storageKey={storageKey} />);
    movePagerControl();
} catch (error: unknown) {
    console.error("Application Startup Failed:", error);
}