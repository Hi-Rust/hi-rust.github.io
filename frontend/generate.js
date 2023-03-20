const showdown = require("showdown");
const fs = require("fs");
const yaml = require("js-yaml");

const lessonSource = process.argv[2];
const targetDir = process.argv[3];

showdown.extension("rust", function () {
  return [
    {
      type: "lang",
      regex: /%rust%([^]+?)%end%/gi,
      replace: function (s, match) {
        return '<pre><code class="rust">' + match.trim() + "</code></pre>";
      },
    },
  ];
});

showdown.extension("centerImage", function () {
  return [
    {
      type: "lang",
      regex: /%center\s*-\s*([^\s%]+)(?:\s*,\s*([^%\n]+))?\s*%/gi,
      replace: function (s, src, subtitle) {
        var html =
          '<div align="center">' +
          '<p><img src="' +
          src +
          '" alt="NO IMG" style="width: 20%; margin-bottom: 20px; border-radius: 10px;"></p>';
        if (subtitle) {
          html += "<h3>" + subtitle.trim() + "</h3>";
        }
        html += "</div>";
        return html;
      },
    },
  ];
});

/**
 * @param {number} num
 * @returns {string}
 */
function pad(num) {
  const s = `${num}`;
  return s.padStart(2, "0");
}

/**
 * @param {string} lang
 * @param {number} i
 * @param {boolean} isBeta currently unused
 * @param {string} chapter
 * @returns {string}
 */
function getFileName(lang, i, isBeta, chapter) {
  if (i === 0 && lang === "ko") {
    return "index.html";
  }
  // let fileName = `${pad(i)}_${lang}.html`;
  let fileName = `${pad(i)}_${lang}.html`;
  if (chapter !== undefined && chapter !== null) {
    fileName = `chapter_${chapter}_${lang}.html`;
  }
  return fileName;
}

/**
 * @param {string} source
 * @returns {string[]}
 */
const getDirectories = source =>
  fs
    .readdirSync(source, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

/**
 * @param {string} path
 * @returns {any}
 */
const getYaml = path => yaml.load(fs.readFileSync(path));

const languages = getDirectories(lessonSource);
const commonWords = {};
const chapters = [];

languages.forEach(lang => {
  //   const lang = languages[x];
  const langDir = `${lessonSource}/${lang}`;
  commonWords[lang] = getYaml(`${langDir}/common_words.yaml`);
  const languageFiles = fs
    .readdirSync(langDir, { withFileTypes: true })
    .filter(f => f.isFile() && f.name.indexOf("chapter_") === 0)
    .map(f => f.name);
  languageFiles.forEach(l => {
    const chap = parseInt(l.substring(8, l.indexOf(".")), 10);
    if (chapters[chap] === undefined) {
      chapters[chap] = {};
    }
    chapters[chap][lang] = getYaml(`${langDir}/${l}`);
  });
});

const pages = [];

chapters.forEach((c, x) => {
  for (let i = 0; i < c.ko.length; i += 1) {
    const page = {};
    if (i === 0 && x !== 0) {
      page.chapter = x;
    }
    Object.keys(c).forEach(lang => {
      page[lang] = c[lang][i];
    });
    pages.push(page);
  }
});

const lessons = {
  common_words: commonWords,
  pages,
};

const aBinder = [
  {
    type: "output",
    regex: /(<a [^>]*)(>.*<\/a>)/g,
    replace: '$1 target="_blank" rel="noopener"$2',
  },
];

const converter = new showdown.Converter({
  extensions: [...aBinder, "rust", "centerImage"],
});

converter.setOption("parseImgDimensions", true);
converter.setOption("simpleLineBreaks", true);

/**
 * @param {string[]} words
 * @param {string} lang
 * @param {string} w
 * @returns {string}
 */
function getWord(words, lang, w) {
  if (words[lang][w]) {
    return words[lang][w];
  }
  return words.ko[w];
}

/**
 *
 * @param {string[]} words
 * @param {string} lang
 * @returns {string}
 */
const getHead = (words, lang) => `<!DOCTYPE html>
    <html lang="${lang}">
    <head>
        <title>Rust 튜토리얼 - 자기주도프로젝트</title>

        <meta charset="UTF-8">
        <meta content="text/html;charset=utf-8" http-equiv="Content-Type">
        <meta content="utf-8" http-equiv="encoding">
        <meta name="viewport" content="user-scalable=no, width=device-width, initial-scale=1, maximum-scale=1"
        <meta name="keywords" content="Rust, Programming, Learning">
        <meta name="description" content="Rust tutorial website based on tour_of_rust">
        <meta name="theme-color" content="#ff6801"/>
        <meta http-equiv="Cache-Control" content="max-age=3600">
        
        <link rel="stylesheet" href="tour.css">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/styles/night-owl.min.css">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.13.1/css/all.min.css">
        
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
        <link rel="/manifest" href="./site.webmanifest">
        
        <script src="//unpkg.com/@highlightjs/cdn-assets@11.7.0/highlight.min.js"></script>

        <script src="./tour.js" defer></script>
        <!-- <script>hljs.highlightAll();</script> -->
        <script src="./highlight.badge.min.js"></script>
    </head>`;

/**
 * @param {Array} lessons
 * @param {string} lang
 * @param {string} title
 * @param {string} code
 * @param {string} content
 * @param {number} index
 * @param {boolean} isLast
 * @param {string[]} words
 * @param {boolean} isBeta
 * @returns
 */
function template(
  lessonsData,
  lang,
  title,
  code,
  content,
  source,
  index,
  isLast,
  words,
  isBeta
) {
  return `${getHead(words, lang)}
    <body>
        <div class="tour">
            <div class="header">
                <span class="title"><a href="${getFileName(
                  lang,
                  0,
                  isBeta,
                  lessonsData[0]?.chapter
                )}">${getWord(words, lang, "tor")}</a></span>
                <span class="nav">
                <span class="toc"><a href="TOC_${lang}.html">${getWord(
    words,
    lang,
    "toc"
  )}</a></span>
            </div>
            <div class="page">
            <h1>${title}</h1>
            ${content}
            <div class="bottomnav">
                ${
                  index !== 0
                    ? `<span class="back"><a href="${
                        isBeta ? "beta_" : ""
                      }${getFileName(
                        lang,
                        index - 1,
                        isBeta,
                        lessonsData[index - 1]?.chapter
                      )}" rel="prev">❮ ${getWord(
                        words,
                        lang,
                        "previous"
                      )}</a></span>`
                    : ""
                }
                ${
                  isLast
                    ? ""
                    : `<span class="next"><a href="${
                        isBeta ? "beta_" : ""
                      }${getFileName(
                        lang,
                        index + 1,
                        isBeta,
                        lessonsData[index + 1]?.chapter
                      )}" rel="next">${getWord(
                        words,
                        lang,
                        "next"
                      )} ❯</a></span>`
                }
            </div>
            </div>
            ${
              code
                ? `<div class="code">
            <iframe id="rust-playground" width="100%" src="${code}" scrolling="no" frameborder="no" allowtransparency="true" allowfullscreen="true" sandbox="allow-forms allow-pointer-lock allow-popups allow-same-origin allow-scripts allow-modals" title="Rust Playground" loading="lazy"></iframe>
            </div>`
                : `<div class="code"><center><img src="${source}" alt="Rust Tutorial" width="300" height="100%"></center></div>`
            }
        </div>
        <!-- <script>
          document.addEventListener("DOMContentLoaded", function() {
            // Select the widget's text element using its XPath
            const xpath = '/html/body/main/div/div/div[1]/div[1]/div/button[1]/div';
            const widgetText = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

            // Change the text content of the element
            widgetText.textContent = "New Text";
          });
        </script> -->

        <script>
        var pres = document.querySelectorAll("pre>code");
        for (var i = 0; i < pres.length; i++) {
            hljs.highlightElement(pres[i]);
        }
        var options = {
            loadDelay: 0,
            copyIconClass: "far fa-clipboard",
            checkIconClass: "fa fa-check text-success",
            blogURL: "http://rust-study.ajousw.kr/"
        };
        window.highlightJsBadge(options);
        </script>

        <footer>
          <p>아주대학교 Software Tool Time - Rust 튜토리얼 (Basic)</p>
        </footer>
    </body>
</html>`;
}

languages.forEach(lang => {
  let c = 0;
  const words = lessons.common_words;
  const langLessons = lessons.pages.filter(x => {
    return true;
  });

  langLessons.forEach((lesson, i) => {
    let fileName = getFileName(lang, i, false, lesson?.chapter);
    if (i === 0 && lang === "ko") {
      fileName = "index.html";
    }

    let lessonTitle = `[${getWord(words, lang, "untranslated")}] ${
      lesson.ko.title
    }`;
    let lessonContent = converter.makeHtml(lesson.ko.content_markdown);
    let lessonImage = lesson.ko.source;
    let lessonCode = lesson.ko.code;
    if (lesson[lang]) {
      let targetLang = lang;
      if (lesson[lang].clone) {
        targetLang = lesson[lang].clone;
      }
      lessonTitle = lesson[targetLang].title;

      let content = lesson[targetLang].content_html;
      if (!content) {
        content = converter.makeHtml(lesson[targetLang].content_markdown);
      }
      lessonContent = content;
      lessonCode = lesson[targetLang].code || lesson.ko.code;

      if (lesson[lang].clone) {
        if (lesson[lang].code) {
          lessonCode = lesson[lang].code;
        }
      }
    }

    fs.writeFileSync(
      `${targetDir}/${fileName}`,
      template(
        langLessons,
        lang,
        lessonTitle,
        lessonCode,
        lessonContent,
        lessonImage,
        c,
        i === langLessons.length - 1,
        words,
        false
      )
    );
    c += 1;
  });

  const fileName = `TOC_${lang}.html`;
  fs.writeFileSync(
    `${targetDir}/${fileName}`,
    `${getHead(words, lang)}
    <body>
        <div class="tour">
            <div class="header">
                <span class="title"><a href="${getFileName(lang, 0)}">${getWord(
      words,
      lang,
      "tor"
    )}</a></span>
                <span class="nav">
                </span>
            </div>
            <div>
            <h1>${getWord(words, lang, "lessons")}</h1>
            <ul>
        ${langLessons
          .map((x, i) => {
            let targetLang = lang;
            if (x[lang] && x[lang].clone) {
              targetLang = x[lang].clone;
            }
            let s = `<li><a href="${getFileName(lang, i, false, x.chapter)}">${
              x[targetLang]
                ? x[targetLang].title
                : `[${getWord(words, targetLang, "untranslated")}] ${
                    x.ko.title
                  }`
            }</a></li>`;
            if (x.chapter !== undefined) {
              s = `</ul><h3><a href="${getFileName(
                lang,
                i,
                false,
                x.chapter
              )}">${
                x[targetLang]
                  ? x[targetLang].title
                  : `[${getWord(words, targetLang, "untranslated")}] ${
                      x.ko.title
                    }`
              }</a></h3><ul>`;
            }
            return s;
          })
          .join("\n")}
            </ul>
            </div>
            <div style="display: flex;flex-direction: column;justify-content: center;align-items: center;">
              <img style="display: block; margin: 0 auto;" src="/ajou.webp"></img><br/>
              <p>이 컨텐츠는 2022년 과학기술정보통신부 및 정보통신기획평가원의 SW중심대학사업의 연구결과로 제작되었습니다.<br/>(2022-0-01077)</p>
            </div>
        </div>
    </body>
    </html>`
  );
});
