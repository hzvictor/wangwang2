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

//从数据库得到初始化的配置数据 (金币 钻石 开通土地数)
function get_data_config(callback){
	var sql = "select d_gold,d_diamond,d_lands from config_default where d_id = 1";
	var sql_cmd = util.format(sql);//拼凑完整的sql语句
	mysql_exec(sql_cmd, function(err, sql_ret, fields_desic) {
		if (err) {
			callback(Respones.SYSTEM_ERR, null);
			return;
		}
		callback(Respones.OK, sql_ret);
	});
}

//更新用户等级和经验值
function update_level_and_exp_with_uuid(uuid,level,exp){
	var sql = "update user_info set u_level = %d,u_exp = %d where u_uid = %d";
	var sql_cmd = util.format(sql,level,exp,uuid);
	mysql_exec(sql_cmd, function(err, sql_ret, fields_desic) {
		if (err) {
			log.info("update_level_and_exp_with_uuid error");
			return;
		}
	});
}

//更新玩家引导状态
function update_ugame_guide(uuid){
	var sql = "update user_info set guide = 0 where u_uid = %d";
	var sql_cmd = util.format(sql,uuid);
	mysql_exec(sql_cmd, function(err, sql_ret, fields_desic) {
		if (err) {
			log.info("update_ugame_guide error");
			return;
		}
	});
}
//更新玩家经验和等级
function update_ugame_exp_level(uuid,level,exp){
	var sql = "update user_info set u_level = %d,u_exp = %d where u_uid = %d";
	var sql_cmd = util.format(sql,level,exp,uuid);
	mysql_exec(sql_cmd, function(err, sql_ret, fields_desic) {
		if (err) {
			log.info("update_ugame_exp_level error");
			return;
		}
	});
}
//更新玩家金币
function update_ugame_gold(uuid,ugold){
	var sql = "update user_info set u_gold = %d where u_uid = %d";
	var sql_cmd = util.format(sql,ugold,uuid);
	mysql_exec(sql_cmd, function(err, sql_ret, fields_desic) {
		if (err) {
			log.info("update_ugame_gold error");
			return;
		}
	});
}

//更新玩家钻石数
function update_ugame_diamond(uuid,diamond){
	var sql = "update user_info set u_diamond = %d where u_uid = %d";
	var sql_cmd = util.format(sql,diamond,uuid);
	mysql_exec(sql_cmd, function(err, sql_ret, fields_desic) {
		if (err) {
			log.info("update_ugame_diamond error");
			return;
		}
	});
}

//更新土地状态
function update_land_state_landid(landid,state){
	var sql = "update land_info set l_status = %d where l_id = %d";
	var sql_cmd = util.format(sql,state,landid);
	mysql_exec(sql_cmd, function(err, sql_ret, fields_desic) {
		if (err) {
			log.info("update_land_state_landid error");
			return;
		}
	});
}

//更新土地上的农作物记录
function update_land_with_crops(landid,cropsid,callback){
	var sql = "update land_info set c_id = %d where l_id = %d";
	var sql_cmd = util.format(sql,cropsid,landid);
	mysql_exec(sql_cmd, function(err, sql_ret, fields_desic) {
		if (err) {
			callback(Respones.SYSTEM_ERR);
			log.info("delete_land_with_crops error");
			return;
		}

		callback(Respones.OK);

	});
}
//删除农作物记录
function delete_cropsinfo_with_cropsid(cropsid){
	var sql = "delete from crop_info where c_id = %d";
	var sql_cmd = util.format(sql,cropsid);
	mysql_exec(sql_cmd, function(err, sql_ret, fields_desic) {
		if (err) {
			log.info("delete_cropsinfo_with_cropsid error");
			return;
		}
	});
}

//根据帐号uuid从数据库读取所有农作物信息
function get_cropsinfo_by_uuid(uuid,callback){
	var sql = "select c_id,t_id,c_status,c_begintime,c_endtime,c_count,l_id,u_uid,c_operation from crop_info where u_uid = %d";
	var sql_cmd = util.format(sql,uuid);//拼凑完整的sql语句
	mysql_exec(sql_cmd, function(err, sql_ret, fields_desic) {
		if (err) {
			callback(Respones.SYSTEM_ERR, null);
			return;
		}
		callback(Respones.OK, sql_ret);
	});
}

//查询农作物记录
function select_cropsinfo_with_landid(landid,callback){
	var sql = "select c_id,t_id,c_status,c_begintime,c_endtime, c_count,l_id,u_uid,c_operation from crop_info where l_id = %d limit 1";
	var sql_cmd = util.format(sql,landid);
	mysql_exec(sql_cmd, function(err, sql_ret, fields_desic) {
		if (err) {
			callback(Respones.SYSTEM_ERR, null);
			return;
		}
		callback(Respones.OK, sql_ret);
	});
}

//根据帐号uuid从数据库读取土地信息
function get_landinfo_by_uuid(uuid,callback){
	var sql = "select l_id,u_uid,l_mapid,l_status,l_level,c_id from land_info where u_uid = %d order by l_mapid asc limit 12";
	var sql_cmd = util.format(sql,uuid);//拼凑完整的sql语句
	mysql_exec(sql_cmd, function(err, sql_ret, fields_desic) {
		if (err) {
			callback(Respones.SYSTEM_ERR, null);
			return;
		}
		callback(Respones.OK, sql_ret);
	});
}

//创建账号后插入土地数据到数据库
function insert_landinfo_with_uuid(uuid,mapid,status,callback) {;
    //用户uid 状态 等级 农作物id
	var sql = "insert into land_info(`u_uid`, `l_mapid`,`l_status`,`l_level`, `c_id`)values(%d,%d,%d,1,0)";
	var sql_cmd = util.format(sql, uuid,mapid,status);
	mysql_exec(sql_cmd, function(err, sql_ret, fields_desic) {
		if (err) {
			callback(Respones.SYSTEM_ERR);
			return;
		}
		callback(Respones.OK);
	});
}

//记录种植农作物数据到数据库
function insert_cropinfo_with_uuid(uuid,tid,status,begintime,endtime,count,landid,callback) {;
    //用户uid 状态 等级 农作物id
	var sql = "insert into crop_info(`t_id`, `c_status`,`c_begintime`,`c_endtime`, `c_count`, `l_id`, `u_uid`,`c_operation`)values(%d,%d,\"%s\",\"%s\",%d,%d,%d,0)";
	var sql_cmd = util.format(sql, tid,status,begintime,endtime,count,landid,uuid);
	mysql_exec(sql_cmd, function(err, sql_ret, fields_desic) {
		if (err) {
			callback(Respones.SYSTEM_ERR);
			return;
		}
		callback(Respones.OK);
	});
}
//根据农作物记录id更新玩家农作物数据
function update_cropinfo_with_cid(cid,tid,count,begintime,endtime,callback){
    var sql = "update crop_info set c_count = %d,c_begintime =%d,c_endtime =%d where t_id = %d and c_id = %d";
	var sql_cmd = util.format(sql,count,begintime,endtime,tid,cid);
	mysql_exec(sql_cmd, function(err, sql_ret, fields_desic) {
		if (err) {
			callback(Respones.SYSTEM_ERR);
			return;
		}
		callback(Respones.OK);
	});
}
//根据农作物记录id更新玩家农作物操作数据
//operation 0是正常状态  1是被偷标志
function update_cropinfo_operation_with_cid(cid,tid,operation,callback){
    var sql = "update crop_info set c_operation = %d where t_id = %d and c_id = %d";
	var sql_cmd = util.format(sql,operation,tid,cid);
	mysql_exec(sql_cmd, function(err, sql_ret, fields_desic) {
		if (err) {
			callback(Respones.SYSTEM_ERR);
			return;
		}
		callback(Respones.OK);
	});
}
//记录道具数据到数据库
function insert_propinfo_with_uuid(uuid,tid,type,count,callback) {;
    //用户uid 状态 等级 农作物id
    var sql = "insert into prop_info(`t_id`, `p_type`,`p_count`,`u_uid`)values(%d,%d,%d,%d)";
	var sql_cmd = util.format(sql, tid,type,count,uuid);
	mysql_exec(sql_cmd, function(err, sql_ret, fields_desic) {
		if (err) {
			callback(Respones.SYSTEM_ERR);
			return;
		}
		callback(Respones.OK);
	});
}
//根据玩家uuid和道具模版id 更新玩家图鉴类型信息记录
function update_prop_type_with_uuid_and_tid(uuid,tid,type,callback){
    var sql = "update prop_info set p_type = %d where t_id = %d and u_uid = %d";
	var sql_cmd = util.format(sql,type,tid,uuid);
	mysql_exec(sql_cmd, function(err, sql_ret, fields_desic) {
		if (err) {
			callback(Respones.SYSTEM_ERR);
			return;
		}

		callback(Respones.OK);
	});
}
//根据玩家uuid和道具模版id 更新玩家道具数量记录
function update_prop_with_uuid_and_tid(uuid,tid,count,callback){
    var sql = "update prop_info set p_count = %d where t_id = %d and u_uid = %d";
	var sql_cmd = util.format(sql,count,tid,uuid);
	mysql_exec(sql_cmd, function(err, sql_ret, fields_desic) {
		if (err) {
			callback(Respones.SYSTEM_ERR);
			return;
		}

		callback(Respones.OK);
	});
}
//根据玩家uuid和道具记录id 更新玩家道具数量记录
function update_prop_with_uuid_and_pid(uuid, pid, count, callback) {
    var sql = "update prop_info set p_count = %d where p_id = %d and u_uid = %d";
    var sql_cmd = util.format(sql, count, pid, uuid);
    mysql_exec(sql_cmd, function (err, sql_ret, fields_desic) {
        if (err) {
            callback(Respones.SYSTEM_ERR);
            return;
        }

        callback(Respones.OK);
    });
}
//根据帐号uuid从数据库读取玩家所有道具数据信息
function get_propinfo_by_uuid(uuid, callback) {
    var sql = "select p_id,t_id,p_type,p_count,u_uid from prop_info where u_uid = %d";
    var sql_cmd = util.format(sql, uuid);//拼凑完整的sql语句
    mysql_exec(sql_cmd, function (err, sql_ret, fields_desic) {
        if (err) {
            callback(Respones.SYSTEM_ERR, null);
            return;
        }
        callback(Respones.OK, sql_ret);
    });
}
///////////////////////////////////////////

//记录种子数据到数据库
function insert_seedinfo_with_uuid(uuid, tid, count, callback) {;
    var sql = "insert into seed_info(`t_id`,`s_count`,`u_uid`)values(%d,%d,%d)";
    var sql_cmd = util.format(sql, tid, count, uuid);
    mysql_exec(sql_cmd, function (err, sql_ret, fields_desic) {
        if (err) {
            callback(Respones.SYSTEM_ERR);
            return;
        }
        callback(Respones.OK);
    });
}

//根据玩家uuid和模版id 更新玩家种子数量记录
function update_seedinfo_with_uuid_and_tid(uuid, tid, count, callback) {
    var sql = "update seed_info set s_count = %d where t_id = %d and u_uid = %d";
    var sql_cmd = util.format(sql, count, tid, uuid);
    mysql_exec(sql_cmd, function (err, sql_ret, fields_desic) {
        if (err) {
            callback(Respones.SYSTEM_ERR);
            return;
        }

        callback(Respones.OK);
    });
}
//根据玩家uuid和种子记录id 更新玩家种子数量记录
function update_seedinfo_with_uuid_and_sid(uuid, sid, count, callback) {
    var sql = "update seed_info set s_count = %d where s_id = %d and u_uid = %d";
    var sql_cmd = util.format(sql, count, sid, uuid);
    mysql_exec(sql_cmd, function (err, sql_ret, fields_desic) {
        if (err) {
            callback(Respones.SYSTEM_ERR);
            return;
        }

        callback(Respones.OK);
    });
}
//根据帐号uuid从数据库读取玩家所有种子数据信息
function get_seedinfo_by_uuid(uuid, callback) {
    var sql = "select s_id,t_id,s_count,u_uid from seed_info where u_uid = %d";
    var sql_cmd = util.format(sql, uuid);//拼凑完整的sql语句
    mysql_exec(sql_cmd, function (err, sql_ret, fields_desic) {
        if (err) {
            callback(Respones.SYSTEM_ERR, null);
            return;
        }
        callback(Respones.OK, sql_ret);
    });
}
///////////////////////////////////////////////

//记录被偷取的农作物数据
function insert_croplog_with_cid(cid,tid,lid,uid,fid,count,time,callback) {;
	var sql = "insert into crop_log(`c_id`, `t_id`,`l_id`,`u_uid`, `f_uid`, `count`, `time`)values(%d,%d,%d,%d,%d,%d,\"%s\")";
	var sql_cmd = util.format(sql, cid,tid,lid,uid,fid,count,time);
	mysql_exec(sql_cmd, function(err, sql_ret, fields_desic) {
		if (err) {
			callback(Respones.SYSTEM_ERR);
			return;
		}
		callback(Respones.OK);
	});
}

//查询该农作物的所有被偷取记录
function select_croplog_by_cid(cid,callback){
	var sql = "select c_id,t_id,l_id,u_uid,f_uid, count,time from crop_log where c_id = %d";
	var sql_cmd = util.format(sql,cid);
	mysql_exec(sql_cmd, function(err, sql_ret, fields_desic) {
		if (err) {
			callback(Respones.SYSTEM_ERR, null);
			return;
		}
		callback(Respones.OK, sql_ret);
	});
}

//查询农场主的所有被偷取记录
function select_croplog_by_fuid(fuid,callback){
	var sql = "select c_id,t_id,l_id,u_uid,f_uid, count,time from crop_log where f_uid = %d";
	var sql_cmd = util.format(sql,fuid);
	mysql_exec(sql_cmd, function(err, sql_ret, fields_desic) {
		if (err) {
			callback(Respones.SYSTEM_ERR, null);
			return;
		}
		callback(Respones.OK, sql_ret);
	});
}
//查询玩家偷取的所有农作物记录
function select_cropslog_by_uuid(uuid,callback){
	var sql = "select c_id,t_id,l_id,u_uid,f_uid, count,time from crop_log where u_uid = %d";
	var sql_cmd = util.format(sql,uuid);
	mysql_exec(sql_cmd, function(err, sql_ret, fields_desic) {
		if (err) {
			callback(Respones.SYSTEM_ERR, null);
			return;
		}
		callback(Respones.OK, sql_ret);
	});
}
//删除该农作物被偷取记录
function delete_cropslog_with_cid(cid){
	var sql = "delete from crop_log where c_id = %d";
	var sql_cmd = util.format(sql,cid);
	mysql_exec(sql_cmd, function(err, sql_ret, fields_desic) {
		if (err) {
			log.info("delete_cropslog_with_cid error");
			return;
		}
	});
}

module.exports = {
	connect: connect_to_center,
	get_data_config: get_data_config,//从数据库得到初始化的配置数据
	update_ugame_gold:update_ugame_gold,//更新玩家金币数量
	update_ugame_guide:update_ugame_guide,//更新玩家引导状态 
	update_ugame_exp_level:update_ugame_exp_level,//更新玩家经验和等级
    update_level_and_exp_with_uuid:update_level_and_exp_with_uuid,//更新用户等级和经验值
	update_ugame_diamond:update_ugame_diamond,//更新玩家钻石数量
	insert_landinfo_with_uuid:insert_landinfo_with_uuid,//创建玩家土地信息
	get_landinfo_by_uuid:get_landinfo_by_uuid,//查询玩家土地信息
	update_land_state_landid:update_land_state_landid,//更新土地状态
	update_land_with_crops:update_land_with_crops,//更新土地上的农作物记录
	insert_cropinfo_with_uuid:insert_cropinfo_with_uuid,//记录种植农作物数据
	update_cropinfo_operation_with_cid:update_cropinfo_operation_with_cid,//更新种植的农作物操作数据1是被偷取
	update_cropinfo_with_cid:update_cropinfo_with_cid,//更新种植的农作物数据
	select_cropsinfo_with_landid:select_cropsinfo_with_landid,//查询农作物记录
	get_cropsinfo_by_uuid:get_cropsinfo_by_uuid,//查询玩家所有农作物信息
	delete_cropsinfo_with_cropsid:delete_cropsinfo_with_cropsid,//删除农作物记录
	insert_propinfo_with_uuid:insert_propinfo_with_uuid,//记录玩家道具数据
	update_prop_with_uuid_and_tid: update_prop_with_uuid_and_tid,//更新玩家道具数量记录 where u_uid and t_id
	update_prop_type_with_uuid_and_tid:update_prop_type_with_uuid_and_tid,//根据玩家uuid和道具模版id 更新图鉴点亮状态
	update_prop_with_uuid_and_pid: update_prop_with_uuid_and_pid,//更新玩家道具数量记录 where u_uid and p_id
	get_propinfo_by_uuid: get_propinfo_by_uuid,//查询玩家所有道具数据信息
	insert_seedinfo_with_uuid: insert_seedinfo_with_uuid,////记录玩家种子数据
	update_seedinfo_with_uuid_and_tid: update_seedinfo_with_uuid_and_tid,//更新玩家种子数量记录 where u_uid and t_id
	update_seedinfo_with_uuid_and_sid: update_seedinfo_with_uuid_and_sid,//更新玩家种子数量记录 where u_uid and s_id
	get_seedinfo_by_uuid: get_seedinfo_by_uuid,//查询玩家所有种子数据信息
	insert_croplog_with_cid:insert_croplog_with_cid,//记录被偷取的农作物数据
	select_croplog_by_cid:select_croplog_by_cid,//查询该农作物的所有被偷取记录
	select_croplog_by_fuid:select_croplog_by_fuid,//查询农场主的所有被偷取记录
	select_cropslog_by_uuid:select_cropslog_by_uuid,//查询玩家偷取的所有农作物记录
	delete_cropslog_with_cid:delete_cropslog_with_cid,//删除该农作物被偷取记录
};