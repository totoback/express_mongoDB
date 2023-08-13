const express = require("express");
const app = express();
const bodyParser = require("body-parser");
// const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config(); //env쓰기위해 가져옴
const MongoClient = require("mongodb").MongoClient;


const PORT = 8000;

app.set('view engine', 'ejs')
app.use(bodyParser.urlencoded({ extended: true }));

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

//add에서 데이터 통신, write에서 쓴 db를 mongoDB에 저장
app.post("/add", (req, res) => {
  console.log(req.body) //write에 정보 객체로 봄
  res.send("저장완료")
  //db.counter 불러오기(총개시물 갯수 가져옴)
  db.collection("counter").findOne({name:"게시물갯수"},(error,result)=>{
    console.log(result.totalPost)
    console.log(error)
    let totalPostLength = result.totalPost;

      //db.post 저장하기
      db.collection("post").insertOne({ _id: totalPostLength + 1, title: req.body.title, date: req.body.date }, (error, result)=>{
      console.log("저장완료")
      // res.send("전송 완료"); //res.send의 경우 insertOne 안에 기입한다.

      //counter라는 콜렉션에 있는 totalPost라는 항목도 1증가시켜야함(수정)
      //db.conter 업데이트 1개는 One , 여러개는 Many
      //updateOne({어떤데이터를 수정할지},{수정할값},()=>{})
      //updateOne쓸떄 operator 써야함 = set(완전 바꿔주세요), inc(기존값에 더해줄 값)
      db.collection("counter").updateOne({name:"게시물갯수"},{ $inc: {totalPost:1} },(error,result)=>{
        if(error){return console.log(error)}
      })
    })
  })
});

//list 보기기능, add에서 저장된 mongoDB를 불러옴
app.get("/list",(req,res)=>{
  //모든 데이터 가져오기
  //db안에 저장된 Post 콜랙션안에 모든 디비를 가져와주세요
  db.collection('post').find().toArray((error,result)=>{
    // console.log(result)
    res.render("list.ejs", {posts : result}) // db 불러오는 함수안에 넣어줘야함
  });
})

app.delete("/delete",(req,res)=>{
  req.body._id = parseInt(req.body._id); // "1" -> 1 문자열을 숫자로 변경
  // console.log(req.body)
  //req.body에 담겨온 게시물번호를 가진 글을 db에서 찾아서 삭제해주세요.
  db.collection("post").deleteOne(req.body,(error,result)=>{
    console.log("삭제 완료")
    res.status(200).send({message:"성공 했음"});
    //200은 성공코드, 400은 잘못된 메세지, send는 서버에 메시지 보내줄 수 있음
  })
})
