var http = require('http')
var fs = require('fs')
var querystring = require('querystring');
var { execSync } = require("child_process");

function templateReplace(template, data) {
  const pattern = /{{\s*(\w+?)\s*}}/g;
  return template.replace(pattern, (_, token) => data[token] || '');
}

const cropper = `
const cropper = () => {
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  const image = new Image();

  image.onload = () => {
    canvas.width = image.width;
    canvas.height = image.height;
    ctx.drawImage(image, 0, 0, image.width, image.height);
  };

  image.src = "{{imageData}}";
};

cropper();
`;

const consonants = ["က", "ခ", "ဂ", "ဃ", "င",
                    "စ", "ဆ", "ၡ", "ည", "တ",
                    "ထ", "ဒ", "န", "ပ", "ဖ",
                    "ဘ", "မ", "ယ", "ရ", "လ",
                    "ဝ", "သ", "ဟ", "အ", "ဧ"];

const clusters = ["\u103e", "\u1060", '\u103c', '\u103b', '\u103d'];

const vowels = ['\u102B', '\u1036', '\u1062',
                '\u102f', '\u1030', '\u1037',
                '\u1032', '\u102d', '\u102e'];

const tones = ['\u1062\u103a', '\u102c\u103a',
               '\u1038', '\u1063\u103a', '\u1064'];

const numbers = ['\u1040', '\u1041', '\u1042',
                 '\u1043', '\u1044', '\u1045',
                 '\u1046', '\u1047', '\u1048', '\u1049'];

const htmlPage = `<!DOCTYPE html>
<html>
  <head>
    <title>Prep Ground Truth Data</title>
    <meta charset="UTF-8" />
    <style>

    @font-face {
			font-family: 'Padauk';
      src: local("Padauk Book");
		}

    button[name="character-button"] {
      font-family: 'Padauk';
      font-language-override: "ksw";
    }

    input#characters {
      font-family: 'Padauk';
      font-language-override: "ksw";
    }

    </style>
  </head>
  <body>
    <div>
      <h2>{{imgId}}</h2>
      <canvas id="canvas" style="border:1px solid;"></canvas>
        <div style="margin-top:10px;">
          <div style="margin-top:10px;">
            ${[...consonants, ...clusters, ...vowels, ...tones, ...numbers].map(c =>
              `<button name="character-button" data-char="${c}" style="font-size:20px;width:40px;">${c}</button>`
              ).join('')}
          </div>
          <form method="POST">
            <input type="hidden" name="img_id" value="{{imgId}}" />
            <input type="text" autocomplete="off" id="characters" name="characters" style="font-size:20px;min-width:500px;padding:10px" />
            <div style="margin-top:10px;">
              <button type="submit" style="padding:10px">Submit</button>
            </div>
          </form>
      </div>
    </div>
    <script>
      ${cropper}


      const keys = document.querySelectorAll("button[name=character-button]");

      for (let i = 0; i < keys.length; i++) {
        keys[i].addEventListener("click", function(e) {
          let currentVal = document.getElementById('characters').value;
          document.getElementById('characters').value = currentVal + e.target.dataset.char;
        });
      }

    </script>
  </body>
</html>`;

const htmlEmptyPage = `<!DOCTYPE html>
<html>
  <head>
    <title>Prep Ground Truth Data</title>
    <meta charset="UTF-8" />
  </head>
  <body>
    <div>
      <p>No more images to process.</p>
    </div>
  </body>
</html>`;

const sourcePath = './output';
const targetPath = './ground-truth'

http.createServer(function(req, res) {
  if (req.url === "/font/Padauk-Regular.ttf") {
    // TODO: make this work
    res.writeHead(200, {'Content-Type': 'application/font-ttf'});
    return res.end('');
  }

  if (req.method == "POST") {
    const chunks = [];

    req.on('data', chunk => {
      chunks.push(chunk);
    });

    req.on('end', () => {
      const data = querystring.decode(Buffer.concat(chunks).toString());
      const [newName] = data.img_id.split(".png")

      console.log(`convert ${sourcePath}/${data.img_id} ${targetPath}/${newName}.tiff`);

      execSync(`convert ${sourcePath}/${data.img_id} ${targetPath}/${newName}.tiff`);
      fs.writeFileSync(`${targetPath}/${newName}.gt.txt`, data.characters, 'utf8');
      fs.unlinkSync(`${sourcePath}/${data.img_id}`);

    });

    res.writeHead(301, {"Location": "/"});
    return res.end();

  } else {
    const nextFileName =
      fs.readdirSync(sourcePath, {withFileTypes: true})
      .filter(file => file.isFile() && file.name.endsWith(".png"))
      .map(file => file.name)[0];

    if (nextFileName) {
      fs.readFile(`${sourcePath}/${nextFileName}`, {encoding: 'base64'}, function(err, data) {
        if (err) throw err;

        const imageData = `data:image/png;base64,${data}`;

        res.writeHead(200, {'Content-Type': 'text/html'});
        res.write(templateReplace(htmlPage, {imgId: nextFileName, imageData}));
        res.end('');
      });
    } else {
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.write(htmlEmptyPage);
      res.end('');
    }
  }
}).listen(3000);

console.log('Server running at http://localhost:3000/');
