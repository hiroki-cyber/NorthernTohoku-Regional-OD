export interface Review {
  rating: number;
  comment: string;
  author: string;
  date: string;
}

export interface Location {
  name: string;
  category: string;
  lat: number;
  lng: number;
  amenities: string;
  hours: string;
  holidays: string;
  city?: string;
  address?: string;
  phone?: string;
  nursingSpace?: boolean;
  diaperChange?: boolean;
  hotWater?: boolean;
  strollerFriendly?: boolean;
  kidSeating?: boolean;
  others?: boolean;
  reviews?: Review[];
}

// 最初の状態は空の配列にしておきます
export let locations: Location[] = [];

/**
 * 安全に作成したAPIからデータを読み込む関数
 * アプリの起動時（または地図の初期化時）にこれを1度呼び出します
 */
export async function loadLocationsData(): Promise<Location[]> {
  try {
    // 外部から直接JSONを引っこ抜かれないよう、間に挟んだAPIを呼び出す
    const response = await fetch('/api/locations');
    if (!response.ok) {
      throw new Error('データの取得に失敗しました');
    }
    
    // 読み込んだデータを変数に格納
    locations = await response.json();
    return locations;
  } catch (error) {
    console.error("いたずら防止APIからのデータ読み込みに失敗しました:", error);
    return [];
  }
}