import React, { HTMLProps, useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import parse, { Element, attributesToProps, HTMLReactParserOptions, domToReact } from 'html-react-parser';
import '../css/External/initial.css';
import { initialiseWorkbookProcesser } from './xlsxConverter';
import { DebtorSummaryObligationTable, Message, backgroundData } from './types';
import { handleSelectActionable, handleSelectEnforcementReview, handleSelectFVSHolds, handleSelectPAHolds } from './select';
import {
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    useReactTable,
    Table,
    ColumnSizingState, // Added for clarity
    ColumnOrderState,
    RowSelectionState,
    OnChangeFn, // Added for clarity
} from '@tanstack/react-table';

/** Current environment, 'djr' for production. */
const VIEWEnvironment = window.location.hostname.split('.')[0].toLowerCase();

// Assuming these types are correctly defined in './types'
import { Input, VIEWDebtorSummaryObligation, TemplateSheetRecord, Button, RadioButton, DropDown } from './types';
import { movePagerControl } from './utils';

const buttons: Input[] = [
    { name: "export_table", type: "button", description: "Export obligations", text: "xlxs", onClick: handlexlxsExport },
    //TODO: Implement column selector: https://github.com/adriangith/Toolkit-for-VIEW/issues/7 
    // { name: "export_table_settings", type: "button", description: "Table settings" },
    { name: "select_correspondence", type: "dropdown", description: "Select correspondence", options: "getTemplateOptions", attributes: { "data-type": "dropdown" } },
    { name: "generate_letter", type: "button", description: "Generate letter(s)", text: "Generate letter(s)", onClick: handleGenerateLetter },
    { name: "insert_notes", type: "button", description: "Bulk Notes Update", text: "Bulk Notes", onClick: handleBulkNotes },
    { name: "place_holds", type: "button", description: "Bulk Hold Update", text: "Bulk Hold", onClick: handleBulkHold },
    { name: "writeoff", type: "button", description: "Bulk Writeoff Update", text: "Bulk Writeoff", onClick: handleBulkWriteoff },
];

const selectionButtons: Button[] = [
    { name: "select_fvs_holds", type: "button", description: "Select all FVS Pending holds", text: "Select FVSPEND", onClick: handleSelectFVSHolds },
    { name: "select_p_a_holds", type: "button", description: "Select all PA Holds", text: "Select PA", onClick: handleSelectPAHolds },
    { name: "select_enforcement_review", type: "button", description: "Select all Enforcement Review", text: "Select Enf Review", onClick: handleSelectEnforcementReview },
    { name: "select_applicable", type: "button", description: "Select all Actionable", text: "Select Actionable", onClick: handleSelectActionable },
];

/**
 * Parses an HTML table element and extracts data into an array of VIEWDebtorSummaryObligation records.
 * @param tableEl The HTML table element to parse.
 * @returns An array of VIEWDebtorSummaryObligation records representing the parsed table data.
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

    /**
     * Extracts column headers from the table's thead section.
     * @remarks This function assumes that the IDs of the TH elements follow a specific pattern.
     * Text after "HeaderCell" in the ID is used as the column ID.
     * For example, if the ID is "DebtorNoticesCtrl_DebtorNoticesTable_HeaderCellNoticeNumber",
     * it will extract "NoticeNumber" as the column ID.
     */
    const headerCells = Array.from(tableEl.querySelectorAll('thead th'));

    /**
     * Maps header cells to column IDs.
     * @remarks This assumes that the IDs of the TH elements follow a specific pattern.
     * The text after "HeaderCell" in the ID is used as the column ID.
     * For example, if the ID is "DebtorNoticesCtrl_DebtorNoticesTable_HeaderCellNoticeNumber",
     * it will extract "NoticeNumber" as the column ID.
     * If the ID does not follow this pattern, it will fallback to using the full ID.
     * @returns An array of column IDs derived from the header cells.
     */
    const columns = headerCells.map(th => {
        const idParts = th.id.split("HeaderCell");
        return idParts.length > 1 ? idParts[1] : th.id; // Fallback to full ID if pattern not matched
    });

    const rows = tableEl.querySelectorAll('tbody > tr');
    return Array.from(rows).map(row => {
        const cells = Array.from(row.querySelectorAll('td'));
        return columns.reduce<VIEWDebtorSummaryObligation>((obj, col, idx) => {
            if (cells[idx]) { // Check if cell exists
                obj[col as keyof VIEWDebtorSummaryObligation] = cells[idx].textContent || '';
            } else {
                obj[col as keyof VIEWDebtorSummaryObligation] = '' // Or handle missing cell
            }
            return obj;
        }, {} as VIEWDebtorSummaryObligation);
    });
}

function getParentElement(element: HTMLElement | null): HTMLElement {
    if (!element) {
        throw new Error("Element is null");
    }
    if (!element.parentElement) {
        throw new Error("Element has no parent");
    }
    return element.parentElement;
}

function __doPostBack(eventTarget: string, eventArgument: string) {
    // Ensure `theForm` is correctly accessed, might need adjustment in browser extensions
    const theForm = document.forms[0] as HTMLFormElement & {
        __EVENTTARGET: HTMLInputElement;
        __EVENTARGUMENT: HTMLInputElement;
        onsubmit: (() => boolean) | null; // Define onsubmit type
    };

    if (!theForm) {
        console.error("Form not found for __doPostBack");
        return;
    }
    // Create hidden fields if they don't exist
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

    if (!theForm.onsubmit || (theForm.onsubmit && theForm.onsubmit() !== false)) {
        theForm.__EVENTTARGET.value = eventTarget;
        theForm.__EVENTARGUMENT.value = eventArgument;
        theForm.submit();
    }
}


function cleanProps(attribs: Record<string, string> | undefined): ReturnType<typeof attributesToProps> & { onClick?: () => void } {
    const newAttribs = { ...attribs }; // Clone to avoid modifying the original domNode.attribs

    if (newAttribs && newAttribs.onmouseover) {
        delete newAttribs.onmouseover;
    }
    if (newAttribs && newAttribs.onmouseout) {
        delete newAttribs.onmouseout;
    }

    if (!newAttribs || !newAttribs.onclick) {
        return attributesToProps(newAttribs || {});
    }

    const onclickValue = newAttribs.onclick;
    delete newAttribs.onclick; // Remove original onclick attribute

    const props: ReturnType<typeof attributesToProps> & { onMouseDown?: (e: React.MouseEvent) => void, onMouseUp?: (e: React.MouseEvent) => void } = attributesToProps(newAttribs);

    // Example: Parse "javascript:__doPostBack('arg1', 'arg2')"
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

            /** Text selection object */
            const textSelection = window.getSelection()
            /** Selected text */
            const selection = textSelection ? textSelection.toString() : '';

            // Check if it was a true click (no text selected AND mouse didn't move much)
            if (selection.length === 0 && deltaX < clickThreshold && deltaY < clickThreshold) {
                // If it was a true click, call the postback function
                __doPostBack(eventTarget, eventArgument);
            }
        }
    }
    return props;
}


// Assuming workbook is initialized correctly.
let workbook = initialiseWorkbookProcesser(
    "https://vicgov.sharepoint.com/:x:/s/VG002447/ERw7UOkUPWZLpAiwgjuPgmcBjEx8dklCu-9D9_bknPVOUQ?download=1"
);

async function handlexlxsExport(_: string | null, table: DebtorSummaryObligationTable) {
    if (table.getSelectedRowModel().rows.length === 0) {
        // Consider using a more user-friendly notification than alert in a browser extension
        console.warn('You need to select at least one obligation');
        alert('You need to select at least one obligation'); // Kept alert as per original code
        return;
    }

    try {
        const selectedRows = table.getSelectedRowModel().rows.map(row => row.original);
        chrome.runtime.sendMessage<Message>({
            type: 'generateXLSX',
            data: {
                obligations: selectedRows,
                VIEWEnvironment: VIEWEnvironment || 'djr',
            }
        });
    } catch (error) {
        console.error("Error exporting obligations:", error);
        alert("An error occurred while exporting obligations. See console for details.");
    }
}

function bulkAction({ subType, table }: { subType: string, table: Table<VIEWDebtorSummaryObligation> }) {
    if (table.getSelectedRowModel().rows.length === 0) {
        // Consider using a more user-friendly notification than alert in a browser extension
        console.warn('You need to select at least one obligation');
        alert('You need to select at least one obligation'); // Kept alert as per original code
        return;
    }

    try {
        const selectedRows = table.getSelectedRowModel().rows.map(row => row.original);
        chrome.runtime.sendMessage<Message>({
            type: 'bulkAction',
            data: {
                obligations: selectedRows,
                VIEWEnvironment: VIEWEnvironment || 'djr',
                subType
            },
        });
    } catch (error) {
        console.error("Error exporting obligations:", error);
        alert("An error occurred while exporting obligations. See console for details.");
    }
}

async function handleBulkNotes(_: string | null, table: Table<VIEWDebtorSummaryObligation>) {
    bulkAction({
        subType: "Bulk Notes Update",
        table: table
    });
}
async function handleBulkWriteoff(_: string | null, table: Table<VIEWDebtorSummaryObligation>) {
    bulkAction({
        subType: "Bulk Writeoff Update",
        table: table
    });
}
async function handleBulkHold(_: string | null, table: Table<VIEWDebtorSummaryObligation>) {
    bulkAction({
        subType: "Bulk Hold Update",
        table: table
    });
}

/**
 * Handles the generation of letters based on the selected option and obligations.
 * @param selectedOption The selected correspondence option from the dropdown.
 * @param table The react-table instance containing the obligations data.
 */
async function handleGenerateLetter(selectedOption: string | null, table: Table<VIEWDebtorSummaryObligation>) {
    if (table.getSelectedRowModel().rows.length === 0) {
        // Consider using a more user-friendly notification than alert in a browser extension such as a toast notification
        console.warn('You need to select at least one obligation');
        alert('You need to select at least one obligation'); // Kept alert as per original code
        return;
    }

    if (!selectedOption) {
        console.warn('No option selected');
        alert('No option selected');
        return;
    }

    try {
        /** Creates a workbook instance. */
        const wb = await workbook;

        /**
         * List of options and corresponding templates.
         * @example
         * const options = await fetchAndProcessOptions('Sheet1');
         * console.log(options);
         * // Output: [{ description: 'Option 1', letters: ['A', 'B'] }, ...]
         */
        const optionSheetData = await wb.fetchAndProcessOptions("Options");

        /** List of letters (templates) based on the selected option. */
        const selectedOptionData = optionSheetData.find(option => option.description === selectedOption)!;

        /** Fetches and converts the "Templates" sheet to JSON format. */
        const templateSheetData = await wb.fetchAndConvertXlsxToJson<TemplateSheetRecord>({ Sheet: "Templates" });

        /** List of templates that match the selected option's letters. */
        const selectedTemplates = templateSheetData.filter(template => {
            return selectedOptionData.letters.includes(template.Correspondence);
        })

        if (selectedTemplates.length === 0) {
            console.warn('No templates found for the selected option');
            alert('No templates configured for the selected option.');
            workbook = initialiseWorkbookProcesser(
                "https://vicgov.sharepoint.com/:x:/s/VG002447/ERw7UOkUPWZLpAiwgjuPgmcBjEx8dklCu-9D9_bknPVOUQ?download=1"
            );
            return;
        }

        console.log("Selected Templates:", selectedTemplates);

        const selectedRows = table.getSelectedRowModel().rows.map(row => row.original);
        const response = await chrome.runtime.sendMessage<backgroundData>({
            type: 'generateCorrespondence',
            data: {
                obligations: selectedRows,
                VIEWEnvironment: VIEWEnvironment || 'djr',
                documentTemplateProperties: selectedTemplates,
            },
        });
        if (response.response === 'Failed to fetch') {
            workbook = initialiseWorkbookProcesser(
                "https://vicgov.sharepoint.com/:x:/s/VG002447/ERw7UOkUPWZLpAiwgjuPgmcBjEx8dklCu-9D9_bknPVOUQ?download=1"
            );
            alert('Unable to fetch the template. Template may be configured incorrectly.');
        }

        if (response.response === 'Scraper is already active.') {
            alert('Scraper is already active.');
        }

        if (response.response.includes('File is not a Word or email template')) {
            alert('Unable to access the selected template(s). Please check if you have access to the SharePoint site and the template(s) are configured correctly.');
        }
    } catch (error) {
        console.error("Error generating letter:", error);
        alert("An error occurred while generating the letter. See console for details.");
    }
}


function measureColumnWidth(columnId: string): number {
    // The ID used here must exactly match the ID of the TH elements in the original HTML table
    const headerCell = document.getElementById(`DebtorNoticesCtrl_DebtorNoticesTable_HeaderCell${columnId}`);
    if (!headerCell) {
        console.warn(`Header cell not found for ID: DebtorNoticesCtrl_DebtorNoticesTable_HeaderCell${columnId}. Defaulting width.`);
        return 150; // Default width if header not found
    }
    return headerCell.getBoundingClientRect().width;
}

function getInitialColumnSizing(columnsToSize: Array<{ id: string }>): ColumnSizingState {
    return columnsToSize.reduce<ColumnSizingState>((acc, column) => {
        if (column.id === 'select') {
            acc[column.id] = 40; // Fixed width for select column
        } else {
            // Ensure `measureColumnWidth` uses the correct ID that matches the original HTML table's TH elements
            acc[column.id] = measureColumnWidth(column.id);
        }
        return acc;
    }, {});
}

const getTemplateOptions = async (): Promise<string[]> => {
    try {
        const wb = await workbook;
        const dropDownOptions = await wb.fetchAndProcessOptions("Options");
        return dropDownOptions.map(option => option.description);
    } catch (error) {
        if (error instanceof Error && error.message.includes("CORS")) {
            alert("SharePoint session expired. Please log into SharePoint and refresh this page.");
        }
        console.error("Error fetching template options:", error);
        return []; // Return empty array on error
    }
};

const columnHelper = createColumnHelper<VIEWDebtorSummaryObligation>();

const columns = [
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
        cell: ({ row }) => (
            <div className="">
                <IndeterminateCheckbox
                    {...{
                        checked: row.getIsSelected(),
                        disabled: !row.getCanSelect(),
                        indeterminate: row.getIsSomeSelected(),
                        onChange: row.getToggleSelectedHandler(),
                    }}
                />
            </div>
        ),
        size: 30, // Explicit size for select column
        minSize: 30,
        maxSize: 30,
        enableResizing: false,
    }),
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

const defaultColumnOrder: ColumnOrderState = columns.map(column => column.id!);
let lastSelectedOption: string | null = null;
if (typeof localStorage !== 'undefined') {
    lastSelectedOption = localStorage.getItem("selectedOption");
}


const ButtonComponent = ({ button, selectedOption, table }: { button: Button, selectedOption: string | null, table: Table<VIEWDebtorSummaryObligation> }) => {
    return (
        <button
            className="!box-border h-[14px] cursor-pointer bg-purple-900 rounded-[0.15rem] border border-solid text-gray-200 text-opacity-90 font-verdana text-xs leading-none select-none no-underline blur-[0.30px]
                     outline-1 outline-[#5f5867]
                     border-t-[hsl(266_49%_45%)] border-l-[hsl(266_49%_45%)] border-b-purple-950 border-r-purple-950
                     hover:bg-[#ac9ebe] hover:border-t-[#c5bfd4] hover:border-l-[#c5bfd4] hover:border-b-[#937fa8] hover:border-r-[#937fa8]
                     active:bg-purple-900 active:shadow-inner active:border-t-purple-950 active:border-l-purple-950 active:border-b-purple-800 active:border-r-purple-800
                     shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),inset_0_-1px_1px_rgba(0,0,0,0.2)]
                     px-2 flex items-center justify-center transition-all duration-75 text-[10px]"
            type={button.type as "button" | "submit" | "reset" | undefined}
            {...button.attributes}
            onClick={() => button.onClick && button.onClick(selectedOption, table)}
            disabled={button.name === "generate_letter" && !selectedOption}
        >
            <span className="relative -top-[0px]">
                {button.text || button.name}
            </span>
        </button>
    );
}

const RadioButtonComponent = ({ radioButton }: { radioButton: RadioButton }) => {
    return (
        <div className="mr-2"> {/* Added margin */}
            <input type="radio" name={radioButton.name} value={radioButton.value} {...radioButton.attributes} id={radioButton.name + radioButton.value} />
            <label htmlFor={radioButton.name + radioButton.value} className="ml-1">{radioButton.description}</label> {/* Added htmlFor and margin */}
        </div>
    );
}

const OptionComponent = ({ option }: { option: string }) => {
    return (
        <option value={option}>
            {option}
        </option>
    );
}

const DropDownComponent = ({ dropdown, onChange, initialSelectedOption }: { dropdown: DropDown; onChange: (option: string) => void; initialSelectedOption: string | null }) => {
    const [options, setOptions] = useState<string[]>([]);
    const [currentValue, setCurrentValue] = useState<string>(initialSelectedOption || '');

    useEffect(() => {
        const fetchOptions = async () => {
            if (typeof dropdown.options === 'string' && dropdown.options === "getTemplateOptions") {
                const fetchedOptions = await getTemplateOptions();
                setOptions(fetchedOptions);
                if (fetchedOptions.length > 0) {
                    const defaultVal = initialSelectedOption && fetchedOptions.includes(initialSelectedOption) ? initialSelectedOption : fetchedOptions[0];
                    setCurrentValue(defaultVal);
                    onChange(defaultVal); // Notify parent of initial/default selection
                }
            } else if (Array.isArray(dropdown.options)) {
                setOptions(dropdown.options);
                if (dropdown.options.length > 0) {
                    const defaultVal = initialSelectedOption && dropdown.options.includes(initialSelectedOption) ? initialSelectedOption : dropdown.options[0];
                    setCurrentValue(defaultVal);
                    onChange(defaultVal); // Notify parent of initial/default selection
                }
            }
        };
        fetchOptions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dropdown.options, initialSelectedOption]);

    const handleSelectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newValue = e.target.value;
        setCurrentValue(newValue);
        onChange(newValue);
    };

    if (options.length === 0 && typeof dropdown.options === 'string') { // Only show loading if options are fetched
        return <div className="mr-2 p-1 border border-gray-300 rounded">Loading...</div>;
    }

    return (
        <select
            {...dropdown.attributes}
            value={currentValue}
            onChange={handleSelectionChange}
            className="listitem" // Basic styling
        >
            {options.map((option, index) => (
                <OptionComponent key={index} option={option} />
            ))}
        </select>
    );
}

const ButtonGroup: React.FC<{
    buttons: Input[];
    table: Table<VIEWDebtorSummaryObligation>;
}> = ({ buttons, table }) => {
    const [selectedOption, setSelectedOption] = useState<string>(lastSelectedOption || "");

    const handleDropdownChange = (option: string) => {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem("selectedOption", option);
        }
        setSelectedOption(option);
    };

    return (
        <div className="flex flex-row justify-start items-center space-x-2 p-2 bg-gray-100 rounded">
            {buttons.map((button, index) => {
                if (button.type === "button") {
                    return (
                        <ButtonComponent key={index} button={button as Button} selectedOption={selectedOption} table={table} />
                    );
                } else if (button.type === "dropdown") {
                    return <DropDownComponent key={index} dropdown={button as DropDown} onChange={handleDropdownChange} initialSelectedOption={selectedOption} />;
                } else if (button.type === "radio") {
                    return <RadioButtonComponent key={index} radioButton={button as RadioButton} />;
                }
                return null;
            })}
        </div>
    );
}

function IndeterminateCheckbox({
    indeterminate,
    className = '',//'m-0',
    ...rest
}: { indeterminate?: boolean } & HTMLProps<HTMLInputElement>) {
    const ref = useRef<HTMLInputElement>(null!);

    useEffect(() => {
        if (typeof indeterminate === 'boolean') {
            ref.current.indeterminate = !rest.checked && indeterminate;
        }
    }, [ref, indeterminate, rest.checked]);

    return (
        <label className='inline-block w-full'>
            <input
                type="checkbox"
                ref={ref}
                className={className + ' cursor-pointer'}
                {...rest}
            />
        </label>
    );
}


const ObligationTable = ({
    HTMLTable,
    table,
    draggedColumnId,
    onDragStartColumn,
    onDragOverColumn,
    onDropColumn,
    onDragEndColumn
}: {
    HTMLTable: string,
    table: Table<VIEWDebtorSummaryObligation>,
    draggedColumnId: string | null;
    onDragStartColumn: (columnId: string) => void;
    onDragOverColumn: (event: React.DragEvent<HTMLElement>) => void;
    onDropColumn: (targetColumnId: string) => void;
    onDragEndColumn: () => void;
}) => {
    const tableStyles = {
        table: {
            tableLayout: "fixed" as const,
            width: "100%", // Ensure table takes full width for layout
        },
        th: {
            position: 'relative' as const,
        },
        resizer: {
            position: 'absolute' as const,
            right: 0,
            top: 0,
            height: '100%',
            width: '5px',
            cursor: 'col-resize',
            userSelect: 'none' as const,
            touchAction: 'none' as const,
            zIndex: 10, // Make sure resizer is on top
        },
        isResizing: { // Style for the resizer when column is being resized
            background: 'rgba(128, 128, 128, 0.5)', // More visible resizer
            opacity: 1,
        },
    };

    const options: HTMLReactParserOptions = {
        replace: (domNode) => {
            if (domNode instanceof Element && domNode.name === 'table') {
                const elementProps = cleanProps(domNode.attribs);
                return <table
                    {...elementProps}
                    style={{
                        ...(elementProps.style ? elementProps.style : {}),
                        ...tableStyles.table,
                    }}
                    className={`${elementProps.className || ''} ${table.getState().columnSizingInfo.isResizingColumn ? 'border-blue-500' : ''}`} // Example resizing class
                >
                    {domToReact(domNode.children as Element[], options)}
                </table>;
            }

            if (domNode instanceof Element && domNode.name === 'thead') {
                const props = cleanProps(domNode.attribs);
                return <thead {...props}>
                    {table.getHeaderGroups().map(headerGroup => (
                        <tr key={headerGroup.id} {...(domNode.children.find(c => c instanceof Element && c.name === 'tr') instanceof Element ? cleanProps((domNode.children.find(c => c instanceof Element && c.name === 'tr') as Element).attribs) : {})}>
                            {headerGroup.headers.map(header => {
                                const width = header.getSize();
                                const isResizing = header.column.getIsResizing();
                                const originalThNode = domNode.children.find(c => c instanceof Element && c.name === 'tr') instanceof Element ?
                                    (domNode.children.find(c => c instanceof Element && c.name === 'tr') as Element).children.find(child =>
                                        child instanceof Element &&
                                        child.name === 'th' &&
                                        (child.attribs?.id?.split("HeaderCell")[1] === header.column.id || child.attribs?.id === header.column.id) // More flexible ID matching
                                    ) as Element | undefined : undefined;
                                const thBaseProps = originalThNode ? cleanProps(originalThNode.attribs) : {};
                                const isDraggable = header.column.id !== 'select' && header.column.getCanResize(); // Only allow draggable if resizable (usually means not 'select')

                                return (
                                    <th
                                        key={header.id}
                                        colSpan={header.colSpan}
                                        {...thBaseProps}
                                        draggable={isDraggable}
                                        onDragStart={(e) => { if (isDraggable) { e.dataTransfer.setData('text/plain', header.column.id); onDragStartColumn(header.column.id); } }}
                                        onDragOver={(e) => { if (isDraggable) onDragOverColumn(e); }}
                                        onDrop={(e) => { if (isDraggable) { e.preventDefault(); onDropColumn(header.column.id); } }}
                                        onDragEnd={() => { if (isDraggable) onDragEndColumn(); }}
                                        style={{
                                            ...thBaseProps.style,
                                            ...tableStyles.th, // Apply base TH styles
                                            width: width, // This is crucial for fixed layout
                                            minWidth: header.column.columnDef.minSize, // Respect minSize
                                            maxWidth: header.column.columnDef.maxSize, // Respect maxSize
                                            opacity: draggedColumnId === header.column.id ? 0.5 : 1,
                                            cursor: isDraggable ? 'grab' : (thBaseProps.style?.cursor || 'default'),
                                            position: 'sticky',
                                            top: 0
                                        }}
                                        className={`${thBaseProps.className || ''} ${isResizing ? 'bg-gray-200' : ''} ${draggedColumnId === header.column.id ? 'opacity-50' : ''}`}
                                    >
                                        {header.isPlaceholder ? null : (
                                            <>
                                                {flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                                {header.column.getCanResize() && (
                                                    <div
                                                        onClick={(e) => { e.stopPropagation(); e.preventDefault(); }} // Prevent click from triggering sort if any
                                                        onMouseDown={(e) => { e.stopPropagation(); header.getResizeHandler()(e); }}
                                                        onTouchStart={(e) => { e.stopPropagation(); header.getResizeHandler()(e); }}
                                                        style={{ ...tableStyles.resizer, ...(isResizing ? tableStyles.isResizing : {}) }}
                                                        className={`resizer ${isResizing ? 'isResizing' : ''}`}
                                                    />
                                                )}
                                            </>
                                        )}
                                    </th>
                                );
                            })}
                        </tr>
                    ))}
                </thead>;
            }

            if (domNode instanceof Element && domNode.name === 'tbody') {
                const props = cleanProps(domNode.attribs);
                return <tbody {...props}>
                    {table.getRowModel().rows.map((row, rowIndex) => {
                        const rowSourceNode = domNode.children.filter(child => child instanceof Element && child.name === 'tr')[rowIndex] as Element | undefined;
                        const rowProps = rowSourceNode ? cleanProps(rowSourceNode.attribs) : {};

                        return <tr key={row.id} {...rowProps} className={`${rowProps.className || ''} hover:!bg-blue-300 cursor-pointer`}>
                            {row.getVisibleCells().map(cell => {
                                const originalTdNode = rowSourceNode?.children.find(child =>
                                    child instanceof Element &&
                                    child.name === 'td' &&
                                    (child.attribs?.id?.includes(cell.column.id) || child.attribs?.headers?.includes(cell.column.id))
                                ) as Element | undefined;
                                const tdBaseProps = originalTdNode ? cleanProps(originalTdNode.attribs) : {};

                                return (
                                    <td
                                        key={cell.id}
                                        {...tdBaseProps}
                                        style={{
                                            ...tdBaseProps.style,
                                            width: cell.column.getSize(), // Apply width from react-table
                                            minWidth: cell.column.columnDef.minSize,
                                            maxWidth: cell.column.columnDef.maxSize
                                        }}
                                        className={`${tdBaseProps.className || ''} `} // Basic cell styling
                                    >
                                        {flexRender(
                                            cell.column.columnDef.cell,
                                            cell.getContext()
                                        )}
                                    </td>
                                );
                            })}
                        </tr>;
                    })}
                </tbody>;
            }
            // Fallback for other elements: let html-react-parser handle them or skip
            // To render children of unhandled elements:
            // if (domNode instanceof Element && domNode.children && domNode.children.length > 0) {
            // }
            return undefined; // Or return domNode to let parser handle it by default if not replaced
        }
    };

    return <>{parse(HTMLTable, options)}</>;
}


function App({ data, HTMLTable, storageKey }: { data: VIEWDebtorSummaryObligation[], HTMLTable: string, storageKey: string }) {
    // Ref to differentiate between programmatic (button click) and manual selection
    const isProgrammaticSelection = useRef(false);

    // Unique localStorage key to track the last selection action button clicked
    const lastActionStorageKey = `lastSelectionAction_${storageKey}`;

    // The handler for when row selection changes, called by the table instance
    const handleRowSelectionChange: OnChangeFn<RowSelectionState> = (updater) => {
        // Update the row selection state using the function provided by the table
        setRowSelection(updater);

        if (isProgrammaticSelection.current) {
            // If the change was from a button, reset the flag and keep the last action in localStorage.
            isProgrammaticSelection.current = false;
        } else {
            // If it was a manual user click, remove the last action key.
            // This prevents re-evaluation on the next load, preserving the user's manual changes.
            localStorage.removeItem(lastActionStorageKey);
        }
    };

    // State for checkbox selections, initialized from localStorage
    const [rowSelection, setRowSelection] = useState(() => {
        const saved = localStorage.getItem(storageKey);
        return saved ? JSON.parse(saved) : {};
    });
    // --- END: Added logic for re-evaluation ---

    // Effect to save checkbox selection state to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem(storageKey, JSON.stringify(rowSelection));
    }, [rowSelection, storageKey]);

    // Existing state for table columns
    const [columnSizing, setColumnSizing] = useState<ColumnSizingState>(() =>
        getInitialColumnSizing(defaultColumnOrder.map(id => ({ id })))
    );
    const [columnVisibility, setColumnVisibility] = useState({});
    const [columnOrder, setColumnOrder] = useState<ColumnOrderState>(defaultColumnOrder);
    const [draggedColumnId, setDraggedColumnId] = useState<string | null>(null);

    const table = useReactTable({
        data,
        columns,
        enableRowSelection: true,
        state: {
            columnSizing,
            columnVisibility,
            columnOrder,
            rowSelection,
        },
        onColumnSizingChange: setColumnSizing,
        onColumnVisibilityChange: setColumnVisibility,
        onColumnOrderChange: setColumnOrder,
        // --- MODIFICATION: Use the custom handler for selection changes ---
        onRowSelectionChange: handleRowSelectionChange,
        getCoreRowModel: getCoreRowModel(),
        getRowId: row => row.NoticeNumber,
        columnResizeMode: 'onChange',
        enableColumnResizing: true,
    });

    // --- NEW: useEffect to re-evaluate selection on page load ---
    useEffect(() => {
        const lastAction = localStorage.getItem(lastActionStorageKey);
        if (lastAction) {
            const actionButton = selectionButtons.find(btn => btn.name === lastAction);
            if (actionButton && actionButton.onClick) {
                console.log(`Re-evaluating selection for: ${lastAction}`);
                // Flag the change as programmatic so our handler doesn't clear the stored action
                isProgrammaticSelection.current = true;
                actionButton.onClick(null, table);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Empty dependency array ensures this runs only once on mount

    // --- MODIFICATION: Wrap selection button handlers to add tracking ---
    const selectionButtonsWithTracking = selectionButtons.map(button => ({
        ...button,
        onClick: (_: string | null, table: Table<VIEWDebtorSummaryObligation>) => {
            if (button.onClick) {
                // 1. Flag the upcoming selection change as programmatic
                isProgrammaticSelection.current = true;
                // 2. Execute the original onClick logic (e.g., handleSelectActionable)
                button.onClick(null, table);
                // 3. Store the name of this action so it can be re-run on next load
                localStorage.setItem(lastActionStorageKey, button.name);
            }
        }
    }));

    // Existing drag-and-drop handlers
    const handleDragStart = (columnId: string) => {
        setDraggedColumnId(columnId);
    };

    const handleDragOver = (event: React.DragEvent<HTMLElement>) => {
        event.preventDefault();
    };

    const handleDrop = (targetColumnId: string) => {
        if (!draggedColumnId || draggedColumnId === targetColumnId) {
            setDraggedColumnId(null);
            return;
        }
        const currentColumnOrder = table.getState().columnOrder;
        const draggedIndex = currentColumnOrder.indexOf(draggedColumnId);
        const targetIndex = currentColumnOrder.indexOf(targetColumnId);
        if (draggedIndex !== -1 && targetIndex !== -1) {
            const newColumnOrder = [...currentColumnOrder];
            newColumnOrder.splice(draggedIndex, 1);
            newColumnOrder.splice(targetIndex, 0, draggedColumnId);
            table.setColumnOrder(newColumnOrder);
        }
        setDraggedColumnId(null);
    };

    const handleDragEnd = () => {
        setDraggedColumnId(null);
    };

    return (
        <div className="">
            {/* --- MODIFICATION: Pass the new wrapped buttons to the ButtonGroup --- */}
            <ButtonGroup buttons={selectionButtonsWithTracking} table={table} />
            <ObligationTable
                HTMLTable={HTMLTable}
                table={table}
                draggedColumnId={draggedColumnId}
                onDragStartColumn={handleDragStart}
                onDragOverColumn={handleDragOver}
                onDropColumn={handleDrop}
                onDragEndColumn={handleDragEnd}
            />
            <ButtonGroup buttons={buttons} table={table} />
        </div>
    );
}

const sourceTable = document.getElementById('DebtorNoticesCtrl_DebtorNoticesTable_tblData');
const records = parseHTMLTableElem(sourceTable);
const container = getParentElement(sourceTable);

const debtorIdElement = document.querySelector("#DebtorDetailsCtrl_DebtorIdSearch") as HTMLInputElement;
const debtorId = debtorIdElement ? debtorIdElement.defaultValue : 'unknown_debtor';
const storageKey = `tableRowSelection_${debtorId}`;

const root = ReactDOM.createRoot(container);
// Pass the unique storageKey as a prop to the App
const render = () => root.render(<App data={records} HTMLTable={sourceTable?.outerHTML || ''} storageKey={storageKey} />);
movePagerControl();
render();