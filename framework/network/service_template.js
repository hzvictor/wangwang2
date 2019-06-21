var service = {
	name: "service tempalte", // 服务名称
	is_transfer: false,	//是否是转发模块

	// 收到客户端数据的时候调用
	on_recv_player_cmd: function(session,stype,ctype, body,utag,proto_type,raw_cmd) {
	},

	// 收到客户端断开链接  每个服务连接丢失后调用,被动丢失连接
	on_player_disconnect: function(stype,session) {
	},
	//收到我们链接的服务给我们发来的数据
	on_recv_server_return: function(session,stype, ctype, body,utag,proto_type,raw_cmd){
	},
};

module.exports = service;
