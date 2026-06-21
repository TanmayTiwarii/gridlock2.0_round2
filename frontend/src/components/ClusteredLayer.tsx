import { useEffect, useState, useMemo, useCallback } from 'react';
import { Marker, useMap, GeoJSON, LayerGroup } from 'react-leaflet';
import L from 'leaflet';
import Supercluster from 'supercluster';

export const ClusteredLayer = ({ geoData, styleFn, onEachFeature }: any) => {
  const map = useMap();
  const [bounds, setBounds] = useState<L.LatLngBounds | null>(null);
  const [zoom, setZoom] = useState(map.getZoom());

  const updateMapState = useCallback(() => {
    setBounds(map.getBounds());
    setZoom(map.getZoom());
  }, [map]);

  useEffect(() => {
    updateMapState(); // Initial bounds
    map.on('moveend', updateMapState);
    map.on('zoomend', updateMapState);
    return () => {
      map.off('moveend', updateMapState);
      map.off('zoomend', updateMapState);
    };
  }, [map, updateMapState]);

  const supercluster = useMemo(() => {
    const sc = new Supercluster({
      radius: 60, // Slightly larger radius for better clustering
      maxZoom: 16,
    });
    sc.load(geoData?.features || []);
    return sc;
  }, [geoData]);

  const clusters = useMemo(() => {
    if (!bounds || !geoData?.features) return [];
    return supercluster.getClusters(
      [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()],
      zoom
    );
  }, [supercluster, bounds, zoom, geoData]);

  // Separate clusters (which need custom HTML markers) from individual points
  const clusterFeatures = clusters.filter(c => c.properties?.cluster);
  const pointFeatures = clusters.filter(c => !c.properties?.cluster);

  return (
    <LayerGroup>
      {clusterFeatures.map((cluster) => {
        const [longitude, latitude] = cluster.geometry.coordinates;
        const pointCount = cluster.properties.point_count;
        const size = pointCount < 100 ? 30 : pointCount < 500 ? 40 : 50;
        
        const customIcon = L.divIcon({
          html: `<div style="background-color: #6366f1; color: white; width: ${size}px; height: ${size}px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.3); font-size: 12px;">${pointCount}</div>`,
          className: 'custom-marker-cluster',
          iconSize: L.point(size, size, true),
        });

        return (
          <Marker
            key={`cluster-${cluster.id}`}
            position={[latitude, longitude]}
            icon={customIcon}
            eventHandlers={{
              click: () => {
                const expansionZoom = Math.min(supercluster.getClusterExpansionZoom(cluster.id as number), 18);
                map.setView([latitude, longitude], expansionZoom, {
                  animate: true,
                });
              },
            }}
          />
        );
      })}

      {pointFeatures.length > 0 && (
        <GeoJSON
          key={`points-${zoom}-${bounds?.getCenter().lat.toFixed(4)}`} // Force re-render native layer on view change
          data={{ type: 'FeatureCollection', features: pointFeatures } as any}
          pointToLayer={(feature, latlng) => {
            const style = styleFn ? styleFn(feature) : { fillColor: '#8b5cf6', weight: 0, fillOpacity: 0.8 };
            return L.circleMarker(latlng, {
              radius: 6,
              ...style,
              fillColor: style.fillColor,
              color: style.color,
              weight: style.weight,
              opacity: style.opacity,
              fillOpacity: style.fillOpacity
            });
          }}
          onEachFeature={onEachFeature}
        />
      )}
    </LayerGroup>
  );
};
