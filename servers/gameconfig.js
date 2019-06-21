/**
 *  
 */
var stype = require("./Stype.js");

var gameconfig = {
    //网关服务器
    gatawayConfig :{
        host: "0.0.0.0",
        ports: [10003,443],
    },
    //web服务器
    webserver: {
		host: "47.104.218.169",
		port: 10002,
	},
	//中心服务器
    center_server:{
        host:"127.0.0.1",
        port:10005,
        stypes: [stype.Auth],
    },
    //系统服务器
    game_system_server:{
        host:"127.0.0.1",
        port:10006,
        stypes: [stype.GameSystem],
    },
    //农场服务器
    game_farm_server:{
        host:"127.0.0.1",
        port:10007,
        stypes: [stype.GameFarm],
    },

    //中心数据库  //游戏数据库  暂时用的同一个
    center_database:{
        host:"47.104.218.169",
        port: 3306,
        dbname:"SeasonsGarden",
        uname:"SeasonsGarden",
        upswd:"e94a12b430a8ac4c",
    },

    //redis中心数据库
    center_redis:{
        host:"127.0.0.1",
        port: 6379,
        db_index: 0,
    },

    //redis游戏数据库
    game_redis:{
        host:"127.0.0.1",
        port: 6379,
        db_index: 1,
    },


    //游戏服务器
    gw_gameServer: {
        0: {
            stype: stype.Auth,
            host: "127.0.0.1",
            port: 10005,
        },

        1:{
            stype: stype.GameSystem,
            host: "127.0.0.1",
            port: 10006,
        },

        2:{
            stype: stype.GameFarm,
            host: "127.0.0.1",
            port: 10007,
        },

    },
};

module.exports = gameconfig;