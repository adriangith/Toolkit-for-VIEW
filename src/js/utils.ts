import { BulkActionProperties, ChromeMessageListenerCallback, ChromeOnUpdatedHandler, CollectedData, ErrorWithMessage, FormDataObject, Message } from "./types";

// in utils.ts (or a new config-processor.ts)

import { MasterPageDefinition } from "./types";

/**
 * Pre-processes page definitions to make them easier for the optimiser to read.
 * It finds complex selectors (like 'row-mapped') and populates a simple
 * list of all fields that page can provide.
 * @param pageDefs The raw page definitions.
 * @returns The page definitions with an added `_optimiserFields` property.
 */
export function expandPageDefinitionsForOptimiser(
    pageDefs: MasterPageDefinition[]
): MasterPageDefinition[] {
    return pageDefs.map(pageDef => {
        const allFields = new Set<string>();

        pageDef.fields.forEach(field => {
            // Add the top-level field name
            allFields.add(field.name);

            // Check if the selector is a complex object we need to parse
            if (typeof field.selector === 'object' && 'type' in field.selector) {
                // --- Logic for your specific row-mapped type ---
                if (field.selector.type === 'row-mapped') {
                    // Add all fields from the 'fields' object
                    Object.keys(field.selector.fields).forEach(fieldName => allFields.add(fieldName));

                    // Add the field from the 'lookup' object
                    if (field.selector.lookup) {
                        allFields.add(field.selector.lookup.valueFieldName);
                    }
                }
                // You could add more `else if` blocks here for other future complex types
            }
        });

        // Return a new object with the original properties plus our new one
        return {
            ...pageDef,
            _optimiserFields: Array.from(allFields) // Add the generated list
        };
    });
}

export function formatDate(date: Date = new Date()): string {
    function padTo2Digits(num: number): string {
        return num.toString().padStart(2, '0');
    }
    return [
        date.getFullYear(),
        padTo2Digits(date.getMonth() + 1), // Month is 0-indexed
        padTo2Digits(date.getDate()),
    ].join('');
}

export function toTitleCase(str: string | undefined): string {
    if (typeof str !== 'string') return '';
    return str.replace(
        /\w\S*/g,
        function (txt) {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        }
    );
}
export const toTitleCaseHypen = function (str: string): string {
    return str.toLowerCase().replace(/(?:^|\s|\/|-)\w/g, function (match) {
        return match.toUpperCase();
    });
};
function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
    return (
        typeof error === 'object' &&
        error !== null &&
        'message' in error &&
        typeof (error as Record<string, unknown>).message === 'string'
    );
}
function toErrorWithMessage(maybeError: unknown): ErrorWithMessage {
    if (isErrorWithMessage(maybeError)) return maybeError;

    try {
        return new Error(JSON.stringify(maybeError));
    } catch {
        // fallback in case there's an error stringifying the maybeError
        // like with circular references for example.
        return new Error(String(maybeError));
    }
}
export function getErrorMessage(error: unknown) {
    return toErrorWithMessage(error).message;
}
/**
 * Substitutes values into a template string.
 * @param template - The template string containing placeholders in the format ${key}.
 * @param values - An object containing key-value pairs to substitute into the template.
 * @returns - The template string with placeholders replaced by corresponding values.
 */
export function templateSubstitution<T>(template: string, values: T): string {
    return template.replace(/\${([^{}]*)}/g, (match, expression: string) => {
        const value = expression.split('.').reduce<unknown>((obj, key) => {
            if (obj && typeof obj === 'object' && key in obj) {
                return (obj as Record<string, unknown>)[key];
            }
            return undefined;
        }, values);

        return value !== undefined ? String(value) : match;
    });
}
/**
 * Groups an array of objects based on a specified property.
 * @param arr - The array of objects to group.
 * @param property - The property to group by.
 * @template O - The type of objects in the array.
 * @returns - An array of objects where each object contains the grouped property and an array of objects that share that property.
 */

export function groupByArray<O extends object, K extends keyof O>(arr: O[], property: K) {
    return arr.reduce<(Record<K, O[K]> & Record<"a", O[]>)[]>(function (memo, x) {
        if (!memo.some(item => item[property] === x[property])) { memo.push({ [property]: x[property], a: [] } as unknown as (Record<K, O[K]> & Record<"a" | K, O[]>)); }
        memo.map(itm => itm[property] === x[property] && itm.a.push(x));
        return memo;
    }, []);
}
/** Utility functions */
/**
 * Watches for an element matching a selector or XPath to appear or disappear
 * @param selector - CSS selector or XPath expression (prefix with 'xpath:')
 * @param onAppear - Callback when element appears. If an HTML element is returned, the element becomes available to the onDisappear callback.
 * @param onDisappear - Callback when element disappears.
 * @return Controller with disconnect method
 */
export function watchForElement(
    selector: string,
    onAppear: (node: HTMLElement) => HTMLElement | void,
    onDisappear: (node: HTMLElement, newElement?: HTMLElement | null) => void = () => { },
    options: { disconnectOnAppear?: boolean } = {}
) {
    let foundElement: HTMLElement | null = null;
    const isXPath = selector.startsWith('xpath:');
    const { disconnectOnAppear = false } = options;

    // Find element using appropriate method
    const findElement = () => {
        if (isXPath) {
            const xpath = selector.substring(6);
            return document.evaluate(
                xpath,
                document,
                null,
                XPathResult.FIRST_ORDERED_NODE_TYPE,
                null
            ).singleNodeValue;
        }
        return document.querySelector(selector);
    };

    // Set up and start observer
    const observer = new MutationObserver(checkForElement);

    // Check for element presence/absence
    function checkForElement() {
        const element = findElement();
        let newElement: HTMLElement | null = null;

        if (!foundElement && element && element instanceof HTMLElement) {
            // Element appeared
            foundElement = element;
            newElement = onAppear(element) || null;

            // Disconnect observer if requested
            if (disconnectOnAppear) {
                observer.disconnect();
            }
        } else if (foundElement && !document.body.contains(foundElement)) {
            // Element disappeared
            onDisappear(foundElement, newElement);
            foundElement = null;
        }
    }

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Check immediately
    checkForElement();

    // Return controller
    return {
        disconnect: () => observer.disconnect()
    };
}

export function getStoredAuthorisationToken(array: string[][]) {
    for (let i = 0; i < array.length; i++) {
        if (array[i][0].includes("idToken")) {
            return array[i][1];
        }
    }
    throw new Error("Authorisation token not found");
} export function throwIfUndefined(key: keyof CollectedData, data: CollectedData): string {
    if (data[key] === undefined || data[key] === null) {
        throw new Error(`${key} is not defined in obdata`);
    }
    if (typeof data[key] !== 'string') {
        throw new Error(`${key} is not a string in obdata`);
    }
    return data[key];
}
export function setStorage(key: string, value: string | number | undefined) {
    chrome.runtime.sendMessage<Message>({ type: 'setStorage', data: { key, value } });
}

export function getStorage<T>(key: string | undefined): Promise<T | undefined> {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage<Message>({ type: 'getStorage', data: { key } }, (response) => {
            if (response && response.value) {
                resolve(response.value);
            } else {
                resolve(undefined);
            }
        });
    });
}
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
export async function parsePage(vDocument: Response, url: string, fetchOptions: RequestInit): Promise<Document> {
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
/**
 * Parses the text content of a Response object into an HTML Document.
 * Includes a retry mechanism if reading the response body times out.
 * @param {Response} vDocument - The Response object from a fetch call.
 * @param {string} url - The original URL fetched (for retries).
 * @param {RequestInit} fetchOptions - The original fetch options (for retries).
 * @returns {Promise<Document>} - A promise resolving to the parsed Document.
 */
export async function parsePage(vDocument: Response, url: string, fetchOptions: RequestInit): Promise<Document> {
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
/**
 * Function to add message listeners for various functionalities.
 */
//export let source = "djr";
/* chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (message.URLHost) {
        sendResponse(message.URLHost);
        source = message.URLHost;
        return true;
    } else if (message.getURLHost) {
        sendResponse(source);
        return true;
    }
}); */
/* chrome.runtime.onMessage.addListener(
    function (request, _sender, sendResponse) {
        if (request.function == "sameSiteCookieMaker") {
            //    sameSiteCookieMaker();
            sendResponse({ message: "received" });
        }
    });
 */
/**
 * Function to add message listeners for various functionalities.
 */
export const addMessageListeners = (listeners: ChromeMessageListenerCallback[]) => {
    for (const listener of listeners) {
        chrome.runtime.onMessage.addListener(listener);
    }
};
export function urltoFile(url: string, filename: string, mimeType: string) {
    return (fetch(url)
        .then(function (res) { return res.arrayBuffer(); })
        .then(function (buf) { return new File([buf], filename, { type: mimeType }); })
    );
}
/**
 * A reusable wrapper for the fetch API.
 * @param url The URL to fetch.
 * @param responseHandler A function that takes the Response object and processes its body.
 * @param Optional fetch options (e.g., method, headers, body).
 * @returns A promise that resolves with the processed data.
 */
export async function customFetch(url: Parameters<typeof fetch>[0], responseHandler: (response: Response) => Promise<unknown>, options: RequestInit = {}) {
    try {
        const response = await fetch(url, options);

        // Check for HTTP errors (e.g., 404 Not Found, 500 Internal Server Error)
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        // The key part: Let the caller decide how to process the response body
        return await responseHandler(response);

    } catch (error) {
        if (error.message.includes('CORS') ||
            error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new Error(`CORS`);
        }

        throw error;
    }
}
/** Global promise to avoid concurrency issues */
let creating: Promise<void> | null;
/**
 * Sets up an offscreen document for the given path.
 * @param path The path to the offscreen document to be created.
 * @returns A promise that resolves when the offscreen document is ready.
 */
export async function setupOffscreenDocument(path: string) {
    // Check all windows controlled by the service worker to see if one
    // of them is the offscreen document with the given path
    const offscreenUrl = chrome.runtime.getURL(path);
    const existingContexts = await chrome.runtime.getContexts({
        documentUrls: [offscreenUrl],
        contextTypes: [chrome.runtime.ContextType.OFFSCREEN_DOCUMENT]
    });

    if (existingContexts.length > 0) {
        return;
    }

    // create offscreen document
    if (creating) {
        await creating;
    } else {
        creating = chrome.offscreen.createDocument(
            {
                url: path,
                reasons: [chrome.offscreen.Reason.DOM_PARSER],
                justification: 'Offscreen document for parsing HTML'
            }
        );
        await creating;
        creating = null;
    }
}


export function createWindow(properties: BulkActionProperties): Promise<BulkActionProperties> {
    return new Promise((resolve, reject) => {
        chrome.windows.create({
            "url": chrome.runtime.getURL("html/bulk-actions.html"),
            "type": "popup",
            "width": 1020,
            "height": 730
        }, function (popupWindow) {
            if (!popupWindow) {
                reject(new Error('Failed to create popup window'));
                return;
            }

            const handler: ChromeOnUpdatedHandler = function (tabId, changeInfo) {
                if (popupWindow!.tabs![0].id === tabId && changeInfo.status === "complete") {
                    properties.popupWindow = popupWindow;
                    properties.port = chrome.tabs.connect(tabId);
                    properties.port.onDisconnect.addListener(function () {
                        properties.portDisconnected = true;
                    });

                    // Clean up the listener and resolve
                    chrome.tabs.onUpdated.removeListener(handler);
                    resolve(properties);
                }
            };

            chrome.tabs.onUpdated.addListener(handler);
        });
    });
}

