/**
 * 网关服务器
 */
require("../../init.js");
var gameConfig = require("../gameconfig.js");
var network = require("../../framework/network/network.js");
var proto_man = require("../../framework/network/proto_man.js");
var service_manager = require("../../framework/network/service_manager.js");
var gw_server = require("./gw_server.js");
var Stype = require("../Stype.js");
var bc_service = require("./bc_service.js");

var host = gameConfig.gatawayConfig.host;
var ports = gameConfig.gatawayConfig.ports;

network.start_tcp_server(host, ports[0],true);
network.start_ws_server(host, ports[1], true);

service_manager.register_service(Stype.Broadcast,bc_service);//注册广播服务

//链接服务器
var gameserver = gameConfig.gw_gameServer;
//遍历服务器列表
for(var key in gameserver){
    //链接服务器
    network.connect_tcp_server(gameserver[key].stype,gameserver[key].host,gameserver[key].port,false);

    service_manager.register_service(gameserver[key].stype,gw_server);
}
