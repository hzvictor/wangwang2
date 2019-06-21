/**
 * 中心服务器
 */
require("../../init.js");
var gameConfig = require("../gameconfig.js");
var network = require("../../framework/network/network.js");
var proto_man = require("../../framework/network/proto_man.js");
var service_manager = require("../../framework/network/service_manager.js");
var auth_service = require("./auth_service.js");
var stype = require("../Stype.js");
var mysql_game = require("../../framework/database/mysql_game.js");
var mysql_center = require("../../framework/database/mysql_center.js");
var redis_center = require("../../framework/database/redis_center.js");
//配置中心服务器参数
var center = gameConfig.center_server;
network.start_tcp_server(center.host,center.port,false);

//注册服务
service_manager.register_service(stype.Auth,auth_service);

//链接中心数据库
var center_db = gameConfig.center_database;
mysql_center.connect(center_db.host, center_db.port, center_db.dbname, center_db.uname, center_db.upswd);

//链接游戏数据库
var center_db = gameConfig.center_database;
mysql_game.connect(center_db.host, center_db.port, center_db.dbname, center_db.uname, center_db.upswd);

//链接中心redis数据库
var center_redis_db = gameConfig.center_redis;
redis_center.connect(center_redis_db.host, center_redis_db.port, center_redis_db.db_index);