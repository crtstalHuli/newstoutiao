let express = require('express');



// 得到控制器的模块文件1
let controller = require('./controller.js');
// 指定上传文件的目录
let multer =  require('multer');
let upload = multer({
    dest:'./public/uploads/'
})

// 得到路由对象
let router = express.Router();

// 首页
router.get('/',controller.index);
// 登录页面
router.get('/login',controller.login);
// 验证登录
router.post('/login',controller.insert);
// 退出
router.get('/logout',controller.logout);
// 所有文章
router.get('/posts',controller.posts);
// 获取总页数和每页的数量
router.get('/pageCount',controller.pageCount);
// 获取当前页数的文章数据
router.get('/getPageData',controller.getPageData);
// 删除文章
router.post('/delPost',controller.delPost);
// 写文章
router.get('/post_add',controller.postAdd);
// 保存文章数据入库
router.post('/savePost',controller.savePost);
// ajax上传文章
router.post('/uploadFeature',upload.single('feature'),controller.uploadFeature);
// 编辑文章
router.get('/editPost/:post_id',controller.editPost);
// 保存编辑文章数据入库
router.post('/updPost',controller.updPost);
// 分享目录
router.get('/categories',controller.categories);
// 评论
router.get('/comments',controller.comments);
// 获取用户分页
router.get('/getUserCount',controller.getUserCount);
// 获取当前页用户数据
router.get('/getUserPageData',controller.getUserPageData);
// 用户列表
router.get('/users',controller.users);
// 新增用户
router.post('/addUser',controller.addUser);

// 导航菜单
router.get('/nav_menus',controller.navMenus);
// 图片轮播页面
router.get('/slides',controller.slides);
// 新增轮播图文件
router.post('/slides',controller.addSlides);
// 删除轮播图
router.get('/delSwipe',controller.delSwipe);
// 个人中心页面
router.get('/profile',controller.profile);
// 修改用户信息入库
router.post('/saveProfile',controller.saveProfile);
// 修改密码主页
router.get('/passwordReset',controller.passwordReset);
// 修改密码入库
router.post('/passwordReset',controller.editPwd);

   

module.exports = router;