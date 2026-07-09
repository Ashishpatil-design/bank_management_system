const API_BASE = "http://localhost:8080/api";

/* ---------- helpers ---------- */

function money(n) {
  const v = Number(n || 0);
  return v.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    year: "numeric", month: "short", day: "2-digit",
    hour: "2-digit", minute: "2-digit"
  });
}

function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.className = `toast show ${type}`;
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => {
    toast.className = "toast";
  }, 3200);
}

async function api(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  let body = null;
  const text = await res.text();
  if (text) {
    try { body = JSON.parse(text); } catch (e) { body = text; }
  }
  if (!res.ok) {
    const message = (body && (body.message || Object.values(body)[0])) || `Request failed (${res.status})`;
    throw new Error(message);
  }
  return body;
}

/* ---------- navigation ---------- */

function initNav() {
  const navItems = document.querySelectorAll(".nav-item");
  navItems.forEach(item => {
    item.addEventListener("click", () => {
      navItems.forEach(i => i.classList.remove("active"));
      item.classList.add("active");
      document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
      document.getElementById(`view-${item.dataset.view}`).classList.add("active");

      if (item.dataset.view === "dashboard") loadDashboard();
      if (item.dataset.view === "customers") loadCustomers();
      if (item.dataset.view === "accounts") loadAccounts();
      if (item.dataset.view === "transactions") loadCustomerSelectForAccounts();
      if (item.dataset.view === "history") loadAccountSelectForHistory();
    });
  });
}

/* ---------- API health check ---------- */

async function checkApiStatus() {
  const el = document.getElementById("apiStatus");
  try {
    await api("/customers");
    el.className = "api-status online";
    el.innerHTML = `<span class="dot"></span> API Connected`;
  } catch (e) {
    el.className = "api-status offline";
    el.innerHTML = `<span class="dot"></span> API Offline`;
  }
}

/* ---------- dashboard ---------- */

async function loadDashboard() {
  try {
    const [customers, accounts, transactions] = await Promise.all([
      api("/customers"),
      api("/accounts"),
      api("/transactions")
    ]);

    document.getElementById("statCustomers").textContent = customers.length;
    document.getElementById("statAccounts").textContent = accounts.length;
    const totalBalance = accounts.reduce((sum, a) => sum + Number(a.balance || 0), 0);
    document.getElementById("statBalance").textContent = money(totalBalance);
    document.getElementById("statTransactions").textContent = transactions.length;

    const sorted = [...transactions].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 8);
    const tbody = document.querySelector("#recentTransactionsTable tbody");
    tbody.innerHTML = "";
    if (sorted.length === 0) {
      tbody.innerHTML = `<tr class="empty-row"><td colspan="5">No transactions recorded yet.</td></tr>`;
    } else {
      sorted.forEach(t => {
        const tr = document.createElement("tr");
        const isCredit = t.transactionType === "DEPOSIT" || t.transactionType === "TRANSFER_IN";
        tr.innerHTML = `
          <td>${formatDate(t.timestamp)}</td>
          <td class="mono">${t.account?.accountNumber || "—"}</td>
          <td><span class="tag tag-${t.transactionType.toLowerCase()}">${t.transactionType.replace("_", " ")}</span></td>
          <td class="${isCredit ? "amount-in" : "amount-out"}">${isCredit ? "+" : "-"}${money(t.amount)}</td>
          <td class="mono">${money(t.balanceAfter)}</td>
        `;
        tbody.appendChild(tr);
      });
    }
  } catch (e) {
    showToast(e.message, "error");
  }
}

/* ---------- customers ---------- */

async function loadCustomers() {
  try {
    const customers = await api("/customers");
    const tbody = document.querySelector("#customersTable tbody");
    tbody.innerHTML = "";
    if (customers.length === 0) {
      tbody.innerHTML = `<tr class="empty-row"><td colspan="6">No customers registered yet.</td></tr>`;
      return;
    }
    customers.forEach(c => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="mono">${c.id}</td>
        <td>${c.fullName}</td>
        <td>${c.email}</td>
        <td>${c.phone || "—"}</td>
        <td>${c.address || "—"}</td>
        <td><button class="btn btn-ghost btn-small" data-delete-customer="${c.id}">Remove</button></td>
      `;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll("[data-delete-customer]").forEach(btn => {
      btn.addEventListener("click", async () => {
        if (!confirm("Remove this customer and all linked accounts?")) return;
        try {
          await api(`/customers/${btn.dataset.deleteCustomer}`, { method: "DELETE" });
          showToast("Customer removed");
          loadCustomers();
        } catch (e) {
          showToast(e.message, "error");
        }
      });
    });
  } catch (e) {
    showToast(e.message, "error");
  }
}

function initCustomerForm() {
  document.getElementById("customerForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
      fullName: document.getElementById("custFullName").value.trim(),
      email: document.getElementById("custEmail").value.trim(),
      phone: document.getElementById("custPhone").value.trim(),
      address: document.getElementById("custAddress").value.trim()
    };
    try {
      await api("/customers", { method: "POST", body: JSON.stringify(payload) });
      showToast("Customer registered successfully");
      e.target.reset();
      loadCustomers();
    } catch (e2) {
      showToast(e2.message, "error");
    }
  });

  document.getElementById("refreshCustomers").addEventListener("click", loadCustomers);
}

/* ---------- accounts ---------- */

async function populateCustomerSelect(selectEl) {
  const customers = await api("/customers");
  selectEl.innerHTML = customers.map(c => `<option value="${c.id}">${c.fullName} (#${c.id})</option>`).join("");
  if (customers.length === 0) {
    selectEl.innerHTML = `<option value="">No customers yet — add one first</option>`;
  }
}

async function loadCustomerSelectForAccounts() {
  // no-op placeholder kept for nav symmetry; transactions view doesn't need a select
}

function initials(type) {
  return type === "SAVINGS" ? "SB" : "CA";
}

async function loadAccounts() {
  try {
    const accounts = await api("/accounts");
    const grid = document.getElementById("accountsGrid");
    grid.innerHTML = "";
    if (accounts.length === 0) {
      grid.innerHTML = `<p style="color: var(--muted); grid-column: 1/-1;">No accounts opened yet.</p>`;
      return;
    }
    accounts.forEach(a => {
      const card = document.createElement("div");
      card.className = "account-card";
      card.innerHTML = `
        <div class="seal">${initials(a.accountType)}</div>
        <div class="acct-number">${a.accountNumber}</div>
        <div class="acct-owner">${a.customer?.fullName || "Unknown holder"}</div>
        <div class="acct-balance-label">${a.accountType === "SAVINGS" ? "Savings" : "Current"} Balance</div>
        <div class="acct-balance">${money(a.balance)}</div>
        <div class="acct-footer">
          <span style="font-size:11px;color:var(--muted);">Opened ${formatDate(a.createdAt)}</span>
          <button class="btn btn-ghost btn-small" data-delete-account="${a.id}">Close</button>
        </div>
      `;
      grid.appendChild(card);
    });

    grid.querySelectorAll("[data-delete-account]").forEach(btn => {
      btn.addEventListener("click", async () => {
        if (!confirm("Close this account? This cannot be undone.")) return;
        try {
          await api(`/accounts/${btn.dataset.deleteAccount}`, { method: "DELETE" });
          showToast("Account closed");
          loadAccounts();
        } catch (e) {
          showToast(e.message, "error");
        }
      });
    });
  } catch (e) {
    showToast(e.message, "error");
  }
}

function initAccountForm() {
  populateCustomerSelect(document.getElementById("acctCustomerId")).catch(() => {});

  document.getElementById("accountForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const customerId = document.getElementById("acctCustomerId").value;
    if (!customerId) {
      showToast("Add a customer before opening an account", "error");
      return;
    }
    const payload = {
      customerId: Number(customerId),
      accountType: document.getElementById("acctType").value,
      initialDeposit: Number(document.getElementById("acctInitialDeposit").value || 0)
    };
    try {
      const account = await api("/accounts", { method: "POST", body: JSON.stringify(payload) });
      showToast(`Account opened: ${account.accountNumber}`);
      e.target.reset();
      populateCustomerSelect(document.getElementById("acctCustomerId"));
      loadAccounts();
    } catch (e2) {
      showToast(e2.message, "error");
    }
  });

  document.getElementById("refreshAccounts").addEventListener("click", loadAccounts);
}

/* ---------- transactions ---------- */

function initTransactionForms() {
  document.getElementById("depositForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
      accountNumber: document.getElementById("depAccountNumber").value.trim(),
      amount: Number(document.getElementById("depAmount").value),
      description: document.getElementById("depNote").value.trim() || undefined
    };
    try {
      await api("/transactions/deposit", { method: "POST", body: JSON.stringify(payload) });
      showToast("Deposit recorded");
      e.target.reset();
    } catch (e2) {
      showToast(e2.message, "error");
    }
  });

  document.getElementById("withdrawForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
      accountNumber: document.getElementById("wdAccountNumber").value.trim(),
      amount: Number(document.getElementById("wdAmount").value),
      description: document.getElementById("wdNote").value.trim() || undefined
    };
    try {
      await api("/transactions/withdraw", { method: "POST", body: JSON.stringify(payload) });
      showToast("Withdrawal recorded");
      e.target.reset();
    } catch (e2) {
      showToast(e2.message, "error");
    }
  });

  document.getElementById("transferForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
      fromAccountNumber: document.getElementById("trFrom").value.trim(),
      toAccountNumber: document.getElementById("trTo").value.trim(),
      amount: Number(document.getElementById("trAmount").value),
      description: document.getElementById("trNote").value.trim() || undefined
    };
    try {
      await api("/transactions/transfer", { method: "POST", body: JSON.stringify(payload) });
      showToast("Transfer completed");
      e.target.reset();
    } catch (e2) {
      showToast(e2.message, "error");
    }
  });
}

/* ---------- statement / history ---------- */

async function loadAccountSelectForHistory() {
  try {
    const accounts = await api("/accounts");
    const select = document.getElementById("histAccountId");
    select.innerHTML = accounts.map(a =>
      `<option value="${a.id}">${a.accountNumber} — ${a.customer?.fullName || ""}</option>`
    ).join("");
    if (accounts.length === 0) {
      select.innerHTML = `<option value="">No accounts yet</option>`;
    }
  } catch (e) {
    showToast(e.message, "error");
  }
}

function initHistoryForm() {
  document.getElementById("historyForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const accountId = document.getElementById("histAccountId").value;
    if (!accountId) return;
    try {
      const transactions = await api(`/transactions/account/${accountId}`);
      const tbody = document.querySelector("#historyTable tbody");
      tbody.innerHTML = "";
      if (transactions.length === 0) {
        tbody.innerHTML = `<tr class="empty-row"><td colspan="5">No entries for this account yet.</td></tr>`;
        return;
      }
      transactions.forEach(t => {
        const isCredit = t.transactionType === "DEPOSIT" || t.transactionType === "TRANSFER_IN";
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${formatDate(t.timestamp)}</td>
          <td><span class="tag tag-${t.transactionType.toLowerCase()}">${t.transactionType.replace("_", " ")}</span></td>
          <td class="${isCredit ? "amount-in" : "amount-out"}">${isCredit ? "+" : "-"}${money(t.amount)}</td>
          <td class="mono">${money(t.balanceAfter)}</td>
          <td>${t.description || "—"}</td>
        `;
        tbody.appendChild(tr);
      });
    } catch (e2) {
      showToast(e2.message, "error");
    }
  });
}

/* ---------- init ---------- */

document.addEventListener("DOMContentLoaded", () => {
  initNav();
  initCustomerForm();
  initAccountForm();
  initTransactionForms();
  initHistoryForm();
  checkApiStatus();
  loadDashboard();

  setInterval(checkApiStatus, 15000);
});
