import {Map, View, Feature} from 'ol';
import { remove } from 'ol/array';

import Point from 'ol/geom/Point';


var geoserverUrl = "http://localhost:8080/geoserver";
var selectedPoint = null;
var source = null;
var data_route = null;
var targetx = new Array ();
var targety = new Array ();
var target = new Array ();
var route = new Array ();
var tableroute = new Array ();
var targetxmin = null;
var targetymin = null;
var distmin = 1000000000;
var bestCarriere = null;

//var pathLayer = L.geoJSON(null);

/*
function getVertex(selectedPoint){
	var url = `${geoserverUrl}/wfs?service=WFS&version=2.0.0&request=GetFeature&typeName=routing:nearest_vertex&outputformat=application/json&viewparams=x:${
		selectedPoint.lng
	};y:${selectedPoint.lat};`;

  $.ajax({
    url: url,
    async: false,
    success: function(data) {
      loadVertex(
        data, 
        selectedPoint.toString() === sourceMarker.getLatLng().toString(),
      );
    }
  });
}
*/

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

//chargement des coordonnées des carrières
  function getCoordCarriere(){

var url = `${geoserverUrl}/wfs?service=WFS&version=2.0.0&request=GetFeature&typeName=ressource_lauze:ressource_carriere&outputformat=application/json`;

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
   var m = features.length;

    for (let i = 0; i < m; i++) {
        targetx[i] = features[i].properties.coord_x;
        targety[i] = features[i].properties.coord_y;
    }
}
getCoordCarriere();


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
            /*
            calculRoute(
            data
          );*/
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

    /*
function calculRoute(response){
    var features = response.features;
    console.log(features);
    console.log(features.length);

    var m = features.length;

    for (let i = 0; i < m; i++) {
        distTotal += parseFloat(data.features[i].properties.distance);
    }
}
*/

/*
function getRoute(a, b){

    var url = `${geoserverUrl}/wfs?service=WFS&version=2.0.0&request=GetFeature&typeName=routing:shortest_path&outputformat=application/json&viewparams=source:${a};target:${b};`;

$.getJSON(url, function(data){

    var distTotal = 0;
    var n = data.totalFeatures;

    //console.log(data);
    for (let i = 0; i < n; i++) {
        distTotal += parseFloat(data.features[i].properties.distance);
    }
    
    console.log(distTotal);


})

};
*/

document.getElementById("myBtn").onclick = function(){

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
        }
        else{
            targetxmin;
            targetymin;
            distmin;
        }
    }

    console.log(tableroute);
    console.log(route);
    console.log(targetxmin);
    console.log(targetymin);
    console.log(distmin);

    //Affichage de la carrière la plus proche
    var ressourceFeature = new Feature({
        geometry: new Point([targetxmin, targetymin]),
        Commentair: ' la carrière la plus proche est '
        //type: ,
        //volume: 
      });
    
      var ressourceIconStyle = new Style({
        image: new Icon(/*@type {olx.style.IconOptions} */ ({
          anchor: [0.5, 46],
          anchorXUnits: 'fraction',
          anchorYUnits: 'pixels',
          src: './image/icon.png'
        }))
      });
    
      ressourceFeature.setStyle(ressourceIconStyle);
    
      var ressourceAppro = new VectorSource({
        features: [ressourceFeature]
      });
    
      bestCarriere[p] = new VectorLayer({
        source: ressourceAppro
      });

      map.addLayer(bestCarriere);

      //map.removeLayer(bestCarriere[p-1]);


};