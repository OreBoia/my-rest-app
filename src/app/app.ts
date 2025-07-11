import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { UsersComponent } from "./users-component/users-component";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, UsersComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected title = 'my-rest-app';
}
