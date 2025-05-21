export interface Song {
  id: number;
  title: string;
  duration_seconds: number;
  track_number: number;
  is_single: boolean;
  album_id: number;
}

export interface Album {
  id: number;
  title: string;
  release_date: string;
  coverart_url: string;
  songs: Song[];
} 