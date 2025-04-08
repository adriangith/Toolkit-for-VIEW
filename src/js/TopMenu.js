document.addEventListener('DOMContentLoaded', function () {
    // Check if the current page is the Notices page
    if (window.location.href.includes('Notices.aspx')) {
        // Create a new link element
        let newLink = document.createElement('a');
        newLink.textContent = 'Bulk Update';
        newLink.href = '/Notices/BulkUpdateMain.aspx';
        newLink.style.marginLeft = '10px'; // Add some margin for spacing

        // Find the existing link in the top menu
        let existingLink = document.querySelector('#Cell_Notices > span > a');

        // Insert the new link after the existing one
        if (existingLink) {
            existingLink.parentNode.insertBefore(newLink, existingLink.nextSibling);
        }
    }
}
)

