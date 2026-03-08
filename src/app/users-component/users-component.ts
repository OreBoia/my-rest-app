import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UserService } from '../user-service';
import { User } from '../user.model';

@Component({
  standalone: true,
  selector: 'app-users',
  imports: [FormsModule],
  templateUrl: './users-component.html',
  styleUrl: './users-component.css'
})
export class UsersComponent
{
  userService = inject(UserService);
  
  users = signal<User[]>([]);
  newUser: User = {id: 0, name: '', email: ''};
  userIdToRemove = 0;

  constructor()
  {
    // Recupera la lista utenti all'inizializzazione del componente
    this.userService.getUsers().subscribe({
      next: (data) => this.users.set(data),
      error: (err) => console.error('Errore caricamento utenti', err)
    });
  }

  addUser()
  {
    // Invoca il servizio per aggiungere un nuovo utente
    this.userService.addUser(this.newUser).subscribe({
      next: (savedUser) =>
        {
          this.users.update(list => [...list, savedUser]);
          this.newUser = {id: 0, name: '', email: ''};
        },
      error: (err) => console.error('Errore aggiunta utente', err)
    });
  }

  removeUser(id: number)
  {
    this.userService.removeUser(id).subscribe({
      next: () => this.users.update(list => list.filter(user => user.id !== id)),
      error: err => alert(err.message)
    });
  }
}
