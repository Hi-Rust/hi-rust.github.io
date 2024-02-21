const showdown = require("showdown");
const fs = require("fs");
const yaml = require("js-yaml");

const lessonSource = process.argv[2];
const targetDir = process.argv[3];

const rustExtension = {
  type: "lang",
  regex: /%rust%([^]+?)%end%/gi,
  replace: (s, match) =>
    `<pre><code class="rust">${match
      .trim()
      .split("{{")
      .join("&lt;&lt;")
      .split("}}")
      .join("&gt;&gt;")
      .split("<")
      .join("&lt;")
      .split(">")
      .join("&gt;")}</code></pre>`,
};

const langExtension = {
  type: "lang",
  regex: /```(\w+)\s*([^]+?)```/gi,
  replace: (s, lang, content) =>
    `<pre><code class="${lang.trim()}">${content
      .trim()
      .replace("<", "&lt;")}</code></pre>`,
};

const centerImageExtension = {
  type: "lang",
  regex: /%center\s*-\s*([^\s%]+)(?:\s*,\s*([^%\n]+))?\s*%/gi,
  replace: (s, src, subtitle) => {
    const baseHtml = `<div align="center"><p><img src="${src}" alt="NO IMG" style="width: 20%; margin-bottom: 20px; border-radius: 10px;"></p>`;
    return subtitle
      ? baseHtml + `<h3>${subtitle.trim()}</h3></div>`
      : baseHtml + "</div>";
  },
};

const pad = num => String(num).padStart(2, "0");
const getWord = (words, lang, w) => words[lang][w] || words.ko[w];

const getFileName = (lang, i, chapter) =>
  i === 0 && lang === "ko"
    ? "index.html"
    : chapter
    ? `chapter_${chapter}_${lang}.html`
    : `${pad(i)}_${lang}.html`;

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
  const langDir = `${lessonSource}/${lang}`;
  commonWords[lang] = getYaml(`${langDir}/common_words.yaml`);

  fs.readdirSync(langDir, { withFileTypes: true })
    .filter(f => f.isFile() && f.name.startsWith("chapter_"))
    .forEach(f => {
      const chap = parseInt(f.name.substring(8, f.name.indexOf(".")), 10);
      chapters[chap] = chapters[chap] || {};
      chapters[chap][lang] = getYaml(`${langDir}/${f.name}`);
    });
});

const pages = [];

chapters.forEach((c, x) => {
  c.ko.forEach((_, i) => {
    const page = {};
    if (i === 0 && x !== 0) {
      page.chapter = x;
    }
    Object.entries(c).forEach(([lang, content]) => {
      page[lang] = content[i];
    });
    pages.push(page);
  });
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
  extensions: [...aBinder, rustExtension, centerImageExtension, langExtension],
});
converter.setOption("parseImgDimensions", true);
converter.setOption("simpleLineBreaks", true);

/**
 *
 * @param {string[]} words
 * @param {string} lang
 * @returns {string}
 */
const getHead = (words, lang) => `<!DOCTYPE html>
    <html lang="${lang}">
    <head>
        <title>Rust 튜토리얼 (기초)</title>

        <meta charset="UTF-8">
        <meta content="text/html;charset=utf-8" http-equiv="Content-Type">
        <meta content="utf-8" http-equiv="encoding">
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=2">
        <meta name="keywords" content="Rust, Programming, Learning">
        <meta name="description" content="Rust tutorial website based on tour_of_rust by 최석원">
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
  words
) {
  return `${getHead(words, lang)}
    <body>
        <div class="tour">
            <div class="header">
                <span class="title"><a href="${getFileName(
                  lang,
                  0,
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
                    ? `<span class="back"><a href="${getFileName(
                        lang,
                        index - 1,
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
                    : `<span class="next"><a href="${getFileName(
                        lang,
                        index + 1,
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
                : `<div class="code"><center><img src="${source}" alt="Rust Tutorial" width="80%" height="100%"></center></div>`
            }
        </div>
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
          <p><a target="_blank" rel="noopener" href="https://www.youtube.com/c/SoftwareToolTime">아주대학교 Software Tool Time</a> - Rust 튜토리얼 (Basic)</p>
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
    let fileName = getFileName(lang, i, lesson?.chapter);
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
            let s = `<li><a href="${getFileName(lang, i, x.chapter)}">${
              x[targetLang]
                ? x[targetLang].title
                : `[${getWord(words, targetLang, "untranslated")}] ${
                    x.ko.title
                  }`
            }</a></li>`;
            if (x.chapter !== undefined) {
              s = `</ul><h3><a href="${getFileName(lang, i, x.chapter)}">${
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
