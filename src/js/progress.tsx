import { useLoadingBar, LoadingBarContainer } from "react-top-loading-bar";
import React, { useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom/client';

const App = () => {
    const { increase } = useLoadingBar({
        color: "#420b90",
        height: 3,
    });

    const handleStorageChange = useCallback((changes: {
        [key: string]: chrome.storage.StorageChange;
    }) => {
        if (changes.obligationsCount?.newValue !== undefined) {
            chrome.storage.local.get(['obligationsCountFixed'], function (items) {
                const increment = 100 / items.obligationsCountFixed;
                increase(increment);
            });
        }
    }, [increase]);

    useEffect(() => {
        chrome.storage.onChanged.addListener(handleStorageChange);

        // Cleanup function to remove listener
        return () => {
            chrome.storage.onChanged.removeListener(handleStorageChange);
        };
    }, [handleStorageChange]); // Include handleStorageChange as dependency

    return (
        <div></div>
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