/*
	redis 中心数据库
*/

var redis = require("redis");
var util = require("util");
var utils = require("../utils/utils.js");
var Respones = require("../../servers/Respones.js");
var log = require("../log/log.js");

var center_redis = null;

function connect_to_redis(host,port,db_index){
	center_redis = redis.createClient({
		host: host,
		port: port,
		db: db_index,
	});

	center_redis.on("error",function(err){
		log.error(err);
	});
}

/*
redis uinfo信息存储
*/
function set_uinfo_inredis(uuid,uinfo){
	if(center_redis == null){
		return;
	}
	var key = "garden_user_uuid_" + uuid;

    uinfo.uuid = uinfo.uuid.toString();
	uinfo.usex = uinfo.usex.toString();
	uinfo.unick = uinfo.unick;
	uinfo.uface = uinfo.uface;
	uinfo.uvip = uinfo.uvip.toString();
	uinfo.ulevel =uinfo.ulevel.toString();
    uinfo.uexp =uinfo.uexp.toString();
	uinfo.openid = uinfo.openid;
	uinfo.ugold = uinfo.ugold.toString();
	uinfo.udiamond= uinfo.udiamond.toString();
	uinfo.guide = uinfo.guide.toString();
	center_redis.hmset(key,uinfo,function(err){
		if(err){
			log.error(err);
		}
	});
}

/*
redis 读取uinfo
*/
function get_uinfo_inredis(uuid,callback){
	if(center_redis == null){
		callback(Respones.SYSTEM_ERR,null);
		return;
	}

	var key = "garden_user_uuid_" + uuid;

	center_redis.hgetall(key,function(err,data){
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
        uinfo.uexp =parseInt(uinfo.uexp);
	    uinfo.openid = uinfo.openid;
	    uinfo.ugold = parseInt(uinfo.ugold);
	    uinfo.udiamond= parseInt(uinfo.udiamond);
	    uinfo.guide =  parseInt(uinfo.guide);
		callback(Respones.OK,uinfo);
	});
}
/**
 * redis 更新玩家金币
 */
function update_uinfo_gold(uuid,ugold){
	get_uinfo_inredis(uuid,function(status,uinfo){
		if (status != Respones.Ok){
		return;
	}

	uinfo.ugold += ugold;//这里是 + 不论正负都可以加

	set_uinfo_inredis(uuid,uinfo);//保存

	});
}

/**
 * redis 更新玩家钻石
 */
function update_uinfo_diamond(uuid,diamond){
	get_uinfo_inredis(uuid,function(status,uinfo){
		if (status != Respones.Ok){
		return;
	}

	uinfo.udiamond += diamond;//这里是 + 不论正负都可以加

	set_uinfo_inredis(uuid,uinfo);//保存

	});
}
module.exports = {
	connect: connect_to_redis,//创建redis链接
	set_uinfo_inredis: set_uinfo_inredis,//redis uinfo存储
	get_uinfo_inredis: get_uinfo_inredis,//从redis 读取uinfo
	update_uinfo_gold:update_uinfo_gold,//更新玩家金币
	update_uinfo_diamond:update_uinfo_diamond,//更新玩家钻石
};