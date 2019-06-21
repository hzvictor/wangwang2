/**
 * 管理所有的服务
 */
var stype = {

    Broadcast: 10000,//广播服务
    GameHeat: 0,//心跳服务
    TalkRoom: 1,
    Auth:2,//验证模块
    GameSystem: 3,//系统服务
    GameFarm:4,//农场服务
};


module.exports = stype;