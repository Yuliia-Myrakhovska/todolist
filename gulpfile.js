const { src, dest, watch, parallel, series } = require("gulp");
const scss = require("gulp-sass")(require("sass"));
const concat = require("gulp-concat");
const uglify = require("gulp-uglify-es").default;
const browserSync = require("browser-sync").create();
const postcss = require("gulp-postcss");
const autoprefixer = require("autoprefixer");
const clean = require("gulp-clean");

const imagemin = require("gulp-imagemin");
const newer = require("gulp-newer");
const svgSprite = require("gulp-svg-sprite");

function img() {
  return src(["src/img/src/*.{jpg,jpeg,png}"])
    .pipe(src(["src/img/src/*.{jpg,jpeg,png}"]))
    .pipe(newer("src/img/dist"))
    .pipe(
      imagemin([
        imagemin.mozjpeg({ quality: 75, progressive: true }),
        imagemin.optipng({ optimizationLevel: 5 }),
      ])
    )
    .pipe(dest("src/img/dist"))

    .pipe(src(["src/img/src/*.svg"]))
    .pipe(newer("src/img/dist"))
    .pipe(
      imagemin([
        imagemin.svgo({
          plugins: [{ removeViewBox: false }, { cleanupIDs: false }],
        }),
      ])
    )
    .pipe(dest("src/img/dist"));
}

function sprite() {
  return src(["srs/img/dist/*.svg"])
    .pipe(
      svgSprite({
        mode: {
          stack: {
            sprite: "../strite.svg",
            example: true,
          },
        },
      })
    )
    .pipe(dest(["srs/img/dist"]));
}

function script() {
  return src("src/js/script.js")
    .pipe(concat("main.min.js"))
    .pipe(uglify())
    .pipe(dest("src/js"))
    .pipe(browserSync.stream());
}

function style() {
  return src("src/scss/style.scss")
    .pipe(scss())
    .pipe(postcss([autoprefixer()]))
    .pipe(concat("style.min.css"))
    .pipe(dest("src/css"))
    .pipe(browserSync.stream());
}

function watching() {
  watch(["src/scss/style.scss"], style);
  watch(["src/js/script.js"], script);
  watch(["src/img"], img);
  watch(["src/*.html"]).on("change", browserSync.reload);
}

function browsersync() {
  browserSync.init({
    server: {
      baseDir: "src/",
    },
  });
}

function cleanDist() {
  return src("public", { allowEmpty: true }).pipe(clean());
}

function build() {
  return src(
    [
      "src/css/style.min.css",
      "src/js/main.min.js",
      "src/img/dist/*.*",
      "src/*.html",
    ],
    {
      base: "src",
    }
  ).pipe(dest("public"));
}

exports.script = script;
exports.style = style;
exports.img = img;
exports.sprite = sprite;
exports.watching = watching;
exports.browsersync = browsersync;

exports.build = series(cleanDist, build);

exports.default = parallel(style, script, img, browsersync, watching);
