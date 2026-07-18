import "./style.css";

const form = document.querySelector("#search-form");
const input = document.querySelector("#query");
const button = document.querySelector("#search-button");
const status = document.querySelector("#status");
const results = document.querySelector("#results");
const template = document.querySelector("#result-template");

const reviewUrl = (placeId) =>
  `https://search.google.com/local/writereview?placeid=${encodeURIComponent(placeId)}`;

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();

  if (!copied) throw new Error("Copie impossible");
}

function showStatus(message, type = "") {
  status.textContent = message;
  status.className = `status ${type}`.trim();
}

function renderPlaces(places) {
  results.replaceChildren();

  if (!places.length) {
    showStatus("Aucun établissement trouvé. Ajoute la ville ou l’adresse.", "error");
    return;
  }

  showStatus(`${places.length} résultat${places.length > 1 ? "s" : ""} trouvé${places.length > 1 ? "s" : ""}.`, "success");

  for (const place of places) {
    const fragment = template.content.cloneNode(true);
    const card = fragment.querySelector(".result-card");
    const name = fragment.querySelector(".place-name");
    const address = fragment.querySelector(".place-address");
    const placeId = fragment.querySelector(".place-id");
    const ratingWrap = fragment.querySelector(".rating-wrap");
    const rating = fragment.querySelector(".place-rating");
    const count = fragment.querySelector(".place-count");
    const copyId = fragment.querySelector(".copy-id");
    const copyReview = fragment.querySelector(".copy-review");
    const openReview = fragment.querySelector(".open-review");
    const openMaps = fragment.querySelector(".open-maps");
    const copiedMessage = fragment.querySelector(".copied-message");

    const directReviewUrl = reviewUrl(place.id);

    name.textContent = place.displayName || "Établissement";
    address.textContent = place.formattedAddress || "Adresse non disponible";
    placeId.textContent = place.id;

    if (typeof place.rating === "number") {
      ratingWrap.hidden = false;
      rating.textContent = `${place.rating.toFixed(1)} ★`;
      count.textContent = typeof place.userRatingCount === "number"
        ? `(${place.userRatingCount} avis)`
        : "";
    }

    openReview.href = directReviewUrl;
    openMaps.href = place.googleMapsUri || `https://www.google.com/maps/search/?api=1&query_place_id=${encodeURIComponent(place.id)}&query=${encodeURIComponent(place.displayName || "")}`;

    const flash = (message) => {
      copiedMessage.textContent = message;
      window.setTimeout(() => {
        if (copiedMessage.textContent === message) copiedMessage.textContent = "";
      }, 1800);
    };

    copyId.addEventListener("click", async () => {
      try {
        await copyText(place.id);
        flash("Place ID copié.");
      } catch {
        flash("Copie impossible.");
      }
    });

    copyReview.addEventListener("click", async () => {
      try {
        await copyText(directReviewUrl);
        flash("Lien d’avis copié. Tu peux maintenant l’écrire dans NFC Tools.");
      } catch {
        flash("Copie impossible.");
      }
    });

    card.dataset.placeId = place.id;
    results.appendChild(fragment);
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const query = input.value.trim();
  if (query.length < 3) {
    showStatus("Saisis au moins 3 caractères.", "error");
    return;
  }

  button.disabled = true;
  button.textContent = "Recherche…";
  results.replaceChildren();
  showStatus("Recherche de l’établissement…");

  try {
    const response = await fetch("/api/search-places", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || "La recherche a échoué.");
    }

    renderPlaces(Array.isArray(data.places) ? data.places : []);
  } catch (error) {
    showStatus(error.message || "Une erreur est survenue.", "error");
  } finally {
    button.disabled = false;
    button.textContent = "Rechercher";
  }
});
