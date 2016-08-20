import gulp from 'gulp'
import rename from 'gulp-rename'
import replace from 'gulp-replace'

gulp.task('types', () => {
  return gulp
    .src('types/arify.{d.ts,js.flow}')
    .pipe(gulp.dest('dist'))
})

gulp.task('types:ts', () => {
  const opener = new RegExp(`declare module 'arify' {`)
  const closer = /export\s*=\s*arify;[\s\n\r]*}/m
  const fnDecl = /function\s*arify\s*\(/
  const classDecl = /class\s*Arify\s*\{/

  return gulp
    .src('types/arify.d.ts')
    .pipe(replace(opener, ''))
    .pipe(replace(closer, ''))
    .pipe(replace(classDecl, 'declare class Arify {'))
    .pipe(replace(fnDecl, 'export function arify ('))
    .pipe(rename('arify-nonambient.d.ts'))
    .pipe(gulp.dest('dist'))
})

gulp.task('default', ['types', 'types:ts'])
