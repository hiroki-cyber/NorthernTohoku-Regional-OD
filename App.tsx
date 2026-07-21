import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Compass, X, Cloud, RefreshCw, LogOut, Database, ExternalLink } from 'lucide-react';
import L from 'leaflet';

// -------------------------------------------------------------------
// 1. 各種データ定義と初期設定
// -------------------------------------------------------------------
interface Location {
  name: string;
  category: string;
  lat: number;
  lng: number;
  address: string;
  amenities: string;
  nursingSpace?: boolean;
  diaperChange?: boolean;
  hotWater?: boolean;
  strollerFriendly?: boolean;
  kidSeating?: boolean;
}

interface Review {
  rating: number;
  comment: string;
  author: string;
  date: string;
}

// サンプルデータ（実態に合わせて中身を調整してください）
const sampleLocations: Location[] = [];

const categoryColors: Record<string, { label: string; emoji: string; bg: string }> = {
  landmark: { label: 'その他', emoji: '📍', bg: 'bg-slate-100 text-slate-700' },
  playground: { label: '遊び場・公園', emoji: '🛝', bg: 'bg-green-100 text-green-700' },
  nursing: { label: '授乳・ケア', emoji: '🍼', bg: 'bg-blue-100 text-blue-700' },
  shopping: { label: '買い物', emoji: '🛒', bg: 'bg-orange-100 text-orange-700' },
  restaurant: { label: '飲食店', emoji: '🍴', bg: 'bg-yellow-100 text-yellow-700' },
};

const iconTemplates: Record<string, string> = {
  playground: '🛝',
  nursing: '🍼',
  shopping: '🛒',
  restaurant: '🍴',
};

// ダミー関数（エラー防止用：実際の実装があれば置き換えてください）
function getDistanceInKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  return 0;
}
function getDistanceString(lat: number, lng: number) {
  return '';
}
function createCustomIcon(emoji: string, isSelected: boolean) {
  return L.divIcon({ html: `<div>${emoji}</div>` });
}

const categoryTabs = [
  { id: 'all', emoji: '🌟', label: 'すべて' },
  { id: 'playground', emoji: '🛝', label: '遊び場・公園' },
  { id: 'nursing', emoji: '🍼', label: '授乳・ケア' },
  { id: 'shopping', emoji: '🛒', label: '買い物' },
  { id: 'restaurant', emoji: '🍴', label: '飲食店' }
];

// -------------------------------------------------------------------
// 2. メインコンポーネント
// -------------------------------------------------------------------
export default function App() {
  // 状態管理（State）
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSpot, setSelectedSpot] = useState<Location | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [syncMessage, setSyncMessage] = useState('');

  // フィルター状態
  const [filter5km, setFilter5km] = useState(false);
  const [filterNursing, setFilterNursing] = useState(false);
  const [filterDiaper, setFilterDiaper] = useState(false);
  const [filterHotWater, setFilterHotWater] = useState(false);
  const [filterStroller, setFilterStroller] = useState(false);
  const [filterSeating, setFilterSeating] = useState(false);

  // 地図のRef
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerGroupRef = useRef<L.LayerGroup | null>(null);

  // ダミー関数（Google連携などのエラー回避用）
  const handleBackupToDrive = () => {};
  const handleRestoreFromDrive = () => {};
  const handleGoogleDisconnect = () => {};
  const handleGoogleConnect = () => {};
  const tryGeolocate = (move: boolean) => {};

  // フィルターされたスポットの計算（useMemo）
  const filteredLocations = useMemo(() => {
    const result = sampleLocations.filter((spot) => {
      if (selectedCategory !== 'all' && spot.category !== selectedCategory) return false;

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchName = spot.name.toLowerCase().includes(query);
        const matchAddress = spot.address?.toLowerCase().includes(query) || false;
        const matchAmenities = spot.amenities.toLowerCase().includes(query);
        if (!matchName && !matchAddress && !matchAmenities) return false;
      }

      if (filterNursing && !spot.nursingSpace) return false;
      if (filterDiaper && !spot.diaperChange) return false;
      if (filterHotWater && !spot.hotWater) return false;
      if (filterStroller && !spot.strollerFriendly) return false;
      if (filterSeating && !spot.kidSeating) return false;

      return true;
    });

    let finalResult = [...result];
    if (userLocation) {
      if (filter5km) {
        finalResult = finalResult.filter((spot) => {
          const dist = getDistanceInKm(userLocation.lat, userLocation.lng, spot.lat, spot.lng);
          return dist <= 5.0;
        });
      }
      finalResult.sort((a, b) => {
        const distA = getDistanceInKm(userLocation.lat, userLocation.lng, a.lat, a.lng);
        const distB = getDistanceInKm(userLocation.lat, userLocation.lng, b.lat, b.lng);
        return distA - distB;
      });
    }

    return finalResult;
  }, [
    searchQuery,
    selectedCategory,
    filterNursing,
    filterDiaper,
    filterHotWater,
    filterStroller,
    filterSeating,
    userLocation,
    filter5km
  ]);

  // 地図にピンを立てる処理（useEffect）
  useEffect(() => {
    if (!mapRef.current || !markerGroupRef.current) return;
    markerGroupRef.current.clearLayers();

    filteredLocations.forEach((spot) => {
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
  }, [filteredLocations, selectedSpot]);

  // 各種ハンドラー関数
  const handleSpotSelect = (spot: Location) => {
    setSelectedSpot(spot);
    if (mapRef.current) {
      mapRef.current.setView([spot.lat - 0.003, spot.lng], 14, { animate: true });
    }
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

  return (