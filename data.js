const VIDEO_URL     = "https://www.youtube.com/watch?v=x1pfxmRhmc0";
const FULL_SHOW_URL = "https://www.dazn.com/zh-TW/welcome";
const STAT_KEYS  = ['speaking','reflex','data','term','tension'];
const STAT_NAMES = {speaking:'口條', reflex:'臨場', data:'數據', term:'術語', tension:'抗壓'};

// ═══ 難度對應（依關卡階段，不依字數）═══
function getTimerByDifficulty(phase) {
  if (phase === '預賽')   return { seconds: 25, label: '簡單', cls: 'diff-easy',   mult: 1.0 };
  if (phase === '準決賽') return { seconds: 18, label: '進階', cls: 'diff-normal', mult: 1.2 };
  if (phase === '決賽')   return { seconds: 10, label: '困難', cls: 'diff-hard',   mult: 1.5 };
  return                          { seconds: 15, label: '普通', cls: 'diff-normal', mult: 1.0 };
}
// ═══ 三位導師定義 ═══
const MENTORS = {
  qianyeye: {
    id: 'qianyeye', name: '錢爺爺', icon: '🧮',
    title: '專業數據流導師',
    likes:      ['data', 'term'],
    dislikes:   ['speaking'],
    optBonus:   'A',
    optPenalty: 'B',
    initBonus:  { data: 10, term: 10, speaking: -5 }
  },
  dapangge: {
    id: 'dapangge', name: '大胖哥哥', icon: '📚',
    title: '歷史資料庫導師',
    likes:      ['data', 'term', 'reflex'],
    dislikes:   ['tension'],
    optBonus:   'A',
    optPenalty: 'B',
    initBonus:  { data: 8, term: 8, reflex: 5, tension: -5 }
  },
  ningning: {
    id: 'ningning', name: '寧寧', icon: '🎙',
    title: '播報節奏流導師',
    likes:      ['speaking', 'reflex', 'tension'],
    dislikes:   ['data'],
    optBonus:   'A',
    optPenalty: 'C',
    initBonus:  { speaking: 10, reflex: 5, tension: 8, data: -8 }
  }
};

// ═══ 評審評語系統 ═══
const JUDGE_COMMENTS = {
  A_normal: [
    { neutral:'播報節奏穩定，用詞精準到位。',           logic:'面對突發狀況保持冷靜，臨場反應及格。',    data:'術語使用正確，壘包交代清晰無誤。' },
    { neutral:'聲線沉穩，資訊傳遞清楚。',               logic:'沒有過度渲染，判斷力保持理性。',           data:'數據引用準確，球種描述專業。' },
    { neutral:'播報風格中規中矩，觀眾容易理解。',       logic:'邏輯清晰，沒有多餘的情緒干擾。',           data:'專業術語運用恰當，沒有明顯失誤。' }
  ],
  A_wild: [
    { neutral:'這球打得很……等等我剛才在想晚餐要吃什麼。', logic:'邏輯上來說這球應該……算了我也不確定。',  data:'數據我沒帶眼鏡看不太清楚，但感覺對。' },
    { neutral:'嗯，播報得很……好？我在發呆抱歉。',        logic:'從理性角度分析，這球……嗯。',              data:'數字我算了一下，總之就是這樣。' },
    { neutral:'滿分！雖然我剛才去上廁所回來。',          logic:'理性而言這個選擇很……對啊應該是對的。',   data:'數據上完全正確，我猜。' }
  ],
  B_normal: [
    { neutral:'情緒化用語出現，播報專業度下滑。',        logic:'失去判斷基準，被情緒主導了播報節奏。',    data:'術語出現錯誤，數據交代不清楚。' },
    { neutral:'批評用詞過激，容易引發觀眾不適。',        logic:'缺乏理性分析，直接跳到情緒反應。',         data:'專業數據完全沒有引用，失分明顯。' },
    { neutral:'主播立場失守，中立性受到質疑。',          logic:'臨場判斷被情緒蓋過，這是播報大忌。',       data:'完全沒有數據支撐，純粹是個人發洩。' }
  ],
  B_wild: [
    { neutral:'我覺得……還好？情緒也是一種風格吧。',      logic:'從邏輯上說這完全不合理，但我喜歡。',       data:'沒有數據但很有熱情，我給過。' },
    { neutral:'播報品質有點問題，但我今天心情好所以算了。', logic:'理性上這是錯的，感性上我覺得很爽。',   data:'術語錯誤，但聲音很好聽所以加回來。' },
    { neutral:'滿分！雖然我完全不懂棒球。',              logic:'邏輯上說不通，但人生本來就說不通。',       data:'數據全錯，但錯得很有個性。' }
  ],
  C_normal: [
    { neutral:'過度預測干擾播報節奏，專業感下滑。',      logic:'預測未發生的事情屬於主觀臆測，不妥。',    data:'缺乏數據根據的預測，容易誤導觀眾。' },
    { neutral:'娛樂感有了，但播報的核心資訊被稀釋。',    logic:'把推測當事實陳述，邏輯上有問題。',         data:'沒有任何數據支撐，純粹是猜測。' },
    { neutral:'觀眾喜歡，但這不是專業播報該有的樣子。',  logic:'結果導向的預測沒有分析價值。',             data:'術語運用尚可，但數據根據嚴重不足。' }
  ],
  C_wild: [
    { neutral:'我也覺得下一棒會打全壘打，一起猜！',      logic:'從邏輯上說完全沒有根據，但很刺激。',       data:'我查了一下數據，猜錯了但很有趣。' },
    { neutral:'觀眾喜歡就好，播報嘛開心最重要。',        logic:'推測不一定是壞事，也許是對的呢？',         data:'沒有數據但很娛樂，我決定給高分。' },
    { neutral:'這種播報方式在某個平行宇宙裡是正確的。',  logic:'我理性分析了一下，決定不理性。',           data:'數據顯示猜對機率33%，也不算太差。' }
  ]
};

function getJudgeComment(optionType) {
  const isWild = Math.random() < 0.20;
  const key    = optionType + (isWild ? '_wild' : '_normal');
  const pool   = JUDGE_COMMENTS[key];
  const c      = pool[Math.floor(Math.random() * pool.length)];
  return [
    '📋 評審 A：「' + c.neutral + '」',
    '🧠 評審 B：「' + c.logic   + '」',
    '📊 評審 C：「' + c.data    + '」'
  ].join('\n');
}

// ═══ seedToNum（data.js 也需要，避免 generateNPCs 找不到）═══
function seedToNum(seed) {
  let n = 0;
  for (let i = 0; i < seed.length; i++) n += seed.charCodeAt(i) * (i + 1);
  return n;
}

// ═══ NPC 生成（強中弱分段，讓玩家平均落在 5–8 名）═══
function generateNPCs(playerVariant, seed) {
  const n           = seedToNum(seed);
  const playerTotal = STAT_KEYS.reduce((s, k) => s + playerVariant.stats[k], 0);
  const npcNames    = ['林予涵','陸柏宇','張志豪','方宇翔','趙苡寧','陳冠廷','蘇彥廷','葉芷涵','鄭宇軒'];

  return npcNames.map((name, i) => {
    let base;
    if (i < 3) {
      // 強者：總分 340–400（玩家初始約 240–280，強者遠超）
      base = 340 + ((n * (i + 1) * 37) % 61);
    } else if (i < 7) {
      // 中等：總分 280–340
      base = 280 + ((n * (i + 1) * 29) % 61);
    } else {
      // 弱者：總分 200–260
      base = 200 + ((n * (i + 1) * 23) % 61);
    }
    return { name, total: base, base };
  });
}

// NPC 每關微幅浮動（±8）
function fluctuateNPCs(npcs, seed, stageIdx) {
  const n = seedToNum(seed) + stageIdx * 7;
  return npcs.map((npc, i) => {
    const delta = ((n * (i + 1) * 13) % 17) - 8;
    return { ...npc, total: Math.max(150, Math.min(430, npc.total + delta)) };
  });
}
// ═══ 36 種角色變體 ═══
const VARIANTS = [
  {id:'v1', name:'狂熱黑轉粉型',
   desc:'外表甜美卻有極端狠勁，炎上後靠真實數據與反轉表現收穫死忠粉絲，將社群聲量轉化為絕對底氣。',
   tags:{strength:['社群敏感度','逆境反彈'],weakness:['數據底子薄'],hidden:'炎上加速'},
   stats:{speaking:60,reflex:55,data:30,term:35,tension:40}},
  {id:'v2', name:'商業帝國野心型',
   desc:'把節目當作擴展商業版圖的跳板，直接籌備個人自媒體品牌與跨國代言。',
   tags:{strength:['流量嗅覺','談判能力'],weakness:['抗壓起伏大'],hidden:'商業加成'},
   stats:{speaking:65,reflex:50,data:35,term:35,tension:45}},
  {id:'v3', name:'純粹反差萌型',
   desc:'私下天然呆、容易少根筋，播報時卻展現令人跌破眼鏡的強大自律與專業爆發力。',
   tags:{strength:['爆發力強','親和力'],weakness:['術語生疏'],hidden:'反差爆發'},
   stats:{speaking:55,reflex:60,data:30,term:30,tension:35}},
  {id:'v4', name:'被迫營業妥協型',
   desc:'為了經紀合約與金主壓力不得不配合演出，在鏡頭前與私底下有著極大拉扯。',
   tags:{strength:['鏡頭表現穩定'],weakness:['內心壓力大','容易動搖'],hidden:'壓力釋放'},
   stats:{speaking:50,reflex:45,data:35,term:35,tension:40}},
  {id:'v5', name:'數據造假恐慌型',
   desc:'隨時擔心真實專業底子不足被酸民徹底揭穿，在高壓精神壓力下步步為營。',
   tags:{strength:['謹慎細心'],weakness:['極度抗壓低'],hidden:'恐慌崩潰'},
   stats:{speaking:55,reflex:45,data:40,term:30,tension:30}},
  {id:'v6', name:'自媒體獨立創業型',
   desc:'放棄傳統主播台的束縛，走向全方位個人工作室營運，把流量玩弄於股掌之間。',
   tags:{strength:['口條天賦','流量操作'],weakness:['術語略生疏'],hidden:'流量爆炸'},
   stats:{speaking:70,reflex:55,data:35,term:35,tension:50}},
  {id:'v7', name:'傲慢王者降臨型',
   desc:'帶著全場最高光環，用頂級實力與毒舌睥睨一切對手。',
   tags:{strength:['全面實力強','壓制感強'],weakness:['容易得罪人'],hidden:'王者光環'},
   stats:{speaking:60,reflex:65,data:60,term:65,tension:70}},
  {id:'v8', name:'舊傷復發孤高型',
   desc:'帶著身體舊疾強行燃燒最後職業魂，面對失敗有著近乎病態的完美主義。',
   tags:{strength:['數據極強','術語精準'],weakness:['高壓易崩'],hidden:'完美主義'},
   stats:{speaking:55,reflex:60,data:65,term:65,tension:50}},
  {id:'v9', name:'毒舌護短導師型',
   desc:'表面上狂妄酸人、要求苛刻，私底下卻默默提攜後輩，展現霸氣王者的大氣。',
   tags:{strength:['臨場老練','術語精通'],weakness:['形象爭議大'],hidden:'霸氣加持'},
   stats:{speaking:65,reflex:60,data:60,term:60,tension:65}},
  {id:'v10',name:'轉型迷茫掙扎型',
   desc:'從球場跌落後尋找自我價值的過渡期選手，在專業要求與內心失落間拉扯。',
   tags:{strength:['球場經驗豐富'],weakness:['自信不足','容易迷失'],hidden:'轉型爆發'},
   stats:{speaking:50,reflex:50,data:55,term:55,tension:45}},
  {id:'v11',name:'商業代言導向型',
   desc:'把每場轉播當作爭取商業價值最大化的秀場，將個人光環利用到極致。',
   tags:{strength:['口條出色','人氣高'],weakness:['專業深度不足'],hidden:'商業加值'},
   stats:{speaking:70,reflex:55,data:50,term:50,tension:60}},
  {id:'v12',name:'體制反抗狂人型',
   desc:'專挑電視台傳統規矩與高層開砲的異端份子，用絕對實力挑戰體制底線。',
   tags:{strength:['臨場爆發力強','個人特色鮮明'],weakness:['容易惹麻煩'],hidden:'反骨加成'},
   stats:{speaking:65,reflex:65,data:55,term:60,tension:65}},
  {id:'v13',name:'爆肝家庭戰士型',
   desc:'白天寫扣晚上特訓，受限於體力上限，全家總動員進行背水一戰的熱血挑戰。',
   tags:{strength:['數據扎實','毅力超群'],weakness:['口條較弱','體力有限'],hidden:'家庭驅動'},
   stats:{speaking:40,reflex:45,data:65,term:60,tension:60}},
  {id:'v14',name:'隱藏技術流大師型',
   desc:'用程式邏輯與理性分析精準解構運動數據，成為年輕戰場中的理科黑馬。',
   tags:{strength:['數據頂尖','術語精準'],weakness:['口條生硬'],hidden:'數據降維'},
   stats:{speaking:45,reflex:50,data:75,term:70,tension:55}},
  {id:'v15',name:'職場反擊中年型',
   desc:'為了向機車主管與生活壓力證明自己而參賽，將大叔的沉穩內斂化為最強反擊。',
   tags:{strength:['抗壓穩定','處事成熟'],weakness:['口條略顯保守'],hidden:'中年爆發'},
   stats:{speaking:45,reflex:45,data:60,term:60,tension:65}},
  {id:'v16',name:'浪漫夢想實踐型',
   desc:'為了填補年少遺憾，不計代價地燃燒中年魂，成為最純粹的追夢代表。',
   tags:{strength:['熱情感染力強'],weakness:['數據偏弱','術語生疏'],hidden:'夢想燃燒'},
   stats:{speaking:50,reflex:45,data:60,term:55,tension:50}},
  {id:'v17',name:'同事掩護黑馬型',
   desc:'靠著部門同事私下掩護請假參賽，背負著同事們的惡搞期待與溫暖支援往前衝。',
   tags:{strength:['團隊精神強'],weakness:['數據準備不足'],hidden:'集體應援'},
   stats:{speaking:45,reflex:50,data:60,term:60,tension:55}},
  {id:'v18',name:'體力極限突破型',
   desc:'克服年齡與專注力衰退的劣勢，靠著超強毅力與抗壓性在直播台硬撐到底。',
   tags:{strength:['抗壓頂尖','意志力強'],weakness:['口條略弱'],hidden:'極限突破'},
   stats:{speaking:40,reflex:45,data:60,term:55,tension:70}},
  {id:'v19',name:'降維打擊冷血型',
   desc:'用硬核數據輕鬆拿高分，將對手遠遠甩在身後的冷血機器。',
   tags:{strength:['數據頂尖','術語無懈可擊'],weakness:['抗壓偏低','情感表達弱'],hidden:'數據壓制'},
   stats:{speaking:45,reflex:50,data:85,term:80,tension:35}},
  {id:'v20',name:'社交障礙突破型',
   desc:'說話容易戳到人，但在殘酷舞台中被迫學習溝通與應變。',
   tags:{strength:['數據強大'],weakness:['口條生硬','抗壓極低'],hidden:'成長爆發'},
   stats:{speaking:35,reflex:45,data:80,term:75,tension:30}},
  {id:'v21',name:'完美主義崩潰型',
   desc:'容不得半次失誤，遇到突發狀況時極易陷入精神內耗的死胡同。',
   tags:{strength:['數據術語極強'],weakness:['抗壓危險','臨場易崩'],hidden:'完美崩塌'},
   stats:{speaking:40,reflex:40,data:85,term:80,tension:25}},
  {id:'v22',name:'父母期待解脫型',
   desc:'想擺脫精英家庭的完美主義框架，透過播報來尋找真正的自我價值。',
   tags:{strength:['數據底子強'],weakness:['心理壓力大'],hidden:'自我解放'},
   stats:{speaking:40,reflex:45,data:75,term:70,tension:35}},
  {id:'v23',name:'邏輯死胡同鑽研型',
   desc:'遇到非預期狀況與情感題時大腦會卡死，陷入無法自拔的死胡同。',
   tags:{strength:['數據精準'],weakness:['臨場反應慢','抗壓偏低'],hidden:'邏輯鑽牛角'},
   stats:{speaking:35,reflex:40,data:85,term:80,tension:30}},
  {id:'v24',name:'意外覺醒感性型',
   desc:'從冷血數據機器轉變為能用情感與溫度打動觀眾的獨特主播。',
   tags:{strength:['數據強','感性覺醒'],weakness:['抗壓待加強'],hidden:'感性爆發'},
   stats:{speaking:50,reflex:50,data:75,term:70,tension:45}},
  {id:'v25',name:'菁英科班偏執型',
   desc:'對專業正統性有強烈潔癖，擁有 KPI 完美主義計量表，容不得絲毫瑕疵。',
   tags:{strength:['口條術語頂尖','臨場穩定'],weakness:['抗壓偏緊繃'],hidden:'科班加持'},
   stats:{speaking:70,reflex:65,data:60,term:65,tension:50}},
  {id:'v26',name:'地方台急功近利型',
   desc:'渴望一步登天進軍全國台，得失心極重，容易在壓力下產生焦慮失衡。',
   tags:{strength:['口條成熟'],weakness:['抗壓低','得失心重'],hidden:'急功爆衝'},
   stats:{speaking:65,reflex:60,data:55,term:60,tension:40}},
  {id:'v27',name:'破除門戶之見型',
   desc:'經歷與非科班選手的激烈碰撞後，開始轉變心態並認同對方的潛力。',
   tags:{strength:['口條穩定','心態成長'],weakness:['初期偏見重'],hidden:'門戶破除'},
   stats:{speaking:65,reflex:60,data:60,term:60,tension:55}},
  {id:'v28',name:'高壓 KPI 狂熱型',
   desc:'替自己設定極為嚴苛的績效指標，將高壓化為鞭策自己的殘酷鞭子。',
   tags:{strength:['口條數據強'],weakness:['抗壓起伏大'],hidden:'KPI 爆發'},
   stats:{speaking:70,reflex:60,data:65,term:65,tension:45}},
  {id:'v29',name:'職場暗箭防衛型',
   desc:'一邊防備同儕的暗箭與扯後腿，一邊咬牙硬闖決賽的孤傲女強人。',
   tags:{strength:['臨場強韌','口條成熟'],weakness:['容易分心防衛'],hidden:'孤高護盾'},
   stats:{speaking:65,reflex:65,data:60,term:60,tension:55}},
  {id:'v30',name:'轉型獨立主播型',
   desc:'誓言跳脫地方台舒適圈，擺脫體制束縛以獨立姿態掌控全國主播台話語權。',
   tags:{strength:['口條頂尖','全面均衡'],weakness:['無明顯弱點但缺乏特色'],hidden:'獨立爆發'},
   stats:{speaking:75,reflex:65,data:60,term:65,tension:60}},
  {id:'v31',name:'隨遇而安鬆弛型',
   desc:'抱著「大不了就這樣」的心態參賽，將比賽當作年度最大的休閒活動。',
   tags:{strength:['心態平衡','壓力免疫'],weakness:['缺乏進取心'],hidden:'鬆弛奇蹟'},
   stats:{speaking:50,reflex:50,data:45,term:45,tension:50}},
  {id:'v32',name:'絕境傻勁爆發型',
   desc:'平時表現平庸，但在淘汰邊緣靠著傻勁觸發隨機奇蹟爆發的變數角色。',
   tags:{strength:['逆境爆發力'],weakness:['初期表現平庸'],hidden:'絕境奇蹟'},
   stats:{speaking:45,reflex:55,data:40,term:40,tension:60}},
  {id:'v33',name:'社畜集體應援型',
   desc:'帶著全公司同事的惡搞期待與茶水間應援，默默在選秀地獄中前進。',
   tags:{strength:['群體支撐力強','抗壓穩定'],weakness:['個人特色模糊'],hidden:'集體加持'},
   stats:{speaking:50,reflex:45,data:45,term:40,tension:55}},
  {id:'v34',name:'職場邊緣逆襲型',
   desc:'從被路人直接忽略的小透明，逐漸蛻變為受到關注的話題黑馬。',
   tags:{strength:['成長速度快'],weakness:['初期弱勢'],hidden:'黑馬逆襲'},
   stats:{speaking:45,reflex:50,data:50,term:45,tension:50}},
  {id:'v35',name:'尋找自我解脫型',
   desc:'透過高壓比賽來探索自我、擺脫日復一日的枯燥生活與職場迷茫。',
   tags:{strength:['內省能力強'],weakness:['目標不夠明確'],hidden:'自我覺醒'},
   stats:{speaking:50,reflex:45,data:45,term:45,tension:45}},
  {id:'v36',name:'隨機奇蹟創造型',
   desc:'數值極度不穩定、容易被挫折嚇到，卻總能在絕境中打出神來之筆的佳作。',
   tags:{strength:['不可預測性強'],weakness:['極度不穩定'],hidden:'神來之筆'},
   stats:{speaking:45,reflex:60,data:40,term:40,tension:45}}
];// ═══ 主關卡題庫（刪題後 34 題）═══
const QUESTION_POOL = [
// ── 預賽 ──
{id:'q_pre1', phase:'預賽', match:'統一獅 vs 富邦悍將',
 label:'3局上・陳鏞基中外野安打突破僵局',
 img:'assets/q1.png',
 q:'請看圖說故事，你如何播報這記得分？',
 roleBonus:{'v25':{optType:'A',bonus:{speaking:8,term:5}},'v30':{optType:'A',bonus:{speaking:8,term:5}}},
 options:[
  {text:'「把握得點圈機會，打穿防線！二壘跑者邱智呈輕鬆回本壘，統一獅 1 比 0 先馳得點！」',type:'A',effect:{speaking:-3,reflex:5,data:8,term:10,tension:5},social:{ptt:80,fans:1500}},
  {text:'「這投手太甜了！根本白白送分！投手到底在投什麼！」',type:'B',effect:{speaking:15,reflex:8,data:-12,term:-10,tension:-18},social:{ptt:250,fans:-2500}},
  {text:'「成功突破僵局！陳鏞基今晚狀態火燙，期待他的表現！」',type:'C',effect:{speaking:10,reflex:-5,data:-14,term:-12,tension:23},social:{ptt:180,fans:1000}}
]},

{id:'q_pre2', phase:'預賽', match:'統一獅 vs 富邦悍將',
 label:'得點圈有人局面，擊出雙殺打中斷攻勢',
 img:'./assets/q2.jpg',
 q:'請看圖說故事，你如何播報這記得分？',
 roleBonus:{'v1':{optType:'C',bonus:{fans:2500,speaking:8}},'v7':{optType:'A',bonus:{term:8,speaking:5}}},
 options:[
  {text:'「右外野安打穿越！帶有兩分打點！三壘跑者李丞齡、二壘跑者陳聖平接連回來！統一獅 4 比 0 大幅領先！」',type:'A',effect:{speaking:-3,reflex:5,data:8,term:12,tension:8},social:{ptt:80,fans:1500}},
  {text:'「完全擋不住四爺！這顆肉包球根本白白送分！」',type:'B',effect:{speaking:15,reflex:8,data:-12,term:-10,tension:-18},social:{ptt:250,fans:-2500}},
  {text:'「看吧神準命中！這就是台灣隊長的巨星價值！下一棒繼續轟！」',type:'C',effect:{speaking:10,reflex:-5,data:-14,term:-12,tension:12},social:{ptt:180,fans:1000}}
]},

// ── 準決賽 ──
{id:'q_semi1', phase:'準決賽', match:'統一獅 vs 富邦悍將',
 label:'7局上・潘傑楷陽春全壘打',
 q:'7局上第6棒 3B 潘傑楷擊出右外野高飛球，球直接飛越全壘打牆！陽春全壘打！比數來到 6:0！這是全場最高潮的一擊，你如何拉高現場氣氛？',
 roleBonus:{'v6':{optType:'C',bonus:{fans:3000,speaking:10}},'v9':{optType:'A',bonus:{speaking:8,term:8}}},
 options:[
  {text:'「這球咬中了！高高飛起！往右外野方向去⋯⋯出去了！潘傑楷轟出陽春全壘打！樂天再添保險分！」',type:'A',effect:{speaking:-3,reflex:8,data:8,term:12,tension:10},social:{ptt:120,fans:3000}},
  {text:'「全壘打啦！打出去了！投手今天完全投不好！悍將牛棚快換人！」',type:'B',effect:{speaking:18,reflex:10,data:-14,term:-12,tension:-22},social:{ptt:300,fans:-3000}},
  {text:'「開轟！我就說他今晚手感燙！潘帥完全命中我的預測！」',type:'C',effect:{speaking:12,reflex:-5,data:-16,term:-14,tension:14},social:{ptt:200,fans:1500}}
]},

{id:'q_semi2', phase:'準決賽', match:'Rakuten Monkeys vs 富邦悍將',
 label:'8局下・申皓瑋安打終結零封夢',
 q:'8局下富邦悍將終於反擊，第7棒大寶寶擊出右外野安打帶有 1 分打點，三壘跑者隊長跑回本壘，城堡隊追成 1:2！比賽還沒結束，你如何掌控「氣氛由鬆轉緊」的微妙節點？',
 roleBonus:{'v18':{optType:'A',bonus:{tension:8,reflex:5}},'v32':{optType:'C',bonus:{fans:2500,speaking:8}}},
 options:[
  {text:'「申皓瑋頂住壓力！右外野方向落地安打！三壘跑者回來得分！富邦破蛋追成一分落後，比賽還有懸念！」',type:'A',effect:{speaking:-3,reflex:8,data:8,term:12,tension:10},social:{ptt:100,fans:2000}},
  {text:'「終於得分了！整整等八局，這口氣總算吐出來！牛棚快頂住不要再失分！」',type:'B',effect:{speaking:18,reflex:10,data:-14,term:-12,tension:-22},social:{ptt:300,fans:-3000}},
  {text:'「命中破冰！我就說悍將這局一定會追分！接下來要大逆轉了！」',type:'C',effect:{speaking:12,reflex:-5,data:-16,term:-14,tension:14},social:{ptt:200,fans:1200}}
]},

// ── 決賽（種子碼隨機抽 1 題）──
{id:'q_fin1', phase:'決賽', match:'Rakuten Monkeys vs 富邦悍將',
 label:'10局下・李勛傑再見安打',
 q:'10局下，兩出局三壘有人，李勛傑面對高壓第一球就積極出棒——擊出再見安打！富邦五比四收下勝利！這是今晚最後一棒，你的播報是？',
 roleBonus:{'v30':{optType:'A',bonus:{speaking:10,term:5}},'v7':{optType:'A',bonus:{speaking:8,term:8}}},
 options:[
  {text:'「第一球積極進攻！打出去了！中外野方向！落地！再見安打！李勛傑！富邦悍將五比四拿下今晚的勝利！」',type:'A',effect:{speaking:-3,reflex:8,data:8,term:12,tension:10},social:{ptt:150,fans:4000}},
  {text:'「打出去了！再見安打！他是今晚的超級英雄！贏了贏了！！！」',type:'B',effect:{speaking:18,reflex:10,data:-14,term:-12,tension:-22},social:{ptt:350,fans:-2000}},
  {text:'「神預言完美收尾！再見安打劇本就是我寫的！完全命中！」',type:'C',effect:{speaking:12,reflex:-5,data:-16,term:-14,tension:14},social:{ptt:200,fans:2000}}
]},

{id:'q_fin2', phase:'決賽', match:'Rakuten Monkeys vs 富邦悍將',
 label:'8局下・梁家榮中外野安打追平',
 q:'8局下，梁家榮抓低球推往中線，成熟打者關鍵一擊追平比分！四比四，比賽回到原點！你如何播報這個讓全場沸騰的追平時刻？',
 roleBonus:{'v9':{optType:'A',bonus:{speaking:8,term:8}},'v36':{optType:'C',bonus:{fans:3000,speaking:10}}},
 options:[
  {text:'「抓低球推往中線！穿過去了！帶有打點！梁家榮追平比分！四比四！比賽回到原點！」',type:'A',effect:{speaking:-3,reflex:8,data:8,term:12,tension:10},social:{ptt:150,fans:4000}},
  {text:'「追平啦！終結者放火！棒球最刺激的時刻就是現在！全場都瘋了！」',type:'B',effect:{speaking:18,reflex:10,data:-14,term:-12,tension:-22},social:{ptt:350,fans:-2000}},
  {text:'「完全命中！我就說阿銀這棒必定追平！接下來等我預測再見砲！」',type:'C',effect:{speaking:12,reflex:-5,data:-16,term:-14,tension:14},social:{ptt:200,fans:2000}}
]},

{id:'q_fin3', phase:'決賽', match:'統一獅 vs 富邦悍將',
 label:'逆轉・朱迦恩右外野安打得2分',
 q:'兩好兩壞滿球數，朱迦恩果斷出棒，擊出右外野安打帶兩分打點，統一獅完成大逆轉！這是今晚最戲劇性的一棒，你如何收尾？',
 roleBonus:{'v32':{optType:'C',bonus:{fans:3500,speaking:10}},'v25':{optType:'A',bonus:{speaking:8,term:8}}},
 options:[
  {text:'「兩好兩壞滿球數！果斷出棒！右外野方向！穿越！帶有兩分打點！統一獅完成大逆轉！朱迦恩！今晚的英雄！」',type:'A',effect:{speaking:-3,reflex:8,data:8,term:12,tension:10},social:{ptt:150,fans:4000}},
  {text:'「逆轉啦！兩分打點！太神了！悍將牛棚放火啦！完全守不住！」',type:'B',effect:{speaking:18,reflex:10,data:-14,term:-12,tension:-22},social:{ptt:350,fans:-2000}},
  {text:'「逆轉啦！兩分打點一棒逆轉！朱迦恩超級英雄！這劇本我老早就預測到了！」',type:'C',effect:{speaking:12,reflex:-5,data:-16,term:-14,tension:14},social:{ptt:200,fans:2000}}
]}

];

const SPECIAL_POOL = [

{id:'s01',label:'場外事件：休息室的挑釁',isEvent:true,
 q:'賽前休息室，對手陣營的選手笑著對你說：「等下看你播報數據吃螺絲囉，加油呀。」你怎麼回應？',
 roleBonus:{'v7':{optType:'A',bonus:{tension:8,speaking:5}},'v9':{optType:'A',bonus:{tension:5,reflex:5}}},
 options:[
  {text:'冷笑回擊：「管好自己的動態截圖吧，別等下被酸民罵翻。」',type:'B',effect:{speaking:8,reflex:5,tension:-12},social:{ptt:180,fans:-800}},
  {text:'微笑帶過：「謝謝提醒，我們場上用實力說話。」',type:'A',effect:{speaking:5,reflex:8,data:5,term:5,tension:12},social:{ptt:40,fans:1200}},
  {text:'緊張得說不出話，默默走開。',type:'C',effect:{speaking:-8,tension:-10,reflex:5},social:{ptt:20,fans:300}}
]},

{id:'s02',label:'場外事件：前輩的施壓',isEvent:true,
 q:'前球星路過你的座位，看了一眼你的戰術筆記冷冷說：「這種記法太外行了。」你選擇？',
 roleBonus:{'v12':{optType:'B',bonus:{fans:2000,speaking:8}},'v7':{optType:'A',bonus:{data:8,term:8}}},
 options:[
  {text:'不服氣回嗆：「不然你來教我啊？」',type:'B',effect:{speaking:10,reflex:-8,tension:-15},social:{ptt:150,fans:-1200}},
  {text:'虛心請教：「前輩覺得哪裡可以修正？懇請指教。」',type:'A',effect:{data:12,term:12,tension:10,speaking:3},social:{ptt:50,fans:1800}},
  {text:'把筆記本收起來，當作沒聽見。',type:'C',effect:{tension:5,speaking:3,data:-5},social:{ptt:10,fans:200}}
]},

{id:'s05',label:'場外事件：深夜 PTT 爆料文',isEvent:true,
 q:'半夜被爆料，與某隊選手深夜共進消夜，你會怎麼面對？',
 roleBonus:{'v18':{optType:'A',bonus:{tension:10,reflex:5}},'v15':{optType:'A',bonus:{tension:8,reflex:5}}},
 options:[
  {text:'立刻開小號在底下護航。',type:'B',effect:{speaking:-12,reflex:-18,tension:-28},social:{ptt:500,fans:-6000}},
  {text:'關掉手機沉睡，當作沒這件事。',type:'A',effect:{speaking:2,reflex:12,tension:22,data:5},social:{ptt:-60,fans:-5000}},
  {text:'心情大受打擊，這明明就是抹黑，躲在棉被裡哭了一整晚。',type:'C',effect:{speaking:-10,tension:-20,reflex:5},social:{ptt:80,fans:-800}}
]},

{id:'s08',label:'場外事件：被對手粉絲出征',isEvent:true,
 q:'對手陣營的粉絲集體在你的所有貼文底下洗版「退賽」，評論數量衝破五千，你怎麼面對？',
 roleBonus:{'v7':{optType:'A',bonus:{tension:10,speaking:5}},'v12':{optType:'C',bonus:{fans:3000,speaking:8}}},
 options:[
  {text:'逐一回覆每一則評論為自己辯護，越陷越深。',type:'B',effect:{speaking:-5,tension:-25,reflex:-10},social:{ptt:600,fans:-4000}},
  {text:'開啟留言過濾，專注在真心支持你的粉絲身上。',type:'A',effect:{speaking:8,tension:20,reflex:5},social:{ptt:100,fans:3500}},
  {text:'直接把帳號設為私人，消失三天後回來。',type:'C',effect:{speaking:-3,tension:12,reflex:8},social:{ptt:150,fans:-500}}
]},

{id:'s11',label:'場外事件：主業很辛苦，要怎麼準備',isEvent:true,
 q:'節目錄影前三天，你的本業突然接到大案子，加班到深夜，根本沒時間準備播報功課，你怎麼辦？',
 roleBonus:{'v13':{optType:'A',bonus:{tension:8,data:5}},'v17':{optType:'A',bonus:{tension:5,data:5}}},
 options:[
  {text:'直接放棄準備，去錄影時靠臨場反應硬撐。',type:'B',effect:{speaking:-5,data:-15,term:-12,tension:-8},social:{ptt:100,fans:-800}},
  {text:'利用通勤時間聽比賽 podcast、午休看球賽數據，把零碎時間全部用上。',type:'A',effect:{speaking:5,data:10,term:8,tension:10,reflex:8},social:{ptt:80,fans:2000}},
  {text:'跟節目組請假說身體不舒服，先把本業顧好。',type:'C',effect:{speaking:-10,tension:5,reflex:3},social:{ptt:50,fans:-500}}
]},

{id:'s16',label:'場外事件：桃色風波',isEvent:true,
 q:'有八卦媒體拍到你和其他選手在電影院手牽手，隔天標題是「曖昧確定？選手假日幽會」，你怎麼處理？',
 roleBonus:{'v2':{optType:'B',bonus:{fans:5000,speaking:5}},'v11':{optType:'B',bonus:{fans:4000}}},
 options:[
  {text:'馬上開直播解釋，越說越激動，最後哭出來被截圖。',type:'B',effect:{speaking:-8,tension:-22,reflex:-5},social:{ptt:600,fans:5000}},
  {text:'發一句簡短聲明：「純屬友人，謝謝關心，請把注意力放在節目本身。」',type:'A',effect:{speaking:8,tension:15,reflex:10},social:{ptt:200,fans:3000}},
  {text:'完全不回應，讓炒作自然消退，繼續專注練習。',type:'C',effect:{speaking:3,tension:10,reflex:5},social:{ptt:300,fans:2000}}
]},

{id:'s20',label:'突發狀況：搭檔主播說錯話',isEvent:true,
 q:'你的搭檔主播在直播中把「高飛犧牲打」說成「自殺打」，全場一片靜默，你必須立刻接話，你說什麼？',
 roleBonus:{'v9':{optType:'A',bonus:{speaking:8,reflex:8}},'v25':{optType:'A',bonus:{speaking:5,reflex:5}}},
 options:[
  {text:'大笑說：「哈哈我搭檔說了個冷笑話！」把尷尬完全轉移到搭檔身上。',type:'B',effect:{speaking:5,reflex:8,tension:-15,term:-5},social:{ptt:400,fans:2000}},
  {text:'無縫接話：「也就是說三壘跑者用這支高飛犧牲打順利回本壘得分——」完全覆蓋過去。',type:'A',effect:{speaking:18,reflex:20,tension:12,term:15},social:{ptt:100,fans:3500}},
  {text:'沉默兩秒，尷尬地繼續播報下一球，當作沒聽到。',type:'C',effect:{speaking:-8,reflex:-5,tension:5,term:3},social:{ptt:180,fans:-500}}
]},

{id:'s23',label:'突發狀況：被嫌播報無聊',isEvent:true,
 q:'直播進行中，你看到彈幕洗版「這個播報怎麼這麼無聊」「換人換人」，而且越來越多，你怎麼應對？',
 roleBonus:{'v6':{optType:'B',bonus:{fans:3500,speaking:8}},'v11':{optType:'B',bonus:{fans:3000,speaking:5}}},
 options:[
  {text:'在直播中直接說：「有些人覺得我無聊，那我表演一下怎樣叫有趣。」開始誇張模仿搞笑播報。',type:'B',effect:{speaking:8,reflex:5,tension:-15,term:-12},social:{ptt:400,fans:3000}},
  {text:'無視彈幕，專注在比賽節奏上，讓下一個精彩時刻的播報自己說話。',type:'A',effect:{speaking:15,reflex:12,tension:18,term:10},social:{ptt:100,fans:3500}},
  {text:'偷偷調整一下語調，加了幾個感嘆詞，但整體沒太大改變。',type:'C',effect:{speaking:3,reflex:5,tension:5,term:3},social:{ptt:150,fans:800}}
]}

];
// ═══ 結局文案 ═══
const ENDINGS = [
  {id:'tragic_hero',
   condition: s => s.wasRevived && s.fans >= 6000,
   rank:'🔥', titleClass:'tragic',
   title:    name => name + ' ── 浴火重生的悲劇英雄',
   subtitle: (name,seed,role,mentor) =>
     '帶著種子碼 ' + seed + ' 闖關，身為【' + role + '】的你曾在中途遭遇崩潰淘汰，卻展現了無與倫比的韌性。' +
     mentor.icon + ' ' + mentor.name + '對你讚不絕口：「這種逆境中的爆發力，是無法靠訓練得來的。」'},

{id:'champion',
 condition: s => {
   const avg    = s.total / STAT_KEYS.length;
   const hasAce = STAT_KEYS.some(k => s.statValues[k] >= 93);
   return avg >= 90 && hasAce && s.fans >= 8000 && s.ptt >= 500 && s.ranking <= 3;
 },
 rank:'🏆', titleClass:'',
 title:    name => name + ' ── DAZN 正式簽約主播！',
 subtitle: (name,seed,role,mentor) =>
   '種子碼 ' + seed + ' 挑戰成功！身為【' + role + '】的你均衡發展五角戰力，並在某項能力達到頂尖水準，在輿論場與專業考驗中全面制霸，排名衝入前三。' +
   mentor.icon + ' ' + mentor.name + '第一個站起來鼓掌：「這就是我要的主播！」'},

  {id:'runner_up',
   condition: s => s.total >= 280 && s.fans >= 6000
                && STAT_KEYS.every(k => s.statValues[k] >= 40)
                && s.ranking <= 5,
   rank:'🥈', titleClass:'',
   title:    name => name + ' ── 準簽約候補主播',
   subtitle: (name,seed,role,mentor) =>
     '【' + role + '】你的表現非常亮眼，排名穩定維持前五。' +
     mentor.icon + ' ' + mentor.name + '私下告訴製作人：「如果首選因故無法出賽，第一個考慮的就是這位。」種子碼：' + seed},

  {id:'specialist',
   condition: s => s.total >= 270 && !STAT_KEYS.every(k => s.statValues[k] >= 40),
   rank:'🎯', titleClass:'',
   title:    name => name + ' ── 偏科達人，潛力未完全開發',
   subtitle: (name,seed,role,mentor) =>
     '【' + role + '】你在某些領域表現驚豔，但五角戰力失衡讓評審認為你尚未準備好。' +
     mentor.icon + ' ' + mentor.name + '說：「專長很突出，但要成為合格主播，均衡才是關鍵。」（種子碼：' + seed + '）'},

  {id:'trainee',
   condition: s => s.total >= 220 && s.fans >= 3000
                && STAT_KEYS.every(k => s.statValues[k] >= 35),
   rank:'🌟', titleClass:'',
   title:    name => name + ' ── 官方潛力培訓主播',
   subtitle: (name,seed,role,mentor) =>
     '經歷這場選秀洗禮（種子碼 ' + seed + '），身為【' + role + '】的你展現出均衡潛質。' +
     mentor.icon + ' ' + mentor.name + '點名將你列入培訓名單：「給我半年，我有把握把你練出來。」'},

  {id:'internet_star',
   condition: s => s.fans >= 8000 && !STAT_KEYS.every(k => s.statValues[k] >= 35),
   rank:'📱', titleClass:'',
   title:    name => name + ' ── 爭議性話題網紅主播',
   subtitle: (name,seed,role,mentor) =>
     '【' + role + '】你在網路上擁有極高聲量，但' +
     mentor.icon + ' ' + mentor.name + '搖頭：「人氣不等於實力，五角戰力失衡的問題不解決，上了播報台遲早翻車。」（種子碼：' + seed + '）'},

  {id:'failed',
   condition: () => true,
   rank:'🌱', titleClass:'',
   title:    name => name + ' ── 未能及格的播報挑戰者',
   subtitle: (name,seed,role,mentor) =>
     '實境秀的殘酷在於它篩選掉不適合的人。' +
     mentor.icon + ' ' + mentor.name + '留下一句話：「這次沒過沒關係，但你需要從頭審視自己想要什麼。」（種子碼：' + seed + '）'}
];