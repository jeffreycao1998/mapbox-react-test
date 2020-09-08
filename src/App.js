import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import ReactMapGL, {Marker, Popup, FlyToInterpolator} from 'react-map-gl';
import useSupercluster from 'use-supercluster';
import data from './data/chicago-parks.json';

function App() {
  const [ viewport, setViewport ] = useState({
    latitude: 41.829985,
    longitude: -87.603735,
    width: '90vw',
    height: '90vh',
    zoom: 10
  });
  const [ selectedTweet, setSelectedTweet ] = useState(null);
  const mapRef = useRef();

  // get map bounds
  const bounds = mapRef.current 
    ? mapRef.current
      .getMap()
      .getBounds()
      .toArray()
      .flat() 
    : null;

  // get clusters
  const { clusters, supercluster } = useSupercluster({
    points: data.features,
    zoom: viewport.zoom,
    bounds,
    options: { radius: 75, maxZoom: 20 }
  })

  useEffect(() => {
    const listener = (e) => {
      if (e.key === 'Escape') {
        setSelectedTweet(null);
      }
    };
    window.addEventListener('keydown', listener);

    return () => {
      window.removeEventListener('keydown', listener);
    }
  },[]);

  return (
    <div>
      <ReactMapGL
        {...viewport}
        mapboxApiAccessToken='pk.eyJ1IjoiamVmZnJleWNhbzE5OTgiLCJhIjoiY2tldDI2dmNhMXIyYjJxbGdxMDZnN2MyNSJ9.sZfYCw2UycRLxqjOUzp5eg'
        mapStyles='mapbox://styles/jeffreycao1998/cket34sml3ma619nv0itt86vc'
        onViewportChange={viewport => setViewport(viewport)}
        maxZoom={20}
        ref={mapRef}
      >
        {
          clusters.map(cluster => {
            const [longitude, latitude] = cluster.geometry.coordinates;
            const {
              cluster: isCluster,
              point_count: pointCount
            } = cluster.properties;

            if (isCluster) {
              return (
                <Marker key={cluster.id} latitude={latitude} longitude={longitude}>
                  <div 
                    className='cluster-marker'
                    style={{ 
                      width: `${30 + (pointCount / 30 / clusters.length) * 50}px`, 
                      height: `${30 + (pointCount / 30 / clusters.length) * 50}px`
                    }}
                    onClick={() => {
                      const expansionZoom = Math.min(20, supercluster.getClusterExpansionZoom(cluster.id));
                      setViewport({
                        ...viewport,
                        latitude,
                        longitude,
                        zoom: expansionZoom,
                        transitionInterpolator: new FlyToInterpolator({ speed: 2 }),
                        transitionDuration: 'auto'
                      });
                    }}
                  >
                    {pointCount}
                  </div>
                </Marker>
              );
            }

            return (
              <Marker 
                key={cluster.properties.title} 
                latitude={cluster.geometry.coordinates[1]} 
                longitude={cluster.geometry.coordinates[0]}
              >
                <button 
                  className="marker-btn"
                  onClick={e => {
                    e.preventDefault();
                    setSelectedTweet(cluster)
                  }}
                >
                  <img src='/twitter.png' alt='tweet' />
                </button>
              </Marker>
            );
          })
        }

        {selectedTweet && (
          <Popup 
            latitude={selectedTweet.geometry.coordinates[1]} 
            longitude={selectedTweet.geometry.coordinates[0]}
            onClose={() => setSelectedTweet(null)}
            closeOnClick={true}
          >
            <div>
              <h2>{selectedTweet.properties.title}</h2>
              <p>{selectedTweet.properties.description}</p>
            </div>
          </Popup>
        )}
      </ReactMapGL>
    </div>
  );
}

export default App;
