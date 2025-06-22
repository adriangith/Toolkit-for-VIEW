import { groupByObject, letterGen } from "./letter-logic"
import { ProcessConfig } from "./types";
import { bulkAdd } from "./bulk";
import { Properties } from "./types";
import { Message, VIEWsubmitParams } from "./types";

// --- Type Definitions ---

// Type for the object created from FormData
type FormDataObject = Record<string, FormDataEntryValue>; // FormDataEntryValue is string | File

// Interface for individual submission steps
interface SubmitInstruction {
  url: string; // URL to fetch
  group?: string | "Ungrouped"; // Used by groupBy function. Default: "Ungrouped"
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "OPTIONS" | "HEAD"; // Default: "POST"
  body?: boolean; // Default: true, whether to include body
  urlParams?: Record<string, string> | ((doc?: Document, set?: string, props?: Properties) => Record<string, string> | Promise<Record<string, string>>);
  formDataTarget?: number; // Index in previousFormData to use
  clearWizardFormData?: boolean; // Flag to clear current page's form data
  clearVIEWFormData?: boolean; // Flag to clear accumulated form data
  optional?: (doc?: Document, props?: Properties) => boolean; // Condition to skip this step
  after?: (doc?: Document) => void; // Callback after successful fetch/parse
  next?: boolean; // Flag for early return from the entire function
  attempts?: number; // Retries for parsePage
  sameorigin?: boolean; // Determines fetch method (content script vs background)
}

// Type for dynamic grouping parameters
// The value can be a function returning an array of parameters, or just an array.
type GroupedRepeat = Record<string, (props?: Properties) => Record<string, string>[]>;

// Interface for the main configuration object
export interface ScraperSteps {
  steps: SubmitInstruction[]; // Array of submission steps - Changed from 'submit' to 'steps'
  action?: (doc?: Document) => void; // Initial action
  groupRepeats?: GroupedRepeat; // Dynamic parameters for groups
  afterAction?: (doc?: Document, props?: Properties) => void; // Action after all loops complete
  next?: boolean; // Final return flag for the entire function
}

// --- Constants and Stub Functions ---

const processRuleSet = {
  'ObligationSummaryScraperRuleSet': letterGen,
  'Bulk Update': bulkAdd
}

// Stub function for development/testing
function runFetchInContentScript(url: string, options: RequestInit): Promise<Response> {
  console.warn('Using stub implementation of runFetchInContentScript');
  // Just use regular fetch for now, will be replaced with actual implementation later
  return fetch(url, options);
}

// Export the stub function
export { runFetchInContentScript };

// --- Helper Functions ---

/**
 * Extracts form data from the first <form> element found in a Document.
 * @param {Document} targetDocument - The Document to search for a form.
 * @returns An object containing the form data.
 */
export function getFormData(targetDocument: Document | undefined) {
  if (!(targetDocument instanceof Document)) return {};
  // Find the first form element, or create a dummy one if none exists to avoid errors with FormData constructor
  const formElement = targetDocument.querySelector<HTMLFormElement>("form") ?? document.createElement('form');
  const formData = new FormData(formElement);
  const formDataObject: FormDataObject = {};
  formData.forEach((value, key) => {
    formDataObject[key] = value;
  });
  return formDataObject;
}

/**
 * Parses the text content of a Response object into an HTML Document.
 * Includes a retry mechanism if reading the response body times out.
 * @param {Response} vDocument - The Response object from a fetch call.
 * @param {string} url - The original URL fetched (for retries).
 * @param {RequestInit} fetchOptions - The original fetch options (for retries).
 * @returns {Promise<Document>} - A promise resolving to the parsed Document.
 */
async function parsePage(vDocument: Response, url: string, fetchOptions: RequestInit): Promise<Document> {
  // Helper to get response body with timeout
  const getBodyWithTimeout = (response: Response, timeout = 10000): Promise<string> => {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`getBodyWithTimeout timed out after ${timeout}ms for URL: ${url}`));
      }, timeout);

      response.text().then(
        (text) => {
          clearTimeout(timer);
          resolve(text);
        },
        (err) => {
          clearTimeout(timer);
          reject(err); // Propagate fetch error
        }
      );
    });
  };

  let htmlText: string;
  try {
    htmlText = await getBodyWithTimeout(vDocument);
  } catch (e) {
    console.warn(`Initial parsing failed or timed out for ${url}, retrying fetch...`, e);
    // Retry the fetch and parsing on error/timeout
    const retryResponse = await fetch(url, fetchOptions); // Assuming fetch handles its own retries
    htmlText = await getBodyWithTimeout(retryResponse); // Try getting body again
  }

  const parser = new DOMParser();
  const parsedDoc = parser.parseFromString(htmlText, "text/html");
  return parsedDoc;
}

async function VIEWsubmit({
  properties,
  scraperStepsOption,
  initialParsedDocument: parsedDocument
}: VIEWsubmitParams): Promise<Document | undefined> {

  const previousFormData: FormDataObject[] = []; // History of formData objects

  const scraperSteps: ProcessConfig = processRuleSet[scraperStepsOption](properties)

  // Group submission instructions
  const groups = groupByObject(scraperSteps.steps, "group"); // Use the moved GroupedData type

  const groupedRepeats = scraperSteps.stepGroup || { Ungrouped: () => [{}] } as GroupedRepeat; // Use the moved GroupedRepeat type

  // Iterate through each group of submit instructions
  for (const [groupName,
    group] of Object.entries(groups)) {
    // Resolve the parameters for this group's iterations concisely
    const repeatDefinition = groupedRepeats[groupName];
    const iterationReferences = typeof repeatDefinition === 'function'
      ? (repeatDefinition(properties) || [{}]) // Call function or default
      : (repeatDefinition || [{}]);           // Use value or default

    // Iterate through the resolved parameters (now guaranteed to be an array)
    for (const iterationReference of await iterationReferences) {
      for (const step of group) {
        if (properties.portDisconnected) throw "Window Closed";
        if (step.optional && step.optional(parsedDocument, properties) === false) continue;
        const urlParams = await (typeof step.urlParams === "function" ? step.urlParams({ document: parsedDocument, iterationReference: iterationReference, properties: properties }) : step.urlParams);

        /** Form data embeded in  */
        let wizardFormData = await getFormData(document);
        let lastFormData = await getFormData(parsedDocument);
        previousFormData.push(lastFormData);
        const index = step.formDataTarget || previousFormData.length - 1;
        lastFormData = previousFormData[Number(index)];
        if (step.clearWizardFormData) { wizardFormData = {} };
        if (step.clearVIEWFormData) { lastFormData = {} };
        if (urlParams) { lastFormData = { ...lastFormData, ...urlParams, ...wizardFormData } }
        const form_data = new FormData();
        for (const key in lastFormData) { form_data.append(key, lastFormData[key]); }

        const fetchOptions = {
          method: step.method || "POST",
          headers: { "x-civica-application": "CE", "sec-fetch-site": "same-origin" },
          body: step.body !== false ? form_data : undefined
        }
        let vDocument
        if (!step.url) {
          throw "No URL provided for submission";
        }
        console.log("-------------------------");
        console.log("Fetching:", step.url);
        if (step.sameorigin) {
          vDocument = await fetch(step.url, fetchOptions);
        } else {
          vDocument = await fetch(step.url, fetchOptions);
          parsedDocument = await parsePage(vDocument, step.url, fetchOptions);
          wizardFormData = await getFormData(parsedDocument);
        }
        (function (afterAction) {
          if (afterAction) afterAction({ document: parsedDocument, properties })
        })(step.afterAction)
        if (step.next === true) {
          return undefined
        }
      }
    }
  }
  await (async function (afterAction) {
    if (afterAction) await afterAction({ document: parsedDocument, properties })
  })(scraperSteps.afterAction)

  if (scraperSteps.next === true) {
    return undefined;
  }

  if (scraperSteps.next === false) {
    return undefined;
  }

  // Default return: the last parsed document or false if undefined
  return parsedDocument
}
export default VIEWsubmit;