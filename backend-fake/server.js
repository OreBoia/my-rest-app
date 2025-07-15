const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = 8080;

app.use(cors({
  origin: 'http://localhost:4200', // Permetti richieste dal frontend Angular
}));
app.use(bodyParser.json());

let users = [
  { id: 1, name: 'Mario Rossi', email: 'mario@prova.com' },
  { id: 2, name: 'Giulia Bianchi', email: 'giulia@prova.com' },
];

// GET lista utenti
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

app.delete('/api/users/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = users.findIndex(user => user.id === id)

  if(index !== -1)
    {
      const deleted = users.splice(index, 1)[0];
      res.json(deleted);
    }
    esle
    {
      res.status(404).json({error: 'User non trovato'})
    }
});

app.listen(port, () => {
  console.log(`Fake backend Node.js in ascolto su http://localhost:${port}`);
});


