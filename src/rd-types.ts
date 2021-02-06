enum TorrentStatus {
  magnet_error = "magnet-error",
  magnet_conversion = "magnet_conversion",
  waiting_files_selection = "waiting_files_selection",
  queued = "queued",
  downloading = "downloading",
  downloaded = "downloaded",
  error = "error",
  virus = "virus",
  compressing = "compressing",
  uploading = "uploading",
  dead = "dead",
}

export interface TorrentInfo {
  id: string;
  filename: string;
  original_filename: string; // Original name of the torrent
  hash: string; // SHA1 Hash of the torrent
  bytes: number; // Size of selected files only
  original_bytes: number; // Total size of the torrent
  host: string; // Host main domain
  split: number; // Split size of links
  progress: number; // Possible values: 0 to 100
  status: TorrentStatus; // Current status of the torrent: magnet_error, magnet_conversion, waiting_files_selection, queued, downloading, downloaded, error, virus, compressing, uploading, dead
  added: string; // jsonDate
  files: [
    {
      id: number;
      path: string; // Path to the file inside the torrent, starting with "/"
      bytes: number;
      selected: number; // 0 or 1
    },
    {
      id: number;
      path: string; // Path to the file inside the torrent, starting with "/"
      bytes: number;
      selected: number; // 0 or 1
    }
  ];
  links: string[];
  ended: string; // !! Only present when finished, jsonDate
  speed: number; // !! Only present in "downloading", "compressing", "uploading" status
  seeders: number; // !! Only present in "downloading", "magnet_conversion" status
}

export type TorrentsRes = TorrentInfo[];

export interface DownloadInfo {
  id: string;
  filename: string;
  mimeType: string; // Mime Type of the file, guessed by the file extension
  filesize: number; // bytes, 0 if unknown
  link: string; // Original link
  host: string; // Host main domain
  chunks: number; // Max Chunks allowed
  download: string; // Generated link
  generated: string; // jsonDate
}

export type DownloadsRes = DownloadInfo[];

export interface TranscodeRes {
  apple: {
    // M3U8 Live Streaming format
    [quality: string]: string;
  };
  dash: {
    // MPD Live Streaming format
    [quality: string]: string;
  };
  liveMP4: {
    // Live MP4
    [quality: string]: string;
  };
  h264WebM: {
    // Live H264 WebM
    [quality: string]: string;
  };
}

export interface AddMagnetRes {
  id: string;
  uri: string; // URL of the created ressource
}

export interface UnrestrictLinkRes {
  "id": string,
  "filename": string,
  "filesize": number, // Filesize in bytes, 0 if unknown
  "link": string, // Original link
  "host": string, // Host main domain
  "chunks": number, // Max Chunks allowed
  "crc": number, // Disable / enable CRC check
  "download": string, // Generated link
  "streamable": number, // Is the file streamable on website
  "type": string, // Type of the file (in general, its quality)
  "alternative": [
    {
      "id": string,
      "filename": string,
      "download": string,
      "type": string
    },
    {
      "id": string,
      "filename": string,
      "download": string,
      "type": string
    }
  ]
}
