// --- 1. カスタムアイコンの定義（ご提示の絵文字アイコンロジックを拡張） ---
const iconTemplates = {
    park: '🛝',      // 公園・遊び場
    nursing: '🍼',   // 授乳室・ケア
    shop: '🛒',      // 買い物・道の駅
    culture: '🎨',   // 文化・アート
    default: '📍'    // その他基本ピン
};

function createCustomIcon(emoji) {
    return L.divIcon({
        html: `<div style="font-size: 24px; background: white; border-radius: 50%; padding: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.3); text-align: center; width: 34px; height: 34px; line-height: 24px;">${emoji}</div>`,
        className: 'custom-baby-marker',
        iconSize: [34, 34],
        iconAnchor: [17, 17]
    });
}

// --- 2. スポットデータの配列（内包マスターデータ） ---
const locations = [
    {
        "id": "1",
        "name": "こどもはっち（八戸）",
        "lat": 40.5122, "lng": 141.4884,
        "category": "nursing",
        "address": "八戸市三日町11-1",
        "hours": "10:00-16:30",
        "reviews": [{ "rating": 5, "comment": "完全室内で安心！おむつ台や授乳室がとても綺麗です。" }]
    },
    {
        "id": "2",
        "name": "いわて子どもの森（一戸町）",
        "lat": 40.1182, "lng": 141.3255,
        "category": "park",
        "address": "二戸郡一戸町奥中山字西田子",
        "hours": "09:00-17:00",
        "reviews": [{ "rating": 5, "comment": "超大型の室内遊具があって、雨の日でも1日中楽しめます！" }]
    },
    {
        "id": "3",
        "name": "道の駅 いわて北三陸（久慈）",
        "lat": 40.1794, "lng": 141.7431,
        "category": "shop",
        "address": "久慈市夏井町",
        "hours": "09:00-19:00",
        "reviews": [{ "rating": 4, "comment": "新しい道の駅で、幼児向けの遊び場スペースや綺麗な授乳室があります。" }]
    },
    {
        "id": "4",
        "name": "十和田市現代美術館（屋外広場）",
        "lat": 40.6163, "lng": 141.2115,
        "category": "culture",
        "address": "十和田市西三番町3",
        "hours": "施設による",
        "reviews": [{ "rating": 4, "comment": "外のお化けのモニュメントに子どもたちが大喜びでした！" }]
    }
];

// --- 3. マップとレイヤーの初期化 ---
const map = L.map('map').setView([40.35, 141.45], 9);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
}).addTo(map);

let markerLayer = L.layerGroup().addTo(map);
let myLocationMarker = null;
let userLocation = null;
let currentCategoryFilter = 'all'; // 現在選択されているフィルターを記憶

// --- 4. 自動追尾機能（現在地を監視） ---
function startTracking() {
    if (!navigator.geolocation) return alert("位置情報がサポートされていません");

    navigator.geolocation.watchPosition(position => {
        const { latitude, longitude } = position.coords;
        userLocation = { lat: latitude, lng: longitude };
        
        // 現在地ピンの更新
        if (myLocationMarker) map.removeLayer(myLocationMarker);
        myLocationMarker = L.marker([latitude, longitude], {
            icon: createCustomIcon('🏃‍♂️') // パパママが動いているイメージ
        }).addTo(map);
        
        // 現在地が更新されたら、画面上の距離表示もリアルタイム再計算
        filterMarkers(currentCategoryFilter);
    }, null, { enableHighAccuracy: true });
}

// --- 5. 距離計算関数（ハバサイン公式） ---
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // 地球の半径(km)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const d = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return d < 1 ? `${Math.round(d * 1000)}m` : `${d.toFixed(1)}km`;
}

// --- 6. ピンの条件分岐と配置（フィルター機能） ---
function filterMarkers(category) {
    currentCategoryFilter = category; // 現在のフィルターを保存
    
    // ボタンのスタイル切り替え
    document.querySelectorAll('.buttons button').forEach(btn => btn.classList.remove('active'));
    const targetBtn = document.getElementById(`btn-${category}`);
    if (targetBtn) targetBtn.classList.add('active');

    // 一旦ピンを全部消す
    markerLayer.clearLayers();

    // 施設の配置ループ
    locations.forEach(spot => {
        // カテゴリが一致するか、または「すべて(all)」の場合に処理
        if (category === 'all' || spot.category === category) {
            
            // デフォルトのアイコンを決定
            let emoji = iconTemplates[spot.category] || iconTemplates.default;

            // 【ご提示のロジック】名前に特定の文字が含まれる場合は自動で滑り台(🛝)にする
            if (
                spot.name.includes("公園") || 
                spot.name.includes("広場") || 
                spot.name.includes("こども館") ||
                spot.name.includes("遊び場")
            ) {
                emoji = iconTemplates.park; // 🛝 に上書き
            }

            // マーカーを作成してレイヤーに追加
            const marker = L.marker([spot.lat, spot.lng], { icon: createCustomIcon(emoji) });
            
            // タップしたら詳細シートを開く
            marker.on('click', () => showDetail(spot));
            markerLayer.addLayer(marker);
        }
    });
}

// --- 7. 詳細ウィンドウ（ボトムシート）の表示 ---
function showDetail(spot) {
    const sheet = document.getElementById('detail-sheet');
    const content = document.getElementById('sheet-content');
    
    // 現在地からの距離を計算
    let distText = "現在地を取得中...";
    if (userLocation) {
        distText = `現在地から ${getDistance(userLocation.lat, userLocation.lng, spot.lat, spot.lng)}`;
    }

    // 口コミの星とテキストの生成
    let reviewHtml = "";
    spot.reviews.forEach(r => {
        reviewHtml += `
            <div class="review-card">
                <div class="stars">${"★".repeat(r.rating)}${"☆".repeat(5-r.rating)}</div>
                <p style="margin:4px 0 0 0; font-size:0.9rem; color:#666;">${r.comment}</p>
            </div>
        `;
    });

    content.innerHTML = `
        <div class="spot-title">${spot.name}</div>
        <span class="distance-tag"><i class="fa-solid fa-location-arrow"></i> ${distText}</span>
        <p style="margin:4px 0; font-size:0.9rem;"><strong>📍 住所:</strong> ${spot.address}</p>
        <p style="margin:4px 0; font-size:0.9rem;"><strong>⏰ 時間:</strong> ${spot.hours}</p>
        <div class="review-section">
            <strong>💬 パパママの口コミ:</strong>
            ${reviewHtml}
        </div>
    `;
    sheet.classList.add('open');
}

function closeSheet() {
    document.getElementById('detail-sheet').classList.remove('open');
}

// --- 8. 簡易検索機能 ---
function searchAddress() {
    const query = document.getElementById('addressInput').value.trim();
    if (!query) return;

    const found = locations.find(spot => spot.name.includes(query) || spot.address.includes(query));
    if (found) {
        map.setView([found.lat, found.lng], 14);
        showDetail(found);
    } else {
        alert("該当するスポットが見つかりませんでした。");
    }
}

// --- 9. 初期起動処理 ---
startTracking();      // 位置追尾スタート
filterMarkers('all'); // 最初は全ピン表示