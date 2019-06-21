/**
 * 全局命令号
 */
var Cmd = {
    //全局命令号 当我们用户丢失链接的时候
    //所有的服务都会收到网关转发过来的这个事件消息
    USER_Disconnect: 10000,

    BROADCAST: 10001,//广播的命令

    //auth服务支持的命令
    Auth: {
        WX_LOGIN: 1, // 微信登陆
		RELOGIN: 2, // 账号在其他设备登陆
        GAME_EXIT: 3,//账号退出
    },
    //系统服务支持的命令
    GameSystem: {
        GET_GAME_INFO: 1,//获取游戏信息
        GET_PROP_INFO: 2,//获取道具信息
		GET_SEED_INFO: 3,//获取种子信息
        GET_HAOYOU_INFO: 4,//获取好友信息
        CHECK_HAOYOU_INFO:5,//验证好友数据
        GET_ITEM_INFO: 6,//获取物品信息
        GET_HONOR_INFO: 7,//获取荣誉信息
        GET_ATTACHED_INFO: 8,//获取附加数据信息
        GET_RANK_GOLD_DATA:9,//获取金币排行榜数据
    },
    //玩家农场服务器
    GameFarm:{
        JOIN_FARM: 1,//创建农场信息
        ACCESS_FARM:2,//参观农场
        PLANTING_CROPS:3,//种植
        HARVEST_CROPS:4,//收获
        SELL_CROPS:5,//卖出
        BUY_SEEDS: 6,//购买种子	
        CROP_RIPENING: 7,//农作物成熟了
		USER_QUIT: 8,//玩家离开服务器
        EXPANSION_LAND:9,//扩建土地
        STEAL_CROPS:10,//偷取农作物
        FRIEND_OPERATION:11,//好友操作标志
        FARM_DYNAMIC:12,//农场动态
        USE_ITEM:13,//使用物品
        BUY_ITEM:14,//购买物品
        ADD_HAOYOU_INFO: 15,//添加好友信息
        UNLOCK_HONOR: 16,//解锁成就
        ATTACHED_INFO: 17,//附加信息
        LIGHT_UP_CROPS: 18,//点亮图标
        NOTICE_ADD_HAOYOU:19,//好友添加通知
        AGREE_OR_REFUSE:20,//好友添加通知操作同意/拒绝
        PLAYING_INFO:21,//同步玩家信息
    },
   
};


module.exports = Cmd;