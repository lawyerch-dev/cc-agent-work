const UL='<svg viewBox="0 0 200 12" preserveAspectRatio="none"><path d="M3 8C40 3 78 2 116 4c28 1.5 52 3 81 5"/></svg>';
const T={
zh:{
'nav.why':'为什么重做','nav.caps':'核心能力','nav.tech':'技术内核','nav.scenes':'使用场景','nav.start':'快速上手','nav.docs':'文档','nav.star':'Star on GitHub',
'hero.pill':'2026.07.10 正式开源 · MIT License',
'hero.h1':'Octop 现已<span class="r">开源'+UL+'</span>',
'hero.sub':'腾讯云自研 AI 助手，游向开源的海洋',
'hero.lede':'Octop 源自 <b>LightClaw ACE</b>。相比一次简单的品牌升级，它更接近一次面向智能体时代的<b>系统性重构</b>——重新梳理用户、记忆、工具、执行环境与安全边界之间的关系，让 AI 助手从「单次对话工具」演进为可长期使用、可持续扩展的个人与团队智能体。',
'hero.cta1':'前往 GitHub 仓库 →','hero.cta2':'一分钟上手',
'stat.1':'核心能力','stat.2':'进程扛全场','stat.3':'零厂商锁定','stat.4':'Connector 扩展',
'chip.1':'可迁移记忆','chip.2':'MCP Server','chip.3':'多专家并行','chip.4':'远程桌面',
'why.k':'Why rebuild','why.h':'为什么要<span class="r">重做</span>一款 AI 助手？',
'why.d':'「Octop」取自章鱼（Octopus）：八爪并展、灵活多变、可同时处理多项任务。如果说 LightClaw ACE 是我们投向湖面的第一颗石子，那么 Octop 就是那只真正游向开源海洋的章鱼。过去两年 AI 助手快速发展，但在真实使用场景中，仍有四个问题没有被很好解决。',
'p1.t':'记忆缺乏连续性','p1.d':'很多 AI 助手仍以会话为中心，聊完即结束。用户偏好、历史任务、长期上下文难以沉淀；更换设备、模型或运行环境后，助手往往需要重新理解用户。',
'p2.t':'多用户场景支持不足','p2.d':'家庭、小团队和企业并不是单一用户场景。不同成员需要独立身份、独立记忆、独立工作区，也需要在必要时共享工具与能力。缺少清晰的隔离机制，体验和隐私都会受到影响。',
'p3.t':'工具与外部系统连接成本高','p3.d':'AI 助手要真正参与工作流，必须能够访问文档、浏览器、IM、云服务、企业系统和公共信息源。但在很多实现中，工具接入仍依赖定制开发，复用性和可维护性不足。',
'p4.t':'复杂任务执行稳定性有限','p4.d':'真实任务往往不是「一问一答」，而是包含规划、调用工具、观察结果、调整策略和恢复执行的连续过程。缺少工程化的 Agent Loop，复杂任务很容易在中途停滞。',
'cap.k':'Core capabilities','cap.h':'六大<span class="r">核心能力</span>',
'cap.d':'Octop 不只是一个对话入口，而是一套面向长期协作、工具扩展和多环境部署的 AI Agent 运行体系。',
'c1.t':'多用户与多专家协作','c1.d':'管理员可创建多个成员账号，每人拥有独立的记忆、工作区与专家配置——共享一套系统能力的同时，保持身份、数据和上下文隔离。','c1.g':'<span class="tag">身份隔离</span><span class="tag">独立工作区</span><span class="tag n">多专家并行</span>',
'c2.t':'Connector 机制','c2.d':'「能力即插件」的标准化抽象。新增一个数据源，只需注册 OAuth 应用或接入 MCP Server 即可完成，不需要改动 Agent 核心逻辑。','c2.g':'<span class="tag">腾讯文档</span><span class="tag">腾讯云 OpenAPI</span><span class="tag">腾讯新闻</span><span class="tag n">MCP Server</span>',
'c3.t':'可插拔后端','c3.d':'Agent 的读写行为发生在明确的隔离边界内。用户自主决定数据存放在哪里、任务在哪里执行，以及 Agent 能访问哪些资源。','c3.g':'<span class="tag">本地磁盘</span><span class="tag">Docker</span><span class="tag">PostgreSQL</span><span class="tag n">COS / S3</span>',
'c4.t':'可迁移记忆','c4.d':'记忆系统基于工作区构建，而不是绑定在某个模型或某次会话上。模型可以随时切换，工作区、历史上下文、用户偏好和任务记录持续保留。','c4.g':'<span class="tag">工作区打包迁移</span><span class="tag n">本地 / 云端自由切换</span>',
'c5.t':'Loop Engineering','c5.d':'复杂任务的关键不在于一次回答，而在于持续执行：先规划，再调用工具，随后观察结果，并根据反馈继续调整。','c5.g':'<span class="tag">动态模型路由</span><span class="tag">工具串联</span><span class="tag">检查点</span><span class="tag n">技能系统</span>',
'c6.t':'远程桌面','c6.d':'让 Agent 走出命令行与对话框，进入图形化工作界面。结合浏览器自动化与终端能力，成为可操作、可观察、可恢复的数字工作空间。','c6.g':'<span class="tag">远程办公</span><span class="tag">AI 接管 GUI</span><span class="tag n">隔离桌面</span>',
'chat.you':'你：',
'chat.1':'<span class="at">@营养师</span> 帮我看下这周的三餐搭配合不合理',
'chat.2':'<span class="at">@法律顾问</span> 这份租房合同有没有坑',
'chat.3':'<span class="at">@代码审校</span> 帮我把这段 Python 重构一下',
'cap.note':'用户可以根据任务类型调用不同专家角色——资料整理、学习辅导、代码开发、文案生成、日程规划——让一个助手具备多种专业分工能力。',
'tech.k':'Under the hood','tech.h':'技术内核：一个进程，扛全场',
'tech.d':'基于腾讯自研 harness-agent 运行时构建，采用单进程设计，降低部署复杂度，同时保留对多通道、多工具和多后端的扩展能力。不依赖任何外部消息队列或中间件。',
't.lang':'语言','t.web':'Web 框架','t.rt':'Agent 运行时','t.im':'IM 桥接','t.db':'控制平面数据库','t.pg':'团队级持久化','t.fe':'前端','t.sch':'调度','t.acp':'ACP','t.store':'存储后端','t.qa':'质量保障','t.state':'状态重建',
'pg.t':'团队级持久化：PostgreSQL 后端',
'pg.1t':'结构化管理','pg.1d':'会话、任务、记忆与工作区元数据以关系表组织，便于查询与治理。',
'pg.2t':'并发与连接池','pg.2d':'基于 asyncpg 的异步连接池，支撑多用户、多 Agent 同时读写。',
'pg.3t':'团队级共享','pg.3d':'多个成员共用同一实例时，仍按用户与工作区维度保持隔离。',
'pg.4t':'可迁移与备份','pg.4d':'配合可迁移记忆机制，工作区可整体导出、备份或迁移到新环境。',
'm.1':'模型路由、工具调用、技能执行与对话检查点管理。','m.2':'飞书、钉钉、QQ、Discord、企业微信等多平台通道接入。','m.3':'分层召回与全文检索，让记忆随工作区一起迁移。','m.4':'基于 CDP 的浏览器自动化，支持持久化登录态。',
'tech.note':'通过进程内的 <code>HarnessProcessor</code> 统一路由 Web UI、IM 与定时任务，最终呈现为一个可重启恢复的单进程：整个状态在启动时从 <code>~/.octop/octop.db</code> 重建。',
'who.k':"Who it's for",'who.h':'从工具，到<span class="r">数字生命体</span>','who.d':'面向三类典型用户，三个真实场景。',
'u1.t':'个人用户','u1.d':'周报撰写、资料整理、日程规划、信息检索和长期知识管理。',
'u2.t':'家庭与小团队','u2.d':'通过一个管理员账号管理多个成员，让不同用户拥有独立 Agent 与独立记忆。',
'u3.t':'企业用户','u3.d':'支持多 Agent 并行协作，可接入飞书、钉钉等办公套件，融入企业内部流程。',
's1.t':'家庭共用的 AI 助手','s1.d':'家长可以使用「营养师」规划三餐，孩子可以通过「作业辅导」理解数学题，家庭成员也可以使用各自的助手管理资料、日程和任务。一个 Octop 实例服务多个成员，同时保持数据隔离。',
's2.t':'开发者工作流','s2.d':'开发者可以在 Zed、OpenCode 等开发环境中通过 MCP 接入 Octop，让 Agent 参与代码阅读、资料检索、脚本执行和项目维护。',
's3.t':'团队自动化与信息同步','s3.d':'通过远程桌面处理图形界面任务，通过浏览器自动化完成信息采集、截图和表单操作，也可以用自然语言配置定时任务。','s3.q':'「每天早上 8 点，把微博科技榜前三条同步到团队群。」',
'sec.k':'Security & privacy','sec.h':'本地优先，<span class="r">无厂商锁定</span>',
'sec.d':'配置、对话、工作区与凭证可以存储在用户自己的环境中，Agent 的访问范围也可以通过身份和工作区机制进行隔离。',
'v1.t':'本地优先','v1.d':'配置、对话、工作区和凭证均可本地保存。','v2.t':'JWT 隔离','v2.d':'按用户隔离 Agent 与工作区权限。','v3.t':'可私有部署','v3.d':'支持完全离线运行。','v4.t':'零厂商锁定','v4.d':'LLM 供应商、存储后端和 IM 通道均可自由切换。',
'sec.note':'无论使用 OpenAI 兼容 API、DashScope，还是本地 Ollama，用户都可以按 Agent 灵活配置模型能力，并根据任务需求选择合适的运行方式。',
'qs.k':'Quick start','qs.h':'<span class="r">一分钟</span>上手','qs.d':'三条命令，跑起一个属于你自己的 AI Agent。',
'qs.code':'<span class="c-cm"># 一键安装（macOS / Linux）</span>\n<span class="c-cmd">curl</span> -fsSL https://finnie-1258344699.cos.ap-guangzhou.myqcloud.com/octop/install.sh | sh\n\n<span class="c-cm"># Windows（PowerShell）</span>\n<span class="c-cmd">irm</span> https://finnie-1258344699.cos.ap-guangzhou.myqcloud.com/octop/install.ps1 | iex\n\n<span class="c-cm"># 初始化（创建数据库、JWT 密钥、首个管理员）</span>\n<span class="c-cmd">octop</span> init\n\n<span class="c-cm"># 启动（API + Web 控制台）</span>\n<span class="c-cmd">octop</span> run\n\n<span class="c-cm"># 生产环境推荐 Docker</span>\n<span class="c-cmd">docker</span> compose -f deploy/docker-compose.yml up -d',
'qs.local':'打开 <code>http://127.0.0.1:8088</code>，默认账号 <code>admin / octop</code>。',
'qs.warn':'默认管理员密码为 <b>octop</b>，首次启动后请尽快在「设置 → 用户」中修改，避免服务暴露到公网时被未授权访问。',
'rm.k':'Roadmap','rm.h':'开源只是<span class="r">起点</span>',
'rm.d':'后续我们将持续向社区开放更多核心能力，与开发者共同完善智能体基础设施。仓库采用 MIT 协议，欢迎通过 Pull Request 参与共建。',
'r1':'建设可复用的技能市场。','r2':'探索跨 Agent 通信协议。','r3t':'MCP Server 模板','r3':'降低新数据源和新工具的接入成本。','r4t':'企业级管理控制台','r4':'提供多租户管理与企业级治理能力。',
'k1.t':'Agent 开发','k1.d':'共同设计更专业的专家角色。','k2.t':'客户端开发','k2.d':'打造更优雅的交互体验。','k3.t':'文档与设计','k3.d':'让技术更好地被理解与传播。',
'fin.h':'章鱼拥有多条触手，可以同时<span class="r">感知和探索</span>不同方向',
'fin.d':'Octop 也希望成为这样一套面向未来的 AI Agent 系统：连接工具、承载记忆、理解用户，并在可控边界内持续执行任务。我们选择开源 Octop，不是因为它已经完成，而是因为我们相信，真正可持续的智能体生态，需要在开放协作中逐步形成。',
'fin.s':'游向开源的海洋，Octop 已就位。','fin.go':'前往仓库 ›','fin.tag':'Octop 理解你、支持你，并与你一同成长。',
'foot':'腾讯开源 · 2026 年 7 月 · MIT License',
'strip':['腾讯文档','腾讯云 OpenAPI','腾讯新闻','MCP Server','飞书','钉钉','企业微信','QQ','Discord','Ollama','DashScope','OpenAI 兼容 API','Docker','PostgreSQL','COS / S3']
},
en:{
'nav.why':'Why rebuild','nav.caps':'Capabilities','nav.tech':'Under the hood','nav.scenes':'Use cases','nav.start':'Quick start','nav.docs':'Docs','nav.star':'Star on GitHub',
'hero.pill':'Released 2026.07.10 · MIT License',
'hero.h1':'Octop is now <span class="r">Open Source'+UL+'</span>',
'hero.sub':"Tencent Cloud's self-developed AI assistant, swimming into open waters",
'hero.lede':'Octop grew out of <b>LightClaw ACE</b>. Rather than a simple rebrand, it is a <b>systematic rebuild</b> for the agent era — rethinking the relationships between users, memory, tools, execution environments and security boundaries, so an AI assistant evolves from a single-shot chat tool into a long-lived, extensible agent for individuals and teams.',
'hero.cta1':'View on GitHub →','hero.cta2':'Get started in a minute',
'stat.1':'core capabilities','stat.2':'process runs it all','stat.3':'no vendor lock-in','stat.4':'Connector extensions',
'chip.1':'Portable memory','chip.2':'MCP Server','chip.3':'Multi-expert','chip.4':'Remote desktop',
'why.k':'Why rebuild','why.h':'Why <span class="r">rebuild</span> an AI assistant?',
'why.d':'"Octop" comes from Octopus — eight arms extended, flexible, handling many tasks at once. If LightClaw ACE was the first stone we threw into the lake, Octop is the octopus that actually swims out into the open-source ocean. AI assistants have advanced fast over the past two years, yet four problems remain unsolved in real-world use.',
'p1.t':'Memory lacks continuity','p1.d':'Many assistants are still session-centric: when the chat ends, everything ends. Preferences, past tasks and long-term context are hard to accumulate — switch device, model or runtime and the assistant has to learn you all over again.',
'p2.t':'Weak multi-user support','p2.d':'Families, small teams and companies are not single-user settings. Members need separate identities, memory and workspaces, while still sharing tools and capabilities when needed. Without clear isolation, both experience and privacy suffer.',
'p3.t':'High cost of connecting tools','p3.d':'To take part in real workflows, an assistant must reach documents, browsers, IM, cloud services, internal systems and public data sources. In most implementations, tool integration still means custom development with poor reusability.',
'p4.t':'Limited reliability on complex tasks','p4.d':'Real tasks are rarely one question and one answer. They involve planning, calling tools, observing results, adjusting strategy and resuming execution. Without an engineered Agent Loop, complex tasks stall halfway.',
'cap.k':'Core capabilities','cap.h':'Six <span class="r">core capabilities</span>',
'cap.d':'Octop is not just a chat entry point. It is an AI Agent runtime built for long-term collaboration, tool extension and multi-environment deployment.',
'c1.t':'Multi-user & multi-expert','c1.d':'An admin can create multiple member accounts, each with its own memory, workspace and expert configuration — sharing one system while keeping identity, data and context isolated.','c1.g':'<span class="tag">Identity isolation</span><span class="tag">Separate workspaces</span><span class="tag n">Parallel experts</span>',
'c2.t':'Connector framework','c2.d':'A standard "capability as plugin" abstraction. Adding a data source means registering an OAuth app or plugging in an MCP Server — no changes to the agent core.','c2.g':'<span class="tag">Tencent Docs</span><span class="tag">Tencent Cloud OpenAPI</span><span class="tag">Tencent News</span><span class="tag n">MCP Server</span>',
'c3.t':'Pluggable backends','c3.d':'Agent reads and writes happen inside explicit isolation boundaries. You decide where data lives, where tasks run, and which resources the agent may touch.','c3.g':'<span class="tag">Local disk</span><span class="tag">Docker</span><span class="tag">PostgreSQL</span><span class="tag n">COS / S3</span>',
'c4.t':'Portable memory','c4.d':'Memory is built around the workspace, not bound to a model or a session. Switch models freely — workspace, history, preferences and task records all persist.','c4.g':'<span class="tag">Export whole workspace</span><span class="tag n">Local ⇄ cloud models</span>',
'c5.t':'Loop Engineering','c5.d':'What matters in complex work is not one answer but sustained execution: plan, call tools, observe results, then adjust based on feedback.','c5.g':'<span class="tag">Dynamic model routing</span><span class="tag">Tool chaining</span><span class="tag">Checkpoints</span><span class="tag n">Skill system</span>',
'c6.t':'Remote desktop','c6.d':'Lets the agent step out of the terminal and chat box into a real graphical workspace. Combined with browser automation and shell access, it becomes an operable, observable, recoverable digital workspace.','c6.g':'<span class="tag">Remote work</span><span class="tag">AI takes over the GUI</span><span class="tag n">Isolated desktop</span>',
'chat.you':'You:',
'chat.1':'<span class="at">@Nutritionist</span> Check whether this week’s meal plan is balanced',
'chat.2':'<span class="at">@Legal advisor</span> Any traps hidden in this rental contract?',
'chat.3':'<span class="at">@Code reviewer</span> Refactor this Python snippet for me',
'cap.note':'Call different expert roles by task type — research, tutoring, coding, copywriting, scheduling — so a single assistant carries many specialisations.',
'tech.k':'Under the hood','tech.h':'One process, the whole stack',
'tech.d':'Built on Tencent’s in-house harness-agent runtime with a single-process design that lowers deployment complexity while staying extensible across channels, tools and backends. No external message queue or middleware required.',
't.lang':'Language','t.web':'Web framework','t.rt':'Agent runtime','t.im':'IM bridge','t.db':'Control-plane DB','t.pg':'Team-scale persistence','t.fe':'Frontend','t.sch':'Scheduling','t.acp':'ACP','t.store':'Storage backends','t.qa':'Quality','t.state':'State rebuild',
'pg.t':'Team-scale persistence: the PostgreSQL backend',
'pg.1t':'Structured management','pg.1d':'Sessions, tasks, memory and workspace metadata live in relational tables — easy to query and govern.',
'pg.2t':'Concurrency & pooling','pg.2d':'An asyncpg-based async connection pool supports many users and agents reading and writing at once.',
'pg.3t':'Shared across a team','pg.3d':'Even when members share one instance, isolation is preserved per user and per workspace.',
'pg.4t':'Portable & backed up','pg.4d':'Together with portable memory, a workspace can be exported, backed up or moved to a new environment as a whole.',
'm.1':'Model routing, tool calls, skill execution and conversation checkpoints.','m.2':'Channel access for Feishu, DingTalk, QQ, Discord, WeCom and more.','m.3':'Layered recall and full-text search, so memory travels with the workspace.','m.4':'CDP-based browser automation with persistent login state.',
'tech.note':'An in-process <code>HarnessProcessor</code> routes the Web UI, IM and scheduled jobs through one path, resulting in a single restartable process: the whole state is rebuilt from <code>~/.octop/octop.db</code> at startup.',
'who.k':"Who it's for",'who.h':'From a tool to a <span class="r">digital lifeform</span>','who.d':'Three kinds of users, three real scenarios.',
'u1.t':'Individuals','u1.d':'Weekly reports, research, scheduling, information retrieval and long-term knowledge management.',
'u2.t':'Families & small teams','u2.d':'One admin account manages multiple members, each with their own agent and their own memory.',
'u3.t':'Enterprises','u3.d':'Multiple agents working in parallel, connected to Feishu, DingTalk and other suites, embedded in internal processes.',
's1.t':'A shared assistant at home','s1.d':'A parent plans meals with the "Nutritionist"; a child works through maths with "Homework helper"; everyone manages their own files, calendar and tasks. One Octop instance serves the whole household while keeping data isolated.',
's2.t':'Developer workflow','s2.d':'Connect Octop over MCP from Zed, OpenCode and similar environments, letting the agent take part in code reading, research, script execution and project maintenance.',
's3.t':'Team automation & sync','s3.d':'Handle GUI work through remote desktop, collect information, capture screenshots and fill forms through browser automation, and set up scheduled jobs in plain language.','s3.q':'"Every morning at 8, post the top three tech headlines to the team group."',
'sec.k':'Security & privacy','sec.h':'Local-first, <span class="r">no vendor lock-in</span>',
'sec.d':'Configuration, conversations, workspaces and credentials can all live in your own environment, and the agent’s reach is bounded by identity and workspace mechanisms.',
'v1.t':'Local-first','v1.d':'Config, conversations, workspaces and credentials can all stay local.','v2.t':'JWT isolation','v2.d':'Agent and workspace permissions are isolated per user.','v3.t':'Self-hostable','v3.d':'Runs fully offline if you want it to.','v4.t':'No vendor lock-in','v4.d':'LLM provider, storage backend and IM channel are all swappable.',
'sec.note':'Whether you use an OpenAI-compatible API, DashScope or a local Ollama model, you can configure model capability per agent and pick the right runtime for each task.',
'qs.k':'Quick start','qs.h':'Running in <span class="r">one minute</span>','qs.d':'Three commands and you have your own AI agent.',
'qs.code':'<span class="c-cm"># One-line install (macOS / Linux)</span>\n<span class="c-cmd">curl</span> -fsSL https://finnie-1258344699.cos.ap-guangzhou.myqcloud.com/octop/install.sh | sh\n\n<span class="c-cm"># Windows (PowerShell)</span>\n<span class="c-cmd">irm</span> https://finnie-1258344699.cos.ap-guangzhou.myqcloud.com/octop/install.ps1 | iex\n\n<span class="c-cm"># Initialise (database, JWT secret, first admin)</span>\n<span class="c-cmd">octop</span> init\n\n<span class="c-cm"># Start (API + web console)</span>\n<span class="c-cmd">octop</span> run\n\n<span class="c-cm"># Docker recommended for production</span>\n<span class="c-cmd">docker</span> compose -f deploy/docker-compose.yml up -d',
'qs.local':'Open <code>http://127.0.0.1:8088</code>. Default account: <code>admin / octop</code>.',
'qs.warn':'The default admin password is <b>octop</b>. Change it under Settings → Users right after first launch to avoid unauthorised access once the service is exposed.',
'rm.k':'Roadmap','rm.h':'Open sourcing is only <span class="r">the start</span>',
'rm.d':'We will keep opening more core capabilities to the community and build agent infrastructure together with developers. The repository is MIT-licensed — pull requests are very welcome.',
'r1':'A marketplace of reusable skills.','r2':'Exploring a cross-agent communication protocol.','r3t':'MCP Server templates','r3':'Lowering the cost of adding new data sources and tools.','r4t':'Enterprise admin console','r4':'Multi-tenant management and enterprise-grade governance.',
'k1.t':'Agent development','k1.d':'Design more capable expert roles with us.','k2.t':'Client development','k2.d':'Build a more elegant interaction experience.','k3.t':'Docs & design','k3.d':'Help the technology be understood and shared.',
'fin.h':'An octopus has many arms, <span class="r">sensing and exploring</span> in every direction at once',
'fin.d':'Octop aims to be exactly that kind of forward-looking AI Agent system: connecting tools, carrying memory, understanding its user, and executing continuously within controllable boundaries. We are open sourcing Octop not because it is finished, but because we believe a truly sustainable agent ecosystem can only take shape through open collaboration.',
'fin.s':'Swimming into open waters. Octop is ready.','fin.go':'Check it out ›','fin.tag':'Octop understands you, supports you, and grows with you.',
'foot':'Tencent Open Source · July 2026 · MIT License',
'strip':['Tencent Docs','Tencent Cloud OpenAPI','Tencent News','MCP Server','Feishu','DingTalk','WeCom','QQ','Discord','Ollama','DashScope','OpenAI-compatible API','Docker','PostgreSQL','COS / S3']
}};

const TITLE={zh:'Octop 正式开源 · 腾讯云自研 AI 助手',en:'Octop Is Now Open Source · Tencent Cloud AI Assistant'};

function apply(lang){
  const d=T[lang];
  document.documentElement.lang = lang==='zh'?'zh-CN':'en';
  document.title=TITLE[lang];
  document.querySelectorAll('[data-i]').forEach(el=>{const v=d[el.dataset.i];if(v!==undefined)el.textContent=v});
  document.querySelectorAll('[data-h]').forEach(el=>{const v=d[el.dataset.h];if(v!==undefined)el.innerHTML=v});
  document.getElementById('track').innerHTML=[...d.strip,...d.strip].map(t=>'<span>'+t+'</span>').join('');
  document.querySelectorAll('.lang button').forEach(b=>b.classList.toggle('on',b.dataset.lang===lang));
  moveKnob();
}
function moveKnob(){
  const on=document.querySelector('.lang button.on'),k=document.getElementById('knob');
  if(!on)return;
  k.style.width=on.offsetWidth+'px';
  k.style.transform='translateX('+(on.offsetLeft-3)+'px)';
}
document.querySelectorAll('.lang button').forEach(b=>b.addEventListener('click',()=>apply(b.dataset.lang)));
apply('zh');
addEventListener('resize',moveKnob);

const io=new IntersectionObserver(es=>{es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{threshold:.08});
document.querySelectorAll('.reveal').forEach(e=>io.observe(e));
const nav=document.getElementById('nav');
addEventListener('scroll',()=>nav.classList.toggle('stuck',scrollY>12),{passive:true});
