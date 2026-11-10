const $ = (id) => document.getElementById(id);
const form = $("reportForm");
let latestReview = null;
let selectedFileName = "";

$("evidenceFile").addEventListener("change", (event) => {
  const file = event.target.files[0];
  selectedFileName = file ? file.name : "";
  $("fileName").textContent = selectedFileName || "No file selected";
});

function cleanUsername(value) {
  return value.trim().replace(/^@/, "");
}
function parseInstagramUrl(value) {
  try {
    const url = new URL(value.trim());
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    if (host !== "instagram.com") return null;
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts.length !== 1) return null;
    return parts[0].replace(/^@/, "");
  } catch {
    return null;
  }
}
function validUsername(value) {
  return /^[A-Za-z0-9._]{1,30}$/.test(value);
}
function showToast(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2300);
}
function addCheck(label, status) {
  const row = document.createElement("div");
  row.className = "check-item";
  const left = document.createElement("span");
  left.textContent = label;
  const right = document.createElement("span");
  right.textContent = status;
  row.append(left, right);
  $("checkList").append(row);
}
function readHistory() {
  try { return JSON.parse(localStorage.getItem("saudReportHistory") || "[]"); }
  catch { return []; }
}
function renderHistory() {
  const history = readHistory();
  const list = $("historyList");
  list.replaceChildren();
  if (!history.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "No saved reviews yet.";
    list.append(empty);
    return;
  }
  history.forEach((item) => {
    const card = document.createElement("article");
    card.className = "history-item";
    const top = document.createElement("div");
    top.className = "history-top";
    const title = document.createElement("strong");
    title.textContent = "@" + item.username;
    const time = document.createElement("small");
    time.textContent = item.date;
    top.append(title, time);
    const details = document.createElement("p");
    details.textContent = `${item.category} · ${item.evidenceType} · Local record saved`;
    card.append(top, details);
    list.append(card);
  });
}
function showResultError(message) {
  $("resultBadge").textContent = "CHECK FAILED";
  $("resultBadge").style.color = "var(--bad)";
  $("resultBadge").style.borderColor = "rgba(255,115,136,.3)";
  $("scanHeadline").textContent = "Please review the details";
  $("scanSub").textContent = "The target could not pass validation.";
  $("errorBox").textContent = message;
  $("errorBox").classList.remove("hidden");
  $("targetActions").classList.add("hidden");
}
form.addEventListener("submit", (event) => {
  event.preventDefault();
  const username = cleanUsername($("username").value);
  const urlValue = $("profileUrl").value.trim();
  const urlUsername = parseInstagramUrl(urlValue);
  const category = $("category").value;
  const evidenceType = $("evidenceType").value;
  $("resultPanel").classList.remove("hidden");
  $("resultPanel").scrollIntoView({behavior:"smooth", block:"start"});
  $("checkList").replaceChildren();
  $("errorBox").classList.add("hidden");
  $("targetActions").classList.add("hidden");
  $("resultBadge").textContent = "CHECKING";
  $("resultBadge").style.color = "var(--cyan)";
  $("scanHeadline").textContent = "Validating target details";
  $("scanSub").textContent = "Checking username, profile URL and selected fields.";
  addCheck("Username format", validUsername(username) ? "VALID" : "INVALID");
  addCheck("Instagram profile URL", urlUsername ? "VALID FORMAT" : "INVALID");
  addCheck("Username and URL match", urlUsername && username.toLowerCase() === urlUsername.toLowerCase() ? "MATCH" : "NO MATCH");
  addCheck("Report category and evidence", category && evidenceType ? "SELECTED" : "MISSING");

  const errors = [];
  if (!validUsername(username)) errors.push("Enter a valid Instagram username (letters, numbers, periods or underscores; up to 30 characters).");
  if (!urlUsername) errors.push("Enter a direct Instagram profile URL, such as https://www.instagram.com/username/.");
  if (urlUsername && username.toLowerCase() !== urlUsername.toLowerCase()) errors.push("The username does not match the username in the profile link.");
  if (!category || !evidenceType) errors.push("Select both a report category and an evidence type.");

  if (errors.length) {
    showResultError(errors.join(" "));
    return;
  }

  latestReview = {username, profileUrl:`https://www.instagram.com/${encodeURIComponent(username)}/`, category, evidenceType, notes:$("evidence").value.trim(), fileName:selectedFileName};
  $("resultBadge").textContent = "VALID DETAILS";
  $("resultBadge").style.color = "var(--good)";
  $("scanHeadline").textContent = "Target details validated";
  $("scanSub").textContent = "The entered username and profile URL match. Instagram account activity has not been independently verified.";
  $("targetActions").classList.remove("hidden");
  $("openProfile").href = latestReview.profileUrl;
  $("errorBox").classList.add("hidden");
});
$("saveRecord").addEventListener("click", () => {
  if (!latestReview) return;
  const history = readHistory();
  history.unshift({
    ...latestReview,
    id:"SR-" + Date.now().toString().slice(-7),
    date:new Date().toLocaleString(),
    submissionStatus:"Not submitted"
  });
  localStorage.setItem("saudReportHistory", JSON.stringify(history.slice(0,50)));
  renderHistory();
  showToast("Review record saved on this device.");
});
$("clearHistory").addEventListener("click", () => {
  if (!readHistory().length) return showToast("History is already empty.");
  if (confirm("Delete all locally saved review records from this browser?")) {
    localStorage.removeItem("saudReportHistory");
    renderHistory();
    showToast("Local history cleared.");
  }
});
renderHistory();
