let data = {};

async function loadData() {
  const res = await fetch("cards.json");
  data = await res.json();
}

loadData();

function setCard(type, card) {
  document.getElementById(type + "Name").innerText = card.name;
  const logo = card.logo || "";
  const isAbsolute = logo.startsWith("http") || logo.startsWith("data:");
  document.getElementById(type + "Logo").src = isAbsolute ? logo : "icons/" + logo;
}

function pick(key) {
  const result = data[key];

  if (!result) {
    document.getElementById("bestName").innerText = "Unknown";
    document.getElementById("backupName").innerText = "";
    document.getElementById("reason").innerText = "";
    return;
  }

  setCard("best", result.best);
  setCard("backup", result.backup);

  document.getElementById("reason").innerText = result.reason;
}

document.getElementById("search").addEventListener("input", (e) => {
  const val = (e.target.value || "").trim().toLowerCase();
  if (!val) return;

  for (let key in data) {
    if (key.includes(val)) {
      pick(key);
      return;
    }
  }
});

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js");
}
