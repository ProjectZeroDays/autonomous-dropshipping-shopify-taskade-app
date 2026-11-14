function calculateNetProfit(grossSalesUSD, wholesaleCogUSD, shippingCostUSD) {
    const stripePercentageFee = 0.029;
    const stripeFixedFee = 0.30;
    
    const gatewayFee = (grossSalesUSD * stripePercentageFee) + stripeFixedFee;
    const totalExpenses = gatewayFee + wholesaleCogUSD + shippingCostUSD;
    const netProfitUSD = grossSalesUSD - totalExpenses;
    const netMarginPercentage = (netProfitUSD / grossSalesUSD) * 100;

    return {
        grossSales: parseFloat(grossSalesUSD.toFixed(2)),
        stripeFee: parseFloat(gatewayFee.toFixed(2)),
        wholesaleCost: parseFloat(wholesaleCogUSD.toFixed(2)),
        shippingCost: parseFloat(shippingCostUSD.toFixed(2)),
        totalExpenses: parseFloat(totalExpenses.toFixed(2)),
        netProfit: parseFloat(netProfitUSD.toFixed(2)),
        netMargin: parseFloat(netMarginPercentage.toFixed(2))
    };
}

module.exports = { calculateNetProfit };
