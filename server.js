const express = require('express');
const app = express();
const pg = require('pg');
const client = new pg.Client(process.env.DATABASE_URL || 'postgres://localhost/acme_auth_db');
const jwt = require('jsonwebtoken');

const isLoggedIn = async(req, res, next)=> {
  try {
    const token = req.headers.authorization;
    if(!token){
      throw 'noooooo';
    }
    const payload = jwt.verify(token, process.env.JWT);
    const id = payload.id;
    const response = await client.query(`
      SELECT *
      FROM users
      WHERE id = $1
    `, [id]);
    const user = response.rows[0];
    req.user = user;
    next();
  }
  catch(ex){
    const error = new Error('not authorized');
    error.status = 401;
    next(error);
  }
};

app.get('/secret', isLoggedIn, async(req, res, next)=> {
  try {
    res.send(req.user);
  }
  catch(ex){
    next(ex);
  }
});

app.get('/secret2', isLoggedIn, async(req, res, next)=> {
  try {
    res.send(req.user);
  }
  catch(ex){
    next(ex);
  }
});

app.use((err, req, res, next)=> {
  res.status(err.status || 500).send({ error: err.message });
});

const port = process.env.PORT || 3000;

app.listen(port, async()=> {
  try {
    await client.connect();
    const SQL = `
      DROP TABLE IF EXISTS users;
      CREATE TABLE users(
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL
      );
      INSERT INTO users(name) VALUES('moe');
      INSERT INTO users(name) VALUES('larry');
      INSERT INTO users(name) VALUES('lucy');
      INSERT INTO users(name) VALUES('ethyl');
    `;

    await client.query(SQL);
    const token = jwt.sign({ id: 2 }, process.env.JWT);
    console.log(token);
    console.log(`listening on port ${port}`);
  }
  catch(ex){
    console.log(ex);
  }
});
