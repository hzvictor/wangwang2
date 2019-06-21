#!/bin/sh
pm2 start servers/systemserver/systemserver.js
pm2 start servers/centerserver/centerserver.js
pm2 start servers/farmserver/farmserver.js -i
pm2 start servers/gateway/gateway.js