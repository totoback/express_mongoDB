const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
dotenv.config(); //env쓰기위해 가져옴
const MongoClient = require("mongodb").MongoClient;
const methodOverride = require("method-override")
const passport = require("passport")
const LocalStrategy = require("passport-local").Strategy
const session = require("express-session")
let multer = require('multer'); //이미지 멀터
var storage = multer.diskStorage({
  destination : function(req, file, cb){
    cb(null, './public/image')
  },
  filename : function(req, file, cb){
    cb(null, file.originalname )
  },
  fileFilter: function (req, file, callback) {
    //파일 확장자 거르기
    var ext = path.extname(file.originalname);
    if(ext !== '.png' && ext !== '.jpg' && ext !== '.jpeg') {
        return callback(new Error('PNG, JPG만 업로드하세요'))
    }
    callback(null, true)
  },
});
var upload = multer({storage : storage});

const PORT = 8000;

//미들웨어
app.use(session({secret : "비밀코드", resave : true, saveUninitialized : false}))
app.use(passport.initialize())
app.use(passport.session()) //session 로그인 기능 구현 준비 끝
app.set('view engine', 'ejs')
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride("_method"))//npm install method-override

//몽고디비 연결
MongoClient.connect(process.env.MONGO_DB_URI,{ useUnifiedTopology: true }, function (error, client) {
  //연결되면 할일
  if (error) return console.log(error);
  //db
  db = client.db("todoApp"); //폴더에 연결
  // db.collection("post").insertOne({이름: "joung", 나이:28}, (error, result) => {
  //   console.log("저장완료");
  // });

  //서버띄우는 코드 여기로 옮기기
  app.listen(PORT, () => {
    console.log(`${PORT}번에서 서버 실행중!`);
  });
});

app.get("/", (req, res) => {
  res.render("index.ejs");
});

app.get("/write", (req, res) => {
  res.render("write.ejs");
});

//이미지
app.get("/upload",(req,res)=>{
  res.render("upload.ejs")
})
//1. 파일하나만 가져올떄 upload.single("input: name 속성")
//2. 파일 여러개 가져올떄 upload.array("input:개수")
app.post("/upload",upload.single("profile"),(req,res)=>{
  res.send("업로드완료")
})

app.get("/image/:imageName",(req,res)=>{
  res.sendFile(__dirname+"/public/image/"+req.params.imageName)
})

//list 보기기능, add에서 저장된 mongoDB를 불러옴
app.get("/list",(req,res)=>{
  //모든 데이터 가져오기
  //db안에 저장된 Post 콜랙션안에 모든 디비를 가져와주세요
  db.collection('post').find().toArray((error,result)=>{
    // console.log(result)
    res.render("list.ejs", {posts : result}) // db 불러오는 함수안에 넣어줘야함
  });
})

//params
app.get("/detail/:id",(req,res)=>{
  db.collection("post").findOne({id:parseInt(req.params.id)},(error, result)=>{
    console.log(result)
    res.render("detail.ejs",{data:result})
  })
})

app.get("/edit/:id",(req,res)=>{
  db.collection("post").findOne({id: parseInt(req.params.id)},(error,result)=>{
    console.log(result)
    res.render("edit.ejs",{post : result})
  })
})

app.put("/edit", (req,res)=>{
  // 폼에 담긴 ejs 제목데이터, 날짜데이터를 가지고 db.collection에다가 업데이트함 
  db.collection("post").updateOne( {id: parseInt(req.body.id)} , {$set:{title:req.body.title, date:req.body.date} }, (error,result)=>{
    res.redirect("/list")
  })
})

//마이페이지
app.get("/mypage", isLogin, (req,res)=>{
  console.log(req.user)
  res.render("mypage.ejs",{user:req.user})
})
//마이페이지 로그인했는지 유무
function isLogin(req,res,next){
  if(req.user){
    next()
  }else{
    res.send("로그인 안하셨는데요")
  }
}

//로그인 접속
app.get("/login",(req,res)=>{
  res.render("login.ejs")
})
//로그인
app.post("/login", passport.authenticate('local',{failureRedirect : '/fail'}) ,(req,res)=>{
  res.redirect('/')
  console.log(req.user)
})


//로그인 검사하는 코드
passport.use(new LocalStrategy({
    //아이디비번 인증하는 세부 코드 작성
    usernameField: 'id',
    passwordField: 'password',
    session: true,
    passReqToCallback: false,
  }, function (입력한아이디, 입력한비번, done) {
    //console.log(입력한아이디, 입력한비번);
    db.collection('login').findOne({ id: 입력한아이디 }, function (error, result) {
      if (error) return done(error)
  
      if (!result) return done(null, false, { message: '존재하지않는 아이디요' })
      if (입력한비번 == result.password) {
        return done(null, result)
      } else {
        return done(null, false, { message: '비번틀렸어요' })
      }
    })
  }));
  

//세션 저장소 
passport.serializeUser((user,done)=>{
  done(null,user.id)
})
// 마이페이지 접속시 발동(세션데이터를 가진 사람을 DB에서 찾는다)
passport.deserializeUser((id,done)=>{
  // 디비에서 user.id로 유저를 찾은 뒤에 유저 정보를 넣음
  db.collection("login").findOne({id:id}, (error,result)=>{
    done(null,result)
  })
})

//회원가입
app.post("/register", (req,res)=>{
  try {
    db.collection("login").insertOne({id:req.body.id, password:req.body.password})
    res.redirect("/")
  } catch (error) {
    console.log(error)
    res.status(500).send(error)
  }
})

// add에서 데이터 통신, write에서 쓴 db를 mongoDB에 저장

app.post("/add", async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).send("로그인해라");
    }
    console.log(req.body) //write에 정보 객체로 봄

    //db.counter 불러오기(총개시물 갯수 가져옴)
    const counter = await db.collection("counter").findOne({ name: "게시물갯수" });
    if (!counter) {throw new Error("Counter not found");}
    let totalPostLength = counter.totalPost;
    let save = {id: totalPostLength + 1, title: req.body.title, date: req.body.date, user:req.user._id}
    //db.post 저장하기
    await db.collection("post").insertOne(save)
    // res.send("전송 완료"); //res.send의 경우 insertOne 안에 기입한다.
    console.log("저장완료");

    //counter라는 콜렉션에 있는 totalPost라는 항목도 1증가시켜야함(수정)
    //db.conter 업데이트 1개는 One , 여러개는 Many
    //updateOne({어떤데이터를 수정할지},{수정할값},()=>{})
    //updateOne쓸떄 operator 써야함 = set(완전 바꿔주세요), inc(기존값에 더해줄 값)
    await db.collection("counter").updateOne({ name: "게시물갯수" }, { $inc: { totalPost: 1 } });
    res.send("저장완료");
  } catch (error) {
    console.log(error)
    
    res.status(500).send("에러난다")
  }
});

//params
app.delete("/delete/:id",(req,res)=>{
  deleteID = parseInt(req.params.id); // "1" -> 1 문자열을 숫자로 변경
  console.log(deleteID)
  //req.params에 담겨온 게시물번호를 가진 글을 db에서 찾아서 삭제해주세요.
  const deleteData = {id: deleteID, user: req.user._id}
  db.collection("post").deleteOne(deleteData,(error,result)=>{
    console.log("삭제 완료")
    res.status(200).send({message:"성공 했음"});
    //200은 성공코드, 400은 잘못된 메세지, send는 서버에 메시지 보내줄 수 있음
  })
})

//검색기능
app.get('/search', async (req,res) => {
  try {
    // mongodb search아틸라스
    const searchFilter = [
      {
        $search: {
          index: 'titleSearch', //정해둔 name
          text: {
            query: req.query.value,
            path: ['title', 'date']  // 제목날짜 둘다 찾고 싶으면 ['제목', '날짜']
          }
        }
      },
      { $sort : { id:1 } } //아이디로 정렬
    ]
    
    // aggregate() === find
    const data = await db.collection('post').aggregate(searchFilter).toArray();
    res.render('search.ejs', {posts: data});
  } catch(err) {
    console.log(err);
    res.status(500).send(err);
  }
});

// indexing : 검색을 좀 빠르게 할 수 있음


