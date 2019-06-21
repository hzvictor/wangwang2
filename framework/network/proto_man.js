var log = require("../log/log.js");
var proto_tools = require("./proto_tools.js");
var CryptoJS = require('../tools/encryptjs.js');
/**
 * 协议管理模块  json协议/二进制协议
 * stype服务号, ctype命令号, body 数据内容
 */
var proto_man = {
    PROTO_JSON: 1,//json协议
    PROTO_BUF: 2,//二进制协议
    GW_Disconnect: 10000,//全局命令号，当我们用户丢失链接的时候，所有的服务都会收到网关转发过来的这个事件消息（保留用户掉线命令号）
    encode_cmd: encode_cmd,//编码数据
    decode_cmd: decode_cmd,//解码数据
    reg_decoder: reg_buf_decoder,//注册二进制编码器
    reg_encoder: reg_buf_encoder,//注册二进制解码器

    encrypt_cmd: encrypt_cmd,// 加密
    decrypt_cmd: decrypt_cmd,// 解密

    decode_cmd_header: decode_cmd_header,//解码协议头  
};

// buf协议的编码/解码管理  stype, ctype --> encoder/decoder
var decoders = {}; // 保存当前我们buf协议所有的解码函数, stype,ctype --> decoder;
var encoders = {}; // 保存当前我们buf协议所有的编码函数, stype, ctype --> encoder

var cryptkey = '751f621ea5c8f930';
var iv = '128';

// 加密
function encrypt_cmd(str_of_buf) {
   return str_of_buf;
//    log.warn("加密:",str_of_buf);
//    var data =  CryptoJS.encrypt(str_of_buf,cryptkey, iv);
//    log.warn("加密后:",data);
//    return data;
}
 
// 解密
function decrypt_cmd(str_of_buf) {
    return str_of_buf;
    // log.warn("解密:",str_of_buf);
    // var dec = CryptoJS.decrypt(str_of_buf,cryptkey, iv);
    // log.warn("解密后:",dec);
    // return dec;
}


//解码协议头
function decode_cmd_header(cmd_buf){

	var cmd = {};
    //buf协议 2字节服务号 + 2字节命令号 占 4个字节
    if (cmd_buf.length < proto_tools.head_size) {
        return null;
    }

	cmd[0] = proto_tools.read_int16(cmd_buf,0);//cmd_buf 0号位置读取数据stype服务号
	cmd[1] = proto_tools.read_int16(cmd_buf,2);//cmd_buf 2号位置读取数据ctype命令号
    cmd[2] = proto_tools.read_uint32(cmd_buf,4);//
    cmd[3] = proto_tools.read_int16(cmd_buf,8);//协议头 buf or json
    return cmd;
}

//编码数据
// 参数1: 协议类型 json, buf协议;
// 参数2: 服务类型 
// 参数3: 命令号;
// 参数4: 发送的数据本地，js对象/js文本，...
// 返回是一段编码后的数据;
function encode_cmd(utag,proto_type, stype, ctype,body){
    var buf = null;
    //如果是json协议数据
    if (proto_type == proto_man.PROTO_JSON){
        buf = json_encode(stype, ctype, body);
    } else { // 是buf协议
        var key = get_key(stype, ctype);
        if (!encoders[key]) {
            return null;
        }
        // encoders[key] 是reg_buf_encoder方法注册过来的encode_func函数
        buf = encoders[key](stype,ctype,body);
    }

    //写入utag
    proto_tools.write_utag_inbuf(buf,utag);
    //写入协议头 打包
    proto_tools.write_prototype_inbuf(buf,proto_type);
    return buf;
}

//解码数据
// 参数1: 协议类型
// 参数2: 接手到的数据命令
// 返回: {0: stype, 1, ctype, 2: body}
function decode_cmd(proto_type,stype,ctype, cmd_buf) {

    if(cmd_buf.length < proto_tools.head_size){
        return null;
    }
	
    //数据类型是json协议
    if (proto_type == proto_man.PROTO_JSON) {
        return json_decode(cmd_buf);
    }

    var cmd = null;
    var key = get_key(stype, ctype);
    if (!decoders[key]) {
        return null;
    }
   
    cmd = decoders[key](cmd_buf);
    return cmd;
}

//json协议包装
function json_encode(stype, ctype, body) {
    var cmd = {};
	
	cmd[0] = body;
    var str = JSON.stringify(cmd);
    
    //str = encrypt_cmd(str);	

	//stype ctype str 打入到我们的buffer
	var cmd_buf = proto_tools.encode_str_cmd(stype,ctype,str);
    return cmd_buf;
}

//json协议解码
function json_decode(cmd_json) {
    var cmd = proto_tools.decode_str_cmd(cmd_json);//解码数据
	var cmd_json = cmd[2];//得到body
	
    //cmd_json = decrypt_cmd(cmd_json);	
       
    try{
		var body_set = JSON.parse(cmd_json);
        cmd[2] = body_set[0];
    }catch(e){
		return null;
    }

    //判断json数据格式是否合法
    if (!cmd ||
        typeof (cmd[0]) == "undefined" ||
        typeof (cmd[1]) == "undefined" ||
        typeof (cmd[2]) == "undefined") {
        return null;
    }

    return cmd;
} 

// key, value, stype + ctype -->key: value
function get_key(stype, ctype) {
    return (stype * 65536 + ctype);
}


//注册二进制编码器 stype服务号  ctype命令号
// encode_func(body) return 二进制bufffer对象
function reg_buf_encoder(stype, ctype, encode_func) {
    var key = get_key(stype, ctype);
    if (encoders[key]) { // 已经注册过了，是否搞错了
        log.warn("stype: " ,stype ," ctype: " ,ctype ,"is reged!!!");
    }

    encoders[key] = encode_func;
}


//注册二进制解码器
// decode_func(cmd_buf) return cmd { 0: 服务号, 1: 命令号, 2: body};
function reg_buf_decoder(stype, ctype, decode_func) {
    var key = get_key(stype, ctype);
    if (decoders[key]) { // 已经注册过了，是否搞错了
        log.warn("stype: " ,stype," ctype: " ,ctype,"is reged!!!");
    }

    decoders[key] = decode_func;
}
module.exports = proto_man;