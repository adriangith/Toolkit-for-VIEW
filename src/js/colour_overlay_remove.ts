
const observer = new MutationObserver(function () {
  const disconnectElement = document.getElementById('DebtorNoticesCtrl$DebtorNoticesTable$ddRecordsPerPage');
  if (disconnectElement) {
    observer.disconnect();
    return;
  }

  // Check if our target elements now exist
  const targetElements = document.querySelectorAll("[id^=DebtorNoticesCtrl_DebtorNoticesTable_DataRow-]");

  if (targetElements.length > 0) {
    // Remove the event handlers
    targetElements.forEach(el => {
      el.addEventListener('mouseover', event => event.stopPropagation(), true);
      el.addEventListener('mouseout', event => event.stopPropagation(), true);
    });

  }
});

// Start observing
observer.observe(document.documentElement, {
  childList: true,
  subtree: true
});



