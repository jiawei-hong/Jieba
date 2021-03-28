const nodejieba = require('nodejieba');
const path = require('path');
let express = require('express');
let app = express();
let fs = require('fs');

app.set('view engine', 'ejs');
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/assets', express.static(path.resolve('./assets')));

app.get('/', (req, res) => res.render('index'));

app.post("/jieba", (req, res) => {
    let moodDict = Object.fromEntries(fs.readFileSync('mood.txt', 'utf8').split(/\n/).map(x => x.replace(/\r/, '').split('\t')).map(x => x.filter(y => y !== '')));
    let dictMode = parseInt(req.body.dictMode);
    let data = nodejieba.tag(req.body.text);

    switch (dictMode) {
        case 2:
            data = data.filter(x => x.tag.charAt(0) == 'n')
            break;
        case 3:
            data = data.filter(x => x.tag.charAt(0) == 'v')
            break;

        case 4:
            data = data.filter(x => Object.keys(moodDict).indexOf(x.word) !== -1).map(x => Object.fromEntries([[x.word, moodDict[x.word]]]));
            break;
        case 5:
            let postive = [], neutral = [], negative = [];

            data.forEach(word => {
                Object.keys(moodDict).forEach(mood => {
                    let existMood = word.word == mood;

                    if (existMood) {
                        if (moodDict[mood] == 0 && neutral.indexOf(mood) == - 1) {
                            neutral.push(mood);
                        } else if (moodDict[mood] < 0 && negative.indexOf(mood) == - 1) {
                            negative.push(mood);
                        } else if (postive.indexOf(mood) == - 1) {
                            postive.push(mood);
                        }
                    }
                });
            })

            data = { postive, neutral, negative };
            break;
    }

    res.render(dictMode == 5 ? 'draw' : dictMode == 4 ? 'mood' : 'jieba', {
        data: dictMode == 5 ? JSON.stringify(data) : data.filter((ele, index, array) => {            
            return array.map(x => x.word).indexOf(ele.word) === array.indexOf(ele);
        })
    });
});

app.listen(8080, () => {
    console.log('Server Info: Listening Port 8080');
});