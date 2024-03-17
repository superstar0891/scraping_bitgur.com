import axios from "axios";
import * as fs from "fs";
import path from "path";

const base_uri = path.normalize(__dirname + "/../src");
const startTime = 1662223248000
const endTime = 1710317895000
const stepTime = 2932000
const base_url = "https://bitgur.com/aj/news-before?time" as string
const headers = {
    "Cookie": "_ui_nv=1710316308660; JSESSIONID=5B83A2EC4754323EAB7825030C8961C4; _ym_uid=1710316137679199575; _ym_d=1710316137; _ym_isad=1; _gid=GA1.2.824429803.1710316140; _ga=GA1.1.663322756.1710316139; _ga_6QFXMCBWSS=GS1.1.1710316139.1.1.1710316680.0.0.0; _ui_wm=eyJyciI6ZmFsc2UsInJ3Ijo1MywiY3ciOjU0N30=",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
}

const getData = async (url: string) => {
    const res = await axios.get(url, {headers})
    return res.data
}

const strip = (text: string) => {
    text = text.trim()
        .replace('‘', '\'')
        .replace('’', '\'')
        .replace('“', '"')
        .replace('”', '"')
    return text
}


(async () => {
    try {
        const limit = 10
        let _time = endTime 
        let k = 0
        let fileid = 0
        let dups = {} as {[key: string]: boolean}
        let cnt = 0
        
        let data = [] as string[]
        const addData = (text: string) => {
            if (text.length < 30 || text.length > 2048) return
            if (dups[text]!==undefined) return
            dups[text] = true
            data.push(text)
        }
        while (_time >= startTime) {
            const timestamp = +new Date()
            const resp = await getData(`${base_url}=${_time}&limit=20`)
            if (resp?.status==='ok') {
                
                for (let i of resp.result) {
                    if (_time > i.createdTime) _time = i.createdTime
                    const x1 = i.title.trim().trim().split('\n')
                    const x2 = i.brief.trim().trim().split('\n')
                    for (let v of x1) {
                        v = strip(v)
                        addData(v)
                    }
                    let text = ''
                    for (let t of x2) {
                        const x = t.split('. ')
                        for (let v of x) {
                            v = strip(v)
                            if (v==='') continue
                            if (v[0]===v[0].toUpperCase() && text!=='') {
                                addData(text)
                                text = ""
                            }
                            text += (text==='' ? '' : ' ') + v
                            const l = text.length;
                            if (text[l - 1]==='.') {
                                addData(text)
                                text = ""
                            }
                            
                            
                        }
                    }
                    if (text!=='') {
                        if (text.length < 30 || text.length > 2048) continue
                        if (dups[text]!==undefined) continue
                        dups[text] = true
                        data.push(text)
                    }
                }
                cnt++
                
            }
            if (cnt===limit) {
                
                fs.writeFileSync(`${base_uri}/data/${++fileid}.txt`, data.join('\n'))
                console.log(`writed #${fileid} cnt ${data.length}`)
                data = []
                cnt = 0
            }
            k++
            console.log(`fetched #${k} ${(+new Date() - timestamp) / 1000} s`)
            _time = _time - stepTime
        }
        if (cnt!==0) {
            fs.writeFileSync(`${base_uri}/data/${++fileid}.txt`, data.join('\n'))
            console.log(`writed #${fileid} cnt ${data.length}`)
        }
    } catch (error) {
        console.log(error)
    }
})()