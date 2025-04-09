declare function runFetchInContentScript(url?: string | URL, options?: RequestInit): Promise<Document>;

// Type for the object created from FormData
type FormDataObject = Record<string, FormDataEntryValue>; // FormDataEntryValue is string | File

// Interface for individual submission steps
interface SubmitInstruction {
  url?: string | ((doc?: Document, set?: any, props?: Properties) => string | Promise<string>);
  group?: string; // Used by groupBy
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "OPTIONS" | "HEAD"; // Common HTTP methods
  body?: boolean; // Default: true, whether to include body
  urlParams?: Record<string, any> | ((doc?: Document, set?: any, props?: Properties) => Record<string, any> | Promise<Record<string, any>>);
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
// Using 'any' for the array elements as structure isn't defined here.
type GroupedRepeats = Record<string, ((props?: Properties) => any[]) | any[]>;

// Interface for the main configuration object
export interface DataParams {
  submit: SubmitInstruction[]; // Array of submission steps
  action?: (doc?: Document) => void; // Initial action
  groupRepeats?: GroupedRepeats; // Dynamic parameters for groups
  afterAction?: (doc?: Document, props?: Properties) => void; // Action after all loops complete
  next?: boolean; // Final return flag for the entire function
}

// Interface for the properties object passed around
interface Properties {
  portDisconnected?: boolean;
  // Add other known properties here
  [key: string]: any; // Allow other arbitrary properties
}

// --- Helper Functions ---

/**
 * Groups an array of objects by a specified property.
 * Items without the property or where the property is undefined are placed in "Ungrouped".
 * @template T - The type of objects in the array.
 * @param {T[]} arr - The array to group.
 * @param {string} property - The name of the property to group by.
 * @returns {Record<string, T[]>} - An object where keys are property values and values are arrays of matching objects.
 */
function groupBy<T extends Record<string, any>>(arr: T[], property: string): Record<string, T[]> {
  return arr.reduce((memo: Record<string, T[]>, x: T) => {
    let key = x[property];
    // Assign to 'Ungrouped' if the property doesn't exist or is undefined
    if (key === undefined || key === null) {
      key = "Ungrouped";
    } else {
      key = String(key); // Ensure key is a string
    }

    if (!memo[key]) {
      memo[key] = [];
    }
    memo[key].push(x);
    return memo;
  }, {});
}

/**
 * Extracts form data from the first <form> element found in a Document.
 * @param {Document} targetDocument - The Document to search for a form.
 * @returns {Promise<FormDataObject>} - A promise resolving to an object containing the form data.
 */
async function getFormData(targetDocument: Document): Promise<FormDataObject> {
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
 * @param dataParams - Configuration object defining the submission steps and logic.
 * @param [properties={}] - Optional object containing state or configuration flags.
 * @returns {Promise<Document | boolean>} - Resolves to the final parsed Document, or a boolean based on 'next' flags.
 * @throws {string | Error} - Throws if properties.portDisconnected is true.
 */
async function VIEWsubmit(
  data: any, // Unused in snippet, keep as any or specify if known
  incrementor: any, // Unused in snippet, keep as any or specify if known
  initialParsedDocument: Document | undefined,
  dataParams: DataParams,
  properties: Properties = {}
): Promise<Document | boolean> {

  let currentFormData: FormDataObject = {}; // Form data accumulated/used in the current step
  const previousFormData: FormDataObject[] = []; // History of formData objects
  let lastParsedDocument: Document | undefined = initialParsedDocument;

  // Get initial form data from the previous step's document, if provided
  if (lastParsedDocument) {
    currentFormData = await getFormData(lastParsedDocument);
  };

  // Execute initial action, if defined
  dataParams.action?.(lastParsedDocument);

  // Group submission instructions
  const groups = groupBy<SubmitInstruction>(dataParams.submit, "group"); // Explicit generic type

  const groupedRepeats = dataParams.groupRepeats || { Ungrouped: () => [{}] }; // Default repeat structure

  // Iterate through each group of submit instructions
  for (const [groupName, group] of Object.entries(groups)) {
    // Determine dynamic parameters for this group, default to [{}] for one iteration
    const groupRepeatsFnOrArray = groupedRepeats[groupName];
    const dynamicParams: any[] = typeof groupRepeatsFnOrArray === "function"
      ? groupRepeatsFnOrArray(properties)
      : (Array.isArray(groupRepeatsFnOrArray) ? groupRepeatsFnOrArray : [{}]); // Ensure it's an array

    // Iterate through dynamic parameter sets for the current group
    for (const set of dynamicParams) {
      // Iterate through instructions within the current group and set
      for (const submitInstructions of group) {
        if (properties.portDisconnected) {
          throw new Error("Window Closed"); // Throw an Error object
        }

        // Check if this instruction step is optional and should be skipped
        if (submitInstructions.optional?.(lastParsedDocument, properties) === false) {
          continue; // Skip this instruction
        }

        // Calculate URL parameters, handling sync/async functions or static objects
        let urlParamsResult = typeof submitInstructions.urlParams === "function"
          ? submitInstructions.urlParams(lastParsedDocument, set, properties)
          : submitInstructions.urlParams;
        // Await if the result is a Promise, otherwise use directly
        const resolvedUrlParams: Record<string, any> | undefined = await urlParamsResult;

        // Get form data from the *current* wizard page (the live document)
        let wizardPageFormData = await getFormData(document); // Use global 'document'

        // Store the current state of formData before potentially modifying it
        previousFormData.push(currentFormData);

        // Determine which previous formData state to use as the base (default: last one)
        const index = submitInstructions.formDataTarget ?? previousFormData.length - 1;
        if (index >= 0 && index < previousFormData.length) {
          currentFormData = previousFormData[index];
        } else {
          console.warn(`formDataTarget index ${index} out of bounds. Using last available form data.`);
          currentFormData = previousFormData[previousFormData.length - 1] || {};
        }


        // Optionally clear form data based on flags
        if (submitInstructions.clearWizardFormData) {
          wizardPageFormData = {};
        }
        if (submitInstructions.clearVIEWFormData) {
          currentFormData = {};
        }

        // Merge form data: base + URL params + current wizard page data
        // Ensure resolvedUrlParams is an object before spreading
        const mergedFormData = {
          ...currentFormData,
          ...(resolvedUrlParams && typeof resolvedUrlParams === 'object' ? resolvedUrlParams : {}),
          ...wizardPageFormData
        };

        // Create FormData for the fetch request body
        const fetchFormData = new FormData();
        for (const key in mergedFormData) {
          // FormData can handle string or Blob/File. Ensure value is not object/array.
          if (Object.prototype.hasOwnProperty.call(mergedFormData, key) && typeof mergedFormData[key] !== 'object') {
            fetchFormData.append(key, mergedFormData[key]);
          } else if (mergedFormData[key] instanceof File || mergedFormData[key] instanceof Blob) {
            fetchFormData.append(key, mergedFormData[key]);
          }
          // Note: Complex objects/arrays are skipped here. Handle serialization if needed.
        }

        // Prepare fetch options
        const fetchOptions: RequestInit = {
          method: submitInstructions.method || "POST",
          headers: {
            "x-civica-application": "CE",
            "sec-fetch-site": "same-origin",
            // Add other headers if necessary
          },
        };

        if (submitInstructions.body !== false) { // Include body unless explicitly false
          fetchOptions.body = fetchFormData;
        }

        // Determine the fetch URL, handling sync/async functions
        let urlResult = typeof submitInstructions.url === 'function'
          ? submitInstructions.url(lastParsedDocument, set, properties)
          : submitInstructions.url;
        const targetUrl: string | undefined = await urlResult; // Await if it's a promise


        console.log("-------------------------");
        console.log(`Workspaceing: ${targetUrl} with method ${fetchOptions.method}`);
        // Perform the fetch operation
        let fetchResponse: Response | Document; // Type depends on branch
        
        // Ensure targetUrl is defined before proceeding
        if (!targetUrl) {
          throw new Error("Target URL is undefined for fetch operation");
        }
        
        if (submitInstructions.sameorigin) {
          // Assumes runFetchInContentScript directly returns a parsed Document
          fetchResponse = await runFetchInContentScript(targetUrl, fetchOptions);
          lastParsedDocument = fetchResponse; // Update lastParsedDocument directly
        } else {
          fetchResponse = await fetch(targetUrl, fetchOptions);
          const attempts = submitInstructions.attempts || 3; // Use specified attempts or default
          // Parse the response (handles retries internally if needed)
          lastParsedDocument = await parsePage(fetchResponse, targetUrl, fetchOptions);
        }


        // Update formData based on the *newly* parsed document for the next iteration/step
        currentFormData = await getFormData(lastParsedDocument);


        // Execute post-fetch action for this instruction
        submitInstructions.after?.(lastParsedDocument);

        // Check for early return based on instruction flag
        if (submitInstructions.next === true) {
          return true;
        }
      } // End loop: submitInstructions
    } // End loop: set (dynamicParams)
  } // End loop: groupName (groups)

  // Execute final action after all groups/steps are processed
  dataParams.afterAction?.(lastParsedDocument, properties);

  // Final return based on dataParams flag
  if (dataParams.next === true) {
    return true;
  }
  if (dataParams.next === false) {
    return false;
  }

  // Default return: the last parsed document or false if undefined
  return lastParsedDocument || false;
}

export default VIEWsubmit;