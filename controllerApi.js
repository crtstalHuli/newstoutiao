let moment = require('moment');
// 连接数据库
let query = require("./model.js");
const { get } = require('./routerApi.js');

let controller = {
    // 获取分类数据
    "getCategory":async (req,res)=>{
        let sql = `select * from category where cat_id >1`;
        let data = await query(sql);
        res.json(data);
    },
    // 首页最新发布
    "getArticles":async (req,res)=>{
        let sql = `SELECT t1.*, t2.cat_name,t3.nickname FROM posts t1
            LEFT JOIN category t2 ON t1.cat_id = t2.cat_id
            left join users t3 on t1.user_id = t3.user_id
            order by t1.post_id desc
            LIMIT 0,5`;
        let data = await query(sql);
        // 修改图片路径
        data.map(v =>{
            if(v.feature.indexOf('http') == -1){
                v.feature = "http://127.0.0.1:8000" + v.feature.replace('./','/');
            } 
        })
        // 添加评论字段
        for(let i = 0;i<data.length;i++){
            let sql = `select count(1) as count from comments where post_id =${data[i].post_id} `;
            let rows =await query(sql);
            
            data[i].comments = rows[0].count;
        }
        res.json(data);
       
    },
    // 分类文章列表
    "getCatArticle":async (req,res)=>{
        let {cat_id,page,pageSize} = req.query;
        let offset = (page-1)*pageSize;
  
        let sql = `select p1.*,p2.cat_name,p3.nickname
            from posts p1 left join category p2 on p1.cat_id = p2.cat_id
            left join users p3 on p1.user_id = p3.user_id
            where p1.cat_id = ${cat_id}
            order by p1.post_id desc
            limit ${offset},${pageSize} `;
        let rows = await query(sql);   
        // 对照片路径进行处理
        rows.map(v=>{
            if(v.feature.indexOf('http') == -1){
                v.feature = "http://127.0.0.1:8000"+v.feature.replace('./','/');
            }
        })
        // 获取并添加评论字段
        for (let i = 0; i < rows.length; i++) {
            let sql = `select count(1) as count from comments where post_id = ${rows[i].post_id}`;
            let data = await query(sql);
            rows[i].comments = data[0].count 
        }
        // 获取当前分类名字
        // let sql2 = `select cat_name from category where cat_id = ${cat_id}`;
        // let catNameRows = await query(sql2);
        let catNameRows = rows[0].cat_name;

        res.json({rows,catNameRows});
    },
    // 文章详情
    "getArticle":async (req,res)=>{
        let {post_id} = req.query;
        console.log(post_id);
        let sql = `select p1.*,p2.cat_name,p3.nickname
            from posts p1 left join category p2 on p1.cat_id = p2.cat_id
            left join users p3 on p1.user_id = p3.user_id
            where p1.post_id = ${post_id}`;
        let rows = await query(sql);
        if(rows){
            let commentsSql = `select count(1) as count from comments where post_id = ${post_id}`;
            let commentsData = await query(commentsSql);
            rows[0].comments = commentsData[0].count;
        }
        
        // console.log(rows[0]);
        res.json(rows[0]);        
    },
    // 获取轮播图数据
    "getSwipe":async (req,res)=>{
        let sql = `select * from swipe`;
        let rows = await query(sql);
        rows.map(v=>{
            if(v.img){
                v.img = "http://127.0.0.1:8000" + v.img.replace('./','/');
            }
        })
        res.json(rows);
    },
    // 点赞
    "updLikes":async (req,res)=>{
        let {post_id} = req.params;
        // 先查后改
        let sql = `select likes from posts where post_id = ${post_id}`;
        let rows = await query(sql);
        let oldlikes = rows[0].likes;
        let newlikes = oldlikes+1;
        // 修改点赞数
        let updSql = `update posts set likes = ${newlikes} where post_id = ${post_id}`;
        let {affectedRows} = await query(updSql);
        if(affectedRows){
            res.json({
                code:200,
                message:'点赞成功',
                likes:newlikes
            })
        }else{
            res.json({
                code:-1,
                message:'服务器繁忙，请稍后重试',
                likes:oldlikes
            })
        }

    }
}


module.exports = controller;