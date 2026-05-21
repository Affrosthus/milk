{\rtf1\ansi\ansicpg936\cocoartf2822
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\paperw11900\paperh16840\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 const https = require('https');\
const crypto = require('crypto');\
\
// \uc0\u22522 \u30784 \u37197 \u32622 \u20449 \u24687 \
const CONFIG = \{\
    CORPID: \'93L\'94,\
    SECRET: "0iygIrGZoxpqew_oM4qYkci1ne8qMKL1UC2fCNtK-hM",\
    AGENTID: "1000002",\
    TOUSER: "@all" \
    TOKEN: "Luo102An77",\
    ENCODINGAESKEY: "sPL2k7DBtYtYFgBNGNhivA39pKvukur0pT3oAHqVhql"\
\};\
\
// 2. \uc0\u20320 \u30340 \u19987 \u23646 \u23383 \u21345 \u27744 \u65288 \u27880 \u24847 \u29992 \u33521 \u25991 \u21452 \u24341 \u21495 \u65289 \
const myCards = [\
 "\uc0\u20170 \u22825 \u24320 \u24515 \u21527 \u65311 "\u65292 \
    "\uc0\u55358 \u56698 "\u65292 \
    "\uc0\u9786 \u65039 ",\
    "\uc0\u55357 \u56842 "\
];\
\
// \uc0\u19978 \u19979 \u25991 \u35760 \u24518 \u24211 \
const contextMap = new Map();\
\
// \uc0\u24494 \u20449 \u35299 \u23494 \u20989 \u25968 \u65288 \u29992 \u26469 \u36890 \u36807 \u21518 \u21488 \u39564 \u35777 \u65289 \
function decrypt(echostr) \{\
    const aesKey = Buffer.from(CONFIG.ENCODINGAESKEY + '=', 'base64');\
    const iv = aesKey.slice(0, 16);\
    const decipher = crypto.createDecipheriv('aes-256-cbc', aesKey, iv);\
    decipher.setAutoPadding(false);\
    let decrypted = decipher.update(echostr, 'base64', 'utf8') + decipher.final('utf8');\
    const pad = decrypted.charCodeAt(decrypted.length - 1);\
    decrypted = decrypted.slice(0, -pad);\
    const content = decrypted.slice(16);\
    const length = content.slice(0, 4).readUInt32BE(0);\
    return content.slice(4, 4 + length).toString();\
\}\
\
function httpRequest(url, method, data = null) \{\
    return new Promise((resolve, reject) => \{\
        const options = \{ method: method, headers: data ? \{ 'Content-Type': 'application/json' \} : \{\} \};\
        const req = https.request(url, options, (res) => \{\
            let body = '';\
            res.on('data', chunk => body += chunk);\
            res.on('end', () => resolve(JSON.parse(body)));\
        \});\
        req.on('error', err => reject(err));\
        if (data) req.write(JSON.stringify(data));\
        req.end();\
    \});\
\}\
\
async function handlePush() \{\
    const hour = (new Date().getUTCHours() + 8) % 24;\
    if (hour >= 0 && hour < 8) return "Quiet hours. Skip push.";\
\
    const tokenRes = await httpRequest(`https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=$\{CONFIG.CORPID\}&corpsecret=$\{CONFIG.SECRET\}`, 'GET');\
    const token = tokenRes.access_token;\
    const randomCard = myCards[Math.floor(Math.random() * myCards.length)];\
\
    await httpRequest(`https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token=$\{token\}`, 'POST', \{\
        touser: CONFIG.TOUSER,\
        msgtype: "text",\
        agentid: CONFIG.AGENTID,\
        text: \{ content: randomCard \},\
        safe: 0\
    \});\
    return "Push success";\
\}\
\
module.exports = async (req, res) => \{\
    // \uc0\u22788 \u29702 \u24494 \u20449 \u21518 \u21488 \u30340  URL \u39564 \u35777 \
    if (req.method === 'GET' && req.query.echostr) \{\
        try \{\
            const decryptedStr = decrypt(req.query.echostr);\
            return res.status(200).send(decryptedStr);\
        \} catch (e) \{\
            return res.status(500).send("Verify Failed");\
        \}\
    \}\
\
    // \uc0\u22788 \u29702 \u23450 \u26102 \u20027 \u21160 \u25512 \u36865 \
    if (req.method === 'GET' && req.query.action === 'push') \{\
        const result = await handlePush();\
        return res.status(200).send(result);\
    \}\
\
    // \uc0\u22788 \u29702 \u20320 \u22312 \u24494 \u20449 \u21457 \u28040 \u24687 \u21518 \u30340 \u33258 \u21160 \u22238 \u22797 \
    if (req.method === 'POST') \{\
        const userMsg = req.body;\
        const userId = userMsg.FromUserName;\
        const userText = userMsg.Content || "";\
\
        const prevMsg = contextMap.get(userId) || "";\
        contextMap.set(userId, userText);\
\
        const randomCard = myCards[Math.floor(Math.random() * myCards.length)];\
        let finalContent = randomCard;\
        if (prevMsg) \{\
            finalContent = `\uc0\u65310  \u22238 \u24212 \u20320 \u20043 \u21069 \u35828 \u30340 : "$\{prevMsg\}"\\n\\n$\{randomCard\}`;\
        \}\
\
        return res.status(200).json(\{\
            "ToUserName": userMsg.FromUserName,\
            "FromUserName": userMsg.ToUserName,\
            "CreateTime": Math.floor(Date.now() / 1000),\
            "MsgType": "text",\
            "Content": finalContent\
        \});\
    \}\
\};\
}