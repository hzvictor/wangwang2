/**
 * 农场服务器逻辑
 */
module.exports = {
    join_farm: join_farm,//创建农场
    access_farm: access_farm,//参观农场
    planting_crops: planting_crops,//种植
    harvest_crops: harvest_crops,//收获
    sell_crops: sell_crops,//卖出
    buy_seeds: buy_seeds,//购买种子
    expansion_land:expansion_land,//扩建土地
    user_quit: user_quit,//离开
    user_lose_connect: user_lose_connect,//断线
    friend_operation: friend_operation,//好友操作数据处理
    farm_dynamic:farm_dynamic,//农场动态数据
    use_propitem:use_propitem,//使用物品道具
    buy_propitem:buy_propitem,//购买物品道具
    add_haoyouinfo_by_uuid: add_haoyouinfo_by_uuid,//添加好友信息
    agree_or_refuse:agree_or_refuse,//同意或者拒绝添加好友
    unlock_honor:unlock_honor,//解锁荣誉成就
    get_attachedinfo:get_attachedinfo,//请求附加信息
    light_up_crops:light_up_crops,//点亮图鉴
}

var Respones = require("../Respones.js");
var mysql_game = require("../../framework/database/mysql_game.js");
var mysql_center = require("../../framework/database/mysql_center.js");
var redis_game = require("../../framework/database/redis_game.js");
var redis_center = require("../../framework/database/redis_center.js");
var readyconfig = require("../../framework/config/readyconfig.js");
var utils = require("../../framework/utils/utils.js");
var log = require("../../framework/log/log.js");
var game_farm_player = require("./game_farm_player.js");
var game_farm_room = require("./game_farm_room.js");
var QuitReason = require("./game_farm_QuitReason.js");
var farm_list = {}; //  农场服务ID-->农场对象;
var player_set = {};
var proptempdata = readyconfig.readPropTemplateConfig();//读取具数据配置文件
var honortempdata = readyconfig.readHonorTemplateConfig();//读取荣誉数据配置文件
var action_timer = null;
//失败
function write_err(status, ret_func) {
	var ret = {};
	ret[0] = status;
	ret_func(ret);
}

//初始化数据库所有玩家农场信息
function init_farms() {

    mysql_center.get_all_uinfo(function (status, data) {
		if(status != Respones.OK){
			log.error("status:",status);
			return;
		}

        log.info("初始化数据库所有玩家农场信息");

		//读取所有的玩家数据
		for (let index = 0; index < data.length; index++) {
			let player_info = data[index];//玩家农场信息
			let farmid = player_info.u_uid;
			let farmroom = new game_farm_room(farmid,player_info);
			farm_list[farmroom.farmid] = farmroom;
		}
	});	

    clearTimeout(action_timer);
}

//init_farms();//执行初始化
action_timer = setTimeout(init_farms,3000);//


//根据模版id得到对应的道具数据
function get_propdata_by_id(propid){

    // "id": 100020,
    // "name": "蝴蝶花",
    // "cycle": 8,
    // "max": 4,
    // "level":1
    // "bygold": 40,
    // "sellgold": 20,
    // "type": 1,
    // "number": 0,
    // "useid": 0,
    // "imageid": 20020,
    // "exp":5
    // "content": "相信就是幸福"
    for(var i in proptempdata) {
        var id = proptempdata[i].id;
        //判断id符合条件
        if(propid == id){
            return proptempdata[i];
        }      
    }

    return null;    
}

//读取
function get_player(uuid) {
    //根据uuid 查找数据
    if (player_set[uuid]) {
        return player_set[uuid];
    }

    //否则
    return null;
}
//创建 /存储
function alloc_player(uuid, session, proto_type) {
    //根据uuid 查找数据
    if (player_set[uuid]) {
        log.warn("alloc_player: user is exist!!!");
        return player_set[uuid];
    }

    var p = new game_farm_player(uuid);
    p.init_session(session, proto_type);
    return p;
}
//删除
function delete_player(uuid) {

    if (player_set[uuid]) {
        player_set[uuid].init_session(null, -1);
        player_set[uuid] = null;
        delete player_set[uuid];
    } else {
        log.warn("delete player:", uuid, "is not server");
    }
}
//搜索房间
function do_search_farm(farmid,playerinfo) {
   
    var farm_room = null;
    for (var key in farm_list) {
        var farm = farm_list[key];
        if (farm && farm.farmid == farmid) {
            farm_room = farm;
        }
    }

    //找到最小的房间
    if (farm_room) {
        return farm_room;
    }
    //没有找到农场需要创建一个
    log.error("没有找到"+farmid+"农场需要创建一个");
    farm_room = alloc_farm(farmid,playerinfo);
    return farm_room;
}
//创建桌子
function alloc_farm(farmid,playerinfo) {
    let farmroom = new game_farm_room(farmid,playerinfo);
    farm_list[farmroom.farmid] = farmroom;
    return farmroom;
}

//加入
function join_farm(uuid, session, proto_type, ret_func) {

    log.info("加入农场:",uuid);
    var player = get_player(uuid);//读取数据
  
    if (!player) {
        player = alloc_player(uuid, session, proto_type);//分配一个

        //获取用户信息
        mysql_center.get_uinfo_by_uuid(uuid, function (status, data) {
            if (status != Respones.OK) {
                ret_func(status);
                return;
            }

            if (data.length <= 0) {
                ret_func(Respones.ILLEGAL_ACCOUNT);
                return;
            }

            var ugame_info = data[0];

            player.init_ugame_info(ugame_info);

            player_set[uuid] = player;//保存
            log.info("进入玩家:",player.uuid);
            player_enter_farm(player, uuid, ret_func);
        });
    } else {
        var farmroom = farm_list[player.uuid];
        log.info("恢复玩家session:",player.uuid);
        //恢复玩家session对象
        player.init_session(session, proto_type);
        //end

        //把房间的游戏进度发送给玩家 恢复游戏
        player_enter_farm(player, player.uuid, ret_func);
    }
}
//用户进入农场
function player_enter_farm(player, taguuid, ret_func) {
    //搜索农场 没有就创建
    do_search_farm(taguuid,player.get_ugame_info());
    //判断农场合法性
    if (!farm_list[taguuid]) {
        ret_func(Respones.INVALID_ROOM);//非法的游戏区间
        return;
    }
    var farmroom = farm_list[taguuid];
    log.info("用户进入农场taguuid:",taguuid);
    farmroom.do_enter_room(player,taguuid);
}

//用户参观农场
function access_farm(uuid, taguuid, ret_func) {
    var player = get_player(uuid);//读取数据
    if (!player) {
        ret_func(Respones.ILLEGAL_ACCOUNT);//非法的游戏账号
    } else {
        player_enter_farm(player, taguuid, ret_func);
    }
}
//农场动态
function farm_dynamic(uuid, ret_func) {
    var player = get_player(uuid);//读取数据
    if (!player) {
        ret_func(Respones.ILLEGAL_ACCOUNT);//非法的游戏账号
    } else {
        var farmroom = farm_list[player.room_id];
        farmroom.farm_dynamic(player);
    }
}

//种植农作物
function planting_crops(uuid, body, ret_func) {
    var player = get_player(uuid);
    //没有玩家
    if (!player) {
        write_err(Respones.INVALID_OPT, ret_func);
        return;
    }
    var mapindex = body[0];//玩家土地index
    var mapnetindex = body[1];//土地网络记录索引
    var propid = body[2];//种植的农作物模版id
    //物品模版是否存在
    let tdata = get_propdata_by_id(propid);
    if (!tdata) {
        write_err(Respones.INVALID_OPT, ret_func);
        return;
    }
    var farmroom = farm_list[uuid];
    farmroom.planting_crops(player, mapindex, mapnetindex, propid, tdata, ret_func);
}
//收获农作物
function harvest_crops(uuid, body, ret_func) {
    var player = get_player(uuid);
    //没有玩家
    if (!player) {
        write_err(Respones.INVALID_OPT, ret_func);
        return;
    }

    var farmroom = farm_list[player.room_id];
    farmroom.harvest_crops(player, body, ret_func);
}
//扩建土地
function expansion_land(uuid, body, ret_func) {
    var player = get_player(uuid);
    //没有玩家
    if (!player) {
        write_err(Respones.INVALID_OPT, ret_func);
        return;
    }

    var farmroom = farm_list[uuid];
    farmroom.expansion_land(player, body, ret_func);
}

//卖出
function sell_crops(uuid, body, ret_func) {

    var player = get_player(uuid);
    //没有玩家
    if (!player) {
        write_err(Respones.INVALID_OPT, ret_func);
        return;
    }

    let propid = body[0];//道具模版id
    let propcount = -1 * body[1];//数量 (卖出就是增加负数,所有乘以-1)

    //物品模版是否存在
    let tdata = get_propdata_by_id(propid);
    if(!tdata){
        write_err(Respones.INVALID_OPT, ret_func);
        return;
    }

    //得到价格   单价 x  数量
    let sellgold = tdata.sellgold * body[1];
    var farmroom = farm_list[uuid];
    farmroom.sell_crops(player, propid,propcount,sellgold, ret_func);
}
//购买种子
function buy_seeds(uuid, body, ret_func) {

    var player = get_player(uuid);
    //没有玩家
    if (!player) {
        write_err(Respones.INVALID_OPT, ret_func);
        return;
    }

    let propid = body[0];//种子模版id
    let propcount =body[1];//购买数量

     //物品模版是否存在
    let tdata = get_propdata_by_id(propid);
    if(!tdata){
        write_err(Respones.CROP_IS_EMPTY, ret_func);
        return;
    }
    //如果模版需要等级 大于玩家等级 则无法购买
    if(tdata.level > player.ulevel)
    {
        write_err(Respones.LEVEL_IS_NOT_ENOUGH, ret_func);
        return;
    }
    //得到价格   单价 x  数量
    let buygold = -1 *  (tdata.bygold * propcount);
    var farmroom = farm_list[uuid];
    farmroom.buy_seeds(player, propid,propcount,buygold, ret_func);
}

//执行玩家离开  主动 还是 被动
function do_user_quit(uuid, quit_reason) {
    var player = get_player(uuid);
    //玩家是否在服务器
    if (!player) {
        return;
    }

    var farmroom = farm_list[player.room_id];//得到房间
    if (farmroom) {
        //玩家已经在房间里 从房间离开
        farmroom.do_exit_room(player, quit_reason);
    } else {
        player.room_id = -1;//清理房间号
    }

    //用户掉线 清理下
    if (quit_reason == QuitReason.UserLostConn) {
        player.init_session(null, -1);
        delete_player(uuid);//删除玩家
    }
}

//得到好友列表的一些可以操作的信息
function friend_operation(uuid, body, ret_func){
    var player = get_player(uuid);
    //玩家是否在服务器
    if (!player) {
        return;
    }

    var operadata = [];
    for (let i = 0; i < body.length; i++) {
        let room = farm_list[body[i]];//得到房间
        let data = room.operation_cropsdata();
        operadata.push(data);
    }

    var farmroom = farm_list[uuid];//得到房间
    farmroom.friend_operation(player,operadata);
}
//使用物品道具
function use_propitem(uuid, body, ret_func){
    var player = get_player(uuid);
    //玩家是否在服务器
    if (!player) {
        return;
    }
   
    var farmroom = farm_list[uuid];//得到房间
    farmroom.use_propitem(player,body,ret_func);
}
//购买物品道具
function buy_propitem(uuid, itemid, ret_func){
    var player = get_player(uuid);
    //玩家是否在服务器
    if (!player) {
        return;
    }
   
    var farmroom = farm_list[uuid];//得到房间
    farmroom.buy_propitem(player,itemid,ret_func);
}

//解锁荣誉成就
function unlock_honor(uuid, body, ret_func){
    var player = get_player(uuid);
    //玩家是否在服务器
    if (!player) {
        return;
    }
   
    var farmroom = farm_list[uuid];//得到房间
    farmroom.unlock_honor(player,body,ret_func);
}
//请求附加信息
function get_attachedinfo(uuid,ret_func){
    var player = get_player(uuid);
    //玩家是否在服务器
    if (!player) {
        return;
    }
   
    var farmroom = farm_list[uuid];//得到房间
    farmroom.get_attachedinfo(player,ret_func);
}
//点亮图鉴 tid : 模版id
function light_up_crops(uuid,tid,ret_func){
    var player = get_player(uuid);
    //玩家是否在服务器
    if (!player) {
        return;
    }

     //物品模版是否存在
    let tdata = get_propdata_by_id(tid);
    if(!tdata){
        write_err(Respones.CROP_IS_EMPTY, ret_func);
        return;
    }

    var farmroom = farm_list[uuid];//得到房间
    farmroom.light_up_crops(player,tid,ret_func);
}
//添加好友
function add_haoyouinfo_by_uuid(uuid,body, ret_func){

   var player = get_player(uuid);
    //玩家是否在服务器
    if (!player) {
        return;
    }

    var friendid = body[0];//好友id
    var friendname = body[1];//好友名字
    var playername = player.unick;//自己名字

     var notice = 0;//1是通知状态 0是非通知状态
    //主动添加好友
    var farmroom = farm_list[uuid];//得到房间
    farmroom.add_haoyouinfo_by_uuid(player,uuid,friendid,friendname,notice,ret_func);

    //被动添加(被添加)
    var friendplayer = get_player(friendid);
    notice = 1;//1是通知状态 0是非通知状态
    var friendfarmroom = farm_list[friendid];//得到房间
    if(friendfarmroom){
        friendfarmroom.add_haoyouinfo_by_uuid(friendplayer,friendid,uuid,playername,notice,ret_func);
    }
}
//同意或者拒绝添加好友
function agree_or_refuse(uuid,body, ret_func){
    var player = get_player(uuid);
    //玩家是否在服务器
    if (!player) {
        return;
    }

    var friendid = body[0];
    var operation = body[1]; //1是同意 2是拒绝

    var farmroom = farm_list[uuid];//得到房间
    farmroom.agree_or_refuse(player,uuid,friendid,operation,ret_func);
    

    //被动操作(被同意或者拒绝)
    var friendplayer = get_player(friendid);
    var friendroom = farm_list[friendid];//得到房间
    if(friendroom){
        friendroom.agree_or_refuse(friendplayer,friendid,uuid,operation,ret_func);
    }
}
//用户离开游戏
function user_quit(uuid) {
    do_user_quit(uuid, QuitReason.UserQuit);
}

//玩家掉线
function user_lose_connect(uuid) {
    do_user_quit(uuid, QuitReason.UserLostConn);
}
//定时器刷新农场对象
function update_landinfo() {

    //遍历所有农场房间
    for(var key in farm_list){
        var farmroom = farm_list[key];
        if(farmroom){
            farmroom.update_landinfo();//更新
     	}
    }  
}

//不断循环的定时器  5 * 1000毫秒
setInterval(update_landinfo, 5000);