import { Properties, groupByObject, processConfig, letterGen } from "./letter-logic"
import { Message } from "./obligations"


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

// Interface for parameters passed to the main VIEWsubmit function
export type VIEWsubmitParams = {
  properties: Properties;
  scraperStepsOption: 'ObligationSummaryScraperRuleSet'; // Or other keys from processRuleSet
  incrementor?: number; // Optional incrementor (usage depends on context)
  additionalData?: string; // Optional additional data string
  initialParsedDocument?: Document; // Optional starting document
}


// --- Constants and Stub Functions ---

const processRuleSet = {
  'ObligationSummaryScraperRuleSet': letterGen
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
 * @returns {Promise<FormDataObject>} - A promise resolving to an object containing the form data.
 */
async function getFormData(targetDocument: Document | undefined): Promise<FormDataObject> {
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


// --- Main VIEWsubmit Function ---

/**
 * Handles a potentially multi-step view/form submission process.
 *
 * @param data - (Currently unused in snippet) Additional data. Type 'any' for flexibility.
 * @param incrementor - (Currently unused in snippet) Function or object for incrementing. Type 'any'.
 * @param initialParsedDocument - The parsed Document from a *previous* step, if applicable.
 * @param ScraperSteps - Configuration object defining the submission steps and logic.
 * @param [properties={}] - Optional object containing state or configuration flags.
 * @returns {Promise<Document | boolean>} - Resolves to the final parsed Document, or a boolean based on 'next' flags.
 * @throws {string | Error} - Throws if properties.portDisconnected is true.
 */



chrome.runtime.onMessage.addListener((msg: Message<VIEWsubmitParams>, sender, sendResponse) => {
  if (msg.type !== "VIEWsubmit") return;
  const VIEWSubmitParams = msg.data;
  VIEWsubmit(VIEWSubmitParams).then((res) => {
    sendResponse({
      message: JSON.stringify(res),
    });
  })
    .catch((err) => {
      sendResponse(
        {
          message: JSON.stringify(err, Object.getOwnPropertyNames(err)),
        }
      );
      throw err;
    });
  return true;
});

async function VIEWsubmit({
  properties,
  scraperStepsOption,
  initialParsedDocument
}: VIEWsubmitParams): Promise<Document | boolean> {

  const formDataCollection: FormDataObject[] = []; // History of formData objects
  let lastParsedDocument: Document | undefined = initialParsedDocument;

  const scraperSteps: processConfig = processRuleSet[scraperStepsOption](properties)

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
      for (const submitInstructions of group) {
        if (properties.portDisconnected) throw "Window Closed";
        if (submitInstructions.optional && submitInstructions.optional(initialParsedDocument, properties) === false) continue;
        const urlParams = await (typeof submitInstructions.urlParams === "function" ? submitInstructions.urlParams({ that: initialParsedDocument, iterationReference: iterationReference, properties: properties }) : submitInstructions.urlParams);
        //Get form data, if any, from wizard page
        let lastFetchFormData = await getFormData(lastParsedDocument);
        let wizardFormData = await getFormData(document);
        formDataCollection.push(lastFetchFormData);
        const index = submitInstructions.formDataTarget || formDataCollection.length - 1;
        lastFetchFormData = formDataCollection[Number(index)];
        if (submitInstructions.clearWizardFormData) { wizardFormData = {} };
        if (submitInstructions.clearVIEWFormData) { lastFetchFormData = {} };
        if (urlParams) { lastFetchFormData = { ...lastFetchFormData, ...urlParams, ...wizardFormData } }
        const form_data = new FormData();
        for (const key in lastFetchFormData) { form_data.append(key, lastFetchFormData[key]); }

        const fetchOptions = {
          method: submitInstructions.method || "POST",
          headers: { "x-civica-application": "CE", "sec-fetch-site": "same-origin" },
          body: submitInstructions.body ? form_data : undefined
        }
        let vDocument
        if (!submitInstructions.url) {
          throw "No URL provided for submission";
        }
        console.log("-------------------------");
        console.log("Fetching:", submitInstructions.url);
        if (submitInstructions.sameorigin) {
          vDocument = await fetch(submitInstructions.url, fetchOptions);
        } else {
          vDocument = await fetch(submitInstructions.url, fetchOptions);
          lastParsedDocument = await parsePage(vDocument, submitInstructions.url, fetchOptions);
          wizardFormData = await getFormData(lastParsedDocument);
        }
        (function (afterAction) {
          if (afterAction) afterAction({ document: lastParsedDocument, properties })
        })(submitInstructions.afterAction)
        if (submitInstructions.next === true) {
          return true
        }
      }
    }
  }
  await (async function (afterAction) {
    if (afterAction) await afterAction({ document: lastParsedDocument, properties })
  })(scraperSteps.afterAction)

  if (scraperSteps.next === true) {
    return true
  }

  if (scraperSteps.next === false) {
    return false
  }

  // Default return: the last parsed document or false if undefined
  return lastParsedDocument || false;
}
export default VIEWsubmit;