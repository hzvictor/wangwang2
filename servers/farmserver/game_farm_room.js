/**
农场房间管理
*/
var Cmd = require("../Cmd.js");
var Stype = require("../Stype.js");
var Respones = require("../Respones.js");
var proto_man = require("../../framework/network/proto_man.js");
var game_farm_model = require("./game_farm_model.js");
var utils = require("../../framework/utils/utils.js");
var log = require("../../framework/log/log.js");
var QuitReason = require("./game_farm_QuitReason.js");
var mysql_game = require("../../framework/database/mysql_game.js");
var mysql_center = require("../../framework/database/mysql_center.js");
var readyconfig = require("../../framework/config/readyconfig.js");
var proptempdata = readyconfig.readPropTemplateConfig();//读取农作物数据配置文件
var itemtempdata = readyconfig.readItemTemplateConfig();//读取物品数据配置文件
var honortempdata = readyconfig.readHonorTemplateConfig();//读取荣誉数据配置文件
var leveltempdata = readyconfig.readLevelConfig();//读取等级数据配置文件
//失败消息
function write_err(status, ret_func) {
	var ret = {};
	ret[0] = status;
	ret_func(ret);
}
function game_farm_room(farmid,farmplayer) {

    this.farmid = farmid;//农场主id
    this.landgold = 500;//扩建一块地价格
   
	this.INVIEW_SEAT=100;//允许旁观人数
    //获取游戏农场主玩家信息
    this.farmplayer = farmplayer;
    this.farmdata = [];//农场土地数据
    this.cropsdata = [];//农场农作物数据
    this.propdata = [];//仓库农作物数据
    this.cropslog = [];//农场操作记录 偷取 浇水 收获
    this.farmdynamic = [];//农场动态记录
    this.itemdata = [];//物品数据
    this.attachedinfo = null;//玩家附加信息
	this.inview_players = [];//当前旁观玩家
	for(let i = 0; i < this.INVIEW_SEAT; i++){
		this.inview_players.push(null);
	}

    //初始化玩家农场信息
    this.get_farm_room_data();

}
//初始化玩家农场信息
game_farm_room.prototype.get_farm_room_data = function () {

    //得到玩家附加信息数据记录
    this.get_attachedinfo_by_uuid(this.farmid);

    //得到农场土地数据记录
    this.get_landinfo_by_uuid(this.farmid);

    //土地农作物数据
    this.get_cropsinfo_by_uuid(this.farmid);

    //获取游戏土地农作物偷取信息
    this.get_cropslog_by_uuid(this.farmid);

    //获取游戏农场动态信息
    this.get_farmdynamic_by_uuid(this.farmid);

    //获取游戏物品数据信息
    this.get_iteminfo_by_uuid(this.farmid);
}
////不断循环的定时器  5 * 1000毫秒
//setInterval(this.update_landinfo, 5000);
//

//获取游戏农场主玩家信息
game_farm_room.prototype.get_uinfo_by_uuid = function (uuid) {
    var self = this;
    //获取用户信息
    mysql_center.get_uinfo_by_uuid(uuid, function (status, data) {
        if (status != Respones.OK) {
            log.error("get_uinfo_by_uuid =" + taguuid +"status error");
            return;
        }

        if (data.length <= 0) {
            log.error("get_uinfo_by_uuid=" + taguuid +" error");
            return;
        }

        //this.farmplayer = data[0];
        var string = JSON.stringify(data[0]);
        self.farmplayer = JSON.parse(string);
        //this.farmplayer = self.farmplayer;
    });
}


//更新农场农作物数据
game_farm_room.prototype.update_landinfo = function () {
    if (this.cropsdata) {
        //根据农作物c_id得到界面对应的数据
        for (let j = 0; j < this.cropsdata.length; j++) {
            let c_id = this.cropsdata[j].c_id;//农作物记录id
            let t_id = this.cropsdata[j].t_id;//农作物类型
            let c_status = this.cropsdata[j].c_status;//农作物状态 1是成熟
            let c_begintime = this.cropsdata[j].c_begintime;//农作物开始时间
            let c_endtime = this.cropsdata[j].c_endtime;//农作物成熟时间
            let c_count = this.cropsdata[j].c_count;//农作物当前数量
            let l_id = this.cropsdata[j].l_id;//土地记录id
            let u_uid = this.cropsdata[j].u_uid;//所属玩家uuid
            let c_operation = this.cropsdata[j].c_operation;//农作物操作记录

            //数量没了 进行删除
            if (c_count == 0) {
                //移除该数据
                this.cropsdata.splice(j, 1);
                continue;
            }
            //判断有没有成熟
            if (c_status == 0) {
                let thistime = utils.timestamp();//当前时间戳
                //当前时间戳 >= 结束时间戳 == 成熟了
                if (thistime >= c_endtime) {
                    this.cropsdata[j].c_status = 1;
                    var body = {
                        0: Respones.OK,
                        1: l_id,//网络土地记录id
                        2: this.cropsdata[j],//农作物记录对象
                    }
                    //广播给该农场的所有玩家有农作物成熟了
                    this.room_broadcast(Stype.GameFarm, Cmd.GameFarm.CROP_RIPENING, body, null);
                }
            }
        }

    }else{
		log.info(this.farmid+"农场没有农作物数据!!");
	}
    
}

//根据土地记录id得到该土地的相关操作日志
game_farm_room.prototype.get_landlog_by_landid = function(landid,cropid){

    //农场记录日志数据
    for(let i=0;i<this.cropslog.length;i++){
        let cid = this.cropslog[i].c_id;//农作物id
        let tid = this.cropslog[i].t_id;//农作物模版id
        let uid = this.cropslog[i].u_uid;//偷取玩家uuid
        let fid = this.cropslog[i].f_id;//农场主uuid
        let count = this.cropslog[i].count;//偷取数量
        let lid = this.cropslog[i].l_id;//土地id
        let time = this.cropslog[i].time;//当前时间戳

        if((landid == lid) && (this.userid == uid) && (cropid == cid)){
            return this.cropslog[i];
        }
    }
    return null;
}
//获取游戏土地信息
game_farm_room.prototype.get_landinfo_by_uuid = function (taguuid) {
    var self = this;
   mysql_game.get_landinfo_by_uuid(taguuid, function (status, data) {
        if (status != Respones.OK) {
            log.error("get_landinfo_by_uuid=" + taguuid +" status error");
            return;
        }

        if (data.length <= 0) { // 没找到该uuid的数据
            log.error("get_landinfo_by_uuid =" + taguuid +"  empty");
        }
        else {
            var string = JSON.stringify(data);
            self.farmdata = JSON.parse(string);
            //this.farmdata = self.farmdata;
        }
    });
}
//获取游戏土地农作物信息
game_farm_room.prototype.get_cropsinfo_by_uuid = function (taguuid) {
    var self = this;
    mysql_game.get_cropsinfo_by_uuid(taguuid, function (status, data) {
        if (status != Respones.OK) {
            log.error("get_cropsinfo_by_uuid =" + taguuid +"status error");
            return;
        }

        if (data.length <= 0) { // 没找到该uuid的数据
            log.error("get_cropsinfo_by_uuid=" + taguuid +" empty");
        }
        else {
            var string = JSON.stringify(data);
            self.cropsdata = JSON.parse(string);
            //this.cropsdata = self.cropsdata;
        }
    });
}
//得到玩家附加信息数据记录
game_farm_room.prototype.get_attachedinfo_by_uuid = function (taguuid) {
    var self = this;
    mysql_center.select_user_attached(taguuid, function (status, data) {
        if (status != Respones.OK) {
            log.error("select_user_attached = " + taguuid +" status error");
            return;
        }

        if (data.length <= 0) { // 没找到该uuid的数据
            log.error("select_user_attached = " + taguuid +" empty");
        }
        else {
            var string = JSON.stringify(data[0]);
            self.attachedinfo = JSON.parse(string);
            //this.attachedinfo = self.attachedinfo;
        }

    });
}

//获取游戏物品数据信息
game_farm_room.prototype.get_iteminfo_by_uuid = function (taguuid) {
    var self = this;
    mysql_center.select_item_info(taguuid, function (status, data) {
        if (status != Respones.OK) {
            log.error("select_item_info =" + taguuid +"status error");
            return;
        }

        if (data.length <= 0) { // 没找到该uuid的数据
            log.error("select_item_info =" + taguuid +" empty");
        }
        else {
            var string = JSON.stringify(data);
            self.itemdata = JSON.parse(string);
            //this.itemdata = self.itemdata;
        }
    });
}

//得到物品信息
game_farm_room.prototype.get_itemdata_by_tid = function (itemid){
    for(let i = 0;i< this.itemdata.length;i++){
        let tid = this.itemdata[i].i_tid;
        let count = this.itemdata[i].i_count;

        if(tid == itemid){
            return this.itemdata[i];
        }
   }

   return null;
}

//获取游戏农场动态信息
game_farm_room.prototype.get_farmdynamic_by_uuid = function (taguuid) {
    var self = this;
    mysql_center.select_farm_dynamic(taguuid, function (status, data) {
        if (status != Respones.OK) {
            log.error("select_farm_dynamic =" + taguuid +"status error");
            return;
        }

        if (data.length <= 0) { // 没找到该uuid的数据
            log.error("select_farm_dynamic =" + taguuid +" empty");
        }
        else {
            var string = JSON.stringify(data);
            self.farmdynamic = JSON.parse(string);
            //this.farmdynamic = self.farmdynamic;
        }
    });
}


//获取游戏土地农作物偷取信息
game_farm_room.prototype.get_cropslog_by_uuid = function (taguuid) {
    var self = this;
    mysql_game.select_croplog_by_fuid(taguuid, function (status, data) {
        if (status != Respones.OK) {
            log.error("select_croplog_by_fuid =" + taguuid +"status error");
            return;
        }

        if (data.length <= 0) { // 没找到该uuid的数据
            log.error("select_croplog_by_fuid =" + taguuid +" empty");
        }
        else {
            var string = JSON.stringify(data);
            self.cropslog = JSON.parse(string);
            //this.cropslog = self.cropslog;
        }
    });
}

//搜索旁观座位
game_farm_room.prototype.search_empty_seat_inview = function(){
	for(let i = 0; i < this.INVIEW_SEAT; i++){
		if(this.inview_players[i] == null){
			return i;
		}
	}
	return -1;
}
//玩家进入游戏农场房间
game_farm_room.prototype.do_enter_room = function(player,taguuid){

    log.info("player :", player.uuid, "--enter farm:", this.farmid);
   
   var inview_seat = this.search_empty_seat_inview();
	if(inview_seat < 0){
		log.info("inview_seat is full!!!!");
		return;//返回错误状态码 房间满了
	}

    if(taguuid != player.uuid){
         /**
         * [昵称]访问了你的农场
         */
        var farmtext = "『"+player.unick+"』访问了你的农场";
        var time = utils.timestamp();//当前时间戳
        //构建数据记录结构
        var dynamicdata = {
            "f_id":taguuid,
            "f_text":farmtext,
            "f_time":time,
            "f_status":1,
        };

        //保存农场动态记录
        this.farmdynamic.push(dynamicdata);
        //记录农场动态
        mysql_center.insert_farm_dynamic(taguuid,farmtext,time,1, function (status) {
            if (status != Respones.OK) {
                log.error("插入动态记录失败");
                return;
            }
        });

        //更新附加数据 被访问次数
        this.attachedinfo.has_visit += 1;
        mysql_center.update_attached_with_visit(taguuid,this.attachedinfo.has_visit,function (status) {
            if (status != Respones.OK) {
                log.error("更新附加数据 被访问次数");
                return;
            }
        });
    }else{
        //如果是自己则更新农场主数据
        this.farmplayer = player.get_ugame_info();
    }


	//记录玩家进来了
	this.inview_players[inview_seat] = player;
    //记录玩家所在的农场
    player.room_id = this.farmid;

    //农场房间信息消息
	var body = {
	    0: Respones.OK,
	    1: this.farmid,//农场主id
	    2: this.farmplayer,//农场主数据
	    3: this.farmdata,//农场土地数据
	    4: this.cropsdata,//农场土地农作物数据	
        5: this.cropslog,//农场偷盗动态
        6: utils.timestamp(),//当前时间戳
	};

    //访问是自己的农场 否则是别人的
    if(taguuid == player.uuid){
        player.send_cmd(Stype.GameFarm, Cmd.GameFarm.JOIN_FARM, body);
    }else{
        player.send_cmd(Stype.GameFarm, Cmd.GameFarm.ACCESS_FARM, body);
    }
	
}


//种植农作物
game_farm_room.prototype.planting_crops = function (player,mapindex,mapnetindex,cropindex,tdata, ret_func) {
  
    //验证玩家是否拥有该农作物种子
    let ischeck = player.check_seed_count(cropindex);
    if(!ischeck){
        //道具不存在
        write_err(Respones.PROP_IS_EMPTY, ret_func);
        return;
    }

    //得到土地数据
    var fdata = this.student_does_the_land_exist_by_mapid(mapindex, mapnetindex);

    //得到土地数据了
    if (fdata) {
        //是否是开垦的土地
        if (fdata.l_status == 1) {
            //并且没有农作物
            if (fdata.c_id == 0) {
                var self = this;//this传递
                /////执行种植逻辑//////////////
                let status = 0;//是否成熟了 1是成熟
                let begintime = utils.timestamp();//当前时间戳
                let mature_time = tdata.cycle;//成熟周期
                let endtime = begintime + mature_time * 60;//结束时间 = 当前时间戳 + 成熟周期(分)*60秒
                let count = tdata.max;//模版数量
                let landid = mapnetindex;
                //减去种子数量-1 就是增加-1
                let sdata = player.get_update_seedinfo(cropindex,-1);
                if(sdata){
                    log.info("种子"+cropindex+"数量 -1");
                }else{
                    log.error("种子"+cropindex+"数量 -1 失败");
                }
                //记录种植农作物数据
                mysql_game.insert_cropinfo_with_uuid(player.uuid, cropindex, status, begintime, endtime, count, landid, function (status) {
                    if (status != Respones.OK) {
                        log.error("记录种植农作物数据失败");
                        write_err(Respones.SYSTEM_ERR, ret_func);
                        return;
                    }
                    log.info("记录种植农作物数据成功!!!cropindex = :"+cropindex+"  landid = :"+landid);
                    //根据土地id查询农作物记录
                    mysql_game.select_cropsinfo_with_landid(mapnetindex, function (status, data) {
                        if (status != Respones.OK) {
                            log.error("查询种植农作物数据失败");
                            write_err(Respones.SYSTEM_ERR, ret_func);
                            return;
                        }

                        if (data.length <= 0) {
                            log.error("查询种植农作物数据失败");
                        } else {

                            var string = JSON.stringify(data[0]);
                            var cdata = JSON.parse(string);
                            
                            self.cropsdata.push(cdata);//农作物数据储存起来

                            let cropsid = cdata.c_id;//种植记录id

                            log.info("landid:", landid, " cropsid:", cropsid);
                            //更新土地上的农作物记录
                            mysql_game.update_land_with_crops(landid, cropsid, function (status) {
                                if (status != Respones.OK) {
                                    log.error("更新土地上的农作物记录失败");
                                    write_err(Respones.SYSTEM_ERR, ret_func);
                                    return;
                                }

                                //更新服务器动态数据
                                fdata.c_id = cropsid;//所种植的农作物id

                                var body = {
                                    0: Respones.OK,
                                    1: fdata,//土地数据
                                    2: cdata,//农作物记录对象
                                    3: sdata,//种子道具对象
                                    4: utils.timestamp(),//当前时间戳
                                }

                                //广播给该农场的所有玩家
                                self.room_broadcast(Stype.GameFarm, Cmd.GameFarm.PLANTING_CROPS, body, null);
                                return;
                            });

                        }
                    });
                });

            } else {
                //已经存在农作物
                write_err(Respones.LAND_HAVE_CROP, ret_func);
                return;
            }

        } else {
            //不是空地
            write_err(Respones.LAND_NOT_EMPTY, ret_func);
            return;
        }

    } else {
        //不存在的土地数据
        write_err(Respones.LAND_IS_EMPTY, ret_func);
        return;
    }
}
//判断土地是否存在
game_farm_room.prototype.student_does_the_land_exist_by_mapid = function (mapid,netmapid) {
    log.info("this.farmid:",this.farmid);
    var fdata = null;
    var index = 0;
    //得到所有的土地数据
    for (let i = 0; i < this.farmdata.length; i++) {
        let l_id = this.farmdata[i].l_id;//土地网络id
        let u_uid = this.farmdata[i].u_uid;//玩家uuid
        let l_mapid = this.farmdata[i].l_mapid;//第x块地
        let l_status = this.farmdata[i].l_status;//土地状态
        let l_level = this.farmdata[i].l_level;//等级
        let c_id = this.farmdata[i].c_id;//所种植的农作物id

        index++;

        //数据没问题 验证mapid  记录id
        if ((mapid == l_mapid) && (netmapid == l_id)) {
            fdata = this.farmdata[i];
            return fdata;
        }
    }
    if (index == this.farmdata.length) {
        return fdata;
    }  
}

//根据农作物c_id得到界面对应的数据
game_farm_room.prototype.whether_the_mature_by_cid = function (cid) {
    var cdata = null;
    var index = 0;
    //根据农作物c_id得到界面对应的数据
    for (let j = 0; j < this.cropsdata.length; j++) {
        let c_id = this.cropsdata[j].c_id;//农作物记录id
        let t_id = this.cropsdata[j].t_id;//农作物模版id
        let c_status = this.cropsdata[j].c_status;//农作物状态 1是成熟
        let c_begintime = this.cropsdata[j].c_begintime;//农作物开始时间
        let c_endtime = this.cropsdata[j].c_endtime;//农作物成熟时间
        let c_count = this.cropsdata[j].c_count;//农作物当前数量
        let l_id = this.cropsdata[j].l_id;//土地记录id
        let u_uid = this.cropsdata[j].u_uid;//所属玩家uuid
        let c_operation = this.cropsdata[j].c_operation;//农作物操作记录
        index++;
        if (cid ==c_id){
            cdata = this.cropsdata[j];
            return cdata;
        }  
    }

    if (index == this.cropsdata.length) {
         return cdata;
    }
}
//收获农作物
game_farm_room.prototype.harvest_crops = function (player, body, ret_func) {

    var mapindex = body[0];//玩家土地index
    var mapnetindex = body[1];//土地网络记录索引
    var cropid = body[2];//收获的农作物数据库记录id

    // //首先验证有没有被偷取过
    // let logdata = this.get_landlog_by_landid(mapnetindex,cropid);
    // if(logdata){
    //     //已经偷取过了
    //     write_err(Respones.CROP_IS_STEAL, ret_func);
    //     return;
    // }

    //得到土地数据
    var fdata = this.student_does_the_land_exist_by_mapid(mapindex, mapnetindex);

    //得到土地数据了
    if (fdata) {
        //判断土地上的农作物是不是有记录
        if (fdata.c_id != cropid) {
            //农作物不存在
            write_err(Respones.CROP_IS_EMPTY, ret_func);
            return;
        }

        //查找植物记录
        var cdata = this.whether_the_mature_by_cid(cropid);
        if (cdata && (fdata.c_id != 0)) {
            //成熟了
            if (cdata.c_status == 1) {
                var self = this;//this传递
                /////////执行收获逻辑//////////////
                var body = {
                    0: Respones.OK,
                    1: mapindex,//第x块地
                    2: mapnetindex,//网络土地记录id
                    3: 1,//收获数量 (不是自己的农场则默认偷取一个)
                    4: fdata,//该土地数据
                    5: cdata,//该农作物数据
                    6: utils.timestamp(),//当前时间戳
                }
                //判断该农场是不是自己承包的
                if (player.uuid == this.farmid) {
                    //自己承包的农场 直接收获农作物
                    body[3] = cdata.c_count;
                    cdata.c_count = 0;//全部摘取数量置零 == 下一个定时器执行时候会删除该数据

                    //更新玩家数量
                    body[5] = player.get_update_propinfo(cdata.t_id, body[3],false,1);

                    //更新土地农作物状态
                    fdata.c_id = 0;

                     //获取农作物 模版
                     var cropmodel = self.get_propdata_by_id(cdata.t_id);
                    //经验等级变更 偷取经验+1
                    player.update_uexp_level(cropmodel.exp);
                    self.farmplayer.u_exp = player.uexp;
                    self.farmplayer.u_level = player.ulevel;

                    //删除数据库农作物记录
                    mysql_game.delete_cropsinfo_with_cropsid(cropid);
                   
                    //更新数据库土地的农作物记录
                    mysql_game.update_land_with_crops(fdata.l_id, 0, function (status) {
                        if (status != Respones.OK) {
                            log.error("更新土地上的农作物0记录失败");
                            return;
                        }
                    }); 

                } else {
                    //已经被偷取过了 给他留点吧
                    if (cdata.c_operation == 1) {
                        //已经被偷取过了,请手下留情
                        log.info("已经被偷取过了,请手下留情:");
                        write_err(Respones.CROP_TOO_LITTLE, ret_func);
                        return;
                    } else {
                        //不是自己的则只能偷取一个 数量减少1
                        cdata.c_count = cdata.c_count - 1;
                        cdata.c_operation = 1;
                        //更新玩家数量
                        body[5] = player.get_update_propinfo(cdata.t_id, 1,false,1);

                        //更新数据库农作物数量
                        mysql_game.update_cropinfo_with_cid(cdata.c_id,cdata.t_id,cdata.c_count,cdata.c_begintime,cdata.c_endtime,function (status) {
                            if (status != Respones.OK) {
                                log.error("更新数据库农作物数量失败");
                                write_err(Respones.SYSTEM_ERR, ret_func);
                                return;
                            }
                        });
                        //更新数据库农作物操作标志
                        mysql_game.update_cropinfo_operation_with_cid(cdata.c_id,cdata.t_id,1,function (status) {
                            if (status != Respones.OK) {
                                log.error("更新数据库农作物操作标志失败");
                                write_err(Respones.SYSTEM_ERR, ret_func);
                                return;
                            }
                        });

                        //经验等级变更 偷取经验+1
                        player.update_uexp_level(1);
                        self.farmplayer.u_exp = player.uexp;
                        self.farmplayer.u_level = player.ulevel;
                        
                        //////执行偷取记录逻辑////////////
                        let cid = cdata.c_id;//农作物id
                        let tid = cdata.t_id;//农作物模版id
                        let uid = player.uuid;//偷取玩家uuid
                        let fid = self.farmid;//农场主uuid
                        let count = 1;//偷取数量
                        let lid = mapnetindex;
                        let time = utils.timestamp();//当前时间戳

                        var croplogdata = {
                            "c_id":cid,
                            "t_id":tid,
                            "u_uid":uid,
                            "f_id":fid,
                            "count":count,
                            "l_id":lid,
                            "time":time,
                        };
                        //保存偷取记录
                        self.cropslog.push(croplogdata);
                        //广播给该农场的所有玩家有人偷取了
                        self.room_broadcast(Stype.GameFarm, Cmd.GameFarm.STEAL_CROPS, croplogdata, null);

                        //插入数据库
                        mysql_game.insert_croplog_with_cid(cid,tid,lid,uid,self.farmid,count,time, function (status) {
                            if (status != Respones.OK) {
                                log.error("插入偷取记录失败");
                                write_err(Respones.SYSTEM_ERR, ret_func);
                                return;
                            }

                            /**
                             * [昵称]偷取了你[数量]棵[农作物]
                             */
                            let cropmodel = self.get_propdata_by_id(tid);
                            var farmtext = "『"+player.unick+"』偷取了你『"+count+"』棵『"+cropmodel.name+"』";
                            //记录农场动态
                            mysql_center.insert_farm_dynamic(self.farmid,farmtext,time,1, function (status) {
                                if (status != Respones.OK) {
                                    log.error("插入动态记录失败");
                                    write_err(Respones.SYSTEM_ERR, ret_func);
                                    return;
                                }
                                //构建数据记录结构
                                var dynamicdata = {
                                    "f_id":self.farmid,
                                    "f_text":farmtext,
                                    "f_time":time,
                                    "f_status":1,
                                };

                                //保存农场动态记录
                                self.farmdynamic.push(dynamicdata);
                            });


                        });  


                        //偷取次数+1
                        self.attachedinfo.steal += 1;
                        //更新附加数据
                        mysql_center.update_attached_with_steal(player.uuid,self.attachedinfo.steal, function (status) {
                            if (status != Respones.OK) {
                                log.error("插入附加记录失败");
                                write_err(Respones.SYSTEM_ERR, ret_func);
                                return;
                            }
                        });
                        /////////the end ////////////////
                    }
                }
                body[6] = utils.timestamp();//当前时间戳
                //广播给该农场的所有玩家
                self.room_broadcast(Stype.GameFarm, Cmd.GameFarm.HARVEST_CROPS, body, null);
                return;
            } else {
                //农作物未成熟
                log.info("农作物未成熟");
                write_err(Respones.CROP_IMMATURE, ret_func);
                return;
            }

        }else{
            //农作物不存在
            write_err(Respones.CROP_IS_EMPTY, ret_func);
            return;
        }

    } else {
        //不存在的土地数据
        write_err(Respones.LAND_IS_EMPTY, ret_func);
        return;
    }
}

//根据荣誉模版id得到对应的荣誉数据
game_farm_room.prototype.get_honortemp_by_id = function(hid){
/**
 * 序号   id
 * 成就名称 name
 * 描述   text
 * 奖励钻石 reward_diamond
 * 奖励金币 reward_gold
 * 要求金币 has_gold
 * 要求钻石 has_diamond
 * 要求等级 has_level
 * 要求已种植类型数量    has_crops
 * 要求爱心值    has_kindheart
 * 要求土地数    has_lands
 * 要求使用过的铲子数    has_use_chanzi
 * 使用过化肥数   has_use_huafei
 * 使用过水壶数   has_use_shuihu
 * 要求好友数量   has_friend
 * 要求充值消费数  has_rmb_refill
 * 喂养好友宠物次数 has_feed_friend_pet
 * 拥有宠物 has_pet
 * 要求农场被访问次数    has_visit_max
 * 偷取好友次数   has_steal
 * 分享次数 has_share
 */
    for(var i in honortempdata) {
        var id = honortempdata[i].id;
        //判断id符合条件
        if(hid == id){
            return honortempdata[i];
        }      
    }

    return null;    
}
//根据模版id得到对应的道具数据
game_farm_room.prototype.get_propdata_by_id = function(propid){

    // "id": 100239,
    // "name": "沙漠玫瑰",
    // "max": 4,
    // "bygold": 30,
    // "sellgold": 15,
    // "imageid": 20239,
    // "content": "这里是花的描述啊,这里一共是多少个字呢?我也没数清楚啊"
    for(var i in proptempdata) {
        var id = proptempdata[i].id;
        //判断id符合条件
        if(propid == id){
            return proptempdata[i];
        }      
    }

    return null;    
}
//点亮图鉴
game_farm_room.prototype.light_up_crops = function (player,tid,ret_func) {
     //更新道具数量
    var data = player.get_update_propinfo(tid, -1,true,1);
    if (data) {
       var body = {
            0: Respones.OK,
            1: data,//点亮的图鉴tid对应的data
        }

        //发送给自己
        player.send_cmd(Stype.GameFarm, Cmd.GameFarm.LIGHT_UP_CROPS, body);
    }
}

//卖出物品
game_farm_room.prototype.sell_crops = function (player, propid,propcount,sellgold, ret_func) {

    //更新道具数量
    var data = player.get_update_propinfo(propid, propcount,true,-1);
    if (data) {
        //更新成功了 玩家增加金币了
        player.update_ugold(sellgold);
        this.farmplayer.u_gold = player.ugold;
        var body = {
            0: Respones.OK,
            1: player.ugold,//自己的金币信息
            2: data,//卖出的农作物
        }

        //发送给自己
        player.send_cmd(Stype.GameFarm, Cmd.GameFarm.SELL_CROPS, body);


    } else {
        log.error("更新道具失败");
        //道具不存在
        write_err(Respones.PROP_IS_EMPTY, ret_func);
        return;
    }

}
//扩建土地
game_farm_room.prototype.expansion_land = function (player,body,ret_func) {
    if(this.landgold > player.ugold){
        log.error("金币不足");
        write_err(Respones.GOLD_IS_NOT_ENOUGH, ret_func);
        return;
    }

    var mapindex = body[0];//玩家土地index
    var mapnetindex = body[1];//土地网络记录索引

    //得到土地数据
    var fdata = this.student_does_the_land_exist_by_mapid(mapindex, mapnetindex);
    if(fdata){
        let tgold = -1 * this.landgold;
        //更新成功了 玩家购买减少金币了
        player.update_ugold(tgold);
        this.farmplayer.u_gold = player.ugold;
        //更新土地状态
        fdata.l_status = 1;

        //更新数据库土地状态
        mysql_game.update_land_state_landid(fdata.l_id, 1, function (status) {
            if (status != Respones.OK) {
                log.error("更新土地状态失败");
                write_err(Respones.SYSTEM_ERR, ret_func);
                return;
            }
        });

        var body = {
            0: Respones.OK,
            1: fdata,//该土地记录
            2: tgold,//扣除的金币
        }
        //发送给自己
        player.send_cmd(Stype.GameFarm, Cmd.GameFarm.EXPANSION_LAND, body);
    } else {
        //不存在的土地数据
        write_err(Respones.LAND_IS_EMPTY, ret_func);
        return;
    }
}

//购买物品
game_farm_room.prototype.buy_seeds = function (player,  propid,propcount, buygold, ret_func) {

    //当前金币 - 扣除金币 < 0 说明金币不足
    if (buygold + player.ugold < 0) {
        log.error("金币不足");
        write_err(Respones.GOLD_IS_NOT_ENOUGH, ret_func);
        return;
    }

    //更新道具数量
    var data = player.get_update_seedinfo(propid, propcount);
    if (data) {
        //更新成功了 玩家购买减少金币了
        player.update_ugold(buygold);
        this.farmplayer.u_gold = player.ugold;

        var body = {
            0: Respones.OK,
            1: data,//该道具记录
            2: buygold,//扣除的金币
        }
        
        //发送给自己
        player.send_cmd(Stype.GameFarm, Cmd.GameFarm.BUY_SEEDS, body);
        
    } else {
        log.error("道具不存在");
        write_err(Respones.PROP_IS_EMPTY, ret_func);
        return;
    }

}

//离开房间
game_farm_room.prototype.do_exit_room = function (player, quit_reason) {

    //把玩家从旁观列表删除
    for (let i = 0; i < this.inview_players.length; i++) {
        if (this.inview_players[i] == player) {
            this.inview_players[i] = null;
        }
    }

    log.info("player :", player.uuid, " -- exit room:", this.farmid);

    player.room_id = -1;//玩家离开房间 清理房间号

    //如果是自己的农场并且没有完成引导则强制完成新手引导
    if((player.uuid == this.farmid) && (this.farmplayer.guide == 1)){
        log.info("强制完成新手引导");
        //更新数据库完成了新手引导
        mysql_game.update_ugame_guide(player.uuid);
        this.guide = 0;
        this.farmplayer.guide = 0;
    }
    
}

//农场动态数据记录
game_farm_room.prototype.farm_dynamic = function (player){
    //直接广播不做任何处理
    player.send_cmd(Stype.GameFarm, Cmd.GameFarm.FARM_DYNAMIC, this.farmdynamic);
}

//使用物品道具
game_farm_room.prototype.use_propitem = function (player,body,ret_func){
    let mapindex = body[0];
    let mapnetindex = body[1];
    let itemid = body[2];

    let item = this.get_itemdata_by_tid(itemid);
    if(item){
        ////////使用道具逻辑//////////
        let count = item.i_count;//道具数量
        if(count <= 0){
           log.error("物品数量不足");
            write_err(Respones.ITEM_TOO_LITTLE, ret_func);
            return;
        }

        /////////执行道具的浇水 施肥 铲除效果逻辑////////
        //得到土地数据
        var fdata = this.student_does_the_land_exist_by_mapid(mapindex, mapnetindex);
        //得到土地数据了
        if (fdata) {
            //判断土地上的农作物是不是有记录
            if (fdata.c_id == 0) {
                //农作物不存在
                write_err(Respones.CROP_IS_EMPTY, ret_func);
                return;
            }

             //查找植物记录
            var cdata = this.whether_the_mature_by_cid(fdata.c_id);
            if (cdata) {
                var self = this;
                let thistip = "";//提示语
                ///////道具单独处理/////////
                if(itemid == 20001){
                    //道具铲子: 铲除当前农作物
                    //如果存在农作物则删除农作物
                    cdata.c_count = 0;//数量置零 == 下一个定时器执行时候会删除该数据
                    //删除数据库农作物记录
                    mysql_game.delete_cropsinfo_with_cropsid(fdata.c_id);
                
                    //删除土地农作物记录
                    fdata.c_id = 0;
                    //更新数据库土地的农作物记录
                    mysql_game.update_land_with_crops(fdata.l_id, 0, function (status) {
                        if (status != Respones.OK) {
                            log.error("更新土地上的农作物0记录失败");
                            write_err(Respones.SYSTEM_ERR, ret_func);
                            return;
                        }
                    }); 

                    log.info("成功铲除当前农作物!");

                    //使用铲子次数+1
                    self.attachedinfo.use_chanzi += 1;
                    //更新附加数据
                    mysql_center.update_attached_with_use_chanzi(player.uuid,self.attachedinfo.use_chanzi, function (status) {
                        if (status != Respones.OK) {
                            log.error("插入附加记录失败");
                            write_err(Respones.SYSTEM_ERR, ret_func);
                            return;
                        }
                    });

                }else if(itemid == 20003){
                    //道具肥料 增加农作物50%产量
                    let c_id = cdata.c_id;//农作物记录id
                    let t_id = cdata.t_id;//农作物模版id
                    let c_status = cdata.c_status;//农作物状态 1是成熟
                    let c_begintime = cdata.c_begintime;//农作物开始时间
                    let c_endtime = cdata.c_endtime;//农作物成熟时间
                    let c_count = cdata.c_count;//农作物当前数量
                    let l_id = cdata.l_id;//土地记录id
                    let u_uid = cdata.u_uid;//所属玩家uuid
                    //根据状态判断农作物是否成熟了
                    if(c_status == 1){
                        log.warn("农作物成熟后无法使用道具!");
                        //农作物成熟后无法使用道具
                        write_err(Respones.CROP_IS_IMMATURE, ret_func);
                        return;
                    }
                    //根据时间判断农作物是否成熟了
                    let thistime = utils.timestamp();//当前时间戳
                    //当前时间戳 >= 结束时间戳 == 成熟了
                    if (thistime >= c_endtime) {
                        //cdata.c_status = 1; //标记成熟了
                        log.warn("农作物成熟后无法使用道具!");
                        //农作物成熟后无法使用道具
                        write_err(Respones.CROP_IS_IMMATURE, ret_func);
                        return;
                    }

                    //得到道具模版数据
                    let cropmodel = self.get_propdata_by_id(t_id);

                    //判断有没有使用过道具 当前产量 大于预计产量 说明使用了道具
                    if(cdata.c_count > cropmodel.max){
                        log.warn("已经增产过了,做人不要太贪心!");
                        //已经增产过了,做人不要太贪心
                        write_err(Respones.CROP_IS_USE_ITEM, ret_func);
                        return;
                    }
                    
                    //得到预计产量 增加50%
                    cdata.c_count = cdata.c_count * 1.5;
                    log.info("预计产量"+cropmodel.max+" 增加50% ="+cdata.c_count);

                    //更新数据库农作物数量
                    mysql_game.update_cropinfo_with_cid(cdata.c_id,cdata.t_id,cdata.c_count,cdata.c_begintime,cdata.c_endtime,function (status) {
                        if (status != Respones.OK) {
                            log.error("更新数据库农作物数量失败");
                            write_err(Respones.SYSTEM_ERR, ret_func);
                            return;
                        }
                    });

                    //使用化肥次数+1
                    self.attachedinfo.use_huafei += 1;
                    //更新附加数据
                    mysql_center.update_attached_with_use_huafei(player.uuid,self.attachedinfo.use_huafei, function (status) {
                        if (status != Respones.OK) {
                            log.error("插入附加记录失败");
                            write_err(Respones.SYSTEM_ERR, ret_func);
                            return;
                        }
                    });

                }else if(itemid == 20004){
                    //道具水壶 加速农作物成熟时间 加速1分
                    
                    let c_id = cdata.c_id;//农作物记录id
                    let t_id = cdata.t_id;//农作物模版id
                    let c_status = cdata.c_status;//农作物状态 1是成熟
                    let c_begintime = cdata.c_begintime;//农作物开始时间
                    let c_endtime = cdata.c_endtime;//农作物成熟时间
                    let c_count = cdata.c_count;//农作物当前数量
                    let l_id = cdata.l_id;//土地记录id
                    let u_uid = cdata.u_uid;//所属玩家uuid
                    //根据状态判断农作物是否成熟了
                    if(c_status == 1){
                        //农作物成熟后无法使用道具
                        write_err(Respones.CROP_IS_IMMATURE, ret_func);
                        return;
                    }
                    //根据时间判断农作物是否成熟了
                    let thistime = utils.timestamp();//当前时间戳
                    //当前时间戳 >= 结束时间戳 == 成熟了
                    if (thistime >= c_endtime) {
                        //cdata.c_status = 1; //标记成熟了
                        //农作物成熟后无法使用道具
                        write_err(Respones.CROP_IS_IMMATURE, ret_func);
                        return;
                    }
                    let begintime = cdata.c_begintime - 1 * 60;//农作物种植时间 减少1分钟
                    let endtime = cdata.c_endtime - 1 * 60;//农作物成熟时间 减少1分钟
                    log.info("当前成熟时间:",cdata.c_endtime," 加速1分钟后预计成熟时间",endtime);
                    //可以加速
                    cdata.c_begintime = begintime;
                    cdata.c_endtime = endtime;

                    //更新农作物数据
                    mysql_game.update_cropinfo_with_cid(cdata.c_id,cdata.t_id,cdata.c_count,cdata.c_begintime,cdata.c_endtime,function (status) {
                        if (status != Respones.OK) {
                            log.error("更新数据库农作物数量失败");
                            write_err(Respones.SYSTEM_ERR, ret_func);
                            return;
                        }
                    });

                    //使用水壶次数+1
                    self.attachedinfo.use_shuihu += 1;
                    //更新附加数据
                    mysql_center.update_attached_with_use_shuihu(player.uuid,self.attachedinfo.use_shuihu, function (status) {
                        if (status != Respones.OK) {
                            log.error("插入附加记录失败");
                            write_err(Respones.SYSTEM_ERR, ret_func);
                            return;
                        }
                    });

                }
                //道具数量-1
                item.i_count -= 1;//数量-1

                //更新数据库
                mysql_center.update_item_info(player.uuid, itemid, item.i_count, function (status) {
                    if (status != Respones.OK) {
                        log.error("更新物品道具数量失败");
                        return;
                    }
                });
                ////////广播内容////////
                var body = {
                    0:Respones.OK,
                    1:fdata,//土地数据
                    2:cdata,//农作物数据
                    3:item,//当前道具数据
                    4:player.uuid,//当前玩家uuid
                    5:utils.timestamp(),
                };
                //广播农作物使用道具成功了
                self.room_broadcast(Stype.GameFarm, Cmd.GameFarm.USE_ITEM, body, null);
            }else{
                //农作物不存在
                write_err(Respones.CROP_IS_EMPTY, ret_func);
                return;
            }
        } else {
            //不存在的土地数据
            write_err(Respones.LAND_IS_EMPTY, ret_func);
            return;
        }
    }else {
        log.error("物品不存在");
        write_err(Respones.ITEM_IS_EMPTY, ret_func);
        return;
    }
}
////购买物品道具
game_farm_room.prototype.buy_propitem = function (player,itemid,ret_func){

    let item = this.get_itemdata_by_tid(itemid);
    if(item){
        //得到物品的价格
        var tdiamond = 0;
        for (var i in itemtempdata) {
            let tid = itemtempdata[i].id;
            if(tid == itemid){
                tdiamond = itemtempdata[i].diamond;
                break;
            }
        }
        
        log.info("物品的价格:",tdiamond);
        log.info("玩家拥有钻石:",player.udiamond);
        //判断钻石是否满足条件
        if(player.udiamond >= tdiamond){
            //道具数量增加 1
            item.i_count += 1;//数量+1

            //更新数据库
            mysql_center.update_item_info(player.uuid, itemid, item.i_count, function (status) {
                if (status != Respones.OK) {
                    log.error("更新物品道具数量失败");
                    write_err(Respones.SYSTEM_ERR, ret_func);
                    return;
                }
            });

            //扣除对应的钻石数
            tdiamond = -1 * tdiamond;
            player.update_udiamond(tdiamond);
            this.farmplayer.u_diamond = player.udiamond;
            ////////广播内容////////
            var body = {
                0:Respones.OK,
                1:item,//当前道具数据
                2:player.udiamond,//玩家身上钻石数
            };
            //广播物品购买成功了
            player.send_cmd(Stype.GameFarm, Cmd.GameFarm.BUY_ITEM, body);
            
        }else{
            log.error("钻石不足");
            write_err(Respones.DIAMOND_IS_NOT_ENOUGH, ret_func);
            return;
        }
        
    }else {
        log.error("物品不存在");
        //获取游戏物品数据信息
        this.get_iteminfo_by_uuid(farmid);
        write_err(Respones.ITEM_IS_EMPTY, ret_func);
        return;
    }
}
//好友添加操作信息
game_farm_room.prototype.agree_or_refuse = function (player,uuid,friendid,operation,ret_func){

    var body = {
        0:Respones.OK,
        1:friendid,//好友id
        2:operation,//操作类型 2是删除好友
        3:1,//好友状态
        4:0,//消息通知
    }
    //拒绝添加好友
    if(operation == 2){
        //删除好友信息
        mysql_center.delete_friend_with_uuid(uuid,friendid,function (status) {
            if (status != Respones.OK) {
                log.error("删除好友信息失败!!!");
                write_err(status, ret_func);
                return;
            }

            if (player) {
                player.send_cmd(Stype.GameFarm, Cmd.GameFarm.AGREE_OR_REFUSE, body);
            }

        });


    }else if(operation == 1){
        //同意添加好友
        mysql_center.update_friend_by_operation(uuid,friendid,1,0,function (status) {
            if (status != Respones.OK) {
                log.error("好友添加操作信息失败!!!");
                write_err(status, ret_func);
                return;
            }

            if (player) {
                player.send_cmd(Stype.GameFarm, Cmd.GameFarm.AGREE_OR_REFUSE, body);
            }
        });
    }
   

}
//添加好友  isactive是否在线
game_farm_room.prototype.add_haoyouinfo_by_uuid = function (player,uuid,friendid,friendname,notice,ret_func){

    mysql_center.get_friend_by_friendid(uuid,friendid, function (status, data) {
        if (status != Respones.OK) {
            log.error("get_friend_by_friendid =" + friendid +"status error");
            write_err(Respones.SYSTEM_ERR, ret_func);
            return;
        }

        if (data.length <= 0) {
            //没有好友 添加好友
            var intimacy = 0;//好友亲密度
            var time = utils.timestamp();//当前时间戳
            mysql_center.insert_friend_with_uuid(uuid,friendid,time,0,notice,intimacy, function (status) {
                if (status != Respones.OK) {
                    log.info("好友信息插入失败!!!");
                    write_err(Respones.FRIEND_FAIL, ret_func);
                    return;
                }

                var data = {
                    "playerid":uuid,
                    "playername":friendname,
                    "friendid":friendid,
                    "time":time,
                    "status":0,
                    "notice":notice,
                    "intimacy":intimacy,
                }

                //添加好友信息成功了
                var ret = {
                    0:Respones.OK,
                    1:data,
                };
                
                //是否需要通知 好友不在线不需要通知
                if(player){
                    if(notice == 1){
                        //直接广播不做任何处理
                        player.send_cmd(Stype.GameFarm, Cmd.GameFarm.NOTICE_ADD_HAOYOU, ret);
                    }else{
                        player.send_cmd(Stype.GameFarm, Cmd.GameFarm.ADD_HAOYOU_INFO, ret);
                    }

                   
                }
                
                return;
            });
        }else{
             log.error("已经是好友了!!!");
            //被动添加不需要通知
            if(notice == 1){
                return;
            }
            write_err(Respones.FRIEND_IS_HAVE, ret_func);
        }
       
    });

}
//计算拥有农作物类型数
game_farm_room.prototype.get_has_crops = function (){ 
        let addcount = 0;
        for (let i = 0; i < this.farmdata.length; i++) {
            let l_status = this.farmdata[i].l_status;
            if(l_status == 1){
                addcount++;
            }
        }

        return addcount;
}
//计算土地拥有数目
game_farm_room.prototype.get_land_count = function (){ 
        let addcount = 0;
        for (let i = 0; i < this.farmdata.length; i++) {
            let l_status = this.farmdata[i].l_status;
            if(l_status == 1){
                addcount++;
            }
        }

        return addcount;
}

//获取好友数目
game_farm_room.prototype.get_friend_count = function (uuid){ 

    mysql_center.get_all_friend_with_status(uuid, function (status, data) {
        if(status != Respones.OK){
            log.error("status:",status);
            return;
        }
        if (data.length <= 0) { // 没找到该uuid的数据
            log.warn("没找到该uuid的好友数据");
            return 0;
        }

        var string = JSON.stringify(data);
        var friendlist = JSON.parse(string);
        //this.friendlist = self.friendlist;
        return friendlist.length;
    });
}

//判断是否满足完成条件
game_farm_room.prototype.is_complete_the_task = function (tid,player){ 
    let honordata = this.get_honortemp_by_id(tid);
    let iscomplete = true;
    // 要求金币 has_gold
    if(player.ugold < honordata.has_gold){
        iscomplete = false;
    }

    //要求钻石  has_diamond
    if(player.udiamond < honordata.has_diamond){
        iscomplete = false;
    }

    //要求等级  has_level
    if(player.ulevel < honordata.has_level){
        iscomplete = false;
    } 
    //要求爱心值 has_kindheart
    if(player.has_kindheart < honordata.has_kindheart){
        iscomplete = false;
    }
    //要求土地数 has_lands
    if(this.get_land_count() < honordata.has_lands){
        iscomplete = false;
    }
    //要求使用过的铲子数 has_use_chanzi
    if(player.has_use_chanzi < honordata.has_use_chanzi){
        iscomplete = false;
    }
    //使用过化肥数    has_use_huafei
    if(player.has_use_huafei < honordata.has_use_huafei){
        iscomplete = false;
    }
    //使用过水壶数    has_use_shuihu
    if(player.has_use_shuihu < honordata.has_use_shuihu){
        iscomplete = false;
    }
    // 要求好友数量   has_friend
    if(this.get_friend_count(player.uuid) < honordata.has_friend){
        iscomplete = false;
    }

    //要求充值消费数   has_rmb_refill
    if(player.has_rmb_refill < honordata.has_rmb_refill){
        iscomplete = false;
    }
    //喂养好友宠物次数  has_feed_friend_pet
    if(player.has_feed_friend_pet < honordata.has_feed_friend_pet){
        iscomplete = false;
    }
    //拥有宠物  has_pet
    if(player.has_pet_id < honordata.has_pet){
        iscomplete = false;
    }
    //要求农场被访问次数 has_visit_max
    if(player.has_visit_max < honordata.has_visit_max){
        iscomplete = false;
    }
    // 偷取好友次数   has_steal
    if(player.has_steal < honordata.has_steal){
        iscomplete = false;
    }
    // 分享次数 has_share
    if(player.has_share < honordata.has_share){
        iscomplete = false;
    }

    var body = {
        0:iscomplete,
        1:honordata,
    }

    return body;
},
//解锁荣誉成就
game_farm_room.prototype.unlock_honor = function (player,body,ret_func){
    
    let id = body[0];
    let hid = body[1];
    let data = this.is_complete_the_task(hid,player);

    let iscomplete = data[0];//是否满足解锁了
    let template = data[1];//模版数据

    if(iscomplete){

        //开始解锁
        var time = utils.timestamp();//当前时间戳
        mysql_center.update_honor_info(player.uuid, hid, 1,time, function (status) {
            if (status != Respones.OK) {
                log.error("解锁荣誉信息失败!!!");
                write_err(status, ret_func);
                return;
            }
            var honor = {
                0:Respones.OK,
                1:id,
                2:hid,
                3:time,
            }
            //直接广播不做任何处理
            player.send_cmd(Stype.GameFarm, Cmd.GameFarm.UNLOCK_HONOR, honor);
            return;
        });
    }else{
        log.error("不满足解锁条件");
        write_err(Respones.UNQUALIFIED, ret_func);
    }
}
//获取附加信息
game_farm_room.prototype.get_attachedinfo = function (player,ret_func){
    
    //保存附加信息
    player.save_attached_by_id(this.attachedinfo);
    //直接广播不做任何处理
    player.send_cmd(Stype.GameFarm, Cmd.GameFarm.ATTACHED_INFO, this.attachedinfo);
}

//好友的操作数据记录
game_farm_room.prototype.friend_operation = function (player,operadata){
    
    //直接广播不做任何处理
    player.send_cmd(Stype.GameFarm, Cmd.GameFarm.FRIEND_OPERATION, operadata);
}

//获取一些农场数据用来计算显示操作标志
game_farm_room.prototype.operation_cropsdata = function (){
    var body = {
        "farmid":this.farmid,
        "cropsdata": this.cropsdata,
        "cropslog": this.cropslog,
        "farmplayer": this.farmplayer,
    }

    return body;
}

//房间广播 基于旁观列表来广播
game_farm_room.prototype.room_broadcast = function (stype, ctype, body, not_to_uuid) {
	var json_uuid = [];
	var buf_uuid = [];

	var cmd_json = null;
	var cmd_buf = null;

	var gw_session = null;

	for(var i = 0; i < this.inview_players.length; i ++) {
		if (!this.inview_players[i] || this.inview_players[i].session == null || this.inview_players[i].uuid == not_to_uuid) {
			continue;
		}

		gw_session = this.inview_players[i].session;

		if (this.inview_players[i].proto_type == proto_man.PROTO_JSON) {
			json_uuid.push(this.inview_players[i].uuid);
			if (!cmd_json) {//json协议
				cmd_json = proto_man.encode_cmd(0, proto_man.PROTO_JSON, stype, ctype, body);
			}
		}
		else { //buf协议
			buf_uuid.push(this.inview_players[i].uuid);
			if (!cmd_buf) {
				cmd_buf = proto_man.encode_cmd(0, proto_man.PROTO_BUF, stype, ctype, body);
			}
		}		
	}

	if (json_uuid.length > 0) {
		var body = {
			cmd_buf: cmd_json,
			users: json_uuid,
		};
		// 网关的session
		gw_session.send_cmd(Stype.Broadcast, Cmd.BROADCAST, body, 0,  proto_man.PROTO_JSON);
		// end 
	}

	if (buf_uuid.length > 0) {
		var body = {
			cmd_buf: cmd_buf,
			users: buf_uuid,
		};
		// 网关的session
		gw_session.send_cmd(Stype.Broadcast, Cmd.BROADCAST, body, 0,  proto_man.PROTO_BUF);
	}

}
//对象克隆赋值
game_farm_room.prototype.deepClone= function(obj){
    var o,i,j,k;
    if(typeof(obj)!="object" || obj===null)return obj;
    if(obj instanceof(Array))
   { 
        o=[];
        i=0;j=obj.length;
        for(;i<j;i++)
        { 
            if(typeof(obj[i])=="object" && obj[i]!=null)
            {       
                o[i]=arguments.callee(obj[i]);      
            }else{
                o[i]=obj[i];
            }
        }
   }else
   {
       o={};
       for(i in obj)
       {
           if(typeof(obj[i])=="object" && obj[i]!=null)
           {
               o[i]=arguments.callee(obj[i]); 
            }else{
                o[i]=obj[i];
                }
            }
        }
    return o;
}

module.exports = game_farm_room;