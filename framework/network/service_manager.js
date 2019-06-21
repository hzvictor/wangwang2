var log = require("../log/log.js");
var proto_man = require("./proto_man.js");

/**
 * 服务管理模块
 * stype服务号, ctype命令号, body 数据内容
 */
var service_manager = {
	on_client_lost_connect: on_client_lost_connect,//用户离开
	on_recv_client_cmd: on_recv_client_cmd,//用户消息
	register_service: register_service,//注册服务
	on_recv_server_return: on_recv_server_return,//从其他服务返回的数据
};
//客户端接入服务管理
var service_modules = {};

//注册服务
function register_service(stype, service) {
	//判断服务是否已经存在了
	if (service_modules[stype]) {
		log.warn(service_modules[stype].name + " service is registed !!!!");
	}

	//注册服务
	service_modules[stype] = service;
}

//收到玩家数据
/**
 * 
 * @param {* } session 玩家session
 * @param {* } cmd_buf 玩家数据包
 */
function on_recv_client_cmd(session,cmd_buf) {
	// 根据我们的收到的数据解码我们命令
	//服务号，命令号，数据
	var stype, ctype, body,utag,proto_type;
	//从数据里得到命令头
	var cmd = proto_man.decode_cmd_header(cmd_buf);
	if (!cmd) {
		//如果没有解到命令 则说明命令有问题
		return false;
	}

	//否则就是解析到了命令头
	stype = cmd[0]; 
	ctype = cmd[1]; 
	utag = cmd[2];
	proto_type = cmd[3];
	//再次判断我们解析到的命令头有没有
	if (!service_modules[stype]) {
		//如果没有命令 则失败
		return false;	
	}
	//否则解析到命令头 判断命令是否是转发模块
	if (service_modules[stype].is_transfer) {
		//如果是转发模块 则开始转发命令
		service_modules[stype].on_recv_player_cmd(session, stype,ctype, null,utag,proto_type,cmd_buf);
		return true;
	}	

	//如果不是转发模块 则正常的进行解析数据
	var cmd = proto_man.decode_cmd(proto_type, stype, ctype, cmd_buf);
	if (!cmd) {
		//如果没有解到命令 则说明命令有问题
		return false;
	}
	//解析到数据内容
	body = cmd[2];

	//转发数据
	service_modules[stype].on_recv_player_cmd(session,stype,ctype, body,utag,proto_type,cmd_buf);

	return true;
}

// 玩家掉线就走这里
function on_client_lost_connect(session) {

	var uid = session.uid;
	if(uid === 0){
		return;
	}
	session.uid = 0;
	// 遍历所有的服务模块通知在这个服务上的这个玩家掉线了
	for(var key in service_modules) {
		service_modules[key].on_player_disconnect(key,uid);
	}
}

//从其他服务返回的数据
function on_recv_server_return(session, cmd_buf){
	var stype, ctype, body,utag,proto_type;

	var cmd = proto_man.decode_cmd_header(cmd_buf);
	if (!cmd) {
		return false;
	}
	stype = cmd[0]; 
	ctype = cmd[1]; 
	utag = cmd[2];
	proto_type = cmd[3];
	if (service_modules[stype].is_transfer) {
		service_modules[stype].on_recv_server_return(session, stype, ctype, null,utag,proto_type, cmd_buf);
		return true;
	}

	var cmd = proto_man.decode_cmd(proto_type,stype,ctype, cmd_buf);
	if (!cmd) {
		return false;
	}
	// end 

	
	body = cmd[2];
	service_modules[stype].on_recv_server_return(session, stype, ctype, body,utag,proto_type, cmd_buf);
	return true;
}


module.exports = service_manager;