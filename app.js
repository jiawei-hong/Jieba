const nodejieba = require('nodejieba');
const bodyParser = require("body-parser");
let express = require('express')
let app = express();
let fs = require('fs');

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use('/assets', express.static('assets'));
app.use('/data', express.static('data'));

app.get('/', (req, res) => res.render('index'));

app.post("/jieba", (req, res) => {
    let jiebaNounFilter = ["n", "nr", "nr1", "nr2", "nrj", "nrf", "ns", "nsf", "nt", "nz", "nl", "ng", "ad", "an", "ag", "al"];
    let jiebaVerbFilter = ["v", "vd", "vn", "vshi", "vyou", "vf", "vx", "vi", "vl", "vg"];
    let moodDict = Object.fromEntries(fs.readFileSync('mood.txt', 'utf8').split(/\n/).map(x => x.replace(/\r/, '').split('\t')).map(x => x.filter(y => y !== '')));
    let dictMode = parseInt(req.body.dictMode);
    let data = nodejieba.tag(req.body.text);

    switch (dictMode) {
        case 2:
            data = data.filter(x => jiebaNounFilter.indexOf(x.tag) !== -1);
            break;

        case 3:
            data = data.filter(x => jiebaVerbFilter.indexOf(x.tag) !== -1);
            break;

        case 4:
            data = data.filter(x => Object.keys(moodDict).indexOf(x.word) !== -1).map(x => Object.fromEntries([[x.word, moodDict[x.word]]]));
            break;
    }

    if (dictMode == 5) {
        res.render('draw');
    } else {
        res.render('jieba', {
            data: data
        });
    }

});

app.get('/getMoodFilterData', async (req, res) => {
    let moodDict = Object.fromEntries(fs.readFileSync('mood.txt', 'utf8').split(/\n/).map(x => x.replace(/\r/, '').split('\t')).map(x => x.filter(y => y !== '')));
    let data = fs.readFileSync('./data/Taichung400.csv', 'utf-8').split('\n').map(x => x.split(',')[1]).filter(x => x !== undefined).map(x => x.replace(/\\"|\s|\"|\r/g, '')).filter(x => x.length > 1);
    let postive = [], neutral = [], negative = [];

    data.forEach(word => {
        Object.keys(moodDict).forEach(mood => {
            let existMood = word.search(mood) !== -1;

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

    return res.json({ postive, neutral, negative });
});

app.post('/cloud', (req, res) => {

});

app.get('/draw', (req, res) => res.render('draw'));

app.listen(8080, () => {
    console.log('Server Info: Listening Port 8080');
});