// Campaign v3: the first eight maps are unchanged; open-water signal maps follow.
// Counts include every legal route within the budget and the signal state.
export const ROUTE_LEVELS = [
  {
    title: "灯塔初航",
    difficulty: "简单",
    chapter: "近岸启航",
    focus: "先串起三个航标；这一关留有绕路余量。",
    start: 21,
    end: 27,
    beacons: [22,24,26],
    obstacles: [0,1,2,3,4,5,6,7,8,12,13,35,36,37,38,39,40,41,42,43,44,45,46,47,48],
    currents: {},
    limit: 10,
    reference: [21,22,23,24,25,26,27],
    analysis: {"shortest":6,"solutionCount":97,"misleadingBranches":0},
  },
  {
    title: "顺流转向",
    difficulty: "简单",
    chapter: "近岸启航",
    focus: "进入洋流前，先看清箭头规定的出口。",
    start: 21,
    end: 27,
    beacons: [16,17,33],
    obstacles: [28,5,30,40,3,10,1,12,36,31,38],
    currents: {"18":"down","23":"up"},
    limit: 14,
    reference: [21,22,23,16,17,18,25,32,33,34,27],
    analysis: {"shortest":10,"solutionCount":76,"misleadingBranches":5},
  },
  {
    title: "岛间折返",
    difficulty: "简单",
    chapter: "近岸启航",
    focus: "在靠近灯塔之前，确认所有航标都能顺路收齐。",
    start: 21,
    end: 27,
    beacons: [36,31,18],
    obstacles: [44,5,19,47,46,34,9,40,45,2,43,6,33,7,42,10,1,4],
    currents: {"29":"down"},
    limit: 14,
    reference: [21,22,29,36,37,30,31,24,17,18,25,26,27],
    analysis: {"shortest":12,"solutionCount":42,"misleadingBranches":6},
  },
  {
    title: "第一处分岔",
    difficulty: "简单",
    chapter: "近岸启航",
    focus: "分岔会把航线带向不同区域，先看回程能否连上。",
    start: 21,
    end: 27,
    beacons: [36,46,24],
    obstacles: [2,10,14,0,47,20,13,15,9,42,16,32,34,5,8,40,4],
    currents: {"31":"up","35":"right"},
    limit: 16,
    reference: [21,22,29,36,37,44,45,46,39,38,31,24,25,26,27],
    analysis: {"shortest":14,"solutionCount":38,"misleadingBranches":5},
  },
  {
    title: "航标次序",
    difficulty: "标准",
    chapter: "群岛探索",
    focus: "别只追最近的航标；先决定三个目标的收集顺序。",
    start: 21,
    end: 27,
    beacons: [1,15,31],
    obstacles: [6,20,41,46,0,29,42,43,47,39,34,19,5,36,17,37],
    currents: {"9":"down","16":"left"},
    limit: 18,
    reference: [21,14,7,8,1,2,9,16,15,22,23,24,31,32,25,26,27],
    analysis: {"shortest":16,"solutionCount":23,"misleadingBranches":7},
  },
  {
    title: "洋流接力",
    difficulty: "标准",
    chapter: "群岛探索",
    focus: "把洋流的入口和出口一起考虑，避免断开后面的航线。",
    start: 21,
    end: 27,
    beacons: [31,8,11],
    obstacles: [0,33,23,41,32,36,43,1,22,25,13,47,45,48],
    currents: {"9":"up","16":"left","19":"right"},
    limit: 20,
    reference: [21,28,29,30,31,24,17,16,15,8,9,2,3,4,11,12,19,20,27],
    analysis: {"shortest":18,"solutionCount":14,"misleadingBranches":7},
  },
  {
    title: "远岸迂回",
    difficulty: "标准",
    chapter: "群岛探索",
    focus: "绕远不一定是错路，先把整条航程规划完整。",
    start: 21,
    end: 27,
    beacons: [10,13,31],
    obstacles: [16,7,36,38,0,12,45,1,46,47,11,30,41],
    currents: {"18":"down","20":"left","32":"right"},
    limit: 20,
    reference: [21,14,15,8,9,10,3,4,5,6,13,20,19,26,25,24,31,32,33,34,27],
    analysis: {"shortest":20,"solutionCount":6,"misleadingBranches":9},
  },
  {
    title: "回程留门",
    difficulty: "标准",
    chapter: "群岛探索",
    focus: "走向远处目标时，要给回程留下一条未走过的通道。",
    start: 21,
    end: 27,
    beacons: [2,13,31],
    obstacles: [5,43,46,28,17,36,6,35,18,15,42,22],
    currents: {"0":"right","3":"right","20":"left","24":"down"},
    limit: 20,
    reference: [21,14,7,0,1,2,3,4,11,12,13,20,19,26,25,24,31,32,33,34,27],
    analysis: {"shortest":20,"solutionCount":5,"misleadingBranches":10},
  },
  {
    "title": "信标开闸",
    "difficulty": "困难",
    "chapter": "信标机关",
    "focus": "先取得 2 号航标，再通过 2 号航闸；近路并不总是先开放。",
    "start": 21,
    "end": 27,
    "beacons": [
      2,
      26,
      38
    ],
    "obstacles": [
      35,
      6,
      40,
      48,
      1,
      7
    ],
    "currents": {
      "11": "right",
      "15": "right",
      "30": "down",
      "31": "left"
    },
    "limit": 22,
    "reference": [
      21,
      14,
      15,
      16,
      9,
      2,
      3,
      4,
      5,
      12,
      19,
      26,
      25,
      24,
      31,
      30,
      37,
      38,
      39,
      32,
      33,
      34,
      27
    ],
    "analysis": {
      "shortest": 22,
      "solutionCount": 20,
      "misleadingBranches": 15
    },
    "signals": {
      "39": {
        "type": "gate",
        "beacon": 1
      }
    }
  },
  {
    "title": "双闸联锁",
    "difficulty": "困难",
    "chapter": "信标机关",
    "focus": "3 号航标开启下方航闸，1 号航标开启灯塔前的航闸。先排好取标顺序。",
    "start": 21,
    "end": 27,
    "beacons": [
      25,
      41,
      4
    ],
    "obstacles": [
      9,
      2,
      0,
      35,
      37,
      32,
      28
    ],
    "currents": {
      "6": "down",
      "11": "up",
      "12": "left",
      "18": "down",
      "34": "left",
      "38": "right"
    },
    "limit": 24,
    "reference": [
      21,
      14,
      15,
      16,
      17,
      10,
      3,
      4,
      5,
      6,
      13,
      20,
      19,
      18,
      25,
      24,
      31,
      38,
      39,
      40,
      41,
      34,
      33,
      26,
      27
    ],
    "analysis": {
      "shortest": 24,
      "solutionCount": 6,
      "misleadingBranches": 16
    },
    "signals": {
      "26": {
        "type": "gate",
        "beacon": 0
      },
      "40": {
        "type": "gate",
        "beacon": 2
      }
    }
  },
  {
    "title": "落潮之前",
    "difficulty": "困难",
    "chapter": "信标机关",
    "focus": "通往下半海图的潮桥会在取得 3 号航标后关闭，先过桥，再取标。",
    "start": 21,
    "end": 27,
    "beacons": [
      17,
      20,
      45
    ],
    "obstacles": [
      16,
      43,
      25,
      36,
      31,
      24
    ],
    "currents": {
      "6": "down",
      "8": "right",
      "11": "up",
      "26": "down",
      "39": "left",
      "41": "up",
      "48": "up"
    },
    "limit": 26,
    "reference": [
      21,
      14,
      7,
      8,
      9,
      10,
      17,
      18,
      11,
      4,
      5,
      6,
      13,
      20,
      19,
      26,
      33,
      40,
      39,
      38,
      45,
      46,
      47,
      48,
      41,
      34,
      27
    ],
    "analysis": {
      "shortest": 26,
      "solutionCount": 12,
      "misleadingBranches": 13
    },
    "signals": {
      "33": {
        "type": "gate",
        "beacon": 0
      },
      "40": {
        "type": "bridge",
        "beacon": 2
      }
    }
  },
  {
    "title": "桥先门后",
    "difficulty": "困难",
    "chapter": "信标机关",
    "focus": "两座潮桥在取得 3 号航标后关闭，两座航闸分别依赖 1、2 号航标。先安排过桥时机。",
    "start": 21,
    "end": 27,
    "beacons": [
      37,
      3,
      39
    ],
    "obstacles": [
      5,
      23,
      24,
      32
    ],
    "currents": {
      "4": "down",
      "10": "up",
      "11": "down",
      "15": "right",
      "16": "right",
      "29": "up",
      "35": "down",
      "41": "up",
      "47": "right"
    },
    "limit": 28,
    "reference": [
      21,
      28,
      35,
      42,
      43,
      36,
      37,
      30,
      29,
      22,
      15,
      16,
      17,
      10,
      3,
      4,
      11,
      18,
      19,
      26,
      33,
      40,
      39,
      46,
      47,
      48,
      41,
      34,
      27
    ],
    "analysis": {
      "shortest": 28,
      "solutionCount": 6,
      "misleadingBranches": 15
    },
    "signals": {
      "22": {
        "type": "bridge",
        "beacon": 2
      },
      "28": {
        "type": "bridge",
        "beacon": 2
      },
      "33": {
        "type": "gate",
        "beacon": 0
      },
      "34": {
        "type": "gate",
        "beacon": 1
      }
    }
  },
];
