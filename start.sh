#!/bin/sh

# Start the first process on port 3001
PORT=3001 npx ts-node index.ts &

# Start the second process on port 3002
PORT=3002 npx ts-node server.ts &

# Start nginx
nginx -c $PWD/nginx.conf
