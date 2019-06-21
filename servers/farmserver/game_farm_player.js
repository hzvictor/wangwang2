/**

*/
var Cmd = require("../Cmd.js");
var Stype = require("../Stype.js");
var Respones = require("../Respones.js");
var mysql_game = require("../../framework/database/mysql_game.js");
var mysql_center = require("../../framework/database/mysql_center.js");
var redis_game = require("../../framework/database/redis_game.js");
var redis_center = require("../../framework/database/redis_center.js");
var utils = require("../../framework/utils/utils.js");
var log = require("../../framework/log/log.js");
var readyconfig = require("../../framework/config/readyconfig.js");
var leveltempdata = readyconfig.readLevelConfig();//读取等级数据配置文件
function game_farm_player(uuid) {
    this.uuid = uuid;
    this.unick = "";
    this.usex = 0;
    this.uface = "error";
    this.uvip = 0;
    this.ulevel = 1;
    this.uexp = 0;
    this.openid = "";
    this.ugold = 0;
    this.udiamond = 0;
    this.room_id = 0,
    //道具数据
    this.propdata = null;
    this.seeddata = null;
	this.session = null;
	this.proto_type = -1;

    this.has_kindheart = 0;//爱心值
    this.has_use_chanzi = 0;//使用过的铲子数量
    this.has_use_huafei = 0;//使用过的化肥数量
    this.has_use_shuihu = 0;//使用过的水壶数量
    this.has_rmb_refill = 0;//充值人民币数目
    this.has_feed_friend_pet = 0;//喂养好友宠物次数
    this.has_pet_id = 0;//拥有的宠物id 0代表没有宠物
    this.has_visit_max = 0;//农场被访问次数
    this.has_steal = 0;//偷取好友次数
    this.has_share = 0;//分享次数

}
//根据当前等级id获取等级升级配置数据
game_farm_player.prototype.save_attached_by_id = function(data){

    this.has_kindheart = data.kindheart;//爱心值
    this.has_use_chanzi = data.use_chanzi;//使用过的铲子数量
    this.has_use_huafei = data.use_huafei;//使用过的化肥数量
    this.has_use_shuihu = data.use_shuihu;//使用过的水壶数量
    this.has_rmb_refill = data.rmb_refill;//充值人民币数目
    this.has_feed_friend_pet = data.feed_friend_pet;//喂养好友宠物次数
    this.has_pet_id = data.pet_id;//拥有的宠物id 0代表没有宠物
    this.has_visit_max = data.has_visit;//农场被访问次数
    this.has_steal = data.steal;//偷取好友次数
    this.has_share = data.share;//分享次数
}
//根据当前等级id获取等级升级配置数据
game_farm_player.prototype.get_levelconfig_by_id = function(curlevel){
/**
 * id 当前等级索引
 * level 下一等级
 * maxexp 升级所需要经验
 */
    for(var i in leveltempdata) {
        //判断id符合条件
        if(curlevel == leveltempdata[i].id){
            return leveltempdata[i];
        }      
    }

    return null;    
}
//更新玩家经验和等级
game_farm_player.prototype.update_uexp_level = function (exp) {
    //更新经验值
    this.uexp += exp; 
    //得到当前等级对应的数据
    let data = this.get_levelconfig_by_id(this.ulevel);
    //当前经验 - 升级经验 计算差值
    let differ = this.uexp - data.maxexp;
    //计算是否可以升级(判断差值是否大于等于0)
    if(differ >= 0){
        this.uexp = differ;//当前经验等于差值经验
        this.ulevel = data.level;//当前等级等于下一等级
    }
    //更新redis数据库
    

    //更新数据库
    mysql_game.update_ugame_exp_level(this.uuid,this.ulevel,this.uexp);

    var body = {
        0:this.uvip,
        1:this.ulevel,
        2:this.uexp,
        3:this.ugold,
        4:this.udiamond,
    };
    this.send_cmd(Stype.GameFarm, Cmd.GameFarm.PLAYING_INFO, body);
}


//更新玩家钻石数目
game_farm_player.prototype.update_udiamond = function (diamond) {
	// 此处执行加法运算 因为减去的钻石传过来是负的 不需要单独考虑
    this.udiamond += diamond; //更新钻石
	//更新数据库
    mysql_game.update_ugame_diamond(this.uuid, this.udiamond);
	//更新redis数据库
    //redis_game.update_ugame_diamond(this.uuid, this.udiamond);
}
//更新玩家金币数目
game_farm_player.prototype.update_ugold = function (gold) {
    // 此处执行加法运算 因为减去的金币传过来是负的 不需要单独考虑
    this.ugold += gold; //更新金币
    //更新数据库
    mysql_game.update_ugame_gold(this.uuid, this.ugold);
    //更新redis数据库
    //redis_game.update_ugame_gold(this.uuid, this.ugold);
}
//保存更新种子数量信息
game_farm_player.prototype.update_seedinfo_count = function (tid, count) {

    //更新道具记录
    mysql_game.update_seedinfo_with_uuid_and_tid(this.uuid, tid, count, function (status) {
        if (status != Respones.OK) {
            log.error("更新种子数据失败");
            return;
        }

        log.info("更新种子数据成功");
    });
}

//保存更新图鉴点亮信息
game_farm_player.prototype.update_propinfo_type= function (tid, type) {

    //更新数据记录
    mysql_game.update_prop_type_with_uuid_and_tid(this.uuid, tid, type, function (status) {
        if (status != Respones.OK) {
            log.error("更新图鉴数据失败");
            return;
        }

        log.info("更新图鉴数据成功");
    });
}
//保存更新道具数量信息
game_farm_player.prototype.update_propinfo_count = function (tid, count) {

    //更新道具记录
    mysql_game.update_prop_with_uuid_and_tid(this.uuid, tid, count, function (status) {
        if (status != Respones.OK) {
            log.error("更新道具数据失败");
            return;
        }

        log.info("更新道具数据成功");
    });
}
//得到玩家游戏信息
game_farm_player.prototype.get_ugame_info = function () {

    let body = {
        "u_uid":this.uuid,
        "u_openid":this.openid,
        "u_nickname":this.unick,
        "u_avatarurl":this.uface,
        "u_gender":this.usex,
        "u_level":this.ulevel,
        "u_exp":this.uexp,
        "u_vip":this.uvip,
        "u_gold":this.ugold,
        "u_diamond":this.udiamond,
        "guide":this.guide,
    }

    return body;
}
//保存玩家游戏信息
game_farm_player.prototype.init_ugame_info = function (player_info) {

    this.uuid = player_info.u_uid;
    this.unick = player_info.u_nickname;
    this.usex = player_info.u_gender;
    this.uface = player_info.u_avatarurl;
    this.uvip = player_info.u_vip;
    this.ulevel = player_info.u_level;
    this.uexp = player_info.u_exp;
    this.openid = player_info.u_openid;
    this.ugold = player_info.u_gold;
    this.udiamond = player_info.u_diamond;
    this.guide = player_info.guide;
    if(!this.propdata){
         //保存玩家数据信息
        this.get_propinfo_by_uuid(this.uuid);
    }
   
    if(!this.seeddata){
        //保存玩家种子数据信息
        this.get_seedinfo_by_uuid(this.uuid);
    }
}
//保存玩家session信息
game_farm_player.prototype.init_session = function(session,proto_type){
    this.session = session;
    this.proto_type = proto_type;
}
//读取玩家种子数据信息
game_farm_player.prototype.get_seedinfo_by_uuid = function (uuid) {
    var self = this;
    mysql_game.get_seedinfo_by_uuid(uuid, function (status, data) {
        if (status != Respones.OK) {
            log.error("get_seedinfo_by_uuid error");
            write_err(status, ret_func);
            return;
        }

        if (data.length <= 0) { // 没找到该uuid的数据
            log.error("没找到该uuid的数据");
        } else {

            //所有记录
            var string = JSON.stringify(data);
            self.seeddata = JSON.parse(string);
            //this.seeddata = self.seeddata;
        }
    });
}

//读取玩家农场数据信息
game_farm_player.prototype.get_propinfo_by_uuid = function(uuid){
    var self = this;
	 mysql_game.get_propinfo_by_uuid(uuid, function (status, data) {
        if (status != Respones.OK) {
            log.error("get_propinfo_by_uuid error");
            write_err(status, ret_func);
            return;
        }

        if (data.length <= 0) { // 没找到该uuid的数据
           log.error("没找到该uuid的数据");
        } else {

            //所有记录
            var string = JSON.stringify(data);
            self.propdata = JSON.parse(string);
            //this.propdata = self.propdata;
        }
    });
}

//发送信息
game_farm_player.prototype.send_cmd = function(stype,ctype,body){
	if(!this.session){
		return;
	}
	this.session.send_cmd(stype,ctype,body,this.uuid,this.proto_type);
}
//根据tid更新玩家道具并返回data对象 
//模版id  数量  ischeck是否验证数量为0 type是否改变类型(不为1则替换p_type值)
game_farm_player.prototype.get_update_propinfo = function (tid,count,ischeck,type) {
    if(this.propdata){
        //根据农作物c_id得到界面对应的数据
        for (let j = 0; j < this.propdata.length; j++) {
            let p_id = this.propdata[j].p_id;//记录id
            let t_id = this.propdata[j].t_id;//模版id
            let p_type = this.propdata[j].p_type;//类型
            let p_count = this.propdata[j].p_count;//数量
            let u_uid = this.propdata[j].u_uid;//所属玩家uuid

            //查找指定道具
            if (t_id == tid) {
                //验证数量
                if(ischeck){
                    if(p_count <= 0){
                        return null;
                    }
                }
                p_count += count;//更新数量
                this.propdata[j].p_count = p_count;

                //更新数据库
                this.update_propinfo_count(t_id, p_count);

                if((p_type != 1) && (type == 1)){
                    this.propdata[j].p_type = 1;
                    this.update_propinfo_type(t_id, 1);//更新数据库

                    var body = {
                        0: Respones.OK,
                        1: this.propdata[j],//点亮的图鉴tid对应的data
                    }

                    //发送给自己
                    this.send_cmd(Stype.GameFarm, Cmd.GameFarm.LIGHT_UP_CROPS, body);
                }

                return this.propdata[j];
            }
        }
    }

    return null;
}
//根据tid更新玩家种子并返回data对象
game_farm_player.prototype.get_update_seedinfo = function (tid, count) {
    if (this.seeddata) {
        //根据农作物c_id得到界面对应的数据
        for (let j = 0; j < this.seeddata.length; j++) {
            let s_id = this.seeddata[j].s_id;//记录id
            let t_id = this.seeddata[j].t_id;//模版id
            let s_count = this.seeddata[j].s_count;//数量
            let u_uid = this.seeddata[j].u_uid;//所属玩家uuid

            //查找指定道具
            if (t_id == tid) {
                s_count += count;//更新数量
                this.seeddata[j].s_count = s_count;

                //更新数据库
                this.update_seedinfo_count(t_id, s_count);
                return this.seeddata[j];
            }
        }
    } else {
        return null;
    }
}
//根据tid检测玩家种子的数量
game_farm_player.prototype.check_seed_count = function (tid) {
    if (this.seeddata) {
        //根据农作物c_id得到界面对应的数据
        for (let j = 0; j < this.seeddata.length; j++) {
            let s_id = this.seeddata[j].s_id;//记录id
            let t_id = this.seeddata[j].t_id;//模版id
            let s_count = this.seeddata[j].s_count;//数量
            let u_uid = this.seeddata[j].u_uid;//所属玩家uuid

            //查找指定道具
            if (t_id == tid) {
                
                if(s_count > 0){
                    return true;
                }else {
                    return false;
                }
                
            }
        }
    } else {
        return false;
    }
}

module.exports = game_farm_player;