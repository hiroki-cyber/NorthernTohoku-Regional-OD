// スポットをマップに追加する関数（参考例）
function addMarkers(spots) {
    spots.forEach(spot => {
        // categoryMaster から設定を取得（なければデフォルト）
        const category = categoryMaster[spot.category] || { icon: '📍', class: 'marker-default' };

        // HTML要素としてアイコンを作成
        const customIcon = L.divIcon({
            className: 'custom-marker', // 共通のベーススタイル
            html: `<div class="marker-icon-wrapper ${category.class}">${category.icon}</div>`,
            iconSize: [36, 36],       // アイコンのサイズ [横, 縦]
            iconAnchor: [18, 18],     // ピンの中心点を合わせる位置
            popupAnchor: [0, -18]     // ポップアップが出る位置の調整
        });

        // マーカーを作成してマップに追加
        L.marker([spot.lat, spot.lng], { icon: customIcon })
            .addTo(map)
            .bindPopup(`<b>${spot.name}</b>`);
    });
}
// 遊び場・公園用のカスタムアイコンを定義
const parkIcon = L.icon({
    iconUrl: 'park-icon.png', // ← 用意したアイコン画像のファイル名
    iconSize: [38, 38],       // アイコンのサイズ
    iconAnchor: [19, 38],     // ピンの先端の位置
    popupAnchor: [0, -30]     // ポップアップが出る位置
});