const fs = require("fs-extra");
const wget = require("node-wget");

const prepareAssets = async function(options, callback) {
  const assetsDirectory =
    process.env.ASSETS_DIRECTORY || __dirname + "/assets/";

  var content = fs.readFileSync(".glitch-assets", "utf8");
  var rows = content.split("\n");
  var assets = rows.map(row => {
    try {
      return JSON.parse(row);
    } catch (e) {}
  });
  // ignore eof (undefined)
  assets = assets.filter(asset => asset);

  // ignore deleted files
  assets = assets.filter(asset => {
    if (asset.deleted) {
      return false;
    } else {
      return assets.slice(0).reduce((result, target, i, arr) => {
        if (target.deleted && asset.uuid == target.uuid) {
          arr.splice(1);
          return false;
        } else {
          return result;
        }
      }, true);
    }
  });

  // Assets Directory を、いったん削除し、再度作成
  fs.removeSync(assetsDirectory);
  if (!fs.existsSync(assetsDirectory)) {
    fs.mkdirSync(assetsDirectory);
  }

  async function wgetAssets(assets) {
    var a = assets.map(
      asset =>
        new Promise((resolve, reject) => {
          wget(
            {
              url: asset.url,
              dest: assetsDirectory + asset.name
            },
            (err, result) => {
              if (err) reject(err);
              else resolve(result);
            }
          );
        })
    );
    return Promise.all(a);
  }

  if (typeof callback === "function") {
    wgetAssets(assets)
      .then(result => {
        console.log(result);
        callback(null, result);
      })
      .catch(err => {
        callback(err);
      });
  } else {
    return await wgetAssets(assets);
  }
};

module.exports = prepareAssets;
