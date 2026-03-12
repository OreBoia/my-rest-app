import { Component, inject, signal, OnInit } from '@angular/core';
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
export class UsersComponent implements OnInit
{
  userService = inject(UserService);

  users = signal<User[]>([]);

  newUser: User = {id: 0, name: '', email: ''};

  userIdToRemove = 0;

  ngOnInit(): void {
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
          //...list è l'operatore spread (diffusione) di JavaScript/TypeScript.
          //crea un nuovo array che contiene tutti gli elementi di list seguiti da savedUser.
          this.users.update(list => [...list, savedUser]);
          this.newUser = {id: 0, name: '', email: ''};
        },
      error: (err) => console.error('Errore aggiunta utente', err)
    });
  }

  removeUser(id: number)
  {
    this.userService.removeUser(id).subscribe({
      next: (deletedUser) => {
        this.users.update(list => list.filter(user => user.id !== id))
        console.log(deletedUser)
      },
      error: err => alert(err.message)
    });
  }
}
