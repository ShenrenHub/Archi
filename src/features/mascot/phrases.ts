export type MascotRouteKey =
  | "dashboard"
  | "smart-data-center"
  | "device-control"
  | "crop-diagnosis"
  | "admin"
  | "community"
  | "default";

export const mascotPhrases: Record<MascotRouteKey, string[]> = {
  dashboard: [
    "筑泥魔巡检中，驾驶舱今天也要稳一点。",
    "遥测曲线别抖，我先在这儿盯着。",
    "这页像中控室，我负责四处乱逛。 "
  ],
  "smart-data-center": [
    "数据中心味道最重，我喜欢往图表边上蹲。",
    "你们看数据，我负责在屏幕上巡田。",
    "这里信息很多，筑泥魔决定慢一点走。 "
  ],
  "device-control": [
    "控制台别乱点，我只是路过的小泥巴。",
    "设备指令发之前，我先帮你踩踩点。",
    "按钮这么多，筑泥魔得绕着走。 "
  ],
  "crop-diagnosis": [
    "诊断页我熟，叶子不舒服就喊我。",
    "模型在看病，我在旁边装懂。",
    "病斑先别急，我在页面上巡一圈。 "
  ],
  admin: [
    "管理员页面气场有点强，我收敛一点。",
    "这里都是配置项，筑泥魔决定轻手轻脚。",
    "农场和平台都要管，我就在边上晃。 "
  ],
  community: [
    "耕知也要逛，筑泥魔可以围观大家聊天。",
    "社区气氛不错，我跳一下再走。",
    "帖子很多，我先躲开可点击的地方。 "
  ],
  default: [
    "筑泥魔上线，今天继续在温室里乱窜。",
    "我会自己避让，不会故意挡住你操作。",
    "点我一下，我会回一句固定台词。 "
  ]
};
