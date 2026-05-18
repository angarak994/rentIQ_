// script.js - Comprehensive Property Management with Monthly Records

function $(sel) { return document.querySelector(sel); }
function $$(sel) { return document.querySelectorAll(sel); }

// State Management
let currentTab = 'dashboard';
let currentDate = new Date();
let selectedMonth = currentDate.getMonth(); // 0-11
let selectedYear = currentDate.getFullYear();
let charts = {};
let lastCalculatedTotal = 0;

const DEPOSIT_MAP = {
    '1BHK': 20000,
    '2RK': 15000,
    '1RK': 10000
};

// UPI ID provided by the user
const UPI_ID = "8208388320@slc";

// Storage Keys
function getTenantKey() { return `rc_tenants_${selectedMonth}_${selectedYear}`; }
function getExpenseKey() { return `rc_expenses_${selectedMonth}_${selectedYear}`; }

function loadData(key) {
    try { 
        const val = localStorage.getItem(key);
        if (!val && key.startsWith('rc_tenants_')) {
            const defaults = [
                {
                    name: "Santosh",
                    phone: "9876543210",
                    roomType: "1BHK",
                    amount: 10000,
                    electricityCharge: 450,
                    prevReading: 1200,
                    currReading: 1245,
                    status: "pending",
                    joiningDate: "2026-05-01",
                    rentCycleDay: 1,
                    initialDeposit: 20000,
                    property: "Unassigned",
                },
                {
                    name: "Narayan",
                    phone: "8888888888",
                    roomType: "1RK",
                    amount: 4500,
                    electricityCharge: 0,
                    prevReading: 800,
                    currReading: 0,
                    status: "overdue",
                    joiningDate: "2026-05-01",
                    rentCycleDay: 1,
                    initialDeposit: 10000,
                    depositDate: "2026-05-01",
                    property: "Ram Niwas",
                    startMonth: selectedMonth,
                    startYear: selectedYear
                },
                {
                    name: "Ramesh",
                    phone: "9999999999",
                    roomType: "2RK",
                    amount: 7000,
                    electricityCharge: 320,
                    prevReading: 950,
                    currReading: 982,
                    status: "paid",
                    paidAt: "2026-05-05",
                    joiningDate: "2026-05-01",
                    rentCycleDay: 5,
                    initialDeposit: 15000,
                    depositDate: "2026-05-01",
                    property: "Ram Niwas",
                    startMonth: selectedMonth,
                    startYear: selectedYear
                },
                {
                    name: "Suresh",
                    phone: "7777777777",
                    roomType: "1RK",
                    amount: 4500,
                    electricityCharge: 180,
                    prevReading: 650,
                    currReading: 668,
                    status: "pending",
                    joiningDate: "2026-05-05",
                    rentCycleDay: 5,
                    initialDeposit: 10000,
                    property: "Unassigned",
                }
            ];
            saveData(key, defaults);
            return defaults;
        }
        return JSON.parse(val) || [];
    }
    catch (e) { return []; }
}

function saveData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

function formatCurrency(n) {
    return '₹' + Number(n).toLocaleString('en-IN');
}

// Global Month Selector
function initMonthSelector() {
    const select = $('#global-month-select');
    if (!select) return;

    select.innerHTML = '';
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    for (let y = selectedYear - 1; y <= selectedYear + 1; y++) {
        for (let m = 0; m < 12; m++) {
            const opt = document.createElement('option');
            opt.value = `${m}-${y}`;
            opt.textContent = `${months[m]} ${y}`;
            if (m === selectedMonth && y === selectedYear) opt.selected = true;
            select.appendChild(opt);
        }
    }

    select.addEventListener('change', (e) => {
        const [m, y] = e.target.value.split('-');
        selectedMonth = parseInt(m);
        selectedYear = parseInt(y);
        refreshAllViews();
    });
}

// Theme Manager
function initTheme() {
    const select = $('#theme-select');
    const icon = $('#theme-icon');
    if (!select) return;

    const storedTheme = localStorage.getItem('rc_theme') || 'system';
    select.value = storedTheme;

    function applyTheme(themeVal) {
        let isDark = false;
        if (themeVal === 'dark') isDark = true;
        else if (themeVal === 'system') {
            isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        }

        if (isDark) {
            document.documentElement.setAttribute('data-theme', 'dark');
            icon.className = 'fa-solid fa-moon';
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
            icon.className = 'fa-solid fa-sun';
        }

        // Redraw charts if we are on the analytics tab
        if (currentTab === 'analytics') {
            setTimeout(initCharts, 50); // Small delay to let CSS var apply
        }
    }

    applyTheme(storedTheme);

    select.addEventListener('change', (e) => {
        const val = e.target.value;
        localStorage.setItem('rc_theme', val);
        applyTheme(val);
    });

    // Listen to system changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (select.value === 'system') {
            applyTheme('system');
        }
    });
}

function refreshAllViews() {
    if (currentTab === 'dashboard' || currentTab === 'timeline') renderDashboard();
    if (currentTab === 'analytics') initCharts();
    if (currentTab === 'calendar') renderCalendar();
    if (currentTab === 'expenses') {
        renderDashboard();
        populateExpenseTenantSelect();
    }
    if (currentTab === 'deposits') renderDeposits();
    if (currentTab === 'directory') renderDirectory();

    // Sync global month selector
    const select = $('#global-month-select');
    if (select) select.value = `${selectedMonth}-${selectedYear}`;
}

function switchTab(tabId) {
    $$('.tab-content').forEach(c => c.classList.remove('active'));
    const tabContent = $(`#tab-${tabId}`);
    if (tabContent) tabContent.classList.add('active');

    $$('.nav-item').forEach(n => {
        n.classList.remove('active');
        n.setAttribute('aria-selected', 'false');
    });
    const navItem = $(`.nav-item[data-tab="${tabId}"]`);
    if (navItem) {
        navItem.classList.add('active');
        navItem.setAttribute('aria-selected', 'true');
    }

    currentTab = tabId;
    refreshAllViews();
}

/// Audit Log & Event Timeline Tracker
function logTimelineEvent(title, body, type = 'info') {
    const feed = JSON.parse(localStorage.getItem('rc_audit_log')) || [];
    feed.unshift({
        title,
        body,
        type, // success, warning, danger, info
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) + ' | ' + new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    });
    // Cap at 100 logs for robust institutional history
    if (feed.length > 100) feed.pop();
    localStorage.setItem('rc_audit_log', JSON.stringify(feed));
}

// Data Actions
function carryOverTenants() {
    let prevMonth = selectedMonth - 1;
    let prevYear = selectedYear;
    if (prevMonth < 0) { prevMonth = 11; prevYear--; }

    const prevKey = `rc_tenants_${prevMonth}_${prevYear}`;
    const prevTenants = loadData(prevKey);

    if (prevTenants.length === 0) {
        showToast("Import Rollback", "No tenant records found in the previous month to import.", "error");
        return;
    }

    const currentTenants = loadData(getTenantKey());
    let importedCount = 0;

    prevTenants.forEach(pt => {
        if (!currentTenants.some(ct => ct.name === pt.name)) {
            const nextPrevReading = pt.currReading !== undefined ? pt.currReading : (pt.prevReading || 0);
            currentTenants.push({
                name: pt.name,
                roomType: pt.roomType,
                property: pt.property || 'Unassigned',
                phone: pt.phone || '',
                amount: pt.amount,
                status: 'pending',
                rentCycleDay: pt.rentCycleDay || 1,
                initialDeposit: pt.initialDeposit || DEPOSIT_MAP[pt.roomType] || 10000,
                currentDeposit: pt.currentDeposit !== undefined ? pt.currentDeposit : (pt.initialDeposit || DEPOSIT_MAP[pt.roomType] || 10000),
                deductions: pt.deductions || [],
                lateFee: pt.lateFee || 0,

                prevReading: nextPrevReading,
                currReading: 0,
                electricityCharge: 0,

                waterCharge: 55, // Flat water fee
                totalDue: pt.amount + 55,
                paymentHistory: pt.paymentHistory || []
            });
            importedCount++;
        }
    });

    saveData(getTenantKey(), currentTenants);
    
    logTimelineEvent("Leases Rolled Over", `Cloned ${importedCount} active leases from previous period. Previous electricity readings set to last month's current readings.`, "success");
    refreshAllViews();
    showToast("Data Cloned", `Successfully imported ${importedCount} resident(s). Last month's current electricity readings rolled over to previous readings!`, "success");
}

// Notifications
function generateReminderMessage(tenant) {
    const isOverdue = tenant.status === 'overdue';
    const lateFee = Number(tenant.lateFee || 0);
    const baseAmount = Number(tenant.amount);
    const waterAmt = 55;
    const elecCharge = Number(tenant.electricityCharge || 0);

    // Check if it's the resident's very first onboarding month
    const isFirstMonth = (tenant.startMonth === selectedMonth && tenant.startYear === selectedYear);
    const depositAmt = isFirstMonth ? Number(tenant.initialDeposit || 0) : 0;

    const totalAmount = calculateTenantTotalDue(tenant, true);

    const upiUri = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent("rentIQ")}&am=${totalAmount}&cu=INR`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiUri)}`;
    let msg = `Hello ${tenant.name},\nThis is a rent invoice reminder for your tenancy at ${tenant.property || 'Unassigned'} (Room type: ${tenant.roomType || 'N/A'}).`;
    
    if (elecCharge > 0) {
        msg += `\n- Electricity Charge (Meter: ${tenant.prevReading || 0} -> ${tenant.currReading || 0}): ${formatCurrency(elecCharge)}`;
    }
    
    if (isOverdue && lateFee > 0) {
        msg += `\n- Late Penalty: ${formatCurrency(lateFee)}`;
    }
    
    msg += `\n--------------------------\n- TOTAL OUTSTANDING DUE: ${formatCurrency(totalAmount)}\n--------------------------`;
    msg += `\n\nScan/Click to pay instantly via secure settlement UPI:\n${qrUrl}`;
    msg += `\n\nनमस्कार ${tenant.name},\nही तुमच्या भाड्याच्या आणि युटिलिटी बिलांच्या पेमेंटसाठी rentIQ ची स्वयंचलित आठवण आहे. एकूण देय रक्कम: ${formatCurrency(totalAmount)}.`;
    msg += `\n\nThank you / धन्यवाद!\nrentIQ Ledger Services`;
    return msg;
}

function sendWhatsApp(tenant) {
    const currentDay = currentDate.getDate();
    const cycleDay = Number(tenant.rentCycleDay || 1);
    
    if (cycleDay !== currentDay) {
        if (!confirm(`Warning: Today is Day ${currentDay}, but ${tenant.name}'s rent cycle is scheduled for Day ${cycleDay}. Do you still wish to dispatch this reminder?`)) {
            return;
        }
    }

    const phone = tenant.phone || '';
    if (!phone) return showToast("Remind Failed", `No phone number found for ${tenant.name}.`, "error");
    window.open(`https://wa.me/91${phone}?text=${encodeURIComponent(generateReminderMessage(tenant))}`, '_blank');
}

function sendSMS(tenant) {
    const phone = tenant.phone || '';
    if (!phone) return showToast("Remind Failed", `No phone number found for ${tenant.name}.`, "error");
    window.open(`sms:+91${phone}?body=${encodeURIComponent(generateReminderMessage(tenant))}`, '_self');
}

function sendEmail(tenant) {
    window.open(`mailto:?subject=Rent Invoice Statement [rentIQ]&body=${encodeURIComponent(generateReminderMessage(tenant))}`, '_self');
}

function remindAllPending() {
    const tenants = loadData(getTenantKey());
    const currentDay = currentDate.getDate();
    
    // Only remind tenants whose rent cycle is today!
    const pendingToday = tenants.filter(t => t.status !== 'paid' && Number(t.rentCycleDay || 1) === currentDay);

    if (pendingToday.length === 0) {
        showToast("No Cycle Reminders", `No residents have active rent cycles due today (Day ${currentDay}).`, "info");
        return;
    }

    if (confirm(`Are you sure you want to generate WhatsApp messages for ${pendingToday.length} resident(s) due today?`)) {
        pendingToday.forEach(t => {
            if (t.phone) {
                window.open(`https://wa.me/91${t.phone}?text=${encodeURIComponent(generateReminderMessage(t))}`, '_blank');
            }
        });
        logTimelineEvent("Automated Reminders", `Dispatched ${pendingToday.length} rent reminders for cycle Day ${currentDay}.`, "info");
    }
}

// QR Code
function showQRCode(tenant) {
    const modal = $('#qr-modal');
    if (!modal) return;
    
    $('#qr-tenant-name').textContent = tenant.name;
    const isOverdue = tenant.status === 'overdue';
    const totalAmount = Number(tenant.amount) + 55 + (isOverdue ? Number(tenant.lateFee || 0) : 0);
    $('#qr-amount').textContent = formatCurrency(totalAmount);

    // Generate UPI URI
    const upiUri = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent("rentIQ Settlement")}&am=${totalAmount}&cu=INR`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiUri)}`;

    $('#qr-image').src = qrUrl;
    modal.classList.add('active');
}

// Premium High-Contrast Toast Notifications
function showToast(title, message, type = 'success') {
    const container = $('#toast-container');
    if (!container) return;

    let iconClass = 'fa-circle-check';
    let iconColor = '#22c55e';
    if (type === 'error') {
        iconClass = 'fa-circle-exclamation';
        iconColor = '#ef4444';
    } else if (type === 'warning') {
        iconClass = 'fa-triangle-exclamation';
        iconColor = '#eab308';
    } else if (type === 'info') {
        iconClass = 'fa-circle-info';
        iconColor = '#3b82f6';
    }

    const toast = document.createElement('div');
    toast.className = 'toast-premium';
    toast.style.borderLeft = `4px solid ${iconColor}`;
    toast.innerHTML = `
        <i class="fa-solid ${iconClass}" style="color: ${iconColor}; font-size: 18px; margin-top: 2px;"></i>
        <div style="flex: 1;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                <h4 style="font-size: 12px; font-weight: 700; color: var(--text-main); margin: 0;">${title}</h4>
                <span style="font-size: 9px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px;">rentIQ Ledger</span>
            </div>
            <p style="font-size: 11px; color: var(--text-dim); margin: 0; line-height: 1.4;">${message}</p>
        </div>
    `;
    container.appendChild(toast);

    // Animated entry and exit managed cleanly via GPU transitions
    setTimeout(() => {
        toast.style.opacity = '1';
    }, 50);

    setTimeout(() => {
        toast.style.transition = 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(80px) scale(0.92)';
        setTimeout(() => toast.remove(), 400);
    }, 5000);
}

// Rendering
function renderDashboard() {
    let tenants = loadData(getTenantKey());
    const expenses = loadData(getExpenseKey());

    // Populate Bill Calculator Tenant Selector dropdown dynamically from directory (Records section)
    const calcTenantSelect = $('#calc-tenant-select');
    if (calcTenantSelect) {
        const currentVal = calcTenantSelect.value;
        const directory = loadData("rc_directory") || [];
        calcTenantSelect.innerHTML = '<option value="">-- Select Active Resident --</option>' + 
            directory.map((c) => `<option value="${c.name}">${c.name}</option>`).join('');
        // Restore selected value if still valid
        if (currentVal && directory.some(c => c.name === currentVal)) {
            calcTenantSelect.value = currentVal;
        }
    }

    // Search Filtering
    const searchInput = $('#ledger-search');
    const searchQuery = searchInput ? searchInput.value.toLowerCase().trim() : '';
    
    // Status Filter tab filtering
    const activeFilterBtn = $('.filter-tab.active');
    const activeFilter = activeFilterBtn ? activeFilterBtn.getAttribute('data-filter') : 'all';

    let filteredTenants = tenants.filter(t => {
        const matchesSearch = t.name.toLowerCase().includes(searchQuery) || 
                              t.property.toLowerCase().includes(searchQuery) ||
                              t.roomType.toLowerCase().includes(searchQuery);
        
        if (activeFilter === 'all') return matchesSearch;
        return matchesSearch && t.status === activeFilter;
    });

    const container = $('#tenant-list');
    if (container) {
        container.innerHTML = '';
        if (filteredTenants.length === 0) {
            container.innerHTML = '<p style="text-align:center; padding:30px; color:var(--text-muted); font-size:13px;"><i class="fa-solid fa-folder-open" style="font-size:24px; display:block; margin-bottom:8px;"></i>No residents matching the criteria.</p>';
        } else {
            const table = document.createElement('table');
            table.className = 'ledger-table';
            table.innerHTML = `
                <thead class="ledger-thead">
                    <tr>
                        <th class="ledger-th">Resident & Unit</th>
                        <th class="ledger-th">Rent Cycle</th>
                        <th class="ledger-th">Monthly Rent</th>
                        <th class="ledger-th">Security Deposit</th>
                        <th class="ledger-th">Status</th>
                        <th class="ledger-th" style="text-align: right;">Actions</th>
                    </tr>
                </thead>
                <tbody id="ledger-tbody"></tbody>
            `;
            container.appendChild(table);
            const tbody = $('#ledger-tbody');

            filteredTenants.forEach((t) => {
                const tr = document.createElement('tr');
                tr.className = 'ledger-tr';

                const totalRentAmount = Number(t.amount || 0);
                const currentDepositBal = t.currentDeposit !== undefined ? Number(t.currentDeposit) : (DEPOSIT_MAP[t.roomType] || 10000);
                const rentCycleDay = t.rentCycleDay || 1;
                const electricityCharge = Number(t.electricityCharge || 0);

                let statusClass = 'pending';
                if (t.status === 'paid') statusClass = 'paid';
                else if (t.status === 'overdue') statusClass = 'overdue';

                const statusLabel = t.status ? t.status.charAt(0).toUpperCase() + t.status.slice(1) : 'Pending';

                // Find original index
                const origIndex = tenants.findIndex(x => x.name === t.name);

                tr.innerHTML = `
                    <td class="ledger-td">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <div class="avatar"><img src="https://ui-avatars.com/api/?name=${encodeURIComponent(t.name)}&background=818cf8&color=fff&size=36" style="border-radius: var(--radius-full); width: 36px;"></div>
                            <div>
                                <p class="ledger-tenant-name">${t.name}</p>
                                <p class="ledger-tenant-meta tooltip-container" data-tooltip="Click to call +91 ${t.phone || ''}">
                                    <a href="tel:+91${t.phone || ''}" style="color: inherit; text-decoration: none;">
                                        <i class="fa-solid fa-phone" style="font-size: 10px; color: var(--accent);"></i> +91 ${t.phone || 'N/A'}
                                    </a>
                                </p>
                            </div>
                        </div>
                    </td>
                    <td class="ledger-td">
                        <span style="font-weight: 600; color: var(--text-main); font-size: 12px;">Day ${rentCycleDay}</span>
                        <p style="font-size: 10px; color: var(--text-muted);">of the month</p>
                    </td>
                    <td class="ledger-td">
                        <p style="font-size: 10px; color: var(--text-muted);">${t.property || 'Unassigned'} (${t.roomType})${electricityCharge > 0 ? ` + Elec: ${formatCurrency(electricityCharge)}` : ''}</p>
                        <span style="font-weight: 600; color: #3b82f6;">${formatCurrency(currentDepositBal)}</span>
                        <p style="font-size: 10px; color: var(--text-muted);">${t.depositDate ? `Collected ${t.depositDate}` : 'held in trust'}</p>
                    </td>
                    <td class="ledger-td">
                        <span class="status-badge status-${statusClass}" style="cursor: pointer; font-size: 10px; padding: 4px 8px; font-weight: 700;" onclick="toggleStatusForResident(${origIndex})">
                            ${statusLabel}
                        </span>
                    </td>
                    <td class="ledger-td" style="text-align: right;">
                        <div style="display: flex; gap: 6px; justify-content: flex-end; align-items: center;">
                            <button class="action-btn calc-btn" title="Calculate Bill" onclick="openBillCalculatorForResident('${t.name}')" style="color: var(--accent);"><i class="fa-solid fa-calculator"></i></button>
                            <button class="action-btn qr-btn" title="Show QR Code" onclick="showQRForResident(${origIndex})"><i class="fa-solid fa-qrcode"></i></button>
                            <button class="action-btn wa-btn" title="WhatsApp Reminder" onclick="sendWhatsAppForResident(${origIndex})"><i class="fa-brands fa-whatsapp"></i></button>
                            <button class="action-btn" title="Delete Resident" onclick="deleteResident(${origIndex})" style="color: var(--status-overdue-text);"><i class="fa-solid fa-trash-can"></i></button>
                        </div>
                    </td>
                `;

                tbody.appendChild(tr);
            });
        }
    }

    // CALCULATE FINANCIAL STATISTICS & METRICS
    let totalRentCollected = 0;
    let totalRentPending = 0;
    let totalActiveDeposits = 0;
    let totalActiveLeases = tenants.length;

    tenants.forEach(t => {
        const depositBal = t.currentDeposit !== undefined ? Number(t.currentDeposit) : (DEPOSIT_MAP[t.roomType] || 10000);
        totalActiveDeposits += depositBal;

        let baseDue = window.calculateTenantTotalDue ? window.calculateTenantTotalDue(t, false) : (t.totalDue !== undefined ? Number(t.totalDue) : (Number(t.amount || 0) + 55 + Number(t.electricityCharge || 0)));
        
        const recurringDueVal = baseDue;

        if (t.status === 'paid') {
            totalRentCollected += recurringDueVal;
        } else {
            totalRentPending += recurringDueVal;
        }
    });

    const totalBillsAndRentDue = totalRentCollected + totalRentPending;
    const collectionEfficiency = totalBillsAndRentDue > 0 ? Math.round((totalRentCollected / totalBillsAndRentDue) * 100) : 0;
    const capacityLimit = 20; // 20 units total capacity
    const occupancyRate = Math.min(Math.round((totalActiveLeases / capacityLimit) * 100), 100);

    // Update Operational KPI widgets
    if ($('#stat-collection-efficiency')) $('#stat-collection-efficiency').textContent = `${collectionEfficiency}%`;
    if ($('#stat-efficiency-desc')) $('#stat-efficiency-desc').textContent = `${formatCurrency(totalRentCollected)} of ${formatCurrency(totalBillsAndRentDue)} collected`;

    if ($('#stat-occupancy-rate')) $('#stat-occupancy-rate').textContent = `${occupancyRate}%`;
    if ($('#stat-occupancy-desc')) $('#stat-occupancy-desc').textContent = `${totalActiveLeases} of ${capacityLimit} units leased`;

    if ($('#stat-deposit-liabilities')) $('#stat-deposit-liabilities').textContent = formatCurrency(totalActiveDeposits);

    const totalExp = expenses.reduce((acc, e) => acc + Number(e.amount), 0);
    if ($('#net-profit')) $('#net-profit').textContent = formatCurrency(totalRentCollected - totalExp);
    if ($('#stat-cashflow-desc')) $('#stat-cashflow-desc').textContent = `Collected: ${formatCurrency(totalRentCollected)} | Expenses: ${formatCurrency(totalExp)}`;

    // SMART REMINDERS ALERTS QUEUE
    const currentDay = currentDate.getDate();
    const cycleDayMatches = tenants.filter(t => t.status !== 'paid' && Number(t.rentCycleDay || 1) === currentDay);
    const remindersBox = $('#smart-reminders-box');
    const remindersText = $('#smart-reminders-text');
    
    if (remindersBox && remindersText) {
        if (cycleDayMatches.length > 0) {
            remindersBox.style.display = 'block';
            remindersText.innerHTML = `<strong>${cycleDayMatches.length}</strong> resident(s) have active rent cycles starting today (Day ${currentDay}). Click below to dispatch custom WhatsApp alerts.`;
            
            $('#smart-remind-btn').onclick = () => {
                cycleDayMatches.forEach(t => sendWhatsApp(t));
                showToast("Reminders Dispatched", `Sent WhatsApp alerts to ${cycleDayMatches.length} resident(s).`, "success");
            };
        } else {
            remindersBox.style.display = 'none';
        }
    }

    // UPCOMING RENT CYCLES WIDGET
    const upcomingContainer = $('#upcoming-dues-list');
    if (upcomingContainer) {
        upcomingContainer.innerHTML = '';
        
        // 1. Calculate Smart Owner Reminders Data
        const todayExpected = tenants.filter(t => t.status !== 'paid' && Number(t.rentCycleDay || 1) === currentDay);
        const pendingFollowups = tenants.filter(t => t.status === 'overdue');
        const upcomingThisWeek = tenants.filter(t => {
            if (t.status === 'paid') return false;
            const cycleDay = Number(t.rentCycleDay || 1);
            let diff = cycleDay - currentDay;
            if (diff < 0) diff += 30;
            return diff > 0 && diff <= 7;
        });

        // Create Smart Owner Reminders Card Header
        const remindersDiv = document.createElement('div');
        remindersDiv.style.cssText = 'display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; padding: 16px; background: var(--bg-surface-hover); border-radius: var(--radius-xl); border: 1px solid var(--border);';
        
        // Today's expected collections
        const todayHTML = todayExpected.length > 0 
            ? `<div style="display:flex; align-items:center; gap:8px; font-size:12px; color:#eab308; font-weight:600;"><i class="fa-solid fa-bolt-lightning" style="animation: pulse 1.5s infinite;"></i> Today's Expected: Collect from ${todayExpected.map(x=>x.name).join(', ')}</div>`
            : `<div style="display:flex; align-items:center; gap:8px; font-size:12px; color:var(--text-muted);"><i class="fa-solid fa-circle-check" style="color:var(--status-paid-text);"></i> Today's Expected: All clear today</div>`;
            
        // Pending collection follow-ups
        const pendingHTML = pendingFollowups.length > 0
            ? `<div style="display:flex; align-items:center; gap:8px; font-size:12px; color:var(--status-overdue-text); font-weight:600;"><i class="fa-solid fa-triangle-exclamation"></i> Pending Follow-ups: ${pendingFollowups.length} overdue payments</div>`
            : `<div style="display:flex; align-items:center; gap:8px; font-size:12px; color:var(--text-muted);"><i class="fa-solid fa-circle-check" style="color:var(--status-paid-text);"></i> Follow-ups: No outstanding overdue follow-ups</div>`;

        // Collect rent from upcoming due residents
        const upcomingHTML = upcomingThisWeek.length > 0
            ? `<div style="display:flex; align-items:center; gap:8px; font-size:12px; color:#3b82f6; font-weight:600;"><i class="fa-solid fa-calendar-days"></i> Upcoming Rent Cycles: ${upcomingThisWeek.length} resident(s) due this week</div>`
            : `<div style="display:flex; align-items:center; gap:8px; font-size:12px; color:var(--text-muted);"><i class="fa-solid fa-circle-check" style="color:var(--status-paid-text);"></i> Upcoming: No cycles scheduled this week</div>`;

        remindersDiv.innerHTML = `
            <p style="font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.8px; color:var(--text-muted); margin-bottom:4px;">Smart Owner Reminders</p>
            ${todayHTML}
            ${pendingHTML}
            ${upcomingHTML}
        `;
        upcomingContainer.appendChild(remindersDiv);

        // Render Fintech-style Scheduling Visuals
        const allPending = tenants.filter(t => t.status !== 'paid').sort((a, b) => {
            let diffA = Number(a.rentCycleDay || 1) - currentDay;
            if (diffA < 0) diffA += 30;
            let diffB = Number(b.rentCycleDay || 1) - currentDay;
            if (diffB < 0) diffB += 30;
            return diffA - diffB;
        });

        if (allPending.length === 0) {
            const emptyP = document.createElement('p');
            emptyP.style.cssText = 'font-size: 12px; color: var(--text-muted); text-align: center; padding: 20px;';
            emptyP.innerHTML = `<i class="fa-solid fa-face-smile" style="font-size:18px; display:block; margin-bottom:6px;"></i> All resident accounts are settled and paid!`;
            upcomingContainer.appendChild(emptyP);
        } else {
            allPending.forEach(t => {
                const cycleDay = Number(t.rentCycleDay || 1);
                let diff = cycleDay - currentDay;
                if (diff < 0) diff += 30;

                // Priority Indicator logic
                let priorityText = 'LOW';
                let priorityColor = '#64748b';
                let priorityBg = 'rgba(100, 116, 139, 0.1)';
                let circleBg = 'rgba(255,255,255,0.05)';
                let borderTheme = 'var(--border)';

                if (t.status === 'overdue') {
                    priorityText = 'CRITICAL';
                    priorityColor = 'var(--status-overdue-text)';
                    priorityBg = 'rgba(239, 68, 68, 0.1)';
                    circleBg = 'rgba(239, 68, 68, 0.15)';
                    borderTheme = 'rgba(239, 68, 68, 0.2)';
                } else if (diff === 0) {
                    priorityText = 'HIGH';
                    priorityColor = '#eab308';
                    priorityBg = 'rgba(234, 179, 8, 0.1)';
                    circleBg = 'rgba(234, 179, 8, 0.15)';
                    borderTheme = 'rgba(234, 179, 8, 0.3)';
                } else if (diff <= 3) {
                    priorityText = 'MEDIUM';
                    priorityColor = '#3b82f6';
                    priorityBg = 'rgba(59, 130, 246, 0.1)';
                    circleBg = 'rgba(59, 130, 246, 0.15)';
                }

                // Render visual scheduling card
                const card = document.createElement('div');
                card.style.cssText = `display: flex; align-items: center; gap: 14px; padding: 14px; background: var(--bg-surface); border-radius: var(--radius-xl); border: 1px solid ${borderTheme}; margin-bottom: 12px; transition: all 0.2s ease; position: relative;`;
                
                // Add hover style hook
                card.onmouseover = () => { card.style.borderColor = priorityColor; card.style.boxShadow = `0 0 12px ${priorityBg}`; };
                card.onmouseout = () => { card.style.borderColor = borderTheme; card.style.boxShadow = 'none'; };

                // Find original index
                const origIndex = tenants.findIndex(x => x.name === t.name);

                card.innerHTML = `
                    <div style="width: 44px; height: 44px; border-radius: 50%; background: ${circleBg}; display: flex; flex-direction: column; align-items: center; justify-content: center; border: 1px solid ${priorityColor}40;">
                        <span style="font-size: 14px; font-weight: 800; color: ${priorityColor}; line-height: 1;">${cycleDay}</span>
                        <span style="font-size: 8px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Day</span>
                    </div>
                    <div style="flex-grow: 1;">
                        <div style="display: flex; align-items: center; gap: 6px;">
                            <p style="font-size: 13px; font-weight: 700; color: var(--text-main); margin: 0;">${t.name}</p>
                            <span style="font-size: 9px; font-weight: 800; padding: 2px 6px; border-radius: 4px; color: ${priorityColor}; background: ${priorityBg};">${priorityText}</span>
                        </div>
                        <p style="font-size: 10px; color: var(--text-muted); margin: 2px 0 0 0;">Joined: ${t.joiningDate || 'N/A'} • Room ${t.roomType}</p>
                    </div>
                    <div style="text-align: right; display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
                        <p style="font-size: 13px; font-weight: 800; color: var(--text-main); margin: 0;">${formatCurrency(calculateTenantTotalDue(t, true))}</p>
                        <button class="action-btn wa-btn" title="Send WhatsApp Reminder Now" onclick="sendWhatsApp(${origIndex})" style="width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; border-radius: 50%; font-size: 11px;"><i class="fa-brands fa-whatsapp"></i></button>
                    </div>
                `;
                upcomingContainer.appendChild(card);
            });
        }
    }

    // AUDIT LOG EVENT TIMELINE FEED
    const timelineContainer = $('#activity-timeline-feed');
    if (timelineContainer) {
        timelineContainer.innerHTML = '';
        const logs = JSON.parse(localStorage.getItem('rc_audit_log')) || [];
        if (logs.length === 0) {
            timelineContainer.innerHTML = '<p style="font-size: 11px; color: var(--text-muted); text-align: center; padding: 10px 0;">No timeline events recorded yet.</p>';
        } else {
            logs.slice(0, 30).forEach(log => {
                const item = document.createElement('div');
                item.className = 'timeline-item';
                
                let markerClass = 'marker-info';
                if (log.type === 'success') markerClass = 'marker-success';
                else if (log.type === 'warning') markerClass = 'marker-warning';
                else if (log.type === 'danger') markerClass = 'marker-danger';

                item.innerHTML = `
                    <div class="timeline-marker ${markerClass}"></div>
                    <div class="timeline-content">
                        <div class="timeline-header">
                            <span class="timeline-title">${log.title}</span>
                            <span class="timeline-time">${log.timestamp}</span>
                        </div>
                        <div class="timeline-body">${log.body}</div>
                    </div>
                `;
                timelineContainer.appendChild(item);
            });
        }
    }

    // Render Expenses List
    const expContainer = $('#expense-list');
    if (expContainer) {
        expContainer.innerHTML = '';
        if (expenses.length === 0) {
            expContainer.innerHTML = '<p style="font-size: 12px; color: var(--text-dim); text-align: center;">No expenses logged yet.</p>';
        } else {
            expenses.forEach((exp, i) => {
                const expDiv = document.createElement('div');
                expDiv.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; background: var(--bg-main); border-radius: var(--radius-sm); border: 1px solid var(--border); margin-bottom: 8px;';
                expDiv.innerHTML = `
                    <div style="flex: 1;">
                        <p style="font-size: 13px; font-weight: 500;">${exp.desc}</p>
                        <p style="font-size: 11px; color: var(--text-muted);">${exp.date || 'General'}</p>
                    </div>
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <span style="font-size: 13px; font-weight: 700; color: var(--text-main);">${formatCurrency(exp.amount)}</span>
                        <button class="action-btn" style="color: var(--status-overdue-text);" id="del-exp-btn-${i}"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                `;
                expContainer.appendChild(expDiv);
                
                const delExpEl = $(`#del-exp-btn-${i}`);
                if (delExpEl) {
                    delExpEl.onclick = () => {
                        if (confirm(`Delete expense: ${exp.desc}?`)) {
                            expenses.splice(i, 1);
                            saveData(getExpenseKey(), expenses);
                            refreshAllViews();
                            logTimelineEvent("Expense Deleted", `Removed general expense record: ${exp.desc}.`, "warning");
                        }
                    };
                }
            });
        }
    }
}

function populateExpenseTenantSelect() {
    const select = $('#exp-tenant-select');
    if (!select) return;
    const tenants = loadData(getTenantKey());
    select.innerHTML = '<option value="">General Property Expense</option>';
    tenants.forEach((t, i) => {
        const opt = document.createElement('option');
        opt.value = i;
        opt.textContent = `${t.name} (${t.property || 'B1'})`;
        select.appendChild(opt);
    });
}

function initCharts() {
    if (typeof Chart === 'undefined') return;

    const tenants = loadData(getTenantKey());
    const expenses = loadData(getExpenseKey());

    let totalRent = 0;
    tenants.forEach(t => {
        if (t.status === 'paid') {
            const baseDue = window.calculateTenantTotalDue ? window.calculateTenantTotalDue(t, false) : (Number(t.amount || 0) + 55 + Number(t.electricityCharge || 0));
            totalRent += baseDue;
        }
    });
    const totalExp = expenses.reduce((acc, e) => acc + Number(e.amount), 0);

    Object.values(charts).forEach(c => c.destroy());

    // Global Chart Defaults for Premium Look
    const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-main').trim() || '#0f172a';
    const gridColor = getComputedStyle(document.documentElement).getPropertyValue('--border').trim() || '#e2e8f0';

    Chart.defaults.color = textColor;
    Chart.defaults.font.family = "'Inter', sans-serif";
    Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(15, 23, 42, 0.9)';
    Chart.defaults.plugins.tooltip.padding = 16;
    Chart.defaults.plugins.tooltip.cornerRadius = 12;
    Chart.defaults.plugins.tooltip.titleFont = { size: 14, weight: 'bold', family: "'Inter', sans-serif" };
    Chart.defaults.plugins.tooltip.bodyFont = { size: 13, family: "'Inter', sans-serif" };
    Chart.defaults.plugins.tooltip.displayColors = false;

    // 1. Revenue vs Expenses (Doughnut)
    const revCanvas = $('#revenueChart');
    if (revCanvas) {
        const ctx = revCanvas.getContext('2d');
        const revGradient = ctx.createLinearGradient(0, 0, 0, 300);
        revGradient.addColorStop(0, '#60a5fa');
        revGradient.addColorStop(1, '#2563eb');

        const expGradient = ctx.createLinearGradient(0, 0, 0, 300);
        expGradient.addColorStop(0, '#f87171');
        expGradient.addColorStop(1, '#dc2626');

        charts.revenue = new Chart(revCanvas, {
            type: 'doughnut',
            data: {
                labels: ['Collected Revenue', 'Logged Expenses'],
                datasets: [{
                    data: [totalRent, totalExp],
                    backgroundColor: [revGradient, expGradient],
                    borderWidth: 0,
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '75%',
                animation: { animateScale: true, animateRotate: true, duration: 1500, easing: 'easeOutQuart' },
                plugins: {
                    legend: { position: 'bottom', labels: { padding: 20, usePointStyle: true, pointStyle: 'circle' } }
                }
            }
        });
    }

    // 2. Deposit Breakdown (Bar)
    const depCanvas = $('#depositChart');
    if (depCanvas) {
        const ctx = depCanvas.getContext('2d');
        const barGradient = ctx.createLinearGradient(0, 0, 0, 300);
        barGradient.addColorStop(0, '#818cf8');
        barGradient.addColorStop(1, '#4f46e5');

        const roomCounts = tenants.reduce((acc, t) => { acc[t.roomType] = (acc[t.roomType] || 0) + 1; return acc; }, {});

        charts.deposit = new Chart(depCanvas, {
            type: 'bar',
            data: {
                labels: Object.keys(DEPOSIT_MAP),
                datasets: [{
                    label: 'Total Deposits (₹)',
                    data: Object.keys(DEPOSIT_MAP).map(k => (roomCounts[k] || 0) * DEPOSIT_MAP[k]),
                    backgroundColor: barGradient,
                    borderRadius: 8,
                    barThickness: 40
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 1500, easing: 'easeOutQuart' },
                scales: {
                    y: { beginAtZero: true, grid: { color: gridColor, drawBorder: false }, border: { dash: [5, 5] } },
                    x: { grid: { display: false } }
                },
                plugins: { legend: { display: false } }
            }
        });
    }

    // 3. Property Income Split (Polar)
    const propCanvas = $('#propertyChart');
    if (propCanvas) {
        const propIncome = tenants.reduce((acc, t) => {
            if (t.status === 'paid') {
                const prop = t.property || 'Building 1';
                acc[prop] = (acc[prop] || 0) + Number(t.amount);
            }
            return acc;
        }, {});

        charts.property = new Chart(propCanvas, {
            type: 'polarArea',
            data: {
                labels: Object.keys(propIncome).length > 0 ? Object.keys(propIncome) : ['No Data'],
                datasets: [{
                    data: Object.values(propIncome).length > 0 ? Object.values(propIncome) : [1],
                    backgroundColor: [
                        'rgba(59, 130, 246, 0.8)',
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(139, 92, 246, 0.8)',
                        'rgba(245, 158, 11, 0.8)'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: { animateScale: true, duration: 1500, easing: 'easeOutQuart' },
                scales: { r: { ticks: { display: false }, grid: { color: gridColor } } },
                plugins: {
                    legend: { position: 'bottom', labels: { padding: 20, usePointStyle: true, pointStyle: 'circle' } }
                }
            }
        });
    }
}

function renderCalendar() {
    const grid = $('#calendar-grid');
    const monthDisplay = $('#current-month-display');
    if (!grid || !monthDisplay) return;

    grid.innerHTML = '';
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    monthDisplay.textContent = `${months[selectedMonth]} ${selectedYear}`;

    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const tenants = loadData(getTenantKey());

    for (let i = 1; i <= daysInMonth; i++) {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'calendar-day';
        dayDiv.innerHTML = `<span class="day-num">${i}</span>`;

        tenants.forEach((t) => {
            if (t.status === 'paid' && t.paidAt) {
                const paidDate = new Date(t.paidAt);
                if (paidDate.getDate() === i &&
                    paidDate.getMonth() === selectedMonth &&
                    paidDate.getFullYear() === selectedYear) {

                    const ev = document.createElement('div');
                    ev.className = 'day-event event-paid';
                    ev.innerHTML = `
                        <div style="display: flex; flex-direction: column; width: 100%;">
                            <span style="font-weight: 700;"><i class="fa-solid fa-circle-check"></i> ${t.name.split(' ')[0]}</span>
                            <span style="font-size: 9px; opacity: 0.9;">${formatCurrency(t.amount)}</span>
                        </div>
                    `;
                }
            } else if (t.status !== 'paid') {
                const rentCycleDay = Number(t.rentCycleDay || 1);
                if (rentCycleDay === i) {
                    const ev = document.createElement('div');
                    ev.className = 'day-event event-pending';
                    ev.innerHTML = `
                        <div style="display: flex; flex-direction: column; width: 100%;">
                            <span style="font-weight: 700; color: #eab308;"><i class="fa-solid fa-clock"></i> ${t.name.split(' ')[0]} (Due)</span>
                            <span style="font-size: 9px; opacity: 0.9;">${formatCurrency(window.calculateTenantTotalDue ? window.calculateTenantTotalDue(t, false) : t.amount)}</span>
                        </div>
                    `;
                    dayDiv.appendChild(ev);
                }
            }

            // Security Deposit Collection Entry
            if (t.depositDate) {
                const depDate = new Date(t.depositDate);
                if (!isNaN(depDate.getTime()) &&
                    depDate.getDate() === i &&
                    depDate.getMonth() === selectedMonth &&
                    depDate.getFullYear() === selectedYear) {

                    const ev = document.createElement('div');
                    ev.className = 'day-event';
                    ev.style.background = '#e0f2fe';
                    ev.style.color = '#0369a1';
                    ev.style.border = '1px solid rgba(3, 105, 161, 0.2)';
                    ev.innerHTML = `
                        <div style="display: flex; flex-direction: column; width: 100%;">
                            <span style="font-weight: 700;"><i class="fa-solid fa-vault"></i> ${t.name.split(' ')[0]}</span>
                            <span style="font-size: 9px; opacity: 0.9;">+${formatCurrency(t.initialDeposit || 10000)}</span>
                        </div>
                    `;
                    dayDiv.appendChild(ev);
                }
            }

            if (t.deductions) {
                t.deductions.forEach(d => {
                    const dDate = new Date(d.date);
                    if (dDate.getDate() === i &&
                        dDate.getMonth() === selectedMonth &&
                        dDate.getFullYear() === selectedYear) {

                        const ev = document.createElement('div');
                        ev.className = 'day-event';
                        ev.style.background = '#fee2e2';
                        ev.style.color = '#b91c1c';
                        ev.style.border = '1px solid rgba(185, 28, 28, 0.2)';
                        ev.innerHTML = `
                            <div style="display: flex; flex-direction: column; width: 100%;">
                                <span style="font-weight: 700;"><i class="fa-solid fa-scissors"></i> ${t.name.split(' ')[0]}</span>
                                <span style="font-size: 9px; opacity: 0.9;">-${formatCurrency(d.amount)}</span>
                            </div>
                        `;
                        dayDiv.appendChild(ev);
                    }
                });
            }
        });

        grid.appendChild(dayDiv);
    }
}

function populateExpenseTenantSelect() {
    const select = $('#exp-tenant-select');
    if (!select) return;
    const tenants = loadData(getTenantKey());
    select.innerHTML = '<option value="">General Property Expense</option>';
    tenants.forEach((t, i) => {
        const opt = document.createElement('option');
        opt.value = i;
        opt.textContent = `${t.name} (${t.property || 'B1'})`;
        select.appendChild(opt);
    });
}

function renderDeposits() {
    const ledgerContainer = $('#deposit-ledger');
    const logContainer = $('#deduction-log');
    if (!ledgerContainer || !logContainer) return;

    const tenants = loadData(getTenantKey());
    ledgerContainer.innerHTML = '';
    logContainer.innerHTML = '';

    if (tenants.length === 0) {
        ledgerContainer.innerHTML = '<p style="text-align:center; padding:30px; color:var(--text-muted); font-size:13px;"><i class="fa-solid fa-vault" style="font-size:24px; display:block; margin-bottom:8px;"></i>No active residents found to manage deposits.</p>';
    } else {
        // Automatically populate select dropdown options inside deposits forms
        const deductSelect = $('#deposit-deduct-tenant');
        const refundSelect = $('#deposit-refund-tenant');
        if (deductSelect) {
            deductSelect.innerHTML = tenants.map((t, idx) => `<option value="${idx}">${t.name} (${t.property || 'Unassigned'} - ${t.roomType})</option>`).join('');
        }
        if (refundSelect) {
            refundSelect.innerHTML = tenants.map((t, idx) => `<option value="${idx}">${t.name} (${t.property || 'Unassigned'} - ${t.roomType})</option>`).join('');
        }

        let allDeductions = [];

        tenants.forEach((t) => {
            const initial = t.initialDeposit !== undefined ? Number(t.initialDeposit) : (DEPOSIT_MAP[t.roomType] || 10000);
            const current = t.currentDeposit !== undefined ? Number(t.currentDeposit) : initial;
            const percent = initial > 0 ? (current / initial) * 100 : 0;

            const div = document.createElement('div');
            div.className = 'tenant-item reveal visible';
            div.style.cssText = 'padding: var(--space-md) var(--space-lg); border-radius: var(--radius-lg); background: var(--bg-surface-hover); border: 1px solid var(--border); margin-bottom: var(--space-md);';
            div.innerHTML = `
                <div class="tenant-info" style="flex:1">
                    <p class="tenant-name" style="font-weight: 700; color: var(--text-main); font-size: 13px;">${t.name}</p>
                    <p class="tenant-details" style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">
                        Property: <strong>${t.property || 'Unassigned'} (${t.roomType})</strong> • Initial: ${formatCurrency(initial)}
                    </p>
                    <div class="progress-bar" style="margin-top: 10px; height: 6px; background: rgba(255,255,255,0.05); border-radius: var(--radius-full); overflow: hidden;">
                        <div class="progress-fill" style="width:${percent}%; height:100%; background:${percent < 50 ? '#dc2626' : (percent < 90 ? '#eab308' : '#22c55e')}; border-radius: var(--radius-full);"></div>
                    </div>
                </div>
                <div style="text-align:right; display:flex; flex-direction:column; justify-content:center;">
                    <p class="tenant-amount" style="font-weight: 700; color:${percent < 100 ? '#ef4444' : 'var(--text-main)'}; font-size: 14px;">${formatCurrency(current)}</p>
                    <p style="font-size:10px; color:var(--text-muted); margin-top: 2px;">${Math.round(percent)}% Remaining</p>
                </div>
            `;
            ledgerContainer.appendChild(div);

            if (t.deductions) {
                t.deductions.forEach(d => {
                    allDeductions.push({ ...d, tenantName: t.name });
                });
            }
        });

        allDeductions.sort((a, b) => new Date(b.date) - new Date(a.date));

        if (allDeductions.length === 0) {
            logContainer.innerHTML = '<p style="font-size: 11px; color: var(--text-muted); text-align: center; padding: 20px 0;">No security deposit claim logs found.</p>';
        } else {
            allDeductions.forEach(d => {
                const item = document.createElement('div');
                item.className = 'timeline-item';
                
                let markerClass = 'marker-danger'; // defaults to damage claim
                if (d.type === 'refund') markerClass = 'marker-success';

                item.innerHTML = `
                    <div class="timeline-marker ${markerClass}"></div>
                    <div class="timeline-content">
                        <div class="timeline-header">
                            <span class="timeline-title" style="font-weight: 700; color: var(--text-main);">${d.tenantName}</span>
                            <span class="timeline-time">${d.date}</span>
                        </div>
                        <div class="timeline-body" style="font-size: 11px; color: var(--text-dim); margin-top: 4px;">
                            <strong>${d.type === 'refund' ? 'Deposit Refunded' : 'Damage Claim'}:</strong> ${d.reason}
                            <p style="font-weight: 700; color: ${d.type === 'refund' ? '#22c55e' : '#ef4444'}; margin-top: 4px; font-size: 12px; margin-bottom:0;">
                                ${d.type === 'refund' ? '+' : '-'}${formatCurrency(d.amount)}
                            </p>
                        </div>
                    </div>
                `;
                logContainer.appendChild(item);
            });
        }
    }
}

function showReceipt(tenant) {
    const modal = $('#receipt-modal');
    if (!modal) return;

    $('#receipt-tenant').textContent = tenant.name;

    if (tenant.paidAt) {
        const d = new Date(tenant.paidAt);
        $('#receipt-date').textContent = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
    } else {
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        $('#receipt-date').textContent = `${months[selectedMonth]} ${selectedYear}`;
    }

    $('#receipt-property').textContent = `${tenant.property || 'N/A'} - ${tenant.roomType || 'N/A'}`;
    $('#receipt-total').textContent = formatCurrency(tenant.amount);

    modal.classList.add('active');
}

window.toggleStatusForResident = function(origIndex) {
    const tenants = loadData(getTenantKey());
    if (origIndex >= 0 && origIndex < tenants.length) {
        const t = tenants[origIndex];
        const order = ['paid', 'pending', 'overdue'];
        const nextStatus = order[(order.indexOf(t.status || 'pending') + 1) % 3];
        t.status = nextStatus;

        if (nextStatus === 'paid') {
            t.paidAt = new Date().toISOString();
            logTimelineEvent("Rent Received", `Rent collection of ${formatCurrency(t.amount)} verified for ${t.name} (${t.property}).`, "success");
            showToast('Collection Verified', `Confirmed rent payment for ${t.name}`, 'success');
        } else {
            delete t.paidAt;
        }

        saveData(getTenantKey(), tenants);
        refreshAllViews();
    }
};

window.showQRForResident = function(origIndex) {
    const tenants = loadData(getTenantKey());
    if (origIndex >= 0 && origIndex < tenants.length) {
        showQRCode(tenants[origIndex]);
    }
};

window.sendWhatsAppForResident = function(origIndex) {
    const tenants = loadData(getTenantKey());
    if (origIndex >= 0 && origIndex < tenants.length) {
        sendWhatsApp(tenants[origIndex]);
    }
};



window.deleteResident = function(origIndex) {
    const tenants = loadData(getTenantKey());
    if (origIndex >= 0 && origIndex < tenants.length) {
        const t = tenants[origIndex];
        if (confirm(`Are you absolutely sure you want to remove resident ${t.name}? This will release their room lease and active records.`)) {
            logTimelineEvent("Resident Offboarded", `${t.name} was offboarded and unit capacity released.`, "danger");
            tenants.splice(origIndex, 1);
            saveData(getTenantKey(), tenants);
            refreshAllViews();
            showToast("Resident Removed", `${t.name} has been successfully offboarded.`, "success");
        }
    }
};

function exportToCSV() {
    const tenants = loadData(getTenantKey());
    const expenses = loadData(getExpenseKey());
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthName = `${months[selectedMonth]} ${selectedYear}`;

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += `rentIQ Financial Report - ${monthName}\r\n\r\n`;

    csvContent += "RESIDENTS\r\n";
    csvContent += "Name,Property,Room,Phone,Amount,Status\r\n";
    tenants.forEach(t => {
        csvContent += `"${t.name}","${t.property || ''}","${t.roomType || ''}","${t.phone || ''}",${t.amount},"${t.status}"\r\n`;
    });

    csvContent += "\r\nEXPENSES\r\n";
    csvContent += "Description,Amount,Date\r\n";
    let totalExp = 0;
    expenses.forEach(e => {
        totalExp += Number(e.amount);
        const d = new Date(e.date).toLocaleDateString();
        csvContent += `"${e.desc}",${e.amount},"${d}"\r\n`;
    });

    const totalRent = tenants.reduce((acc, t) => acc + (t.status === 'paid' ? Number(t.amount) : 0), 0);
    csvContent += `\r\nSUMMARY\r\n`;
    csvContent += `Total Revenue Collected,${totalRent}\r\n`;
    csvContent += `Total Expenses,${totalExp}\r\n`;
    csvContent += `Net Profit,${totalRent - totalExp}\r\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `rentIQ_Report_${selectedMonth + 1}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

window.addEventListener('DOMContentLoaded', () => {
    initMonthSelector();
    initTheme();

    // Nav
    $$('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            switchTab(item.dataset.tab);
        });
    });

    // Actions
    if ($('#carry-over-btn')) $('#carry-over-btn').addEventListener('click', carryOverTenants);
    if ($('#clear-all-tenants-btn')) {
        $('#clear-all-tenants-btn').addEventListener('click', () => {
            if (confirm("Are you absolutely sure you want to remove ALL residents and clear the active month ledger? This action is irreversible.")) {
                saveData(getTenantKey(), []);
                logTimelineEvent("Ledger Cleared", "All resident records have been removed from the current month ledger.", "danger");
                showToast("Ledger Cleared", "All resident entries removed successfully.", "success");
                refreshAllViews();
            }
        });
    }
    if ($('#remind-all-btn')) $('#remind-all-btn').addEventListener('click', remindAllPending);

    // Search Bar Synchronizer & Advanced Filtering
    if ($('#tenant-search')) {
        $('#tenant-search').addEventListener('input', (e) => {
            if ($('#ledger-search')) $('#ledger-search').value = e.target.value;
            renderDashboard();
        });
    }
    if ($('#ledger-search')) {
        $('#ledger-search').addEventListener('input', (e) => {
            if ($('#tenant-search')) $('#tenant-search').value = e.target.value;
            renderDashboard();
        });
    }

    // Status Tab Filters
    $$('.filter-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            $$('.filter-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            renderDashboard();
        });
    });

    // Record Damage Deduction Form Submit Hook
    if ($('#deposit-deduct-btn')) {
        $('#deposit-deduct-btn').addEventListener('click', () => {
            const tenantIndexStr = $('#deposit-deduct-tenant').value;
            const amount = Number($('#deposit-deduct-amount').value || 0);
            const reason = $('#deposit-deduct-reason').value.trim();

            if (tenantIndexStr === "" || amount <= 0 || !reason) {
                showToast("Deduction Failed", "Please select a resident, input valid amount and reason.", "error");
                return;
            }

            const tenants = loadData(getTenantKey());
            const tenantIdx = parseInt(tenantIndexStr);
            if (tenantIdx >= 0 && tenantIdx < tenants.length) {
                const t = tenants[tenantIdx];
                const initial = t.initialDeposit !== undefined ? Number(t.initialDeposit) : (DEPOSIT_MAP[t.roomType] || 10000);
                const current = t.currentDeposit !== undefined ? Number(t.currentDeposit) : initial;

                if (amount > current) {
                    showToast("Insufficient Balance", `Deduction ₹${amount} exceeds current deposit balance ₹${current}.`, "error");
                    return;
                }

                t.currentDeposit = current - amount;
                if (!t.deductions) t.deductions = [];
                const claimDateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                t.deductions.push({
                    type: 'deduction',
                    amount,
                    reason,
                    date: claimDateStr
                });

                saveData(getTenantKey(), tenants);
                
                logTimelineEvent("Damage Deducted", `Deducted ₹${amount} from ${t.name}'s deposit for: ${reason}.`, "danger");

                refreshAllViews();
                showToast("Deduction Successful", `Successfully logged and deducted ₹${amount} from ${t.name}'s balance.`, "success");

                $('#deposit-deduct-amount').value = '';
                $('#deposit-deduct-reason').value = '';
            }
        });
    }

    // Process Move-out Refund Form Submit Hook
    if ($('#deposit-refund-btn')) {
        $('#deposit-refund-btn').addEventListener('click', () => {
            const tenantIndexStr = $('#deposit-refund-tenant').value;
            const amount = Number($('#deposit-refund-amount').value || 0);

            if (tenantIndexStr === "" || amount <= 0) {
                showToast("Refund Failed", "Please select a resident and specify a valid refund amount.", "error");
                return;
            }

            const tenants = loadData(getTenantKey());
            const tenantIdx = parseInt(tenantIndexStr);
            if (tenantIdx >= 0 && tenantIdx < tenants.length) {
                const t = tenants[tenantIdx];
                const initial = t.initialDeposit !== undefined ? Number(t.initialDeposit) : (DEPOSIT_MAP[t.roomType] || 10000);
                const current = t.currentDeposit !== undefined ? Number(t.currentDeposit) : initial;

                t.currentDeposit = current + amount;
                if (!t.deductions) t.deductions = [];
                const refundDateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                t.deductions.push({
                    type: 'refund',
                    amount,
                    reason: 'Move-out Security Refund',
                    date: refundDateStr
                });

                saveData(getTenantKey(), tenants);
                
                logTimelineEvent("Deposit Refunded", `Refunded ₹${amount} from security deposit trust to ${t.name}.`, "success");

                refreshAllViews();
                showToast("Refund Successful", `Processed refund of ₹${amount} for ${t.name}.`, "success");

                $('#deposit-refund-amount').value = '';
            }
        });
    }

    // Add Resident with Custom Deposit & Rent Cycle Days
    if ($('#add-tenant-btn')) {
        $('#add-tenant-btn').addEventListener('click', () => {
            const name = $('#new-name').value.trim();
            const phone = $('#new-phone') ? $('#new-phone').value.trim() : '';

            if (!name) {
                showToast("Missing Parameters", "Resident Name is required.", "error");
                return;
            }

            // Centralized Records alignment lookup
            const directory = loadData("rc_directory") || [];
            const record = directory.find(c => c.name.toLowerCase() === name.toLowerCase());

            const joiningDate = record && record.joiningDate ? record.joiningDate : new Date().toISOString().split('T')[0];
            const depositVal = record && record.depositAmount !== undefined ? Number(record.depositAmount) : 10000;
            const depositDate = record && record.depositDate ? record.depositDate : new Date().toISOString().split('T')[0];
            const cycleDay = record && record.joiningDate ? (parseInt(record.joiningDate.split('-')[2]) || 1) : 1;

            const property = 'Ram Niwas';
            const roomType = record && record.roomType ? record.roomType : '1RK';
            
            const RENT_MAP = { '1BHK': 10000, '2RK': 7000, '1RK': 4500 };
            const amount = RENT_MAP[roomType] || 4500; // Monthly rent properly derived from room type
            const lateFee = 0;

            const tenants = loadData(getTenantKey());
            const newResident = {
                name,
                property,
                roomType,
                phone,
                amount,
                lateFee,
                status: 'pending',
                rentCycleDay: cycleDay,
                joiningDate,
                depositDate,
                initialDeposit: depositVal,
                currentDeposit: depositVal,
                deductions: [],
                prevReading: 0,
                currReading: 0,
                electricityCharge: 0,
                waterCharge: 55,
                // Security deposit is collected separately, not part of recurring monthly rent invoice
                totalDue: amount + 55,
                paymentHistory: [],
                startMonth: selectedMonth,
                startYear: selectedYear
            };

            tenants.push(newResident);
            saveData(getTenantKey(), tenants);
            
            logTimelineEvent("Resident Onboarded", `${name} onboarded. Initial security deposit of ${formatCurrency(depositVal)} secured in trust. First recurring statement generated: ${formatCurrency(amount + 55)}.`, "success");

            refreshAllViews();
            showToast("Resident Onboarded", `${name} has been successfully added.`, "success");

            $('#new-name').value = '';
            if ($('#new-phone')) $('#new-phone').value = '';
            $('#new-amount').value = '';
            $('#new-late-fee').value = '';
            if ($('#new-cycle-day')) $('#new-cycle-day').value = '1';
            if ($('#new-deposit')) $('#new-deposit').value = '';
        });
    }

    // Add Expense
    if ($('#add-exp-btn')) {
        $('#add-exp-btn').addEventListener('click', () => {
            const desc = $('#exp-desc').value;
            const amt = Number($('#exp-amt').value);
            const dateInput = $('#exp-date') ? $('#exp-date').value : null;
            const tenantIdx = $('#exp-tenant-select') ? $('#exp-tenant-select').value : "";

            if (!desc || !amt) return alert('Fill expense fields');

            const tenants = loadData(getTenantKey());
            const dateStr = dateInput ? new Date(dateInput).toISOString() : new Date().toISOString();

            if (tenantIdx !== "") {
                const t = tenants[tenantIdx];
                const initial = DEPOSIT_MAP[t.roomType] || 0;
                if (t.currentDeposit === undefined) t.currentDeposit = initial;

                t.currentDeposit -= amt;
                if (!t.deductions) t.deductions = [];
                t.deductions.push({ amount: amt, reason: desc, date: dateStr });
                saveData(getTenantKey(), tenants);
                alert(`Deducted ${formatCurrency(amt)} from ${t.name}'s deposit.`);
                
                // ALSO record it as an expense in Expense History so it shows on the dashboard
                const expenses = loadData(getExpenseKey());
                expenses.push({
                    desc: `Deposit Deduction (${t.name}): ${desc}`,
                    amount: amt,
                    date: dateStr
                });
                saveData(getExpenseKey(), expenses);
            } else {
                const expenses = loadData(getExpenseKey());
                expenses.push({
                    desc,
                    amount: amt,
                    date: dateStr
                });
                saveData(getExpenseKey(), expenses);
            }

            refreshAllViews();

            $('#exp-desc').value = '';
            $('#exp-amt').value = '';
            if ($('#exp-date')) $('#exp-date').value = '';
            if ($('#exp-tenant-select')) $('#exp-tenant-select').value = '';
        });
    }

    // Global/Centralized Rent Calculation Function
    window.calculateTenantTotalDue = function(tenant, includeDeposit = true) {
        if (tenant.totalDue !== undefined) {
            return Number(tenant.totalDue);
        }
        
        const baseAmount = Number(tenant.amount || 0);
        const waterAmt = 55; // Flat water fee
        const elecCharge = Number(tenant.electricityCharge || 0);
        const lateFee = Number(tenant.lateFee || 0);
        const isOverdue = tenant.status === 'overdue';
        
        // Security deposit is strictly separated from recurring rent cycle calculations
        const total = baseAmount + waterAmt + elecCharge + (isOverdue ? lateFee : 0);
        return total;
    };

    window.openBillCalculatorForResident = function(name) {
        const select = $('#calc-tenant-select');
        if (select) {
            select.value = name;
            select.dispatchEvent(new Event('change'));
        }
        const calculator = $('#rent-calculator');
        if (calculator) {
            calculator.scrollIntoView({ behavior: 'smooth', block: 'center' });
            calculator.classList.remove('glow-pulse');
            void calculator.offsetWidth;
            calculator.classList.add('glow-pulse');
        }
    };

    // Auto-populate inputs when selecting active resident in Bill Calculator
    const calcTenantSelectEl = $('#calc-tenant-select');
    if (calcTenantSelectEl) {
        calcTenantSelectEl.addEventListener('change', () => {
            const tenants = loadData(getTenantKey());
            const directory = loadData("rc_directory") || [];
            const name = calcTenantSelectEl.value;
            if (name === "") {
                // Reset inputs
                $('#prev-reading').value = '';
                $('#curr-reading').value = '';
                $('#last-remaining').value = '';
                $('#late-fee-input').value = '';
                $('#room-type').value = '10000';
                $('#total-out').textContent = '₹0';
                lastCalculatedTotal = 0;
                return;
            }

            // Find in active monthly tenants first
            let t = tenants.find(x => x.name.toLowerCase() === name.toLowerCase());
            
            // If not found in active monthly tenants, initialize from directory/record section!
            if (!t) {
                const record = directory.find(x => x.name.toLowerCase() === name.toLowerCase());
                if (record) {
                    const RENT_MAP = { '1BHK': 10000, '2RK': 7000, '1RK': 4500 };
                    let rType = '1RK';
                    const depositVal = record.depositAmount || 10000;
                    if (depositVal === 20000) rType = '1BHK';
                    else if (depositVal === 15000) rType = '2RK';
                    else if (depositVal === 10000) rType = '1RK';
                    
                    t = {
                        name: record.name,
                        phone: record.phone || '',
                        roomType: rType,
                        amount: RENT_MAP[rType] || 4500,
                        prevReading: 0,
                        currReading: 0,
                        lastRemaining: 0,
                        lateFee: 0,
                        status: 'pending',
                        joiningDate: record.joiningDate || new Date().toISOString().split('T')[0]
                    };
                }
            }

            if (t) {
                $('#prev-reading').value = t.prevReading !== undefined ? t.prevReading : 0;
                $('#curr-reading').value = t.currReading !== undefined ? t.currReading : 0;
                $('#last-remaining').value = t.lastRemaining !== undefined ? t.lastRemaining : 0;
                $('#late-fee-input').value = t.lateFee !== undefined ? t.lateFee : 0;
                
                // Match room category select value
                const amtStr = String(t.amount || 10000);
                if (['10000', '7000', '4500'].includes(amtStr)) {
                    $('#room-type').value = amtStr;
                } else {
                    $('#room-type').value = '10000';
                }
            }
        });
    }

    // Calculator Logic
    if ($('#calc-rent')) {
        $('#calc-rent').addEventListener('click', () => {
            const prev = Number($('#prev-reading').value || 0);
            const curr = Number($('#curr-reading').value || 0);
            const lastRem = Number($('#last-remaining').value || 0);
            const lateFee = Number($('#late-fee-input').value || 0);
            const baseRent = Number($('#room-type').value || 0);

            if (curr < prev) {
                showToast("Validation Error", "Current reading cannot be less than previous reading.", "error");
                return;
            }

            const elecCharge = Math.max(0, curr - prev) * 12;
            
            // Centralized calculation
            let total = 0;
            const selectVal = $('#calc-tenant-select') ? $('#calc-tenant-select').value : '';
            if (selectVal !== "") {
                const tenants = loadData(getTenantKey());
                const t = tenants.find(x => x.name.toLowerCase() === selectVal.toLowerCase());
                if (t) {
                    const dummyTenant = {
                        ...t,
                        amount: baseRent,
                        electricityCharge: elecCharge,
                        lateFee: lateFee
                    };
                    total = calculateTenantTotalDue(dummyTenant, true);
                } else {
                    total = baseRent + elecCharge + 55 + lastRem + lateFee;
                }
            } else {
                total = baseRent + elecCharge + 55 + lastRem + lateFee;
            }

            lastCalculatedTotal = total;
            if ($('#total-out')) $('#total-out').textContent = formatCurrency(total);
        });
    }

    // Synchronize Room Categories between Onboarding and Bill Calculator
    const newRoomSelect = $('#new-room-type');
    const calcRoomSelect = $('#room-type');
    if (newRoomSelect && calcRoomSelect) {
        newRoomSelect.addEventListener('change', () => {
            const val = newRoomSelect.value;
            if (val === '1BHK') {
                calcRoomSelect.value = '10000';
            } else if (val === '2RK') {
                calcRoomSelect.value = '7000';
            } else if (val === '1RK') {
                calcRoomSelect.value = '4500';
            }
        });

        calcRoomSelect.addEventListener('change', () => {
            const val = calcRoomSelect.value;
            if (val === '10000') {
                newRoomSelect.value = '1BHK';
            } else if (val === '7000') {
                newRoomSelect.value = '2RK';
            } else if (val === '4500') {
                newRoomSelect.value = '1RK';
            }
        });
    }

    if ($('#apply-to-resident')) {
        $('#apply-to-resident').addEventListener('click', () => {
            const selectVal = $('#calc-tenant-select') ? $('#calc-tenant-select').value : '';
            
            if (selectVal === "") {
                showToast("Selection Required", "Please select an active resident to apply the bill.", "error");
                return;
            }

            if (lastCalculatedTotal <= 0) {
                showToast("Calculation Required", "Please calculate a final total first.", "error");
                return;
            }

            const tenants = loadData(getTenantKey());
            let tIdx = tenants.findIndex(x => x.name.toLowerCase() === selectVal.toLowerCase());
            
            const prev = Number($('#prev-reading').value || 0);
            const curr = Number($('#curr-reading').value || 0);
            const lateFee = Number($('#late-fee-input').value || 0);
            const baseRent = Number($('#room-type').value || 0);
            const elecCharge = Math.max(0, curr - prev) * 12;

            if (tIdx === -1) {
                // If not found in monthly active tenants, create and add them!
                const directory = loadData("rc_directory") || [];
                const record = directory.find(x => x.name.toLowerCase() === selectVal.toLowerCase());
                
                let rType = '1RK';
                let depositVal = 10000;
                if (record) {
                    depositVal = record.depositAmount || 10000;
                    if (depositVal === 20000) rType = '1BHK';
                    else if (depositVal === 15000) rType = '2RK';
                    else if (depositVal === 10000) rType = '1RK';
                }
                
                const newResident = {
                    name: selectVal,
                    property: 'Ram Niwas',
                    roomType: rType,
                    phone: record ? record.phone : '',
                    amount: baseRent,
                    lateFee: lateFee,
                    status: 'pending',
                    rentCycleDay: record && record.joiningDate ? (parseInt(record.joiningDate.split('-')[2]) || 1) : 1,
                    joiningDate: record ? record.joiningDate : new Date().toISOString().split('T')[0],
                    depositDate: record ? record.depositDate : new Date().toISOString().split('T')[0],
                    initialDeposit: depositVal,
                    currentDeposit: depositVal,
                    deductions: [],
                    prevReading: prev,
                    currReading: curr,
                    electricityCharge: elecCharge,
                    waterCharge: 55,
                    totalDue: lastCalculatedTotal,
                    paymentHistory: [],
                    startMonth: selectedMonth,
                    startYear: selectedYear
                };
                tenants.push(newResident);
            } else {
                const t = tenants[tIdx];
                t.amount = baseRent;
                t.prevReading = prev;
                t.currReading = curr;
                t.electricityCharge = elecCharge;
                t.lateFee = lateFee;
                t.totalDue = lastCalculatedTotal;
            }

            saveData(getTenantKey(), tenants);
            
            logTimelineEvent("Bill Calculated", `Applied calculated bill to ${selectVal}. Rent: ${formatCurrency(baseRent)}, Electricity: ${formatCurrency(elecCharge)} (${prev} to ${curr} kWh). Total: ${formatCurrency(lastCalculatedTotal)}.`, "success");

            refreshAllViews();
            showToast("Rent Applied", `Calculated total ₹${lastCalculatedTotal} successfully saved to ${selectVal}'s profile.`, "success");
            
            // Reset calculator fields
            $('#prev-reading').value = '';
            $('#curr-reading').value = '';
            $('#last-remaining').value = '';
            $('#late-fee-input').value = '';
            $('#room-type').value = '10000';
            if ($('#calc-tenant-select')) $('#calc-tenant-select').value = '';
            $('#total-out').textContent = '₹0';
            lastCalculatedTotal = 0;
        });
    }
 
    const triggerCalculatorScroll = (e) => {
        if (e) e.preventDefault();
        const calculator = $('#rent-calculator');
        if (calculator) {
            calculator.scrollIntoView({ behavior: 'smooth', block: 'center' });
            calculator.classList.remove('glow-pulse');
            void calculator.offsetWidth; // Reflow to reset animation
            calculator.classList.add('glow-pulse');
        }
    };

    if ($('#open-calc-btn')) {
        $('#open-calc-btn').addEventListener('click', triggerCalculatorScroll);
    }


    // Export CSV
    if ($('#export-csv-btn')) {
        $('#export-csv-btn').addEventListener('click', exportToCSV);
    }

    // Modals Close handlers
    if ($('#close-modal')) {
        $('#close-modal').addEventListener('click', () => {
            $('#qr-modal').classList.remove('active');
        });
    }

    if ($('#close-receipt')) {
        $('#close-receipt').addEventListener('click', () => {
            $('#receipt-modal').classList.remove('active');
        });
    }

    if ($('#print-receipt-btn')) {
        $('#print-receipt-btn').addEventListener('click', () => {
            window.print();
        });
    }

    // Calendar Navigation
    if ($('#prev-month')) {
        $('#prev-month').addEventListener('click', () => {
            selectedMonth--;
            if (selectedMonth < 0) {
                selectedMonth = 11;
                selectedYear--;
            }
            refreshAllViews();
        });
    }

    if ($('#next-month')) {
        $('#next-month').addEventListener('click', () => {
            selectedMonth++;
            if (selectedMonth > 11) {
                selectedMonth = 0;
                selectedYear++;
            }
            refreshAllViews();
        });
    }

    // Scroll Progress
    window.addEventListener('scroll', () => {
        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (winScroll / height) * 100;
        const progress = $('#scroll-progress');
        if (progress) progress.style.width = scrolled + "%";
    });

    // Reveal on Scroll
    const revealCallback = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    };

    const revealObserver = new IntersectionObserver(revealCallback, {
        threshold: 0.1
    });

    const initReveal = () => {
        $$('.panel, .stat-card, .tenant-item').forEach(el => {
            el.classList.add('reveal');
            revealObserver.observe(el);
        });
    };

    setTimeout(initReveal, 100);

    // Seed and initialize contact directory
    window.seedDirectory = function() {
        if (!localStorage.getItem("rc_directory")) {
            const defaults = [
                { name: "Santosh", phone: "9876543210", joiningDate: "2026-05-01", depositAmount: 10000, depositDate: "2026-05-01" },
                { name: "Narayan", phone: "8888888888", joiningDate: "2026-05-01", depositAmount: 10000, depositDate: "2026-05-01" },
                { name: "Ramesh", phone: "9999999999", joiningDate: "2026-05-01", depositAmount: 10000, depositDate: "2026-05-01" },
                { name: "Suresh", phone: "7777777777", joiningDate: "2026-05-01", depositAmount: 7000, depositDate: "2026-05-01" },
                { name: "Ganpat", phone: "9112233445", joiningDate: "2026-05-01", depositAmount: 4500, depositDate: "2026-05-01" }
            ];
            saveData("rc_directory", defaults);
        }
    };

    window.renderDirectory = function() {
        const tbody = $('#dir-tbody');
        if (!tbody) return;
        tbody.innerHTML = '';

        const directory = loadData("rc_directory") || [];
        const query = ($('#dir-search') ? $('#dir-search').value.trim().toLowerCase() : '');

        const filtered = directory.filter(c => c.name.toLowerCase().includes(query) || c.phone.includes(query));

        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px; color:var(--text-muted);">No records registered yet.</td></tr>`;
            return;
        }

        filtered.forEach((c) => {
            const origIndex = directory.findIndex(x => x.name === c.name && x.phone === c.phone);
            
            const tr = document.createElement('tr');
            tr.className = 'ledger-tr';
            tr.innerHTML = `
                <td class="ledger-td" style="font-weight: 600; color: var(--text-main); font-size: 13px;">${c.name}</td>
                <td class="ledger-td">
                    <p class="ledger-tenant-meta tooltip-container" data-tooltip="Click to call +91 ${c.phone}" style="display: inline-block;">
                        <a href="tel:+91${c.phone}" style="color: inherit; text-decoration: none;">
                            <i class="fa-solid fa-phone" style="font-size: 10px; color: var(--accent); margin-right: 4px;"></i> +91 ${c.phone}
                        </a>
                    </p>
                </td>
                <td class="ledger-td" style="color: var(--text-muted); font-size: 12px;"><i class="fa-solid fa-calendar-day" style="color: var(--accent); margin-right: 4px;"></i> ${c.joiningDate || 'N/A'}</td>
                <td class="ledger-td" style="font-weight: 600; color: #3b82f6; font-size: 12px;">${formatCurrency(c.depositAmount || 0)}</td>
                <td class="ledger-td" style="color: var(--status-paid-text); font-size: 12px;"><i class="fa-solid fa-circle-check" style="margin-right: 4px;"></i> ${c.depositDate || 'N/A'}</td>
                <td class="ledger-td" style="text-align: right;">
                    <button class="action-btn" title="Delete Record" onclick="deleteDirectoryContact(${origIndex})" style="color: var(--status-overdue-text); padding: 4px 8px; border: none; background: transparent; cursor: pointer;"><i class="fa-solid fa-trash-can"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    };

    window.deleteDirectoryContact = function(idx) {
        const directory = loadData("rc_directory") || [];
        if (idx >= 0 && idx < directory.length) {
            const deleted = directory.splice(idx, 1)[0];
            saveData("rc_directory", directory);
            renderDirectory();
            showToast("Record Deleted", `Removed ${deleted.name} from records.`, "success");
        }
    };

    window.saveDirectoryContact = function() {
        const nameInput = $('#dir-name');
        const phoneInput = $('#dir-phone');
        const joinDateInput = $('#dir-join-date');
        const depositAmountInput = $('#dir-deposit-amount');
        const depositDateInput = $('#dir-deposit-date');

        if (!nameInput || !phoneInput) return;

        const name = nameInput.value.trim();
        const phone = phoneInput.value.trim();
        const joiningDate = joinDateInput && joinDateInput.value ? joinDateInput.value : new Date().toISOString().split('T')[0];
        const depositAmount = depositAmountInput && depositAmountInput.value ? Number(depositAmountInput.value) : 10000;
        const depositDate = depositDateInput && depositDateInput.value ? depositDateInput.value : new Date().toISOString().split('T')[0];

        if (!name || !phone) {
            showToast("Required Fields", "Name and Phone number are required.", "error");
            return;
        }
        if (phone.length < 10 || isNaN(phone)) {
            showToast("Invalid Number", "Please enter a valid 10-digit phone number.", "error");
            return;
        }

        const directory = loadData("rc_directory") || [];
        const existingIdx = directory.findIndex(c => c.name.toLowerCase() === name.toLowerCase());

        if (existingIdx >= 0) {
            directory[existingIdx].phone = phone;
            directory[existingIdx].joiningDate = joiningDate;
            directory[existingIdx].depositAmount = depositAmount;
            directory[existingIdx].depositDate = depositDate;
            showToast("Record Updated", `Updated record details for ${name}.`, "success");
        } else {
            directory.push({ name, phone, joiningDate, depositAmount, depositDate });
            showToast("Record Saved", `Added ${name} to centralized records database.`, "success");
        }

        saveData("rc_directory", directory);
        nameInput.value = '';
        phoneInput.value = '';
        if (joinDateInput) joinDateInput.value = '';
        if (depositAmountInput) depositAmountInput.value = '';
        if (depositDateInput) depositDateInput.value = '';
        renderDirectory();
    };

    seedDirectory();

    if ($('#dir-add-btn')) {
        $('#dir-add-btn').addEventListener('click', saveDirectoryContact);
    }
    if ($('#dir-search')) {
        $('#dir-search').addEventListener('input', renderDirectory);
    }

    // Autofill aligned phone number from directory when typing name + Search & Autocomplete
    const newNameInput = $('#new-name');
    const autocompleteList = $('#name-autocomplete-list');

    if (newNameInput && autocompleteList) {
        newNameInput.addEventListener('input', () => {
            const val = newNameInput.value.trim().toLowerCase();
            autocompleteList.innerHTML = '';
            
            if (!val) {
                autocompleteList.style.display = 'none';
                return;
            }

            const directory = loadData("rc_directory") || [];
            const matches = directory.filter(c => c.name.toLowerCase().includes(val));

            if (matches.length === 0) {
                autocompleteList.style.display = 'none';
                return;
            }

            // Show matching suggestions list
            autocompleteList.style.display = 'block';
            matches.forEach(match => {
                const itemDiv = document.createElement('div');
                itemDiv.innerHTML = `<strong>${match.name}</strong> <span style="font-size:11px; color:var(--text-muted); float:right;"><i class="fa-solid fa-phone" style="font-size:9px; color:var(--accent); margin-right:4px;"></i> +91 ${match.phone}</span>`;
                
                itemDiv.addEventListener('click', () => {
                    newNameInput.value = match.name;
                    
                    if ($('#new-phone')) {
                        const phoneField = $('#new-phone');
                        phoneField.value = match.phone;
                        
                        // Add a modern visual highlight/pulse effect
                        phoneField.classList.remove('glow-pulse');
                        void phoneField.offsetWidth; // Reflow to reset animation
                        phoneField.classList.add('glow-pulse');
                    }
                    
                    autocompleteList.innerHTML = '';
                    autocompleteList.style.display = 'none';
                });
                
                autocompleteList.appendChild(itemDiv);
            });
        });

        // Close autocomplete when clicking outside
        document.addEventListener('click', (e) => {
            if (e.target !== newNameInput && e.target !== autocompleteList) {
                autocompleteList.style.display = 'none';
            }
        });
    }

    switchTab('dashboard');

    // One-time data correction migration: Reset Santosh and Narayan status to pending if they were marked paid by mock interval
    try {
        const activeKey = getTenantKey();
        const activeTenants = loadData(activeKey);
        let migrated = false;
        activeTenants.forEach(t => {
            const lowerName = t.name.toLowerCase();
            if ((lowerName.includes('santosh') || lowerName.includes('narayan')) && t.status === 'paid') {
                t.status = 'pending';
                delete t.paidAt;
                migrated = true;
            }
        });
        if (migrated) {
            saveData(activeKey, activeTenants);
            refreshAllViews();
        }
    } catch (e) {
        console.error("Migration error:", e);
    }
});



window.focusCalculatorForTenant = function(name) {
    switchTab('dashboard');
    setTimeout(() => {
        const select = $('#calc-tenant-select');
        if (select) {
            select.value = name;
            select.dispatchEvent(new Event('change'));
        }
        const calc = $('#rent-calculator');
        if (calc) {
            calc.scrollIntoView({ behavior: 'smooth', block: 'center' });
            calc.classList.remove('glow-pulse');
            void calc.offsetWidth;
            calc.classList.add('glow-pulse');
        }
    }, 150);
};
