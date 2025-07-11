import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../user-service';
import { User } from '../user.model';

@Component({
  standalone: true,
  selector: 'app-users',
  imports: [CommonModule, FormsModule],
  templateUrl: './users-component.html',
  styleUrl: './users-component.css'
})
export class UsersComponent
{
  private userService = inject(UserService)
  users: User[] = [];
  newUser: User = {id: 0, name: '', email: ''};

  userIdToRemove: number = 0;

  constructor()
  {
    // Recupera la lista utenti all'inizializzazione del componente
    this.userService.getUsers().subscribe({
      next: (data) =>
        {
          this.users = data;
        },
      error: (err) => {
        console.error('Errore caricamento utenti', err)
        // Qui si potrebbe impostare un messaggio di errore per la UI
      }
    })
  }

  addUser()
  {
    // Invoca il servizio per aggiungere un nuovo utente
    this.userService.addUser(this.newUser).subscribe({
      next: (savedUser) =>
        {
          this.users.push(savedUser)
          this.newUser = {id: 0, name: '', email: ''};
        },
      error: (err) =>
        {
          console.error('Errore aggiunta utente', err);
        }
    })
  }

  removeUser(id: number)
  {
    this.userService.removeUser(id).subscribe({
      next: deleted => this.users = this.users.filter(user => user.id !== id),
      error: err => alert(err.message)
    });
  }
}
