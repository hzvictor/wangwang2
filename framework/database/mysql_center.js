var mysql = require("mysql");
var util = require("util");
var utils = require("../utils/utils.js");
var Respones = require("../../servers/Respones.js");
var log = require("../log/log.js");
var conn_pool = null;
/**
 * 中心数据库
 * @param {*数据库ip} host
 * @param {*数据库端口} port
 * @param {*数据库名} dbname
 * @param {*数据库用户账号} uname
 * @param {*数据库密码} upswd
 */
function connect_to_center(host,port,dbname,uname,upswd){
    	conn_pool = mysql.createPool({
        host: host,//数据库ip
        port: port,//数据库端口 mysql 默认3306
        database: dbname,//数据库名
        user: uname,//数据库连接用户账号
        password: upswd,//数据库密码
    });
}

function mysql_exec(sql, callback) {
	conn_pool.getConnection(function(err, conn) {
		if (err) { // 如果有错误信息
			if(callback) {
				callback(err, null, null);
			}
			return;
		}

		conn.query(sql, function(sql_err, sql_result, fields_desic) {
			conn.release(); //释放链接

			if (sql_err) {
				if (callback) {
					callback(sql_err, null, null);
				}
				return;
			}

			if (callback) {
				callback(null, sql_result, fields_desic);
			}
		});
	});
}

//读取所有帐号信息
function get_all_uinfo(callback){
	var sql = "select u_uid,u_openid,u_nickname,u_avatarurl,u_gender,u_level,u_vip,u_gold,u_diamond,status,guide from user_info";
	var sql_cmd = util.format(sql);//拼凑完整的sql语句
	mysql_exec(sql_cmd, function(err, sql_ret, fields_desic) {
		if (err) {
			callback(Respones.SYSTEM_ERR, null);
			return;
		}
		callback(Respones.OK, sql_ret);
	});
}

//根据帐号uuid从数据库读取帐号信息
function get_uinfo_by_uuid(uuid,callback){
	var sql = "select u_uid,u_openid,u_nickname,u_avatarurl,u_gender,u_level,u_exp,u_vip,u_gold,u_diamond,status,guide from user_info where u_uid = %d limit 1";
	var sql_cmd = util.format(sql,uuid);//拼凑完整的sql语句
	mysql_exec(sql_cmd, function(err, sql_ret, fields_desic) {
		if (err) {
			callback(Respones.SYSTEM_ERR, null);
			return;
		}
		callback(Respones.OK, sql_ret);
	});
}

//保存头像和昵称和性别  仅限qq登录和 微信登录
function save_unick_and_uface(uuid,unick,uface,usex){
	var sql = "update user_info set u_nickname = \"%s\", u_avatarurl = \"%s\",u_gender = %d where u_uid = %d";
	var sql_cmd = util.format(sql, unick, uface,usex, uuid);
	mysql_exec(sql_cmd, function(err, sql_ret, fields_desic) {
		if (err) {
			log.info("save_unick_and_uface error");//log
			return;
		}
	});
}
//游客注册插入数据到数据库
function insert_guest_user(ukey,unick,usex, uface,gold,diamond,callback) {
    //uid openid 昵称  头像 性别 等级 vip等级 金币 钻石 账号状态
	var sql = "insert into user_info(`u_openid`, `u_nickname`,`u_avatarurl`, `u_gender`,`u_level`,`u_exp`,`u_vip`,`u_gold`,`u_diamond`, `status`, `guide`)values(\"%s\",\"%s\",\"%s\",%d,1,0, 0,%d,%d,0,1)";
	var sql_cmd = util.format(sql,ukey,unick,uface, usex,gold,diamond);
	log.info(sql_cmd);
	mysql_exec(sql_cmd, function(err, sql_ret, fields_desic) {
		if (err) {
			log.error(err);
			callback(Respones.SYSTEM_ERR);
			return;
		}
		callback(Respones.OK);
	});
}
//从数据库读取账号信息
function get_guest_uinfo_by_ukey(ukey,callback){
	var sql = "select u_uid,u_openid,u_nickname,u_avatarurl,u_gender,u_level,u_exp,u_vip,u_gold,u_diamond,status,guide from user_info where u_openid = \"%s\" limit 1";
	var sql_cmd = util.format(sql, ukey);//拼凑完整的sql语句
	mysql_exec(sql_cmd, function(err, sql_ret, fields_desic) {
		if (err) {
			callback(Respones.SYSTEM_ERR, null);
			return;
		}
		callback(Respones.OK, sql_ret);
	});
}

//记录农场动态
function insert_farm_dynamic(farmid,farmtext,farmtime,status,callback) {
    //农场主id  农场动态内容 记录时间
	var sql = "insert into farm_dynamic(`f_id`,`f_text`,`f_time`,`f_status`)values(%d,\"%s\",\"%s\",%d)";
	var sql_cmd = util.format(sql,farmid,farmtext,farmtime,status);
	log.info(sql_cmd);
	mysql_exec(sql_cmd, function(err, sql_ret, fields_desic) {
		if (err) {
			callback(Respones.SYSTEM_ERR);
			return;
		}
		callback(Respones.OK);
	});
}
//查询农场动态
function select_farm_dynamic(farmid,callback){
	var sql = "select f_id,f_text,f_time,f_status from farm_dynamic where f_id = %d and f_status = 1";
	var sql_cmd = util.format(sql, farmid);//拼凑完整的sql语句
	mysql_exec(sql_cmd, function(err, sql_ret, fields_desic) {
		if (err) {
			callback(Respones.SYSTEM_ERR, null);
			return;
		}
		callback(Respones.OK, sql_ret);
	});
}

//插入玩家物品数据
function insert_item_info(tid,uuid,count,callback) {
	var sql = "insert into item_info(`i_tid`,`u_uid`,`i_count`)values(%d,%d,%d)";
	var sql_cmd = util.format(sql,tid,uuid,count);
	mysql_exec(sql_cmd, function(err, sql_ret, fields_desic) {
		if (err) {
			callback(Respones.SYSTEM_ERR);
			return;
		}
		callback(Respones.OK);
	});
}
//得到玩家物品数据
function select_item_info(uuid,callback){
	var sql = "select id,i_tid,u_uid,i_count from item_info where u_uid = %d";
	var sql_cmd = util.format(sql, uuid);//拼凑完整的sql语句
	mysql_exec(sql_cmd, function(err, sql_ret, fields_desic) {
		if (err) {
			callback(Respones.SYSTEM_ERR, null);
			return;
		}
		callback(Respones.OK, sql_ret);
	});
}
//更新玩家物品数据
function update_item_info(uuid, tid, count, callback) {
    var sql = "update item_info set i_count = %d where i_tid = %d and u_uid = %d";
    var sql_cmd = util.format(sql, count, tid, uuid);
    mysql_exec(sql_cmd, function (err, sql_ret, fields_desic) {
        if (err) {
            callback(Respones.SYSTEM_ERR);
            return;
        }

        callback(Respones.OK);
    });
}

//插入指定的好友信息
function insert_friend_with_uuid(uuid,friendid,time,status,notice,intimacy,callback) {
	var sql = "insert into friend_info(`friendid`,`playerid`,`status`,`notice`,`intimacy`,`time`)values(%d,%d,%d,%d,%d,\"%s\")";
	var sql_cmd = util.format(sql,friendid,uuid,status,notice,intimacy,time);
	mysql_exec(sql_cmd, function(err, sql_ret, fields_desic) {
		if (err) {
			callback(Respones.SYSTEM_ERR);
			return;
		}
		callback(Respones.OK);
	});
}
//根据好友id查找好友信息
function get_friend_by_friendid(uuid,friendid,callback){
	var sql = "select friendid,playerid,status,notice,intimacy,time from friend_info where playerid = %d and friendid = %d";
	var sql_cmd = util.format(sql, uuid,friendid);//拼凑完整的sql语句
	mysql_exec(sql_cmd, function(err, sql_ret, fields_desic) {
		if (err) {
			callback(Respones.SYSTEM_ERR, null);
			return;
		}
		callback(Respones.OK, sql_ret);
	});
}
//查询玩家所有的好友
function get_all_friend_with_uuid(uuid,callback){
	var sql = "select friendid,playerid,status,notice,intimacy,time from friend_info where playerid = %d";
	var sql_cmd = util.format(sql, uuid);//拼凑完整的sql语句
	mysql_exec(sql_cmd, function(err, sql_ret, fields_desic) {
		if (err) {
			callback(Respones.SYSTEM_ERR, null);
			return;
		}
		callback(Respones.OK, sql_ret);
	});
}

//查询玩家所有的好友
function get_all_friend_with_status(uuid,callback){
	var sql = "select friendid,playerid,status,notice,intimacy,time from friend_info where playerid = %d and status = 1";
	var sql_cmd = util.format(sql, uuid);//拼凑完整的sql语句
	mysql_exec(sql_cmd, function(err, sql_ret, fields_desic) {
		if (err) {
			callback(Respones.SYSTEM_ERR, null);
			return;
		}
		callback(Respones.OK, sql_ret);
	});
}

//根据好友id删除好友信息
function delete_friend_with_uuid(uuid,friendid,callback)
{
	var sql = "delete from friend_info where playerid = %d and friendid = %d";
	var sql_cmd = util.format(sql,uuid,friendid);
	mysql_exec(sql_cmd, function(err, sql_ret, fields_desic) {
		if (err) {
			log.info("delete_cropsinfo_with_cropsid error");
			callback(Respones.SYSTEM_ERR);
			return;
		}
		callback(Respones.OK);
	});
}
//更新好友状态操作信息
function update_friend_by_operation(uuid,friendid,status,notice,callback){
	var sql = "update friend_info set status = %d,notice = %d where playerid = %d and friendid = %d";
    var sql_cmd = util.format(sql, status,notice, uuid,friendid);
    mysql_exec(sql_cmd, function (err, sql_ret, fields_desic) {
        if (err) {
            callback(Respones.SYSTEM_ERR);
            return;
        }

        callback(Respones.OK);
    });
}
//插入玩家荣誉成就数据
function insert_honor_info(hid,status,uuid,callback) {
	var sql = "insert into honor_info(`h_id`,`h_status`,`u_uid`)values(%d,%d,%d)";
	var sql_cmd = util.format(sql,hid,status,uuid);
	mysql_exec(sql_cmd, function(err, sql_ret, fields_desic) {
		if (err) {
			callback(Respones.SYSTEM_ERR);
			return;
		}
		callback(Respones.OK);
	});
}
//得到玩家荣誉成就数据
function select_honor_info(uuid,callback){
	var sql = "select id,h_id,h_status,u_uid,time from honor_info where u_uid = %d";
	var sql_cmd = util.format(sql, uuid);//拼凑完整的sql语句
	mysql_exec(sql_cmd, function(err, sql_ret, fields_desic) {
		if (err) {
			callback(Respones.SYSTEM_ERR, null);
			return;
		}
		callback(Respones.OK, sql_ret);
	});
}
//更新玩家荣誉成就数据
function update_honor_info(uuid, hid, status,time, callback) {
    var sql = "update honor_info set h_status = %d,time = \"%s\" where h_id = %d and u_uid = %d";
    var sql_cmd = util.format(sql, status,time, hid, uuid);
    mysql_exec(sql_cmd, function (err, sql_ret, fields_desic) {
        if (err) {
            callback(Respones.SYSTEM_ERR);
            return;
        }

        callback(Respones.OK);
    });
}

//游客注册插入附加数据到数据库
function insert_user_attached(uuid,callback) {
	var sql = "insert into user_attached(`kindheart`, `use_chanzi`,`use_huafei`, `use_shuihu`,`rmb_refill`,`feed_friend_pet`,`pet_id`,`steal`,`share`,`has_visit`,`u_uid`)values(0,0,0,0,0,0,0,0,0,0,%d)";
	var sql_cmd = util.format(sql,uuid);
	log.info(sql_cmd);
	mysql_exec(sql_cmd, function(err, sql_ret, fields_desic) {
		if (err) {
			log.error(err);
			callback(Respones.SYSTEM_ERR);
			return;
		}
		callback(Respones.OK);
	});
}
//得到玩家附加数据
function select_user_attached(uuid,callback){
	var sql = "select id,kindheart,use_chanzi,use_huafei,use_shuihu,rmb_refill,feed_friend_pet,pet_id,steal,share,has_visit,u_uid from user_attached where u_uid = %d";
	var sql_cmd = util.format(sql, uuid);//拼凑完整的sql语句
	mysql_exec(sql_cmd, function(err, sql_ret, fields_desic) {
		if (err) {
			callback(Respones.SYSTEM_ERR, null);
			return;
		}
		callback(Respones.OK, sql_ret);
	});
}
//更新玩家附加数据  分享次数
function update_attached_with_share(uuid, count, callback) {
    var sql = "update user_attached set share = %d where u_uid = %d";
    var sql_cmd = util.format(sql, count, uuid);
    mysql_exec(sql_cmd, function (err, sql_ret, fields_desic) {
        if (err) {
            callback(Respones.SYSTEM_ERR);
            return;
        }

        callback(Respones.OK);
    });
}
//更新玩家附加数据  偷取好友次数
function update_attached_with_steal(uuid, count, callback) {
    var sql = "update user_attached set steal = %d where u_uid = %d";
    var sql_cmd = util.format(sql, count, uuid);
    mysql_exec(sql_cmd, function (err, sql_ret, fields_desic) {
        if (err) {
            callback(Respones.SYSTEM_ERR);
            return;
        }

        callback(Respones.OK);
    });
}

//更新玩家附加数据  拥有的宠物id 0代表没有宠物
function update_attached_with_pet_id(uuid, petid, callback) {
    var sql = "update user_attached set pet_id = %d where u_uid = %d";
    var sql_cmd = util.format(sql, petid, uuid);
    mysql_exec(sql_cmd, function (err, sql_ret, fields_desic) {
        if (err) {
            callback(Respones.SYSTEM_ERR);
            return;
        }

        callback(Respones.OK);
    });
}
//更新玩家附加数据  喂养好友宠物次数
function update_attached_with_feed_friend_pet(uuid, count, callback) {
    var sql = "update user_attached set feed_friend_pet = %d where u_uid = %d";
    var sql_cmd = util.format(sql, count, uuid);
    mysql_exec(sql_cmd, function (err, sql_ret, fields_desic) {
        if (err) {
            callback(Respones.SYSTEM_ERR);
            return;
        }

        callback(Respones.OK);
    });
}
//更新玩家附加数据  充值人民币数目
function update_attached_with_rmb_refill(uuid, count, callback) {
    var sql = "update user_attached set rmb_refill = %d where u_uid = %d";
    var sql_cmd = util.format(sql, count, uuid);
    mysql_exec(sql_cmd, function (err, sql_ret, fields_desic) {
        if (err) {
            callback(Respones.SYSTEM_ERR);
            return;
        }

        callback(Respones.OK);
    });
}
//更新玩家附加数据  使用过的水壶数量
function update_attached_with_use_shuihu(uuid, count, callback) {
    var sql = "update user_attached set use_shuihu = %d where u_uid = %d";
    var sql_cmd = util.format(sql, count, uuid);
    mysql_exec(sql_cmd, function (err, sql_ret, fields_desic) {
        if (err) {
            callback(Respones.SYSTEM_ERR);
            return;
        }

        callback(Respones.OK);
    });
}

//更新玩家附加数据  使用过的化肥数量
function update_attached_with_use_huafei(uuid, count, callback) {
    var sql = "update user_attached set use_huafei = %d where u_uid = %d";
    var sql_cmd = util.format(sql, count, uuid);
    mysql_exec(sql_cmd, function (err, sql_ret, fields_desic) {
        if (err) {
            callback(Respones.SYSTEM_ERR);
            return;
        }

        callback(Respones.OK);
    });
}
//更新玩家附加数据  使用过的铲子数量
function update_attached_with_use_chanzi(uuid, count, callback) {
    var sql = "update user_attached set use_chanzi = %d where u_uid = %d";
    var sql_cmd = util.format(sql, count, uuid);
    mysql_exec(sql_cmd, function (err, sql_ret, fields_desic) {
        if (err) {
            callback(Respones.SYSTEM_ERR);
            return;
        }

        callback(Respones.OK);
    });
}
//更新玩家附加数据  爱心值
function update_attached_with_kindheart(uuid, count, callback) {
    var sql = "update user_attached set kindheart = %d where u_uid = %d";
    var sql_cmd = util.format(sql, count, uuid);
    mysql_exec(sql_cmd, function (err, sql_ret, fields_desic) {
        if (err) {
            callback(Respones.SYSTEM_ERR);
            return;
        }

        callback(Respones.OK);
    });
}
//更新玩家附加数据  被访问次数
function update_attached_with_visit(uuid, count, callback) {
    var sql = "update user_attached set has_visit = %d where u_uid = %d";
    var sql_cmd = util.format(sql, count, uuid);
    mysql_exec(sql_cmd, function (err, sql_ret, fields_desic) {
        if (err) {
            callback(Respones.SYSTEM_ERR);
            return;
        }

        callback(Respones.OK);
    });
}


//从数据库读取金币前20名玩家
function get_rank_info_100_player(callback){
	var sql = "select u_uid,u_nickname,u_avatarurl,u_gold from user_info order by u_gold desc limit 20";
	var sql_cmd = util.format(sql);//拼凑完整的sql语句
	mysql_exec(sql_cmd, function(err, sql_ret, fields_desic) {
		if (err) {
			callback(Respones.SYSTEM_ERR, null);
			return;
		}
		
		callback(Respones.OK, sql_ret);
	});
}
module.exports = {
	connect: connect_to_center,
	get_guest_uinfo_by_ukey: get_guest_uinfo_by_ukey, //查询游客帐号
	get_rank_info_100_player:get_rank_info_100_player,//从数据库读取金币前100名玩家
	get_all_uinfo: get_all_uinfo, //查询所有帐号
	insert_guest_user: insert_guest_user,//注册游客帐号
	get_uinfo_by_uuid: get_uinfo_by_uuid,//根据uuid查找用户数据
	save_unick_and_uface:save_unick_and_uface,//保存头像和昵称和性别  仅限qq登录和 微信登录
	insert_farm_dynamic:insert_farm_dynamic,//记录农场动态
	select_farm_dynamic:select_farm_dynamic,//查询农场动态
	insert_item_info:insert_item_info,//插入玩家物品数据
	select_item_info:select_item_info,//得到玩家物品数据
	update_item_info:update_item_info,//更新玩家物品数据
	delete_friend_with_uuid:delete_friend_with_uuid,//根据好友id删除好友
	update_friend_by_operation:update_friend_by_operation,//更新玩家好友状态操作信息
	get_all_friend_with_uuid: get_all_friend_with_uuid, //查询玩家所有的好友
	get_all_friend_with_status: get_all_friend_with_status, //查询玩家所有的好友
	get_friend_by_friendid:get_friend_by_friendid,//根据好友id查找好友信息
	insert_friend_with_uuid,insert_friend_with_uuid,//插入指定的好友信息
	insert_honor_info:insert_honor_info,//插入玩家荣誉成就数据
	select_honor_info:select_honor_info,//得到玩家荣誉成就数据
	update_honor_info:update_honor_info,//更新玩家荣誉成就数据
	insert_user_attached:insert_user_attached,//游客注册插入附加数据到数据库
	select_user_attached:select_user_attached,//得到玩家附加数据
	update_attached_with_share:update_attached_with_share,//更新玩家附加数据  分享次数
	update_attached_with_steal:update_attached_with_steal,//更新玩家附加数据  偷取好友次数
	update_attached_with_feed_friend_pet:update_attached_with_feed_friend_pet,//更新玩家附加数据  喂养好友宠物次数
	update_attached_with_pet_id:update_attached_with_pet_id,//更新玩家附加数据  拥有的宠物id 0代表没有宠物
	update_attached_with_rmb_refill:update_attached_with_rmb_refill,//更新玩家附加数据  充值人民币数目
	update_attached_with_use_shuihu:update_attached_with_use_shuihu,//更新玩家附加数据  使用过的水壶数量
	update_attached_with_use_huafei:update_attached_with_use_huafei,//更新玩家附加数据  使用过的化肥数量
	update_attached_with_use_chanzi:update_attached_with_use_chanzi,//更新玩家附加数据  使用过的铲子数量
	update_attached_with_kindheart:update_attached_with_kindheart,//更新玩家附加数据  爱心值
	update_attached_with_visit:update_attached_with_visit,//更新玩家附加数据  被访问次数
	
};