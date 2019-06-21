/*
	redis 游戏系统数据库
*/

var redis = require("redis");
var util = require("util");
var utils = require("../utils/utils.js");
var Respones = require("../../servers/Respones.js");
var log = require("../log/log.js");

var game_redis = null;

function connect_to_redis(host,port,db_index){
	game_redis = redis.createClient({
		host: host,
		port: port,
		db: db_index,
	});

	game_redis.on("error",function(err){
		log.error(err);
	});
}

//保存单个玩家排行榜信息
function save_ugame_rank_info(uuid,uinfo){

	if (game_redis == null){
		return;
	}
	var key = "garden_rank_uuid_" + uuid;
	uinfo.uuid = uinfo.uuid.toString();
	uinfo.usex = uinfo.usex.toString();
	//uinfo.unick = uinfo.unick;
	//uinfo.uface = uinfo.uface;
	uinfo.uvip = uinfo.uvip.toString();
	uinfo.ulevel =uinfo.ulevel.toString();
	//uinfo.openid = uinfo.openid;
	uinfo.ugold = uinfo.ugold.toString();
	uinfo.udiamond= uinfo.udiamond.toString();
	game_redis.hmset(key,uinfo,function(err){
		if(err){
			log.error(err);
		}
	});
}
//获取单个玩家排行榜信息
function get_ugame_rank_info(uuid,callback){
	if (game_redis == null){
		callback(Respones.SYSTEM_ERR,null);
		return;
	}

	var key = "garden_rank_uuid_" + uuid;

	game_redis.hgetall(key,function(err,data){
		if(err){
			callback(Respones.SYSTEM_ERR,null);
			return;
		}

		var uinfo = data;
		uinfo.uuid = parseInt(uinfo.uuid);
	    uinfo.usex = parseInt(uinfo.usex);
	    uinfo.unick = uinfo.unick;
	    uinfo.uface = parseInt(uinfo.uface);
	    uinfo.uvip = parseInt(uinfo.uvip);
	    uinfo.ulevel =parseInt(uinfo.ulevel);
	    uinfo.openid = uinfo.openid;
	    uinfo.ugold = parseInt(uinfo.ugold);
	    uinfo.udiamond= parseInt(uinfo.udiamond);

		callback(Respones.OK,uinfo);
	});
}

//存储排行榜信息
function set_ugame_rank_inredis(data){
	if (game_redis == null){
		return;
	}
	
	var urank = {};
	urank.uuid = data.uuid.toString();
	urank.ugold = data.ugold.toString();
	log.info("存储排行榜信息:" + urank.uuid, urank.ugold);
	game_redis.zadd("GAME_RANK_INFO_WORD", urank.ugold, urank.uuid/*, urank.ubank, urank.ucard*/);
}

//读取排行榜信息
function get_ugame_rank_inredis(rank_num, callback){
	// 由大到小
	game_redis.zrevrange("GAME_RANK_INFO_WORD", 0, rank_num, "withscores", function (err, data) {
		if (err) {
			callback(Respones.SYSTEM_ERR, null);
			return;
		}

		if (!data || data.length <= 0) {
			callback(Respones.RANK_IS_EMPTY, null);
			return;
		}

		for (var i = 0; i < data.length; i++) {		
			data[i] = parseInt(data[i]);
			log.info("得到存储排行榜信息:" + data);
		}
		callback(Respones.OK, data);
	});
}

module.exports = {

	connect: connect_to_redis,//创建redis链接
	set_ugame_rank_inredis:set_ugame_rank_inredis,
	get_ugame_rank_inredis:get_ugame_rank_inredis,
	save_ugame_rank_info:save_ugame_rank_info,//
	get_ugame_rank_info:get_ugame_rank_info,
	
};