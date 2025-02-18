const category_names = {
  incoming_money: "Incoming Money",
  payments_to_code_holders: "Payments to Code Holders",
  transfers_to_mobile_numbers: "Transfer to Mobile Numbers",
  bank_deposits: "Bank Deposits",
  airtime_bill_payments: "Airtime Purchase",
  cash_power: "Cash Power",
  withdrawal: "Withdrawal",
  bank_transfer: "Bank Transfer",
  pack: "Internet and Voice Bundle Purchases",
  third_party: "Third Party",
  uncategorized: "No category",
};

let transactions = [];

const chartColors = {
  primaryColor: "#42b883",
  backgroundColor: "rgba(66, 184, 131, 0.1)",
  textColor: "#fff",
  gridColor: "rgba(255, 255, 255, 0.1)",
  colors: [
    "#42b883",
    "#ff6384",
    "#36a2eb",
    "#ffcd56",
    "#ff9f40",
    "#4bc0c0",
    "#9966ff",
    "#c9cbcf",
    "#ff9999",
    "#99ff99",
    "#99ccff",
  ],
};

function formatAmount(amount) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(amount);
}

let volumeChart = null;
let distributionChart = null;
let volumeByTypeChart = null;
let paymentsVsDepositsChart = null;

function createInitialCharts() {
  const volumeCtx = document
    .getElementById("transactionVolume")
    .getContext("2d");
  const distributionCtx = document
    .getElementById("transactionDistribution")
    .getContext("2d");
  const volumeByTypeCtx = document
    .getElementById("volumeByType")
    .getContext("2d");
  const paymentsVsDepositsCtx = document
    .getElementById("paymentsVsDeposits")
    .getContext("2d");

  Chart.defaults.color = chartColors.textColor;
  Chart.defaults.borderColor = chartColors.gridColor;
  Chart.defaults.font.family = "'Inter', 'Helvetica', 'Arial', sans-serif";
  Chart.defaults.font.size = 13;


  volumeChart = new Chart(volumeCtx, {
    type: "line",
    data: {
      labels: [],
      datasets: [
        {
          label: "Monthly Transaction Volume (RWF)",
          data: [],
          borderColor: chartColors.primaryColor,
          backgroundColor: chartColors.backgroundColor,
          tension: 0.4,
          fill: true,
          pointBackgroundColor: chartColors.primaryColor,
          pointBorderColor: "#fff",
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "top",
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              return `Volume: RWF ${formatAmount(context.raw)}`;
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    },
  });

  distributionChart = new Chart(distributionCtx, {
    type: "doughnut",
    data: {
      labels: [],
      datasets: [
        {
          data: [],
          backgroundColor: chartColors.colors,
          borderColor: "rgba(0, 0, 0, 0.1)",
          borderWidth: 2,
          offset: 4,
          hoverOffset: 10,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "right",
          labels: {
            padding: 20,
            usePointStyle: true,
            pointStyle: "circle",
            font: {
              size: 13,
            },
          },
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = ((context.raw / total) * 100).toFixed(1);
              return `${context.label}: RWF ${formatAmount(
                context.raw
              )} (${percentage}%)`;
            },
          },
          padding: 12,
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          titleFont: {
            size: 14,
          },
          bodyFont: {
            size: 13,
          },
        },
      },
      cutout: "60%",
      animation: {
        animateScale: true,
        animateRotate: true,
        duration: 2000,
        easing: "easeInOutQuart",
      },
    },
  });

  volumeByTypeChart = new Chart(volumeByTypeCtx, {
    type: "bar",
    data: {
      labels: [],
      datasets: [
        {
          label: "Transaction Volume by Type",
          data: [],
          backgroundColor: chartColors.colors,
          borderColor: "rgba(0, 0, 0, 0.1)",
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              return `Volume: RWF ${formatAmount(context.raw)}`;
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (value) => `RWF ${formatAmount(value)}`,
          },
        },
      },
    },
  });

  paymentsVsDepositsChart = new Chart(paymentsVsDepositsCtx, {
    type: "pie",
    data: {
      labels: ["Deposits", "Payments"],
      datasets: [
        {
          data: [0, 0],
          backgroundColor: [chartColors.colors[0], chartColors.colors[1]],
          borderColor: "rgba(0, 0, 0, 0.1)",
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "right",
          labels: {
            padding: 20,
            usePointStyle: true,
            pointStyle: "circle",
          },
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = ((context.raw / total) * 100).toFixed(1);
              return `${context.label}: RWF ${formatAmount(
                context.raw
              )} (${percentage}%)`;
            },
          },
        },
      },
    },
  });
}

async function fetchTransactions() {
  try {
    const response = await fetch("/transactions");
    transactions = await response.json();

    const total = document.querySelector(".balance-amount");
    total.textContent = `${formatAmount(
      parseInt(transactions[0].total_transactions)
    )} RWF`;

    populateTransactionTable(transactions);
    updateCharts(transactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
  }
}

const dateFilter = document.querySelector("#date-filter");
const searchInput = document.querySelector("#search");

const filterByDate = (selectedDate) => {
  if (!selectedDate) {
    populateTransactionTable(transactions);
    updateCharts(transactions);
    return;
  }

  const filterDate = new Date(selectedDate);
  filterDate.setUTCHours(0, 0, 0, 0);

  const filtered_transactions = transactions.filter((transaction) => {
    const transactionDate = new Date(transaction.readable_date);
    return (
      transactionDate.getUTCFullYear() === filterDate.getUTCFullYear() &&
      transactionDate.getUTCMonth() === filterDate.getUTCMonth() &&
      transactionDate.getUTCDate() === filterDate.getUTCDate()
    );
  });

  populateTransactionTable(filtered_transactions);
  updateCharts(filtered_transactions);
};

dateFilter.addEventListener("change", (event) => {
  filterByDate(event.target.value);
});

const searchAmount = (amount) => {
  let filtered_transactions = transactions;

  if (dateFilter.value) {
    const filterDate = new Date(dateFilter.value);
    filterDate.setUTCHours(0, 0, 0, 0);

    filtered_transactions = filtered_transactions.filter((transaction) => {
      const transactionDate = new Date(transaction.readable_date);
      return (
        transactionDate.getUTCFullYear() === filterDate.getUTCFullYear() &&
        transactionDate.getUTCMonth() === filterDate.getUTCMonth() &&
        transactionDate.getUTCDate() === filterDate.getUTCDate()
      );
    });
  }

  if (amount) {
    filtered_transactions = filtered_transactions.filter(
      (item) => parseInt(item.amount) === amount
    );
  }

  populateTransactionTable(filtered_transactions);
  updateCharts(filtered_transactions);
};

searchInput.addEventListener("input", (event) => {
  const inputAmount = event.target.value;
  searchAmount(Number(inputAmount));
});

function populateTransactionTable(transactions) {
  const tableBody = document.querySelector(".transactions-table tbody");
  tableBody.innerHTML = "";

  transactions.forEach((transaction) => {
    const row = document.createElement("tr");
    const amount = parseFloat(transaction.amount);
    const amountClass = amount >= 0 ? "text-green-500" : "text-red-500";

    row.innerHTML = `
          <td>${transaction.readable_date}</td>
          <td>${category_names[transaction.category]}</td>
          <td class="${amountClass}">RWF ${formatAmount(Math.abs(amount))}</td>
          <td>RWF ${formatAmount(parseFloat(transaction.balance))}</td>
      `;
    tableBody.appendChild(row);
  });
}

function updateCharts(transactions) {
  const monthlyData = {};

  transactions.forEach((transaction) => {
    const date = new Date(transaction.readable_date);
    const monthKey = `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}`;

    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = 0;
    }
    monthlyData[monthKey] += Math.abs(parseFloat(transaction.amount));
  });

  const sortedMonths = Object.keys(monthlyData).sort();

  const monthLabels = sortedMonths.map((month) => {
    const [year, monthNum] = month.split("-");
    const date = new Date(year, parseInt(monthNum) - 1);
    return date.toLocaleString("en-US", { month: "short", year: "numeric" });
  });

  volumeChart.config.type = "line";
  volumeChart.data = {
    labels: monthLabels,
    datasets: [
      {
        label: "Monthly Transaction Volume (RWF)",
        data: sortedMonths.map((month) => monthlyData[month]),
        borderColor: chartColors.primaryColor,
        backgroundColor: chartColors.backgroundColor,
        tension: 0.4,
        fill: true,
        pointBackgroundColor: chartColors.primaryColor,
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };
  volumeChart.options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          padding: 20,
          font: {
            size: 14,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            return `Volume: RWF ${formatAmount(context.raw)}`;
          },
        },
        padding: 12,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleFont: {
          size: 14,
        },
        bodyFont: {
          size: 13,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          drawBorder: false,
          color: chartColors.gridColor,
        },
        ticks: {
          callback: (value) => `RWF ${formatAmount(value)}`,
          padding: 10,
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45,
          padding: 10,
        },
      },
    },
    animation: {
      duration: 2000,
      easing: "easeInOutQuart",
    },
  };
  volumeChart.update();

  
  const categoryTotals = Object.keys(category_names).reduce((acc, key) => {
    acc[key] = 0;
    return acc;
  }, {});

  transactions.forEach((transaction) => {
    const category = transaction.category;
    categoryTotals[category] += Math.abs(parseFloat(transaction.amount));
  });

  const sortedCategories = Object.entries(categoryTotals)
    .sort(([, a], [, b]) => b - a)
    .filter(([, amount]) => amount > 0);

  const labels = sortedCategories.map(([category]) => category_names[category]);
  const amounts = sortedCategories.map(([, amount]) => amount);

  distributionChart.data.labels = labels;
  distributionChart.data.datasets[0].data = amounts;
  distributionChart.update();

  const typeVolumes = {};
  transactions.forEach((transaction) => {
    const type = category_names[transaction.category];
    if (!typeVolumes[type]) {
      typeVolumes[type] = 0;
    }
    typeVolumes[type] += Math.abs(parseFloat(transaction.amount));
  });

  const sortedTypes = Object.entries(typeVolumes).sort(([, a], [, b]) => b - a);

  volumeByTypeChart.data.labels = sortedTypes.map(([type]) => type);
  volumeByTypeChart.data.datasets[0].data = sortedTypes.map(
    ([, amount]) => amount
  );
  volumeByTypeChart.update();

  
  const depositCategories = ["incoming_money", "bank_deposits"];
  let totalDeposits = 0;
  let totalPayments = 0;

  transactions.forEach((transaction) => {
    const amount = Math.abs(parseFloat(transaction.amount));
    if (depositCategories.includes(transaction.category)) {
      totalDeposits += amount;
    } else {
      totalPayments += amount;
    }
  });

  paymentsVsDepositsChart.data.datasets[0].data = [
    totalDeposits,
    totalPayments,
  ];
  paymentsVsDepositsChart.update();
}


const typeFilter = document.querySelector("#type-filter");


function populateTypeFilter() {
  typeFilter.innerHTML = '<option value="">All Types</option>';
  Object.entries(category_names).forEach(([key, value]) => {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = value;
    typeFilter.appendChild(option);
  });
}

const selectElement = document.getElementById("type-filter");

for (const key in category_names) {
  if (category_names.hasOwnProperty(key)) {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = category_names[key];
    selectElement.appendChild(option);
  }
}


function filterTransactions() {
  let filtered_transactions = transactions;

  
  if (dateFilter.value) {
    const filterDate = new Date(dateFilter.value);
    filterDate.setUTCHours(0, 0, 0, 0);

    filtered_transactions = filtered_transactions.filter((transaction) => {
      const transactionDate = new Date(transaction.readable_date);
      return (
        transactionDate.getUTCFullYear() === filterDate.getUTCFullYear() &&
        transactionDate.getUTCMonth() === filterDate.getUTCMonth() &&
        transactionDate.getUTCDate() === filterDate.getUTCDate()
      );
    });
  }

  
  if (searchInput.value) {
    const searchAmount = Number(searchInput.value);
    filtered_transactions = filtered_transactions.filter(
      (item) => parseInt(item.amount) === searchAmount
    );
  }

  
  if (typeFilter.value) {
    filtered_transactions = filtered_transactions.filter(
      (transaction) => transaction.category === typeFilter.value
    );
  }

  populateTransactionTable(filtered_transactions);
  updateCharts(filtered_transactions);
}

typeFilter.addEventListener("change", filterTransactions);

function resetFilters() {
  searchInput.value = "";
  dateFilter.value = "";
  typeFilter.value = "";
  populateTransactionTable(transactions);
  updateCharts(transactions);
}

const resetButton = document.querySelector("#reset-filters");
if (resetButton) {
  resetButton.addEventListener("click", resetFilters);
}

window.onload = function () {
  createInitialCharts();
  fetchTransactions();
};
