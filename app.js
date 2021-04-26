const nodejieba = require('nodejieba');
const path = require('path');
let express = require('express');
let app = express();
let fs = require('fs');

app.set('view engine', 'ejs');
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb', extended: true}));
app.use('/assets', express.static(path.resolve('./assets')));

app.get('/', (req, res) => res.render('index'));

app.post("/jieba", (req, res) => {
    let moodDict = Object.fromEntries(fs.readFileSync('mood.txt', 'utf8').split(/\n/).map(x => x.replace(/\r/, '').split('\t')).map(x => x.filter(y => y !== '')));
    let dictMode = parseInt(req.body.dictMode);
    let data = nodejieba.tag(req.body.text);
    let templateName = 'jieba';

    switch (dictMode) {
        case 2:
            data = data.filter(x => x.tag.charAt(0) == 'n')
            break;
        case 3:
            data = data.filter(x => x.tag.charAt(0) == 'v')
            break;
        case 4:
            data = data.filter(x => Object.keys(moodDict).indexOf(x.word) !== -1).map(x => Object.fromEntries([[x.word, moodDict[x.word]]]));
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

            if(dictMode == 5){
                templateName = 'draw';
            }else{
                templateName = 'wordcloud';
            }


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

            data = datasets;

            break;
    }

    console.log(data);

    res.render(templateName, {
        data: dictMode == 5 || dictMode == 6 ? JSON.stringify(data) : [...new Set(data)]
    });
});

app.listen(8080, () => {
    console.log('Server Info: Listening Port 8080');
});