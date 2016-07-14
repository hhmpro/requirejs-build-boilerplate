"use-strict";

var gulp    = require('gulp'),
    plugins = require('gulp-load-plugins'),
    rename  = require('gulp-rename'),
    plumber    = require('gulp-plumber'),
    clean      = require('gulp-clean'),
    watch      = require('gulp-watch'),
    sass       = require('gulp-sass'),
    less       = require('gulp-less'),
    uglify     = require('gulp-uglify'), // js压缩
    minifyCss  = require('gulp-minify-css'),
    minifyHtml = require('gulp-minify-html'),
    imagemin   = require('gulp-imagemin'),
    pngquant   = require('imagemin-pngquant'), // 图片压缩插件
    notify     = require('gulp-notify'),
    concat     = require('gulp-concat'),
    shell      = require('gulp-shell'),
    browserSync    = require('browser-sync').create(),
    contentInclude = require('gulp-content-includer'),
    rev            = require('gulp-rev'),
    addsrc         = require('gulp-add-src'),
    revCollector   = require('gulp-rev-collector'),
    requirejsOptimize = require('gulp-requirejs-optimize');

var srcDir  = "src/",
    buildDir= "build/",
    distDir = "dist/",
    revDir  = "rev/";

// Static server
gulp.task('browser-sync', function() {
    var files = [
        distDir + 'static/css/**/*.css',
        distDir + 'static/images/**/*.{png,gif,jpg}',
        distDir + 'static/js/**/*.js',
        distDir + 'views/**/*.html'
    ];
    browserSync.init(files, {
        server: {
            baseDir: distDir
        }
    });
});

// 清空build、dist、rev目录里的内容，除了dist目录里的html文件
gulp.task('clean:build:dist:rev', function() {
    // 不能清空dist目录里的html文件，因为清空后，browser-sync会找不到文件，造成页面不刷新；并且新生成的文件会覆盖原文件
    return gulp.src([buildDir + '**/*.*',distDir + '**/*.*',revDir + '**/*.*','!' + distDir + '**/*.html'], {read: false})
        .pipe(plumber({errorHandler: notify.onError('Error: <%= error.message %>')}))
        .pipe(clean());
});

// 监控src目录下的文件，发生变化时，执行加版本号的构建任务
gulp.task('watch:src:rev',function(){
    gulp.watch('src/**/*.*',['build:proj:rev']);
});

// 监控src目录下的文件，发生变化时，执行不加版本号的构建任务
gulp.task('watch:src',function(){
    gulp.watch('src/**/*.*',['build:proj']);
});

//监听文件变化，并执行加版本号的构建
gulp.task('watch:build:rev', ['clean:build:dist:rev'],function(){
    gulp.start(['browser-sync','watch:src:rev','build:proj:rev']);
});

//监听文件变化，并执行构建
gulp.task('watch:build', ['clean:build:dist:rev'],function(){
    gulp.start(['browser-sync','watch:src','build:proj']);
});

// 使用rjs合并requirejs模块，非压缩版本
gulp.task('build:amdjs',['clean:build:dist:rev'],shell.task([
    './build.sh'
]));

gulp.task('dist:js',['build:amdjs'],function(){
    return gulp.src([buildDir + 'static/js/**/*.js'],{base: buildDir + 'static/js'})
        .pipe(plumber({errorHandler: notify.onError('Error: <%= error.message %>')}))
        .pipe(gulp.dest(distDir + 'static/js/'));
});

// 此任务是把图片从build目录拷贝到dist目录
gulp.task('dist:images',['build:amdjs'], function() {

    gulp.src(buildDir + 'static/images/**/*.{jpg,png,gif}')
        // .pipe(imagemin({
        //     progressive: false,
        //     use: [pngquant]
        // }))
        .pipe(gulp.dest(distDir + 'static/images/'));

});

// 此任务将sass文件编译、合并、压缩后放到dist目录
gulp.task('dist:css',['build:amdjs'], function() {
    return gulp.src([buildDir + 'static/sass/**/*.scss'])
        .pipe(plumber({errorHandler: notify.onError('Error: <%= error.message %>')}))
        .pipe(sass())
        .pipe(concat('test.css'))
        .pipe(minifyCss())
        // .pipe(gulp.dest(distDir + 'static/css/'))
        .pipe(gulp.dest(distDir + 'static/css/'));
});

// 此任务把html文件合并压缩后放到dist目录
gulp.task('dist:html',['build:amdjs'], function() {
    return gulp.src([buildDir + 'views/**/*.html', '!' + buildDir + 'views/common/**/*.html'])
        .pipe(plumber({errorHandler: notify.onError('Error: <%= error.message %>')}))
        .pipe(contentInclude({
            includerReg:/<!\-\-\s+include\s+"([^"]+)"\s+\-\->/g
        }))
        .pipe(minifyHtml())
        .pipe(gulp.dest(distDir + 'views/'));
});

gulp.task('build:proj',['dist:js','dist:images','dist:css','dist:html']);

// 以上是不加版本号相关任务
//---------- rev spliter ----------
// 以下是加版本号相关任务

// gulp.task('clean:build:rev',function(){
//     return gulp.src(buildDir + '**/*.html', {read: false})
//         .pipe(plumber({errorHandler: notify.onError('Error: <%= error.message %>')}))
//         .pipe(clean());

// })

// 使用rjs合并requirejs模块，压缩版本
gulp.task('build:amdjs:uglify',['clean:build:dist:rev'],shell.task([
    './dist.sh'
]));

gulp.task('dist:js:rev',['build:amdjs:uglify'],function(){
    return gulp.src([buildDir + 'static/js/**/*.js'],{base: buildDir + 'static/js'})
        .pipe(plumber({errorHandler: notify.onError('Error: <%= error.message %>')}))
        .pipe(rev())
        .pipe(gulp.dest(distDir + 'static/js/'))
        .pipe(rev.manifest())
        .pipe(gulp.dest(revDir + 'js/'));
});

gulp.task('dist:images:rev',['build:amdjs:uglify'], function() {
    return gulp.src(buildDir + 'static/images/**/*.{jpg,png,gif}')
        .pipe(imagemin({
            progressive: false,
            use: [pngquant]
        }))
        .pipe(rev())
        .pipe(gulp.dest(distDir + 'static/images/'))
        .pipe(rev.manifest())
        .pipe(gulp.dest(revDir + 'images/'));
});

gulp.task('dist:css:rev',['build:amdjs:uglify','dist:images:rev'], function() {
    return gulp.src([buildDir + 'static/sass/**/*.scss'])
        .pipe(plumber({errorHandler: notify.onError('Error: <%= error.message %>')}))
        .pipe(sass())
        .pipe(concat('test.css'))
        .pipe(minifyCss())
        // .pipe(gulp.dest(distDir + 'static/css/'))
        .pipe(addsrc(revDir + '**/*.json'))
        .pipe(revCollector({
            replaceReved:true
        }))
        .pipe(rev())
        .pipe(gulp.dest(distDir + 'static/css/'))
        .pipe(rev.manifest())
        .pipe(gulp.dest(revDir + 'css/'));
});

gulp.task('dist:html:rev',['build:amdjs:uglify','dist:images:rev','dist:css:rev'], function() {
    return gulp.src([buildDir + 'views/**/*.html', '!' + buildDir + 'views/common/**/*.html'])
        .pipe(plumber({errorHandler: notify.onError('Error: <%= error.message %>')}))
        .pipe(contentInclude({
            includerReg:/<!\-\-\s+include\s+"([^"]+)"\s+\-\->/g
        }))
        .pipe(addsrc('rev/**/*.json'))
        .pipe(revCollector({
            replaceReved:true
        }))
        .pipe(minifyHtml())
        .pipe(gulp.dest(distDir + 'views/'));
});

gulp.task('build:proj:rev',['dist:js:rev','dist:images:rev','dist:css:rev','dist:html:rev']);

// 默认任务，用于开发时，自动刷新，无压缩，无版本号，便于调试
gulp.task('default',['watch:build']);


