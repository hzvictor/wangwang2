/**
 * 系统服务器逻辑
 */
var Respones = require("../Respones.js");
var mysql_game = require("../../framework/database/mysql_game.js");
var mysql_center = require("../../framework/database/mysql_center.js");
var redis_game = require("../../framework/database/redis_game.js");
var utils = require("../../framework/utils/utils.js");
var log = require("../../framework/log/log.js");
var readyconfig = require("../../framework/config/readyconfig.js");
var proptempdata = readyconfig.readPropTemplateConfig();//读取道具数据配置文件
var itemtempdata = readyconfig.readItemTemplateConfig();//读取物品数据配置文件
var honortempdata = readyconfig.readHonorTemplateConfig();//读取荣誉数据配置文件

//排行榜数据
//var rankgoldlist = new Array();
//失败
function write_err(status, ret_func) {
	var ret = {};
	ret.status = status;
	ret_func(ret);
}
//查找金币排行榜数据
function get_rank_list_from_gold(uuid, ret_func){
    //如果有金币排行榜数据则返回给客户端
    mysql_center.get_rank_info_100_player( function (status, data) {
        if(status != Respones.OK){
            log.error("查找金币排行榜数据 error");
            write_err(status, ret_func);
            return;
        }

        if (data.length <= 0) { // 没找到数据
            write_err(Respones.NO_RANK_DATA, ret_func);
        }
        else {
            var rankgoldlist = new Array();
            //所有记录
            for (let i = 0; i < data.length; i++) {
                let string = JSON.stringify(data[i]);
                rankgoldlist.push(JSON.parse(string));
            }
            console.log(rankgoldlist);
            //获取信息成功了
            get_info_success(uuid, rankgoldlist, ret_func);
        }
    });
}
//获取游戏土地信息
function get_landinfo_by_uuid(uuid, taguuid, ret_func) {
    mysql_game.get_landinfo_by_uuid(taguuid, function (status, data) {
		if(status != Respones.OK){
		    log.error("get_landinfo_by_uuid error");
			write_err(status, ret_func);
			return;
		}

		if (data.length <= 0) { // 没找到该uuid的数据

            //如果是自己则创建土地数据
		    if (taguuid == uuid) {
	            //从数据库配置读取初始化的数据
	            mysql_game.get_data_config(function (type, config) {
	                if (type == Respones.OK) {
                        //得到配置数据
	                    var initdata = config[0];
	                    var maxland = initdata.d_lands;//默认开通土地数

	                    var landIndex = 0;//

	                    for (var i = 0; i < 12; i++) {

	                        var status = 0;
	                        if (i < maxland) {
	                            status = 1;
	                        }

	                        //执行创建
	                        mysql_game.insert_landinfo_with_uuid(uuid,i, status, function (status) {
	                            if (status != Respones.OK) {
	                            	log.info("生成土地错误了!!!");
	                                write_err(status, ret_func);
	                                return;
	                            }

	                            landIndex++;
	                            log.info("正在生成了第" + landIndex+"块土地!!");

	                            if (landIndex == 12) {
			                        log.info("所有土地都已经生成了!!!");
			                        //创建成功了  再次执行下查询
			                        get_landinfo_by_uuid(uuid,taguuid, ret_func);
			                    }

	                        });
	                    }
	                } else {
	                    log.error("读取data_config配置失败");
	                    return;
	                }
		        });
		    } else {
		        write_err(Respones.ILLEGAL_ACCOUNT, ret_func);
		        return;
		    }
		}
		else {

			//var sql_ugame = data[0];//第0条记录
		    var sql_ugame = data;//所有记录
			//获取信息成功了
			get_info_success(uuid, sql_ugame, ret_func);
		}
	});
}

//获取道具信息
function get_propinfo_by_uuid(uuid,ret_func) {
    mysql_game.get_propinfo_by_uuid(uuid, function (status, data) {
        if (status != Respones.OK) {
            log.error("get_propinfo_by_uuid error");
            write_err(status, ret_func);
            return;
        }

        if (data.length <= 0) { // 没找到该uuid的数据
            var propIndex = 0;//
            for (var i in proptempdata) {
                let tid = proptempdata[i].id;
                
                //初始化创建道具数据
                mysql_game.insert_propinfo_with_uuid(uuid, tid,0, 0, function (status) {
                    if (status != Respones.OK) {
                        log.info("ID = : " + tid + "道具生成错误了!!!");
                        write_err(status, ret_func);
                        return;
                    }

                    propIndex++;
                    log.info("正在生成了第" + propIndex + "个道具 ID == " + tid + " !!");

                    if (propIndex == proptempdata.length) {
                        log.info("所有道具都已经生成了!!!");
                        //创建成功了  再次执行下查询
                        get_propinfo_by_uuid(uuid, ret_func);
                    }

                });
            }
            
        }
        else {

            //var sql_ugame = data[0];//第0条记录
            var sql_ugame = data;//所有记录
            //获取信息成功了
            get_info_success(uuid, sql_ugame, ret_func);
        }
    });
}

//获取种子信息
function get_seedinfo_by_uuid(uuid, ret_func) {
    mysql_game.get_seedinfo_by_uuid(uuid, function (status, data) {
        if (status != Respones.OK) {
            log.error("get_seedinfo_by_uuid error");
            write_err(status, ret_func);
            return;
        }

        if (data.length <= 0) { // 没找到该uuid的数据
            var propIndex = 0;//
            for (var i in proptempdata) {
                let tid = proptempdata[i].id;

                //如果是自己则创建土地数据
                mysql_game.insert_seedinfo_with_uuid(uuid, tid, 0, function (status) {
                    if (status != Respones.OK) {
                        log.info("ID = : " + tid + "种子生成错误了!!!");
                        write_err(status, ret_func);
                        return;
                    }

                    propIndex++;
                    log.info("正在生成了第" + propIndex + "个种子 ID == " + tid + " !!");

                    if (propIndex == proptempdata.length) {
                        log.info("所有种子都已经生成了!!!");
                        //创建成功了  再次执行下查询
                        get_seedinfo_by_uuid(uuid, ret_func);
                    }

                });
            }

        }
        else {

            //var sql_ugame = data[0];//第0条记录
            var sql_ugame = data;//所有记录
            //获取信息成功了
            get_info_success(uuid, sql_ugame, ret_func);
        }
    });
}
//判断好友的信息是否存在
function check_haoyouinfo_by_uuid(uuid,body, ret_func){

    //获取用户信息
    mysql_center.get_uinfo_by_uuid(body, function (status, data) {
        if (status != Respones.OK) {
            ret_func(status);
            return;
        }

        if (data.length <= 0) {
            ret_func(Respones.ILLEGAL_ACCOUNT);
            return;
        }

        var sql_ugame = data[0];

        get_info_success(body, sql_ugame, ret_func);
    });
}

//获取所有的好友信息
function get_haoyouinfo_by_uuid(uuid,body, ret_func){

 mysql_center.get_all_friend_with_uuid(body, function (status, data) {
        if(status != Respones.OK){
            log.error("status:",status);
            return;
        }
        if (data.length <= 0) { // 没找到该uuid的数据
            log.warn("没找到该uuid的好友数据");
        }

        var sql_ugame = data;//所有记录
        //获取信息成功了
        get_info_success(body, sql_ugame, ret_func);
    });
}

//获取所有的物品信息
function get_item_info_by_uuid(uuid, ret_func) {
    mysql_center.select_item_info(uuid, function (status, data) {
        if (status != Respones.OK) {
            log.error("select_item_info error");
            write_err(status, ret_func);
            return;
        }

        if (data.length <= 0) { // 没找到该uuid的数据
            var itemIndex = 0;//
            for (var i in itemtempdata) {
                let tid = itemtempdata[i].id;

                //如果是自己则创建
                mysql_center.insert_item_info(tid,uuid,0, function (status) {
                    if (status != Respones.OK) {
                        log.info("ID = : " + tid + "物品生成错误了!!!");
                        write_err(status, ret_func);
                        return;
                    }

                    itemIndex++;
                    log.info("正在生成了第" + itemIndex + "个物品 ID == " + tid + " !!");

                    if (itemIndex == itemtempdata.length) {
                        log.info("所有物品都已经生成了!!!");
                        //创建成功了  再次执行下查询
                        get_item_info_by_uuid(uuid, ret_func);
                    }

                });
            }

        }
        else {

            //var sql_ugame = data[0];//第0条记录
            var sql_ugame = data;//所有记录
            //获取信息成功了
            get_info_success(uuid, sql_ugame, ret_func);
        }
    });
}


//获取玩家荣誉信息
function get_honor_info_by_uuid(uuid, ret_func) {
    mysql_center.select_honor_info(uuid, function (status, data) {
        if (status != Respones.OK) {
            log.error("select_honor_info error");
            write_err(status, ret_func);
            return;
        }

        if (data.length <= 0) { // 没找到该uuid的数据
            var itemIndex = 0;//
            for (var i in honortempdata) {
                let hid = honortempdata[i].id;

                //如果是自己则创建
                mysql_center.insert_honor_info(hid,0,uuid, function (status) {
                    if (status != Respones.OK) {
                        log.info("ID = : " + hid + "物品生成错误了!!!");
                        write_err(status, ret_func);
                        return;
                    }

                    itemIndex++;
                    log.info("正在生成了第" + itemIndex + "个物品 ID == " + hid + " !!");

                    if (itemIndex == honortempdata.length) {
                        log.info("所有荣誉勋章都已经生成了!!!");
                        //创建成功了  再次执行下查询
                        get_honor_info_by_uuid(uuid, ret_func);
                    }

                });
            }

        }
        else {

            //var sql_ugame = data[0];//第0条记录
            var sql_ugame = data;//所有记录
            //获取信息成功了
            get_info_success(uuid, sql_ugame, ret_func);
        }
    });
}


//获取玩家附加数据信息
function get_attached_by_uuid(uuid, ret_func) {
    //判断是否有附加信息
    mysql_center.select_user_attached(uuid, function (status, data) {
        if (status != Respones.OK) {
            log.error("select_user_attached = " + uuid +" status error");
            write_err(status, ret_func);
            return;
        }
        if (data.length <= 0) { // 没找到该uuid的数据

            //插入数据附加表
            mysql_center.insert_user_attached(uuid,function(status) {
                if (status != Respones.OK) {
                    log.error("用户注册失败");
                    write_err(status, ret_func);
                    return;
                }

                //创建成功了  再次执行下查询
                get_attached_by_uuid(uuid, ret_func);
                
            });
        }else {
            var sql_ugame = data[0];//第0条记录

             get_info_success(uuid, sql_ugame, ret_func);
        }
    });
}

//成功了
function get_info_success(uuid, data, ret_func) {
	var ret = {};
	ret[0] = Respones.OK;
	ret[1] = data
	ret_func(ret);
}

module.exports = {
    get_rank_list_from_gold:get_rank_list_from_gold,//查找金币排行榜数据
    get_attached_by_uuid: get_attached_by_uuid,//获取玩家附加数据信息
    get_landinfo_by_uuid: get_landinfo_by_uuid,//获取游戏土地信息
    get_propinfo_by_uuid: get_propinfo_by_uuid,//获取道具信息
    get_seedinfo_by_uuid: get_seedinfo_by_uuid,//获取种子信息
    get_haoyouinfo_by_uuid: get_haoyouinfo_by_uuid,//获取所有的好友信息
    check_haoyouinfo_by_uuid:check_haoyouinfo_by_uuid,//验证好友数据信息
    get_item_info_by_uuid: get_item_info_by_uuid,//获取所有的物品信息 
    get_honor_info_by_uuid: get_honor_info_by_uuid,//获取玩家荣誉信息
}