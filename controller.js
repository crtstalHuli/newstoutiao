let fs = require('fs');
let moment = require('moment');
// 连接数据库
let mysql = require('mysql');
let database = require('./config/database.js');
let connection = mysql.createConnection(database);
connection.connect((err)=>{
    if(err){ throw err; }
    console.log('mysql 连接成功');
})

// 获取每页数据
let pageSize = require('./config/page.js');
const { query } = require('express');
const { RSA_NO_PADDING } = require('constants');


let controller = {
    // 登录页面
    "login":async (req,res)=>{
        res.render('login.html');
    },
    // 登录验证
    "insert":(req,res)=>{
        let {email,password} = req.body;
        let sql = `SELECT * FROM users WHERE email = ? AND password = ?`;
        let bind = [email,password];
        connection.query(sql,bind,(err,rows,fileds)=>{
            if(err){ throw err; }
            if(rows[0] === undefined){
                res.json({
                    code:-1,
                    message:'邮箱或密码错误'
                })
            }else {
               
                    req.session.photo = rows[0].photo;
                req.session.nickname = rows[0].nickname;
                req.session.uid = rows[0].user_id;
                req.session.email = rows[0].email;
                req.session.intro = rows[0].intro;
                // console.log('login'+req.session.intro);
                
    
                res.json({
                    code:200,
                    message:'success'
                }) 
            }
        })
        
    }, 
    // 退出
    "logout":(req,res)=>{
        // 清空session
        req.session.destroy(function(err){
            if(err){
                throw err;
            }
        })
        // 打回登录页面
        res.redirect('/login');
    },
    // 首页
    "index":async (req,res)=>{

        var sql1 = ' SELECT `post_id`,`status` FROM `posts` '; 
        var sql2 = ' SELECT COUNT(1) AS count FROM `category`';
        var sql3 = ' SELECT `comment_id`,`status` FROM `comments` ';

        let resData = {};
        let q1 = querySql(sql1);
        let q2 = querySql(sql2);
        let q3 = querySql(sql3);

        var data = await Promise.all([q1,q2,q3]);
        resData.postsCount = data[0].length;
        resData.draftedCount = getCount(data[0],'drafted');
        resData.categoryCount = data[1][0].count;
        resData.commentsCount = data[2].length;
        resData.heldCount = getCount(data[2],'held');
        res.render('index.html',{
            resData:resData,
            photo:req.session.photo,
            nickname:req.session.nickname
        });
    },
    // 所有文章
    "posts":async (req,res)=>{

        // 取出文章分类和文章状态
        let status = [
            {"key":"published","text":"发布"},
            {"key":"drafted","text":"草稿"},
            {"key":"trashed","text":"废弃"}
        ]
        var sql = 'select * from category';
        var data = await querySql(sql);

        res.render('posts.html',{
            photo:req.session.photo,
            nickname:req.session.nickname,

            status:status,
            catData:data
        });
    },
    // 获取页码总数和每页数据量
    "pageCount":async (req,res)=>{
        let {cat_id,status} = req.query;

        let where = `1=1`;
        if(cat_id){
            where += ` and cat_id =${cat_id} `;
        }
        if(status){
            where += ` and status ='${status}'`;
        }

        let sql = `select count(1) as count from posts where ${where}`;
        var data = await querySql(sql);
        // 计算总页数
        var totalPage = Math.ceil(data[0].count / pageSize.pageSize);
        // console.log(totalPage);
        res.json({
            totalPage:totalPage,
            pageSize:pageSize.pageSize
        });
    },
    // 获取当前页数据
    "getPageData":async (req,res)=>{
        let {page,cat_id,status} = req.query;
        var where = `1=1`;
        if(cat_id){
            where += ` and p1.cat_id = '${cat_id}'`;
        }
        if(status){
            where += ` and p1.status = '${status}'`;
        }
        // let page = req.query.page;
        // 计算从第几条开始那
        let offset = (page - 1) * pageSize.pageSize;
        let sql = `SELECT p1.*,p2.nickname,p3.cat_name
        FROM posts p1 LEFT JOIN users p2 ON p1.user_id = p2.user_id
        LEFT JOIN category p3 ON p1.cat_id = p3.cat_id 
        where ${where}
        order BY p1.post_id DESC limit ${offset},${pageSize.pageSize}`;
        var data = await querySql(sql);
        // console.log(data);
        res.json(data);

    },
    // 删除文章
    "delPost":async (req,res)=>{
        let postId = req.body.id;
        let sql = `DELETE FROM posts WHERE post_id = ${postId}`;
        querySql(sql).then(data=>{
            res.json({
                code:200,
                message:'delete success'
            })
        }).catch((err)=>{
            res.json({
                code:-1,
                message:'delete error'
            })
        }) 
    },
    // 编辑文章
    "editPost":async (req,res)=>{

        var postId = req.params.post_id;
        let editSql = `select * from posts where post_id = ${postId}`;
        var editData = await querySql(editSql);
        // 替换路径
        var photo = editData[0].feature.replace('./','/');
        editData[0].feature = photo;
        var created = moment(editData[0].created).format('YY-MM-DD HH:mm:ss');
        editData[0].created = created;
        // 取出文章分类和文章状态
        let status = [
            {"key":"published","text":"发布"},
            {"key":"drafted","text":"草稿"},
            {"key":"trashed","text":"废弃"}
        ]
        var sql = 'select * from category';
        var data = await querySql(sql);

        res.render('post-edit.html',{
            photo:req.session.photo,
            nickname:req.session.nickname,
    
            catData:data,
            data:editData[0],
            status:status
        })
        
    },
    // 保存编辑文章数据入库
    "updPost":async (req,res)=>{
        let {post_id,title,content,feature,category,created,status} = req.body;
        let sql = `UPDATE posts SET 
        title='${title}', content='${content}',feature='${feature}',
        cat_id='${category}',created='${created}',status='${status}'
        where post_id =${post_id} `;
        var data = await querySql(sql);
        let {affectedRows} = data;
        if(affectedRows){
            res.json({code:200,message:'edit success'});
        }else {
            res.json({code:-1,message:'edit error'});
        }
    },
    // 写文章
    "postAdd":async (req,res)=>{
        // 取出文章分类和文章状态
        let status = [
            {"key":"published","text":"发布"},
            {"key":"drafted","text":"草稿"},
            {"key":"trashed","text":"废弃"}
        ]
        var sql = 'select * from category';
        var data = await querySql(sql);
        res.render('post-add.html',{
            photo:req.session.photo,
            nickname:req.session.nickname,
    
            status:status,
            catData:data
        })  
    },
    // 保存文章数据入库
    "savePost":(req,res)=>{
        
        let {title,content,category,created,status,feature} = req.body;
        // console.log(req.body);
        let sql = `insert into posts(title,content,cat_id,created,status,feature,user_id) values('${title}','${content}',${category},'${created}','${status}','${feature}',${req.session.uid})`;
        querySql(sql).then(result => {
            let {affectedRows} = result;
            if(affectedRows){
                res.json({code:200,'message':'添加成功'})
            }else{
                res.json({code:-1,'message':'添加失败'})
            }
        } )
    },
    // 上传文件
    "uploadFeature":(req,res)=>{
        if(req.file){
            let {filename,originalname,destination} = req.file;
            // 获取文件的后缀
            var ext = originalname.substring(originalname.indexOf('.'));
            let oldName = `${destination}${filename}`;
            let newName = `${destination}${filename}${ext}`;
            // let fullPath = '';
            fs.rename(oldName,newName,err =>{
                if(err) {throw err};
                res.json({fullPath:newName});
            })
        }
    },
    // 查看用户条数
    "getUserCount":async (req,res)=>{
        let sql = 'select count(1) as count from users ';
        let data = await querySql(sql);
        // console.log(data[0]);
        let pageCount = Math.ceil(data[0].count / pageSize.pageSize);
        res.json({pageCount:pageCount});
    },
    // 获取当前页数据
    "getUserPageData":async (req,res)=>{
        console.log(req.query);
        let {page} = req.query;
        console.log(page);
        let offset = (page -1)* pageSize.pageSize;
        let sql = `select * from users limit ${offset},${pageSize.pageSize}`;
        let rows = await querySql(sql);
        rows.map(v =>{
            if (v.photo != null) {
                v.photo = v.photo.replace('./','/');
            }
            
            v.status = v.status == 'activated' ? '激活':'未激活';

        })
        console.log(rows);
        res.render(rows);
    },
    // 所有用户信息
    "users":async (req,res)=>{
       
        let sql = `select * from users`;
        let rows = await querySql(sql);
        rows.map(v =>{
            if (v.photo != null) {
                v.photo = v.photo.replace('./','/');
            }
            
            v.status = v.status == 'activated' ? '激活':'未激活';

        })
        // console.log(rows);
        res.render('users.html',{
            photo:req.session.photo,
            nickname:req.session.nickname,

            userData:rows,
        });
    },
    // 新增用户
    "addUser":async (req,res)=>{
        let {email,nickname,password} = req.body;
        // 查看email是否存在
        let sql = `select * from users where email='${email}'`;
        let rows = await querySql(sql);
        // console.log(rows[0]);
        if(rows[0] !== undefined){
            res.json({
                code:-1,
                message:'email已存在'
            })
            return;
        }

        let sql2 = `insert into users(email,nickname,password,status) values('${email}','${nickname}','${password}',"activated")`;
    
        let data = await querySql(sql2);
        if(data.affectedRows){
            // 新增成功
            res.json({
                code:200,
                message:'新增用户成功'
            })
        }else{
            // 新增失败
            res.json({
                code:-2,
                message:'服务器忙，请稍后再试'
            })
        }
        
    },
    // 个人中心页面
    "profile":(req,res)=>{
        res.render('profile.html',{
            photo:req.session.photo,
            nickname:req.session.nickname,
            email:req.session.email,
            intro:req.session.intro
        })
    },
    "saveProfile":async (req,res)=>{

        // console.log(req.body);
        let {avatar,nickname,intro} = req.body;
        let sql = `update users set 
        photo = '${avatar}',nickname = '${nickname}',intro='${intro}' where user_id = ${req.session.uid} `;

        let data = await querySql(sql);
        if(data.affectedRows){
            
            req.session.photo = avatar.replace('./','/');
            req.session.nickname = nickname;
            req.session.intro = intro;
           
            res.json({
                code:200,
                message:'更新成功'
            })
        }else{
            res.json({
                code:200,
                message:'服务器忙，请稍后再试'
            })
        }
    },
    // 修改密码主页
    "passwordReset":(req,res)=>{
        res.render('password-reset.html',{
            photo:req.session.photo,
            nickname:req.session.nickname,
        });
    },
    // 修改密码入库
    "editPwd":async (req,res)=>{
        let {oldPwd,newPwd} = req.body;
        let sql = `select * from users where user_id = ${req.session.uid} and password = ${oldPwd} `;
        var data = await querySql(sql);
        if(data[0] != undefined){
            // 密码正确
            let editSql = `update users set password = ${newPwd} where user_id = ${req.session.uid}`;
            let editData = await querySql(editSql);
            if(editData.affectedRows){
                // 密码修改成功
                // 改变session
                req.session.uid = newPwd;
                res.json({
                    code:200,
                    message:'修改成功,请重新登录'
                })
            }else {
                res.json({
                    code:-1,
                    message:'服务器忙线，请稍后再试'
                })
            }
        }else {
            res.json({
                code:-2,
                message:'原密码不正确'
            })
        }
    },
    // 轮播图页面
    "slides":async (req,res)=>{

        let sql = `select * from swipe`;
        
        let rows = await querySql(sql);
        rows.map(v =>{
            if(v.img){
                v.img = v.img.replace('./','/');
            }
        })
        res.render('slides.html',{
            photo:req.session.photo,
            nickname:req.session.nickname,

            data:rows
        });
        
    },
    // 新增轮播图文件
    "addSlides":async (req,res)=>{

        let {img,text,link} = req.body;
        let sql = `insert into swipe(img,text,link) value('${img}','${text}','${link}')`;
        let {affectedRows} = await querySql(sql);
        if(affectedRows){
            res.json({
                code:200,
                message:'轮播图上传成功'
            })
        }else{
            res.json({
                code:-1,
                message:'服务器繁忙，请稍后重试'
            })
        }
    },
    // 删除轮播图
    "delSwipe":async (req,res)=>{
        let {swipeId} = req.query;
        let sqlImg = `select img from swipe where swipe_id = '${swipeId}'` ;
        let rows = await querySql(sqlImg);
        if(rows[0].img){
            var imgPath = rows[0].img.replace('./','/');
            // console.log(imgPath);
        }
        let sql = `DELETE FROM swipe WHERE swipe_id = '${swipeId}'`;
        let {affectedRows} = await querySql(sql);
        if(affectedRows){
            // 删除文件
            fs.unlink(require('path').join(__dirname,imgPath),function(err){
                if(err){{
                    throw err;
                }}
                console.log('删除文件成功');
            })
            res.json({
                code:200,
                message:'删除成功'
            })
        }else {
            res.json({
                code:-1,
                message:'服务器忙，请稍后再试'
            })
        }
        
    },
    // 分类目录
    "categories":(req,res)=>{
        res.render('categories.html',{
            photo:req.session.photo,
            nickname:req.session.nickname,
        })
    },
    // 评论
    "comments":async (req,res)=>{
        // let sql = `select c1.*,c2.title
        // from comments c1 left join posts c2 on c1.post_id = c2.post_id`;
        // let rows = await querySql(sql);
        // // console.log(rows);
        // res.render('comments.html',{
        //     photo:req.session.photo,
        //     nickname:req.session.nickname,

        //     data:rows
        // });
    }
};




// 导航菜单
controller.navMenus = (req,res)=>{
    res.render('nav-menus.html',{
        photo:req.session.photo,
        nickname:req.session.nickname
    })
}




// 获取数据量
function getCount(rows,data){
    let count = 0;
    rows.map((v)=>{
        if(v.status == data){
           count ++;
        }
    });
    return count;
}
// 抽离sql回调地狱
function querySql(sql){
    return new Promise((resolve,reject)=>{
        connection.query(sql,(err,rows,fileds)=>{
            if(err) { throw err; }
            resolve(rows);
        })
    })
}
module.exports = controller;