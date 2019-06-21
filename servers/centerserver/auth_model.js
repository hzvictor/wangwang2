/*
中心服务器逻辑
*/
var Respones = require("../Respones.js");
var mysql_game = require("../../framework/database/mysql_game.js");
var mysql_center = require("../../framework/database/mysql_center.js");
var redis_center = require("../../framework/database/redis_center.js");
var utils = require("../../framework/utils/utils.js");
var RandomName = require("../../framework/utils/RandomName.js");
var log = require("../../framework/log/log.js");
//账号登录
function guest_login(ukey, unick, usex, uface, ret_func) {

	//var unick = RandomName.getPerName()+utils.random_int_str(4);//用户昵称 : 随机取名  + 随机生成4个数字
	//var uface = utils.random_int(1,7);//用户头像 0 - 87
	//var uuid = utils.random_long_uuid();//生成uuid
	//写入数据库
	mysql_center.get_guest_uinfo_by_ukey(ukey, function (status, data) {
		if (status != Respones.OK) {
			log.error("读取数据库失败");
			write_err(status, ret_func);
			return;
		}

		if (data.length <= 0) { // 没有这样的key, 注册一个
			log.info(ukey, unick, usex);
			//从数据库配置读取初始化的数据
			mysql_game.get_data_config(function (type, config) {
				if (type == Respones.OK) {
					//得到配置数据
					var initdata = config[0];
					var gold = initdata.d_gold; //默认金币
					var diamond = initdata.d_diamond; //默认金币

					mysql_center.insert_guest_user(ukey, unick, usex, uface, gold, diamond, function (status, data) {
						if (status != Respones.OK) {
							log.error("用户注册失败");
							write_err(status, ret_func);
							return;
						}

						//重新调用 递归一次
						guest_login(ukey, unick, usex, uface, ret_func);
					});
				} else {
					log.error("读取data_config配置失败");
					return;
				}
			});
		} else {
			var sql_uinfo = data[0]; //第0条记录

			//保存头像和昵称性别
			mysql_center.save_unick_and_uface(sql_uinfo.u_uid, unick, uface, usex);
			sql_uinfo.u_gender = usex;
			sql_uinfo.u_nickname = unick;
			sql_uinfo.u_avatarurl = uface;

			if (sql_uinfo.status != 0) { // 账号被封
				write_err(Respones.ILLEGAL_ACCOUNT, ret_func);
				return;
			}

			guest_login_success(ukey, sql_uinfo, ret_func);
		}
	});
	//END
}

//登陆成功了
function guest_login_success(u_token, data, ret_func) {

	//返回
	var ret = {};
	ret.status = Respones.OK;
	ret.uuid = data.u_uid;
	ret.unick = data.u_nickname;
	ret.usex = data.u_gender;
	ret.uface = data.u_avatarurl;
	ret.uvip = data.u_vip;
	ret.ulevel = data.u_level;
	ret.uexp = data.u_exp;
	ret.openid = data.u_openid;
	ret.ugold = data.u_gold;
	ret.udiamond = data.u_diamond;
	ret.guide = data.guide;

	//存储信息到redis
	var uinfo = {};
	uinfo.uuid = data.u_uid;
	uinfo.usex = data.u_gender;
	uinfo.unick = data.u_nickname;
	uinfo.uface = data.u_avatarurl;
	uinfo.uvip = data.u_vip;
	uinfo.ulevel = data.u_level;
	uinfo.uexp = data.u_exp;
	uinfo.openid = data.u_openid;
	uinfo.ugold = data.u_gold;
	uinfo.udiamond = data.u_diamond;
	uinfo.guide = data.guide;
	redis_center.set_uinfo_inredis(uinfo.uuid, uinfo);
	ret_func(ret);
}

//失败
function write_err(status, ret_func) {
	var ret = {};
	ret.status = status;
	ret_func(ret);
}
//游戏退出
function game_exit(uid, ret_func) {
	var body = {
		status: Respones.OK,
		uuid: uid,
	};
	ret_func(body);
}

module.exports = {
	guest_login: guest_login, //登陆 0是游客  1是微信 2是QQ
	game_exit: game_exit, //游戏退出
}