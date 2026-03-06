let data = null;

async function loadData() {
  try {
    const res = await fetch("cards.json");
    data = await res.json();
  } catch (err) {
    console.error("Failed to load cards.json", err);
  }
}

function resolveLogo(key) {
  if (!key) return "";

  if (key.startsWith("http") || key.startsWith("data:") || key.startsWith("icons/")) {
    return key;
  }

  // If logo is a key, map it to the data URL
  const logos = data?.logos || {};
  if (logos[key]) return logos[key];

  // Fallback: expect a filename in /icons
  return "icons/" + key;
}

function setCard(type, card) {
  const nameEl = document.getElementById(type + "Name");
  const logoEl = document.getElementById(type + "Logo");

  if (!card) {
    nameEl.innerText = "—";
    logoEl.removeAttribute("src");
    return;
  }

  nameEl.innerText = card.name || "";
  logoEl.src = resolveLogo(card.logo);
}

function pick(key) {
  const categories = data?.categories || data;
  if (!categories) return;

  const result = categories[key];
  if (!result) {
    setCard("best");
    setCard("backup");
    document.getElementById("bestName").innerText = "Unknown";
    document.getElementById("backupName").innerText = "—";
    document.getElementById("reason").innerText = "";
    return;
  }

  setCard("best", result.best);
  setCard("backup", result.backup);

  document.getElementById("reason").innerText = result.reason || "";
}

// Quick buttons use inline onclick="pick('<key>')" so they already work.

document.getElementById("search").addEventListener("input", (e) => {
  const categories = data?.categories || data;
  if (!categories) return;

  const val = e.target.value.trim().toLowerCase();
  if (!val) {
    setCard("best");
    setCard("backup");
    document.getElementById("bestName").innerText = "—";
    document.getElementById("backupName").innerText = "—";
    document.getElementById("reason").innerText = "";
    return;
  }

  for (const key of Object.keys(categories)) {
    if (key.includes(val)) {
      pick(key);
      return;
    }
  }
});

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js");
}

loadData();
