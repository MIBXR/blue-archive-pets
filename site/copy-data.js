export const ui = {
  pageTitle: '千禧年桌宠图鉴 | Blue Archive Pets',
  brand: 'Blue Archive 千禧年桌宠图鉴',
  millennium: '千禧年科技学院',
  archive: 'Blue Archive',
  folio: '千禧年桌宠图鉴',
  file: 'File', figure: 'Fig.', academy: '千禧年科技学院',
  characterMode: '昼夜角色切换', dayMode: '昼 · 猫冢响', nightMode: '夜 · 飞鸟马时',
  bgm: 'BGM', playMusic: '播放背景音乐', pauseMusic: '暂停背景音乐', chooseTrack: '选择背景音乐',
  quickDownload: '快速下载', stage: '角色互动舞台，开启视线或转椅跟随模式后可使用左右方向键旋转',
  greet: '轻点打招呼', actions: '桌宠动作', chooseAction: '选择桌宠动作',
  pausePet: '暂停桌宠动作', playPet: '播放桌宠动作', spin: '转一圈',
  journalLink: '学生手记与桌面领回', journal: '学生手记', journalEn: 'Field Notes',
  memorial: '记忆大厅', memorialEn: 'Memorial Lobby',
  talk: 'MomoTalk', reply: '选择回复', replay: '重新对话', typing: '正在输入',
  nextDirection: '下一方向', creation: '制作档案与原稿',
  downloads: '桌面领回', downloadsEn: 'Downloads', downloadsSub: '便携包下载与 Agent 导入',
  zip: '下载 ZIP', fullZip: '下载 ZIP 便携包', zipContents: '含透明精灵图集、pet.json 配置与安装说明',
  releases: 'GitHub Release', sha: 'SHA-256',
  agent: 'Agent 一键安装', agentIntro: '选定想要领回桌面的学生，复制安装指令并发送给你的本地 Agent。',
  installTarget: '选择要安装的桌宠', activate: '安装完成后立即设为当前桌宠',
  copy: '复制安装指令', copied: '已复制指令', copySuccess: '指令已写入剪贴板，可直接粘贴至 Agent 对话框。',
  copyManual: '已为你选中完整指令，请按 Ctrl+C 或 ⌘C 复制。', installError: '安装清单暂未载入，可直接下载左侧 ZIP 便携包。',
  fullInstruction: '展开完整 Agent 安装指令', instructionLabel: '完整 Agent 安装指令',
  quickTitle: '桌宠快速领回', quickAgentIntro: '一键复制安装指令，交给本地 Agent 自动下载并写入桌宠配置。', closeDownload: '关闭下载窗口',
  manual: '手动安装指南与精灵图集规格',
  manualSteps: [
    '解压 ZIP 便携包，将角色目录内的 README.md、pet.json 与 spritesheet.png 保持在同一文件夹下。',
    '按客户端的 sprite v2 规范导入目录；若使用 Codex 或 Petdex，可直接复制上方指令交由 Agent 自动部署。'
  ],
  spec: '便携包内含 1536 × 2288 透明 PNG 精灵图集，单格尺寸 192 × 208 像素，收录 57 帧日常动作与 16 帧方位序列；网页舞台另以 520 × 520 高清画布实时渲染透明原稿。',
  sources: '制作致谢与来源', credits: '两款千禧年同人桌宠均由 AI 辅助绘制初稿，再逐帧手工精修动作与方位序列。',
  original: '角色原作 · Blue Archive', artist: '画风参考 · JAZZ_JACK_', repo: '作品仓库 · MIBXR',
  cardBar: 'C&C / CODE 04', closeCard: '收起预告状', cardTitle: '白垩之预告状',
  cardBody: '致老师：\n全角度视线锁定已完成，预告状现已亲手送达。\n今晚的潜入行动与撤离路线，也请继续由我贴身护卫。Peace，peace。',
  cardSignature: 'C&C Code 04 · Asuma Toki'
};

export const tracks = [
  { file: 'la-la-run-inst.mp3', title: 'LA LA RUN!', option: 'LA LA RUN! · 响默认' },
  { file: 'bunny-bunny-carrot.mp3', title: 'Bunny Bunny Carrot', option: 'Bunny Bunny Carrot · 时默认' },
  { file: 'constant-moderato.mp3', title: 'Constant Moderato' },
  { file: 'constant-moderato-piano.mp3', title: 'Constant Moderato · Piano' },
  { file: 'connected-sky.mp3', title: 'Connected Sky' }
];

export const directions = ['正上', '右上偏上', '右上', '右上偏右', '正右', '右下偏右', '右下', '右下偏下', '正下', '左下偏下', '左下', '左下偏左', '正左', '左上偏左', '左上', '左上偏上'];

export const students = {
  hibiki: {
    name: '猫冢响', short: '响', roman: 'Nekozuka Hibiki', display: 'HIBIKI',
    outfit: '拉拉队服', club: '工程部',
    bio: '晄轮大祭的跑道边，响穿上了亲手改制的双色应援服，高尔夫球包里还悄悄藏着擦得锃亮的迫击炮。那些太害羞而喊不出口的「加油」，全都化作了花球扬起时的沙沙风声。',
    event: 'Kivotos Halo Festival', caption: '晄轮大祭 / 场边应援席',
    portraitAlt: '猫冢响戴着蓝色护目镜，身穿亲手改制的双色应援服，双手握着黄白花球',
    tapLabel: '轻点桌宠，向猫冢响打招呼',
    greet: [
      '老师，我在跑道边……替你加油。',
      '花球举到这个高度，看得到吗？',
      '呜……被一直盯着看，会同手同脚的。',
      '裙摆的缝线我加固过了，怎么跳都没问题。',
      '需要火力支援……不、我是说应援的话，请随时叫我。'
    ],
    story: '工坊之外的裁缝与火药',
    storyText: '习惯与扳手和图纸打交道的工程部一年级生，趁着运动会前夜把旧衣细细剪裁成了合身的应援服。虽然球包里依旧本能地备好了迫击炮，但今天这双手只负责握紧黄白相间的花球。',
    lobby: '骤雨初歇的看台一角',
    lobbyText: '护目镜滑到颈间，微湿的犬耳轻轻耷拉着。她把花球拢在膝头，小声询问跑道上的老师有没有听见刚才那句应援。',
    lobbyAlt: '猫冢响记忆大厅预览：看台边微湿的犬耳与轻拢在身前的花球',
    signature: '把星光举到第六拍',
    signatureText: '左摆、收拢、右摆、屈膝蓄力，再在第五拍高高跃起、第六拍轻巧落地。侧摆时漾开天蓝星尘，唯有跳至最高处才会迸出耀眼的明黄星光。',
    signaturePlay: '看六拍应援',
    signatureAlt: '猫冢响的六拍应援动作预览',
    editionNote: 'v1.1 逐帧重绘六拍应援序列，完整保留屈膝起跳、轻巧落地与花球扬起时的蓝黄双色星光。',
    downloadAlt: '拉拉队服猫冢响的待机动作预览',
    follow: '十六方向注视',
    actions: [
      ['安静待机', '花球垂在身侧，毛茸茸的垂耳随着呼吸轻轻颤动，偶尔害羞地眨眼。'],
      ['向右小跑', '抱稳两只花球迈步向右小跑，改制裙摆与犬尾一齐轻快扬起。'],
      ['向左小跑', '转身朝左奔去，护目镜滑在颈间，垂耳与尾巴跟着步点一颠一颠。'],
      ['挥球招呼', '高举右手花球轻轻摇晃，确认你看见她后才腼腆地弯起眼角。'],
      ['轻快起跳', '双手高举花球原地跃起，像是在替刚冲过弯道的你庆祝。'],
      ['害羞捂脸', '被夸奖得不知所措，连忙低下头，用两只蓬松的花球把脸颊藏起来。'],
      ['偏头等候', '把花球乖巧地拢在胸前，微微歪过脑袋，安静等待你的下一句嘱咐。'],
      ['六拍应援', '左右摆臂、屈膝蓄力再全力跃起，在最高处摇出蓝黄交织的应援星光。'],
      ['检查花球', '像在工坊里核对精密零件一样低头拨弄花球，确认扎带牢靠后安心点头。']
    ],
    chat: {
      opening: { text: '老师，刚才冲过弯道的时候……有看见看台边举起来的花球吗？', action: 'waiting' },
      turns: [
        [
          { teacher: '一眼就看见了，两只花球举得比谁都高。', text: '呼……太好了。其实举到最高的时候，花球刚好挡住了视线，我还有点担心老师没瞧见……', action: 'failed' },
          { teacher: '看到了，连最后那一下起跳的星光都很清楚。', text: '真、真的吗？练习时我老是在第四拍就急着起跳，刚才总算踩准了第五拍的鼓点。', action: 'jumping' }
        ],
        [
          { teacher: '那套双色应援服也很合身，是响自己改的？', text: '嗯……拿工程部的备用布料重新剪裁了一遍，袖口和裙摆都留了方便挥臂的余量。', action: 'review' },
          { teacher: '我怎么觉得看台边的高尔夫球包有点眼熟……', text: '那、那个只是以防万一的工程部装备！今天我有忍住，没有给花球加装推进器……', action: 'failed' }
        ],
        [
          { teacher: '下半场换我坐在场边，听响把六拍数完吧。', text: '欸……要在老师面前单独跳一遍吗？一、二、三、四……到第五拍的时候，请一定要看仔细哦。', action: 'running' },
          { teacher: '等比赛结束，我陪你把球包和花球一起拎回工坊。', text: '好……那我就站在终点线旁边等老师。只要看见这只黄白花球，随时向我招手就好。', action: 'waving' }
        ]
      ]
    }
  },
  toki: {
    name: '飞鸟马时', short: '时', roman: 'Asuma Toki', display: 'TOKI',
    outfit: '兔女郎', club: 'C&C',
    bio: '左耳通讯器绿灯常亮，印着千禧年徽记的战术公文箱就拎在手边。时面无表情地强调兔女郎是当前最高效的潜入武装，并在汇报末尾朝老师比了个无可挑剔的 V。',
    event: 'Alabaster Calling Card', caption: '白垩之预告状 / 潜入待命席',
    portraitAlt: '飞鸟马时戴着深蓝兔耳与通讯耳麦，身穿兔女郎潜入装束，手提印有千禧年标志的战术公文箱',
    tapLabel: '轻点桌宠，向飞鸟马时打招呼',
    greet: [
      '通讯清晰，随时可以行动。Peace，peace。',
      '这身装束完全出于战术考量。请不要怀疑。',
      '学兔子的动作也练习过了。要现在验收吗？',
      '只要老师发出指令，这把转椅随时能停在正前方。',
      '表扬的话语，请务必写进今晚的行动报告里。'
    ],
    story: '代号 04 的最优选伪装',
    storyText: '千禧年秘密组织 C&C 的第五位特工。难得与前辈们并肩执行潜入任务，她不仅将公文箱与通讯器调试至完美，还一本正经地在镜前练习了全套兔子动作。',
    lobby: '喧嚣散去后的待命席',
    lobbyText: '霓虹与脚步声隔在门外，她端正地坐在阴影里的转椅上。耳麦微光闪烁，只等老师开口下达只属于她一人的下一条指令。',
    lobbyAlt: '飞鸟马时记忆大厅预览：在昏暗待命室中端坐休息的兔女郎特工',
    signature: '十六方位的静默转椅',
    signatureText: '时端坐于战术转椅之上，两套高清手绘原稿各收录八个精确朝向。无论是顺时针巡视整圈，还是随指针静默微调，她的视线总会稳稳落回老师身上。',
    signaturePlay: '转一圈',
    signatureAlt: '飞鸟马时的十六方向转椅预览',
    editionNote: 'v1.0 完整收录招牌双 V、兔子模仿秀与十六方向无缝衔接的战术转椅序列。',
    downloadAlt: '兔女郎飞鸟马时的待机动作预览',
    follow: '十六方向转椅',
    actions: [
      ['安静待命', '双手稳稳提着战术公文箱，神情波澜不惊地眨眼，保持待命状态。'],
      ['向右行进', '单手拎稳公文箱迈步向右，高跟鞋落地干脆，步幅精准如尺规。'],
      ['向左行进', '利落地调转方向朝左行进，深蓝兔耳随着步伐微微摇晃。'],
      ['双 V 致意', '举起双手比出招牌双 V，冷静的眼底掠过一丝等待夸奖的得意。'],
      ['学学兔子', '双手在胸前蜷成兔爪，一本正经地俯身左右晃动，展示特训成果。'],
      ['轻声叹气', '垂下眼帘轻轻叹了口气，不到半秒又重新站直，恢复无懈可击的姿态。'],
      ['驻足候命', '一手提箱、一手微抬示意，停在原地安静等待老师的下一步指示。'],
      ['接收指令', '指尖轻按左耳通讯器倾听简报，点头确认后迅速整理手边装备。'],
      ['核对装备', '低头逐项检查公文箱锁扣与袖口，确认万无一失后给出冷静回应。']
    ],
    chat: {
      opening: { text: '老师，左耳通讯器测试完毕。现在请对我这身潜入用完美伪装进行最终验收。', action: 'running' },
      turns: [
        [
          { teacher: '伪装很完美，连兔耳朵的角度都无可挑剔。', text: '当然。为了让伪装更具说服力，我还特意练习了兔子的标准动作……就像这样。', action: 'jumping' },
          { teacher: '穿兔女郎装还拎着战术公文箱，会不会太显眼了？', text: '不会。越是无懈可击的精英特工，越要把全套装备带在手边。箱扣已经锁紧了。', action: 'review' }
        ],
        [
          { teacher: '在正式潜入之前，你打算怎么待命？', text: '坐在这把转椅上。经过测算，它能分成十六个方向静音旋转，方便我随时转向老师所在的位置。', action: 'waiting' },
          { teacher: '那把转椅该不会也是 C&C 的战术装备吧？', text: '是我在待命室临时征用的。轴承非常顺滑，哪怕转满一整圈也不会漏听老师的指令。', action: 'waiting' }
        ],
        [
          { teacher: '验收通过。今晚的行动也拜托你了，时。', text: '了解。行动记录的末尾，请允许我按惯例加上那个手势——任务圆满完成，Peace，peace。', action: 'waving' },
          { teacher: '转满一整圈的话，会有特别奖励吗？', text: '您可以亲自试试看。当指针转回原点时，属于老师的预告状就会准时送达。Peace，peace。', action: 'waving' }
        ]
      ]
    }
  }
};
