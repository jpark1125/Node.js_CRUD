const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const bodyParser = require("body-parser");
const db = require("./config/mysql.js");
const app = express();
const conn = db.init();
db.connect(conn); // 데이터베이스 연결 시도 및 로그 출력 추가

// multer 라이브러리를 사용하여 파일 업로드를 위한 저장소 구성
const upload = multer({
  storage: multer.diskStorage({
    // 파일이 저장될 서버 내의 대상 위치 설정
    destination: function (req, file, callback) {
      console.log(file), // 파일 정보 출력
        // uploads 폴더가 없으면 생성
        fs.existsSync("./uploads/") ||
          fs.mkdirSync("./uploads/", { recursive: true }),
        // 파일 저장 위치를 "./uploads/"로 설정
        callback(null, "./uploads/");
    },
    // 저장되는 파일의 이름 설정
    filename: function (req, file, callback) {
      // 파일을 원래 이름(file.originalname)으로 저장
      callback(null, file.originalname);
    },
  }),
});

// 서버의 포트를 환경변수에서 설정하거나 기본값으로 3000 사용
app.set("port", process.env.PORT || 3000);
// 서버의 호스트를 환경변수에서 설정하거나 기본값으로 "0.0.0.0" 사용
app.set("host", process.env.HOST || "0.0.0.0");

// CORS 설정 활성화
app.use(cors());
// 요청 본문을 JSON 형식으로 파싱
app.use(bodyParser.json());
// 요청 본문 중 URL 인코딩된 데이터 파싱 (extended: false => 간단한 문자열과 배열만 허용)
app.use(bodyParser.urlencoded({ extended: false }));

// 루트 경로("/")에 대한 GET 요청 처리
app.get("/", function (req, res) {
  // 요청에 "Welcome to the React Node Board!" 메시지로 응답
  res.send("Welcome to the React Node Board!");
});

/*게시글 목록 보기 */
app.get("/view", function (req, res) {
  var sql = "select * from board";
  conn.query(sql, function (err, result) {
    if (err) console.log("query is not excuted: " + err);
    else res.send(result);
  });
});

/* 게시글 쓰기 */
app.post("/insert", upload.single("img"), function (req, res) {
  var body = req.body;
  var sql = "SELECT count(*)+1 as bnum FROM board ";
  conn.query(sql, function (err, result) {
    if (err) console.log("query is not excuted: " + err);
    else {
      var sql =
        "insert into board (bnum,id,title,content,writedate) values(?,?,?,?,NOW())";
      var params = [result[0].bnum, body.id, body.title, body.content];
      conn.query(sql, params, function (err) {
        if (err) console.log("query is not excuted: " + err);
        else if (req.file != null) {
          // 만약 업로드 된 파일이 있다면
          var sql =
            "insert into file (bnum,savefile,filetype,writedate) values (?,?,?,now())";
          var params = [body.bnum, req.file.originalname, req.file.mimetype];
          conn.query(sql, params, function (err) {
            if (err) console.log("query is not excuted: " + err);
            else res.sendStatus(200);
          });
        } else res.sendStatus(200);
      });
    }
  });
});

/* 게시글 보기 */
app.get("/read/:bnum", function (req, res) {
  var sql = "select * from board where bnum=" + req.params.bnum;
  conn.query(sql, function (err, result) {
    if (err) console.log("query is not excuted: " + err);
    else res.send(result);
  });
});

/* 게시글 수정 */
app.post("/update/:bnum", function (req, res) {
  var sql = "UPDATE board SET id = ?, title = ?, content = ? WHERE bnum = ?";
  var params = [req.body.id, req.body.title, req.body.content, req.params.bnum];
  conn.query(sql, params, function (err) {
    if (err) console.log("query is not excuted: " + err);
    else res.sendStatus(200);
  });
});

/*  게시글 삭제 */
app.get("/delete/:bnum", function (req, res) {
  var sql = "delete from board where bnum=" + req.params.bnum;
  conn.query(sql, function (err) {
    if (err) console.log("query is not excuted: " + err);
    else res.sendStatus(200);
  });
});

/* 이미지 파일 불러오기 */
app.get("/read/:bnum", function (req, res) {
  var sql = "SELECT * FROM board WHERE bnum = ?";
  conn.query(sql, [req.params.bnum], function (err, result) {
    if (err) console.log("query is not excuted: " + err);
    else if (result.length != 0) {
      fs.readFile("uploads/" + result[0].savefile, function (err, data) {
        res.writeHead(200, { "Context-Type": "text/html" });
        res.end(data);
      });
    } else res.sendStatus(200);
  });
});

/* 서버 동작중인 표시 */
app.listen(app.get("port"), app.get("host"), () =>
  console.log(
    "Server is running on : " + app.get("host") + ":" + app.get("port")
  )
);

// 서버 종료 시 데이터베이스 연결 해제
process.on("SIGINT", () => {
  conn.end((err) => {
    if (err) console.error("Error ending the connection:", err);
    else console.log("Database connection closed");
    process.exit(0);
  });
});
