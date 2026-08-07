export const getCoords = async (city: string, state: string) => {
    try {
        const query = `${city}, ${state}, USA`;
        const res = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`
        );

        const data = await res.json();
        if (data?.length) {
            return {
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon),
            };
        }

        return null;
    } catch (err) {
        return null;
    }
}