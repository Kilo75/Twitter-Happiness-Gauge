#!/bin/sh

export HOME="/www-data"
kill -9 `ps ax | grep node | grep -v grep | awk '{print $1}'`
