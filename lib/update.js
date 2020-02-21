const utils = require("./_utils");
const fs = require("fs");
const inquirer = require("inquirer");
const chalk = require("chalk");
const boxen = require("boxen");

async function init() {
  if (!/update/.test(process.argv)) return null;
  console.log(`${utils.helpPrompt}`);
  const extVersion = utils.getExtVersion();
  const extName = utils.getExtName();
  console.log("");
  console.log(
    `${utils.cepBlock}  ${chalk.blue(extName)} is currently ${chalk.green(
      `v${extVersion}`
    )}`
  );
  console.log("");
  let answer = await inquirer.prompt([
    {
      type: "confirm",
      name: "shouldUpdate",
      message: `Update version?`,
      default: true
    }
  ]);
  if (answer.shouldUpdate) {
    let answerver = await findTier(extVersion.split("."));
    let ans = await promptNewNumber(
      extVersion.split(".")[answerver.versionIndex]
    );
    let newVersion = extVersion.split(".");
    newVersion[answerver.versionIndex] = ans.newTier;
    let updated = setExtVersion(extVersion, newVersion);

    utils.boxLog(`✔ ${extName} updated to v${updated}`);
  } else {
    console.log("");
    console.log(`   All right! No changes will be made.`);
    // endMessage();
  }
  return "";
};

init()

async function findTier(original) {
  return await inquirer.prompt([
    {
      type: "list",
      name: "versionIndex",
      message: "Choose tier to update",
      choices: [
        {
          name: `Major (${original[0]}.x.x)`,
          value: 0
        },
        {
          name: `Minor (x.${original[1]}.x)`,
          value: 1
        },
        {
          name: `Micro (x.x.${original[2]})`,
          value: 2
        }
      ]
    }
  ]);
}

async function promptNewNumber(old) {
  return await inquirer.prompt([
    {
      type: "Number",
      message: "Enter new value for tier",
      default: +old + 1,
      name: "newTier"
    }
  ]);
}

function setExtVersion(older, newer) {
  let xml = fs.readFileSync(`./CSXS/manifest.xml`, { encoding: "utf-8" });
  let rx = new RegExp(`${older.split(".").join("\\.")}`);
  xml = xml.split(rx).join(newer.join("."));
  fs.writeFileSync(`./CSXS/manifest.xml`, xml);

  let jsondata = fs.readFileSync("./package.json", { encoding: "utf-8" });
  let jsonrx = /\"version\"\:\s\"[^\"]*/;
  jsondata = jsondata.split(jsonrx).join(`\"version\"\: \"${newer.join(".")}`);
  fs.writeFileSync(`./package.json`, jsondata);

  return newer.join(".");
}
