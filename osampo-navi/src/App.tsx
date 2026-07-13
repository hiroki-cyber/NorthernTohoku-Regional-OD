// ==========================================
// 1. インポート文
// ==========================================
import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  Search,
  MapPin,
  Phone,
  Clock,
  Calendar,
  Baby,
  Smile,
  X,
  Compass,
  Filter,
  Check,
  Heart,
  ExternalLink,
  ChevronRight,
  Info,
  HelpCircle,
  Cloud,
  RefreshCw,
  LogIn,
  LogOut,
  Database
} from 'lucide-react';

// location.js からのインポート
import { locations as importedLocations } from './location';

// ==========================================
// 2. 型定義 (interface)
// ==========================================
interface Location {
  name: string;
  category: string;
  lat: number;
  lng: number;
  amenities: string;
  nursingSpace: boolean;
  diaperChange: boolean;
  hotWater: boolean;
  strollerFriendly: boolean;
  kidSeating: boolean;
  address?: string;
  city?: string;
}

interface Review {
  rating: number;
  comment: string;
  author: string;
  date: string;
}
// ==========================================
// 3. データの自動変換と代入（完成版）
// ==========================================
let sampleLocations: Location[] = ((importedLocations as any) || []).map((loc: any, index: number) => {
  const text = String(loc.amenities || loc.detail || "");
  
  return {
    id: loc.id || index,
    name: loc.name || "名称未設定",
    category: loc.category || "playground", 
    lat: Number(loc.lat) || 0,
    lng: Number(loc.lng) || 0,
    address: loc.address || "",
    city: loc.city || "",
    nursingSpace: text.includes("授乳") || text.includes("ベビーケア"),
    diaperChange: text.includes("おむつ") || text.includes("オムツ"),
    hotWater: text.includes("湯") || text.includes("調乳"),
    strollerFriendly: text.includes("ベビーカー") || text.includes("車椅子") || text.includes("スロープ"),
    kidSeating: text.includes("椅子") || text.includes("いす") || text.includes("座敷"),
    amenities: text
  };
});
  const text = loc.amenities || loc.detail || "";
  
  return {
    id: loc.id || index,
    name: loc.name || "名称未設定",
    category: loc.category || "playground", 
    lat: Number(loc.lat),
    lng: Number(loc.lng),
    address: loc.address || "",
    city: loc.city || "",
    nursingSpace: text.includes("授乳") || text.includes("ベビーケア"),
    diaperChange: text.includes("おむつ") || text.includes("オムツ"),
    hotWater: text.includes("湯") || text.includes("調乳"),
    strollerFriendly: text.includes("ベビーカー") || text.includes("車椅子") || text.includes("スロープ"),
    kidSeating: text.includes("椅子") || text.includes("いす") || text.includes("座敷"),
    amenities: text
  };
});
// 👆 ここまでが新しいコードです

// 👇 ここから下は一切触らず、そのまま残します！
const categoryColors: Record<string, { bg: string; text: string; label: string; emoji: string }> = {
  playground: { bg: 'bg-emerald-50 text-emerald-800 border-2 border-emerald-200', text: 'text-emerald-800', label: '遊び場・公園', emoji: '🛝' },
  nursing: { bg: 'bg-sky-50 text-sky-800 border-2 border-sky-100', text: 'text-sky-800', label: '授乳・ケア', emoji: '🍼' },
  // ...続く

const categoryColors: Record<string, { bg: string; text: string; label: string; emoji: string }> = {
  playground: { bg: 'bg-emerald-50 text-emerald-800 border-2 border-emerald-200', text: 'text-emerald-800', label: '遊び場・公園', emoji: '🛝' },
  nursing: { bg: 'bg-sky-50 text-sky-800 border-2 border-sky-100', text: 'text-sky-800', label: '授乳・ケア', emoji: '🍼' },
  shopping: { bg: 'bg-orange-50 text-orange-850 border-2 border-orange-200', text: 'text-orange-800', label: '買い物', emoji: '🛒' },
  restaurant: { bg: 'bg-amber-50 text-amber-900 border-2 border-amber-200', text: 'text-amber-800', label: '飲食店', emoji: '🍴' },
  roadside_station: { bg: 'bg-purple-50 text-purple-800 border-2 border-purple-200', text: 'text-purple-800', label: '道の駅', emoji: '🚗' },
  museum: { bg: 'bg-indigo-50 text-indigo-850 border-2 border-indigo-200', text: 'text-indigo-850', label: '施設・ミュージアム', emoji: '🎨' },
  public: { bg: 'bg-teal-50 text-teal-850 border-2 border-teal-200', text: 'text-teal-850', label: '公共窓口', emoji: '🏢' },
  convenience: { bg: 'bg-rose-50 text-rose-800 border-2 border-rose-200', text: 'text-rose-800', label: 'コンビニ', emoji: '🏪' },
  hotel: { bg: 'bg-pink-50 text-pink-850 border-2 border-pink-200', text: 'text-pink-850', label: '温泉・宿', emoji: '♨️' },
  transport: { bg: 'bg-cyan-50 text-cyan-850 border-2 border-cyan-200', text: 'text-cyan-800', label: '駅・交通', emoji: '🚃' },
  landmark: { bg: 'bg-slate-50 text-slate-800 border-2 border-slate-200', text: 'text-slate-700', label: 'その他', emoji: '📍' }
};

export default function App() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerGroupRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const userCircleRef = useRef<L.Circle | null>(null);

  // States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSpot, setSelectedSpot] = useState<Location | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [filter5km, setFilter5km] = useState(false);
  const [showLegend, setShowLegend] = useState(false);

  // Google Drive モック定義
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [syncMessage, setSyncMessage] = useState<string>('');

  const handleGoogleConnect = () => {
    setGoogleUser({ displayName: 'パパママユーザー' });
    setSyncMessage('接続しました');
  };

  const handleBackupToDrive = () => {
    alert('バックアップを作成しました（シミュレーション）');
  };

  const handleRestoreFromDrive = () => {
    alert('データを復元しました（シミュレーション）');
  };

  const handleGoogleDisconnect = () => {
    setGoogleUser(null);
    setSyncMessage('');
  };

  const [spotReviews, setSpotReviews] = useState<Record<string, Review[]>>(() => {
    const saved = localStorage.getItem('papamama_reviews_v3');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return {
      "こどもはっち (はっち4階)": [
        { rating: 5, comment: "完全室内で安心！おむつ台や授乳室がとても綺麗です。", author: "はっちママ", date: "2026-06-21" }
      ],
      "道の駅 いわて北三陸": [
        { rating: 4, comment: "新しい道の駅で、幼児向けの遊び場スペースや綺麗な授乳室があります。", author: "北のパパ", date: "2026-06-20" }
      ]
    };
  });

  const [ratingInput, setRatingInput] = useState<number>(5);
  const [commentInput, setCommentInput] = useState<string>('');
  const [authorInput, setAuthorInput] = useState<string>('');
  
  const [filterNursing, setFilterNursing] = useState(false);
  const [filterDiaper, setFilterDiaper] = useState(false);
  const [filterHotWater, setFilterHotWater] = useState(false);
  const [filterStroller, setFilterStroller] = useState(false);
  const [filterSeating, setFilterSeating] = useState(false);

  const [filteredLocations, setFilteredLocations] = useState<Location[]>(sampleLocations);


    return {
      "こどもはっち (はっち4階)": [
        { rating: 5, comment: "完全室内で安心！おむつ台や授乳室がとても綺麗です。", author: "はっちママ", date: "2026-06-21" }
      ],
      "道の駅 いわて北三陸": [
        { rating: 4, comment: "新しい道の駅で、幼児向けの遊び場スペースや綺麗な授乳室があります。", author: "北のパパ", date: "2026-06-20" }
      ]
    };
  });

  const [ratingInput, setRatingInput] = useState<number>(5);
  const [commentInput, setCommentInput] = useState<string>('');
  const [authorInput, setAuthorInput] = useState<string>('');
  
  const [filterNursing, setFilterNursing] = useState(false);
  const [filterDiaper, setFilterDiaper] = useState(false);
  const [filterHotWater, setFilterHotWater] = useState(false);
  const [filterStroller, setFilterStroller] = useState(false);
  const [filterSeating, setFilterSeating] = useState(false);

  const [filteredLocations, setFilteredLocations] = useState<Location[]>(sampleLocations);

  const iconTemplates: Record<string, string> = {
    playground: '🛝',
    nursing: '🍼',
    shopping: '🛒',
    restaurant: '🍴',
    roadside_station: '🚗',
    museum: '🎨',
    public: '🏢',
    convenience: '🏪',
    hotel: '♨️',
    transport: '🚃',
    landmark: '📍'
  };

  const createCustomIcon = (emoji: string, isActive: boolean = false) => {
    return L.divIcon({
      html: `
        <div class="relative flex items-center justify-center pointer-events-none">
          <div class="w-11 h-11 ${
            isActive 
              ? 'bg-[#f97316] text-white scale-125 border-4 border-white shadow-2xl animate-bounce' 
              : 'bg-white text-slate-800 border-2 border-orange-200 hover:scale-110 shadow-md'
          } rounded-full flex items-center justify-center transition-all duration-300">
            <span style="font-size: 21px; font-family: sans-serif;">${emoji}</span>
          </div>
          <div class="absolute -bottom-1.5 w-3.5 h-3.5 ${isActive ? 'bg-[#f97316]' : 'bg-orange-400'} rotate-45 border-r border-b border-orange-100 shadow-sm"></div>
        </div>
      `,
      className: 'custom-baby-marker',
      iconSize: [44, 44],
      iconAnchor: [22, 44],
      popupAnchor: [0, -44]
    });
  };
  const tryGeolocate = (shouldMoveCamera: boolean = true) => {
    if (!navigator.geolocation) return;

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }
    setIsTracking(true);
    const id = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        setIsTracking(false);

        if (mapRef.current) {
          if (userMarkerRef.current) {
            userMarkerRef.current.setLatLng([latitude, longitude]);
          } else {
            userMarkerRef.current = L.marker([latitude, longitude], {
              icon: L.divIcon({
                html: `
                  <div class="relative flex items-center justify-center pointer-events-none">
                    <div class="w-8 h-8 bg-sky-400 border-4 border-white rounded-full flex items-center justify-center text-sm shadow-xl">🏃</div>
                    <div class="absolute w-12 h-12 bg-sky-300 rounded-full opacity-35 animate-ping"></div>
                  </div>
                `,
                className: 'user-pin',
                iconSize: [36, 36],
                iconAnchor: [18, 18]
              })
            }).addTo(mapRef.current);
          }

          if (shouldMoveCamera) {
            mapRef.current.setView([latitude, longitude], 13, { animate: true });
          }
        }
      },
      (error) => {
        console.warn('Geolocation failed:', error);
        setIsTracking(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
    watchIdRef.current = id;
  };

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      zoomControl: false
    }).setView([40.5126, 141.4901], 10);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const markerGroup = L.layerGroup().addTo(map);

    mapRef.current = map;
    markerGroupRef.current = markerGroup;

    tryGeolocate(false);

    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
      userMarkerRef.current = null;
      userCircleRef.current = null;
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('papamama_reviews_v3', JSON.stringify(spotReviews));
  }, [spotReviews]);

  useEffect(() => {
    if (!mapRef.current || !userLocation) return;

    if (userCircleRef.current) {
      userCircleRef.current.setLatLng([userLocation.lat, userLocation.lng]);
    } else {
      userCircleRef.current = L.circle([userLocation.lat, userLocation.lng], {
        radius: 5000,
        color: '#f97316',
        weight: 3,
        opacity: 0.85,
        dashArray: '8, 8',
        fillColor: '#f97316',
        fillOpacity: 0.12
      }).addTo(mapRef.current);
    }

    return () => {
      if (userCircleRef.current && mapRef.current) {
        mapRef.current.removeLayer(userCircleRef.current);
        userCircleRef.current = null;
      }
    };
  }, [userLocation]);

  const getDistanceInKm = (spotLat: number, spotLng: number) => {
    if (!userLocation) return Infinity;
    const R = 6371;
    const dLat = ((spotLat - userLocation.lat) * Math.PI) / 180;
    const dLon = ((spotLng - userLocation.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((userLocation.lat * Math.PI) / 180) *
        Math.cos((spotLat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const getDistanceString = (spotLat: number, spotLng: number) => {
    if (!userLocation) return null;
    const dist = getDistanceInKm(spotLat, spotLng);
    if (dist === Infinity) return null;
    return dist < 1 ? `${Math.round(dist * 1000)}m` : `${dist.toFixed(1)}km`;
  };

  useEffect(() => {
    const query = searchQuery.toLowerCase().trim();

    const result = sampleLocations.filter((spot) => {
      if (selectedCategory !== 'all' && spot.category !== selectedCategory) {
        return false;
      }
      if (filterNursing && !spot.nursingSpace) return false;
      if (filterDiaper && !spot.diaperChange) return false;
      if (filterHotWater && !spot.hotWater) return false;
      if (filterStroller && !spot.strollerFriendly) return false;
      if (filterSeating && !spot.kidSeating) return false;

      if (query) {
        const matchesName = spot.name.toLowerCase().includes(query);
        const matchesAmenities = spot.amenities.toLowerCase().includes(query);
        const matchesCity = spot.city?.toLowerCase().includes(query) || false;
        const matchesAddress = spot.address?.toLowerCase().includes(query) || false;
        return matchesName || matchesAmenities || matchesCity || matchesAddress;
      }
      return true;
    });

    let finalResult = [...result];
    if (userLocation) {
      if (filter5km) {
        finalResult = finalResult.filter((spot) => {
          const dist = getDistanceInKm(spot.lat, spot.lng);
          return dist <= 5.0;
        });
      }
      finalResult.sort((a, b) => {
        const distA = getDistanceInKm(a.lat, a.lng);
        const distB = getDistanceInKm(b.lat, b.lng);
        return distA - distB;
      });
    }

    setFilteredLocations(finalResult);

    if (mapRef.current && markerGroupRef.current) {
      markerGroupRef.current.clearLayers();

      finalResult.forEach((spot) => {
        let emoji = iconTemplates[spot.category] || '📍';
        if (
          spot.name.includes("公園") ||
          spot.name.includes("広場") ||
          spot.name.includes("こども館") ||
          spot.name.includes("遊び場")
        ) {
          emoji = '🛝';
        }

        const isSelected = selectedSpot?.name === spot.name;
        const marker = L.marker([spot.lat, spot.lng], {
          icon: createCustomIcon(emoji, isSelected)
        });

        marker.on('click', () => {
          setSelectedSpot(spot);
          mapRef.current?.setView([spot.lat - 0.003, spot.lng], 14, { animate: true });
        });

        markerGroupRef.current?.addLayer(marker);
      });
    }
  }, [
    searchQuery,
    selectedCategory,
    filterNursing,
    filterDiaper,
    filterHotWater,
    filterStroller,
    filterSeating,
    selectedSpot,
    userLocation,
    filter5km
  ]);

  const handleSpotSelect = (spot: Location) => {
    setSelectedSpot(spot);
    if (mapRef.current) {
      mapRef.current.setView([spot.lat - 0.003, spot.lng], 14, { animate: true });
    }
  };

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSpot) return;
    if (!commentInput.trim()) return;

    const nickname = authorInput.trim() || 'パパママ会員';
    const newReview: Review = {
      rating: ratingInput,
      comment: commentInput.trim(),
      author: nickname,
      date: new Date().toISOString().split('T')[0]
    };

    setSpotReviews(prev => ({
      ...prev,
      [selectedSpot.name]: [newReview, ...(prev[selectedSpot.name] || [])]
    }));

    setCommentInput('');
    setAuthorInput('');
    setRatingInput(5);
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const query = searchQuery.trim().toLowerCase();
      if (!query) return;
      const found = filteredLocations.find(spot => 
        spot.name.toLowerCase().includes(query) || 
        spot.address?.toLowerCase().includes(query) ||
        spot.amenities?.toLowerCase().includes(query)
      );
      if (found) {
        handleSpotSelect(found);
      }
    }
  };

  const categoryTabs = [
    { id: 'all', emoji: '🌟', label: 'すべて' },
    { id: 'playground', emoji: '🛝', label: '遊び場・公園' },
    { id: 'nursing', emoji: '🍼', label: '授乳・ケア' },
    { id: 'shopping', emoji: '🛒', label: '買い物' },
    { id: 'restaurant', emoji: '🍴', label: '飲食店' },
    { id: 'roadside_station', emoji: '🚗', label: '道の駅' },
    { id: 'museum', emoji: '🎨', label: '施設・ミュージアム' },
    { id: 'public', emoji: '🏢', label: '公共窓口' },
    { id: 'convenience', emoji: '🏪', label: 'コンビニ' },
    { id: 'hotel', emoji: '♨️', label: '温泉・宿' },
    { id: 'transport', emoji: '🚃', label: '駅・交通' },
    { id: 'landmark', emoji: '📍', label: 'その他' }
  ];

  return (
    <div id="app-container" className="flex flex-col h-screen overflow-hidden bg-amber-50">
      
      {/* HEADER BAR */}
      <header className="bg-white border-b-4 border-orange-500 py-4 px-6 shadow-sm shrink-0 flex flex-col sm:flex-row items-center justify-between gap-4 z-30">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-orange-100 shrink-0">
            P
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>PAPA & MAMA</span>
              <span className="text-orange-500 italic">MAP</span>
            </h1>
            <p className="text-xs text-slate-500 font-bold hidden md:block">
              青森県・岩手県内のベビーカー対応店、授乳室、おむつ替え、公園をまとめて検索
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 justify-end w-full sm:w-auto">
          {/* GOOGLE DRIVE SYNC PANEL */}
          <div className="flex items-center gap-3 bg-orange-50/50 border-2 border-orange-100/60 px-4 py-2 rounded-2xl shadow-sm max-w-full">
            <div className="flex flex-col text-right">
              {googleUser ? (
                <>
                  <span className="text-[10px] text-slate-700 font-extrabold flex items-center gap-1.5 justify-end">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-pulse font-sans"></span>
                    Drive 連携中 ({googleUser.displayName})
                  </span>
                  {syncMessage && (
                    <span className="text-[9px] text-orange-600 font-bold max-w-[200px] truncate">{syncMessage}</span>
                  )}
                </>
              ) : (
                <>
                  <span className="text-[10px] text-slate-600 font-black">Google Drive 連携</span>
                  <span className="text-[9px] text-slate-400">クチコミをクラウドに残せます</span>
                </>
              )}
            </div>

            {googleUser ? (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleBackupToDrive}
                  className="bg-orange-500 text-white hover:bg-orange-600 px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1 shadow-md"
                >
                  <Cloud className="w-3.5 h-3.5" /> 保存
                </button>
                <button
                  type="button"
                  onClick={handleRestoreFromDrive}
                  className="bg-sky-500 text-white hover:bg-sky-600 px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1 shadow-md"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> 復元
                </button>
                <button
                  type="button"
                  onClick={handleGoogleDisconnect}
                  className="bg-slate-100 text-slate-500 hover:bg-slate-200 p-2 rounded-xl text-xs flex items-center justify-center transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleGoogleConnect}
                className="bg-white border-2 border-slate-200 text-slate-700 hover:bg-slate-50 px-3 py-1.5 rounded-xl text-xs font-black shadow-sm flex items-center gap-1.5"
              >
                <Database className="w-4 h-4 text-orange-500" />
                <span>Driveに保存</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => tryGeolocate(true)}
            disabled={isTracking}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-black shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer shrink-0 ${
              userLocation 
                ? 'bg-sky-400 text-white shadow-sky-100 hover:bg-sky-500'
                : 'bg-orange-500 text-white shadow-orange-100 hover:bg-orange-600'
            }`}
          >
            <Compass className={`w-4 h-4 ${isTracking ? 'animate-spin' : ''}`} />
            <span>{userLocation ? 'GPS連携中 🏃‍♂️' : '現在地から探す'}</span>
          </button>
        </div>
      </header>

      {/* CORE WRAPPER */}
      <div className="flex-grow flex flex-col md:flex-row overflow-hidden relative">
        
        {/* SIDEBAR LIST AREA */}
        <aside className="w-full h-[55vh] md:w-[390px] md:h-full order-2 md:order-1 bg-amber-50/50 md:border-r-4 border-orange-200 flex flex-col overflow-hidden shadow-inner z-10">
          
          {/* BACKUP CONTROLS INTEGRATION (SEARCH & CATEGORIES) */}
          <div id="controls" className="p-3 bg-white border-b border-orange-100 space-y-3 shrink-0 shadow-sm">
            
            {/* Search Box */}
            <div className="search-box relative flex gap-1">
              <input
                type="text"
                id="addressInput"
                placeholder="施設名や住所、キーワードで検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyPress}
                className="w-full pl-3 pr-8 py-2 bg-slate-100 border-2 border-transparent focus-within:border-orange-300 transition-all rounded-xl text-xs font-bold text-slate-800 outline-none"
              />
              <button 
                id="searchBtn" 
                type="button"
                className="bg-orange-500 text-white px-4 py-2 rounded-xl text-xs font-black shrink-0 hover:bg-orange-600 transition"
              >
                検索
              </button>
              {searchQuery && (
                <button type="button" onClick={() => setSearchQuery('')} className="absolute right-16 top-2.5 text-slate-400">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category Filter Buttons Grid */}
            <div className="buttons grid grid-cols-2 gap-1.5 max-h-[160px] overflow-y-auto pr-1 scrollbar-thin">
              {categoryTabs.map((cat) => (
                <button
                  key={cat.id}
                  id={`btn-${cat.id}`}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-2.5 py-2 rounded-xl text-[11px] font-black text-left transition-all border flex items-center gap-1 truncate ${
                    selectedCategory === cat.id
                      ? 'bg-orange-500 text-white border-transparent shadow-md active'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span>{cat.emoji}</span>
                  <span className="truncate">{cat.label}</span>
                </button>
              ))}
            </div>

            {/* GPS Range Switch & Amenities Filters */}
            <div className="flex flex-col gap-1.5 bg-orange-50/60 p-2 rounded-xl border border-orange-100">
              <div className="flex justify-between items-center text-[10px] font-black text-slate-700">
                <span>📍 5km以内限定絞り込み</span>
                <button
                  type="button"
                  onClick={() => { if (!userLocation) tryGeolocate(true); else setFilter5km(!filter5km); }}
                  className={`px-2 py-0.5 rounded-lg text-[9px] font-black border ${filter5km ? 'bg-orange-500 text-white' : 'bg-white'}`}
                >
                  {filter5km ? 'ON' : 'OFF'}
                </button>
              </div>

              <div className="flex flex-wrap gap-1">
                <button type="button" onClick={() => setFilterNursing(!filterNursing)} className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${filterNursing ? 'bg-sky-500 text-white' : 'bg-white text-slate-600'}`}>🍼 授乳室</button>
                <button type="button" onClick={() => setFilterDiaper(!filterDiaper)} className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${filterDiaper ? 'bg-emerald-500 text-white' : 'bg-white text-slate-600'}`}>🚼 おむつ台</button>
                <button type="button" onClick={() => setFilterHotWater(!filterHotWater)} className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${filterHotWater ? 'bg-orange-500 text-white' : 'bg-white text-slate-600'}`}>🥛 お湯</button>
                <button type="button" onClick={() => setFilterStroller(!filterStroller)} className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${filterStroller ? 'bg-purple-500 text-white' : 'bg-white text-slate-600'}`}>🛒 カート</button>
              </div>
            </div>
          </div>

          {/* SPOT CARDS SCROLLER */}
          <div className="flex-grow overflow-y-auto p-3 space-y-2.5 bg-amber-50/40 scrollbar-thin">
            {filteredLocations.length === 0 ? (
              <div className="p-6 text-center bg-white rounded-2xl border-2 border-dashed border-slate-200">
                <p className="text-xs font-black text-slate-600">見つかりませんでした。条件を変えてみてください。</p>
              </div>
            ) : (
              filteredLocations.map((spot) => {
                const distance = getDistanceString(spot.lat, spot.lng);
                const colorInfo = categoryColors[spot.category] || categoryColors.landmark;
                const isSelected = selectedSpot?.name === spot.name;

                return (
                  <div
                    key={spot.name}
                    onClick={() => handleSpotSelect(spot)}
                    className={`bg-white p-3 rounded-2xl border-2 cursor-pointer transition-all shadow-sm ${
                      isSelected ? 'border-orange-500 ring-2 ring-orange-100 bg-orange-50/10' : 'border-white'
                    }`}
                  >
                    <div className="flex gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-orange-100 flex-shrink-0 flex items-center justify-center text-xl">
                        {colorInfo.emoji}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex gap-1 text-[8px] font-black mb-0.5 flex-wrap">
                          <span className={`px-1.5 rounded-md ${colorInfo.bg}`}>{colorInfo.label}</span>
                          {distance && <span className="text-blue-600 bg-blue-50 px-1 rounded-md">🛰️{distance}</span>}
                        </div>
                        <h3 className="font-black text-slate-900 text-xs truncate leading-tight">{spot.name}</h3>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">{spot.amenities}</p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* MAP COMPONENT AREA */}
        <div className="w-full h-[45vh] md:w-auto md:flex-grow md:h-full order-1 md:order-2 relative border-b-4 md:border-b-0 border-orange-200">
          <div ref={mapContainerRef} className="w-full h-full z-0" />

          {/* FLOATING ACTION OVERLAYS */}
          <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
            <button
              type="button"
              onClick={() => {
                if (userLocation && mapRef.current) {
                  mapRef.current.setView([userLocation.lat, userLocation.lng], 14);
                } else {
                  tryGeolocate(true);
                }
              }}
              className={`p-2.5 rounded-full shadow-xl transition-all border-2 cursor-pointer ${
                userLocation ? 'bg-sky-500 text-white border-white' : 'bg-white text-slate-700 border-slate-200'
              }`}
            >
              <Compass className={`w-4 h-4 ${isTracking ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* FLOATING LEGEND */}
          <div className="absolute top-3 left-3 z-10">
            {!showLegend ? (
              <button
                type="button"
                onClick={() => setShowLegend(true)}
                className="bg-white/95 px-2.5 py-1.5 rounded-xl border border-orange-300 shadow-md text-[10px] font-black text-slate-800 flex items-center gap-1"
              >
                <span>🗺️</span> 早見表
              </button>
            ) : (
              <div className="bg-white/95 p-3 rounded-xl border-2 border-orange-300 shadow-lg max-w-[180px] space-y-1 relative text-[10px] font-bold text-slate-700">
                <button type="button" onClick={() => setShowLegend(false)} className="absolute top-1 right-1 text-slate-400">✕</button>
                <div className="flex items-center gap-1"><span>🛝</span><span>公園・広場 (緑)</span></div>
                <div className="flex items-center gap-1"><span>🍼</span><span>授乳・ケア (青)</span></div>
                <div className="flex items-center gap-1"><span>🛒</span><span>買い物 (橙)</span></div>
                <div className="flex items-center gap-1"><span>🍴</span><span>飲食店 (黄)</span></div>
              </div>
            )}
          </div>
        </div>

        {/* BOTTOM DIALOG / POPUP SHEET PANEL */}
        <div
          id="detail-sheet"
          className={`fixed bottom-0 left-0 right-0 max-h-[80vh] bg-white rounded-t-[2.5rem] shadow-2xl z-50 transform transition-transform duration-300 overflow-y-auto border-t-4 border-orange-500 ${
            selectedSpot ? 'translate-y-0' : 'translate-y-full'
          }`}
        >
          {selectedSpot && (
            <div className="p-5 md:p-6 space-y-4 relative text-slate-800">
              <button type="button" onClick={() => setSelectedSpot(null)} className="absolute top-4 right-4 w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-500">✕</button>
              
              <div className="space-y-1">
                <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-black">
                  {categoryColors[selectedSpot.category]?.label || 'お助けスポット'}
                </span>
                <h2 className="text-xl font-black text-slate-900">{selectedSpot.name}</h2>
                <p className="text-xs text-slate-400 font-bold">📍 {selectedSpot.address}</p>
              </div>

              {/* Bento Box Amenity Indicators */}
              <div className="grid grid-cols-4 gap-2 text-center text-[9px] font-black">
                <div className={`p-2 rounded-xl border ${selectedSpot.nursingSpace ? 'bg-pink-50 border-pink-100 text-pink-600' : 'bg-slate-50 text-slate-300 opacity-40'}`}>🤱 授乳室</div>
                <div className={`p-2 rounded-xl border ${selectedSpot.diaperChange ? 'bg-amber-50 border-amber-100 text-amber-600' : 'bg-slate-50 text-slate-300 opacity-40'}`}>🚼 おむつ</div>
                <div className={`p-2 rounded-xl border ${selectedSpot.hotWater ? 'bg-sky-50 border-sky-100 text-sky-600' : 'bg-slate-50 text-slate-300 opacity-40'}`}>🍼 お湯</div>
                <div className={`p-2 rounded-xl border ${selectedSpot.strollerFriendly ? 'bg-green-50 border-green-100 text-green-600' : 'bg-slate-50 text-slate-300 opacity-40'}`}>🛒 カート</div>
              </div>

              <div className="bg-amber-50/50 p-3 rounded-xl border text-xs leading-relaxed font-medium">
                <div className="font-bold text-orange-600 mb-1">📢 詳細お助け情報</div>
                {selectedSpot.amenities}
              </div>

              {/* REVIEWS BLOCK */}
              <div className="space-y-2 border-t pt-3">
                <h4 className="font-black text-xs text-slate-900 flex items-center gap-1">💬 先輩ママパパのリアルクチコミ</h4>
                <div className="space-y-2 max-h-[140px] overflow-y-auto text-[11px]">
                  {(spotReviews[selectedSpot.name] || []).length === 0 ? (
                    <p className="text-slate-400 italic">まだクチコミがありません。最初の投稿をどうぞ！</p>
                  ) : (
                    (spotReviews[selectedSpot.name] || []).map((rev, idx) => (
                      <div key={idx} className="bg-slate-50 p-2 rounded-xl border">
                        <div className="flex justify-between text-amber-500 font-bold text-[10px]">
                          <span>{"★".repeat(rev.rating)}</span>
                          <span className="text-slate-400">{rev.date}</span>
                        </div>
                        <p className="font-medium mt-0.5">{rev.comment}</p>
                        <div className="text-[9px] text-slate-400 text-right">- 投稿者: {rev.author}</div>
                      </div>
                    ))
                  )}
                </div>

                {/* Micro Input Submission Review Form */}
                <form onSubmit={handleAddReview} className="space-y-1.5 pt-2 border-t border-dashed">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="名前"
                      value={authorInput}
                      onChange={(e) => setAuthorInput(e.target.value)}
                      className="w-1/3 px-2 py-1 bg-slate-50 border rounded-lg text-xs"
                    />
                    <select
                      value={ratingInput}
                      onChange={(e) => setRatingInput(Number(e.target.value))}
                      className="w-2/3 px-1 py-1 bg-slate-50 border rounded-lg text-xs"
                    >
                      <option value="5">⭐⭐⭐⭐⭐ 5点 (超お助け)</option>
                      <option value="4">⭐⭐⭐⭐ 4点 (満足)</option>
                      <option value="3">⭐⭐⭐ 3点 (普通)</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="体験談を入力してください（ゴミ箱がある、広いなど）"
                      value={commentInput}
                      onChange={(e) => setCommentInput(e.target.value)}
                      required
                      className="flex-1 px-2 py-1 bg-slate-50 border rounded-lg text-xs"
                    />
                    <button type="submit" className="px-3 py-1 bg-orange-500 text-white rounded-lg text-xs font-black shrink-0">投稿</button>
                  </div>
                </form>
              </div>

              {/* ROUTE BUTTON */}
              <div className="pt-2 flex justify-end">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${selectedSpot.lat},${selectedSpot.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-slate-900 text-white px-6 py-2.5 rounded-full font-black text-xs flex items-center gap-1.5 shadow-md"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Googleマップナビを開く
                </a>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* FOOTER */}
      <footer className="bg-white px-4 py-2 border-t border-orange-100 shrink-0 z-20 text-[10px] text-slate-400 font-bold hidden sm:block shadow-inner">
        <div className="flex justify-between items-center">
          <span>青森県・岩手県内の子育て世帯安心お立ち寄りマップ 🎒</span>
          <span>現在 {sampleLocations.length} のお助けスポットが掲載中</span>
        </div>
      </footer>
    </div>
  );
}