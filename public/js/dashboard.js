// ============================================================
// REGIX DASHBOARD JS - Admin Command Center
// ============================================================
(function () {
  var API_SECRET = "RegixSecretKey2024!@#$%^";
  var currentUserRole = null;

  // ============================================================
  // HELPERS
  // ============================================================
  function getToken() {
    return localStorage.getItem("token") || "";
  }

  function apiFetch(url, options) {
    options = options || {};
    var token = getToken();
    var headers = options.headers || {};
    if (token) headers["Authorization"] = "Bearer " + token;
    if (!headers["Content-Type"] && !(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }
    return fetch(url, {
      headers: headers,
      method: options.method,
      body: options.body,
    });
  }

  function formatDate(d) {
    if (!d) return "\u2014";
    var date = new Date(d);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  }

  function getExpiryStatus(expiryDate) {
    if (!expiryDate) return '<span class="status-pill active">LIFETIME</span>';
    var exp = new Date(expiryDate);
    if (exp < new Date())
      return '<span class="status-pill expired">EXPIRED</span>';
    var daysLeft = Math.ceil((exp - new Date()) / (1000 * 60 * 60 * 24));
    if (daysLeft <= 3)
      return '<span class="status-pill frozen">' + daysLeft + "d LEFT</span>";
    return '<span class="status-pill active">' + daysLeft + "d LEFT</span>";
  }

  // ============================================================
  // TAB NAVIGATION
  // ============================================================
  document.querySelectorAll(".tab-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      document.querySelectorAll(".tab-btn").forEach(function (b) {
        b.classList.remove("active");
        b.className = b.className.replace(
          /text-\[#00f0ff\]\s*bg-\[rgba\(0,240,255,0\.08\)\]\s*border-\[rgba\(0,240,255,0\.15\)\]\s*border-b-transparent/g,
          "",
        );
        b.classList.add(
          "text-[#64748b]",
          "hover:text-[#e2e8f0]",
          "hover:bg-[rgba(0,240,255,0.03)]",
        );
      });
      this.classList.remove(
        "text-[#64748b]",
        "hover:text-[#e2e8f0]",
        "hover:bg-[rgba(0,240,255,0.03)]",
      );
      this.classList.add(
        "active",
        "text-[#00f0ff]",
        "bg-[rgba(0,240,255,0.08)]",
        "border-[rgba(0,240,255,0.15)]",
        "border-b-transparent",
      );

      document.querySelectorAll(".tab-content").forEach(function (t) {
        t.classList.add("hidden");
        t.classList.remove("active");
      });
      var tabId = "tab-" + this.dataset.tab;
      var tabEl = document.getElementById(tabId);
      if (tabEl) {
        tabEl.classList.remove("hidden");
        tabEl.classList.add("active");
      }

      var tab = this.dataset.tab;
      if (tab === "keys") refreshDashboardData();
      else if (tab === "users") refreshUsers();
      else if (tab === "licenses") refreshLicenses();
      else if (tab === "blacklist") refreshBlacklist();
      else if (tab === "logs") refreshLogs();
      else if (tab === "tickets") refreshTickets();
      else if (tab === "panel-users") refreshPanelUsers();
    });
  });

  // ============================================================
  // DASHBOARD STATS
  // ============================================================
  function refreshDashboardData() {
    fetch("/api/dashboard?secret=" + API_SECRET + "&action=stats")
      .then(function (res) {
        return res.json();
      })
      .then(function (stats) {
        if (stats.error) {
          console.error("Stats error:", stats.error);
          return;
        }
        document.getElementById("totalKeys").innerText = String(
          stats.total_keys,
        ).padStart(2, "0");
        document.getElementById("activeKeys").innerText = String(
          stats.active_keys,
        ).padStart(2, "0");
        document.getElementById("totalUsers").innerText = String(
          stats.total_users,
        ).padStart(2, "0");
        document.getElementById("activeUsers").innerText = String(
          stats.active_users,
        ).padStart(2, "0");
        document.getElementById("totalLicenses").innerText = String(
          stats.total_licenses,
        ).padStart(2, "0");
        document.getElementById("activeLicenses").innerText = String(
          stats.active_licenses,
        ).padStart(2, "0");
        document.getElementById("blacklistCount").innerText = String(
          stats.blacklist,
        ).padStart(2, "0");
        document.getElementById("totalApis").innerText = String(
          stats.total_apis,
        ).padStart(2, "0");
      })
      .catch(function (err) {
        console.error("Dashboard refresh error:", err);
      });

    fetch("/api/dashboard?secret=" + API_SECRET + "&action=list_keys")
      .then(function (res) {
        return res.json();
      })
      .then(function (data) {
        renderKeysTable(data.keys);
      })
      .catch(function (err) {
        console.error("Keys load error:", err);
      });
  }

  // ============================================================
  // RENDER FUNCTIONS
  // ============================================================
  function renderKeysTable(keys) {
    var tbody = document.getElementById("keysTableBody");
    if (!tbody) return;
    tbody.innerHTML = "";
    if (!keys || keys.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="7" class="text-center text-[#64748b] py-8 italic">No keys found</td></tr>';
      return;
    }
    keys.forEach(function (k) {
      var row = document.createElement("tr");
      row.className =
        "border-b border-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.01)]";
      row.innerHTML =
        '<td class="px-3 py-2.5">' +
        k.id +
        "</td>" +
        '<td class="px-3 py-2.5 font-mono text-[#00f0ff]">' +
        k.key_code +
        "</td>" +
        '<td class="px-3 py-2.5">' +
        k.max_devices +
        "</td>" +
        '<td class="px-3 py-2.5">' +
        k.duration +
        "h" +
        (k.duration >= 876000 ? " (LIFETIME)" : "") +
        "</td>" +
        '<td class="px-3 py-2.5"><span class="status-pill ' +
        k.status +
        '">' +
        (k.status || "").toUpperCase() +
        "</span></td>" +
        '<td class="px-3 py-2.5">' +
        (k.note || "\u2014") +
        "</td>" +
        '<td class="px-3 py-2.5">' +
        '<button class="text-[#64748b] border border-[rgba(0,240,255,0.15)] bg-transparent px-2 py-1 text-[0.6rem] rounded cursor-pointer mr-1 hover:text-[#00ff88] hover:border-[rgba(0,255,136,0.3)] transition-colors" data-action="activate" data-type="key" data-id="' +
        k.id +
        '">Activate</button>' +
        '<button class="text-[#64748b] border border-[rgba(0,240,255,0.15)] bg-transparent px-2 py-1 text-[0.6rem] rounded cursor-pointer mr-1 hover:text-[#00f0ff] hover:border-[rgba(0,240,255,0.3)] transition-colors" data-action="freeze" data-type="key" data-id="' +
        k.id +
        '">Freeze</button>' +
        '<button class="text-[#64748b] border border-[rgba(0,240,255,0.15)] bg-transparent px-2 py-1 text-[0.6rem] rounded cursor-pointer mr-1 hover:text-[#ff0055] hover:border-[rgba(255,0,85,0.3)] transition-colors" data-action="ban" data-type="key" data-id="' +
        k.id +
        '">Ban</button>' +
        '<button class="text-[#64748b] border border-[rgba(0,240,255,0.15)] bg-transparent px-2 py-1 text-[0.6rem] rounded cursor-pointer hover:text-[#ff0055] hover:border-[rgba(255,0,85,0.3)] transition-colors" data-action="delete" data-type="key" data-id="' +
        k.id +
        '">Del</button>' +
        "</td>";
      tbody.appendChild(row);
    });
    attachActionListeners(tbody);
  }

  function renderUsersTable(users) {
    var tbody = document.getElementById("usersTableBody");
    if (!tbody) return;
    tbody.innerHTML = "";
    if (!users || users.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="9" class="text-center text-[#64748b] py-8 italic">No users found</td></tr>';
      return;
    }
    users.forEach(function (u) {
      var row = document.createElement("tr");
      row.className =
        "border-b border-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.01)]";
      var devices =
        u.used_devices ? u.used_devices.split(",").filter(Boolean) : [];
      var hwid =
        devices.length > 0 ?
          '<span class="font-mono text-[0.65rem]">' +
          devices[0].substring(0, 12) +
          (devices[0].length > 12 ? "..." : "") +
          "</span>"
        : "\u2014";
      row.innerHTML =
        '<td class="px-3 py-2.5">' +
        u.id +
        "</td>" +
        '<td class="px-3 py-2.5">' +
        u.username +
        "</td>" +
        '<td class="px-3 py-2.5">' +
        (u.email || "\u2014") +
        "</td>" +
        '<td class="px-3 py-2.5">' +
        hwid +
        "</td>" +
        '<td class="px-3 py-2.5 font-mono text-[0.65rem]">' +
        (u.ip_address || "\u2014") +
        "</td>" +
        '<td class="px-3 py-2.5">' +
        devices.length +
        "/" +
        u.max_devices +
        "</td>" +
        '<td class="px-3 py-2.5"><span class="status-pill ' +
        u.status +
        '">' +
        (u.status || "").toUpperCase() +
        "</span></td>" +
        '<td class="px-3 py-2.5">' +
        getExpiryStatus(u.expiry_date) +
        "</td>" +
        '<td class="px-3 py-2.5">' +
        '<button class="text-[#64748b] border border-[rgba(0,240,255,0.15)] bg-transparent px-2 py-1 text-[0.6rem] rounded cursor-pointer mr-1 hover:text-[#00ff88] hover:border-[rgba(0,255,136,0.3)] transition-colors" data-action="activate" data-type="user" data-id="' +
        u.id +
        '">Act</button>' +
        '<button class="text-[#64748b] border border-[rgba(0,240,255,0.15)] bg-transparent px-2 py-1 text-[0.6rem] rounded cursor-pointer mr-1 hover:text-[#00f0ff] hover:border-[rgba(0,240,255,0.3)] transition-colors" data-action="freeze" data-type="user" data-id="' +
        u.id +
        '">Frz</button>' +
        '<button class="text-[#64748b] border border-[rgba(0,240,255,0.15)] bg-transparent px-2 py-1 text-[0.6rem] rounded cursor-pointer mr-1 hover:text-[#ff0055] hover:border-[rgba(255,0,85,0.3)] transition-colors" data-action="ban" data-type="user" data-id="' +
        u.id +
        '">Ban</button>' +
        '<button class="text-[#64748b] border border-[rgba(0,240,255,0.15)] bg-transparent px-2 py-1 text-[0.6rem] rounded cursor-pointer mr-1 hover:text-[#ffcc00] hover:border-[rgba(255,204,0,0.3)] transition-colors" data-action="resetSid" data-type="user" data-id="' +
        u.id +
        '">SID</button>' +
        '<button class="text-[#64748b] border border-[rgba(0,240,255,0.15)] bg-transparent px-2 py-1 text-[0.6rem] rounded cursor-pointer hover:text-[#ff0055] hover:border-[rgba(255,0,85,0.3)] transition-colors" data-action="delete" data-type="user" data-id="' +
        u.id +
        '">Del</button>' +
        "</td>";
      tbody.appendChild(row);
    });
    attachActionListeners(tbody);
  }

  function renderLicensesTable(licenses) {
    var tbody = document.getElementById("licensesTableBody");
    if (!tbody) return;
    tbody.innerHTML = "";
    if (!licenses || licenses.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="9" class="text-center text-[#64748b] py-8 italic">No licenses found</td></tr>';
      return;
    }
    licenses.forEach(function (l) {
      var row = document.createElement("tr");
      row.className =
        "border-b border-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.01)]";
      var devices =
        l.used_devices ? l.used_devices.split(",").filter(Boolean).length : 0;
      row.innerHTML =
        '<td class="px-3 py-2.5">' +
        l.id +
        "</td>" +
        '<td class="px-3 py-2.5 font-mono text-[#00f0ff]">' +
        l.license_key +
        "</td>" +
        '<td class="px-3 py-2.5">' +
        l.plan +
        "</td>" +
        '<td class="px-3 py-2.5">' +
        l.product +
        "</td>" +
        '<td class="px-3 py-2.5">' +
        l.duration_days +
        "</td>" +
        '<td class="px-3 py-2.5">' +
        devices +
        "/" +
        l.max_devices +
        "</td>" +
        '<td class="px-3 py-2.5"><span class="status-pill ' +
        l.status +
        '">' +
        (l.status || "").toUpperCase() +
        "</span></td>" +
        '<td class="px-3 py-2.5">' +
        getExpiryStatus(l.expiry_date) +
        "</td>" +
        '<td class="px-3 py-2.5">' +
        '<button class="text-[#64748b] border border-[rgba(0,240,255,0.15)] bg-transparent px-2 py-1 text-[0.6rem] rounded cursor-pointer mr-1 hover:text-[#00ff88] hover:border-[rgba(0,255,136,0.3)] transition-colors" data-action="activate" data-type="license" data-id="' +
        l.id +
        '">Act</button>' +
        '<button class="text-[#64748b] border border-[rgba(0,240,255,0.15)] bg-transparent px-2 py-1 text-[0.6rem] rounded cursor-pointer mr-1 hover:text-[#00f0ff] hover:border-[rgba(0,240,255,0.3)] transition-colors" data-action="freeze" data-type="license" data-id="' +
        l.id +
        '">Frz</button>' +
        '<button class="text-[#64748b] border border-[rgba(0,240,255,0.15)] bg-transparent px-2 py-1 text-[0.6rem] rounded cursor-pointer mr-1 hover:text-[#ff0055] hover:border-[rgba(255,0,85,0.3)] transition-colors" data-action="ban" data-type="license" data-id="' +
        l.id +
        '">Ban</button>' +
        '<button class="text-[#64748b] border border-[rgba(0,240,255,0.15)] bg-transparent px-2 py-1 text-[0.6rem] rounded cursor-pointer hover:text-[#ff0055] hover:border-[rgba(255,0,85,0.3)] transition-colors" data-action="delete" data-type="license" data-id="' +
        l.id +
        '">Del</button>' +
        "</td>";
      tbody.appendChild(row);
    });
    attachActionListeners(tbody);
  }

  function renderBlacklistTable(list) {
    var tbody = document.getElementById("blacklistTableBody");
    if (!tbody) return;
    tbody.innerHTML = "";
    if (!list || list.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="5" class="text-center text-[#64748b] py-8 italic">No blacklisted HWIDs</td></tr>';
      return;
    }
    list.forEach(function (b) {
      var row = document.createElement("tr");
      row.className =
        "border-b border-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.01)]";
      row.innerHTML =
        '<td class="px-3 py-2.5">' +
        b.id +
        "</td>" +
        '<td class="px-3 py-2.5 font-mono">' +
        b.hwid +
        "</td>" +
        '<td class="px-3 py-2.5">' +
        (b.reason || "\u2014") +
        "</td>" +
        '<td class="px-3 py-2.5">' +
        formatDate(b.createdAt) +
        "</td>" +
        '<td class="px-3 py-2.5"><button class="text-[#64748b] border border-[rgba(0,240,255,0.15)] bg-transparent px-2 py-1 text-[0.6rem] rounded cursor-pointer hover:text-[#ff0055] hover:border-[rgba(255,0,85,0.3)] transition-colors" data-action="delete" data-type="blacklist" data-id="' +
        b.id +
        '">Remove</button></td>';
      tbody.appendChild(row);
    });
    attachActionListeners(tbody);
  }

  function renderLogsTable(logs) {
    var tbody = document.getElementById("logsTableBody");
    if (!tbody) return;
    tbody.innerHTML = "";
    if (!logs || logs.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="5" class="text-center text-[#64748b] py-8 italic">No audit logs</td></tr>';
      return;
    }
    logs.forEach(function (log) {
      var row = document.createElement("tr");
      row.className =
        "border-b border-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.01)]";
      row.innerHTML =
        '<td class="px-3 py-2.5">' +
        log.id +
        "</td>" +
        '<td class="px-3 py-2.5 text-[#00f0ff]">' +
        log.action +
        "</td>" +
        '<td class="px-3 py-2.5">' +
        (log.details || "\u2014") +
        "</td>" +
        '<td class="px-3 py-2.5">' +
        (log.ip || "\u2014") +
        "</td>" +
        '<td class="px-3 py-2.5">' +
        formatDate(log.createdAt) +
        "</td>";
      tbody.appendChild(row);
    });
  }

  function renderTicketsTable(tickets) {
    var tbody = document.getElementById("ticketsTableBody");
    if (!tbody) return;
    tbody.innerHTML = "";
    if (!tickets || tickets.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="9" class="text-center text-[#64748b] py-8 italic">No tickets found</td></tr>';
      return;
    }
    tickets.forEach(function (t) {
      var row = document.createElement("tr");
      row.className =
        "border-b border-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.01)]";
      var priorityClass =
        t.priority === "urgent" ? "expired"
        : t.priority === "high" ? "frozen"
        : "active";
      row.innerHTML =
        '<td class="px-3 py-2.5">' +
        t.id +
        "</td>" +
        '<td class="px-3 py-2.5">' +
        t.title +
        "</td>" +
        '<td class="px-3 py-2.5">' +
        t.category +
        "</td>" +
        '<td class="px-3 py-2.5"><span class="status-pill ' +
        priorityClass +
        '">' +
        t.priority.toUpperCase() +
        "</span></td>" +
        '<td class="px-3 py-2.5"><span class="status-pill ' +
        t.status +
        '">' +
        t.status.replace("_", " ").toUpperCase() +
        "</span></td>" +
        '<td class="px-3 py-2.5">' +
        (t.creator ? t.creator.username : "\u2014") +
        "</td>" +
        '<td class="px-3 py-2.5">' +
        (t.assignee ? t.assignee.username : "\u2014") +
        "</td>" +
        '<td class="px-3 py-2.5">' +
        formatDate(t.updatedAt) +
        "</td>" +
        '<td class="px-3 py-2.5"><button class="text-[#64748b] border border-[rgba(0,240,255,0.15)] bg-transparent px-2 py-1 text-[0.6rem] rounded cursor-pointer hover:text-[#00f0ff] hover:border-[rgba(0,240,255,0.3)] transition-colors" onclick="window.__viewTicket(' +
        t.id +
        ')">View</button></td>';
      tbody.appendChild(row);
    });
  }

  function renderPanelUsersTable(users) {
    var tbody = document.getElementById("panelUsersTableBody");
    if (!tbody) return;
    tbody.innerHTML = "";
    if (!users || users.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="8" class="text-center text-[#64748b] py-8 italic">No panel users</td></tr>';
      return;
    }
    users.forEach(function (u) {
      var row = document.createElement("tr");
      row.className =
        "border-b border-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.01)]";
      row.innerHTML =
        '<td class="px-3 py-2.5">' +
        u.id +
        "</td>" +
        '<td class="px-3 py-2.5">' +
        u.username +
        "</td>" +
        '<td class="px-3 py-2.5">' +
        (u.email || "\u2014") +
        "</td>" +
        '<td class="px-3 py-2.5"><span class="role-badge">' +
        u.role +
        "</span></td>" +
        '<td class="px-3 py-2.5"><span class="status-pill ' +
        (u.isActive ? "active" : "expired") +
        '">' +
        (u.isActive ? "ACTIVE" : "DISABLED") +
        "</span></td>" +
        '<td class="px-3 py-2.5">' +
        (u.discordId || "\u2014") +
        "</td>" +
        '<td class="px-3 py-2.5">' +
        formatDate(u.createdAt) +
        "</td>" +
        '<td class="px-3 py-2.5"><button class="text-[#64748b] border border-[rgba(0,240,255,0.15)] bg-transparent px-2 py-1 text-[0.6rem] rounded cursor-pointer hover:text-[#ff0055] hover:border-[rgba(255,0,85,0.3)] transition-colors" onclick="window.__deletePanelUser(' +
        u.id +
        ')">Del</button></td>';
      tbody.appendChild(row);
    });
  }

  // ============================================================
  // ACTION HANDLERS
  // ============================================================
  function attachActionListeners(tbody) {
    tbody.querySelectorAll("button[data-action]").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        var action = this.dataset.action;
        var type = this.dataset.type;
        var id = this.dataset.id;

        if (action === "delete") {
          if (
            !confirm("Delete " + type + " #" + id + "? This cannot be undone.")
          )
            return;
          fetch("/api/admin/delete?secret=" + API_SECRET, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: type, id: parseInt(id) }),
          })
            .then(function (res) {
              return res.json();
            })
            .then(function (data) {
              if (data.success) {
                showToast("Deleted successfully.", "success");
                refreshCurrentTab();
              } else showToast(data.error || "Delete failed.", "error");
            })
            .catch(function (err) {
              showToast("Error: " + err.message, "error");
            });
        } else if (action === "resetSid") {
          if (
            !confirm(
              "Reset SID/HWID for this user? This clears their device lock.",
            )
          )
            return;
          fetch("/api/admin/reset-sid?secret=" + API_SECRET, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: parseInt(id) }),
          })
            .then(function (res) {
              return res.json();
            })
            .then(function (data) {
              if (data.success) {
                showToast("SID reset for user.", "success");
                refreshCurrentTab();
              } else showToast(data.error || "SID reset failed.", "error");
            })
            .catch(function (err) {
              showToast("Error: " + err.message, "error");
            });
        } else {
          var statusMap = {
            activate: "active",
            freeze: "frozen",
            ban: "banned",
          };
          var status = statusMap[action];
          if (!status) return;
          if (!confirm("Set " + type + " #" + id + ' to "' + status + '"?'))
            return;
          fetch("/api/admin/update-status?secret=" + API_SECRET, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: type,
              id: parseInt(id),
              status: status,
            }),
          })
            .then(function (res) {
              return res.json();
            })
            .then(function (data) {
              if (data.success) {
                showToast("Status updated to " + status + ".", "success");
                refreshCurrentTab();
              } else showToast(data.error || "Update failed.", "error");
            })
            .catch(function (err) {
              showToast("Error: " + err.message, "error");
            });
        }
      });
    });
  }

  function refreshCurrentTab() {
    var activeTab = document.querySelector(".tab-btn.active");
    if (!activeTab) return;
    var tab = activeTab.dataset.tab;
    if (tab === "keys") refreshDashboardData();
    else if (tab === "users") refreshUsers();
    else if (tab === "licenses") refreshLicenses();
    else if (tab === "blacklist") refreshBlacklist();
    else if (tab === "logs") refreshLogs();
    else if (tab === "tickets") refreshTickets();
    else if (tab === "panel-users") refreshPanelUsers();
  }

  // ============================================================
  // DATA LOADERS
  // ============================================================
  function refreshUsers() {
    fetch("/api/dashboard?secret=" + API_SECRET + "&action=list_users")
      .then(function (res) {
        return res.json();
      })
      .then(function (data) {
        renderUsersTable(data.users);
      })
      .catch(function (err) {
        console.error("Users error:", err);
      });
  }

  function refreshLicenses() {
    fetch("/api/dashboard?secret=" + API_SECRET + "&action=list_licenses")
      .then(function (res) {
        return res.json();
      })
      .then(function (data) {
        renderLicensesTable(data.licenses);
      })
      .catch(function (err) {
        console.error("Licenses error:", err);
      });
  }

  function refreshBlacklist() {
    fetch("/api/dashboard?secret=" + API_SECRET + "&action=list_blacklist")
      .then(function (res) {
        return res.json();
      })
      .then(function (data) {
        renderBlacklistTable(data.list);
      })
      .catch(function (err) {
        console.error("Blacklist error:", err);
      });
  }

  function refreshLogs() {
    fetch("/api/dashboard?secret=" + API_SECRET + "&action=list_logs")
      .then(function (res) {
        return res.json();
      })
      .then(function (data) {
        renderLogsTable(data.logs);
      })
      .catch(function (err) {
        console.error("Logs error:", err);
      });
  }

  function refreshTickets() {
    apiFetch("/api/tickets")
      .then(function (res) {
        return res.json();
      })
      .then(function (data) {
        renderTicketsTable(data.tickets);
      })
      .catch(function (err) {
        console.error("Tickets error:", err);
      });
  }

  function refreshPanelUsers() {
    apiFetch("/api/panel/users")
      .then(function (res) {
        return res.json();
      })
      .then(function (data) {
        renderPanelUsersTable(data.users);
      })
      .catch(function (err) {
        console.error("Panel users error:", err);
      });
  }

  // ============================================================
  // CREATE FUNCTIONS
  // ============================================================
  document
    .getElementById("createUserBtn")
    .addEventListener("click", function () {
      var username = document.getElementById("newUsername").value.trim();
      var password = document.getElementById("newPassword").value.trim();
      var email = document.getElementById("newEmail").value.trim();
      var duration = document.getElementById("newUserDuration").value || "720";
      var max_devices = document.getElementById("newUserMaxDev").value || "1";
      if (!username || !password) {
        showToast("Username and Password required!", "error");
        return;
      }
      fetch("/api/admin/create-user?secret=" + API_SECRET, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username,
          password: password,
          email: email,
          duration: duration,
          max_devices: max_devices,
        }),
      })
        .then(function (res) {
          return res.json();
        })
        .then(function (data) {
          if (data.success) {
            showToast('User "' + username + '" created!', "success");
            ["newUsername", "newPassword", "newEmail"].forEach(function (id) {
              document.getElementById(id).value = "";
            });
          } else showToast(data.error || "Failed", "error");
        })
        .catch(function (err) {
          showToast("Error: " + err.message, "error");
        });
    });

  document
    .getElementById("createKeyBtn")
    .addEventListener("click", function () {
      var prefix =
        document.getElementById("newKeyPrefix").value.trim() || "REGIX";
      var amount = parseInt(document.getElementById("newKeyAmount").value) || 1;
      var duration = document.getElementById("newKeyDuration").value || "720h";
      var maxDev = parseInt(document.getElementById("newKeyMaxDev").value) || 1;
      var note =
        document.getElementById("newKeyNote").value.trim() || "Bulk generated";
      if (amount < 1 || amount > 100) {
        showToast("Amount must be 1-100", "error");
        return;
      }

      // Parse duration string
      var durMatch = duration.match(/^(\d+)([hdwml])$/i);
      var hours = 720;
      if (durMatch) {
        var val = parseInt(durMatch[1]);
        var unit = durMatch[2].toLowerCase();
        if (unit === "h") hours = val;
        else if (unit === "d") hours = val * 24;
        else if (unit === "w") hours = val * 24 * 7;
        else if (unit === "m") hours = val * 24 * 30;
        else if (unit === "l") hours = 876000;
      } else if (duration.toLowerCase() === "lifetime") hours = 876000;

      fetch("/api/admin/bulk-gen-keys?secret=" + API_SECRET, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amount,
          duration: hours,
          max_devices: maxDev,
          note: note,
          prefix: prefix,
        }),
      })
        .then(function (res) {
          return res.json();
        })
        .then(function (data) {
          if (data.success) {
            showToast(data.count + " key(s) created!", "success");
            document.getElementById("newKeyNote").value = "";
            refreshCurrentTab();
          } else showToast(data.error || "Failed", "error");
        })
        .catch(function (err) {
          showToast("Error: " + err.message, "error");
        });
    });

  document
    .getElementById("createLicenseBtn")
    .addEventListener("click", function () {
      var plan = document.getElementById("newLicPlan").value.trim() || "basic";
      var product =
        document.getElementById("newLicProduct").value.trim() || "REGIX-Auth";
      var duration_days = document.getElementById("newLicDays").value || "30";
      var max_devices = document.getElementById("newLicMaxDev").value || "1";
      fetch("/api/admin/create-license?secret=" + API_SECRET, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: plan,
          product: product,
          duration_days: parseInt(duration_days),
          max_devices: parseInt(max_devices),
        }),
      })
        .then(function (res) {
          return res.json();
        })
        .then(function (data) {
          if (data.success) {
            showToast("License created: " + data.license.license_key, "info");
          } else showToast(data.error || "Failed", "error");
        })
        .catch(function (err) {
          showToast("Error: " + err.message, "error");
        });
    });

  document
    .getElementById("addBlacklistBtn")
    .addEventListener("click", function () {
      var hwid = document.getElementById("blacklistHwid").value.trim();
      var reason = document.getElementById("blacklistReason").value.trim();
      if (!hwid) {
        showToast("HWID required!", "error");
        return;
      }
      fetch("/api/admin/blacklist?secret=" + API_SECRET, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hwid: hwid, reason: reason }),
      })
        .then(function (res) {
          return res.json();
        })
        .then(function (data) {
          if (data.success) {
            showToast("HWID " + hwid + " blacklisted!", "success");
            document.getElementById("blacklistHwid").value = "";
            document.getElementById("blacklistReason").value = "";
          } else showToast(data.error || "Failed", "error");
        })
        .catch(function (err) {
          showToast("Error: " + err.message, "error");
        });
    });

  // Refresh buttons
  document
    .getElementById("refreshKeysBtn")
    .addEventListener("click", refreshDashboardData);
  document
    .getElementById("refreshUsersBtn")
    .addEventListener("click", refreshUsers);
  document
    .getElementById("refreshLicensesBtn")
    .addEventListener("click", refreshLicenses);
  document
    .getElementById("refreshBlacklistBtn")
    .addEventListener("click", refreshBlacklist);
  document
    .getElementById("refreshLogsBtn")
    .addEventListener("click", refreshLogs);

  // ============================================================
  // TICKET SYSTEM
  // ============================================================
  document
    .getElementById("newTicketBtn")
    .addEventListener("click", function () {
      document.getElementById("createTicketModal").classList.remove("hidden");
      document.getElementById("createTicketModal").classList.add("flex");
    });

  document
    .getElementById("closeTicketModalBtn")
    .addEventListener("click", function () {
      document.getElementById("createTicketModal").classList.add("hidden");
      document.getElementById("createTicketModal").classList.remove("flex");
    });

  document
    .getElementById("submitTicketBtn")
    .addEventListener("click", function () {
      var title = document.getElementById("ticketTitle").value.trim();
      var category =
        document.getElementById("ticketCategory").value || "general";
      var priority =
        document.getElementById("ticketPriority").value || "medium";
      var message = document.getElementById("ticketMessage").value.trim();
      if (!title) {
        showToast("Title required!", "error");
        return;
      }
      apiFetch("/api/tickets", {
        method: "POST",
        body: JSON.stringify({
          title: title,
          category: category,
          priority: priority,
          message: message,
        }),
      })
        .then(function (res) {
          return res.json();
        })
        .then(function (data) {
          if (data.success) {
            showToast("Ticket #" + data.ticket.id + " created!", "success");
            document.getElementById("ticketTitle").value = "";
            document.getElementById("ticketMessage").value = "";
            document
              .getElementById("createTicketModal")
              .classList.add("hidden");
            document
              .getElementById("createTicketModal")
              .classList.remove("flex");
            refreshTickets();
          } else showToast(data.error || "Failed", "error");
        })
        .catch(function (err) {
          showToast("Error: " + err.message, "error");
        });
    });

  window.__viewTicket = function (id) {
    apiFetch("/api/tickets/" + id)
      .then(function (res) {
        return res.json();
      })
      .then(function (data) {
        if (!data.ticket) {
          showToast("Ticket not found", "error");
          return;
        }
        showTicketDetail(data.ticket);
      })
      .catch(function (err) {
        showToast("Error: " + err.message, "error");
      });
  };

  function showTicketDetail(ticket) {
    document.getElementById("ticketsTable").parentElement.style.display =
      "none";
    document.getElementById("ticketDetail").classList.remove("hidden");
    document.getElementById("ticketDetailTitle").textContent =
      "\uD83C\uDFAB #" + ticket.id + ": " + ticket.title;

    var html =
      '<div class="mb-3 flex flex-wrap items-center gap-2 text-xs">' +
      '<span class="status-pill ' +
      ticket.status +
      '">' +
      ticket.status.replace("_", " ").toUpperCase() +
      "</span>" +
      '<span class="role-badge">' +
      ticket.category +
      "</span>" +
      '<span class="text-[#ffcc00] bg-[rgba(255,204,0,0.12)] border border-[rgba(255,204,0,0.2)] px-2 py-0.5 rounded text-[0.65rem]">' +
      ticket.priority.toUpperCase() +
      "</span>" +
      '<span class="text-[#64748b]">Created by ' +
      (ticket.creator ? ticket.creator.username : "?") +
      " | " +
      formatDate(ticket.createdAt) +
      "</span>" +
      "</div>";

    (ticket.replies || []).forEach(function (r) {
      html +=
        '<div class="bg-[rgba(0,0,0,0.2)] border ' +
        (r.isStaff ?
          "border-[rgba(0,240,255,0.2)] bg-[rgba(0,240,255,0.02)]"
        : "border-[rgba(0,240,255,0.1)]") +
        ' rounded-lg p-4 mb-2 text-xs">' +
        '<div class="text-[#64748b] mb-2"><strong class="text-[#e2e8f0]">' +
        (r.user ? r.user.username : "?") +
        "</strong> " +
        (r.isStaff ? '<span class="role-badge">STAFF</span>' : "") +
        " \u2014 " +
        formatDate(r.createdAt) +
        "</div>" +
        '<div class="whitespace-pre-wrap leading-relaxed">' +
        r.message +
        "</div>" +
        "</div>";
    });

    if (ticket.status !== "resolved" && ticket.status !== "closed") {
      html +=
        '<div class="flex gap-2 mt-4">' +
        '<textarea id="ticketReplyMessage" placeholder="Type your reply..." rows="2" class="flex-1 px-3 py-2 rounded text-xs resize-y"></textarea>' +
        '<button id="replyToTicketBtn" class="btn-neon px-4 py-2 text-[0.6rem] tracking-widest whitespace-nowrap"><span class="relative z-10">REPLY</span></button>' +
        "</div>";
    }

    if (
      currentUserRole &&
      ["owner", "developer", "moderator", "supporter"].indexOf(
        currentUserRole,
      ) !== -1
    ) {
      html +=
        '<div class="flex flex-wrap gap-2 mt-4">' +
        '<button class="text-[#64748b] border border-[rgba(0,240,255,0.15)] bg-transparent px-2.5 py-1.5 text-[0.6rem] rounded cursor-pointer hover:text-[#00f0ff] hover:border-[rgba(0,240,255,0.3)] transition-colors" data-tstatus="in_progress" data-tid="' +
        ticket.id +
        '">In Progress</button>' +
        '<button class="text-[#64748b] border border-[rgba(0,240,255,0.15)] bg-transparent px-2.5 py-1.5 text-[0.6rem] rounded cursor-pointer hover:text-[#ffcc00] hover:border-[rgba(255,204,0,0.3)] transition-colors" data-tstatus="waiting" data-tid="' +
        ticket.id +
        '">Waiting</button>' +
        '<button class="text-[#64748b] border border-[rgba(0,240,255,0.15)] bg-transparent px-2.5 py-1.5 text-[0.6rem] rounded cursor-pointer hover:text-[#00ff88] hover:border-[rgba(0,255,136,0.3)] transition-colors" data-tstatus="resolved" data-tid="' +
        ticket.id +
        '">Resolve</button>' +
        '<button class="text-[#64748b] border border-[rgba(0,240,255,0.15)] bg-transparent px-2.5 py-1.5 text-[0.6rem] rounded cursor-pointer hover:text-[#64748b] hover:border-[rgba(255,255,255,0.2)] transition-colors" data-tstatus="closed" data-tid="' +
        ticket.id +
        '">Close</button>' +
        "</div>";
    }

    document.getElementById("ticketDetailContent").innerHTML = html;

    // Reply button
    var replyBtn = document.getElementById("replyToTicketBtn");
    if (replyBtn) {
      replyBtn.addEventListener("click", function () {
        var msg = document.getElementById("ticketReplyMessage").value.trim();
        if (!msg) return;
        apiFetch("/api/tickets/" + ticket.id + "/reply", {
          method: "POST",
          body: JSON.stringify({ message: msg }),
        })
          .then(function (res) {
            return res.json();
          })
          .then(function (data) {
            if (data.success) {
              window.__viewTicket(ticket.id);
            } else showToast(data.error || "Reply failed", "error");
          })
          .catch(function (err) {
            showToast("Error: " + err.message, "error");
          });
      });
    }

    // Status change buttons
    document.querySelectorAll("[data-tstatus]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var status = this.dataset.tstatus;
        var tid = this.dataset.tid;
        apiFetch("/api/tickets/" + tid + "/status", {
          method: "PATCH",
          body: JSON.stringify({ status: status }),
        })
          .then(function (res) {
            return res.json();
          })
          .then(function () {
            window.__viewTicket(tid);
          })
          .catch(function (err) {
            showToast("Error: " + err.message, "error");
          });
      });
    });
  }

  document
    .getElementById("closeTicketDetailBtn")
    .addEventListener("click", function () {
      document.getElementById("ticketDetail").classList.add("hidden");
      document.getElementById("ticketsTable").parentElement.style.display =
        "block";
      refreshTickets();
    });

  // ============================================================
  // PANEL USER MANAGEMENT
  // ============================================================
  document
    .getElementById("addPanelUserBtn")
    .addEventListener("click", function () {
      document
        .getElementById("createPanelUserModal")
        .classList.remove("hidden");
      document.getElementById("createPanelUserModal").classList.add("flex");
    });

  document
    .getElementById("closePanelUserModalBtn")
    .addEventListener("click", function () {
      document.getElementById("createPanelUserModal").classList.add("hidden");
      document.getElementById("createPanelUserModal").classList.remove("flex");
    });

  document
    .getElementById("submitPanelUserBtn")
    .addEventListener("click", function () {
      var username = document.getElementById("panelNewUsername").value.trim();
      var password = document.getElementById("panelNewPassword").value.trim();
      var email = document.getElementById("panelNewEmail").value.trim();
      var role = document.getElementById("panelNewRole").value || "user";
      if (!username || !password || !email) {
        showToast("All fields required!", "error");
        return;
      }
      apiFetch("/api/panel/users", {
        method: "POST",
        body: JSON.stringify({
          username: username,
          password: password,
          email: email,
          role: role,
        }),
      })
        .then(function (res) {
          return res.json();
        })
        .then(function (data) {
          if (data.success) {
            showToast('User "' + username + '" created!', "success");
            ["panelNewUsername", "panelNewPassword", "panelNewEmail"].forEach(
              function (id) {
                document.getElementById(id).value = "";
              },
            );
            document
              .getElementById("createPanelUserModal")
              .classList.add("hidden");
            document
              .getElementById("createPanelUserModal")
              .classList.remove("flex");
            refreshPanelUsers();
          } else showToast(data.error || "Failed", "error");
        })
        .catch(function (err) {
          showToast("Error: " + err.message, "error");
        });
    });

  window.__deletePanelUser = function (id) {
    if (!confirm("Delete panel user #" + id + "?")) return;
    apiFetch("/api/panel/users/" + id, { method: "DELETE" })
      .then(function (res) {
        return res.json();
      })
      .then(function (data) {
        if (data.success || data.error === undefined) {
          showToast("User deleted.", "success");
          refreshPanelUsers();
        } else showToast(data.error || "Failed", "error");
      })
      .catch(function (err) {
        showToast("Error: " + err.message, "error");
      });
  };

  // ============================================================
  // LOGOUT
  // ============================================================
  document.getElementById("logoutBtn").addEventListener("click", function () {
    fetch("/api/panel/logout", { method: "POST" });
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  });

  // ============================================================
  // INIT
  // ============================================================
  document.addEventListener("DOMContentLoaded", function () {
    var token = getToken();
    if (!token && window.location.pathname.indexOf("/login") === -1) {
      window.location.href = "/login";
      return;
    }

    if (token) {
      apiFetch("/api/panel/me")
        .then(function (res) {
          return res.json();
        })
        .then(function (data) {
          if (data.user) {
            document.getElementById("userDisplayName").textContent =
              data.user.username;
            var roleBadge = document.getElementById("userRoleBadge");
            if (roleBadge) roleBadge.textContent = data.user.role;
            currentUserRole = data.user.role;

            var panelTab = document.getElementById("panelUsersTabBtn");
            if (panelTab) {
              if (data.user.role === "owner")
                panelTab.classList.remove("hidden");
              else panelTab.classList.add("hidden");
            }
          }
        })
        .catch(function () {
          if (window.location.pathname.indexOf("/login") === -1)
            window.location.href = "/login";
        });
    }

    refreshDashboardData();
  });

  // Auto refresh every 30 seconds
  setInterval(function () {
    var activeTab = document.querySelector(".tab-btn.active");
    if (activeTab && activeTab.dataset.tab === "keys") refreshDashboardData();
  }, 30000);
})();
