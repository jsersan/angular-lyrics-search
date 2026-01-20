import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, retry } from 'rxjs/operators';
import { throwError } from 'rxjs';

interface LyricsResponse {
  lyrics: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  private http = inject(HttpClient);
  private readonly API_URL = 'https://api.lyrics.ovh/v1';
  
  artist = '';
  title = '';
  lyrics = '';
  errorMessage = '';
  isLoading = false;
  searchAttempted = false;

  private normalizeText(text: string): string {
    return text
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/['']/g, "'")
      .replace(/[""]/g, '"');
  }

  private encodeParameter(param: string): string {
    return encodeURIComponent(this.normalizeText(param));
  }

  private getLyrics(artist: string, title: string) {
    if (!artist || !title) {
      return throwError(() => new Error('El artista y el título son requeridos'));
    }

    const encodedArtist = this.encodeParameter(artist);
    const encodedTitle = this.encodeParameter(title);
    const url = `${this.API_URL}/${encodedArtist}/${encodedTitle}`;

    console.log('URL de búsqueda:', url);

    return this.http.get<LyricsResponse>(url).pipe(
      retry(2),
      catchError((error: HttpErrorResponse) => {
        let errorMessage = '';
        if (error.status === 404) {
          errorMessage = 'No se encontró la canción. Verifica el nombre del artista y la canción.';
        } else if (error.status === 0) {
          errorMessage = 'No se puede conectar con el servidor. Verifica tu conexión a Internet.';
        } else {
          errorMessage = `Error del servidor: ${error.status}`;
        }
        console.error('Error en la petición:', errorMessage, error);
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  /**
   * Limpia las letras eliminando TODAS las líneas vacías
   */
  private cleanLyrics(lyrics: string): string {
    if (!lyrics) return '';
    
    return lyrics
      .replace(/\r\n/g, '\n')              // Normalizar saltos de línea Windows
      .replace(/\r/g, '\n')                 // Normalizar saltos de línea Mac
      .split('\n')                          // Dividir en líneas
      .map(line => line.trim())             // Quitar espacios de cada línea
      .filter(line => line.length > 0)      // ELIMINAR todas las líneas vacías
      .join('\n')                           // Unir con saltos simples
      .trim();                              // Limpiar inicio y final
  }

  /**
   * Obtiene las letras divididas en líneas para mostrar
   */
  getLyricsLines(): string[] {
    if (!this.lyrics) return [];
    return this.lyrics.split('\n');
  }

  private trySearchVariations(artist: string, title: string, variations: string[], index: number = 0): void {
    if (index >= variations.length) {
      this.isLoading = false;
      this.lyrics = '';
      this.errorMessage = 'No se encontró la canción. Verifica el nombre del artista y la canción.';
      return;
    }

    const currentTitle = variations[index];
    console.log(`Intento ${index + 1}/${variations.length}: "${currentTitle}"`);

    this.getLyrics(artist, currentTitle).subscribe({
      next: (response: LyricsResponse) => {
        this.isLoading = false;
        if (response && response.lyrics) {
          this.lyrics = this.cleanLyrics(response.lyrics); // Limpiar letras antes de mostrar
          this.errorMessage = '';
          console.log('✓ Búsqueda exitosa con:', currentTitle);
        } else {
          this.errorMessage = 'No se encontraron letras para esta canción.';
          this.lyrics = '';
        }
      },
      error: () => {
        // Intenta con la siguiente variación
        this.trySearchVariations(artist, title, variations, index + 1);
      }
    });
  }

  searchLyrics(): void {
    if (!this.artist.trim() || !this.title.trim()) {
      this.errorMessage = 'Por favor, ingresa el nombre del artista y la canción.';
      this.lyrics = '';
      this.searchAttempted = false;
      return;
    }

    this.errorMessage = '';
    this.lyrics = '';
    this.isLoading = true;
    this.searchAttempted = true;

    // Crear múltiples variaciones del título para intentar
    const variations: string[] = [];
    const originalTitle = this.title.trim();
    
    // 1. Título original
    variations.push(originalTitle);
    
    // 2. Con signos de exclamación al final (común en canciones)
    if (!originalTitle.endsWith('!')) {
      variations.push(originalTitle + '!');
    }
    
    // 3. Sin signos de puntuación
    const withoutPunctuation = originalTitle.replace(/[!?.,;:]/g, '').trim();
    if (withoutPunctuation !== originalTitle && !variations.includes(withoutPunctuation)) {
      variations.push(withoutPunctuation);
    }
    
    // 4. Con signos de interrogación (menos común pero posible)
    if (!originalTitle.endsWith('?')) {
      variations.push(originalTitle + '?');
    }
    
    // 5. Capitalización alternativa (primera letra mayúscula)
    const capitalized = originalTitle.charAt(0).toUpperCase() + originalTitle.slice(1).toLowerCase();
    if (capitalized !== originalTitle && !variations.includes(capitalized)) {
      variations.push(capitalized);
    }

    console.log('Variaciones a intentar:', variations);
    
    // Intentar todas las variaciones secuencialmente
    this.trySearchVariations(this.artist, this.title, variations);
  }

  clearSearch(): void {
    this.artist = '';
    this.title = '';
    this.lyrics = '';
    this.errorMessage = '';
    this.searchAttempted = false;
    this.isLoading = false;
  }
}