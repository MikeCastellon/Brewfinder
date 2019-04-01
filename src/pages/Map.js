import React, { Component } from "react";
import mapboxgl from "mapbox-gl";
import { API_KEY } from "./config";
import {
  parseGeoJson,
  breweryLayer,
  geolocationOptions,
} from "../utilities/mapUtilities";
import "../Map.css";

class Map extends Component{
  state = { breweries: this.props.breweries };
  async componentDidMount(){
  mapboxgl.accessToken = API_KEY;
  const geoLoc = [this.props.breweries.find(brew => brew.longitude).longitude, this.props.breweries.find(brew => brew.latitude).latitude]
  const mapOptions = {
    container: this.mapContainer,
    style: "mapbox://style/mapbox/streets-v9",
    zoom: 10,
    center: geoLoc

  };
  this.createMap(mapOptions, geolocationOptions);
  }
  createMap = (mapOptions,geolocationOptions) => {
    this.map = new mapboxgl.Map(mapOptions);
    const map = this.map;
    const { breweries } = this.props;
    const parsedBreweries = parseGeoJson(breweries);
    map.addControl(
      new mapboxgl.GeolocateControl({
        positions: geolocationOptions,
        trackUserLocation: true
      })
    );
    const nav = new mapboxgl.NavigationControl();
    map.addControl(nav, "top-left");
    map.on('load', _ =>{
      map.addSource('breweries', { type: 'geojson', data: parsedBreweries });
      map.addLayer(breweryLayer);
      map.on('moveend', () => this.fetchBreweries());
      map.on('click', 'breweries', e => {
        const { properties, geometry } = e.features[0];
        const coordinates = geometry.coordinates.slice();
        const { name, address, url } = properties;
        while(Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
          coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
        }
        new mapboxgl.Popup()
          .setLngLat(coordinates)
          .setHTML(
            `
            <div id='popup'>
              <a href=${url}>${name}</a>
             <p> ${address} </p>

            </div>
            `
          )
          .addTo(map);

      });
    });
  }
  fetchBreweries = async () => {
    const map = this.map;
    const { breweries } = this.props;
    const parsedBreweries = parseGeoJson(breweries);
    map.getSource('breweries').setData(parsedBreweries);
  };
  componentWillUnmount(){
    this.map.remove();
  }
  render(){
    return <div id="map" ref={el => (this.mapContainer = el)} />;
  }
}

export default Map
