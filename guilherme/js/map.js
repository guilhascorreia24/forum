var neei_coordinates = [-7.971990, 37.045167];
mapboxgl.accessToken = 'pk.eyJ1Ijoic2Fjb2xhcyIsImEiOiJjazVra3kxdmQwM29xM2xuenprYm1uYm5yIn0.PYzlwWGvSW0IKgc87dfazA';
var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v9',
    center: neei_coordinates,
    zoom: 15,
});

map.scrollZoom.disable();
map.addControl(new mapboxgl.NavigationControl());
var size = 200;

// implementation of CustomLayerInterface to draw a pulsing dot icon on the map
// see https://docs.mapbox.com/mapbox-gl-js/api/#customlayerinterface for more info
var pulsingDot = {
    width: size,
    height: size,
    data: new Uint8Array(size * size * 4),

    // get rendering context for the map canvas when layer is added to the map
    onAdd: function() {
        var canvas = document.createElement('canvas');
        canvas.width = this.width;
        canvas.height = this.height;
        this.context = canvas.getContext('2d');
    },

    // called once before every frame where the icon will be used
    render: function() {
        var duration = 1000;
        var t = (performance.now() % duration) / duration;

        var radius = (size / 2) * 0.3;
        var outerRadius = (size / 2) * 0.7 * t + radius;
        var context = this.context;

        // draw outer circle
        context.clearRect(0, 0, this.width, this.height);
        context.beginPath();
        context.arc(
            this.width / 2,
            this.height / 2,
            outerRadius,
            0,
            Math.PI * 2
        );
        context.fillStyle = 'rgba(255, 200, 200,' + (1 - t) + ')';
        context.fill();

        // draw inner circle
        context.beginPath();
        context.arc(
            this.width / 2,
            this.height / 2,
            radius,
            0,
            Math.PI * 2
        );
        context.fillStyle = 'rgba(255, 100, 100, 1)';
        context.strokeStyle = 'white';
        context.lineWidth = 2 + 4 * (1 - t);
        context.fill();
        context.stroke();

        // update this image's data with data from the canvas
        this.data = context.getImageData(
            0,
            0,
            this.width,
            this.height
        ).data;

        // continuously repaint the map, resulting in the smooth animation of the dot
        map.triggerRepaint();

        // return `true` to let the map know that the image was updated
        return true;
    }
};

map.on('load', function() {
    // Add a layer showing the places.
    map.loadImage(
        'https://scontent.flis9-1.fna.fbcdn.net/v/t1.0-9/p960x960/55575913_272448866980842_1433195518267228160_o.png?_nc_cat=110&_nc_oc=AQnnj9VDz-gntDn3coAJOarGJGWcckfIk_V_EuO1t1yvxOR4we1-znB7RdjmKiP4cdk&_nc_ht=scontent.flis9-1.fna&oh=2cc04d408bce3cbb083575b22aa85724&oe=5ED20D97',
        function(error, image) {
            if (error) throw error;
            map.addImage('neei', image);
            map.addLayer({
                'id': 'places',
                'type': 'symbol',
                'source': {
                    'type': 'geojson',
                    'data': {
                        'type': 'FeatureCollection',
                        'features': [{
                            'type': 'Feature',
                            'properties': {
                                'description': '<strong>Núcleo de Estudantes de Engenharia Informática</strong><p></p><p>Hey nós estamos aqui na sala algo no andar 0!</p><p>Vem cá visitar-nos :)</p>',
                            },
                            'geometry': {
                                'type': 'Point',
                                'coordinates': neei_coordinates,
                                'icon': 'neei',
                            }
                        }, ]
                    }
                },
                'layout': {
                    'icon-image': 'neei',
                    'icon-allow-overlap': true,
                    'icon-size': 0.1,
                }
            });
        });

    // Create a popup, but don't add it to the map yet.
    var popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false
    });

    map.on('mouseenter', 'places', function(e) {
        // Change the cursor style as a UI indicator.
        map.getCanvas().style.cursor = 'pointer';

        var coordinates = e.features[0].geometry.coordinates.slice();
        var description = e.features[0].properties.description;

        // Ensure that if the map is zoomed out such that multiple
        // copies of the feature are visible, the popup appears
        // over the copy being pointed to.
        while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
            coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
        }

        // Populate the popup and set its coordinates
        // based on the feature found.
        popup
            .setLngLat(coordinates)
            .setHTML(description)
            .addTo(map);
    });

    map.on('mouseleave', 'places', function() {
        map.getCanvas().style.cursor = '';
        popup.remove();
    });
});