const express  = require('express');
const router   = express.Router();
const template = require('../views/template/template.js');		
const index    = require('../views/index.js');		
const db       = require('../model/db_conn.js');
const is       = require('is-0');

/* GET home page. */
router.get('/', function(req, res, next) {
  
  const sql = "SELECT PRJ_ID, PRJ_NM, PRJ_DESC , CHAT_MODE FROM PROJECT_LIST A WHERE REC_STAT <> 'D' ORDER BY PRJ_ID";
        
   db.query(sql, [], function(error, result){
      if(error){
        throw error;
      }
     
      console.log(result);
     
      const title  = "Make Chat";
      const link   = ``;
      const body  = `${index.html(result)}`;
      const script = `<script src="/javascripts/script.js"></script> `;
      const html   = template.HTML(title,link, body,script);
      res.send(html);
     
   });  

});

router.get('/delete', function(req, res, next) {
  
   //const sql = "DELETE FROM PROJECT_LIST WHERE PRJ_ID = ?";
  const sql = "UPDATE PROJECT_LIST SET REC_STAT = 'D' WHERE PRJ_ID = ?";
        
   db.query(sql, [req.query.id], function(error, result){
      if(error){
        throw error;
      }
     
     console.log(result);

      res.redirect( '/');
     
   });  

});

router.post('/save', function(req, res, next){
 
	const post = req.body;
	console.log("post --> "+JSON.stringify(post));
	
  
  //Insert  
  if(is.empty(post.prjId)){

    const insertProject = "INSERT INTO PROJECT_LIST ( PRJ_ID, PRJ_NM, PRJ_DESC ,CHAT_MODE, REC_STAT) VALUES (0, ?, ? , ? , 'I')";
    db.query(insertProject, [ post.prjNm, post.prjDesc, post.chatMode], function(error, result){
      if(error){
        throw error;
      }
      
      const prjId = result.insertId;
      
      addDefaultProfile(prjId, '선생님','left', 'profile_1.png' ,1);
      addDefaultProfile(prjId,  '학생' ,'right', 'profile_2.png' ,2);
      
      res.redirect( '/');
    });  

  //Udate
  }else{
    const updateProject = "UPDATE PROJECT_LIST SET PRJ_NM = ? , PRJ_DESC = ? , CHAT_MODE = ? WHERE PRJ_ID = ?";
    db.query(updateProject, [ post.prjNm, post.prjDesc, post.chatMode, post.prjId], function(error, result){
      if(error){
        throw error;
      }
        res.redirect( '/');
    });  
  }  
  
});

router.post('/modify', function(req, res, next){
  
  const post = req.body;
	console.log("post --> "+JSON.stringify(post));
  
  const updateProject = "UPDATE PROJECT_LIST SET PRJ_NM = ? , PRJ_DESC = ? , CHAT_MODE = ? WHERE PRJ_ID = ?";
    db.query(updateProject, [ post.prjNm, post.prjDesc, post.chatMode, post.prjId], function(error, result){
      if(error){
        throw error;
      }
        res.redirect( `/chatEdit/${post.prjId}`);
    });  
});


const addDefaultProfile = (prjId, profNm, position, filePath, sortSeq) => {
   const insertProf = "INSERT INTO PROF_LIST ( PROF_ID, PRJ_ID, PROF_NM, POSITION, FILE_PATH ,SORT_SEQ) VALUES (0, ?, ?, ?, ?, ?)";

      db.query(insertProf, [ prjId, profNm, position, filePath, sortSeq], function(error, result){
        if(error){
          throw error;
        }
        console.log(`[Insert E n d] 프로필 [${profNm}]이(가) 추가되었습니다`);
      });
}


module.exports = router;
