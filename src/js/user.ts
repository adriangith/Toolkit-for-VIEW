const captureUserName = function () {
    const taskListOwnerElement = document.querySelector("#ctl00_mainContentPlaceHolder_taskListOwnerLabel");

    if (taskListOwnerElement) {
        const taskListOwnerName = taskListOwnerElement?.textContent?.trim();

        chrome.storage.local.set({ userName: taskListOwnerName }, function () {
            if (chrome.runtime.lastError) {
                console.error('Error setting value: ' + chrome.runtime.lastError.message);
            } else {
                console.log('User name saved:', taskListOwnerName);
            }
        });
    } else {
        console.log('Element not found on the page.');
    }
}

captureUserName();