const express  = require('express');
const router   = express.Router();
const template = require('../views/template/template.js');		
const chatEdit = require('../views/chatEdit.js');		
const db       = require('../model/db_conn.js');
const is       = require('is-0');
const mysql    = require('mysql');
const multer   = require('multer');	

/* File Upload */
const storage = multer.diskStorage({ 
  destination(req, file, callback) { 
    callback(null, 'public/uploads'); 
  }, 
  filename(req, file, callback) { 
    let array = file.originalname.split('.'); 
    const result =  Date.now().toString() +'.' + array[1];
    console.log(">>>result :  "+result); 
    callback(null, result); 
  } 
}); 

const upload = multer({ 
  storage, 
  limits: { 
    files: 10, fileSize: 1024 * 1024 * 1024, 
  } 
});

/* GET home page. */
router.get('/:id', function(req, res, next) {
  
	const userId = req.session.user_id;
   const prjId = req.params.id;
   
   const sql = "SELECT PRJ_ID, USER_ID, PRJ_NM, PRJ_DESC , CHAT_MODE FROM PROJECT_LIST WHERE USER_ID = ? AND PRJ_ID = ? ";      
   db.query(sql, [userId,prjId], function(error, prjData){
      if(error){
        throw error;
      }
     
      console.log(prjData);

     if(is.empty(prjData)){
       res.redirect( '/');
       return; 
     }
     
     const sql = "SELECT PROF_ID, PROF_NM, POSITION, FILE_PATH FROM PROF_LIST WHERE PRJ_ID = ? ";   
     db.query(sql, [prjId], function(error, profData){
        if(error){
          throw error;
        }
 
        console.log(profData);
     
        const sql = "SELECT A.CHAT_ID, A.PRJ_ID, A.PROF_ID , A.CHAT_SEQ, A.CHAT_TYPE, A.CHAT_MSG , B.POSITION , 'N' AS REC_STAT FROM CHAT_LIST A LEFT JOIN PROF_LIST B ON A.PRJ_ID = B.PRJ_ID AND A.PROF_ID = B.PROF_ID WHERE A.PRJ_ID = ?";

        db.query(sql, [prjId], function(error, chatData){
            if(error){
              throw error;
            }

            //console.log(chatData);
            //console.log("prjData여기여기111 : ", prjData);
          
						// const profObj = {
						// 	PROF_ID   : 9999,
						// 	PROF_NM   : "공지",
						// 	POSITION  : "center",
						// 	FILE_PATH : "icon_profile.jpg"
						// }
						// profData.push(profObj);
					
            const title  = "Make Chat";
            const link   = ``;
            const body  = `${chatEdit.html(prjData[0],profData,chatData)}`;
            const script = `<script src="/javascripts/chatEdit.js"></script>
                            <script>
                              settingData(${JSON.stringify(prjData[0])},${JSON.stringify(profData)},${JSON.stringify(chatData)});

                            </script>
                            `;
            const html   = template.HTML(title,link, body,script);
            res.send(html);
        }); 
     }); 
   });  

});

router.post('/save', upload.array('img_file'), function(req, res, next){
	
	const post = req.body;
  console.dir(post, { colors: true, depth: 1 });
  //console.log("post --> "+JSON.stringify(post));
    
  const prjId = post.prjId;
  const chatSaveList   = JSON.parse(post.chatSaveList);
  const chatDeleteList = JSON.parse(post.chatDeleteList);
  
  //첨부파일 저장
  const files = req.files; 
  console.log("files",files);
  
  if(!is.empty(files)){
    files.forEach((file, index)=>{
        //console.log(`file inform : ${file.originalname},  ${file.filename},  ${file.mimetype},  ${file.size}`);       
        const result = chatSaveList.filter(chat => {
            if(chat.CHAT_MSG == file.originalname){
                chat.CHAT_MSG = file.filename;
            }
        });  
    });
  }
  
  let sqls = "";
  let params = [];
  
  
  const insertSql = " INSERT INTO CHAT_LIST ( CHAT_ID, PRJ_ID, PROF_ID, CHAT_SEQ, CHAT_TYPE, CHAT_MSG) VALUES ( 0 , ? , ? , ?, ? , ?); ";

  chatSaveList.map( chat => {
    params = [prjId, chat.PROF_ID, chat.CHAT_SEQ, chat.CHAT_TYPE, chat.CHAT_MSG];
    sqls += mysql.format(insertSql, params);
  });


  const deleteSql = " DELETE FROM CHAT_LIST WHERE PRJ_ID = ? AND CHAT_SEQ = ? ; ";

  chatDeleteList.map( chat => {
    params = [prjId, chat.CHAT_SEQ];
    sqls += mysql.format(deleteSql, params);
  });
  
  
  if(!is.empty(sqls)){
    db.query(sqls, function(error, result){
    console.log(sqls);
      if(error){
        throw error;
      }

      res.redirect( `/chatEdit/${prjId}`);
    });      
  }else{
    res.redirect( `/chatEdit/${prjId}`);
  }
});


router.post('/profSave', upload.array('img_file'), function(req, res, next){

	const post = req.body;
  console.dir(post, { colors: true, depth: 1 });
  //console.log("post --> "+JSON.stringify(post));
    
	const prjId = post.prjId;
	const profId = post.profId;
	//let  filePath = "icon_profile.jpg";
	let filePath = post.filePath;
	
	//첨부파일 저장
	const files = req.files; 
	console.log("files",files);
  
	if(!is.empty(files)){
		filePath = files[0].filename;
	}
	
	let sqls = "";
	let params = [];
	
	let sql = "";
	if(is.empty(profId)){
		sql = " INSERT INTO PROF_LIST ( PROF_ID, PRJ_ID, PROF_NM, POSITION, FILE_PATH) VALUES ( 0 , ? , ? , ?, ?); ";
		params = [ prjId, post.profNm, post.position, filePath];
	}else{
		sql = " UPDATE PROF_LIST SET PROF_NM = ? , POSITION = ? , FILE_PATH = ?  WHERE PRJ_ID = ? AND PROF_ID = ?; ";
		params = [ post.profNm, post.position, filePath, prjId, profId];
	}
	
	db.query(sql , params, function(error, result){
		if(error){
			throw error;
		}        
		
		 	 res.redirect( `/chatEdit/${prjId}`);
	});
	
});

module.exports = router;
