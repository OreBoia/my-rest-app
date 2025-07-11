// user.model.ts
export interface User {
  id?: number;      // opzionale (potrebbe non esserci quando crei un nuovo utente)
  name: string;
  email: string;
}
