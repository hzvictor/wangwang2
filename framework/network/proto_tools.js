/**
 * 二进制操作
 */

var proto_tools = {

	head_size: 10,// 2  +2 +4 +2 
	// 原操作
	read_int8: read_int8,
	write_int8: write_int8,

	read_int16: read_int16,
	write_int16: write_int16,

	read_int32: read_int32,
	write_int32: write_int32,
	read_uint32: read_uint32,
	write_uint32: write_uint32,
	read_float: read_float,
	write_float: write_float,

	alloc_buffer: alloc_buffer,

	// 通用操作
	write_cmd_header_inbuf: write_cmd_header_inbuf,//写入命令头
	write_str_inbuf: write_str_inbuf,//写入字符串
	read_str_inbuf: read_str_inbuf,//读取字符串
	write_prototype_inbuf: write_prototype_inbuf,//写入协议类型 json  or buf
	clear_utag_inbuf: clear_utag_inbuf,//清除客户端标记utag
	write_utag_inbuf: write_utag_inbuf,//写入utag
	// end

	// 模板编码解码器
	encode_str_cmd: encode_str_cmd,
	encode_status_cmd: encode_status_cmd,
	encode_empty_cmd: encode_empty_cmd,

	decode_str_cmd: decode_str_cmd,
	decode_status_cmd: decode_status_cmd,
	decode_empty_cmd: decode_empty_cmd,
	// 
};

function read_int8(cmd_buf, offset) {
	return cmd_buf.readInt8(offset);
}

function write_int8(cmd_buf, offset, value) {
	cmd_buf.writeInt8(value, offset);
}

function read_int16(cmd_buf, offset) {
	return cmd_buf.readInt16LE(offset);
}

function write_int16(cmd_buf, offset, value) {
	cmd_buf.writeInt16LE(value, offset);
}

function read_int32(cmd_buf, offset) {
	return cmd_buf.readInt32LE(offset);
}

function write_int32(cmd_buf, offset, value) {
	cmd_buf.writeInt32LE(value, offset);
}

function read_uint32(cmd_buf, offset) {
	return cmd_buf.readUInt32LE(offset);
}

function write_uint32(cmd_buf, offset, value) {
	cmd_buf.writeUInt32LE(value, offset);
}

function read_str(cmd_buf, offset, byte_len) {
	return cmd_buf.toString("utf8", offset, offset + byte_len);
}

// 性能考虑
function write_str(cmd_buf, offset, str) {
	cmd_buf.write(str, offset);
}

function read_float(cmd_buf, offset) {
	return cmd_buf.readFloatLE(offset);
}

function write_float(cmd_buf, offset, value) {
	cmd_buf.writeFloatLE(value, offset);
}
//开辟指定长度的内存空间
function alloc_buffer(total_len) {
	return Buffer.allocUnsafe(total_len);
}

//
function read_cmd_header_inbuf(cmd_buf){
	var cmd = {};
	cmd[0] = proto_tools.read_int16(cmd_buf,0);
	cmd[1] = proto_tools.read_int16(cmd_buf,1);
	
	ret = [cmd,proto_tools.head_size];
	return ret;
}
//协议号
function write_prototype_inbuf(cmd_buf,proto_type){
	write_int16(cmd_buf,8,proto_type);
}

//打入utag
function write_utag_inbuf(cmd_buf,utag){
	write_uint32(cmd_buf,4,utag);
}
//清除utag
function clear_utag_inbuf(cmd_buf){
	write_uint32(cmd_buf,4,0);
}

//往buff写入命令头 stype服务号, ctype命令号
function write_cmd_header_inbuf(cmd_buf, stype, ctype) {
	write_int16(cmd_buf, 0, stype);
	write_int16(cmd_buf, 2, ctype);

	write_uint32(cmd_buf,4,0);

	return proto_tools.head_size;
}
//往buff写字符串
function write_str_inbuf(cmd_buf, offset, str, byte_len) {
	// 写入2个字节 字符串长度信息;
	write_int16(cmd_buf, offset, byte_len);
	//消息内容：2字节服务号[stype]+2字节命令号[ctype]+2字节消息长度[byte_len]+消息内容[str]
	offset += 2;
	//写消息字符串
	write_str(cmd_buf, offset, str);
	offset += byte_len;

	return offset;
}

// 从buff读取消息内容 返回 str, offset
function read_str_inbuf(cmd_buf, offset) {
	//得到消息长度 从第x个字节读取数据
	var byte_len = read_int16(cmd_buf, offset);
	//得到消息数据开始位置 应该是6 == 2字节服务号[stype]+2字节命令号[ctype]+2字节消息长度[byte_len]
	offset += 2;
	//从指定位置(offset) 开始 读取指定长度(byte_len)的数据
	var str = read_str(cmd_buf, offset, byte_len);
	//得到总长度：6 + 消息内容长度
	offset += byte_len;
	return [str, offset];
}

//解码
function decode_empty_cmd(cmd_buf) {
	var cmd = {};
	cmd[0] = read_int16(cmd_buf, 0);
	cmd[1] = read_int16(cmd_buf, 2);
	cmd[2] = null;
	return cmd;
}
//编码
function encode_empty_cmd(stype, ctype, body) {
	var cmd_buf = alloc_buffer(proto_tools.head_size);//x个长度
	//写入命令头stype, ctype到cmd_buf
	write_cmd_header_inbuf(cmd_buf, stype, ctype);
	return cmd_buf;
}


function encode_status_cmd(stype, ctype, status) {
	var cmd_buf = alloc_buffer(proto_tools.head_size+2);
	//写入命令头stype, ctype到cmd_buf
	write_cmd_header_inbuf(cmd_buf, stype, ctype);
	//从第x个字节开始写入
	write_int16(cmd_buf, proto_tools.head_size, status);

	return cmd_buf;
}

function decode_status_cmd(cmd_buf) {
	var cmd = {};
	cmd[0] = read_int16(cmd_buf, 0);
	cmd[1] = read_int16(cmd_buf, 2);
	cmd[2] = read_int16(cmd_buf,proto_tools.head_size);

	return cmd;
}

//处理字符串

function encode_str_cmd(stype, ctype, str) {
	//获取字符串的字节长度
	var byte_len = str.utf8_byte_len();
	//得到消息长度
	var total_len =proto_tools.head_size + 2 + byte_len;
	var cmd_buf = alloc_buffer(total_len);
	//写入命令头stype, ctype到cmd_buf
	var offset = write_cmd_header_inbuf(cmd_buf, stype, ctype);
	offset = write_str_inbuf(cmd_buf, offset, str, byte_len);

	return cmd_buf;
}

function decode_str_cmd(cmd_buf) {
	var cmd = {};
	cmd[0] = read_int16(cmd_buf, 0);
	cmd[1] = read_int16(cmd_buf, 2);
	
	//得到消息
	var ret = read_str_inbuf(cmd_buf, proto_tools.head_size);
	cmd[2] = ret[0];

	return cmd;
}

module.exports = proto_tools;
