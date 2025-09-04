// Initialize jsPDF
const { jsPDF } = window.jspdf;

// DOM Elements
const tabs = document.querySelectorAll('.tab');
const sections = {
    entry: document.getElementById('entry-section'),
    view: document.getElementById('view-section'),
    export: document.getElementById('export-section')
};

const entryType = document.getElementById('entry-type');
const multipleEntrySection = document.getElementById('multiple-entry');
const visitForm = document.getElementById('visit-form');
const clearFormBtn = document.getElementById('clear-form');
const multipleEntriesList = document.getElementById('multiple-entries-list');
const saveMultipleBtn = document.getElementById('save-multiple');
const reportsBody = document.getElementById('reports-body');
const searchReports = document.getElementById('search-reports');
const generatePdfBtn = document.getElementById('generate-pdf');
const exportExcelBtn = document.getElementById('export-excel');
const exportJsonBtn = document.getElementById('export-json');
const contactSelector = document.getElementById('contact-selector');
const contactList = document.getElementById('contact-list');
const contactNoInput = document.getElementById('contact-no');
const installBtn = document.getElementById('installBtn');
const installButton = document.getElementById('install-button');
const notSupported = document.getElementById('not-supported');
const noContacts = document.getElementById('no-contacts');
const todayBtn = document.getElementById('today-btn');
const yesterdayBtn = document.getElementById('yesterday-btn');
const modalTodayBtn = document.getElementById('modal-today-btn');
const customerAutocomplete = document.getElementById('customer-autocomplete');
const purposeAutocomplete = document.getElementById('purpose-autocomplete');
const customerNameInput = document.getElementById('customer-name');
const visitingPurposeInput = document.getElementById('visiting-purpose');
const recentEntriesList = document.getElementById('recent-entries-list');
const sortExport = document.getElementById('sort-export');

// Modal Elements
const reportModal = document.getElementById('report-modal');
const modalTitle = document.getElementById('modal-title');
const modalForm = document.getElementById('modal-form');
const modalIndex = document.getElementById('modal-index');
const modalSerialNo = document.getElementById('modal-serial-no');
const modalDate = document.getElementById('modal-date');
const modalCustomerName = document.getElementById('modal-customer-name');
const modalReportNo = document.getElementById('modal-report-no');
const modalContactPerson = document.getElementById('modal-contact-person');
const modalContactNo = document.getElementById('modal-contact-no');
const modalVisitingPurpose = document.getElementById('modal-visiting-purpose');
const modalSaveBtn = document.getElementById('modal-save-btn');
const modalCancelBtn = document.getElementById('modal-cancel-btn');
const modalDeleteBtn = document.getElementById('modal-delete-btn');
const modalEditBtn = document.getElementById('modal-edit-btn');
const closeModalBtn = document.getElementById('close-modal');

// State
let multipleEntries = [];
let allReports = JSON.parse(localStorage.getItem('visitReports')) || [];
let contacts = [];
let isEditing = false;
let currentSort = { column: 'date', direction: 'asc' };
let recentEntries = JSON.parse(localStorage.getItem('recentEntries')) || [];
let customerSuggestions = JSON.parse(localStorage.getItem('customerSuggestions')) || [];
let purposeSuggestions = JSON.parse(localStorage.getItem('purposeSuggestions')) || [];

// Initialize the app
function init() {
    // Set today's date as default
    setTodayDate();

    // Generate a report number
    document.getElementById('report-no').value = generateReportNumber();

    // Set initial serial number
    document.getElementById('serial-no').value = allReports.length > 0
        ? Math.max(...allReports.map(r => parseInt(r.serialNo) || 0)) + 1
        : 1;

    // Load existing reports
    renderReports();

    // Render recent entries
    renderRecentEntries();

    // Set up event listeners
    setupEventListeners();

    // Check if on mobile device
    if (isMobileDevice()) {
        showAlert('Mobile device detected. You can access your device contacts.', 'success');
    }

    // Check PWA installation support
    checkPwaSupport();

    // Register service worker for PWA functionality
    registerServiceWorker();
}

// Check PWA installation support
function checkPwaSupport() {
    if ('BeforeInstallPromptEvent' in window) {
        installButton.classList.remove('hidden');
    } else {
        notSupported.classList.remove('hidden');
    }
}

// Register service worker
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/service-worker.js')
            .then(() => console.log("Service Worker Registered"))
            .catch(err => console.log("Service Worker Registration Failed: ", err));
    }
}

// Set today's date in the date input
function setTodayDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('date').value = today;
}

// Set today's date in the modal date input
function setModalTodayDate() {
    const today = new Date().toISOString().split('T')[0];
    modalDate.value = today;
}

// Check if user is on a mobile device
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Access device contacts
async function accessDeviceContacts() {
    if ('contacts' in navigator && 'select' in navigator.contacts) {
        try {
            const contacts = await navigator.contacts.select(['name', 'tel'], { multiple: true });
            if (contacts.length > 0) {
                populateContactList(contacts);
            } else {
                showAlert('No contacts selected', 'warning');
            }
        } catch (err) {
            console.error('Error accessing contacts:', err);
            showAlert('Error accessing contacts. Please check permissions.', 'danger');
        }
    } else {
        showAlert('Contact API not supported in your browser', 'warning');
    }
}

// Populate contact list with device contacts
function populateContactList(contacts) {
    contactList.innerHTML = '';

    if (contacts.length === 0) {
        const noContactsItem = document.createElement('div');
        noContactsItem.className = 'contact-item';
        noContactsItem.textContent = 'No contacts available';
        contactList.appendChild(noContactsItem);
        return;
    }

    contacts.forEach(contact => {
        const name = contact.name ? contact.name[0] : 'Unknown';
        const phone = contact.tel ? contact.tel[0] : '';

        const contactItem = document.createElement('div');
        contactItem.className = 'contact-item';
        contactItem.setAttribute('data-number', phone);
        contactItem.setAttribute('data-name', name);
        contactItem.textContent = `${name} - ${phone}`;

        contactItem.addEventListener('click', () => {
            document.getElementById('contact-no').value = phone;
            contactList.style.display = 'none';
        });

        contactList.appendChild(contactItem);
    });
}

// Set up event listeners
function setupEventListeners() {
    // Tab navigation
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.getAttribute('data-tab');

            // Update active tab
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Show corresponding section
            Object.keys(sections).forEach(key => {
                sections[key].classList.add('hidden');
            });
            sections[tabName].classList.remove('hidden');
        });
    });

    // Date change - update report number
    document.getElementById('date').addEventListener('change', () => {
        document.getElementById('report-no').value = generateReportNumber();
    });

    // Today button
    todayBtn.addEventListener('click', () => {
        setTodayDate();
        document.getElementById('report-no').value = generateReportNumber();
    });

    // Yesterday button
    yesterdayBtn.addEventListener('click', () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        document.getElementById('date').value = yesterday.toISOString().split('T')[0];
        document.getElementById('report-no').value = generateReportNumber();
    });

    // Quick date buttons
    document.querySelectorAll('.quick-date-btn').forEach(button => {
        button.addEventListener('click', () => {
            const days = parseInt(button.getAttribute('data-days'));
            const date = new Date();
            date.setDate(date.getDate() - days);
            document.getElementById('date').value = date.toISOString().split('T')[0];
            document.getElementById('report-no').value = generateReportNumber();
        });
    });

    // Modal today button
    modalTodayBtn.addEventListener('click', () => {
        setModalTodayDate();
        modalReportNo.value = generateModalReportNumber();
    });

    // Modal date change
    modalDate.addEventListener('change', () => {
        modalReportNo.value = generateModalReportNumber();
    });

    // Entry type change
    entryType.addEventListener('change', () => {
        if (entryType.value === 'multiple') {
            multipleEntrySection.classList.remove('hidden');
        } else {
            multipleEntrySection.classList.add('hidden');
            multipleEntries = [];
            renderMultipleEntries();
        }
    });

    // Form submission
    visitForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const report = {
            serialNo: document.getElementById('serial-no').value,
            date: document.getElementById('date').value,
            customerName: document.getElementById('customer-name').value,
            reportNo: document.getElementById('report-no').value,
            contactPerson: document.getElementById('contact-person').value,
            contactNo: document.getElementById('contact-no').value,
            visitingPurpose: document.getElementById('visiting-purpose').value
        };

        // Add to suggestions if not already present
        if (!customerSuggestions.includes(report.customerName)) {
            customerSuggestions.push(report.customerName);
            localStorage.setItem('customerSuggestions', JSON.stringify(customerSuggestions));
        }

        if (report.visitingPurpose && !purposeSuggestions.includes(report.visitingPurpose)) {
            purposeSuggestions.push(report.visitingPurpose);
            localStorage.setItem('purposeSuggestions', JSON.stringify(purposeSuggestions));
        }

        // Add to recent entries
        recentEntries.unshift(report);
        if (recentEntries.length > 5) {
            recentEntries.pop();
        }
        localStorage.setItem('recentEntries', JSON.stringify(recentEntries));
        renderRecentEntries();

        if (entryType.value === 'single') {
            saveReport(report);
            showAlert('Report saved successfully!', 'success');
            visitForm.reset();
            setTodayDate();
            // Increment serial number for next entry
            document.getElementById('serial-no').value = parseInt(report.serialNo) + 1;
            document.getElementById('report-no').value = generateReportNumber();
        } else {
            multipleEntries.push(report);
            renderMultipleEntries();
            visitForm.reset();
            setTodayDate();
            // Increment serial number for next entry
            document.getElementById('serial-no').value = parseInt(report.serialNo) + 1;
            document.getElementById('report-no').value = generateReportNumber();
        }
    });

    // Clear form
    clearFormBtn.addEventListener('click', () => {
        visitForm.reset();
        setTodayDate();
        document.getElementById('report-no').value = generateReportNumber();
    });

    // Save multiple entries
    saveMultipleBtn.addEventListener('click', () => {
        if (multipleEntries.length === 0) {
            showAlert('No entries to save', 'danger');
            return;
        }

        multipleEntries.forEach(report => {
            allReports.push(report);
        });

        localStorage.setItem('visitReports', JSON.stringify(allReports));
        showAlert(`${multipleEntries.length} reports saved successfully!`, 'success');
        multipleEntries = [];
        renderMultipleEntries();
        renderReports();
    });

    // Search reports
    searchReports.addEventListener('input', () => {
        renderReports();
    });

    // Generate PDF
    generatePdfBtn.addEventListener('click', generatePdf);

    // Export Excel
    exportExcelBtn.addEventListener('click', exportExcel);

    // Export JSON
    exportJsonBtn.addEventListener('click', exportJson);

    // Contact selector
    contactSelector.addEventListener('click', () => {
        if (contactList.style.display === 'block') {
            contactList.style.display = 'none';
        } else {
            contactList.style.display = 'block';
            // Try to access device contacts when the contact list is opened
            accessDeviceContacts();
        }
    });

    // Close contact list when clicking outside
    document.addEventListener('click', (e) => {
        if (!contactSelector.contains(e.target) && !contactList.contains(e.target)) {
            contactList.style.display = 'none';
        }
    });

    // Mobile contact integration
    contactNoInput.addEventListener('click', () => {
        if (isMobileDevice()) {
            showAlert('You can access your device contacts using the contact book icon', 'success');
        }
    });

    // PWA installation
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        installButton.classList.remove('hidden');

        installBtn.addEventListener('click', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                console.log(`User response to install: ${outcome}`);
                deferredPrompt = null;
                installButton.classList.add('hidden');
            }
        });
    });

    // Automatically prompt the user to install the PWA
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(choiceResult => {
            if (choiceResult.outcome === 'accepted') {
                console.log('User accepted the A2HS prompt');
            } else {
                console.log('User dismissed the A2HS prompt');
            }
            deferredPrompt = null;
        });
    }        // Hide install button if app is installed
    window.addEventListener('appinstalled', () => {
        installButton.classList.add('hidden');
        showAlert('App installed successfully!', 'success');
    });



    // No contacts item click
    noContacts.addEventListener('click', accessDeviceContacts);

    // Modal events
    closeModalBtn.addEventListener('click', closeModal);
    modalCancelBtn.addEventListener('click', closeModal);
    modalSaveBtn.addEventListener('click', saveModalChanges);
    modalDeleteBtn.addEventListener('click', deleteModalReport);
    modalEditBtn.addEventListener('click', enableModalEditing);

    // Close modal when clicking outside
    reportModal.addEventListener('click', (e) => {
        if (e.target === reportModal) {
            closeModal();
        }
    });

    // Customer name autocomplete
    customerNameInput.addEventListener('input', () => {
        showAutocomplete(customerNameInput, customerAutocomplete, customerSuggestions);
    });

    // Visiting purpose autocomplete
    visitingPurposeInput.addEventListener('input', () => {
        showAutocomplete(visitingPurposeInput, purposeAutocomplete, purposeSuggestions);
    });

    // Close autocomplete when clicking outside
    document.addEventListener('click', (e) => {
        if (!customerNameInput.contains(e.target) && !customerAutocomplete.contains(e.target)) {
            customerAutocomplete.style.display = 'none';
        }
        if (!visitingPurposeInput.contains(e.target) && !purposeAutocomplete.contains(e.target)) {
            purposeAutocomplete.style.display = 'none';
        }
    });

    // Table sorting
    document.querySelectorAll('th[data-sort]').forEach(th => {
        th.addEventListener('click', () => {
            const column = th.getAttribute('data-sort');
            if (currentSort.column === column) {
                currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
            } else {
                currentSort.column = column;
                currentSort.direction = 'asc';
            }
            renderReports();
        });
    });
}

// Show autocomplete suggestions
function showAutocomplete(input, list, suggestions) {
    const value = input.value.toLowerCase();
    if (value.length < 1) {
        list.style.display = 'none';
        return;
    }

    const filtered = suggestions.filter(s => s.toLowerCase().includes(value));

    if (filtered.length === 0) {
        list.style.display = 'none';
        return;
    }

    list.innerHTML = '';
    filtered.forEach(suggestion => {
        const item = document.createElement('div');
        item.className = 'autocomplete-item';
        item.textContent = suggestion;
        item.addEventListener('click', () => {
            input.value = suggestion;
            list.style.display = 'none';
        });
        list.appendChild(item);
    });

    list.style.display = 'block';
}

// Generate a unique report number in the format DVG 2024-25/MAY 02
function generateReportNumber() {
    const dateInput = document.getElementById('date');
    const date = dateInput.value ? new Date(dateInput.value) : new Date();

    const year = date.getFullYear();
    const nextYearShort = (year + 1).toString().slice(-2);
    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const month = monthNames[date.getMonth()];
    const day = date.getDate().toString().padStart(2, '0');

    return `DVG ${year}-${nextYearShort}/${month} ${day}`;
}

// Generate report number for modal
function generateModalReportNumber() {
    const date = modalDate.value ? new Date(modalDate.value) : new Date();

    const year = date.getFullYear();
    const nextYearShort = (year + 1).toString().slice(-2);
    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const month = monthNames[date.getMonth()];
    const day = date.getDate().toString().padStart(2, '0');

    return `DVG ${year}-${nextYearShort}/${month} ${day}`;
}

// Save a report to localStorage
function saveReport(report) {
    allReports.push(report);
    localStorage.setItem('visitReports', JSON.stringify(allReports));
    renderReports();
}

// Render recent entries
function renderRecentEntries() {
    recentEntriesList.innerHTML = '';

    if (recentEntries.length === 0) {
        recentEntriesList.innerHTML = '<p>No recent entries yet. Your entries will appear here.</p>';
        return;
    }

    recentEntries.forEach((entry, index) => {
        const entryEl = document.createElement('div');
        entryEl.className = 'recent-entry';
        entryEl.innerHTML = `
                    <strong>#${entry.serialNo} - ${formatDate(entry.date)}</strong><br>
                    <strong>${entry.customerName}</strong><br>
                    <span class="report-no">${entry.reportNo}</span><br>
                    <small>${entry.visitingPurpose.substring(0, 50)}${entry.visitingPurpose.length > 50 ? '...' : ''}</small>
                `;

        entryEl.addEventListener('click', () => {
            document.getElementById('serial-no').value = entry.serialNo;
            document.getElementById('date').value = entry.date;
            document.getElementById('customer-name').value = entry.customerName;
            document.getElementById('report-no').value = entry.reportNo;
            document.getElementById('contact-person').value = entry.contactPerson || '';
            document.getElementById('contact-no').value = entry.contactNo || '';
            document.getElementById('visiting-purpose').value = entry.visitingPurpose || '';
        });

        recentEntriesList.appendChild(entryEl);
    });
}



// Render multiple entries list
function renderMultipleEntries() {
    multipleEntriesList.innerHTML = '';

    if (multipleEntries.length === 0) {
        multipleEntriesList.innerHTML = '<p>No entries added yet.</p>';
        return;
    }

    const list = document.createElement('ul');
    list.style.listStyle = 'none';
    list.style.padding = '0';

    multipleEntries.forEach((entry, index) => {
        const listItem = document.createElement('li');
        listItem.style.padding = '12px';
        listItem.style.borderBottom = '1px solid #eee';
        listItem.style.display = 'flex';
        listItem.style.justifyContent = 'space-between';
        listItem.style.alignItems = 'center';
        listItem.style.background = index % 2 === 0 ? '#f9f9f9' : '#fff';

        listItem.innerHTML = `
                    <div>
                        <strong>#${entry.serialNo} - ${formatDate(entry.date)}</strong> - ${entry.customerName}
                        <br><span class="report-no">${entry.reportNo}</span>
                        <br><small>${entry.visitingPurpose.substring(0, 50)}${entry.visitingPurpose.length > 50 ? '...' : ''}</small>
                    </div>
                    <div class="actions">
                        <button class="action-btn" data-index="${index}">
                            <i class="fas fa-edit"></i>Edit
                        </button>
                        <button class="action-btn btn-danger" data-index="${index}">
                            <i class="fas fa-times"></i>Remove
                        </button>
                    </div>
                `;

        list.appendChild(listItem);
    });

    multipleEntriesList.appendChild(list);

    // Add event listeners to action buttons
    const editButtons = multipleEntriesList.querySelectorAll('.actions button:first-child');
    editButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const index = parseInt(e.target.closest('button').getAttribute('data-index'));
            editMultipleEntry(index);
        });
    });

    const removeButtons = multipleEntriesList.querySelectorAll('.actions button.btn-danger');
    removeButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const index = parseInt(e.target.closest('button').getAttribute('data-index'));
            multipleEntries.splice(index, 1);
            renderMultipleEntries();
        });
    });
}

// Edit a multiple entry
function editMultipleEntry(index) {
    const entry = multipleEntries[index];

    // Populate the form with the entry data
    document.getElementById('serial-no').value = entry.serialNo;
    document.getElementById('date').value = entry.date;
    document.getElementById('customer-name').value = entry.customerName;
    document.getElementById('report-no').value = entry.reportNo;
    document.getElementById('contact-person').value = entry.contactPerson || '';
    document.getElementById('contact-no').value = entry.contactNo || '';
    document.getElementById('visiting-purpose').value = entry.visitingPurpose || '';

    // Remove the entry from multiple entries
    multipleEntries.splice(index, 1);
    renderMultipleEntries();

    // Switch to single entry mode
    entryType.value = 'single';
    multipleEntrySection.classList.add('hidden');

    showAlert('Entry loaded for editing', 'success');
}

// Render reports table
function renderReports() {
    reportsBody.innerHTML = '';

    const searchTerm = searchReports.value.toLowerCase();
    let filteredReports = allReports;

    if (searchTerm) {
        filteredReports = allReports.filter(report =>
            report.customerName.toLowerCase().includes(searchTerm) ||
            (report.contactPerson && report.contactPerson.toLowerCase().includes(searchTerm)) ||
            report.reportNo.toLowerCase().includes(searchTerm) ||
            report.visitingPurpose.toLowerCase().includes(searchTerm)
        );
    }

    // Sort reports
    filteredReports.sort((a, b) => {
        let valueA, valueB;

        if (currentSort.column === 'date') {
            valueA = new Date(a.date);
            valueB = new Date(b.date);
        } else if (currentSort.column === 'serialNo') {
            valueA = parseInt(a.serialNo);
            valueB = parseInt(b.serialNo);
        } else {
            valueA = a[currentSort.column] || '';
            valueB = b[currentSort.column] || '';
        }

        if (valueA < valueB) return currentSort.direction === 'asc' ? -1 : 1;
        if (valueA > valueB) return currentSort.direction === 'asc' ? 1 : -1;
        return 0;
    });

    // Update sort indicators
    document.querySelectorAll('th[data-sort]').forEach(th => {
        const indicator = th.querySelector('.sort-indicator');
        if (th.getAttribute('data-sort') === currentSort.column) {
            indicator.textContent = currentSort.direction === 'asc' ? '↑' : '↓';
        } else {
            indicator.textContent = '↕';
        }
    });

    if (filteredReports.length === 0) {
        reportsBody.innerHTML = `
                    <tr>
                        <td colspan="8" style="text-align: center;">No reports found</td>
                    </tr>
                `;
        return;
    }

    filteredReports.forEach((report, index) => {
        const originalIndex = allReports.findIndex(r => r.reportNo === report.reportNo);
        const row = document.createElement('tr');

        row.innerHTML = `
                    <td>${report.serialNo}</td>
                    <td>${formatDate(report.date)}</td>
                    <td>${report.customerName}</td>
                    <td class="report-no">${report.reportNo}</td>
                    <td>${report.contactPerson || '-'}</td>
                    <td>${report.contactNo || '-'}</td>
                    <td>${report.visitingPurpose.substring(0, 50)}${report.visitingPurpose.length > 50 ? '...' : ''}</td>
                    <td class="actions">
                        <button class="action-btn" data-index="${originalIndex}">
                            <i class="fas fa-eye"></i>View
                        </button>
                    </td>
                `;

        reportsBody.appendChild(row);
    });

    // Add event listeners to action buttons
    const viewButtons = reportsBody.querySelectorAll('.actions button');
    viewButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const index = parseInt(e.target.closest('button').getAttribute('data-index'));
            openModal(allReports[index], index, 'view');
        });
    });
}

// Open modal for viewing/editing
function openModal(report, index, mode) {
    isEditing = mode === 'edit';

    // Populate modal with report data
    modalIndex.value = index;
    modalSerialNo.value = report.serialNo;
    modalDate.value = report.date;
    modalCustomerName.value = report.customerName;
    modalReportNo.value = report.reportNo;
    modalContactPerson.value = report.contactPerson || '';
    modalContactNo.value = report.contactNo || '';
    modalVisitingPurpose.value = report.visitingPurpose || '';

    // Set modal title and button visibility based on mode
    if (mode === 'view') {
        modalTitle.textContent = 'View Report';
        modalSaveBtn.classList.add('hidden');
        modalDeleteBtn.classList.add('hidden');
        modalEditBtn.classList.remove('hidden');

        // Make inputs readonly
        Array.from(modalForm.elements).forEach(element => {
            element.readOnly = true;
        });
        modalSerialNo.readOnly = false; // Allow changing serial number even in view mode
    } else {
        modalTitle.textContent = 'Edit Report';
        modalSaveBtn.classList.remove('hidden');
        modalDeleteBtn.classList.remove('hidden');
        modalEditBtn.classList.add('hidden');

        // Make inputs editable
        Array.from(modalForm.elements).forEach(element => {
            element.readOnly = false;
        });
    }

    // Show modal
    reportModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Enable editing in modal
function enableModalEditing() {
    modalTitle.textContent = 'Edit Report';
    modalSaveBtn.classList.remove('hidden');
    modalDeleteBtn.classList.remove('hidden');
    modalEditBtn.classList.add('hidden');

    // Make inputs editable
    Array.from(modalForm.elements).forEach(element => {
        element.readOnly = false;
    });
}

// Close modal
function closeModal() {
    reportModal.classList.remove('active');
    document.body.style.overflow = 'auto';

    // Reset form
    setTimeout(() => {
        modalForm.reset();
    }, 300);
}

// Save changes from modal
function saveModalChanges() {
    const index = parseInt(modalIndex.value);

    allReports[index] = {
        serialNo: modalSerialNo.value,
        date: modalDate.value,
        customerName: modalCustomerName.value,
        reportNo: modalReportNo.value,
        contactPerson: modalContactPerson.value,
        contactNo: modalContactNo.value,
        visitingPurpose: modalVisitingPurpose.value
    };

    localStorage.setItem('visitReports', JSON.stringify(allReports));
    renderReports();
    closeModal();
    showAlert('Report updated successfully!', 'success');
}

// Delete report from modal
function deleteModalReport() {
    const index = parseInt(modalIndex.value);

    if (confirm('Are you sure you want to delete this report?')) {
        allReports.splice(index, 1);
        localStorage.setItem('visitReports', JSON.stringify(allReports));
        renderReports();
        closeModal();
        showAlert('Report deleted successfully', 'success');
    }
}

// Generate PDF report
function generatePdf() {
    const month = document.getElementById('month-select').value;
    const year = document.getElementById('year-select').value;
    const sortBy = sortExport.value;

    // Filter reports by selected month and year
    let filteredReports = allReports.filter(report => {
        const reportDate = new Date(report.date);
        return reportDate.getMonth() + 1 == month && reportDate.getFullYear() == year;
    });

    if (filteredReports.length === 0) {
        showAlert('No reports found for the selected period', 'danger');
        return;
    }

    // Sort reports for export
    filteredReports.sort((a, b) => {
        let valueA, valueB;

        if (sortBy === 'date') {
            valueA = new Date(a.date);
            valueB = new Date(b.date);
        } else if (sortBy === 'serialNo') {
            valueA = parseInt(a.serialNo);
            valueB = parseInt(b.serialNo);
        } else {
            valueA = a[sortBy] || '';
            valueB = b[sortBy] || '';
        }

        if (valueA < valueB) return -1;
        if (valueA > valueB) return 1;
        return 0;
    });

    // Create PDF
    const doc = new jsPDF();

    // Add title
    doc.setFontSize(20);
    doc.setTextColor(39, 174, 96);
    doc.text('Visit Reports', 105, 15, { align: 'center' });

    // Add period
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    doc.text(`${monthNames[month - 1]} ${year}`, 105, 22, { align: 'center' });

    // Add table
    const tableColumn = ["Sr No", "Date", "Customer", "Report No", "Contact Person", "Contact No", "Purpose"];
    const tableRows = [];

    filteredReports.forEach(report => {
        const reportData = [
            report.serialNo,
            formatDate(report.date),
            report.customerName,
            report.reportNo,
            report.contactPerson || '-',
            report.contactNo || '-',
            report.visitingPurpose
        ];
        tableRows.push(reportData);
    });

    doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 30,
        theme: 'grid',
        styles: {
            fontSize: 9,
            cellPadding: 3,
            overflow: 'linebreak'
        },
        headStyles: {
            fillColor: [39, 174, 96],
            textColor: 255
        },
        alternateRowStyles: {
            fillColor: [236, 240, 241]
        }
    });

    // Save the PDF
    const fileName = `Visit_Reports_${monthNames[month - 1]}_${year}.pdf`;
    doc.save(fileName);

    showAlert('PDF generated successfully!', 'success');
}

// Export to Excel
function exportExcel() {
    const month = document.getElementById('month-select').value;
    const year = document.getElementById('year-select').value;
    const sortBy = sortExport.value;

    // Filter reports by selected month and year
    let filteredReports = allReports.filter(report => {
        const reportDate = new Date(report.date);
        return reportDate.getMonth() + 1 == month && reportDate.getFullYear() == year;
    });

    if (filteredReports.length === 0) {
        showAlert('No reports found for the selected period', 'danger');
        return;
    }

    // Sort reports for export
    filteredReports.sort((a, b) => {
        let valueA, valueB;

        if (sortBy === 'date') {
            valueA = new Date(a.date);
            valueB = new Date(b.date);
        } else if (sortBy === 'serialNo') {
            valueA = parseInt(a.serialNo);
            valueB = parseInt(b.serialNo);
        } else {
            valueA = a[sortBy] || '';
            valueB = b[sortBy] || '';
        }

        if (valueA < valueB) return -1;
        if (valueA > valueB) return 1;
        return 0;
    });

    // Prepare data for Excel
    const excelData = filteredReports.map(report => ({
        'Serial No': report.serialNo,
        'Date': formatDate(report.date),
        'Customer Name': report.customerName,
        'Report No': report.reportNo,
        'Contact Person': report.contactPerson || '',
        'Contact No': report.contactNo || '',
        'Visiting Purpose': report.visitingPurpose
    }));

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Visit Reports');

    // Generate Excel file
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const fileName = `Visit_Reports_${monthNames[month - 1]}_${year}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    showAlert('Excel file generated successfully!', 'success');
}

// Export as JSON
function exportJson() {
    const month = document.getElementById('month-select').value;
    const year = document.getElementById('year-select').value;
    const sortBy = sortExport.value;

    // Filter reports by selected month and year
    let filteredReports = allReports.filter(report => {
        const reportDate = new Date(report.date);
        return reportDate.getMonth() + 1 == month && reportDate.getFullYear() == year;
    });

    if (filteredReports.length === 0) {
        showAlert('No reports found for the selected period', 'danger');
        return;
    }

    // Sort reports for export
    filteredReports.sort((a, b) => {
        let valueA, valueB;

        if (sortBy === 'date') {
            valueA = new Date(a.date);
            valueB = new Date(b.date);
        } else if (sortBy === 'serialNo') {
            valueA = parseInt(a.serialNo);
            valueB = parseInt(b.serialNo);
        } else {
            valueA = a[sortBy] || '';
            valueB = b[sortBy] || '';
        }

        if (valueA < valueB) return -1;
        if (valueA > valueB) return 1;
        return 0;
    });

    const dataStr = JSON.stringify(filteredReports, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

    const exportFileDefaultName = `Visit_Reports_${month}_${year}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();

    showAlert('JSON exported successfully!', 'success');
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB'); // DD/MM/YYYY format
}

// Show alert message
function showAlert(message, type) {
    const alertArea = document.getElementById('alert-area');
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> ${message}`;

    alertArea.appendChild(alert);

    // Remove alert after 3 seconds
    setTimeout(() => {
        alert.remove();
    }, 3000);
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', init);