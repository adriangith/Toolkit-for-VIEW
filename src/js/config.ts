import {
    MasterFieldDefinition,
    DataFieldName,
    DerivationFunction,
    DerivationLogicRegistry,
    MasterPageDefinition,
    XlSXExportColumnDefinition,
    ExtractedFieldName,
    DerivedFieldName,
    CollectedData
} from "./types";
import { toTitleCase, formatDate } from "./utils";
import { initialiseWorkbookProcesser } from "./xlsxConverter";

/**
 * --- UTILITIES & HELPERS ---
 */

let workbookInstance: Awaited<ReturnType<typeof initialiseWorkbookProcesser>> | null = null;

export const CONFIG_WORKBOOK_URL = process.env.CONFIG_WORKBOOK_URL as string;

async function getWorkbook() {
    if (!workbookInstance) {
        workbookInstance = await initialiseWorkbookProcesser(CONFIG_WORKBOOK_URL);
    }
    return workbookInstance;
}

async function lookupAgencyData(column: string, altname: unknown) {
    if (typeof altname !== 'string') return undefined;
    const wb = await getWorkbook();
    const data = await wb.fetchAndConvertXlsxToJson({ Sheet: 'Agencies', Column: column });
    return data[altname];
}

const safeTitleCase = (val: unknown) => typeof val === 'string' ? toTitleCase(val) : '';

function formatLocalityAndStreet(street: string = '', locality: string = '') {
    const replacements: [RegExp, string][] = [
        [/ Gr$/i, " Grove"], [/ St$/i, " Street"], [/ Dr$/i, " Drive"], [/ Ct$/i, " Court"],
        [/ Rd$/i, " Road"], [/ Ave?$/i, " Avenue"], [/ Cre?s?$/i, " Crescent"],
        [/ Pl$/i, " Place"], [/ Tce$/i, " Terrace"], [/ Bvd$/i, " Boulevard"],
        [/ Cl$/i, " Close"], [/ Cir$/i, " Circle"], [/ Pde$/i, " Parade"],
        [/ Cct$/i, " Circuit"], [/ Wy$/i, " Way"], [/ Esp$/i, " Esplanade"],
        [/ Sq$/i, " Square"], [/ Hwy$/i, " Highway"], [/^Po /i, "PO "]
    ];
    let expandedLocality = toTitleCase(locality.trim());
    let expandedStreet = toTitleCase(street.trim());

    replacements.forEach(([regex, rep]) => {
        expandedLocality = expandedLocality.replace(regex, rep);
        expandedStreet = expandedStreet.replace(regex, rep);
    });
    return `${expandedStreet}${street !== '' ? ' ' + expandedLocality : ''}`.trim();
}

/**
 * --- ADVANCED TYPES FOR FIELD DEFINITION ---
 * These types enforce validation rules on the field registry at compile time.
 */

// Base properties common to ALL field definitions
interface BaseConfigFieldProperties {
    name: string;
    level: "Debtor" | "Obligation";
    isList?: boolean;
    notes?: string;
    condition?: (data: CollectedData) => boolean;
    derivationKey?: string;

    // Properties specific to ConfigField, not in MasterFieldDefinition
    isDefaultTarget?: boolean;
    xlsxExport?: {
        header: string;
        width: number;
        isCurrency?: boolean;
        isDate?: boolean;
    };
}

// Type for fields that are directly extracted (not derived)
type ExtractedConfigField = BaseConfigFieldProperties & {
    isDerived?: false;
    sourceFields?: never;
    derivationFn?: never;
};

// Type for derived fields with specific rules
type DerivedConfigField = BaseConfigFieldProperties & {
    isDerived: true;
} & (
        // Case 1: Source-less derivation (e.g., timestamp). `derivationFn` or `derivationKey` is required.
        {
            sourceFields?: readonly [];
            derivationFn: DerivationFunction;
        } |
        {
            sourceFields?: readonly [];
            derivationKey: string;
        } |
        // Case 2: Single-source derivation (aliasing is allowed). `derivationFn` is optional.
        {
            sourceFields: readonly [string];
            derivationFn?: DerivationFunction;
        } |
        // Case 3: Multi-source derivation. `derivationFn` or `derivationKey` is required.
        {
            sourceFields: readonly [string, string, ...string[]];
            derivationFn: DerivationFunction;
        } |
        {
            sourceFields: readonly [string, string, ...string[]];
            derivationKey: string;
        }
    );

// The final ConfigField type is a union of the two main types
type ConfigField = ExtractedConfigField | DerivedConfigField;

function defineFields<const T extends ReadonlyArray<ConfigField>>(fields: T) {
    return fields;
}

/**
 * --- DERIVATION LOGIC ---
 * Extracted functions to keep the configuration arrays clean.
 */

const deriveAddress1: DerivationFunction = (s) => {
    const full = s.best_postal_address || s.best_residential_address;
    if (typeof full === 'string') {
        const parts = full.split(',');
        return formatLocalityAndStreet(parts[0], parts.length > 3 ? parts[1] : undefined);
    }
    return s.addressType === 'POSTAL' ? formatLocalityAndStreet(s.street as string, s.locality as string) : undefined;
};

const deriveTown: DerivationFunction = (s) => {
    const full = s.best_postal_address || s.best_residential_address;
    if (typeof full === 'string') {
        const parts = full.split(',');
        return parts[parts.length - 2]?.trim().toUpperCase();
    }
    return (s.addressType === 'POSTAL' && typeof s.suburb === 'string') ? s.suburb.toUpperCase() : undefined;
};

const deriveState: DerivationFunction = (s) => {
    const full = s.best_postal_address || s.best_residential_address;
    if (typeof full === 'string') {
        const parts = full.split(',');
        return parts[parts.length - 1]?.trim().toUpperCase();
    }
    return (s.addressType === 'POSTAL' && typeof s.state === 'string') ? s.state.trim().toUpperCase() : undefined;
};

/**
 * --- MODULAR REGISTRIES ---
 */

const DEBTOR_FIELDS = defineFields([
    { name: "debtor_id", level: "Debtor", isDefaultTarget: true },
    { name: "UserID", level: "Debtor", isDefaultTarget: true },
    { name: "Category", level: "Debtor", isDefaultTarget: true },
    { name: "first_name_raw", level: "Debtor" },
    { name: "last_name_raw", level: "Debtor" },
    {
        name: "first_name",
        level: "Debtor",
        isDerived: true,
        sourceFields: ["first_name_raw", "company_name"],
        // If company_name is present, we consider first_name found (as empty).
        derivationFn: (s) => s.company_name ? "" : s.first_name_raw
    },
    {
        name: "last_name",
        level: "Debtor",
        isDerived: true,
        sourceFields: ["last_name_raw", "company_name"],
        // If company_name is present, we consider last_name found (as empty).
        derivationFn: (s) => s.company_name ? "" : s.last_name_raw
    },
    { name: "company_name", level: "Debtor", isDerived: true, sourceFields: ["debtor_id"], derivationFn: () => false },
    { name: "total_amount_outstanding", level: "Debtor", isDefaultTarget: true },
    { name: "date_of_birth", level: "Debtor", isDefaultTarget: true },
    { name: "open_obligations", level: "Debtor" },
    { name: "best_residential_address", level: "Debtor" },
    { name: "best_postal_address", level: "Debtor" },
    { name: "best_postal_postcode", level: "Debtor" },
    { name: "best_residential_postcode", level: "Debtor" },
    { name: "street", level: "Debtor" },
    { name: "locality", level: "Debtor" },
    { name: "address_2", level: "Debtor" },
    { name: "suburb", level: "Debtor" },
    { name: "postcode", level: "Debtor" },
    { name: "state", level: "Debtor" },
    { name: "country", level: "Debtor" },
    { name: "addressType", level: "Debtor" },
    {
        name: "fullName",
        level: "Debtor",
        isDerived: true,
        sourceFields: ["first_name", "last_name", "company_name"],
        isDefaultTarget: true,
        derivationFn: (s) => {
            const f = safeTitleCase(s.first_name);
            const l = safeTitleCase(s.last_name);
            const c = safeTitleCase(s.company_name);
            return c ? c : [f, l].filter(Boolean).join(' ');
        }
    },
    { name: "name", level: "Debtor", isDerived: true, derivationKey: 'fullName', sourceFields: ["first_name", "last_name", "company_name"], isDefaultTarget: true },
    { name: "dt", level: "Debtor", isDerived: true, isDefaultTarget: true, derivationFn: () => formatDate(new Date()) },
    { name: "Debtor_ID", level: "Debtor", isDerived: true, sourceFields: ["debtor_id"], isDefaultTarget: true, derivationFn: (s) => s.debtor_id },
    {
        name: "First_Name",
        level: "Debtor",
        isDerived: true,
        sourceFields: ["first_name", "company_name"],
        isDefaultTarget: true,
        derivationFn: (s) => {
            if (s.company_name) return "";
            return s.first_name ? safeTitleCase(s.first_name) : undefined;
        }
    },
    {
        name: "Last_Name",
        level: "Debtor",
        isDerived: true,
        sourceFields: ["last_name", "company_name"],
        isDefaultTarget: true,
        derivationFn: (s) => {
            if (s.company_name) return "";
            return s.last_name ? safeTitleCase(s.last_name) : undefined;
        }
    },
    { name: "Company_Name", level: "Debtor", isDerived: true, sourceFields: ["company_name"], isDefaultTarget: true, derivationFn: (s) => s.company_name ? safeTitleCase(s.company_name) : undefined },
    {
        name: "Address_1",
        level: "Debtor",
        isDerived: true,
        sourceFields: ["best_postal_address", "best_residential_address", "locality", "street", "addressType"],
        isDefaultTarget: true,
        derivationFn: deriveAddress1
    },
    {
        name: "Town",
        level: "Debtor",
        isDerived: true,
        sourceFields: ["suburb", "best_postal_address", "best_residential_address", "addressType"],
        isDefaultTarget: true,
        derivationFn: deriveTown
    },
    { name: "Town2", level: "Debtor", isDerived: true, sourceFields: ["Town"], isDefaultTarget: true, derivationFn: (s) => typeof s.Town === 'string' ? toTitleCase(s.Town) : undefined },
    { name: "Post_Code", level: "Debtor", isDerived: true, sourceFields: ["best_residential_address", "best_postal_address"], isDefaultTarget: true, derivationFn: (s) => (s.best_postal_postcode || s.best_residential_postcode || '').toString().trim() },
    {
        name: "State",
        level: "Debtor",
        isDerived: true,
        sourceFields: ["state", "best_residential_address", "best_postal_address", "addressType"],
        isDefaultTarget: true,
        derivationFn: deriveState
    },
    { name: "is_company", level: "Debtor", isDerived: true, sourceFields: ["company_name"], isDefaultTarget: true, derivationFn: (s) => !!s.company_name },
    { name: "Is_Company", level: "Debtor", isDerived: true, sourceFields: ["is_company"], isDefaultTarget: true, derivationFn: (s) => !!s.is_company },
    { name: "todayplus14", level: "Debtor", isDerived: true, isDefaultTarget: true, derivationFn: () => { const d = new Date(); d.setDate(d.getDate() + 14); return `${d.getDate()} ${d.toLocaleString('en-GB', { month: 'long' })} ${d.getFullYear()}`; } },
    { name: "todayplus21", level: "Debtor", isDerived: true, isDefaultTarget: true, derivationFn: () => { const d = new Date(); d.setDate(d.getDate() + 21); return `${d.getDate()} ${d.toLocaleString('en-GB', { month: 'long' })} ${d.getFullYear()}`; } },
    { name: "todayplus28", level: "Debtor", isDerived: true, isDefaultTarget: true, derivationFn: () => { const d = new Date(); d.setDate(d.getDate() + 28); return `${d.getDate()} ${d.toLocaleString('en-GB', { month: 'long' })} ${d.getFullYear()}`; } },
    { name: "ACN_ARBN", level: "Debtor" },
    { name: "JAID", level: "Debtor" },
    { name: "Gender", level: "Debtor" },
    { name: "ABN", level: "Debtor" },
    { name: "CorrectionsReference", level: "Debtor" },
    { name: "DateOfDeregistration", level: "Debtor" },
    { name: "InCustody", level: "Debtor" },
    { name: "DateOfDeath", level: "Debtor" },
    { name: "DateOfAdministration", level: "Debtor" },
    { name: "DateOfRelease", level: "Debtor" },
    { name: "TaxiDriverNumber", level: "Debtor" },
    { name: "DateOfLiquidation", level: "Debtor" },
    { name: "DateOfBankruptcy", level: "Debtor" },
    { name: "IndigenousStatus", level: "Debtor" },
    { name: "OtherInformation", level: "Debtor" },
]);

const OBLIGATION_FIELDS = defineFields([
    { name: "NoticeNumber", level: "Obligation" },
    { name: "CurrentChallengeLogged", level: "Obligation" },
    { name: "NoticeStatus", level: "Obligation", isDefaultTarget: true },
    {
        name: "obligation_status",
        level: "Obligation",
        isDerived: true,
        sourceFields: ["NoticeStatus"],
        derivationFn: (s) => s.NoticeStatus
    },
    { name: "NoticeType", level: "Obligation", isDefaultTarget: true },
    {
        name: "input_source",
        level: "Obligation",
        isDerived: true,
        sourceFields: ["NoticeType"],
        derivationFn: (s) => s.NoticeType as string
    },
    {
        name: "altname_raw",
        level: "Obligation",
        isDerived: true,
        sourceFields: ["NoticeType"],
        derivationFn: (s) => (s.NoticeType === '1A' || s.NoticeType === '1C') ? "DERIVED_FROM_TYPE" : undefined
    },
    {
        name: "altname",
        level: "Obligation",
        isDerived: true,
        sourceFields: ["NoticeType", "altname_raw"],
        isDefaultTarget: true,
        derivationFn: (s) => {
            if (s.NoticeType === '1A') return 'TRAFFIC CAMERA OFFICE';
            if (s.NoticeType === '1C') return 'VICTORIA POLICE TOLL ENFORCEMENT OFFICE';
            return s.altname_raw;
        }
    },
    { name: "infringement_number", level: "Obligation", isDefaultTarget: true },
    {
        name: "offence_description",
        level: "Obligation",
        isDefaultTarget: true,
        condition: (s) => s.NoticeType === '2B' || s.offence_description === 'REFERRED COURT FINE'
    },
    { name: "offence_location", level: "Obligation", isDefaultTarget: true, xlsxExport: { header: "offence_location", width: 70 } },
    { name: "offence_time", level: "Obligation", isDefaultTarget: true, xlsxExport: { header: "offence_time", width: 8 } },
    { name: "BalanceOutstanding", level: "Obligation", isDefaultTarget: true },
    { name: "HoldCodeEndDate", level: "Obligation", isDefaultTarget: true, xlsxExport: { header: "HoldCodeEndDate", width: 20, isDate: true } },
    { name: "VRM", level: "Obligation", isDefaultTarget: true },
    { name: "VRM State", level: "Obligation", isDefaultTarget: true },
    { name: "OffenceDate", level: "Obligation" },
    { name: "Issued", level: "Obligation" },
    { name: "IssueDate", level: "Obligation", isDerived: true, sourceFields: ["Issued"], derivationFn: (s) => s.Issued },
    { name: "DueDate", level: "Obligation", isDefaultTarget: true },
    { name: "PRN_issue_date", level: "Obligation" },
    { name: "NFD_issue_date", level: "Obligation" },
    { name: "driver_licence_state", level: "Obligation" },
    { name: "driver_licence_no", level: "Obligation" },
    { name: "driver_licence_expiry", level: "Obligation", isDefaultTarget: true },
    { name: "prn_street_name", level: "Obligation" },
    { name: "prn_suburb", level: "Obligation" },
    { name: "prn_postcode", level: "Obligation" },
    { name: "prn_country", level: "Obligation" },
    { name: "prn_state", level: "Obligation" },
    { name: "KeyActiveWarrantExecutionActions", level: "Obligation", isDefaultTarget: true, xlsxExport: { header: "KeyActiveWarrantExecutionActions", width: 10 } },
    { name: "RecentDEBTDVSANCholds", level: "Obligation", isDefaultTarget: true, xlsxExport: { header: "RecentDEBTDVSANCholds", width: 10 } },
    { name: "ContraventionCode", level: "Obligation", isDefaultTarget: true },
    {
        name: "CaseRef",
        level: "Obligation",
        isDefaultTarget: true,
        condition: (s) => s.NoticeType !== '2B' && s.offence_description !== 'REFERRED COURT FINE'
    },
    {
        name: "challenge_code",
        level: "Obligation",
        isDerived: true,
        sourceFields: ["CurrentChallengeLogged"],
        derivationFn: (s) => {
            if (Object.prototype.hasOwnProperty.call(s, "CurrentChallengeLogged")) {
                if (!s.CurrentChallengeLogged || String(s.CurrentChallengeLogged).trim() === "") return false;
            }
            return undefined;
        }
    },
    { name: "challenge_date", level: "Obligation" },
    { name: "Obligation", level: "Obligation", isDerived: true, sourceFields: ["NoticeNumber"], isDefaultTarget: true, xlsxExport: { header: "Obligation", width: 10 }, derivationFn: (s) => s.NoticeNumber as string },
    { name: "Infringement", level: "Obligation", isDerived: true, sourceFields: ["infringement_number"], isDefaultTarget: true, xlsxExport: { header: "Infringement", width: 12 }, derivationFn: (s) => s.infringement_number as string },
    { name: "Agency", level: "Obligation", isDerived: true, sourceFields: ["enforcename", "altname_raw"], xlsxExport: { header: "Agency", width: 32 }, derivationFn: async (s) => (s.altname_raw === 'State' ? 'Victoria Police' : (s.enforcename || s.altname_raw)) },
    {
        name: "enforcename",
        level: "Obligation",
        isDerived: true,
        sourceFields: ["NoticeType", "altname"],
        isDefaultTarget: true,
        derivationFn: async ({ NoticeType, altname }) => {
            const staticMap: Record<string, string> = { "1A": "Traffic Camera Office", "1C": "Victoria Police Toll Enforcement" };
            if (typeof NoticeType === 'string' && staticMap[NoticeType]) return staticMap[NoticeType];
            return lookupAgencyData('enforcename', altname);
        }
    },
    { name: "Offence_Description", level: "Obligation", isDerived: true, isDefaultTarget: true, sourceFields: ["offence_description"], derivationFn: (s) => s.offence_description as string },
    { name: "Balance_Outstanding", level: "Obligation", isDerived: true, sourceFields: ["BalanceOutstanding"], isDefaultTarget: true, xlsxExport: { header: "Balance Outstanding", width: 10, isCurrency: true }, derivationFn: (s) => s.BalanceOutstanding },
    { name: "Status", level: "Obligation", isDerived: true, sourceFields: ["obligation_status"], isDefaultTarget: true, xlsxExport: { header: "Status", width: 8 }, derivationFn: (s) => s.obligation_status as string },
    { name: "Date_of_Offence", level: "Obligation", isDerived: true, sourceFields: ["OffenceDate"], isDefaultTarget: true, xlsxExport: { header: "Date of Offence", width: 10, isDate: true }, derivationFn: (s) => s.OffenceDate as string },
    { name: "Date of Issue", level: "Obligation", isDerived: true, sourceFields: ["Issued"], isDefaultTarget: true, xlsxExport: { header: "Date of Issue", width: 10, isDate: true }, derivationFn: (s) => s.Issued as string },
    {
        name: "Input Source",
        level: "Obligation",
        isDerived: true,
        sourceFields: ["NoticeType"],
        isDefaultTarget: true,
        xlsxExport: { header: "Input Source", width: 2.5 },
        derivationFn: (s) => s.NoticeType as string
    },
    { name: "PRN Issue Date", level: "Obligation", isDerived: true, sourceFields: ["PRN_issue_date"], isDefaultTarget: true, xlsxExport: { header: "PRN Issue Date", width: 10, isDate: true }, derivationFn: (s) => s.PRN_issue_date as string },
    { name: "NFD Issue Date", level: "Obligation", isDerived: true, sourceFields: ["NFD_issue_date"], isDefaultTarget: true, xlsxExport: { header: "NFD Issue Date", width: 10, isDate: true }, derivationFn: (s) => s.NFD_issue_date as string },
    { name: "VRM Number", level: "Obligation", isDerived: true, sourceFields: ["VRM"], isDefaultTarget: true, xlsxExport: { header: "VRM Number", width: 8 }, derivationFn: (s) => s.VRM as string },
    { name: "Driver License No.", level: "Obligation", isDerived: true, sourceFields: ["driver_licence_no"], isDefaultTarget: true, xlsxExport: { header: "Driver License No.", width: 10 }, derivationFn: (s) => s.driver_licence_no as string },
    { name: "Driver License State", level: "Obligation", isDerived: true, sourceFields: ["driver_licence_state"], isDefaultTarget: true, xlsxExport: { header: "Driver License State", width: 3 }, derivationFn: (s) => s.driver_licence_state as string },
    { name: "PRN Address", level: "Obligation", isDerived: true, sourceFields: ["prn_street_name", "prn_suburb", "prn_postcode", "prn_country", "prn_state"], isDefaultTarget: true, xlsxExport: { header: "PRN Address", width: 42 }, derivationFn: (s) => [s.prn_street_name, s.prn_suburb, s.prn_postcode, s.prn_state, s.prn_country].filter(Boolean).join(' ') },
    {
        name: "Challenge",
        level: "Obligation",
        isDerived: true,
        sourceFields: ["challenge_code"],
        isDefaultTarget: true,
        xlsxExport: { header: "Challenge", width: 10 },
        derivationFn: ({ challenge_code }) => {
            const map: Record<string, string> = { "E_EXCIRCUM": "Exceptional circumstances", "E_PERUNAWR": "Person unaware", "E_SPCIRCUM": "Special circumstances", "E_CONTRLAW": "Contrary to the law", "E_MISTAKID": "Mistake of identity" };
            return typeof challenge_code === 'string' ? (map[challenge_code] || challenge_code) : undefined;
        }
    },
    { name: "ReviewType", level: "Obligation", isDerived: true, sourceFields: ["challenge_code"], isDefaultTarget: true, derivationFn: ({ challenge_code }) => (typeof challenge_code === 'string' && challenge_code.includes('SPCIRCUM')) ? `ER Special: Special Circumstances` : `Review` },
    { name: "Address2", level: "Obligation", isDerived: true, sourceFields: ["altname"], isDefaultTarget: true, derivationFn: async ({ altname }) => lookupAgencyData('Address2', altname) },
    { name: "Address3", level: "Obligation", isDerived: true, sourceFields: ["altname"], isDefaultTarget: true, derivationFn: async ({ altname }) => lookupAgencyData('Address3', altname) },
    { name: "MOU", level: "Obligation", isDerived: true, sourceFields: ["altname"], isDefaultTarget: true, derivationFn: async ({ altname }) => lookupAgencyData('MOU', altname) },
    { name: "Email", level: "Obligation", isDerived: true, sourceFields: ["altname"], isDefaultTarget: true, derivationFn: async ({ altname }) => lookupAgencyData('Email', altname) },
    { name: "EmailAddress", level: "Obligation", isDerived: true, sourceFields: ["altname"], isDefaultTarget: true, derivationFn: async ({ altname }) => lookupAgencyData('EmailAddress', altname) },
    { name: "enforcementAgencyID", level: "Obligation", isDerived: true, sourceFields: ["altname"], isDefaultTarget: true, derivationFn: async ({ altname }) => lookupAgencyData('enforcementAgencyID', altname) },
    { name: "enforcementAgencyCode", level: "Obligation", isDerived: true, sourceFields: ["altname"], isDefaultTarget: true, derivationFn: async ({ altname }) => lookupAgencyData('enforcementAgencyCode', altname) },
    { name: "agency_code", level: "Obligation", isDerived: true, sourceFields: ["enforcementAgencyCode"], isDefaultTarget: true, derivationFn: (s) => s.enforcementAgencyCode as string },
    {
        name: "major_charge_description",
        level: "Obligation",
        isDefaultTarget: true,
        condition: (s) => s.NoticeType !== '2B'
    },
    { name: "Offence", level: "Obligation", isDerived: true, isDefaultTarget: true, xlsxExport: { header: "Offence Description", width: 45 }, sourceFields: ["offence_description", "NoticeType", "major_charge_description"], derivationFn: ({ offence_description, NoticeType, major_charge_description }) => (NoticeType === '2B' ? (major_charge_description as string) : (offence_description as string)) },
    {
        name: "court_of_issue",
        level: "Obligation",
        isDefaultTarget: true,
        condition: (s) => s.NoticeType !== '2B'
    },
    {
        name: "NFDlapsed",
        level: "Obligation",
        isDerived: true,
        sourceFields: ["DueDate", "obligation_status"],
        isDefaultTarget: true,
        derivationFn: ({ DueDate, obligation_status }) => {
            if (typeof DueDate !== 'string' || typeof obligation_status !== 'string') return undefined;
            const [d, m, y] = DueDate.split("/").map(Number);
            const isLate = new Date(y, m - 1, d).getTime() < Date.now();
            return obligation_status === 'SELDEA' || obligation_status === 'WARRNT' || (obligation_status === 'NFDP' && isLate);
        }
    }
]);

const FINANCIAL_FIELDS = defineFields([
    { name: "reduced_charge", level: "Obligation", isDefaultTarget: true, xlsxExport: { header: "reduced_charge", width: 8, isCurrency: true } },
    { name: "penalty_reminder_fee", level: "Obligation", isDefaultTarget: true },
    { name: "registration_fee", level: "Obligation", isDefaultTarget: true, xlsxExport: { header: "registration_fee", width: 8, isCurrency: true } },
    { name: "enforcement_fee", level: "Obligation", isDefaultTarget: true, xlsxExport: { header: "enforcement_fee", width: 8, isCurrency: true } },
    { name: "warrant_issue_fee", level: "Obligation", isDefaultTarget: true, xlsxExport: { header: "warrant_issue_fee", width: 8, isCurrency: true } },
    { name: "amount_waived", level: "Obligation", isDefaultTarget: true, xlsxExport: { header: "amount_waived", width: 8, isCurrency: true } },
    { name: "amount_paid", level: "Obligation", isDefaultTarget: true, xlsxExport: { header: "amount_paid", width: 8, isCurrency: true } },
    { name: "court_costs", level: "Obligation", isDefaultTarget: true, xlsxExport: { header: "Court Costs", width: 8, isCurrency: true } },
    { name: "court_fine", level: "Obligation", isDefaultTarget: true, xlsxExport: { header: "Court Fine Amount", width: 8, isCurrency: true } },
    { name: "returns", level: "Obligation", isDefaultTarget: true },
    { name: "pre-payments", level: "Obligation", isDefaultTarget: true },
    { name: "refunds", level: "Obligation", isDefaultTarget: true },
    { name: "reversed_fees", level: "Obligation", isDefaultTarget: true },
    { name: "cancellations", level: "Obligation", isDefaultTarget: true },
    { name: "writeoff", level: "Obligation", isDefaultTarget: true },
    { name: "hearing_costs", level: "Obligation", isDefaultTarget: true },
    { name: "transfer_in", level: "Obligation", isDefaultTarget: true },
    { name: "transfer_out", level: "Obligation", isDefaultTarget: true },
    { name: "court_courts_type_3", level: "Obligation", isDefaultTarget: true },
]);

/**
 * --- MERGED REGISTRY ---
 */
const FIELD_REGISTRY: ConfigField[] = [
    ...DEBTOR_FIELDS,
    ...OBLIGATION_FIELDS,
    ...FINANCIAL_FIELDS
];

/**
 * --- XLSX EXPORT ORDER ---
 * Explicitly define the sequence of columns for the spreadsheet.
 */
const XLSX_EXPORT_ORDER: DataFieldName[] = [
    "Obligation",
    "Infringement",
    "Agency",
    "Offence",
    "Balance_Outstanding",
    "Status",
    "Date_of_Offence",
    "Date of Issue",
    "Input Source",
    "PRN Issue Date",
    "NFD Issue Date",
    "VRM Number",
    "Driver License State",
    "Driver License No.",
    "PRN Address",
    "offence_location",
    "offence_time",
    "HoldCodeEndDate",
    "Challenge",
    "reduced_charge",
    "registration_fee",
    "enforcement_fee",
    "warrant_issue_fee",
    "amount_waived",
    "amount_paid",
    "court_costs",
    "court_fine",
    "RecentDEBTDVSANCholds",
    "KeyActiveWarrantExecutionActions"
];

/**
 * --- PROGRAMMATIC EXPORTS ---
 */

export const allDataFields = FIELD_REGISTRY.map((field) => {
    // Safely remove properties that are not part of MasterFieldDefinition
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { isDefaultTarget, xlsxExport, ...rest } = field;
    if ('derivationFn' in rest) delete (rest as { derivationFn?: unknown }).derivationFn;
    return rest as unknown as MasterFieldDefinition;
});

export const derivationFunctionsRegistry: DerivationLogicRegistry = FIELD_REGISTRY.reduce((acc, field) => {
    if ('derivationFn' in field && field.derivationFn) {
        acc[field.name as DataFieldName] = field.derivationFn as DerivationFunction;
    }
    return acc;
}, {} as DerivationLogicRegistry);

export const defaultTargetFields = new Set<DerivedFieldName | ExtractedFieldName>(
    FIELD_REGISTRY
        .filter(f => f.isDefaultTarget)
        .map(f => f.name) as (DerivedFieldName | ExtractedFieldName)[]
);

/**
 * Generates the columns for the XLSX converter in the PRECISE order defined above.
 */
export const fieldsForXLSXexport = XLSX_EXPORT_ORDER.map(fieldName => {
    const field = FIELD_REGISTRY.find(f => f.name === fieldName);
    if (!field || !field.xlsxExport) {
        throw new Error(`XLSX Export Error: Field "${fieldName}" is missing metadata in FIELD_REGISTRY.`);
    }
    return { ...field.xlsxExport, name: field.name };
}) as unknown as XlSXExportColumnDefinition;

/**
 * --- PAGE DEFINITIONS ---
 */
export const pageDefinitions = [
    {
        url: "https://${environment}.view.civicacloud.com.au/Taskflow/Forms/Management/TaskList.aspx?ProcessMode=User",
        id: 'TaskList',
        dependencies: [],
        level: 'Debtor',
        fields: [{ name: "UserID", selector: { type: "css", value: "#ctl00_mainContentPlaceHolder_taskListOwnerLabel" } }]
    },
    {
        id: "DebtorDetails",
        fields: [
            { name: "debtor_id", selector: { type: "css", value: "#DebtorDetailsCtrl_DebtorIdSearch" } },
            { name: "first_name_raw", selector: { type: "css", value: "#DebtorDetailsCtrl_firstnameTxt" } },
            { name: "last_name_raw", selector: { type: "css", value: "#DebtorDetailsCtrl_surnameTxt" } },
            { name: "total_amount_outstanding", selector: { type: "css", value: "#DebtorDetailsCtrl_totalAmountOutstandingTxt" } },
            { name: "company_name", selector: { type: "css", value: "#DebtorDetailsCtrl_companyNameTxt" } },
            { name: "street", selector: { type: "css", value: "#DebtorAddressCtrl_streetTxt" } },
            { name: "locality", selector: { type: "css", value: "#DebtorAddressCtrl_localityTxt" } },
            { name: "suburb", selector: { type: "css", value: "#DebtorAddressCtrl_cityTxt" } },
            { name: "state", selector: { type: "css", value: "#DebtorAddressCtrl_stateTxt" } },
            { name: "postcode", selector: { type: "css", value: "#DebtorAddressCtrl_postcodeTxt" } },
            { name: "country", selector: { type: "css", value: "#DebtorAddressCtrl_countryTxt" } },
            { name: "addressType", selector: { type: "css", value: "#DebtorAddressCtrl_typeTxt" } },
            { name: "Category", selector: { type: "css", value: "#DebtorDetailsCtrl_categoryTxt" } }
        ],
        dependencies: [],
        level: "Debtor",
        url: "https://${environment}.view.civicacloud.com.au/Traffic/Debtors/Forms/DebtorDetails.aspx"
    },
    {
        id: "DebtorAddresses",
        fields: [
            { name: "best_residential_address", selector: { type: "xpath", value: "id('DebtorAddressesCtrl_gridDebtorAddresses_tblData')/tbody/tr[td[count(id('DebtorAddressesCtrl_gridDebtorAddresses_tblData')/thead/tr/th[normalize-space(.)='Best Address']/preceding-sibling::th) + 1][normalize-space(.)='Y'] and td[count(id('DebtorAddressesCtrl_gridDebtorAddresses_tblData')/thead/tr/th[normalize-space(.)='Type']/preceding-sibling::th) + 1][normalize-space(.)='Residential Address']]/td[count(id('DebtorAddressesCtrl_gridDebtorAddresses_tblData')/thead/tr/th[normalize-space(.)='Address']/preceding-sibling::th) + 1]" } },
            { name: "best_postal_address", selector: { type: "xpath", value: "id('DebtorAddressesCtrl_gridDebtorAddresses_tblData')/tbody/tr[td[count(id('DebtorAddressesCtrl_gridDebtorAddresses_tblData')/thead/tr/th[normalize-space(.)='Best Address']/preceding-sibling::th) + 1][normalize-space(.)='Y'] and td[count(id('DebtorAddressesCtrl_gridDebtorAddresses_tblData')/thead/tr/th[normalize-space(.)='Type']/preceding-sibling::th) + 1][normalize-space(.)='Postal Address']]/td[count(id('DebtorAddressesCtrl_gridDebtorAddresses_tblData')/thead/tr/th[normalize-space(.)='Address']/preceding-sibling::th) + 1]" } },
            { name: "best_postal_postcode", selector: { type: "xpath", value: "id('DebtorAddressesCtrl_gridDebtorAddresses_tblData')/tbody/tr[td[count(id('DebtorAddressesCtrl_gridDebtorAddresses_tblData')/thead/tr/th[normalize-space(.)='Best Address']/preceding-sibling::th) + 1][normalize-space(.)='Y'] and td[count(id('DebtorAddressesCtrl_gridDebtorAddresses_tblData')/thead/tr/th[normalize-space(.)='Type']/preceding-sibling::th) + 1][normalize-space(.)='Postal Address']]/td[count(id('DebtorAddressesCtrl_gridDebtorAddresses_tblData')/thead/tr/th[normalize-space(.)='Postcode']/preceding-sibling::th) + 1]" } },
            { name: "best_residential_postcode", selector: { type: "xpath", value: "id('DebtorAddressesCtrl_gridDebtorAddresses_tblData')/tbody/tr[td[count(id('DebtorAddressesCtrl_gridDebtorAddresses_tblData')/thead/tr/th[normalize-space(.)='Best Address']/preceding-sibling::th) + 1][normalize-space(.)='Y'] and td[count(id('DebtorAddressesCtrl_gridDebtorAddresses_tblData')/thead/tr/th[normalize-space(.)='Type']/preceding-sibling::th) + 1][normalize-space(.)='Residential Address']]/td[count(id('DebtorAddressesCtrl_gridDebtorAddresses_tblData')/thead/tr/th[normalize-space(.)='Postcode']/preceding-sibling::th) + 1]" } },
            { name: "debtor_id", selector: { type: "css", value: "#DebtorDetailsCtrl_DebtorIdSearch" } },
            { name: "first_name_raw", selector: { type: "css", value: "#DebtorDetailsCtrl_firstnameTxt" } },
            { name: "last_name_raw", selector: { type: "css", value: "#DebtorDetailsCtrl_surnameTxt" } },
            { name: "total_amount_outstanding", selector: { type: "css", value: "#DebtorDetailsCtrl_totalAmountOutstandingTxt" } },
            { name: "company_name", selector: { type: "css", value: "#DebtorDetailsCtrl_companyNameTxt" } },
            { name: "Category", selector: { type: "css", value: "#DebtorDetailsCtrl_categoryTxt" } }
        ],
        dependencies: [],
        level: "Debtor",
        url: "https://${environment}.view.civicacloud.com.au/Traffic/Debtors/Forms/DebtorAddresses.aspx"
    },
    {
        id: "DebtorFurtherDetails",
        fields: [
            { name: "debtor_id", selector: { type: "css", value: "#DebtorDetailsCtrl_DebtorIdSearch" } },
            { name: "first_name_raw", selector: { type: "css", value: "#DebtorDetailsCtrl_firstnameTxt" } },
            { name: "last_name_raw", selector: { type: "css", value: "#DebtorDetailsCtrl_surnameTxt" } },
            { name: "date_of_birth", selector: { type: "css", value: "#DebtorIndividualCtrl_dateOfBirthTxt" } },
            { name: "company_name", selector: { type: "css", value: "#DebtorDetailsCtrl_companyNameTxt" } },
            { name: "total_amount_outstanding", selector: { type: "css", value: "#DebtorDetailsCtrl_totalAmountOutstandingTxt" } },
        ],
        dependencies: [],
        level: "Debtor",
        url: "https://${environment}.view.civicacloud.com.au/Traffic/Debtors/Forms/DebtorFurtherDetails.aspx"
    },
    {
        id: "DebtorProfileSummary",
        fields: [
            { name: "ACN_ARBN", selector: { type: "css", value: "#DebtorFurtherDetailsCtrl_companyNumberTxt" } },
            { name: "JAID", selector: { type: "css", value: "#DebtorFurtherDetailsCtrl_jaidNumberTxt" } },
            { name: "Gender", selector: { type: "css", value: "#DebtorFurtherDetailsCtrl_genderTxt" } },
            { name: "ABN", selector: { type: "css", value: "#DebtorFurtherDetailsCtrl_businessNumberTxt" } },
            { name: "CorrectionsReference", selector: { type: "css", value: "#DebtorFurtherDetailsCtrl_correctionsNumberTxt" } },
            { name: "date_of_birth", selector: { type: "css", value: "#DebtorFurtherDetailsCtrl_dateOfBirthTxt" } },
            { name: "DateOfDeregistration", selector: { type: "css", value: "#DebtorFurtherDetailsCtrl_dateOfDeregistrationTxt" } },
            { name: "InCustody", selector: { type: "css", value: "#DebtorFurtherDetailsCtrl_inCustodyTxt" } },
            { name: "DateOfDeath", selector: { type: "css", value: "#DebtorFurtherDetailsCtrl_dateOfDeathTxt" } },
            { name: "DateOfAdministration", selector: { type: "css", value: "#DebtorFurtherDetailsCtrl_dateOfAdministratonTxt" } },
            { name: "DateOfRelease", selector: { type: "css", value: "#DebtorFurtherDetailsCtrl_dateOfReleaseTxt" } },
            { name: "TaxiDriverNumber", selector: { type: "css", value: "#DebtorFurtherDetailsCtrl_taxiDriverNumberTxt" } },
            { name: "DateOfLiquidation", selector: { type: "css", value: "#DebtorFurtherDetailsCtrl_dateOfLiquidationTxt" } },
            { name: "DateOfBankruptcy", selector: { type: "css", value: "#DebtorFurtherDetailsCtrl_dateOfBankruptcyTxt" } },
            { name: "IndigenousStatus", selector: { type: "css", value: "#DebtorFurtherDetailsCtrl_indigenousTxt" } },
            { name: "OtherInformation", selector: { type: "css", value: "#DebtorFurtherDetailsCtrl_otherInformationTxt" } },
            { name: "debtor_id", selector: { type: "css", value: "#DebtorDetailsCtrl_DebtorIdSearch" } },
            { name: "first_name_raw", selector: { type: "css", value: "#DebtorDetailsCtrl_firstnameTxt" } },
            { name: "last_name_raw", selector: { type: "css", value: "#DebtorDetailsCtrl_surnameTxt" } },
            { name: "total_amount_outstanding", selector: { type: "css", value: "#DebtorDetailsCtrl_totalAmountOutstandingTxt" } },
            { name: "company_name", selector: { type: "css", value: "#DebtorDetailsCtrl_companyNameTxt" } },
            { name: "street", selector: { type: "css", value: "#DebtorAddressCtrl_streetTxt" } },
            { name: "locality", selector: { type: "css", value: "#DebtorAddressCtrl_localityTxt" } },
            { name: "suburb", selector: { type: "css", value: "#DebtorAddressCtrl_cityTxt" } },
            { name: "state", selector: { type: "css", value: "#DebtorAddressCtrl_stateTxt" } },
            { name: "postcode", selector: { type: "css", value: "#DebtorAddressCtrl_postcodeTxt" } },
            { name: "country", selector: { type: "css", value: "#DebtorAddressCtrl_countryTxt" } },
            { name: "addressType", selector: { type: "css", value: "#DebtorAddressCtrl_typeTxt" } },
            { name: "Category", selector: { type: "css", value: "#DebtorDetailsCtrl_categoryTxt" } }
        ],
        dependencies: [],
        level: "Debtor",
        url: "https://${environment}.view.civicacloud.com.au/Traffic/Debtors/Forms/DebtorProfileSummary.aspx"
    },
    {
        id: "DebtorObligationsSummary",
        fields: [
            {
                name: 'NoticeNumber',
                isList: true,
                selector: {
                    type: 'row-mapped',
                    rowSelector: '#DebtorNoticesCtrl_DebtorNoticesTable_tblData tbody tr',
                    fields: {
                        'NoticeNumber': { selector: 'td[id$="NoticeNumber"]' },
                        'infringement_number': { selector: 'td[id$="InfringementNo"]' },
                        'NoticeStatus': { selector: 'td[id$="NoticeStatus"]' },
                        'BalanceOutstanding': { selector: 'td[id$="BalanceOutstanding"]' },
                        'NoticeType': { selector: 'td[id$="NoticeType"]' },
                        'HoldCodeEndDate': { selector: 'td[id$="HoldCodeEndDate"]' },
                        'ContraventionCode': { selector: 'td[id$="ContraventionCode"]' },
                        'offence_description': { selector: 'td[id$="ContraventionCode"]', node: 'title' },
                        'OffenceDate': { selector: 'td[id$="OffenceDate"]' },
                        'DueDate': { selector: 'td[id$="DueDate"]' },
                        'CurrentChallengeLogged': { selector: 'td[id$="CurrentChallengeLogged"]' },
                        'KeyActiveWarrantExecutionActions': { selector: 'td[id$="KeyActiveWarrantExecutionActions"]' },
                        'RecentDEBTDVSANCholds': { selector: 'td[id$="RecentDEBTDVSANCholds"]' }
                    },
                    lookup: {
                        valueFieldName: 'CaseRef',
                        rowSelector: '#DebtorCourtOrdersCtrl_DebtorCourtFinesTable_tblData tbody tr',
                        keySelector: 'td[id$="NoticeNumber"]',
                        valueSelector: 'td[id$="CaseRef"]',
                    }
                }
            }
        ],
        dependencies: [],
        level: "Debtor",
        url: "https://${environment}.view.civicacloud.com.au/Traffic/Debtors/Forms/DebtorObligationsSummary.aspx"
    },
    {
        id: "DebtorDecisionReview",
        fields: [
            {
                name: "NoticeNumber",
                isList: true,
                selector: {
                    type: 'row-mapped',
                    rowSelector: '#DebtorDecisionCtrl_DebtorNoticesTable_tblData tbody tr',
                    fields: {
                        'NoticeNumber': { selector: 'td[id$="NoticeNumber"]' },
                        'challenge_code': { selector: 'td[id$="ChallengeCode"]' }
                    }
                }
            }
        ],
        dependencies: [],
        level: "Debtor",
        url: "https://${environment}.view.civicacloud.com.au/Traffic/Debtors/Forms/DebtorDecisionReview.aspx"
    },
    {
        id: "NoticeDetails",
        fields: [
            { name: "NoticeNumber", selector: { type: "css", value: "#NoticeInfo_txtNoticeNo" } },
            { name: "NoticeType", selector: { type: "css", value: "#NoticeInfo_lblProgressionPathText" } },
            { name: "infringement_number", selector: { type: "css", value: "#NoticeInfo_lblInfringementNo" } },
            { name: "DueDate", selector: { type: "css", value: "#NoticeInfo_lblNextPaymentDueDateBoxInfo" } },
            { name: "altname_raw", selector: { type: "css", value: "#NoticeInfo_lblAgencyCode" } },
            { name: "PRN_issue_date", selector: { type: "css", value: "#NoticeInfo_lblPrnIssueDateBoxInfo" } },
            { name: "NFD_issue_date", selector: { type: "css", value: "#NoticeInfo_lblNfdIssueDateBoxInfo" } },
            { name: "Issued", selector: { type: "css", value: "#NoticeInfo_lblInfringementIssueDateBoxInfo" } },
            { name: "OffenceDate", selector: { type: "css", value: "#NoticeInfo_lblIssueDt" } },
            { name: "offence_time", selector: { type: "css", value: "#NoticeInfo_lblIssueTm" } },
            { name: "offence_description", selector: { type: "css", value: "#NoticeInfo_lblContCode", node: 'title' } },
            { name: "offence_location", selector: { type: "css", value: "#NoticeInfo_lblLocdesc" } },
            { name: "VRM", selector: { type: "css", value: "#NoticeInfo_lblVrmNo" } },
            { name: "BalanceOutstanding", selector: { type: "css", value: "#NoticeInfo_lblBalanceOst" } },
            { name: "Challenge", selector: { type: "xpath", value: "substring-after(//li[starts-with(., 'Challenge reason: Enforcement - ')], 'Challenge reason: Enforcement - ')" } },
        ],
        dependencies: [],
        level: "Obligation",
        url: "https://${environment}.view.civicacloud.com.au/Traffic/Notices/forms/NoticesManagement/SearchNotice.aspx?&NoticeNo=${NoticeNumber}"
    },
    {
        id: "NoticeVehicleDetails",
        level: "Obligation",
        fields: [{ name: "VRM State", selector: { type: "css", value: "#lblVRMState" } }],
        dependencies: [],
        url: "https://${environment}.view.civicacloud.com.au/Traffic/Notices/Forms/NoticesManagement/NoticeVehicleDetails.aspx"
    },
    {
        id: "NoticeKeeper",
        url: "https://${environment}.view.civicacloud.com.au/Traffic/Notices/Forms/NoticesManagement/NoticeKeeper.aspx",
        dependencies: [],
        level: "Obligation",
        fields: [
            { name: "driver_licence_state", selector: { type: "css", value: "#lblDriverLicenceState" } },
            { name: "driver_licence_no", selector: { type: "css", value: "#lblDriverLicenceNo" } },
            { name: "driver_licence_expiry", selector: { type: "css", value: "#lblLicenceExpiryDate" } },
            { name: "prn_street_name", selector: { type: "css", value: "#lblSreetDescriptor" } },
            { name: "prn_suburb", selector: { type: "css", value: "#lblTown" } },
            { name: "prn_postcode", selector: { type: "css", value: "#lblPostCode" } },
            { name: "prn_country", selector: { type: "css", value: "#lblCountry" } },
            { name: "prn_state", selector: { type: "css", value: "#lblAdminArea" } }
        ]
    },
    {
        id: "NoticeAudit",
        dependencies: [],
        level: "Obligation",
        url: "https://${environment}.view.civicacloud.com.au/Traffic/Notices/Forms/NoticesManagement/NoticeAudit.aspx",
        fields: [{ name: "warrant_fee_waived", selector: { type: "xpath", value: "//tr[./td[contains(text(),'RWARRNT')]]/td[position()=count(//td[a/text()='Amount($)']/preceding-sibling::td)+1]" } }]
    },
    {
        id: "NoticeAudit2",
        dependencies: [{ id: "NoticeAudit", literalParams: [{ name: 'htxtPage', value: '2' }] }],
        level: "Obligation",
        url: "https://${environment}.view.civicacloud.com.au/Traffic/Notices/Forms/NoticesManagement/NoticeAudit.aspx",
        fields: [{ name: "warrant_fee_waived", selector: { type: "xpath", value: "//tr[./td[contains(text(),'RWARRNT')]]/td[position()=count(//td[a/text()='Amount($)']/preceding-sibling::td)+1]" } }],
        method: "POST"
    },
    {
        id: "FinancialSummary",
        fields: [
            { name: "reduced_charge", selector: { type: "css", value: "#lblReducedCharge" } },
            { name: "penalty_reminder_fee", selector: { type: "css", value: "#lblPenaltyReminderFee" } },
            { name: "registration_fee", selector: { type: "css", value: "#lblRegistrationFee" } },
            { name: "enforcement_fee", selector: { type: "css", value: "#lblEnforcementFee" } },
            { name: "amount_waived", selector: { type: "css", value: "#lblWaiveAmt" } },
            { name: "amount_paid", selector: { type: "css", value: "#lblPayments" } },
            { name: "court_costs", selector: { type: "css", value: "#lbl2BCRTCs" } },
            { name: "court_fine", selector: { type: "css", value: "#lbl2BCRTs" } },
            { name: "warrant_issue_fee", selector: { type: "css", value: "#lblWarrantIssueFee" } },
            { name: "pre-payments", selector: { type: "css", value: "#lblPrePayments" } },
            { name: "returns", selector: { type: "css", value: "#lblReturnChqs" } },
            { name: "refunds", selector: { type: "css", value: "#lblRefunds" } },
            { name: "reversed_fees", selector: { type: "css", value: "#lblReversedFees" } },
            { name: "cancellations", selector: { type: "css", value: "#lblCancellations" } },
            { name: "writeoff", selector: { type: "css", value: "#lblWritteoffs" } },
            { name: "hearing_costs", selector: { type: "css", value: "#lblAppealCosts" } },
            { name: "transfer_in", selector: { type: "css", value: "#lblTransferIns" } },
            { name: "transfer_out", selector: { type: "css", value: "#lblTransferOuts" } },
            { name: "court_courts_type_3", selector: { type: "css", value: "#lblCourtCosts" } }
        ],
        dependencies: [{ id: "NoticeAudit", literalParams: [{ name: 'btnSummary.x', value: '0' }, { name: 'btnSummary.y', value: '0' }] }],
        level: "Obligation",
        url: "https://${environment}.view.civicacloud.com.au/Traffic/Notices/Forms/NoticesManagement/NoticeAudit.aspx",
        method: "POST"
    },
    {
        id: "DebtorCourtFines",
        level: "Obligation",
        condition: (s: CollectedData) => s.NoticeType === '2B',
        url: "https://${environment}.view.civicacloud.com.au/Traffic/Debtors/Forms/DebtorCourtFines.aspx?CaseRef=${CaseRef}&NoticeNo=${NoticeNumber}&DebtorId=${debtor_id}",
        dependencies: [],
        fields: [{ name: "court_of_issue", selector: { type: "css", value: "#CourtResultCtrl_DebtorCourtResultsTable_Row0CellDataCourtLocation" } }]
    },
    {
        id: "DebtorCourtFines2",
        level: "Obligation",
        condition: (s: CollectedData) => s.NoticeType === '2B',
        url: "https://${environment}.view.civicacloud.com.au/Traffic/Debtors/Forms/DebtorCourtFines.aspx?CaseRef=${CaseRef}&NoticeNo=${NoticeNumber}&DebtorId=${debtor_id}",
        dependencies: [{ id: "DebtorCourtFines", literalParams: [{ name: "__EVENTTARGET", value: "CourtResultCtrl$DebtorCourtResultsTable" }, { name: "__EVENTARGUMENT", value: "RowClicked-0" }] }],
        fields: [
            { name: "altname_raw", selector: { type: "xpath", value: "//table[@id='DebtComponentDisbursement_DebtorDisbursementTable_tblData']//tr[td[normalize-space()='P'] or (td[normalize-space()='S'] and not(//table[@id='DebtComponentDisbursement_DebtorDisbursementTable_tblData']//td[normalize-space()='P']))]/td[count(//table[@id='DebtComponentDisbursement_DebtorDisbursementTable_tblData']//th[contains(text(),'Name')]/preceding-sibling::th)+1]" } },
            { name: "major_charge_description", selector: { type: "css", value: "#OffenceDetailsTable_DebtorOffenceDetailsTable_Row0CellDataChargeDescription" } }
        ]
    }
] as const satisfies MasterPageDefinition[];