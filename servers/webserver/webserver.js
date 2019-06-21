var game_config = require("../gameconfig.js");
var express = require("express");
var path = require("path");
var fs = require("fs");
var log = require("../../framework/log/log.js");
var Cmd = require("../Cmd.js");
var Stype = require("../Stype.js");
/*
if (process.argv.length < 3) {
	console.log("node webserver.js port");
	return;
}
*/
var app = express();
var host = game_config.webserver.host;
var port = game_config.webserver.port;

// process.chdir("./apps/webserver");
// console.log(process.cwd());

if (fs.existsSync("www_root")) {
	app.use(express.static(path.join(process.cwd(), "www_root")));	
}
else {
	log.warn("www_root is not exists!!!!!!!!!!!");
}

log.info("webserver started at port ", host, port);


// 获取客户端连接的服务器信息, 
// http://test1.libyx.com:10001/server_info
app.get("/server_info", function (request, respones) {
	// 指定允许其他域名访问
    respones.setHeader('Access-Control-Allow-Origin', '*');
    // 响应类型
    respones.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS, DELETE");
    // 响应头设置
    respones.setHeader("Access-Control-Allow-Headers", "Content-Type, x-requested-with, X-Custom-Header");
	
	var data = {
        //host: "garden.libyx.com",
		host: "127.0.0.1",
        port: game_config.gatawayConfig.ports[1],
        version:2018100101,
    };

	var str_data = JSON.stringify(data);
	
	respones.send(str_data);
});

app.listen(port,'0.0.0.0');


