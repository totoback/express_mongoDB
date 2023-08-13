const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const MongoClient = require("mongodb").MongoClient;

const PORT = 8000;

app.use(bodyParser.urlencoded({ extended: true }));

MongoClient.connect(
  "mongodb+srv://totojoung:dkssud@boilerplate.s8nobyi.mongodb.net/",
  function (에러, client) {
    if (에러) return console.log(에러);
    //서버띄우는 코드 여기로 옮기기
    app.listen(PORT, () => {
      console.log(`${PORT}번에서 서버 실행중!`);
    });
  }
);

// mongoose
//   .connect(process.env.MONGO_URI) //몽고디비 연결 URI ENV연결
//   .then(() => { //성공
//     console.log("연결 완료");
//   })
//   .catch((err) => { //실패
//     console.error(err);
//   });

app.get("/", (req, res) => {
  //html 파일 보내주는 방법
  res.sendFile(__dirname + "/index.html");
});

app.get("/write", (req, res) => {
  //html 파일 보내주는 방법
  res.sendFile(__dirname + "/write.html");
});

app.post("/add", (req, res) => {
  res.send("전송 완료");
  const data = req.body;
  console.log(data);
});
