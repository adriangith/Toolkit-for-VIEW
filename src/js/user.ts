export const captureUserName = async function (doc: Document = window.document): Promise<string | null> {
    const taskListOwnerElement = doc.querySelector("#ctl00_mainContentPlaceHolder_taskListOwnerLabel");

    if (taskListOwnerElement) {
        const taskListOwnerName = taskListOwnerElement?.textContent?.trim();

        // Ensure there is a name to save
        if (taskListOwnerName) {
            try {
                // 'await' the storage operation to complete
                await chrome.storage.local.set({ userName: taskListOwnerName });
                console.log('User name saved:', taskListOwnerName);

                // Return the captured name on success
                return taskListOwnerName;
            } catch (error) {
                console.error('Error setting value:', error);
                // Return null if the storage operation fails
                return null;
            }
        }
    }

    console.log('User name element not found or has no content.');
    // Return null if the element isn't found
    return null;
};

captureUserName();