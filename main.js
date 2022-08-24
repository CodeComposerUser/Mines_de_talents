import {Map, View, Feature} from 'ol';
import OSM from 'ol/source/OSM';
import {ScaleLine, FullScreen, defaults as defaultControls} from 'ol/control';

import {Group as LayerGroup, Tile as TileLayer} from 'ol/layer';


import {Vector as VectorSource} from 'ol/source';
import {Vector as VectorLayer} from 'ol/layer';
import GeoJSON from 'ol/format/GeoJSON';

import Point from 'ol/geom/Point';

import {
  Circle as CircleStyle,
  Fill,
  Stroke,
  Style,
  Icon,
} from 'ol/style';

import Overlay from 'ol/Overlay';

import {
  get as getProjection,
  transform,
} from 'ol/proj';


import {
  Select,
  Translate,
  defaults as defaultInteractions,
} from 'ol/interaction';


//////////////////////Initialisation de la page avec le chargement de la carte///////////////////////////////////

//Localisation du chantier initialement à Florac
var coordinate = transform([3.59347974696789, 44.32324477160222], 'EPSG:4326', 'EPSG:3857');

var iconFeature = new Feature({
  geometry: new Point([coordinate[0], coordinate[1]]),    
  Commentair: ' Chantier de '+ document.getElementById('ouvrage').value + ' - '+ document.getElementById('travaux').value + ' avec du ' + document.getElementById('materiau').value,
});

var iconStyle = new Style({
  image: new Icon( ({
    anchor: [0.5, 46],
    anchorXUnits: 'fraction',
    anchorYUnits: 'pixels',
    src: './image/icon.png'
  }))
});

iconFeature.setStyle(iconStyle);

var chantierSource = new VectorSource({
  features: [iconFeature]
});

var chantier = new VectorLayer({
  source: chantierSource
});

//style des données carrières
function pointStyleFunction(feature, resolution) {
  return new Style({
    image: new CircleStyle({
      radius: 6,
      fill: new Fill({color: 'rgba(255, 0, 0, 0.1)'}),
      stroke: new Stroke({color: 'red', width: 0.5}),
    }),
  });
}

//style des données gisement
function pointStyleFunction2(feature, resolution) {
  return new Style({
    image: new CircleStyle({
      radius: 6,
      fill: new Fill({color: 'rgba(0, 81, 220)'}),
      stroke: new Stroke({color: 'blue', width: 0.5}),
    }),
  });
}

//l'échelle
const scaleControl = new ScaleLine({
  units: 'metric',
  bar: true,
  steps: 4,
  text: true,
  minWidth: 140,
});

//vue initiale
const view = new View({
  center: [301345.22, 5526148.99],
  zoom: 9.5
})

//selection et déplacement du chantier
const selectChantier = new Select ({
  style: new Style({
    image: new Icon( ({
      anchor: [0.5, 46],
      anchorXUnits: 'fraction',
      anchorYUnits: 'pixels',
      src: './image/icon.png'
    })),
  })
});

const translateChantier = new Translate({
  features: selectChantier.getFeatures(),
});

//maps
const map = new Map({
  controls: defaultControls().extend([
    new FullScreen({
      source: 'fullscreen',
    }),
    scaleControl,
  ]),
  layers: [
    new TileLayer({
      source: new OSM()
    }),
    new LayerGroup({
      layers: [
        new VectorLayer({
          source: new VectorSource({
            url: './data/ressource_carriere.geojson',
            format: new GeoJSON(),
            serverType: 'geoserver',
          }),
          style: pointStyleFunction,
        }),

        new VectorLayer({
          source: new VectorSource({
            url: './data/ressource_gisement.geojson',
            format: new GeoJSON(),
            serverType: 'geoserver',
          }),
          style: pointStyleFunction2,
        }),
      ]
    }),
  ],
  target: 'map',
  view: view
});

map.addLayer(chantier)

//rendre l'icone de chantier deplaçable

map.on('click', (e) => {
  const pixel = map.getEventPixel(e.originalEvent);
  const hit = map.hasFeatureAtPixel(pixel);
  document.getElementById('map').style.cursor = hit ? 'pointer' : '';

  const feature = map.forEachFeatureAtPixel(e.pixel, function (feature) {
    return feature;
  });

    if (feature==iconFeature) {
      map.addInteraction(selectChantier);
      map.addInteraction(translateChantier);
      }
      else{
      map.removeInteraction(translateChantier);
      map.removeInteraction(selectChantier);
      }
    })

//affcher les coordonnées du chantier
translateChantier.on('translateend', function (e) {
  var coordChant = transform([e.coordinate[0], e.coordinate[1]], 'EPSG:3857', 'EPSG:4326');

  document.getElementById('x_chantier').value = coordChant[0];
  document.getElementById('y_chantier').value = coordChant[1];
});

//show map option on sidepanel
function bindInputs(layerid, layer) {
  const visibilityInput = $(layerid + ' input.visible');
  visibilityInput.on('change', function () {
    layer.setVisible(this.checked);
  });
  visibilityInput.prop('checked', layer.getVisible());
}
function setup(id, group) {
  group.getLayers().forEach(function (layer, i) {
    const layerid = id + i;
    bindInputs(layerid, layer);
    if (layer instanceof LayerGroup) {
      setup(layerid, layer);
    }
  });
}

setup('#layer', map.getLayerGroup());

//Elements that make up the popup.
const element = document.getElementById('popup');

const popup = new Overlay({
  element: element,
  positioning: 'bottom-center',
  stopEvent: false,
});
map.addOverlay(popup);

// change mouse cursor when over marker
map.on('pointermove', (e) => {

  const pixel = map.getEventPixel(e.originalEvent);
  const hit = map.hasFeatureAtPixel(pixel);
  document.getElementById('map').style.cursor = hit ? 'pointer' : '';
  
  const coordinate = e.coordinate;
  const feature = map.forEachFeatureAtPixel(e.pixel, function (feature) {
    return feature;
  });
  const element = popup.getElement();

  if (feature) {
  $(element).popover('dispose');
  popup.setPosition(coordinate);
  $(element).popover({
    container: element,
    placement: 'top',
    animation: false,
    html: true,
    //content: feature.get('Descriptio')+'( '+ feature.get('Commentair')+')',
    content: feature.get('Commentair'),
  });
    $(element).popover('show');
  }
  else{
    $(element).popover('dispose');
  }

});

// Close the popup when the map is moved
map.on('movestart', function () {
  $(element).popover('dispose');
});

////////////////////////////////calcul de la meilleure solution d'approvisionnement///////////////////////////////

document.getElementById("myBtn").onclick = function(){



if (document.getElementById('chantier').value=='patrimonial'){

  //récupérer les données de la base de données
  var geoserverUrl = "http://localhost:8080/geoserver";
  var sourcegis = null;
  var data_route_gisement = null;
  var targetgis = new Array ();
  var routegis = new Array ();
  var tablerouteGisement = new Array ();
  var targetgisxmin = null;
  var targetgisymin = null;
  var commentairgismin = null ;
  var descriptiogismin = null ;

  var bestGisement = null ;

  //les carrières concernées
var targetgisx = new Array ();
var targetgisy = new Array ();
var cateressgis = new Array ();
var commentairresgis = new Array ();
var descriptioressgis = new Array ();
var qualressgis = new Array ();
var interetressgis = new Array ();
var geolressgis = new Array ();
var typeressgis = new Array ();

// détermination du point le plus proche du chantier

function getVertexChantier(a,b){
	var url = `${geoserverUrl}/wfs?service=WFS&version=2.0.0&request=GetFeature&typeName=routing:nearest_vertex&outputformat=application/json&viewparams=x:${
		a
	};y:${b};`;

  $.ajax({
    url: url,
    async: false,
    success: function(data) {
      loadVertex(
        data
      );
    }
  });
}

function loadVertex(response){
    var features = response.features;
    sourcegis = features[0].properties.id;
}


//chargement des coordonnées des gisement
function getCoordGisement(){

  if (document.getElementById('materiau').value=='calcaire'){
    var url = `${geoserverUrl}/wfs?service=WFS&version=2.0.0&request=GetFeature&typeName=ressource_lauze:ressource_gisement_calcaire_simplifie&outputformat=application/json`;
  }

  else if (document.getElementById('materiau').value=='schistes'){
    var url = `${geoserverUrl}/wfs?service=WFS&version=2.0.0&request=GetFeature&typeName=ressource_lauze:ressource_gisement_schiste_simplifie&outputformat=application/json`;
  }

  else {
    console.log("choissisez le type de materiau")
  }

  $.ajax({
    url: url,
    async: false,
    success: function(data) {
        loadCoordGisement(
        data
      );
    }
  });
}

function loadCoordGisement(response){
    var features = response.features;

    console.log(features);


    var mgis = features.length;

    for (let i = 0; i < mgis; i++) {
        targetgisx[i] = features[i].properties.coord_x;
        targetgisy[i] = features[i].properties.coord_y;
        cateressgis[i] = features[i].properties.categorie;
        commentairresgis[i] = features[i].properties.commentair;
        descriptioressgis[i] = features[i].properties.descriptio;
        qualressgis[i] = features[i].properties.ind_qual;
        interetressgis[i] = features[i].properties.interet;
        geolressgis[i] = features[i].properties.nature_geo;
        typeressgis[i] = features[i].properties.type;
    }
}
getCoordGisement();

// détermination des vertex des gisement
var lgis = targetgisx.length;

console.log(lgis);


for (let i = 0; i < lgis; i++) {

function getVertexGisement(a,b){
	var url = `${geoserverUrl}/wfs?service=WFS&version=2.0.0&request=GetFeature&typeName=routing:nearest_vertex&outputformat=application/json&viewparams=x:${
		targetgisx[i]
	};y:${targetgisy[i]};`;

  $.ajax({
    url: url,
    async: false,
    success: function(data) {
      loadVertexGisement(
        data
      );
    }
  });
}

function loadVertexGisement(response){
    var featuresgis = response.features;
    targetgis[i] = featuresgis[0].properties.id;
}

  getVertexGisement(targetgisx[i],targetgisy[i]);

}

//calcul de la distance
function getRouteGisement(a, b){

    var url = `${geoserverUrl}/wfs?service=WFS&version=2.0.0&request=GetFeature&typeName=routing:shortest_path&outputformat=application/json&viewparams=source:${a};target:${b};`;

    $.ajax({
        url: url,
        async: false,
        success: function(data) {
            data_route_gisement = data;
        }
      });
}

function calculRouteGisement(response){
    var distTotalGisement = 0;

    var features = response.features;

    var mgis1 = features.length;

    for (let i = 0; i < mgis1; i++) {
        distTotalGisement += parseFloat(response.features[i].properties.distance);
    }

    return distTotalGisement;
}

// Popup showing the position the user clicked
const popup3 = new Overlay({
  element: document.getElementById('popup3'),
});
map.addOverlay(popup3);

var distmingis = 1000000000;

    getVertexChantier(document.getElementById('x_chantier').value, document.getElementById('y_chantier').value);
    console.log(sourcegis);
    console.log(targetgis);


    //Détermination de la carrière la plus proche
    for (let i = 0; i < lgis; i++) {
        getRouteGisement(sourcegis,targetgis[i]);
        tablerouteGisement[i]=[targetgisx[i],targetgisy[i], calculRouteGisement(data_route_gisement), ];

        routegis[i]=calculRouteGisement(data_route_gisement);

        if (distmingis>routegis[i]){
            distmingis = routegis[i];
            targetgisxmin = targetgisx[i];
            targetgisymin = targetgisy[i];
            commentairgismin = commentairresgis[i];
            descriptiogismin = descriptioressgis[i];
        }
        else{
            targetgisxmin;
            targetgisymin;
            distmingis;
            commentairgismin;
            descriptiogismin;
        }
    }

    console.log(tablerouteGisement);


  //transformer les coordonées des carrières en coordonnées GPS
    var coordGisementmin = transform([targetgisxmin, targetgisymin], 'EPSG:4326', 'EPSG:3857');

        //Affichage de la carrière la plus proche
        var ressourceFeatureGis = new Feature({
          geometry: new Point([coordGisementmin[0], coordGisementmin[1]]),
          Commentair: 'le site d extraction le plus proche est '+' '+ commentairgismin+' '+descriptiogismin,
          //type: ,
          //volume: 
        });
      
        var ressourceApproGis = new VectorSource({
          features: [ressourceFeatureGis]
        });
      
        bestGisement = new VectorLayer({
          source: ressourceApproGis
        });
  
        console.log(bestGisement);

        console.log(coordGisementmin);
  
        const element3 = popup3.getElement();  
  
        map.addLayer(bestGisement);
  
        popup3.setPosition(coordGisementmin);
        $(element3).popover({
          container: element3,
          placement: 'top',
          animation: false,
          html: true,
          //content: ressourceFeature.get('Commentair'),
          //content: 'la carrière la plus proche est '+' '+ hdms1+' '+hdms2,
        });
        $(element3).popover('show');
    
        const size = map.getSize();
  
        view.centerOn(coordGisementmin, size, [570, 500]);

}

else {
  console.log("le chantier n'est pas patrimonial")
}


//récupérer les données de la base de données
var geoserverUrl = "http://localhost:8080/geoserver";
var source = null;
var data_route = null;
var target = new Array ();
var route = new Array ();
var tableroute = new Array ();
var targetxmin = null;
var targetymin = null;
var commentairresmin = null ;
var descriptioressmin = null ;

var bestCarriere = null ;

//les carrières concernées
var targetx = new Array ();
var targety = new Array ();
var cateress = new Array ();
var commentairres = new Array ();
var descriptioress = new Array ();
var qualress = new Array ();
var interetress = new Array ();
var geolress = new Array ();
var typeress = new Array ();

//chargement des coordonnées des carrières
function getCoordCarriere(){

  if (document.getElementById('materiau').value=='calcaire'){
    var url = `${geoserverUrl}/wfs?service=WFS&version=2.0.0&request=GetFeature&typeName=ressource_lauze:ressource_carriere_calcaire&outputformat=application/json`;
  }

  else if (document.getElementById('materiau').value=='schistes'){
    var url = `${geoserverUrl}/wfs?service=WFS&version=2.0.0&request=GetFeature&typeName=ressource_lauze:ressource_carriere_schiste&outputformat=application/json`;
  }

  else {
    console.log("choissisez le type de materiau")
  }

//var url = `${geoserverUrl}/wfs?service=WFS&version=2.0.0&request=GetFeature&typeName=ressource_lauze:ressource_carriere&outputformat=application/json`;

console.log(document.getElementById('materiau').value);

  $.ajax({
    url: url,
    async: false,
    success: function(data) {
        loadCoordCarriere(
        data
      );
    }
  });
}

function loadCoordCarriere(response){
    var features = response.features;

    console.log(features);

    var m = features.length;

    console.log(m);

    for (let i = 0; i < m; i++) {
        targetx[i] = features[i].properties.coord_x;
        targety[i] = features[i].properties.coord_y;
        cateress[i] = features[i].properties.categorie;
        commentairres[i] = features[i].properties.commentair;
        descriptioress[i] = features[i].properties.descriptio;
        qualress[i] = features[i].properties.ind_qual;
        interetress[i] = features[i].properties.interet;
        geolress[i] = features[i].properties.nature_geo;
        typeress[i] = features[i].properties.type;
    }
}
getCoordCarriere();

// détermination du point le plus proche du chantier
function getVertexChantier(a,b){
	var url = `${geoserverUrl}/wfs?service=WFS&version=2.0.0&request=GetFeature&typeName=routing:nearest_vertex&outputformat=application/json&viewparams=x:${
		a
	};y:${b};`;

  $.ajax({
    url: url,
    async: false,
    success: function(data) {
      loadVertex(
        data
      );
    }
  });
}

function loadVertex(response){
    var features = response.features;
    source = features [0].properties.id;
}


// détermination des vertex des carrières

var l = targetx.length;

for (let i = 0; i < l; i++) {

function getVertexCarriere(a,b){
	var url = `${geoserverUrl}/wfs?service=WFS&version=2.0.0&request=GetFeature&typeName=routing:nearest_vertex&outputformat=application/json&viewparams=x:${
		targetx[i]
	};y:${targety[i]};`;

  $.ajax({
    url: url,
    async: false,
    success: function(data) {
      loadVertexCarriere(
        data
      );
    }
  });
}

function loadVertexCarriere(response){
    var features = response.features;
    target[i] = features[0].properties.id;
}

  getVertexCarriere(targetx[i],targety[i]);
}

//calcul de la distance
function getRoute(a, b){

    var url = `${geoserverUrl}/wfs?service=WFS&version=2.0.0&request=GetFeature&typeName=routing:shortest_path&outputformat=application/json&viewparams=source:${a};target:${b};`;

    $.ajax({
        url: url,
        async: false,
        success: function(data) {
            data_route = data;
        }
      });
}

function calculRoute(response){
    var distTotal = 0;

    var features = response.features;
    var m = features.length;

    for (let i = 0; i < m; i++) {
        distTotal += parseFloat(response.features[i].properties.distance);
    }
    return distTotal;
}

// Popup showing the position the user clicked
const popup2 = new Overlay({
  element: document.getElementById('popup2'),
});
map.addOverlay(popup2);

var distmin = 1000000000;

    getVertexChantier(document.getElementById('x_chantier').value, document.getElementById('y_chantier').value);

    //Détermination de la carrière la plus proche
    for (let i = 0; i < l; i++) {
        getRoute(source,target[i]);
        tableroute[i]=[targetx[i],targety[i], calculRoute(data_route)];
        route[i]=calculRoute(data_route);

        if (distmin>route[i]){
            distmin = route[i];
            targetxmin = targetx[i];
            targetymin = targety[i];
            commentairresmin = commentairres[i];
            descriptioressmin = descriptioress[i];
            console.log(descriptioressmin);

        }
        else{
            targetxmin;
            targetymin;
            distmin;
            commentairresmin;
            descriptioressmin;
            console.log(descriptioressmin);
        }
    }

  //transformer les coordonées des carrières en coordonnées GPS
    var coordCarrieremin = transform([targetxmin, targetymin], 'EPSG:4326', 'EPSG:3857');

    console.log(coordCarrieremin[0]);
    console.log(coordCarrieremin[1]);


    //Affichage de la carrière la plus proche
    var ressourceFeature = new Feature({
        geometry: new Point([coordCarrieremin[0], coordCarrieremin[1]]),
        Commentair: 'la carrière la plus proche est '+' '+ commentairresmin+' '+descriptioressmin,
        //type: ,
        //volume: 
      });
    
      var ressourceAppro = new VectorSource({
        features: [ressourceFeature]
      });
    
      bestCarriere = new VectorLayer({
        source: ressourceAppro
      });

      console.log(bestCarriere);

      const element2 = popup2.getElement();

      //const hdms1 = commentairresmin;

      const hdms2 = descriptioressmin;


      map.addLayer(bestCarriere);

      popup2.setPosition(coordCarrieremin);
      $(element2).popover({
        container: element2,
        placement: 'top',
        animation: false,
        html: true,
        content: ressourceFeature.get('Commentair'),
      });
      $(element2).popover('show');

      console.log(hdms2);

      //const size = map.getSize();

      view.centerOn(coordCarrieremin, size, [570, 500]);
      view.centerOn(coordCarrieremin, [570, 500]);


};