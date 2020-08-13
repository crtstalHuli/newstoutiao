let express = require('express');
let app = express();
let port = 8000;
let express_session = require('express-session');

let expressTemplate = require('express-art-template');
let artTemplate = require('art-template');
let cors = require('cors');

// 引入路由模板
let router = require('./router.js');
let routerApi = require('./routerApi.js');

// 托管静态资源
app.use('/public',express.static(__dirname+'/public'));

// 设置内置中间件，接受json或者post参数
app.use(express.json());
app.use(express.urlencoded({extended:true}));

// 使用session中间件
// 通过app.use中间件设置session的参数
app.use(express_session({
    name:'SESSIONID',  // session会话名称在cookie中的值
    secret:'%#%￥#……%￥', // 必填项，用户session会话加密（防止用户篡改cookie）
    cookie:{  //设置session在cookie中的其他选项配置
      path:'/',
      secure:false,  //默认为false, true 只针对于域名https协议
      maxAge:60000*24,  //设置有效期为24分钟，说明：24分钟内，不访问就会过期，如果24分钟内访问了。则有效期重新初始化为24分钟。
    }
}));

// 允许跨域
app.use(cors());

app.use('/api',routerApi);

// 设置中间件，判断用户是否有session信息
app.use(function(req,res,next){

  let noCheckSession = ['/login','/logout'];
  let path = req.path.toLowerCase();
  if(noCheckSession.includes(path)){
    next();
  }else {
    if(req.session.uid){
      next();
    }else{
      // 打回登录页码
      res.redirect('/login');
    }
  }
})


// 配置模板引擎为art-template
// 配置模板的路径
app.set('views', __dirname + '/views/');
// 设置express_template模板后缀为.html的文件
app.engine('html', expressTemplate); 
// 设置视图引擎为上面的html
app.set('view engine', 'html');


// 把路由对象注册成路由中间件
app.use(router);


app.listen(port,()=> console.log('server is running and port is '+port));