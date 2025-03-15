function legend(status) {
  const legendControl = L.control({ position: 'topleft' });

  legendControl.onAdd = function (map) {
    const div = L.DomUtil.create('div', 'info legend');
    div.innerHTML = '<strong>凡例</strong>';

    // ステータスごとの色と名前を追加
    for (const key in status) {
      const layername = status[key]['name'];
      const color = status[key]['color']; // ステータスの色を取得
      const number = status[key]['id']; // ステータスの数値

      div.innerHTML += `
        <div class="legend-item">
          <i class="legend-icon" style="background:${color};"></i>
          ${layername} (${number})
        </div>
      `;
    }

    return div;
  };

  return legendControl;
}

function setDefaultStatus() {
  return [
    { "id": 0, "name": "未", "color": "#0288D1", "note": "" },
    { "id": 1, "name": "完了", "color": "#FFD600", "note": "" },
    { "id": 2, "name": "異常", "color": "#E65100", "note": "" },
    { "id": 3, "name": "予約", "color": "#0F9D58", "note": "" },
    { "id": 4, "name": "要確認", "color": "#FF9706", "note": "" },
    { "id": 5, "name": "異常対応中", "color": "#9106E9", "note": "" },
    { "id": 6, "name": "削除", "color": "#FFD600", "note": "" }
  ];
}

async function getStatusList() {
  const groupstatusResponse = await fetch('/data/groupstatus.json');
  const groupstatus = await groupstatusResponse.json();
  return groupstatus;
}

function getPinNote(note) {
  if (note == null) {
    return "なし"
  } else {
    return note
  }
}

async function getSignBoardPins(groupid=null) {
  let response
  if (groupid==null) {
    response = await fetch('/data/signboard/all.json')
  } else {
    response = await fetch(`/data/signboard/${groupid}.json`)
  }
  const data = await response.json();
  return data
}

async function loadsignBoardPins(pins, layer, status, groupname = null) {
  pins.forEach(pin => {
    if(pin.status === status.id) {
      var marker = L.circleMarker([pin.lat, pin.long], {
        radius: 8,
        color: 'black',
        weight: 1,
        fillColor: status.color,
        fillOpacity: 0.9,
        border: 1,
      })
      .addTo(layer);

      let popupContent = `<b>${pin.groupname} ${pin.boardid} `;
      if (groupname) {
        popupContent += `${pin.boardname}`;
      }      
      popupContent += `</b><br>
                      更新日: ${getPinNote(pin.lastupdate)}<br>
                      ステータス: ${status.name}<br>
                      備考: ${getPinNote(pin.note)}<br>
                      座標: <a href="https://www.google.com/maps/search/${pin.lat},+${pin.long}" target="_blank" rel="noopener noreferrer">(${pin.lat}, ${pin.long})</a><br>
                      コメント: ${getPinNote(pin.comment)}`;
      marker.bindPopup(popupContent);
      console.log(pin)
      console.log(popupContent)
    }
  });
}

function onLocationFound(e) {
  const radius = e.accuracy / 2;

  const locationMarker = L.marker(e.latlng).addTo(map)
    .bindPopup("現在地").openPopup();
  const locationCircle = L.circle(e.latlng, radius).addTo(map);

  map.setView(e.latlng, 14);
}

function onLocationError(e) {
  let latlong, zoom;
  latlong = [35.6988862, 139.4649636],
  zoom = 11
  map.setView(latlong, zoom);
}

const baseLayers = {
  'OpenStreetMap': osm,
  'Google Map': googleMap,
  '国土地理院地図': japanBaseMap,
};

const overlays = {};

var map = L.map('map', {
  preferCanvas: true,
});
googleMap.addTo(map);

const layerControl = L.control.layers(baseLayers, overlays).addTo(map);

map.on('locationfound', onLocationFound);
map.on('locationerror', onLocationError);
map.locate({setView: false, maxZoom: 14});

const groupname = getParamFromUrl("groupname");
const groupid = getParamFromUrl("groupid");

Promise.all([getStatusList(),getSignBoardPins(groupid), getProgress(), getProgressCountdown()]).then(function(res) {
  const groupStatus = res[0];
  const pins = res[1];
  let status = groupStatus[groupname];

  if (!status) {
    status = setDefaultStatus();
  }

  // groupname が存在する場合、pins をフィルタリング
  let filteredPins = groupname ? pins.filter(pin => pin.groupname === groupname) : pins;

  for (const key in status) {
    const layername = status[key]['name']
    if(!overlays[layername]) {
      overlays[layername] = L.layerGroup();
      map.addLayer(overlays[layername]);
      layerControl.addOverlay(overlays[layername],layername)
    }
    loadsignBoardPins(filteredPins, overlays[layername], status[key], groupname);
  }

  // 凡例を地図に追加
  legend(status).addTo(map);

}).catch((error) => {
  console.error('Error in fetching data:', error);
});


