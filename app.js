const express = require("express");
const session = require("express-session");
const FileStore = require('session-file-store')(session);
const { Session } = require("express-session");
const mysql = require('mysql');
const app = express()
const port = 9000

app.set('view engine', 'ejs');
app.use(express.urlencoded({extended: true}));
app.use(express.static("assets"));
app.use(express.json());

const con = mysql.createConnection({
    host : 'localhost',
    user : 'root',
    password : 'rkdalswn9366',
    database : 'project_db',
});

//세션등록
app.use(session({
    secret: 'mykey', // 이 값을 통해 세션을 암호화 (노출하지 않아야 함)
    resave: false, // 세션 데이터가 바뀌기 전까지는 세션 저장소에 값을 저장하지 않음
    saveUninitialized: true, //세션이 필요하면 세션을 실행시킨다
    store: new FileStore() // 세션이 데이터를 저장하는 곳
}))

//회원가입
app.get('/register', (req, res) => {
    console.log('회원가입 페이지');
    res.render('register');
});

app.post('/register', (req, res) => {
    console.log('회원가입 하는중');
    const body = req.body;
    const id = body.id;
    const pw = body.pw;
    const name = body.name;
    const age = body.age;
    const param = [id,pw,name,age];

    const sql = 'insert into users(user_id, user_pw, user_name, user_age) values(?,?,?,?)';
    console.log(param)
    con.query(sql, param, function(err, result, fields){
        if (err) throw err;
        res.redirect('/');
    });
});

//회원정보 수정
app.get('/update', (req, res)=>{
    console.log("업데이트 진입");
    con.query('select product_name from product where buyer_idx = ?;', login_user_idx, (err, rows)=>{
        if(err) console.error(err)
        console.log(rows)
        res.render('update', {rows:rows});
    })
    
})

app.post('/update/up',(req, res)=>{
    console.log("업데이트");
    var name = req.body.name;
    var age = req.body.age;
    var datas = [name, age, login_user_id];

    var sql = "update users set user_name=?, user_age=? where user_id = ?";
    con.query(sql, datas, (err, result)=>{
        if(err) console.error(err)
        res.redirect('/');
    })
})

//물품 게시판
app.get('/board', (req, res)=>{
    console.log('물품 게시판 진입');
    var sql = "select A.user_name, B.product_name, B.idx, B.buyer_idx from users A, product B where A.idx = B.user_idx;";
    con.query(sql, function (err, rows){
        if (err) console.error("err : " +err);
        console.log(rows);
        res.render('productlist', {title: '게시판 리스트', rows:rows, is_logined:is_user_logined});
    });
});

//물품 게시판 글쓰기
app.get('/board/write', (req, res)=>{
    console.log("물품 게시물쓰기 진입")
    res.render('productwrite', {title : "물품 올리기"});
});

app.post('/board/write', (req, res)=>{
    var title = req.body.title;
    var datas = [title, login_user_idx];
    con.query("insert into product(product_name, user_idx) values(?,?)", datas, function(err, data){
        if(err) console.error("err : "+err);
        console.log("물품 올리기 성공");
        res.redirect('/board');
    });
});

// 물품 사기
app.get('/board/:idx', (req, res)=>{
    console.log("물품 사기")
    var idx = req.params.idx;
    var sql = "update product set buyer_idx = ? where idx=?;"
    con.query(sql, [login_user_idx,idx], function(err, data){
        if(err) console.error(err);
        res.redirect('/board');
    })
});

//게시판
app.get('/market', (req, res)=>{
    console.log('게시판 진입');
    var sql = "select A.user_name, B.board_title, B.board_content, B.idx from users A, board B where A.idx = B.user_idx;";
    con.query(sql, function (err, rows){
        if (err) console.error("err : " +err);
        console.log(rows);
        res.render('list', {title: '게시판 리스트', rows:rows, is_logined:is_user_logined});
    });
});

//게시판 글쓰기
app.get('/market/write', (req, res)=>{
    console.log("게시물쓰기 진입")
    res.render('write', {title : "게시판 글 쓰기"});
});

app.post('/market/write', (req, res)=>{
    var title = req.body.title;
    var content = req.body.content;
    
    
    var datas = [login_user_idx,title, content];
    con.query("insert into board(user_idx, board_title, board_content) values(?,?,?)", datas, function(err, data){
        if(err) console.error("err : "+err);
        console.log("게시글 올리기 성공");
        res.redirect('/market');
    });
})

// 글 상세보기
app.get('/market/:idx', (req, res)=>{
    console.log("상세 페이지 진입")
    var idx = req.params.idx;
    var sql = "select A.user_name, B.idx, B.board_title, B.board_content from board B, users A where B.idx = ? AND B.user_idx = A.idx;"
    con.query(sql, [idx], function(err, data){
        if(err) console.error(err);
        res.render('read', {title:"글 상세", row:data[0]});
    })
});

app.post('/market/delete', (req, res)=>{
    console.log("삭제");
    var idx = req.body.idx;
    var sql = "delete from board where idx=?"
    con.query(sql, idx, function(err, result){
        if(err) console.error(err);
        res.redirect('/market')
    })
})

//로그인
app.get('/login', (req, res)=>{
    console.log('로그인 작동');
    res.render('login');
});

app.post('/login', (req, res)=>{
    const body = req.body;
    const id = body.id;
    const pw = body.pw;

    con.query('select * from users where user_id=?;',[id],(err, data)=>{
        //로그인 확인
        console.log(data[0]);
        console.log(id);
        console.log(data[0].user_id);
        console.log(data[0].user_pw);
        console.log(id == data[0].user_id);
        console.log(pw == data[0].user_pw);
        if(id == data[0].user_id && pw == data[0].user_pw){
            console.log('로그인 성공')
            global.is_user_logined = true;
            req.session.is_logined = true;
            req.session.name = data.user_name;
            req.session.id = data.user_id;
            req.session.pw = data.user_pw;
            global.login_user_id = data[0].user_id;
            con.query("select idx from users where user_id = ?",[login_user_id],(err, data)=>{
                if(err) console.error("err : "+err);
                global.login_user_idx = data[0].idx;
                console.log(login_user_idx);
            })
            console.log(login_user_id)
            req.session.save(function(){
                res.render('index',{
                    name : data[0].user_name,
                    id : data[0].user_id,
                    age : data[0].user_age,
                    is_logined : true
                });
            });
        }else{
            console.log('로그인 실패');
            res.render('login');
        }
    })
})

//로그아웃
app.get('/logout',(req, res)=>{
    console.log('로그아웃 성공');
    is_user_logined = false;
    req.session.destroy(function(err){
        res.redirect('/');
    });
});




app.listen(port, () =>{
    console.log(`${port}번 포트에서 서버 대기중입니다.`);
    
})