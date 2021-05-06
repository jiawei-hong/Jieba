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
    let templateName = 'jieba';
    let moodDict = [...fs.readFileSync('mood.txt','utf-8').matchAll(/([^\t]+?)\t(.+)/gm)].map(x => {
        return {
            word: x[1].replace(/\r|\n/g,''),
            score: x[2].replace(/\t|\s/g, '')
        }
    });
    let moodWords = moodDict.map(x => x.word);
    let requestDictMode = parseInt(req.body.dictMode);
    let requestText = nodejieba.tag(req.body.text);
    let data = {};

    if(requestDictMode <= 4){
        let preData = requestText;
        let partOfSpeech = requestDictMode == 2 ? 'n' : 'v';

        if(requestDictMode >= 2 && requestDictMode <= 3)
            preData = preData.filter(x => x.tag.charAt(0) === partOfSpeech);
        else if (requestDictMode == 4)
            preData = preData.filter(x => moodWords.indexOf(x.word) !== -1);

        preData.forEach(item => {
            let moodData = requestDictMode == 4 ? moodDict[moodWords.indexOf(item.word)].score : item.tag;

            if(Object.keys(data).indexOf(moodData) === -1)
                data[moodData] = [];

            if(Object.values(data[moodData]).indexOf(item.word) === -1)
                data[moodData].push(item.word);
        })

    } else {
        let datasets = {
            positive: [],
            neutral: [],
            negative: [],
        }

        templateName = requestDictMode == 5 ? 'draw' : 'wordcloud';

        
        requestText.forEach(x => {
            if (moodWords.indexOf(x.word) !== -1) {
                let index = moodWords.indexOf(x.word);

                if (moodDict[index].score == 0) {
                    datasets.neutral.push(x.word);
                } else if (moodDict[index].score < 0) {
                    datasets.negative.push(x.word);
                } else {
                    datasets.positive.push(x.word);
                }
            }
        })

        data = JSON.stringify(datasets);
    }

    res.render(templateName, { data });
});

app.listen(8080, () => {
    console.log('Server Info: Listening Port 8080');
});