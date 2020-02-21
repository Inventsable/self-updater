const utils = require("./_utils");
const fs = require("fs");
const shell = require("shelljs");
const chalk = require("chalk");
const inquirer = require("inquirer");

// module.exports = async function() {
  console.log(`${utils.helpPrompt}`);
  console.log(``);
  let user = shell.exec("git config user.name", { silent: true }).stdout;
  user = user.replace(" ", "-").trim();
  let certInfo;
  if (fs.existsSync(`./.certinfo`)) {
    certInfo = fs.readFileSync(`./.certinfo`, {
      encoding: "utf-8"
    });
    console.log(
      `${utils.cepBlock}  Current string for certs is ${chalk.green(
        certInfo.split(";").join(" ")
      )}`
    );
    console.log("");
  } else {
    certInfo = "US;NY;SomeOrg";
    console.log(
      `${chalk.red(
        "✘ "
      )} No user data was found! It will default to ${chalk.green(
        certInfo.split(";").join(" ")
      )}`
    );
  }
  certInfo = certInfo.split(";");
  if (certInfo.length < 4) certInfo = [].concat(certInfo, [user]);
  let answer = await promptRegister(certInfo);
  let fulldetails = [answer.country, answer.state, answer.org, answer.name];
  let finaldetails = fulldetails.map(ans => {
    return /\s/.test(ans) ? ans.split(" ").join("-") : ans;
  });
  fs.writeFileSync(`./.certinfo`, finaldetails.join(";"));
  console.log("");
  console.log(
    `   ${chalk.green("✔ ")} Config has been saved to ${chalk.green(
      "./.certinfo"
    )}`
  );
  console.log(
    `   Self-signed certificates via ${chalk.yellow(
      "npm run sign"
    )} will use this data!`
  );
  console.log("");
// };

async function promptRegister(data) {
  return await inquirer.prompt([
    {
      type: "input",
      name: "country",
      message: "Country Code",
      default: data[0]
    },
    {
      type: "input",
      name: "state",
      message: "State or Province",
      default: data[1]
    },
    {
      type: "input",
      name: "org",
      message: "Organization",
      default: data[2]
    },
    {
      type: "input",
      name: "name",
      message: "Common name",
      default: data[3]
    }
  ]);
}
