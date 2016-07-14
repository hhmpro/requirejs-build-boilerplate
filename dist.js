{
    // 程序的根路径
    appDir:'./src',
    // 脚本的根路径
    // 相对于程序的根路径
    baseUrl:'./static/js',////这个目录是相对于appDir的
    // 打包输出到的路径
    dir:'./build',////这个目录是相对于config.js的
    // 需要打包合并的js模块，数组形式，可以有多个
    // name以baseUrl为相对路径，无需写.js后缀
    // 比如main依赖a和b,a又依赖c，则{name:'main'}会把
    // c.js a.js b.js main.js合并成一个main.js
    paths:{
        zepto:'libs/zepto',
        juicer:'libs/juicer',
        util:'common/util'
    },
    shim:{
        zepto:{
            exports:'$'
        },
        juicer:{
            exports:'juicer'
        }
    },
    //optimize: 'none',//生成的脚本是否压缩
    modules:[{
        name:'app/posts/test'
    }],
    // 通过正则以文件名排除文件、文件夹
    // 比如当前的正则表示排除.svn、.git这类的隐藏文件
    fileExclusionRegExp:/^\./
}