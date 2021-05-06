import nodejieba from 'nodejieba';
import path from 'path';
import express from 'express';
import fs from 'fs';

const app = express();

nodejieba.load({
    userDict: path.join(path.dirname(''), '/dict.txt')
});

app.set('view engine', 'ejs');
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb', extended: true}));
app.use('/assets', express.static(path.join(path.dirname(''), ('/assets'))));

app.get('/', (req, res) => res.render('index'));

app.post("/jieba", (req, res) => {
    let moodDict = Object.fromEntries(fs.readFileSync('mood.txt', 'utf8').split(/\n/).map(x => x.replace(/\r/, '').split(/\t|\s/)).map(x => x.filter(y => y !== '')));
    let dictMode = parseInt(req.body.dictMode);
    let data = nodejieba.tag(req.body.text);
    let templateName = 'jieba';
    let datas = {};

    switch (dictMode) {
        case 1:
        case 2:
        case 3:
            let partOfSpeech = dictMode === 2 ? 'n' : 'v';

            if(dictMode !== 1)
                data = data.filter(x => x.tag.charAt(0) === partOfSpeech);

            data = [...new Set(data.map(x => x.word))].map(x => nodejieba.tag(x)).flat();

            data.forEach(x => {
                if(Object.keys(datas).indexOf(x.tag) === - 1)
                    datas[x.tag] = [];

                datas[x.tag].push(x.word);
            })

            data = datas;

            break;
        case 4:
            data = data.filter(x => Object.keys(moodDict).indexOf(x.word) !== -1);

            data.forEach(item => {
                let moodScore = moodDict[item.word];

                if(Object.keys(datas).indexOf(moodScore) === -1)
                    datas[moodScore] = [];

                if(Object.values(datas[moodScore]).indexOf(item.word) === -1)
                    datas[moodScore].push(item.word);
            })

            data = datas;

            templateName = 'mood';
            break;
        case 5:
        case 6:
            let moodKeys = Object.keys(moodDict);
            let datasets = {
                positive: [],
                neutral: [],
                negative: [],
            }

            templateName = dictMode == 5 ? 'draw' : 'wordcloud';

            data.forEach(x => {
                if (moodKeys.indexOf(x.word) !== -1) {
                    if (moodDict[x.word] == 0) {
                        datasets.neutral.push(x.word);
                    } else if (moodDict[x.word] < 0) {
                        datasets.negative.push(x.word);
                    } else {
                        datasets.positive.push(x.word);
                    }
                }
            })

            data = JSON.stringify(datasets);

            break;
    }

    res.render(templateName, { data });
});

app.listen(8080, () => {
    console.log('Server Info: Listening Port 8080');
});