const express = require('express')
const session = require('express-session')
const ethers = require('ethers');
const utils = require('ethers');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../.env') });
const cors = require('cors');
const bodyParser = require("body-parser");
const sessionOption = require('./lib/sessionOption');
const db = require('./lib/db');
const { abi, contractAddress } = require('./src/contract_info');

const app = express()
const port = 3001

const alchemyApiKey = process.env.MUMBAI_API;
const provider = new ethers.JsonRpcProvider(alchemyApiKey);

const contract = new ethers.Contract(
    contractAddress,
    abi,
    provider
  );

app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, '/build')));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

var MySQLStore = require('express-mysql-session')(session);
var sessionStore = new MySQLStore(sessionOption);
app.use(session({
    key: 'session_cookie_name',
    secret: '~',
    store: sessionStore,
    resave: false,
    saveUninitialized: false
}))

app.get('/', (req, res) => {
    req.sendFile(path.join(__dirname, '/build/index.html'));
})

app.get('/logout', function (req, res) {
    req.session.destroy(function (err) {
        res.redirect('/');
    });
});

app.post("/login", (req, res) => { // 데이터 받아서 결과 전송
    const wallet = req.body.userWallet;
    const sendData = { isLogin: "" };

    if (wallet) {
        db.query('SELECT * FROM users WHERE wallet = ?', [wallet], function (error, results, fields) {
            if (error) throw error;

            if (results.length > 0) {
                req.session.is_logined = true; // 세션 정보 갱신
                req.session.wallet = wallet;
                req.session.name = results[0].name;
                req.session.save(function () {
                    sendData.isLogin = "True"
                    res.send(sendData);
                });
            } else {
                sendData.isLogin = "이더리움 지갑 주소 정보가 일치하지 않습니다."
                res.send(sendData);
            }
        });
    } else {
        sendData.isLogin = "이더리움 지갑 주소를 입력하세요!"
        res.send(sendData);
    }
});

app.post("/signin", (req, res) => {  // 데이터 받아서 결과 전송
    const name = req.body.userName;
    const wallet = req.body.userWallet
    const sendData = { isSuccess: "" };

    if (name && wallet) {
        db.query('SELECT * FROM users WHERE wallet = ?', [wallet], function (error, results, fields) { // DB에 같은 지갑의 회원아이디가 있는지 확인
            if (error) throw error;
            if (results.length <= 0) { // 중복된 지갑 주소가 없으면 회원가입
                db.query('INSERT INTO users (name, wallet) VALUES(?, ?)', [name, wallet], function (error, data) {
                    if (error) throw error;
                    req.session.save(function () {
                        sendData.isSuccess = "True"
                        res.send(sendData);
                    });
                });
            }
            else {
                sendData.isSuccess = "이미 존재하는 지갑 주소입니다.!"
                res.send(sendData);
            }
        });
    } else {
        sendData.isSuccess = "이름, 지갑 주소를 입력하세요!"
        res.send(sendData);
    }
});

app.get('/userdata', (req, res) => {
    const sendData = { isLogin: false, userData: {} };
    const wallet = req.session.wallet;
    const sqlQuery = `
        SELECT *
        From users
        WHERE wallet = ?`;
    db.query(sqlQuery, [wallet], function (error, results, fields) {
        if (error) throw error;
        else {
            const userData = results[0] || {};
            sendData.userData = userData;
            sendData.isLogin = true;
            const postsQuery = `
                SELECT content, idx
                FROM posts
                WHERE wallet = ?`;
            db.query(postsQuery, [wallet], function (error, results, fields) {
                if (error) throw error;
                else {
                    sendData.userPosts = results;
                    res.send(sendData);
                }
            });
        }
    });
});

app.get('/boards', (req, res) => {
    db.query('SELECT users.name, posts.content, posts.idx FROM users JOIN posts ON users.wallet = posts.wallet', function (error, results, fields) {
        if (error) {
            console.error('Error retrieving posts data:', error);
            res.status(500).send('Internal Server Error');
        } else {
            const postsData = results.map(post => ({
                name: post.name,
                content: post.content,
                idx: post.idx,
            }));
            res.send({ allPosts: postsData });
        }
    });
});

app.get('/posts', (req, res) => {
    db.query('SELECT * FROM posts', function (error, results, fields) {
        if (error) {
            console.error('Error retrieving posts data:', error);
            res.status(500).send('Internal Server Error');
        } else {
            const postsData = results.map(post => ({
                wallet: post.wallet,
                content: post.content,
                comments: []
            }));
        }
    });
});

app.post('/posts', (req, res) => {
    const wallet = req.session.wallet;
    const content = req.body.userContent;

    db.query('INSERT INTO posts (wallet, content) VALUES (?, ?)', [wallet, content], function (error, results, fields) {
        if (error) {
            console.error('Error inserting post data:', error);
            res.status(500).send('Internal Server Error');
        } else {
            res.send({ isSuccess: true, postId: results.insertId });
        }
    });
});

app.delete('/posts', (req, res) => {
    const wallet = req.session.wallet;

    db.query('DELETE FROM posts WHERE wallet = ?', [wallet], function (error, results, fields) {
        if (error) {
            console.error('Error deleting posts data:', error);
            res.status(500).send('Internal Server Error');
        } else {
            res.send({ isSuccess: true });
        }
    });
});

app.get('/comments/:postId', (req, res) => {
    const postId = req.params.postId;
    const commentsQuery = `
        SELECT posts.content, comments.writer, comments.comment
        FROM posts LEFT JOIN comments ON posts.idx = comments.postId
        WHERE posts.idx = ?`;
    db.query(commentsQuery, [postId], (error, results, fields) => {
        if (error) {
            console.error('Error retrieving comments data:', error);
            res.status(500).send('Internal Server Error');
        }
        else {
            const postContent = results.length > 0 ? results[0].content : '';
            const commentsData = results.map((comment) => ({
                writer: comment.writer,
                comment: comment.comment,
            }));
            res.send({ postContent, comment: commentsData });
        }
    }
    );
});

app.post('/comments/:postId', (req, res) => {
    const writer = req.session.name;
    const comment = req.body.comment;
    const postId = req.params.postId;

    db.query('INSERT INTO comments (writer, comment, postId) VALUES (?, ?, ?)', [writer, comment, postId], function (error, result) {
        if (error) {
            console.error('Error inserting comment data:', error);
            res.status(500).send('Internal Server Error');
        } else {
            res.json({ isSuccess: true, writer: writer });
        }
    });
});

app.post('/rewardTokens', async (req, res) => {
    try {
        const wallet = req.session.wallet;
        const walletFrom = new ethers.Wallet(process.env.METAMASK_PRIVATE_KEY, provider);
        const contractWithSigner = contract.connect(walletFrom);
        const transaction = await contractWithSigner.transfer(
            wallet,
            10000
        );
        const receipt = await transaction.wait();
        console.log('Transaction comlpleted');
        console.log(receipt);
        res.status(200).json({ success: true, message: 'Tokens rewarded successfully.' });
    } catch (error) {
        console.error('Error rewarding tokens:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

app.post('/adminMint', async (req, res) => {
    try {
        const wallet = req.session.wallet;
        const walletFrom = new ethers.Wallet(process.env.METAMASK_PRIVATE_KEY, provider);
        const contractWithSigner = contract.connect(walletFrom);
        const mintAmount = utils.parseUnits('10', 18);
        const transaction = await contractWithSigner.mint(wallet, mintAmount);
        const receipt = await transaction.wait();
        console.log('Minting tokens completed');
        console.log(receipt);
        res.status(200).json({ success: true, message: 'Tokens minted successfully.' });
    } catch (error) {
        console.error('Error minting tokens:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

app.post('/adminBurn', async (req, res) => {
    try {
        const wallet = req.session.wallet;
        const walletFrom = new ethers.Wallet(process.env.METAMASK_PRIVATE_KEY, provider);
        const contractWithSigner = contract.connect(walletFrom);
        const burnAmount = utils.parseUnits('10', 18);
        const transaction = await contractWithSigner.burn(wallet, burnAmount);
        const receipt = await transaction.wait();
        console.log('Burning tokens completed');
        console.log(receipt);
        res.status(200).json({ success: true, message: 'Tokens burned successfully.' });
    } catch (error) {
        console.error('Error minting tokens:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`)
})