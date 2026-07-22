import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { Location } from './data';
import locationsData from './locations.json';

// 2点間の距離(km)を計算する関数
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// 📍 目立つ大きなアイコン（サイズアップ 48px）
const createCustomIcon = (category?: string, name?: string) => {
  let emoji = '📍';
  let bgColor = '#64748b';

  const textToSearch = `${category || ''} ${name || ''}`;

  if (textToSearch.includes('公園') || textToSearch.includes('広場') || textToSearch.includes('遊び場') || textToSearch.includes('こども園') || textToSearch.includes('キャンプ場')) {
    emoji = '🛝';
    bgColor = '#16a34a';
  } else if (textToSearch.includes('食事') || textToSearch.includes('カフェ') || textToSearch.includes('グルメ') || textToSearch.includes('レストラン') || textToSearch.includes('食堂') || textToSearch.includes('居酒屋') || textToSearch.includes('寿司') || textToSearch.includes('ステーキ') || textToSearch.includes('ドーナツ') || textToSearch.includes('スターバックス')) {
    emoji = '🍴';
    bgColor = '#e11d48';
  } else if (textToSearch.includes('買い物') || textToSearch.includes('スーパー') || textToSearch.includes('ユニバース') || textToSearch.includes('イオン') || textToSearch.includes('モール') || textToSearch.includes('マエダ') || textToSearch.includes('いとく') || textToSearch.includes('西松屋') || textToSearch.includes('ドラッグ') || textToSearch.includes('薬王堂') || textToSearch.includes('ツルハ') || textToSearch.includes('カワチ') || textToSearch.includes('ローソン') || textToSearch.includes('セブン') || textToSearch.includes('ファミリーマート')) {
    emoji = '🛒';
    bgColor = '#ea580c';
  } else if (textToSearch.includes('道の駅') || textToSearch.includes('観光') || textToSearch.includes('美術館') || textToSearch.includes('水族館') || textToSearch.includes('科学館') || textToSearch.includes('温泉') || textToSearch.includes('ホテル') || textToSearch.includes('ロープウェー')) {
    emoji = '🍦';
    bgColor = '#9333ea';
  } else if (textToSearch.includes('おむつ') || textToSearch.includes('トイレ')) {
    emoji = '🛏️';
    bgColor = '#0284c7';
  } else if (textToSearch.includes('授乳') || textToSearch.includes('ミルク')) {
    emoji = '🍼';
    bgColor = '#db2777';
  } else if (textToSearch.includes('病院') || textToSearch.includes('クリニック') || textToSearch.includes('薬局') || textToSearch.includes('支援') || textToSearch.includes('プラザ') || textToSearch.includes('児童館')) {
    emoji = '🏥';
    bgColor = '#059669';
  } else if (textToSearch.includes('郵便局') || textToSearch.includes('役所') || textToSearch.includes('市民センター') || textToSearch.includes('税務署')) {
    emoji = '🏛️';
    bgColor = '#4f46e5';
  } else if (textToSearch.includes('トヨタ') || textToSearch.includes('ダイハツ') || textToSearch.includes('マツダ') || textToSearch.includes('日産') || textToSearch.includes('ホンダ') || textToSearch.includes('自動車') || textToSearch.includes('オートバックス') || textToSearch.includes('イエローハット')) {
    emoji = '🚗';
    bgColor = '#2563eb';
  }

  // 48pxの大きなドロップピン（白フチ＆シャドウ付きで見やすい）
  const htmlContent = `
    <div style="
      background-color: ${bgColor};
      width: 44px;
      height: 44px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.35);
      border: 3px solid #ffffff;
    ">
      <span style="
        transform: rotate(45deg);
        font-size: 22px;
        line-height: 1;
      ">${emoji}</span>
    </div>
  `;

  return L.divIcon({
    html: htmlContent,
    className: 'custom-emoji-pin',
    iconSize: [44, 44],
    iconAnchor: [22, 44],
    popupAnchor: [0, -46]
  });
};

function App() {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSpot, setSelectedSpot] = useState<Location | null>(null);
  
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [isPanelOpen, setIsPanelOpen] = useState<boolean>(false);

  const locations: Location[] = locationsData as Location[];

  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});
  const circleRef = useRef<L.Circle | null>(null);

  const filteredLocations = locations
    .map((spot) => {
      let distance: number | undefined = undefined;
      if (userPos && spot.lat && spot.lng) {
        distance = calculateDistance(userPos.lat, userPos.lng, spot.lat, spot.lng);
      }
      return { ...spot, distance };
    })
    .filter((spot) => {
      const matchesQuery = !searchQuery || 
        spot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        spot.address?.toLowerCase().includes(searchQuery.toLowerCase());

      if (userPos) {
        return matchesQuery && spot.distance !== undefined && spot.distance <= 5;
      }

      return matchesQuery;
    })
    .sort((a, b) => {
      if (a.distance !== undefined && b.distance !== undefined) {
        return a.distance - b.distance;
      }
      return 0;
    });

  useEffect(() => {
    if (!mapRef.current) {
      const map = L.map('map', {
        center: [40.5122, 141.4884],
        zoom: 11,
        zoomControl: false
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
      }).addTo(map);

      mapRef.current = map;

      setTimeout(() => {
        map.invalidateSize();
      }, 300);
    }
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    Object.values(markersRef.current).forEach(m => m.remove());
    markersRef.current = {};

    if (circleRef.current) {
      circleRef.current.remove();
      circleRef.current = null;
    }

    if (userPos) {
      const userMarker = L.circleMarker([userPos.lat, userPos.lng], {
        radius: 10,
        fillColor: '#2563eb',
        color: '#ffffff',
        weight: 3,
        opacity: 1,
        fillOpacity: 1
      }).addTo(map).bindPopup('<b>📍 現在地</b>');

      markersRef.current['__user__'] = userMarker as any;

      circleRef.current = L.circle([userPos.lat, userPos.lng], {
        radius: 5000,
        color: '#2563eb',
        fillColor: '#60a5fa',
        fillOpacity: 0.15,
        weight: 2,
        dashArray: '6, 6'
      }).addTo(map);
    }

    filteredLocations.forEach((spot, idx) => {
      if (spot.lat && spot.lng) {
        const customIcon = createCustomIcon(spot.category, spot.name);
        const distBadge = spot.distance !== undefined 
          ? `<span style="background-color: #e0e7ff; color: #3730a3; padding: 2px 8px; border-radius: 6px; font-size: 12px; font-weight: bold; margin-left: 6px;">約 ${spot.distance.toFixed(1)} km</span>` 
          : '';

        const navUrl = `https://www.google.com/maps/dir/?api=1&destination=${spot.lat},${spot.lng}`;

        const popupContent = `
          <div style="font-family: sans-serif; padding: 4px; min-width: 180px; max-width: 240px;">
            <div style="margin-bottom: 6px;">
              <b style="font-size: 15px; color: #0f172a; line-height: 1.3;">${spot.name}</b>
              ${distBadge}
            </div>
            ${spot.category ? `<span style="display:inline-block; background-color: #f1f5f9; color: #475569; font-size: 11px; padding: 2px 8px; border-radius: 4px; margin-bottom: 8px;">${spot.category}</span>` : ''}
            ${spot.address ? `<p style="font-size: 12px; color: #64748b; margin: 4px 0 10px 0; line-height: 1.3;">📍 ${spot.address}</p>` : ''}
            <a href="${navUrl}" target="_blank" rel="noopener noreferrer" style="
              display: block;
              text-align: center;
              background-color: #4f46e5;
              color: #ffffff;
              text-decoration: none;
              font-size: 12px;
              font-weight: bold;
              padding: 8px 12px;
              border-radius: 8px;
            ">🚗 ここへルート案内</a>
          </div>
        `;

        const marker = L.marker([spot.lat, spot.lng], { icon: customIcon })
          .addTo(map)
          .bindPopup(popupContent, { maxWidth: 280 })
          .on('click', () => {
            setSelectedSpot(spot);
          });

        const key = spot.id || `${spot.name}-${idx}`;
        markersRef.current[key] = marker;
      }
    });
  }, [filteredLocations, userPos]);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('お使いの端末は位置情報に対応していません。');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserPos({ lat: latitude, lng: longitude });
        setIsLocating(false);
        setIsPanelOpen(true);

        if (mapRef.current) {
          mapRef.current.setView([latitude, longitude], 13, { animate: true });
        }
      },
      (error) => {
        setIsLocating(false);
        alert('現在地を取得できませんでした。位置情報の許可を確認してください。');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSpotSelect = (spot: Location) => {
    setSelectedSpot(spot);
    if (mapRef.current && spot.lat && spot.lng) {
      mapRef.current.setView([spot.lat, spot.lng], 15, { animate: true });
      const marker = Object.entries(markersRef.current).find(([k]) => k.startsWith(spot.name))?.[1];
      if (marker) {
        marker.openPopup();
      }
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-100 font-sans relative">
      
      {/* 🗺️ 全画面マップ */}
      <main className="w-full h-full absolute inset-0 z-0">
        <div id="map" className="w-full h-full"></div>
      </main>

      {/* 🔍 左上のフローティング操作バー */}
      <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2 max-w-[calc(100vw-32px)] sm:max-w-md">
        <div className="bg-white/95 backdrop-blur-md p-2 rounded-2xl shadow-xl border border-slate-200 flex items-center gap-2">
          <button
            onClick={() => setIsPanelOpen(!isPanelOpen)}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
              isPanelOpen ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            📋 {isPanelOpen ? '閉じる' : '一覧'}
          </button>

          <input 
            type="text" 
            placeholder="スポット名や住所で検索..." 
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (e.target.value) setIsPanelOpen(true);
            }}
            className="w-full bg-transparent text-xs sm:text-sm text-slate-800 focus:outline-none placeholder-slate-400 px-1"
          />

          <button
            onClick={handleGetCurrentLocation}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-xl font-bold text-xs whitespace-nowrap shadow"
          >
            {isLocating ? '📡' : '🎯 5km圏内'}
          </button>
        </div>

        {userPos && (
          <div className="self-start bg-blue-600 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-md flex items-center gap-2">
            <span>📍 現在地から半径5km以内</span>
            <button 
              onClick={() => { setUserPos(null); setIsPanelOpen(false); }}
              className="bg-blue-800 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]"
            >
              ×
            </button>
          </div>
        )}
      </div>

      {/* 📦 引き出し型パネル（普段は非表示） */}
      {isPanelOpen && (
        <aside className="absolute top-20 left-4 z-[999] w-80 sm:w-96 max-h-[calc(100vh-100px)] bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200 flex flex-col">
          <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/80 rounded-t-2xl">
            <span className="text-xs font-bold text-slate-600">
              {userPos ? '🎯 周辺5km以内のスポット' : '🔍 該当スポット'} (<b>{filteredLocations.length}</b> 件)
            </span>
            <button 
              onClick={() => setIsPanelOpen(false)}
              className="text-slate-400 hover:text-slate-600 text-xs font-bold p-1"
            >
              ✖ 隠す
            </button>
          </div>

          <div className="overflow-y-auto p-3 space-y-2 flex-1 max-h-[60vh]">
            {filteredLocations.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">該当するスポットがありません。</p>
            ) : (
              filteredLocations.map((spot, index) => (
                <div 
                  key={spot.id || index}
                  onClick={() => {
                    handleSpotSelect(spot);
                    if (window.innerWidth < 640) setIsPanelOpen(false);
                  }}
                  className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                    selectedSpot?.name === spot.name 
                      ? 'bg-indigo-50 border-indigo-400 shadow-sm' 
                      : 'bg-white border-slate-100 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-xs text-slate-800">{spot.name}</h3>
                    {spot.distance !== undefined && (
                      <span className="text-[10px] font-extrabold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full whitespace-nowrap ml-1">
                        {spot.distance.toFixed(1)} km
                      </span>
                    )}
                  </div>
                  {spot.address && <p className="text-[11px] text-slate-500 mt-1 truncate">{spot.address}</p>}
                </div>
              ))
            )}
          </div>
        </aside>
      )}

    </div>
  );
}

export default App;
