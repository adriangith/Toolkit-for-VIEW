import LoadingBar, { LoadingBarContainer } from "react-top-loading-bar";
import React, { useEffect, useCallback, useState } from 'react';
import ReactDOM from 'react-dom/client';

const App = () => {
    const [progress, setProgress] = useState(0);

    const handleStorageChange = useCallback((changes: {
        [key: string]: chrome.storage.StorageChange;
    }) => {
        if (changes.obligationsCount?.newValue !== undefined) {
            chrome.storage.local.get(['obligationsCount', 'obligationsCountFixed'], function (items) {
                //const increment = 100 / items.obligationsCountFixed;
                const obligationsCount = items.obligationsCountFixed - items.obligationsCount;
                const newProgress = obligationsCount / items.obligationsCountFixed;
                setProgress(newProgress * 100);
            });
        }
    }, [setProgress]);

    useEffect(() => {
        chrome.storage.onChanged.addListener(handleStorageChange);

        // Cleanup function to remove listener
        return () => {
            chrome.storage.onChanged.removeListener(handleStorageChange);
        };
    }, [handleStorageChange]); // Include handleStorageChange as dependency

    return (
        <div>
            <LoadingBar
                color="#420b90"
                height={3}
                progress={progress}
                onLoaderFinished={() => setProgress(0)}
            />
        </div>
    );
};

const Parent = () => {
    return (
        <LoadingBarContainer>
            <App />
        </LoadingBarContainer>
    );
};

const body = document.body;
const loadingBarContainer = document.createElement("div");
body.appendChild(loadingBarContainer);
ReactDOM.createRoot(loadingBarContainer).render(<Parent />);