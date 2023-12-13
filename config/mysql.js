var mysql = require("mysql2");

var db_info = {
  host: "localhost", // 데이터베이스 주소
  port: "3306", // 데이터베이스 포트
  user: "root", // 로그인 계정
  password: "wnsdud1125", // 비밀번호
  database: "react_node_board", // 엑세스할 데이터베이스
};

module.exports = {
  init: function () {
    return mysql.createConnection(db_info);
  },
  connect: function (conn) {
    conn.connect(function (err) {
      if (err) console.error("mysql connection error : " + err);
      else console.log("mysql is connected successfully!"); // 연결 성공 로그 출력
    });
  },
};
