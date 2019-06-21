/**
 * 玩家农场服务器服务
 */
var log = require("../../framework/log/log.js");
var Cmd = require("../Cmd.js");
var game_farm_model = require("./game_farm_model.js");
var Stype = require("../Stype.js");
var Respones = require("../Respones.js");
var utils = require("../../framework/utils/utils.js");
//创建游戏农场数据信息
function join_farm(session, uid, proto_type, body) {
    game_farm_model.join_farm(uid, session, proto_type, function (ret) {
        session.send_cmd(Stype.GameFarm, Cmd.GameFarm.JOIN_FARM, ret, uid, proto_type);
    });
}
//参观别人农场
function access_farm(session, uid, proto_type, uuid) {
    log.info("uuid:", uuid);
    game_farm_model.access_farm(uid, uuid, function (ret) {
        session.send_cmd(Stype.GameFarm, Cmd.GameFarm.ACCESS_FARM, ret, uid, proto_type);
    });
}

//农场种植
function planting_crops(session, uid, proto_type, body) {
    log.info("body:", body);
    //验证数据合法性
    if (!body) {
        session.send_cmd(Stype.GameFarm, Cmd.GameFarm.PLANTING_CROPS, Respones.INVALID_PARAMS, utag, proto_type);
        return;
    }
    game_farm_model.planting_crops(uid, body, function (ret) {
        session.send_cmd(Stype.GameFarm, Cmd.GameFarm.PLANTING_CROPS, ret, uid, proto_type);
    });
}

//农场收获
function harvest_crops(session, uid, proto_type, body) {
    log.info("body:", body);
    //验证数据合法性
    if (!body) {
        session.send_cmd(Stype.GameFarm, Cmd.GameFarm.HARVEST_CROPS, Respones.INVALID_PARAMS, utag, proto_type);
        return;
    }
    game_farm_model.harvest_crops(uid, body, function (ret) {
        session.send_cmd(Stype.GameFarm, Cmd.GameFarm.HARVEST_CROPS, ret, uid, proto_type);
    });
}

//农场卖出
function sell_crops(session, uid, proto_type, body) {
    log.info("body:", body);
    //验证数据合法性
    if (!body) {
        session.send_cmd(Stype.GameFarm, Cmd.GameFarm.SELL_CROPS, Respones.INVALID_PARAMS, utag, proto_type);
        return;
    }
    game_farm_model.sell_crops(uid, body, function (ret) {
        session.send_cmd(Stype.GameFarm, Cmd.GameFarm.SELL_CROPS, ret, uid, proto_type);
    });
}
//扩建土地
function expansion_land(session, uid, proto_type, body) {
    log.info("body:", body);
    game_farm_model.expansion_land(uid, body, function (ret) {
        session.send_cmd(Stype.GameFarm, Cmd.GameFarm.EXPANSION_LAND, ret, uid, proto_type);
    });
}
//农场购买种子
function buy_seeds(session, uid, proto_type, body) {
    log.info("body:", body);
    //验证数据合法性
    if (!body) {
        session.send_cmd(Stype.GameFarm, Cmd.GameFarm.BUY_SEEDS, Respones.INVALID_PARAMS, utag, proto_type);
        return;
    }
    game_farm_model.buy_seeds(uid, body, function (ret) {
        session.send_cmd(Stype.GameFarm, Cmd.GameFarm.BUY_SEEDS, ret, uid, proto_type);
    });
}
//好友列表操作显示
function friend_operation(session, uid, proto_type, body) {
    log.info("body:", body);
    //验证数据合法性
    if (!body) {
        //不返还任何错误
        return;
    }
    game_farm_model.friend_operation(uid, body, function (ret) {
        session.send_cmd(Stype.GameFarm, Cmd.GameFarm.FRIEND_OPERATION, ret, uid, proto_type);
    });
}

//用户离开游戏
function user_quit(session, uuid, proto_type, body) {
    game_farm_model.user_quit(uuid, function (ret) {
        session.send_cmd(Stype.GameFarm, Cmd.GameFarm.USER_QUIT, ret, uuid, proto_type);
    });
}
//农场动态
function farm_dynamic(session, uuid, proto_type, body) {
    game_farm_model.farm_dynamic(uuid, function (ret) {
        session.send_cmd(Stype.GameFarm, Cmd.GameFarm.FARM_DYNAMIC, ret, uuid, proto_type);
    });
}
//使用物品道具
function use_propitem(session, uuid, proto_type, body) {
    //验证数据合法性
    if (!body) {
        session.send_cmd(Stype.GameFarm, Cmd.GameFarm.USE_ITEM, Respones.INVALID_PARAMS, utag, proto_type);
        return;
    }
    game_farm_model.use_propitem(uuid,body, function (ret) {
        session.send_cmd(Stype.GameFarm, Cmd.GameFarm.USE_ITEM, ret, uuid, proto_type);
    });
}
//购买物品道具
function buy_propitem(session, uid, proto_type, body) {
    //验证数据合法性
    if (!body) {
        session.send_cmd(Stype.GameFarm, Cmd.GameFarm.BUY_ITEM, Respones.INVALID_PARAMS, utag, proto_type);
        return;
    }
    game_farm_model.buy_propitem(uid, body, function (ret) {
        session.send_cmd(Stype.GameFarm, Cmd.GameFarm.BUY_ITEM, ret, uid, proto_type);
    });
}

//通知添加好友信息 同意 拒绝
function agree_or_refuse(session, uid, proto_type, body) {
    game_farm_model.agree_or_refuse(uid,body, function (ret) {
        session.send_cmd(Stype.GameFarm, Cmd.GameFarm.NOTICE_ADD_HAOYOU_OPERATION, ret, uid, proto_type);
    });
}
//添加好友信息
function add_haoyouinfo_by_uuid(session, uid, proto_type, body) {
    game_farm_model.add_haoyouinfo_by_uuid(uid,body, function (ret) {
        session.send_cmd(Stype.GameFarm, Cmd.GameFarm.ADD_HAOYOU_INFO, ret, uid, proto_type);
    });
}
//解锁荣誉成就
function unlock_honor(session, uid, proto_type, body) {
    game_farm_model.unlock_honor(uid,body, function (ret) {
        session.send_cmd(Stype.GameFarm, Cmd.GameFarm.UNLOCK_HONOR, ret, uid, proto_type);
    });
}
//请求附加信息
function get_attachedinfo(session, uid, proto_type, body) {
    game_farm_model.get_attachedinfo(uid,function (ret) {
        session.send_cmd(Stype.GameFarm, Cmd.GameFarm.ATTACHED_INFO, ret, uid, proto_type);
    });
}
//点亮图鉴
function light_up_crops(session, uid, proto_type, body) {
    game_farm_model.light_up_crops(uid,body,function (ret) {
        session.send_cmd(Stype.GameFarm, Cmd.GameFarm.LIGHT_UP_CROPS, ret, uid, proto_type);
    });
}

var service = {
    name: "game_farm_service", // 服务名称
    is_transfer: false,	//是否是转发模块

    // 收到客户端数据的时候调用
    on_recv_player_cmd: function (session, stype, ctype, body, uid, proto_type, raw_cmd) {
        log.info(stype, ctype, body);   
        switch(ctype){
            case Cmd.GameFarm.JOIN_FARM://创建农场
                join_farm(session, uid, proto_type, body);
            break;
            case Cmd.GameFarm.ACCESS_FARM://参观农场
                access_farm(session, uid, proto_type, body);
            break;
            case Cmd.GameFarm.PLANTING_CROPS://种植
                planting_crops(session, uid, proto_type, body);
            break;
            case Cmd.GameFarm.HARVEST_CROPS://收获
                harvest_crops(session, uid, proto_type, body);
            break;
            case Cmd.GameFarm.SELL_CROPS://卖出
                sell_crops(session, uid, proto_type, body);
            break;
            case Cmd.GameFarm.BUY_SEEDS://购买种子
                buy_seeds(session, uid, proto_type, body);
            break;
             case Cmd.GameFarm.EXPANSION_LAND://扩建土地
                expansion_land(session, uid, proto_type, body);
            break;
            case Cmd.GameFarm.USER_QUIT://离开房间
                user_quit(session, uid, proto_type, body);
            break;
            case Cmd.GameFarm.FRIEND_OPERATION://请求好友列表的操作显示
                friend_operation(session, uid, proto_type, body);
            break;
            case Cmd.GameFarm.FARM_DYNAMIC://好友动态
                farm_dynamic(session, uid, proto_type, body);
            break;
            case Cmd.GameFarm.USE_ITEM://使用物品 浇水 施肥 铲除
                use_propitem(session, uid, proto_type, body);
            break;
            case Cmd.GameFarm.BUY_ITEM://购买物品 浇水 施肥 铲除
                buy_propitem(session, uid, proto_type, body);
            break;
            case Cmd.USER_Disconnect://广播
                game_farm_model.user_lose_connect(uid);
            break;
            case Cmd.GameFarm.ADD_HAOYOU_INFO:
                add_haoyouinfo_by_uuid(session, uid, proto_type, body);
            break;
            case Cmd.GameFarm.UNLOCK_HONOR://解锁荣誉
                unlock_honor(session, uid, proto_type, body);
            break;
            case Cmd.GameFarm.ATTACHED_INFO://附加信息
                get_attachedinfo(session, uid, proto_type, body);
            break;
            case Cmd.GameFarm.LIGHT_UP_CROPS://点亮图鉴
                light_up_crops(session, uid, proto_type, body);
            break;
            case Cmd.GameFarm.AGREE_OR_REFUSE://好友添加通知操作
                agree_or_refuse(session, uid, proto_type, body);
            break;
        }
    },

    // 收到客户端断开链接  每个服务连接丢失后调用,被动丢失连接
    on_player_disconnect: function (stype, session) {
    },
    //收到我们链接的服务给我们发来的数据
    on_recv_server_return: function (session, stype, ctype, body, utag, proto_type, raw_cmd) {
    },
};

module.exports = service;
