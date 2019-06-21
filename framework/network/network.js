var net = require("net");
var ws = require("ws");
var log = require("../log/log.js");//引用日志
var tcppkg = require("./tcppkg.js");//拆包  封包
var proto_man = require("./proto_man.js");//协议管理模块
var service_manager = require("./service_manager.js");//服务管理模块

var network = {

    //tcp链接
   start_tcp_server: start_tcp_server,
    //websocket 链接
   start_ws_server: start_ws_server,
   //session_send: session_send,
   session_close: session_close,
   //查找得到客户端与network所链接的session
   get_client_session: get_client_session,
   //网关和服务器之间的tcp链接
   connect_tcp_server: connect_tcp_server,
   //查找服务端与network所连接的session
   get_server_session: get_server_session,
};

//客户端session列表
var global_session_list = {};
//客户端key
var global_seesion_key = 1;

function get_client_session(session_key){
    return global_session_list[session_key];
}

/**
 * //启动tcp server链接
 * @param {*} ip ip地址
 * @param {*} port 端口号
 * @param {*} is_encrypt 是否加密数据
 */
function start_tcp_server(ip, port, is_encrypt) {
    var str_proto = {
		1: "PROTO_JSON",
		2: "PROTO_BUF"
	};
    log.info("start tcp server ..", ip, port);
    var server = net.createServer(function (client_sock) {
        //客户端链接回调
        add_client_session_event(client_sock, is_encrypt);
    });


    // 监听发生错误的时候调用
    server.on("error", function () {
        log.error("server listen error");
    });

    server.on("close", function () {
        log.error("server listen close");
    });

    server.listen({
        port: port,
        host: ip,
        exclusive: true,
    });
}


/**
 * //客户端tcp链接监听
 * @param {*} session 客户端session
 * @param {*} is_encrypt 是否加密
 */
function add_client_session_event(session, is_encrypt) {
    session.on("close", function () {
        //关闭链接
        on_session_exit(session);
        session.end();
    });

    session.on("data", function (data) {
        // 
        if (!Buffer.isBuffer(data)) { // 不合法的数据
            // 关闭一个session
            log.error("不合法的数据关闭session");
            session_close(session);
            return;
        }
        // end 

        var last_pkg = session.last_pkg;
        if (last_pkg != null) { // 上一次剩余没有处理完的半包;
            var buf = Buffer.concat([last_pkg, data], last_pkg.length + data.length);
            last_pkg = buf;
        }
        else {
            last_pkg = data;
        }

        var offset = 0;
        var pkg_len = tcppkg.read_pkg_size(last_pkg, offset);
        if (pkg_len < 0) {
            return;
        }

        while (offset + pkg_len <= last_pkg.length) { // 判断是否有完整的包;
            // 根据长度信息来读取我们的数据,架设我们穿过来的是文本数据
            var cmd_buf;
            // 收到了一个完整的数据包         
            cmd_buf = Buffer.allocUnsafe(pkg_len - 2); // 2个长度信息
            last_pkg.copy(cmd_buf, 0, offset + 2, offset + pkg_len);
            on_session_recv_cmd(session, cmd_buf);

            offset += pkg_len;
            if (offset >= last_pkg.length) { // 正好我们的包处理完了;
                break;
            }

            pkg_len = tcppkg.read_pkg_size(last_pkg, offset);
            if (pkg_len < 0) {
                break;
            }
        }

        // 能处理的数据包已经处理完成了,保存 0.几个包的数据
        if (offset >= last_pkg.length) {
            last_pkg = null;
        }
        else { // offset, length这段数据拷贝到新的Buffer里面
            var buf = Buffer.allocUnsafe(last_pkg.length - offset);
            last_pkg.copy(buf, 0, offset, last_pkg.length);
            last_pkg = buf;
        }

        session.last_pkg = last_pkg;
    });

    session.on("error", function (err) {

    });

    //有客户端的session接入进来
    on_session_enter(session, false,is_encrypt);
}


/**
 * // 有客户端的session接入进来
 * @param {*} session  客户端session
 * @param {*} is_ws 是否是websocket链接
 * @param {*} is_encrypt 是否加密
 */
function on_session_enter(session, is_ws,is_encrypt) {
    if (is_ws) {
        session.ip = session._socket.remoteAddress;
        log.info("session enter ws", session._socket.remoteAddress, session._socket.remotePort);
    }
    else {
        session.ip = session.remoteAddress;
        log.info("session enter", session.remoteAddress, session.remotePort);
    }
    
    //console.log("ip:",session.ip);  
    session.last_pkg = null; // 表示我们存储的上一次没有处理完的TCP包;
    session.is_ws = is_ws;//是否是websocket
    session.is_connected = true;//是否链接中
	session.is_encrypt = is_encrypt;//数据是否加密了
    session.uid = 0;//用户uid
    //扩展session的方法
    session.send_encoded_cmd = session_send_encoded_cmd;
    session.send_cmd = session_send_cmd;

    // 加入到我们的serssion 列表里面
    global_session_list[global_seesion_key] = session;
    session.session_key = global_seesion_key;
    global_seesion_key++;
    // end 
}


/**
 * // 一定能够保证是一个整包;
 * // 如果是json协议 str_or_buf json字符串;
 * // 如果是buf协议 str_or_buf Buffer对象;
 * @param {*} session 客户端session
 * @param {*} str_or_buf 接收到的数据msg
 */
function on_session_recv_cmd(session, str_or_buf) {
    //如果收到的数据无法解析命令，则说明客户端发送了无效的命令
    if(!service_manager.on_recv_client_cmd(session, str_or_buf)){
        //直接关闭session
        log.error("无法解析命令直接关闭session");        
        session_close(session);
    }
}


/**
 * // 关闭一个客户端链接session
 * @param {*} session 
 */
function session_close(session) {
    on_session_exit(session)
    if (!session.is_ws) {
        session.end();
        return;
    }
    else {
        session.close();
    }
}

/**
 * //用户退出
 * @param {*} session  客户端session
 */
function on_session_exit(session) {
    log.info("session exit !!!!");

     session.is_connected = false;
    //玩家掉线
    service_manager.on_client_lost_connect(session);

    session.last_pkg = null;
    if (global_session_list[session.session_key]) {
        global_session_list[session.session_key] = null;
        delete global_session_list[session.session_key]; // 把这个key, value从 {}里面删除
        session.session_key = null;
    }
}

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//使用nodejs自带的http、https模块  
var https = require('https');  
var fs = require("fs");
var path = require("path");
var url=require('url');
var qs=require('querystring');//解析参数的库
var express = require("express");
var app = express();

var privatekey = fs.readFileSync(__dirname+'/server.pem', 'utf8');  
var certificate = fs.readFileSync(__dirname+'/server.crt', 'utf8'); 
 
var option={key:privatekey, cert:certificate};  
var wsserver = https.createServer(option, app);  
app.get("/server_info", function (request, respones) {
    // 指定允许其他域名访问
    respones.setHeader('Access-Control-Allow-Origin', '*');
    // 响应类型
    respones.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS, DELETE");
    // 响应头设置
    respones.setHeader("Access-Control-Allow-Headers", "Content-Type, x-requested-with, X-Custom-Header");

    var data = {
        host: "garden.libyx.com",
		//host: "127.0.0.1",
        port: 443,
        version:2018100101,
    };

    var str_data = JSON.stringify(data);
    log.info("send https data: ", str_data);
    respones.send(str_data);
});
app.get("/api_info", function (request, respones) {
    // 指定允许其他域名访问
    respones.setHeader('Access-Control-Allow-Origin', '*');
    // 响应类型
    respones.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS, DELETE");
    // 响应头设置
    respones.setHeader("Access-Control-Allow-Headers", "Content-Type, x-requested-with, X-Custom-Header");
   
    //先从路径中拿参数
    var arg=url.parse(request.url).query;
    //把参数转换成键值对，再从中拿值
    var nameValue=qs.parse(arg)['js_code'];

    var code = nameValue;
    var codeUrl =  "https://api.weixin.qq.com/sns/jscode2session?appid=wxa68ec4c220d3d435&secret=04f07877db9f26457ebc48b89ff4ae53&js_code=" + code + "&grant_type=authorization_code";
    https.get(codeUrl, (res) => {
            res.on('data', (d) => {
                var str_data = d.toString();//JSON.stringify(d);
                respones.send(str_data);
            });

        }).on('error', (e) => {
          console.error(e);
    });
    
});
app.get("/kuayuzhuafa", function (request, respones) {
    // 指定允许其他域名访问
    respones.setHeader('Access-Control-Allow-Origin', '*');
    // 响应类型
    respones.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS, DELETE");
    // 响应头设置
    respones.setHeader("Access-Control-Allow-Headers", "Content-Type, x-requested-with, X-Custom-Header");
   
    //先从路径中拿参数
    var arg=url.parse(request.url).query;
    //把参数转换成键值对，再从中拿值
    var nameValue=qs.parse(arg)['neirong'];

    respones.send(nameValue);
    
});
//启动websocket链接
/**
 * 
 * @param {*} ip ip地址
 * @param {*} port 端口号
 * @param {*} is_encrypt 是否加密数据
 */
function start_ws_server(ip, port, is_encrypt) {

    wsserver.listen(port,ip);
      var str_proto = {
		1: "PROTO_JSON",
		2: "PROTO_BUF"
	};
    log.info("start ws server ..", ip, port);
    var server = new ws.Server({server: wsserver
        // host: ip,
        // port: port,
    });
   
    //链接监听
    server.on("connection", on_server_client_comming);

    //错误监听
    server.on("error", on_server_listen_error);

    //关闭监听
    server.on("close", on_server_listen_close);

    function on_server_client_comming(client_sock) {
		//客户端链接
        ws_add_client_session_event(client_sock, is_encrypt);
    }

    function on_server_listen_error(err) {
        log.error("ws server listen error!!");
    }

    function on_server_listen_close(err) {
        log.error("ws server listen close!!");
    }
}

//判断对象是否是字符串  
function isString(obj){ 
    return Object.prototype.toString.call(obj) === "[object String]";  
}  

/**
 * //客户端链接事件监听
 * @param {*} session 客户端session
 * @param {*} is_encrypt 是否加密
 */
function ws_add_client_session_event(session, is_encrypt) {
    // close事件
    session.on("close", function () {
        on_session_exit(session);
    });

    // error事件
    session.on("error", function (err) {
    });

    //message 事件
    session.on("message", function (data) {
        if (!Buffer.isBuffer(data)) {
            log.error("session_close:",data);
            session_close(session);
            return;
        }
        
        on_session_recv_cmd(session, data);
    });
    // end

    on_session_enter(session, true,is_encrypt);
}



/**
 * // 发送数据命令
 * @param {*} cmd 
 */
function session_send_encoded_cmd(cmd) {
    //链接已经丢失了
    if(!this.is_connected){
        return;
    }	
	if(this.is_encrypt){
		cmd = proto_man.encrypt_cmd(cmd); // 发送之前加密数据
	}
	//log.info("发送数据:",cmd);
    if (!this.is_ws) { // 
		try{
			var data = tcppkg.package_data(cmd);
			this.write(data);
			return;
		}
		catch(e){
			log.error('error..');
		}
        
    }
    else {
		try{
			this.send(cmd);
		}
		catch(e){
			log.error('error..');
		}
       
    }
}



/**
 * 
 * @param {*} stype 服务号
 * @param {*} ctype 命令号
 * @param {*} body 数据msg
 */
function session_send_cmd(stype,ctype,body,utag,proto_type){
    //链接已经丢失了
    if(!this.is_connected){
        return;
    }
    var cmd  = null;
    cmd = proto_man.encode_cmd(utag,proto_type,stype,ctype,body);

    //有数据
    if(cmd){
        this.send_encoded_cmd(cmd);//发送数据
    }
}

/**
 * //网关和服务器之间的tcp链接
 * @param {*} stype 服务号
 * @param {*} host ip
 * @param {*} port 端口号
 * @param {*} is_encrypt  是否加密
 */
function connect_tcp_server(stype,host,port,is_encrypt){

    var session = net.connect({
		port: port,
		host: host,
	});

	session.is_connected = false;
	session.on("connect",function() {
		on_session_connected(stype, session,  false, is_encrypt);
	});

	session.on("close", function() {
		if (session.is_connected === true) {
			on_session_disconnect(session);	
		}
		session.end();

		// 重新连接到服务器
		setTimeout(function() {
			log.warn("reconnect: ", stype, host, port, is_encrypt);
			connect_tcp_server(stype, host, port,  is_encrypt);
		}, 3000);
		// end 
	});

	session.on("data", function(data) {
        // 
		if (!Buffer.isBuffer(data)) { // 不合法的数据
			session_close(session);
			return;
		}
		// end 

		var last_pkg = session.last_pkg;
		if (last_pkg != null) { // 上一次剩余没有处理完的半包;
			var buf = Buffer.concat([last_pkg, data], last_pkg.length + data.length);
			last_pkg = buf;
		}
		else {
			last_pkg = data;	
		}

		var offset = 0;
		var pkg_len = tcppkg.read_pkg_size(last_pkg, offset);
		if (pkg_len < 0) {
			return;
		}

		while(offset + pkg_len <= last_pkg.length) { // 判断是否有完整的包;
			// 根据长度信息来读取我们的数据,架设我们穿过来的是文本数据
			var cmd_buf; 


			// 收到了一个完整的数据包
			{
				cmd_buf = Buffer.allocUnsafe(pkg_len - 2); // 2个长度信息
				last_pkg.copy(cmd_buf, 0, offset + 2, offset + pkg_len);
				on_recv_cmd_server_return(session, cmd_buf);	
			}
			

			offset += pkg_len;
			if (offset >= last_pkg.length) { // 正好我们的包处理完了;
				break;
			}

			pkg_len = tcppkg.read_pkg_size(last_pkg, offset);
			if (pkg_len < 0) {
				break;
			}
		}

		// 能处理的数据包已经处理完成了,保存 0.几个包的数据
		if (offset >= last_pkg.length) {
			last_pkg = null;
		}
		else { // offset, length这段数据拷贝到新的Buffer里面
			var buf = Buffer.allocUnsafe(last_pkg.length - offset);
			last_pkg.copy(buf, 0, offset, last_pkg.length);
			last_pkg = buf;
		}

		session.last_pkg = last_pkg;
	});

	session.on("error", function(err) {
		
	});


}


// session成功接入服务器
var server_connect_list = {};
/**
 * 根据服务号查找对应的服务器列表
 * @param {*查找对应的服务器列表} stype 服务号
 */
function get_server_session(stype){
    return server_connect_list[stype];
}

function on_session_connected(stype, session, is_ws, is_encrypt) {
	if (is_ws) {
		log.info("session connect:", session._socket.remoteAddress, session._socket.remotePort);
	}
	else {
		log.info("session connect:", session.remoteAddress, session.remotePort);	
	}
	
	session.last_pkg = null; // 表示我们存储的上一次没有处理完的TCP包;
	session.is_ws = is_ws;
	session.is_connected = true;
	session.is_encrypt = is_encrypt;

	// 扩展session的方法
	session.send_encoded_cmd = session_send_encoded_cmd;
	session.send_cmd = session_send_cmd;
	// end 

	// 加入到我们的serssion 列表里面
	server_connect_list[stype] = session;
	session.session_key = stype;
	// end 
}

function on_session_disconnect(session) {
	session.is_connected = false;
	var stype = session.session_key;
	session.last_pkg = null; 
	session.session_key = null;

	if (server_connect_list[stype]) {
		server_connect_list[stype] = null;
		delete server_connect_list[stype]; // 把这个key, value从 {}里面删除
		
	}
}

//从其他服务返回的数据
function on_recv_cmd_server_return(session, str_or_buf) {
	if(!service_manager.on_recv_server_return(session, str_or_buf)) {
		session_close(session);
	}
}

module.exports = network;