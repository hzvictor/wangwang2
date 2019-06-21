/**
 * 系统服务器服务
 */
var log = require("../../framework/log/log.js");
var Cmd = require("../Cmd.js");
var system_model = require("./game_system_model.js");
var Stype = require("../Stype.js");
var Respones = require("../Respones.js");
var utils = require("../../framework/utils/utils.js");

//得到游戏土地信息
function get_landinfo_by_uuid(session, uid, proto_type, body) {

    //验证数据合法性
    if (!body) {
        session.send_cmd(Stype.GameSystem, Cmd.GameSystem.GET_GAME_INFO, Respones.INVALID_PARAMS, uid, proto_type);
        return;
    }
    var taguuid = body;
    system_model.get_landinfo_by_uuid(uid,taguuid, function (ret) {
        session.send_cmd(Stype.GameSystem, Cmd.GameSystem.GET_GAME_INFO, ret, uid, proto_type);
    });
}
//得到玩家道具信息
function get_propinfo_by_uuid(session, uid, proto_type, body) {

    system_model.get_propinfo_by_uuid(uid, function (ret) {
        session.send_cmd(Stype.GameSystem, Cmd.GameSystem.GET_PROP_INFO, ret, uid, proto_type);
    });
}
//得到玩家种子信息
function get_seedinfo_by_uuid(session, uid, proto_type, body) {

    system_model.get_seedinfo_by_uuid(uid, function (ret) {
        session.send_cmd(Stype.GameSystem, Cmd.GameSystem.GET_SEED_INFO, ret, uid, proto_type);
    });
}
//得到玩家好友信息
function get_haoyouinfo_by_uuid(session, uid, proto_type, body) {
    system_model.get_haoyouinfo_by_uuid(uid,body, function (ret) {
        session.send_cmd(Stype.GameSystem, Cmd.GameSystem.GET_HAOYOU_INFO, ret, uid, proto_type);
    });
}
//验证好友数据信息
function check_haoyouinfo_by_uuid(session, uid, proto_type, body) {
    system_model.check_haoyouinfo_by_uuid(uid,body, function (ret) {
        session.send_cmd(Stype.GameSystem, Cmd.GameSystem.CHECK_HAOYOU_INFO, ret, uid, proto_type);
    });
}


//获取所有的物品信息
function get_item_info_by_uuid(session, uid, proto_type, body) {
    system_model.get_item_info_by_uuid(uid, function (ret) {
        session.send_cmd(Stype.GameSystem, Cmd.GameSystem.GET_ITEM_INFO, ret, uid, proto_type);
    });
}
//得到玩家荣誉信息
function get_honor_info_by_uuid(session, uid, proto_type, body) {
    system_model.get_honor_info_by_uuid(uid, function (ret) {
        session.send_cmd(Stype.GameSystem, Cmd.GameSystem.GET_HONOR_INFO, ret, uid, proto_type);
    });
}
//得到玩家附加数据信息
function get_attached_by_uuid(session, uid, proto_type, body) {
    system_model.get_attached_by_uuid(uid, function (ret) {
        session.send_cmd(Stype.GameSystem, Cmd.GameSystem.GET_ATTACHED_INFO, ret, uid, proto_type);
    });
}
//得到金币排行榜数据
function get_rank_list_from_gold(session, uid, proto_type, body) {
    system_model.get_rank_list_from_gold(uid, function (ret) {
        session.send_cmd(Stype.GameSystem, Cmd.GameSystem.GET_RANK_GOLD_DATA, ret, uid, proto_type);
    });
}

var service = {
    name: "game_system_service", // 服务名称
    is_transfer: false,	//是否是转发模块

    // 收到客户端数据的时候调用
    on_recv_player_cmd: function (session, stype, ctype, body, uid, proto_type, raw_cmd) {
        log.info(stype, ctype, body);
        
        switch(ctype){
            case Cmd.GameSystem.GET_GAME_INFO:
                get_landinfo_by_uuid(session, uid, proto_type, body);
            break;
            case Cmd.GameSystem.GET_PROP_INFO:
                get_propinfo_by_uuid(session, uid, proto_type, body);
            break;
            case Cmd.GameSystem.GET_SEED_INFO:
                get_seedinfo_by_uuid(session, uid, proto_type, body);
            break;
            case Cmd.GameSystem.GET_HAOYOU_INFO:
                get_haoyouinfo_by_uuid(session, uid, proto_type, body);
            break;
            case Cmd.GameSystem.CHECK_HAOYOU_INFO:
                check_haoyouinfo_by_uuid(session, uid, proto_type, body);
            break;
            case Cmd.GameSystem.GET_ITEM_INFO:
                get_item_info_by_uuid(session, uid, proto_type, body);
            break;
            case Cmd.GameSystem.GET_HONOR_INFO:
                get_honor_info_by_uuid(session, uid, proto_type, body);
            break;
            case Cmd.GameSystem.GET_ATTACHED_INFO:
                get_attached_by_uuid(session, uid, proto_type, body);
            break;
            case Cmd.GameSystem.GET_RANK_GOLD_DATA:
                get_rank_list_from_gold(session, uid, proto_type, body);
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
