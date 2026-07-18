const GOOGLE_ENDPOINT =
  "https://places.googleapis.com/v1/places:searchText";

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

export default async function handler(request) {
  if (request.method !== "POST") {
    return jsonResponse(
      { error: "Méthode non autorisée." },
      405
    );
  }

  const apiKey = Netlify.env.get("GOOGLE_MAPS_API_KEY");

  if (!apiKey) {
    return jsonResponse(
      {
        error:
          "La variable GOOGLE_MAPS_API_KEY n’est pas configurée sur Netlify.",
      },
      500
    );
  }

  let payload;

  try {
    payload = await request.json();
  } catch {
    return jsonResponse(
      { error: "Corps de requête invalide." },
      400
    );
  }

  const query =
    typeof payload?.query === "string"
      ? payload.query.trim()
      : "";

  if (query.length < 3 || query.length > 200) {
    return jsonResponse(
      {
        error:
          "La recherche doit contenir entre 3 et 200 caractères.",
      },
      400
    );
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
          "places.googleMapsUri",
        ].join(","),
      },
      body: JSON.stringify({
        textQuery: query,
        languageCode: "fr",
        maxResultCount: 5,
      }),
    });

    const data = await googleResponse.json().catch(() => ({}));

    if (!googleResponse.ok) {
      console.error("Google Places error:", data);

      return jsonResponse(
        {
          error:
            data?.error?.message ||
            "Google Places a refusé la requête.",
        },
        googleResponse.status
      );
    }

    const places = (data.places || []).map((place) => ({
      id: place.id,
      displayName: place.displayName?.text || "",
      formattedAddress: place.formattedAddress || "",
      rating: place.rating,
      userRatingCount: place.userRatingCount,
      googleMapsUri: place.googleMapsUri || "",
    }));

    return jsonResponse({ places });
  } catch (error) {
    console.error("Unexpected error:", error);

    return jsonResponse(
      {
        error:
          "Impossible de joindre Google Places pour le moment.",
      },
      502
    );
  }
}