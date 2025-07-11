import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError, Observable } from 'rxjs';
import { User } from './user.model'; // interfaccia User (id, name, email,ecc.)

@Injectable({
  providedIn: 'root'
})
export class UserService
{

  private http = inject(HttpClient); // ottiene istanza di HttpClient
  private apiUrl = 'http://localhost:8080/api/users'

   // GET: recupera lista di utenti
  getUsers(): Observable<User[]>{

    return this.http.get<User[]>(this.apiUrl).pipe(

      catchError(err => {
        console.error('Errore nel recupero utenti', err);
        // Propaga un errore generico utilizzando throwError
        return throwError(() => new Error('Errore nel recupero degli utenti'))
      })
    );
  }

  // POST: aggiunge un nuovo utente
  addUser(user: User): Observable<User> {

    return this.http.post<User>(this.apiUrl, user).pipe(

      catchError(err => {
        console.error('Errore nell’aggiunta utente', err);
        return throwError(() => new Error('Errore nell’aggiunta dell’utente.'));
      })
    );
  }

  removeUser(id: number): Observable<User>
  {
    return this.http.delete<User>(`${this.apiUrl}/${id}}`).pipe(
      catchError(err => {
        console.error('Errore nella cancellazione utente', err);
        return throwError(() => new Error('Errore nella cancellazione dell’utente.'));
      })
    );
  }
}
