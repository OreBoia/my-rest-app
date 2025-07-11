# Utilizzo delle API REST in Angular 20 con Standalone API

Angular 20 adotta il moderno paradigma standalone (introdotto in Angular 14), che permette di creare componenti e servizi senza utilizzare i classici NgModule . In questa guida vedremo come configurare un’app Angular 20 per consumare API REST in stile standalone, includendo:

- Configurazione dell’HttpClient in `main.ts` con `provideHttpClient` .
- Creazione di un servizio per chiamate REST usando `inject(HttpClient)` invece del - costruttore.
- Un componente standalone che utilizza il servizio (con `inject()` ) per mostrare una lista di utenti e aggiungerne di nuovi.
- Gestione degli errori HTTP con gli operatori RxJS `catchError` e `throwError` .
- Esempi pratici di chiamate GET e POST.
- Una sezione finale sull’integrazione con un backend Spring Boot (modello `User` , repository JPA, controller REST, configurazione CORS e flusso completo di interazione).

## Configurazione di HttpClient in Angular 20 (provideHttpClient)

In Angular 20 (standalone), il modulo `HttpClientModule` non è più necessario ed è stato sostituito dalla
funzione di provider `provideHttpClient()`. Questa funzione registra il servizio `HttpClient` nell’applicazione, rendendolo disponibile per l’iniezione.

Nel file `main.ts` della tua applicazione, utilizza `bootstrapApplication` (fornito da Angular a partire
dalla versione 14) per avviare l’app senza NgModule, e passa `provideHttpClient()` tra i provider. In
questo modo HttpClient sarà disponibile globalmente. Ecco un esempio di `main.ts`:

```typescript
import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { AppComponent } from './app.component'; // componente root standalone

bootstrapApplication(AppComponent, {
    providers: [
      provideHttpClient()
    ]
});
```

Nel codice sopra, `provideHttpClient()` configura il servizio `HttpClient` affinché sia disponibile per l’injection in tutta l’applicazione . In Angular  18+ questo approccio è preferito all’importazione di
`HttpClientModule` , che è deprecato. Se stessimo usando ancora un approccio basato su NgModule, potremmo inserire `provideHttpClient()` nell’array `providers` di AppModule, ma nel caso di bootstrap standalone lo passiamo direttamente a `bootstrapApplication`.

>**Nota**: È possibile estendere `provideHttpClient()` con opzioni aggiuntive (ad esempio `withInterceptors` , `withFetch` , ecc.) per configurare il comportamento del client HTTP, ma per scopi di questa guida useremo la configurazione base

## Creazione di un servizio REST con HttpClient e inject()

Con HttpClient disponibile, creiamo un servizio Angular che gestisca le chiamate REST verso un backend (ad
esempio per la risorsa “User”). In Angular 20 possiamo usare la funzione `inject()` per ottenere le
dipendenze all’interno della classe, invece di dichiararle nel costruttore. Ciò rende il codice più flessibile, soprattutto nei contesti standalone o in funzioni. Ad esempio, Angular consente di definire un service così:

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError, Observable } from 'rxjs';
import { User } from './user.model'; // interfaccia User (id, name, email,ecc.)

@Injectable({ providedIn: 'root' })
export class UserService 
{

  private http = inject(HttpClient); // ottiene istanza di HttpClient
  private apiUrl = 'http://localhost:8080/api/users';

  // GET: recupera lista di utenti
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl).pipe(
      
      catchError(err => {
        console.error('Errore nel recupero utenti', err);
        // Propaga un errore generico utilizzando throwError
        return throwError(() => new Error('Errore nel recupero degli utenti.'));
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
}

```

Nel codice sopra, `UserService` è annotato con` @Injectable({ providedIn: 'root' })` così che
sia un singleton disponibile in tutta l’app. All’interno, usiamo `private http = inject(HttpClient)`
per ottenere l’istanza di HttpClient senza passarlo dal costruttore. Questo pattern è pienamente supportato
da Angular e rende il codice più conciso. Abbiamo definito due metodi:

- `getUsers()` esegue una richiesta GET verso l’endpoint /api/users del backend e restituisce un
`Observable<User[]>` . Utilizziamo `this.http.get<T>()` dove `<T>` è il tipo atteso (array di
`User` ).
- `addUser(user)` esegue una POST verso lo stesso endpoint per salvare un nuovo utente, inviando
l’oggetto utente nel body della richiesta (in formato JSON). Restituisce un `Observable<User>`
(tipicamente l’utente creato ritornato dal server con un ID assegnato).

Entrambi i metodi utilizzano `pipe(catchError(...))` per gestire eventuali errori HTTP. In caso di
errore, si logga il problema su console e si utilizza `throwError` di RxJS per propagare un errore al
componente chiamante. In questo modo evitiamo di restituire dati incompleti e lasciamo che il componente
decida come reagire all’errore (ad esempio mostrando un messaggio all’utente).

## Gestione degli errori HTTP con RxJS ( catchError e throwError )

La gestione degli errori nelle chiamate HTTP è fondamentale. Angular, attraverso RxJS, ci permette di
intercettare gli errori nelle chiamate HttpClient usando l’operatore catchError. Come indicato dalla
documentazione, **il modo di base per gestire gli errori in Angular è utilizzare il servizio HttpClient
insieme agli operatori RxJS** `throwError` e `catchError` .

Vediamo come funziona in pratica riferendoci al metodo `getUsers()` definito sopra. Usando
`catchError` , possiamo catturare l’eccezione (ad esempio un errore di rete o una risposta con status di
errore) e trasformarla in un nuovo flusso. Qui abbiamo scelto di utilizzare `throwError` per rilanciare un
errore sotto forma di `Observable` che emette un errore. In questo modo, il `subscribe` sul metodo può
gestire l’errore attraverso la callback di errore. In alternativa, all’interno di `catchError` si potrebbe anche restituire un valore di fallback (ad esempio un array vuoto `of([])` ) per evitare di interrompere lo stream, ma in generale è buona pratica notificare il fallimento in modo da poter avvisare l’utente o intraprendere azioni correttive.

In breve:

- `catchError` intercetta qualsiasi errore emesso dall’Observable precedente (nel nostro caso la chiamata HTTP) e ci permette di eseguire logica di gestione. Riceve come parametro la funzione che elabora l’errore.
- `throwError` crea un nuovo `Observable` che emette immediatamente un errore. Lo usiamo dentro `catchError` per propagare l’errore dopo aver eventualmente fatto delle operazioni (log, trasformazione dell’errore, ecc.).

Ad esempio, nel `UserService` sopra, se la GET degli utenti fallisce (es. server non raggiungibile, errore
500, ecc.), `catchError` logga l’errore e ritorna `throwError(() => new Error('Errore nel
recupero degli utenti.'))` . Questo farà sì che il subscriber riceva l’errore e possa gestirlo (magari
mostrando un messaggio “Impossibile caricare utenti” nell’interfaccia). Analogamente per la POST.

>**Nota**: `throwError` accetta una funzione che produce l’errore (sintassi introdotta in RxJS 7+), da usare al posto di `throwError(err)` obsoleto. Questo pattern è quello raccomandato per la gestione degli errori nelle chiamate HTTP in Angular, come confermato da varie risorse.

## Componente standalone per visualizzare e aggiungere utenti

Ora creiamo un componente Angular standalone che utilizza il nostro `UserService` per mostrare la lista
degli utenti e aggiungerne un nuovo. Essendo standalone, il componente non fa parte di alcun NgModule e
dichiara direttamente le dipendenze che utilizza.

Immaginiamo un componente chiamato `UsersComponent`. Questo componente dovrà usare direttive
come `*ngFor` e `ngModel` , quindi importeremo i moduli necessari ( `CommonModule` per le direttive
strutturali e `FormsModule` per il two-way binding negli input). Inoltre, inietterà il servizio `UserService` tramite la funzione `inject()`. Vediamo il codice:

```typescript
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from './user.service';
import { User } from './user.model';
@Component({
 standalone: true,
 selector: 'app-users',
 imports: [CommonModule, FormsModule],
 template: `
   <h2>Lista Utenti</h2>
    <ul>
     <li *ngFor="let user of users">
      {{ user.name }} ({{ user.email }})
     </li>
    </ul>

  <h3>Aggiungi Utente</h3>
  <form (ngSubmit)="addUser()">
    <input [(ngModel)]="newUser.name" name="name" placeholder="Nome" required />
    <input [(ngModel)]="newUser.email" name="email" placeholder="Email" required />
    <button type="submit">Aggiungi</button>
  </form>`
})

export class UsersComponent {
  private userService = inject(UserService); // inject del servizio UserService
    users: User[] = [];
    newUser: User = { id: 0, name: '', email: '' };
    
    constructor() {
      // Recupera la lista utenti all'inizializzazione del componente
      this.userService.getUsers().subscribe({
        next: (data) => {
          this.users = data;
        },
        error: (err) => {
          console.error('Errore caricamento utenti', err);
          // Qui si potrebbe impostare un messaggio di errore per la UI
        }
      });
   }

addUser() {
  // Invoca il servizio per aggiungere un nuovo utente
  this.userService.addUser(this.newUser).subscribe({
    next: (savedUser) => {
      this.users.push(savedUser); // aggiunge l’utente salvato in lista
      this.newUser = { id: 0, name: '', email: '' }; // reset campi form
    },
    error: (err) => {
      console.error('Errore aggiunta utente', err);
      // Qui si potrebbe gestire l'errore, ad es. mostrando un messaggio
   }
  });
 }
}

```

Analizziamo il componente:

- È annotato con `@Component({ standalone: true, ... })` : questo lo dichiara standalone.
Importa esplicitamente `CommonModule` (necessario per utilizzare `*ngFor` , `*ngIf` etc.) e
`FormsModule` (necessario per utilizzare `ngModel` negli input per il two-way data binding).
- Utilizziamo `inject(UserService)` per ottenere l’istanza del servizio utenti. Questo avviene **fuori**
dal costruttore, inizializzando il campo `userService` . In Angular 20 possiamo farlo
tranquillamente perché il componente è in esecuzione in un contesto di iniezione valido (il
costruttore sarebbe equivalente, ma `inject()` rende il codice riutilizzabile in contesti non classici).
- Nel template, usiamo `*ngFor` per iterare sulla lista `users` e mostrare nome ed email di ciascun
utente.
- Sempre nel template c’è un semplice form con due campi (nome ed email) e un bottone per
aggiungere un nuovo utente. I campi utilizzano `[(ngModel)]` per legare i valori all’oggetto
newUser nel componente.
- Nel costruttore del componente, appena creato, richiamiamo
`this.userService.getUsers().subscribe(...)` per recuperare subito la lista utenti dal
server e assegnarla alla variabile locale `users`. Gestiamo anche l’eventuale errore nel subscribe
loggandolo (in una situazione reale potremmo mostrare un messaggio all’utente).
- Il metodo `addUser()` viene invocato al submit del form (vedi `(ngSubmit)="addUser()"` nel
template). Questo chiama `userService.addUser(this.newUser)` per inviare la richiesta POST.
Nel subscribe, se arriva la risposta positiva ( `next` ), aggiungiamo l’utente restituito all’array `users`
così che compaia subito in lista, e resettiamo l’oggetto `newUser` per svuotare il form. In caso di
errore, logghiamo l’errore (anche qui, potremmo gestirlo mostrando un feedback all’utente).

>**Nota**: in un’app reale, potresti voler utilizzare l’`async` pipe nel template al posto di sottoscrivere
manualmente agli observable. Ad esempio, `users$ = this.userService.getUsers()` come proprietà
`Observable` e poi nel template `<li *ngFor="let user of users$ | async"> ...` . Per semplicità
qui abbiamo usato subscribe direttamente nel costruttore.

Affinché questo componente funzioni nell’app, assicurati di utilizzarlo. Se UsersComponent è il
componente principale (bootstrap), allora nel `main.ts` bootstrapApplication punterai a questo. In
alternativa, potresti avere un `AppComponent` che funge da shell dell’app e include `<app-users></appusers>` nel suo template (ricordando di dichiarare UsersComponent tra le sue `imports` se `AppComponent` è standalone).

