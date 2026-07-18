const GOOGLE_ENDPOINT = "https://places.googleapis.com/v1/places:searchText";

const json = (statusCode, body) => ({
  statusCode,
  headers: {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  },
  body: JSON.stringify(body)
});

export default async (request) => {
  if (request.method !== "POST") {
    return json(405, { error: "Méthode non autorisée." });
  }

  const apiKey = Netlify.env.get("GOOGLE_MAPS_API_KEY");
  if (!apiKey) {
    return json(500, {
      error: "La variable GOOGLE_MAPS_API_KEY n’est pas configurée sur Netlify."
    });
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json(400, { error: "Corps de requête invalide." });
  }

  const query = typeof payload?.query === "string" ? payload.query.trim() : "";
  if (query.length < 3 || query.length > 200) {
    return json(400, { error: "La recherche doit contenir entre 3 et 200 caractères." });
  }

  try {
    const googleResponse = await fetch(GOOGLE_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": [
          "places.id",
          "places.displayName",
          "places.formattedAddress",
          "places.rating",
          "places.userRatingCount",
          "places.googleMapsUri"
        ].join(",")
      },
      body: JSON.stringify({
        textQuery: query,
        languageCode: "fr",
        regionCode: "FR",
        maxResultCount: 5
      })
    });

    const data = await googleResponse.json().catch(() => ({}));

    if (!googleResponse.ok) {
      console.error("Google Places error:", data);
      const message =
        data?.error?.message ||
        "Google Places a refusé la requête. Vérifie l’API, la facturation et la clé.";
      return json(googleResponse.status, { error: message });
    }

    const places = (data.places || []).map((place) => ({
      id: place.id,
      displayName: place.displayName?.text || "",
      formattedAddress: place.formattedAddress || "",
      rating: place.rating,
      userRatingCount: place.userRatingCount,
      googleMapsUri: place.googleMapsUri || ""
    }));

    return json(200, { places });
  } catch (error) {
    console.error(error);
    return json(502, {
      error: "Impossible de joindre Google Places pour le moment."
    });
  }
};
