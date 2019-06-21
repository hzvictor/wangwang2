var network = require("../../framework/network/network.js");
var proto_tools = require("../../framework/network/proto_tools.js");
var proto_man = require("../../framework/network/proto_man.js");
var log = require("../../framework/log/log.js");
var Cmd = require("../Cmd.js");
var Stype = require("../Stype.js");
var Respones = require("../Respones.js");
var uid_session_map = {};
function get_session_by_uid(uid){
	return uid_session_map[uid];
}
function save_session_with_uid(uid,session,proto_type){
	uid_session_map[uid] = session;
	session.proto_type = proto_type;
}
function clear_session_with_uid(uid){
	uid_session_map[uid] = null;
	delete uid_session_map[uid];
}
//登录命令
function is_login_cmd(stype,ctype){

		if(stype != Stype.Auth){
			return false;
		}

		if(ctype == Cmd.Auth.WX_LOGIN){
			return true;
		}

		return false;
}
//退出命令
function is_exit_cmd(stype,ctype){

		if(stype != Stype.Auth){
			return false;
		}

		if(ctype == Cmd.Auth.GAME_EXIT){
			return true;
		}

		return false;
}

//登陆之前
function is_befor_login_cmd(stype,ctype){
	if(stype != Stype.Auth){
		return false;
	}
	if(ctype == Cmd.Auth.WX_LOGIN){
		return true;
	}
	// var cmd_set = [Cmd.Auth.WX_LOGIN];

	// for (var i = 0; i < cmd_set.length; i++) {	
	// 	if(ctype == cmd_set[i]){
	// 		return true;
	// 	}
	// }
	return false;
}

var service = {
	name: "gw_server", // 服务名称 网关服务
	is_transfer: true,	//是否是转发模块

	// 收到客户端数据的时候调用
	on_recv_player_cmd: function(session,stype,ctype, body,utag,proto_type,raw_cmd) {
		//根据stype 查找对应的服务器
		var server_session = network.get_server_session(stype);
		if(!server_session){
			var body = {
				0:Respones.NO_FIND_SERVER,
			}
			session.send_cmd(stype,ctype,body,utag,proto_type);//通知客户端
			log.info("[SeasonsGardenServer]没有找到服务器");
			return; //没有找到服务器
		}

		//打入能够标识client的utag,uid,session,session_key
		if(is_befor_login_cmd(stype,ctype)){
			utag = session.session_key;
		}else{
			//uid 等于0 说明未登录 发送了非法的命令
			if(session.uid === 0){
				return;
			}
			utag = session.uid;
		}
		proto_tools.write_utag_inbuf(raw_cmd,utag);

		//中转服务 把客户端的数据转发到对应的服务器
		server_session.send_encoded_cmd(raw_cmd);

	},


	//收到我们链接的服务给我们发来的数据
	on_recv_server_return: function(session,stype, ctype, body,utag,proto_type,raw_cmd){
		var client_session;
		if(is_befor_login_cmd(stype,ctype)){
			client_session = network.get_client_session(utag);
			if(!client_session){
				return;
			}
			if(is_login_cmd(stype,ctype)){
				//解包命令 得到body数据
				var cmd_ret = proto_man.decode_cmd(proto_type,stype,ctype,raw_cmd);
				body = cmd_ret[2];
				
				if(body.status == Respones.OK){
					//如果当前帐号已经在其他设备正在登录  发送命令告诉客户端被挤掉线
					var prev_session = get_session_by_uid(body.uuid);
					if(prev_session && prev_session != client_session){
						prev_session.send_cmd(stype,Cmd.Auth.RELOGIN,null,0,prev_session.proto_type)
						prev_session.uid = 0;
						network.session_close(prev_session);
					}
					//end
					client_session.uid = body.uuid;//保存uid
					save_session_with_uid(body.uuid,client_session,proto_type);//保存

					//清除操作
					body.uid = 0;
					raw_cmd = proto_man.encode_cmd(utag,proto_type,stype,ctype,body);

				}
			}

		}else{ //这里utag 就是uid

			client_session = get_session_by_uid(utag);

			if(!client_session){
				return;
			}

			if(is_exit_cmd(stype,ctype)){
				clear_session_with_uid(utag);
			}
		}

		//清除客户端的utag
		proto_tools.clear_utag_inbuf(raw_cmd);
		client_session.send_encoded_cmd(raw_cmd);


	},

	// 收到客户端断开链接  每个服务连接丢失后调用,被动丢失连接
	on_player_disconnect: function(stype,uid) {
		//
		if(stype == Stype.Auth){
			clear_session_with_uid(uid);
		}

		var server_session = network.get_server_session(stype);
		if(!server_session){
			return;
		}
		//客户端被迫掉线
		var utag = uid;
		log.info("[SeasonsGardenServer]客户端 "+utag+" 被迫掉线了");
		server_session.send_cmd(stype, Cmd.USER_Disconnect,null,utag,proto_man.PROTO_JSON);//

	},
};
service.get_session_by_uid = get_session_by_uid;
module.exports = service;
