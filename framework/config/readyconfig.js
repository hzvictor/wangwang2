var fs=require('fs');
//服务器配置文件

//操作对象
function getConfigData(file){
	var data = fs.readFileSync(__dirname +file, 'utf8');  
	//var obj2=eval("("+data+")");  
	var obj2 = JSON.parse(data);
	return obj2;
}

//读取角色等级配置表
function readLevelConfig() {
	var configfile="/level_config.json";
    return getConfigData(configfile);
}

//读取道具配置表
function readPropTemplateConfig() {
	var configfile="/read_prop_template_config.json";
    return getConfigData(configfile);
}
//读取物品配置表
function readItemTemplateConfig() {
	var configfile="/read_item_template_config.json";
    return getConfigData(configfile);
}
//读取荣誉配置表
function readHonorTemplateConfig() {
	var configfile="/honor_config.json";
    return getConfigData(configfile);
}

module.exports = {
    readLevelConfig:readLevelConfig,
    readPropTemplateConfig:readPropTemplateConfig,
    readItemTemplateConfig:readItemTemplateConfig,
    readHonorTemplateConfig:readHonorTemplateConfig,
};