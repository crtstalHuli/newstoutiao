let express = require('express')

// 得到控制器的模块文件
let controllor = require('./controllerApi.js');


let router = express.Router();

// api接口

// 获取分类数据
router.get('/getCategory',controllor.getCategory);
// 获取最新发布的文章数据
router.get('/getArticles',controllor.getArticles);
// 文章列表分页
router.get('/getCatArticle',controllor.getCatArticle);
// 文章详情
router.get('/getArticle',controllor.getArticle);
// 获取轮播图数据
router.get('/getSwipe',controllor.getSwipe);
// 点赞
router.post('/updLikes/:post_id',controllor.updLikes);



module.exports = router;