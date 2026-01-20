import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LyricsResponse } from '../models/lyrics.model';

@Injectable({
  providedIn: 'root'
})
export class LyricsService {
  private http = inject(HttpClient);
  private readonly API_URL = 'https://api.lyrics.ovh/v1';

  searchLyrics(artist: string, song: string): Observable<LyricsResponse> {
    const url = `${this.API_URL}/${encodeURIComponent(artist)}/${encodeURIComponent(song)}`;
    return this.http.get<LyricsResponse>(url);
  }
}