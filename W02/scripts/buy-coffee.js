// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

// Returns the Ether balance of a given address.
async function getBalance(address) {
  const balanceBigInt = await hre.ethers.provider.getBalance(address);
  return hre.ethers.utils.formatEther(balanceBigInt);
}

// Logs the Ether balances for a list of addresses.
async function printBalances(addresses) {
  let idx = 0;
  for (const address of addresses) {
    console.log(`Address ${address.name} "${address.address}" balance: `, await getBalance(address.address));
    idx ++;
  }
}

// Logs the memos stored on-chain from coffee purchases.
async function printMemos(memos) {
  for (const memo of memos) {
    const timestamp = memo.timestamp;
    const tipper = memo.name;
    const tipperAddress = memo.from;
    const message = memo.message;
    const coffee = memo.isLargeCoffee ? 'large' : 'small';
    console.log(`At ${timestamp}, ${tipper} (${tipperAddress}) bought a ${coffee} coffee and said: "${message}"`);
  }
}

async function main() {
  // Get the example accounts we'll be working with.
  const [owner, tipper, tipper2, tipper3] = await hre.ethers.getSigners();

  // We get the contract to deploy.
  const BuyMeACoffee = await hre.ethers.getContractFactory("BuyMeACoffee");
  const buyMeACoffee = await BuyMeACoffee.deploy();

  // Deploy the contract.
  await buyMeACoffee.deployed();
  console.log("BuyMeACoffee address:", buyMeACoffee.address);

  // Check balances before the coffee purchase.
  const addresses = [
    {name: "owner", address: owner.address}, 
    {name: "tipper 1", address: tipper.address}, 
    {name: "tipper 2", address: tipper2.address},
    {name: "tipper 3", address: tipper3.address},
    {name: "contract", address: buyMeACoffee.address}
  ];
  console.log("== check balances ==");
  await printBalances(addresses);

  // Buy the owner a few coffees.
  console.log("== buy coffee ==");
  const normalCoffeeTip = {value: hre.ethers.utils.parseEther("0.001")};
  const largeCoffeeTip = {value: hre.ethers.utils.parseEther("0.003")};
  await buyMeACoffee.connect(tipper).buyCoffee("Carolina", "You're the best!", normalCoffeeTip);
  await buyMeACoffee.connect(tipper2).buyCoffee("Vitto", "Amazing teacher", largeCoffeeTip);
  await buyMeACoffee.connect(tipper3).buyCoffee("Kay", "I love my Proof of Knowledge", normalCoffeeTip);

  // Check balances after the coffee purchase.
  console.log("== coffee bought ==");
  await printBalances(addresses);

  //update withdrawal address
  console.log("== update withdrawal address ==");
  await buyMeACoffee.connect(owner).updateWithdrawalAddress(tipper3.address);

  // Withdraw.
  console.log("== withdraw start ==");
  await buyMeACoffee.connect(tipper3).withdrawTips();

  // Check balances after withdrawal.
  console.log("== withdraw end ==");
  await printBalances(addresses);

  // Check out the memos.
  console.log("== get memos ==");
  const memos = await buyMeACoffee.getMemos();
  printMemos(memos);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
