var node_ssh,ssh,site_dir,static_dir,filename
node_ssh = require('node-ssh');
ssh = new node_ssh();
site_dir = '/www/wwwroot/newtoutiao';
static_dir = '../toutiao'

// 连接
ssh.connect({
    host:'192.168.5.77',
    username:'root',
    privateKey:'C:\\Users\\huli\\.ssh\\id_rsa'
}).then(function(){
    console.log('ssh连接成功');
    uploadDist();
})

// 上传静态资源
function uploadDist(){
    console.log('静态资源上传中...');
    // 上传目录
    ssh.putDirectory(static_dir,site_dir).then(function(){
        console.log('上传成功');
        process.exit();
    },function(error){
        console.log('错误信息'+error.message);
    });
}