var log = require("../../framework/log/log.js");
var Cmd = require("../Cmd.js");
var auth_model = require("./auth_model.js");
var Stype = require("../Stype.js");
var Respones = require("../Respones.js");
var utils = require("../../framework/utils/utils.js");

//微信登录
function wx_login(session,utag,proto_type,body){
    //验证数据合法性
    if(!body){
        session.send_cmd(Stype.Auth,Cmd.Auth.WX_LOGIN,Respones.INVALID_PARAMS,utag,proto_type);
        return;
    }
    var ukey = body[0];
    var unick= body[1];
    var uface = body[2];
    var usex = body[3];
    auth_model.guest_login(ukey,unick,usex,uface, function(ret) {
		session.send_cmd(Stype.Auth, Cmd.Auth.WX_LOGIN, ret, utag, proto_type);
	});
}

//退出游戏
function game_exit(session,uid,proto_type,body){
    auth_model.game_exit(uid,function(ret){
        session.send_cmd(Stype.Auth,Cmd.Auth.GAME_EXIT,ret,uid,proto_type);
    });
}

var service = {
    name: "auth_service", // 服务名称
    is_transfer: false,	//是否是转发模块

    // 收到客户端数据的时候调用
    on_recv_player_cmd: function (session, stype, ctype, body, utag, proto_type, raw_cmd) {
        log.info(stype, ctype, body);   
        switch(ctype){
            case Cmd.Auth.WX_LOGIN:
                wx_login(session,utag,proto_type,body);
            break;
            case Cmd.Auth.GAME_EXIT:
                game_exit(session,utag,proto_type,body);
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
