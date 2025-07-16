# Utilizzo delle API REST in Angular 20 con Standalone API

Angular 20 adotta il moderno paradigma standalone (introdotto in Angular 14), che permette di creare componenti e servizi senza utilizzare i classici NgModule . In questa guida vedremo come configurare un’app Angular 20 per consumare API REST in stile standalone, includendo:

- Configurazione dell’HttpClient in `main.ts` con `provideHttpClient` .
- Creazione di un servizio per chiamate REST usando `inject(HttpClient)` invece del - costruttore.
- Un componente standalone che utilizza il servizio (con `inject()` ) per mostrare una lista di utenti e aggiungerne di nuovi.
- Gestione degli errori HTTP con gli operatori RxJS `catchError` e `throwError` .
- Esempi pratici di chiamate GET e POST.
- Una sezione finale sull’integrazione con un backend Node.js (modello `User`, controller REST, configurazione CORS e flusso completo di interazione).

## Configurazione di HttpClient in Angular 20 (provideHttpClient)

In Angular 20 (standalone), il modulo `HttpClientModule` non è più necessario ed è stato sostituito dalla
funzione di provider `provideHttpClient()`. Questa funzione registra il servizio `HttpClient` nell’applicazione, rendendolo disponibile per l’iniezione.

Nel file `main.ts` della tua applicazione, utilizza `bootstrapApplication` (fornito da Angular a partire
dalla versione 14) per avviare l’app senza NgModule, e passa `provideHttpClient()` tra i provider. In
questo modo HttpClient sarà disponibile globalmente. Ecco un esempio di `app.config.ts`:

```typescript
import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient()
  ]
};
```

Nel codice sopra, `provideHttpClient()` configura il servizio `HttpClient` affinché sia disponibile per l’injection in tutta l’applicazione . In Angular  18+ questo approccio è preferito all’importazione di
`HttpClientModule` , che è deprecato. Se stessimo usando ancora un approccio basato su NgModule, potremmo inserire `provideHttpClient()` nell’array `providers` di AppModule, ma nel caso di bootstrap standalone lo passiamo direttamente a `appConfig: ApplicationConfig`.

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

Nel codice sopra, `UserService` è annotato con`@Injectable({ providedIn: 'root' })` così che
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

## Esempio di backend REST con Node.js e Express

### 1. Crea una cartella per il backend

Apri una cartella (es: backend-test) e aprila in VS Code o terminale.

### 2. Inizializza un progetto Node.js

Nel terminale, esegui il comando per inizializzare un progetto Node.js:

```bash
npm init -y
```

Questo crea un file package.json.

### 3. Installa Express

```bash
npm install express cors
```

- **Express**: per creare l’API.

- **CORS**: per permettere richieste da Angular.

### 4. Crea il file server.js

Crea un file chiamato server.js nella cartella.

Esempio di backend minimale con una rotta GET e una POST su /api/users:

```javascript
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

let users = [
  { id: 1, name: 'Mario Rossi' },
  { id: 2, name: 'Luigi Bianchi' }
];

// GET tutti gli utenti
app.get('/api/users', (req, res) => {
  res.json(users);
});

// POST aggiungi utente
app.post('/api/users', (req, res) => {
  const newUser = req.body;
  newUser.id = users.length ? Math.max(...users.map(u => u.id)) + 1 : 1;
  users.push(newUser);
  res.json(newUser);
});

// DELETE elimina utente per id
app.delete('/api/users/:id', (req, res) => {
  const id = parseInt(req.params.id);
  users = users.filter(u => u.id !== id);
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Server attivo su http://localhost:${PORT}`);
});

```

### 5. Avvia il server

Nel terminale:

```bash
node server.js
```

### Guida ai Metodi di Routing in Express (`IRouterMatcher`)

In Express, il "routing" definisce come l'applicazione risponde a una richiesta del client verso un particolare endpoint, che è una combinazione di un URI (o percorso) e un metodo di richiesta HTTP (GET, POST, ecc.). I metodi come `app.get()`, `app.post()` sono implementazioni di `IRouterMatcher`, che consentono di associare una funzione (handler) a una rotta specifica.

Ecco una panoramica dei metodi di routing più comuni con esempi.

#### 1. `app.get(path, handler)`

Risponde alle richieste HTTP GET. Viene usato per recuperare dati.

```javascript
// GET: Recupera una lista di risorse
app.get('/api/items', (req, res) => {
  res.json([{ id: 1, name: 'Item 1' }]);
});

// GET: Recupera una singola risorsa usando un parametro di rotta
app.get('/api/items/:id', (req, res) => {
  const itemId = req.params.id;
  res.send(`Dettagli per l'item con ID: ${itemId}`);
});
```

#### 2. `app.post(path, handler)`

Risponde alle richieste HTTP POST. Viene usato per creare una nuova risorsa. I dati inviati dal client sono disponibili in `req.body` (richiede il middleware `express.json()`).

```javascript
// POST: Crea un nuovo item
app.post('/api/items', (req, res) => {
  const newItem = req.body;
  console.log('Nuovo item ricevuto:', newItem);
  res.status(201).json({ id: 2, ...newItem });
});
```

#### 3. `app.put(path, handler)`

Risponde alle richieste HTTP PUT. Viene usato per aggiornare completamente una risorsa esistente.

```javascript
// PUT: Aggiorna un item esistente
app.put('/api/items/:id', (req, res) => {
  const itemId = req.params.id;
  const updatedData = req.body;
  console.log(`Aggiornamento completo per l'item ${itemId} con`, updatedData);
  res.send(`Item ${itemId} aggiornato.`);
});
```

#### 4. `app.delete(path, handler)`

Risponde alle richieste HTTP DELETE. Viene usato per eliminare una risorsa.

```javascript
// DELETE: Elimina un item
app.delete('/api/items/:id', (req, res) => {
  const itemId = req.params.id;
  console.log(`Eliminazione dell'item ${itemId}`);
  res.status(204).send(); // 204 No Content è una risposta comune per DELETE
});
```

#### 5. `app.patch(path, handler)`

Risponde alle richieste HTTP PATCH. Viene usato per aggiornare parzialmente una risorsa. A differenza di PUT, non è necessario inviare l'intero oggetto.

```javascript
// PATCH: Aggiorna parzialmente un item
app.patch('/api/items/:id', (req, res) => {
  const itemId = req.params.id;
  const partialData = req.body;
  console.log(`Aggiornamento parziale per l'item ${itemId} con`, partialData);
  res.send(`Item ${itemId} aggiornato parzialmente.`);
});
```

#### 6. `app.all(path, handler)`

Questo metodo speciale risponde a **tutti** i metodi HTTP per un percorso specifico. È utile per applicare logica comune a una rotta, come l'autenticazione o il logging, prima di passare il controllo ad altri handler specifici.

```javascript
// ALL: Esegue questa funzione per qualsiasi metodo HTTP su /api/secret
app.all('/api/secret', (req, res, next) => {
  console.log(`Accesso alla rotta segreta con metodo ${req.method}`);
  // Qui si potrebbe inserire un controllo di autenticazione
  next(); // Passa il controllo all'handler successivo
});

app.get('/api/secret', (req, res) => {
  res.send('Questo è un segreto!');
});
```

#### 7. `app.route(path)`

Fornisce un modo per creare gestori di rotta concatenabili per un singolo percorso. Questo aiuta a mantenere il codice pulito e organizzato, evitando la duplicazione del percorso.

```javascript
// Gestione concatenata per la rotta /api/documents/123
app.route('/api/documents/:id')
  .get((req, res) => {
    res.send(`Recupera documento con ID: ${req.params.id}`);
  })
  .put((req, res) => {
    res.send(`Aggiorna documento con ID: ${req.params.id}`);
  })
  .delete((req, res) => {
    res.send(`Elimina documento con ID: ${req.params.id}`);
  });
```

---

## Applicativo Task Manager

## Connessione tra backend Node.js e server MySQL

## 1. Installazione dipendenze

Dentro la cartella del tuo backend Node.js:

```bash
npm install mysql2 express cors body-parser
```

mysql2 è una libreria moderna e performante per connettersi a MySQL.

## 2. Crea una connessione al database

Puoi usare connessione singola oppure pool di connessioni (consigliato).
Esempio con pool:

```javascript
const mysql = require('mysql2');

// Crea il pool di connessioni
const pool = mysql.createPool({
  host: 'localhost',    // il tuo host MySQL
  port: 3306,          // la porta MySQL
  user: 'root',         // il tuo utente MySQL
  password: 'root', // la tua password MySQL
  database: 'todo_db'   // il database che userai
});

// Trasforma in promise per usare async/await
const db = pool.promise();

module.exports = db;
```

Salva questo in un file db.js

## 3. Prepara il database

```sql
CREATE DATABASE todo_db;

USE todo_db;

CREATE TABLE tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT false
);

```

## 4. Usa il database nel server Express

```javascript
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./db'); // importa la connessione

const app = express();
const port = 8080;

app.use(cors({ origin: 'http://localhost:4200' }));
app.use(bodyParser.json());

// GET tutti i task
app.get('/api/tasks', async (req, res) => {
  try {
    console.log('Tentativo di recupero tasks...');
    const [rows] = await db.query('SELECT * FROM tasks');
    console.log('Tasks recuperate:', rows);
    res.json(rows);
  } catch (error) {
    console.error('Errore GET tasks - Dettagli completi:', error);
    console.error('Errore message:', error.message);
    console.error('Errore code:', error.code);
    res.status(500).json({ error: 'Errore nel recupero tasks' });
  }
});

// POST aggiungi nuovo task
app.post('/api/tasks', async (req, res) => {
  const { title, description } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO tasks (title, description, completed) VALUES (?, ?, ?)',
      [title, description, false]
    );
    const newTask = { id: result.insertId, title, description, completed: false };
    res.json(newTask);
  } catch (error) {
    console.error('Errore POST task', error);
    res.status(500).json({ error: 'Errore creazione task' });
  }
});

// PATCH toggle completato
app.patch('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Toggle stato
    await db.query('UPDATE tasks SET completed = NOT completed WHERE id = ?', [id]);
    const [rows] = await db.query('SELECT * FROM tasks WHERE id = ?', [id]);
    res.json(rows[0]);
  } catch (error) {
    console.error('Errore PATCH task', error);
    res.status(500).json({ error: 'Errore toggle task' });
  }
});

// DELETE elimina task
app.delete('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM tasks WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Errore DELETE task', error);
    res.status(500).json({ error: 'Errore eliminazione task' });
  }
});

app.listen(port, () => {
  console.log(`Server Express + MySQL su http://localhost:${port}`);
});

```

## Service Angular per gestire le Task

Crea un file `task.service.ts`:

```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';

export interface Task {
  id: number;
  title: string;
  description: string;
  completed: boolean;
}

@Injectable({ providedIn: 'root' })
export class TaskService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/tasks';

  // Recupera tutte le task
  getTasks(): Observable<Task[]> {
    return this.http.get<Task[]>(this.apiUrl).pipe(
      catchError(err => {
        console.error('Errore recupero tasks', err);
        return throwError(() => new Error('Errore nel recupero delle tasks.'));
      })
    );
  }

  // Inserisce una nuova task
  addTask(task: Omit<Task, 'id' | 'completed'>): Observable<Task> {
    return this.http.post<Task>(this.apiUrl, task).pipe(
      catchError(err => {
        console.error('Errore inserimento task', err);
        return throwError(() => new Error('Errore nell\'inserimento della task.'));
      })
    );
  }
}
```

---

## Component Standalone per inserire una Task

Crea un file `add-task.component.ts`:

```typescript
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskService, Task } from '../task-service';

@Component({
  standalone: true,
  selector: 'app-add-task',
  imports: [CommonModule, FormsModule],
  template: `
    <h3>Aggiungi Nuova Task</h3>
    <form (ngSubmit)="addTask()">
      <input [(ngModel)]="title" name="title" placeholder="Titolo" required />
      <input [(ngModel)]="description" name="description" placeholder="Descrizione" required />
      <button type="submit">Aggiungi Task</button>
    </form>
    <div *ngIf="errorMsg" style="color:red">{{ errorMsg }}</div>
    <ul>
      <li *ngFor="let task of tasks">
        {{ task.title }} - {{ task.description }} [{{ task.completed ? 'Completata' : 'Da fare' }}]
      </li>
    </ul>
  `
})
export class AddTaskComponent {
  private taskService = inject(TaskService);
  title = '';
  description = '';
  tasks: Task[] = [];
  errorMsg = '';

  constructor() {
    this.loadTasks();
  }

  loadTasks() {
    this.taskService.getTasks().subscribe({
      next: tasks => this.tasks = tasks,
      error: err => this.errorMsg = err.message
    });
  }

  addTask() {
    if (!this.title.trim() || !this.description.trim()) return;
    this.taskService.addTask({ title: this.title, description: this.description }).subscribe({
      next: task => {
        this.tasks.push(task);
        this.title = '';
        this.description = '';
        this.errorMsg = '';
      },
      error: err => this.errorMsg = err.message
    });
  }
}

```

---

## 🎯 Esercizio Completo: Sistema di Gestione Biblioteca (Library Management System)

### Obiettivo dell'Esercizio

Creare un'applicazione completa che integri:

- **Frontend Angular 20 standalone** con HttpClient
- **Backend Node.js/Express** con database MySQL
- **Operazioni CRUD complete** (Create, Read, Update, Delete)
- **Gestione errori** con RxJS
- **Interfaccia utente interattiva**

### 📋 Scenario

Gestire una biblioteca digitale dove è possibile:

- Visualizzare tutti i libri
- Aggiungere nuovi libri
- Modificare lo stato di disponibilità
- Eliminare libri
- Cercare libri per titolo o autore

---
