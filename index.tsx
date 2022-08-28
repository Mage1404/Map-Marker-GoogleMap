/**
 * @license
 * Copyright 2019 Google LLC. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
// @ts-nocheck TODO remove when fixed

// This example adds a search box to a map, using the Google Place Autocomplete
// feature. People can enter geographical searches. The search box will return a
// pick list containing a mix of places and predicted search terms.

// This example requires the Places library. Include the libraries=places
// parameter when you first load the API. For example:
// <script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=places">
import React, { useState } from "react";
import ReactDOM from "react-dom";
import { unmountComponentAtNode, render } from "react-dom";
import DataTable from "react-data-table-component";
let markers: google.maps.Marker[] = [];
let locations = [];
function initAutocomplete() {
  const map = new google.maps.Map(
    document.getElementById("map") as HTMLElement,
    {
      center: { lat: 41.780918, lng: -79.421371 },
      zoom: 8,
      mapTypeId: "roadmap",
    }
  );
  const locationButton = document.createElement("button");
  locationButton.textContent = "Pan to Current Location";
  locationButton.classList.add("custom-map-control-button");
  map.controls[google.maps.ControlPosition.TOP_CENTER].push(locationButton);

  // Create the search box and link it to the UI element.
  const input = document.getElementById("pac-input") as HTMLInputElement;
  const search = document.getElementById("search");
  const searchBox = new google.maps.places.SearchBox(input);
  const reacttable = document.getElementById("reacttable");
  const columns = [
    {
      name: "Location",
      selector: "location",
      sortable: true,
    },
  ];

  // Bias the SearchBox results towards current map's viewport.
  map.addListener("bounds_changed", () => {
    searchBox.setBounds(map.getBounds() as google.maps.LatLngBounds);
  });

  // Listen for the event fired when the user selects a prediction and retrieve
  // more details for that place.
  search.addEventListener("submit", (event) => {
    event.preventDefault();
    const places = searchBox.getPlaces();
    if (places.length == 0) {
      return;
    }

    // For each place, get the icon, name and location.
    const bounds = new google.maps.LatLngBounds();

    places.forEach((place) => {
      if (!place.geometry || !place.geometry.location) {
        console.log("Returned place contains no geometry");
        return;
      }

      const icon = {
        url: place.icon as string,
        size: new google.maps.Size(100, 100),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(17, 34),
        scaledSize: new google.maps.Size(25, 25),
      };
      const new_marker = new google.maps.Marker({
        map,
        icon,
        title: place.name,
        position: place.geometry.location,
        table_name: place.formatted_address,
      });
      // Create a marker for each place.
      if (
        markers.length > 0 &&
        new_marker.table_name === markers[0].table_name
      ) {
        return;
      } else {
        checktimezone("" + new_marker.getPosition());
        markers.unshift(new_marker);
        const new_data = { location: new_marker.table_name };
        locations = [new_data, ...locations];
        ReactDOM.render(
          <div>
            <DataTable
              title="Location"
              columns={columns}
              data={locations}
              defaultSortField="Location"
              pagination
              selectableRows
            />
          </div>,
          reacttable
        );
      }
      if (place.geometry.viewport) {
        // Only geocodes have viewport.
        bounds.union(place.geometry.viewport);
      } else {
        bounds.extend(place.geometry.location);
      }
      map.fitBounds(bounds);
      input.value = "";
    });
  });

  locationButton.addEventListener("click", () => {
    // Try HTML5 geolocation.
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position: GeolocationPosition) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          map.setCenter(pos);
        },
        () => {
          handleLocationError(true, map.getCenter()!);
        }
      );
    } else {
      // Browser doesn't support Geolocation
      handleLocationError(false, map.getCenter()!);
    }
  });

  ReactDOM.render(
    <div>
      <DataTable
        title="Location"
        columns={columns}
        data={locations}
        defaultSortField="Location"
        pagination
        selectableRows
      />
    </div>,
    reacttable
  );

  $("#deletebtn").on("click", function () {
    const selectall = document.getElementsByName("select-all-rows")[0];
    if (selectall.checked) {
      for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
      }
      markers = [];
      locations = [];
      unmountComponentAtNode(reacttable);
      ReactDOM.render(
        <div>
          <DataTable
            title="Location"
            columns={columns}
            data={locations}
            defaultSortField="Location"
            pagination
            selectableRows
          />
        </div>,
        reacttable
      );
    } else {
      const selectedlocation = $("input:checked")
        .not($('[name="select-all-rows"]'))
        .parents('[role="row"]')
        .children('[data-tag="allowRowEvents"]')
        .children('[data-tag="allowRowEvents"]');
      for (var i = 0; i < selectedlocation.length; i++) {
        var deletecontent = selectedlocation[i].textContent;
        const result = markers.find(
          ({ table_name }) => table_name === deletecontent
        );
        result.setMap(null);
        markers = markers.filter(function (item) {
          return item.table_name !== deletecontent;
        });
        locations = locations.filter(function (item) {
          return item.location !== deletecontent;
        });
      }
      unmountComponentAtNode(reacttable);
      ReactDOM.render(
        <div>
          <DataTable
            title="Location"
            columns={columns}
            data={locations}
            defaultSortField="Location"
            pagination
            selectableRows
          />
        </div>,
        reacttable
      );
    }
  });
}

function handleLocationError(
  browserHasGeolocation: boolean,
  infoWindow: google.maps.InfoWindow,
  pos: google.maps.LatLng
) {
  infoWindow.setPosition(pos);
  infoWindow.setContent(
    browserHasGeolocation
      ? "Error: The Geolocation service failed."
      : "Error: Your browser doesn't support geolocation."
  );
  infoWindow.open(map);
}

function checktimezone(data) {
  const timezone = document.getElementById("timezone");
  data = data.slice(1, -1);
  data = data.replace(" ", "");
  const timestamp = Math.floor(Date.now() / 1000);
  const apiUrl =
    "https://maps.googleapis.com/maps/api/timezone/json?location=" +
    data +
    "&timestamp=" +
    timestamp +
    "&key=AIzaSyCK2LRLlLo2L2OCYl0n1QD8xg_XJ2IWJp8";
  fetch(apiUrl).then(function (response) {
    response.json().then(function (data) {
      const timedata = new Date(
        (data.rawOffset + data.dstOffset + timestamp) * 1000
      ).toGMTString();
      ReactDOM.render(
        <div>
          <h3>{data.timeZoneName}</h3>
          <p>Local Time: {timedata}</p>
        </div>,
        timezone
      );
      return;
    });
  });

  return;
}

declare global {
  interface Window {
    initAutocomplete: () => void;
  }
}
window.initAutocomplete = initAutocomplete;
export {};
