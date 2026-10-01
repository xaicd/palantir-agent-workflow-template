# Communication preferences

- Communicates in Chinese and expects Chinese replies. Confidence: 0.9
- Prefers terse, high-signal responses; explicitly rejects verbose prose and technical jargon in replies and in user-facing copy (e.g. "太罗嗦", "单纯登录就可以了，废话那么多干啥"). Confidence: 0.9
- Dislikes being asked many clarifying questions; wants the agent to just execute and report ("你咋问题这么多", "你太慢了"). Minimize AskUserQuestion and prefer autonomous action. Confidence: 0.85
- Wants to be told when long-running background builds/tasks finish ("build跑完通知我", repeated many times). Confidence: 0.9
- Wants periodic progress updates on long jobs ("说下进展", "每隔5分钟说一下进展"). Confidence: 0.8
- When forced to choose among options, usually just accepts the agent's recommended (推荐) option — so options should come with a clearly-marked recommendation. Confidence: 0.65
