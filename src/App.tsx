import React, { useState, useRef } from 'react';
import { Location } from './data';

function App() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSpot, setSelectedSpot] = useState<Location | null>(null);

  // ダミーのロケーションデータ（または props/import 等で連携）
  const locations: Location[] = []; 
  const mapRef = useRef<any>(null);

  const filteredLocations = locations.filter((spot) => {
    const matchesCategory = selectedCategory === 'all' || spot.category === selectedCategory;
    const matchesQuery = !searchQuery || 
      spot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      spot.address?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

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
      const found = filteredLocations.find((spot: Location) => 
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
    <div className="flex flex-col h-screen bg-slate-50 text-slate-800 font-sans">
      <header className="bg-indigo-600 text-white p-4 shadow-md">
        <h1 className="text-xl font-bold">子育て支援マップ</h1>
      </header>
      <main className="flex-1 p-4">
        <input 
          type="text" 
          placeholder="検索..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={handleSearchKeyPress}
          className="border p-2 rounded w-full mb-4"
        />
        {/* マップやリストを表示するエリア */}
        <div>
          {selectedSpot && <p>選択中: {selectedSpot.name}</p>}
        </div>
      </main>
    </div>
  );
}

export default App;