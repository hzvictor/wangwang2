/*
	状态码
*/

var Respones = {
	OK: 1,//表示成功
	USERLOSTCONN:-97,//玩家掉线
	NO_SELECT_GAME_KID:-98,//没有断线重连所需要的服务器
	NO_FIND_SERVER:-99,//没有找到游戏服务器
	INVALID_PARAMS: -100,//命令参数错误
	SYSTEM_ERR:	-101,//系统错误
	ILLEGAL_ACCOUNT: -102, // 非法的账号
	INVALID_OPT: -103,//非法的操作
	UNAME_OR_UPSWD_ERR: -106,//用户名或者密码错误
	UANME_IS_REGISTER: -107,//帐号已存在
	UNICK_IS_REPEAT: -108,//昵称重复
	NO_RANK_DATA: -109,//没有排行榜数据
	INVALID_ROOM: -110,//游戏农场不存在
	GOLD_IS_NOT_ENOUGH: -111,//金币不足
	VIP_IS_NOT_ENOUGH: -112,//vip等级不足
	LEVEL_IS_NOT_ENOUGH: -113,//玩家等级不足
	FULL_ROOM: -120,//房间已满,禁止加入
	GAMEING_ROOM: -121,//游戏进行中禁止加入
	//麻将服务器
	IS_AT_ROOM: -10001,//已经在房间中
	CARD_IS_NOT_ENOUGH: -10002,//房卡不足
	//五子棋
	NOT_YOU_TURN:-113,//没有轮到你
	NOT_TURN_CHESS: -114,//该位置已经存在棋子
	//扎金花
	NOT_PLAYING_STATE:-401,//玩家不在游戏状态
	MIN_CEll_CHIP:-402,//下注筹码过低
	YOU_PLAYING:-403,//本局游戏未结束禁止离开
	//港澳30秒
	BANKER_STATE:-12201,//坐庄中禁止下注
	NOT_TIME_JETTON: -12202,//不在下注时间

    //农场
	LAND_NOT_EMPTY: -200001,//不是空地
	LAND_IS_EMPTY: -200002,//土地不存在
	LAND_HAVE_CROP: -200003,//已经存在弄作物
	CROP_IS_EMPTY: -200004,//农作物不存在
	CROP_IMMATURE: -200005,//农作物未成熟
	CROP_TOO_LITTLE: -200006,//数量过少,请手下留情
	PROP_IS_EMPTY: -200007,//道具不存在
	HAOYOU_IS_EMPTY: -200008,//暂时还没有好友
	CROP_IS_STEAL: -200009,//已经摘取过了,做人不能太贪心
	ITEM_IS_EMPTY: -200010,//物品不存在
	ITEM_TOO_LITTLE: -200011,//物品数量不足
	CROP_IS_IMMATURE: -200012,//农作物成熟后无法使用道具
	CROP_IS_USE_ITEM: -200013,//已经增产过了,做人不要太贪心
	DIAMOND_IS_NOT_ENOUGH:-200014,//钻石不足
	FRIEND_IS_HAVE:-200015,//已经是好友了
	UNQUALIFIED: -200016,//不满足解锁条件
	FRIEND_FAIL:-200017,//好友添加失败
};

module.exports = Respones;