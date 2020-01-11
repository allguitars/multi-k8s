const keys = require('./keys');

// Express App Setup
const express = require('express');
// const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Postgres Client Setup
const { Pool } = require('pg');
const pgClient = new Pool({
  user: keys.pgUser,
  host: keys.pgHost,
  database: keys.pgDatabase,
  password: keys.pgPassword,
  port: keys.pgPort
});
pgClient.on('error', () => console.log('Lost PG connection'));

pgClient.query('CREATE TABLE IF NOT EXISTS values (number INT)')
  .catch(err => console.log(err));

// Redis Client Setup
const redis = require('redis');
const redisClient = redis.createClient({
  host: keys.redisHost,
  port: keys.redisPort,
  retry_strategy: () => 1000
});

const redisPublisher = redisClient.duplicate();

// Express route handlers
app.get('/', (req, res) => {
  res.send('Hi');
});

// All indices that have ever been sent to the server
app.get('/values/all', async (req, res) => {
  const values = await pgClient.query('SELECT * FROM values');

  res.send(values.rows);
});

// All indices that alreay had the fib number as their pair
app.get('/values/current', async (req, res) => {
  redisClient.hgetall('values', (err, values) => {
    res.send(values);
  });
});

// When receiving a value/index from the front-end
app.post('/values', async (req, res) => {
  const index = req.body.index;

  if (parseInt(index) > 40) {
    return res.status(422).send('Index too high');
  }

  // When our server receives the index, the fib is not run yet
  redisClient.hset('values', index, 'Nothing yet!');

  // Trigger an event for the worker to calculate the fib number for that index
  // The worker will pull a value out of Redis and start calculating the fib
  redisPublisher.publish('insert', index);
  // Store the index to the PG
  pgClient.query('INSERT INTO values(number) VALUES($1)', [index]);

  res.send({ working: true });
});

app.listen(5000, err => {
  console.log('Listening');
}); 