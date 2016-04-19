var gulp = require("gulp"),
    browserSync = require('browser-sync');

// Запуск сервера
gulp.task('server', function () {
  browserSync({
    port: 7000,
    server: {
      baseDir: './'
    }
  });
});

// слежка
gulp.task('watch', function () {
  gulp.watch([
    './*.html',
    'js/*.js',
    'css/*.css'
  ]).on('change', browserSync.reload);
});

gulp.task('default', ['server', 'watch']);
