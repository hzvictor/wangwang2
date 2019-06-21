/**
 * 农场服务器
 */
require("../../init.js");
var gameConfig = require("../gameconfig.js");
var network = require("../../framework/network/network.js");
var proto_man = require("../../framework/network/proto_man.js");
var service_manager = require("../../framework/network/service_manager.js");
var stype = require("../Stype.js");
var game_farm_service = require("./game_farm_service.js");
var redis_game = require("../../framework/database/redis_game.js");
var redis_center = require("../../framework/database/redis_center.js");
var mysql_game = require("../../framework/database/mysql_game.js");
var mysql_center = require("../../framework/database/mysql_center.js");

//链接中心redis数据库
var center_redis_db = gameConfig.center_redis;
redis_center.connect(center_redis_db.host, center_redis_db.port, center_redis_db.db_index);

//链接游戏redis数据库
var game_redis_db = gameConfig.game_redis;
redis_game.connect(game_redis_db.host, game_redis_db.port, game_redis_db.db_index);

//链接游戏数据库
var center_db = gameConfig.center_database;
mysql_game.connect(center_db.host, center_db.port, center_db.dbname, center_db.uname, center_db.upswd);

//链接中心数据库
var center_db = gameConfig.center_database;
mysql_center.connect(center_db.host, center_db.port, center_db.dbname, center_db.uname, center_db.upswd);


//配置房间服务器
var game_farm = gameConfig.game_farm_server;
network.start_tcp_server(game_farm.host,game_farm.port,false);

//注册服务
service_manager.register_service(stype.GameFarm,game_farm_service);
