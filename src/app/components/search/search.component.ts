import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SearchQuery } from '../../services/lyrics.service';

@Component({
  selector: 'app-search-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <form (ngSubmit)="onSubmit()">
      <legend>Busca por Artista y Canción</legend>
      
      <div class="form-grid">
        <div>
          <label>Artista</label>
          <input
            type="text"
            name="artista"
            placeholder="Nombre Artista"
            [(ngModel)]="busqueda.artista"
          />
        </div>
        <div>
          <label>Canción</label>
          <input
            type="text"
            name="cancion"
            placeholder="Nombre Canción"
            [(ngModel)]="busqueda.cancion"
          />
        </div>
        <input type="submit" value="Buscar" />
      </div>
    </form>
  `
})
export class SearchFormComponent {
  @Output() searchSubmit = new EventEmitter<SearchQuery>();
  @Output() validationError = new EventEmitter<string>();

  busqueda: SearchQuery = {
    artista: '',
    cancion: ''
  };

  onSubmit(): void {
    if (!this.busqueda.artista.trim() || !this.busqueda.cancion.trim()) {
      this.validationError.emit('Nombre de artista y canción requeridos');
      return;
    }
    
    this.searchSubmit.emit({ ...this.busqueda });
  }
}