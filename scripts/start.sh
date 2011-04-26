#!/bin/sh

export HOME="/www-data"
exec   /opt/node/bin/node /var/www/tw3/server.js >> /var/log/node.log 2>&1 &
