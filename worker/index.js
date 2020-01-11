const keys = require('./keys');  // config for connecting to the Redis
const redis = require('redis');

const redisClient = redis.createClient({
  host: keys.redisHost,
  port: keys.redisPort,
  retry_strategy: () => 1000
});

const sub = redisClient.duplicate();

function fib(index) {
  if (index < 2) return 1;
  return fib(index - 1) + fib(index - 2);
}

// message stands for the index being added to the Redis, and the index will be the key.
// Call fib() to calculate the value for that key
sub.on('message', (channel, message) => {
  redisClient.hset('values', message, fib(parseInt(message)));
});
// Subscribe to the event that anytime someone inserts a new value into Redis 
sub.subscribe('insert');