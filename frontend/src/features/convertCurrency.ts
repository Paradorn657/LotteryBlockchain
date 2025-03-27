"use server"

export async function convertETHtoTHB(ethAmount: number) {
    try {
        const response = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=thb");
        const data = await response.json();
        const rate = data.ethereum.thb; // Get ETH to THB conversion rate
        const thbAmount = ethAmount * rate;
        console.log(`${ethAmount} ETH = ${thbAmount.toFixed(2)} THB`);
        return thbAmount;
    } catch (error) {
        console.error("Error fetching ETH price:", error);
    }
}

export async function convertTHBtoETH(thbAmount: number) {
    try {
        const response = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=thb");
        const data = await response.json();
        const ethPrice = data.ethereum.thb; // Get 1 ETH price in THB
        const ethAmount = thbAmount / ethPrice; // Convert THB to ETH
        console.log(`${thbAmount} THB = ${ethAmount.toFixed(6)} ETH`);
        return ethAmount;
    } catch (error) {
        console.error("Error fetching ETH price:", error);
    }
}