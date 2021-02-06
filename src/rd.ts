import {AddMagnetRes, DownloadsRes, TorrentInfo, TorrentsRes, TranscodeRes, UnrestrictLinkRes} from "./rd-types";

export type SuccessResWithJson<T = {}>  = {
    success: false;
    error: string;
} | { success: true, json: T }

export type SuccessRes = {
     success: true;
} | { success: false; error: string }

class RealDebridClient {
    private API_TOKEN: string;

    constructor(apiKey: string) {
        this.API_TOKEN = apiKey;
    }

    private async fetchWithHeader(url: string, method?: string, body?: any) {
        return fetch(url, { method: method || 'GET', headers: { Authorization: `Bearer ${this.API_TOKEN}`}, body })
    }

    public async getTorrents(): Promise<SuccessResWithJson<TorrentsRes>> {
        try {
            const res = await this.fetchWithHeader("https://api.real-debrid.com/rest/1.0/torrents", this.API_TOKEN);
            const json = await res.json();
            return { success: true, json };
        } catch (e) {
            return { success: false, error: e.message }
        }
    }

    public async getDownloads(limit?: number ): Promise<SuccessResWithJson<DownloadsRes>> {
        try {
            const url = `https://api.real-debrid.com/rest/1.0/downloads${limit ? `?limit=${limit}` : ''}`;
            const res = await this.fetchWithHeader(url, this.API_TOKEN);
            const json = await res.json();
            return { success: true, json };
        } catch (e) {
            return { success: false, error: e.message }
        }
    }

    public async getTorrentInfo(id: string): Promise<SuccessResWithJson<TorrentInfo>> {
        try {
            const res = await this.fetchWithHeader(`https://api.real-debrid.com/rest/1.0/torrents/info/${id}`);
            const json = await res.json();
            return { success: true, json };
        } catch (e) {
            return { success: false, error: e.message }
        }
    }

    public async addMagnet(href: string): Promise<SuccessResWithJson<AddMagnetRes>> {
        try {
            const res = await this.fetchWithHeader("https://api.real-debrid.com/rest/1.0/torrents/addMagnet", 'POST', new URLSearchParams({ magnet: href }))
            const json = await res.json();
            return { success: true, json };
        } catch (e) {
            return { success: false, error: e.message }
        }
    }

    public async selectAllFiles(id: string): Promise<SuccessRes> {
        try {
            await this.fetchWithHeader(`https://api.real-debrid.com/rest/1.0/torrents/selectFiles/${id}`, 'POST', new URLSearchParams({ files: "all" }))
            return { success: true };
        } catch (e) {
            return { success: false, error: e.message }
        }
    }

    public async getTranscodedStream(id: string): Promise<SuccessResWithJson<TranscodeRes>> {
        try {
            const res = await this.fetchWithHeader(`https://api.real-debrid.com/rest/1.0/streaming/transcode/${id}`)
            const json = await res.json();
            return { success: true, json };
        } catch (e) {
            return { success: false, error: e.message }
        }
    }

    public async unrestrictLink(link: string): Promise<SuccessResWithJson<UnrestrictLinkRes>> {
        try {
            const res = await this.fetchWithHeader(`https://api.real-debrid.com/rest/1.0/unrestrict/link`, 'POST', new URLSearchParams({ link }))
            const json = await res.json();
            return { success: true, json };
        } catch (e) {
            return { success: false, error: e.message }
        }
    }
}

export default RealDebridClient;
