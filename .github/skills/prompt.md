我現在需要重構這個系統
請幫我引進
pinia, tailwindcss, vue3, typescript
並且所有的頁面必須要可以支援基本的 RWD (Responsive Web Design) 設計
請參考
.github/skills/api-spec.md 所摘錄的 api 內容來與後端溝通

現在會有以下幾個頁面:

## System Settings:

此頁面可以參考現在 init 頁面以及考試產生器頁面的設計

- 讓使用者上傳 ExamConfig 的檔案
- 可以提供使用者在考試還沒開始的時候，更新 ExamConfig 的內容
- 在考試開始的時候，可以鎖定 ExamConfig 的內容，禁止使用者再進行修改，僅允許修改測資的 input 和 output
- 可以讓使用者手動開始考試
- 可以重置系統
- 提供清楚的狀態顯示，知道考試是否已經開始了
- 在考試中如果更動測試資料並且按下儲存後，跳出一個Model，問使用者是否確定送出，如果確定送出了，自動用 Messeage 的功能發一個訊息給考試者，告知測試資料已經更新了，並且使用`config_update`的type來送出，以client 端能夠辨識這個訊息是測試資料更新的通知

Exam Config 的資料型態如下，請在使用者上傳的時候，檢查 Config 的型態

```
import { z } from "zod";
import CONFIG, { LanguageKey } from "../constants/piston.config";

const supportedLanguages = Object.keys(CONFIG.languages) as [
  LanguageKey,
  ...LanguageKey[],
];

const languageSchema = z.enum(supportedLanguages);

// 單一測資的格式
const testCaseSchema = z.object({
  input: z.string(),
  output: z.string(),
});

// 子任務 (subtask) 的格式
const subtaskSchema = z.object({
  title: z.string(),
  visible: z.array(testCaseSchema),
  hidden: z.array(testCaseSchema),
});

// 每一題 (puzzle) 的格式
const puzzleSchema = z.object({
  title: z.string(),
  language: languageSchema,
  timeLimit: z.number().optional(), // 只有某些題目有，故設為 optional
  memoryLimit: z.number().optional(), // 同上
  subtasks: z.array(subtaskSchema),
});

// 可以存取考試的使用者
const accessUserSchema = z.object({
  id: z.string(),
  name: z.string(),
});

// 整體 midterm_test_config.json 的 schema
export const examConfigSchema = z.object({
  testTitle: z.string(),
  description: z.string(),
  judgerSettings: z.object({
    timeLimit: z.number(),
    memoryLimit: z.number(),
  }),
  accessibleUsers: z.array(accessUserSchema),
  puzzles: z.array(puzzleSchema),
});

// 對應的 TypeScript 型別
export type ExamConfig = z.infer<typeof examConfigSchema>;
export type Puzzle = z.infer<typeof puzzleSchema>;
export type SubTask = z.infer<typeof subtaskSchema>;
export type TestCase = z.infer<typeof testCaseSchema>;
export type AccessUser = z.infer<typeof accessUserSchema>;

import { ZodError } from "zod";

export const verifyExamConfig = (config: any) => {
  try {
    return {
      examConfig: examConfigSchema.parse(config),
      isCorrect: true,
      errors: null,
    };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        examConfig: null,
        isCorrect: false,
        errors: error.issues,
      };
    }

    return {
      examConfig: null,
      isCorrect: false,
      errors: [{ message: "Unknown error" }],
    };
  }
};
```

## Scoreboard:

export interface ScoreBoardFormat {
[problemID: string]: Subtasks[];
}

export interface Subtasks {
hidden: TestCaseRecord[];
visible: TestCaseRecord[];
}

export interface TestCaseRecord {
status: StatusCode;
userOutput: string;
expectedOutput: string;
time: string;
}

此頁面可以參考現在的 Scoreboard 頁面的設計，會以表格的方式顯示學生的通過狀況(使用 StatusCode 來顯示)，當點擊表格的時候會顯示詳細的TestCaseRecord，Server端的回覆範例如下，此表格的巨集功能要保留，同時要提供複製的功能，方便直接貼到 Excel，Status code 的種類如下: 'AC' | 'WA' | 'TLE' | 'MLE' | 'RE' | 'CE' | 'SE' 請用不同的顏色在表格方面呈現

```
{
    "success": true,
    "data": {
        "scores": [
            {
                "id": 17,
                "student_ID": "0",
                "student_name": "TA",
                "last_submit_time": "2026-02-14T12:50:09.479Z",
                "subtask_amount": 4,
                "passed_subtask_amount": 0,
                "puzzle_amount": 2,
                "passed_puzzle_amount": 0,
                "puzzle_results": {
                    "0": [
                        {
                            "hidden": [
                                {
                                    "status": "RE",
                                    "userOutput": "",
                                    "expectedOutput": "",
                                    "time": "0"
                                }
                            ],
                            "visible": [
                                {
                                    "status": "RE",
                                    "userOutput": "",
                                    "expectedOutput": "",
                                    "time": "0"
                                }
                            ]
                        },
                        {
                            "hidden": [
                                {
                                    "status": "RE",
                                    "userOutput": "",
                                    "expectedOutput": "",
                                    "time": "0"
                                }
                            ],
                            "visible": [
                                {
                                    "status": "RE",
                                    "userOutput": "",
                                    "expectedOutput": "",
                                    "time": "0"
                                }
                            ]
                        },
                        {
                            "hidden": [
                                {
                                    "status": "RE",
                                    "userOutput": "",
                                    "expectedOutput": "",
                                    "time": "0"
                                }
                            ],
                            "visible": [
                                {
                                    "status": "RE",
                                    "userOutput": "",
                                    "expectedOutput": "",
                                    "time": "0"
                                }
                            ]
                        }
                    ],
                    "1": [
                        {
                            "hidden": [
                                {
                                    "status": "RE",
                                    "userOutput": "",
                                    "expectedOutput": "",
                                    "time": "2"
                                }
                            ],
                            "visible": [
                                {
                                    "status": "RE",
                                    "userOutput": "",
                                    "expectedOutput": "",
                                    "time": "2"
                                }
                            ]
                        }
                    ]
                }
            },
            {
                "id": 18,
                "student_ID": "114590001",
                "student_name": "Bob Lin",
                "last_submit_time": null,
                "subtask_amount": 0,
                "passed_subtask_amount": 0,
                "puzzle_amount": 0,
                "passed_puzzle_amount": 0,
                "puzzle_results": {
                    "0": [
                        {
                            "visible": [
                                {
                                    "status": "WA",
                                    "userOutput": "",
                                    "expectedOutput": "",
                                    "time": "0"
                                },
                                {
                                    "status": "WA",
                                    "userOutput": "",
                                    "expectedOutput": "",
                                    "time": "0"
                                }
                            ],
                            "hidden": [
                                {
                                    "status": "WA",
                                    "userOutput": "",
                                    "expectedOutput": "",
                                    "time": "0"
                                }
                            ]
                        },
                        {
                            "visible": [
                                {
                                    "status": "WA",
                                    "userOutput": "",
                                    "expectedOutput": "",
                                    "time": "0"
                                }
                            ],
                            "hidden": [
                                {
                                    "status": "WA",
                                    "userOutput": "",
                                    "expectedOutput": "",
                                    "time": "0"
                                },
                                {
                                    "status": "WA",
                                    "userOutput": "",
                                    "expectedOutput": "",
                                    "time": "0"
                                }
                            ]
                        }
                    ],
                    "1": [
                        {
                            "visible": [
                                {
                                    "status": "WA",
                                    "userOutput": "",
                                    "expectedOutput": "",
                                    "time": "0"
                                },
                                {
                                    "status": "WA",
                                    "userOutput": "",
                                    "expectedOutput": "",
                                    "time": "0"
                                }
                            ],
                            "hidden": [
                                {
                                    "status": "WA",
                                    "userOutput": "",
                                    "expectedOutput": "",
                                    "time": "0"
                                }
                            ]
                        },
                        {
                            "visible": [
                                {
                                    "status": "WA",
                                    "userOutput": "",
                                    "expectedOutput": "",
                                    "time": "0"
                                }
                            ],
                            "hidden": [
                                {
                                    "status": "WA",
                                    "userOutput": "",
                                    "expectedOutput": "",
                                    "time": "0"
                                },
                                {
                                    "status": "WA",
                                    "userOutput": "",
                                    "expectedOutput": "",
                                    "time": "0"
                                }
                            ]
                        }
                    ]
                }
            }
        ]
    }
}
```

## Student Log:

保持現在的設計，只是注意一下 log 的格式，格式如下

```
[
    {
        "id": 20,
        "timestamp": "2026-02-17T09:38:35.174Z",
        "student_ID": "0",
        "ip_address": "127.0.0.1",
        "mac_address": "",
        "action_type": "upload_test_result",
        "details": "Uploaded test result: {\"0\":[{\"visible\":[{\"statusCode\":\"AC\",\"input\":\"1 2\",\"expectingOutput\":\"3\",\"userOutput\":\"3\",\"time\":\"12ms\"},{\"statusCode\":\"AC\",\"input\":\"5 7\",\"expectingOutput\":\"12\",\"userOutput\":\"12\",\"time\":\"10ms\"}],\"hidden\":[{\"statusCode\":\"AC\",\"input\":\"10 20\",\"expectingOutput\":\"30\",\"userOutput\":\"30\",\"time\":\"15ms\"}]},{\"visible\":[{\"statusCode\":\"AC\",\"input\":\"1000 2000\",\"expectingOutput\":\"3000\",\"userOutput\":\"3000\",\"time\":\"11ms\"}],\"hidden\":[{\"statusCode\":\"AC\",\"input\":\"123456 654321\",\"expectingOutput\":\"777777\",\"userOutput\":\"777777\",\"time\":\"18ms\"},{\"statusCode\":\"AC\",\"input\":\"999999 1\",\"expectingOutput\":\"1000000\",\"userOutput\":\"1000000\",\"time\":\"14ms\"}]}],\"1\":[{\"visible\":[{\"statusCode\":\"AC\",\"input\":\"3\",\"expectingOutput\":\"6\",\"userOutput\":\"6\",\"time\":\"45ms\"},{\"statusCode\":\"WA\",\"input\":\"5\",\"expectingOutput\":\"120\",\"userOutput\":\"100\",\"time\":\"42ms\"}],\"hidden\":[{\"statusCode\":\"AC\",\"input\":\"1\",\"expectingOutput\":\"1\",\"userOutput\":\"1\",\"time\":\"38ms\"}]},{\"visible\":[{\"statusCode\":\"AC\",\"input\":\"7\",\"expectingOutput\":\"5040\",\"userOutput\":\"5040\",\"time\":\"50ms\"}],\"hidden\":[{\"statusCode\":\"WA\",\"input\":\"10\",\"expectingOutput\":\"3628800\",\"userOutput\":\"0\",\"time\":\"48ms\"},{\"statusCode\":\"WA\",\"input\":\"12\",\"expectingOutput\":\"479001600\",\"userOutput\":\"-1\",\"time\":\"47ms\"}]}]}"
    }
]

```

## Anticheat System:

保持大部分現在的設計即可，注意 API 的格式就好，api 的節點是

/logs/all
這部分還沒有記錄在 api 文件中

## Student Dashboard:

這是整個系統最複雜的地方，這部分整合了以前的 `評測` `成績表` 以及 `學生程式碼檢視器` 的功能，
要提供以下幾個功能:

- TA可以使用學號搜尋學生
- 搜尋到該學生之後，可以提供以下幾個功能
  - 使用 judge 功能評測所有已經繳交的程式，並且看到評測結果
  - 可以看到學生目前的成績
  - 可以看到學生目前所有已經提交的程式碼
