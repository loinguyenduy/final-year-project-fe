import { useEffect, useRef } from 'react';
import L from 'leaflet';
import './LocationPickerMap.scss';

const DEFAULT_CENTER = [16.047079, 108.20623];
const DEFAULT_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const DEFAULT_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

const markerIcon = L.divIcon({
    className: 'location-pin-marker',
    html: '<span class="location-pin-marker__shape"><span class="location-pin-marker__dot"></span></span>',
    iconSize: [36, 42],
    iconAnchor: [18, 40]
});

const hasValidCoordinates = (latitude, longitude) => (
    latitude !== null
    && latitude !== undefined
    && latitude !== ''
    && longitude !== null
    && longitude !== undefined
    && longitude !== ''
    && Number.isFinite(Number(latitude))
    && Number.isFinite(Number(longitude))
);

const LocationPickerMap = ({
    latitude,
    longitude,
    onLocationChange,
    readOnly = false,
    className = ''
}) => {
    const containerRef = useRef(null);
    const mapRef = useRef(null);
    const markerRef = useRef(null);
    const onLocationChangeRef = useRef(onLocationChange);
    const readOnlyRef = useRef(readOnly);

    useEffect(() => {
        onLocationChangeRef.current = onLocationChange;
    }, [onLocationChange]);

    useEffect(() => {
        readOnlyRef.current = readOnly;
        if (markerRef.current?.dragging) {
            if (readOnly) markerRef.current.dragging.disable();
            else markerRef.current.dragging.enable();
        }
    }, [readOnly]);

    useEffect(() => {
        if (!containerRef.current || mapRef.current) return undefined;

        const initialCoordinates = hasValidCoordinates(latitude, longitude)
            ? [Number(latitude), Number(longitude)]
            : DEFAULT_CENTER;
        const map = L.map(containerRef.current, {
            center: initialCoordinates,
            zoom: hasValidCoordinates(latitude, longitude) ? 16 : 5,
            scrollWheelZoom: true
        });

        L.tileLayer(import.meta.env.VITE_MAP_TILE_URL || DEFAULT_TILE_URL, {
            attribution: import.meta.env.VITE_MAP_ATTRIBUTION || DEFAULT_ATTRIBUTION,
            maxZoom: 19
        }).addTo(map);

        map.on('click', (event) => {
            if (readOnlyRef.current) return;
            onLocationChangeRef.current?.({
                latitude: event.latlng.lat,
                longitude: event.latlng.lng
            });
        });

        mapRef.current = map;
        const resizeTimer = setTimeout(() => map.invalidateSize(), 0);

        return () => {
            clearTimeout(resizeTimer);
            map.remove();
            mapRef.current = null;
            markerRef.current = null;
        };
        // Map lifecycle is intentionally independent from controlled coordinate updates.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        if (!hasValidCoordinates(latitude, longitude)) {
            if (markerRef.current) {
                map.removeLayer(markerRef.current);
                markerRef.current = null;
            }
            map.setView(DEFAULT_CENTER, 5);
            return;
        }

        const coordinates = [Number(latitude), Number(longitude)];
        if (!markerRef.current) {
            const marker = L.marker(coordinates, {
                icon: markerIcon,
                draggable: !readOnlyRef.current
            }).addTo(map);
            marker.on('dragend', () => {
                const position = marker.getLatLng();
                onLocationChangeRef.current?.({
                    latitude: position.lat,
                    longitude: position.lng
                });
            });
            markerRef.current = marker;
        } else {
            markerRef.current.setLatLng(coordinates);
        }
        map.setView(coordinates, Math.max(map.getZoom(), 16));
        setTimeout(() => map.invalidateSize(), 0);
    }, [latitude, longitude]);

    return (
        <div className={`location-picker-map ${className}`.trim()}>
            <div
                ref={containerRef}
                className="location-picker-map__canvas"
                role="application"
                aria-label="Interactive service location map"
            />
            {!readOnly && (
                <p className="location-picker-map__hint mb-0">
                    Click the map or drag the pin to choose the exact service location.
                </p>
            )}
        </div>
    );
};

export default LocationPickerMap;
