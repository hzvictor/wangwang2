require("./bc_proto.js");
var gw_server = require("./gw_server.js");
var service = {
	name: "broadcast service", // 广播服务名称
	is_transfer: false,	//是否是转发模块

	// 收到客户端数据的时候调用
	on_recv_player_cmd: function(session,stype,ctype, body,utag,proto_type,raw_cmd) {
	},

	// 收到客户端断开链接  每个服务连接丢失后调用,被动丢失连接
	on_player_disconnect: function(stype,session) {	
	},
	//收到我们链接的服务给我们发来的数据
	on_recv_server_return: function(session,stype, ctype, body,utag,proto_type,raw_cmd){

		var cmd_buf = body.cmd_buf;
		var users = body.users;

		for(var i in users) {
			var client_session = gw_server.get_session_by_uid(users[i]);
			if (!client_session) {
				continue;//用户掉线
			}
			client_session.send_encoded_cmd(cmd_buf);
		}		
	},
};

module.exports = service;
