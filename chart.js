let prompt = document.querySelector("#prompt");
let submitbtn = document.querySelector("#submit");
let chatContainer = document.querySelector(".chat-container");
let chartCanvas = document.getElementById("chartCanvas");
let chart;
let selectedChartType = "bar"; // Default chart type is Pie

// Function to handle the chart update
function updateChart(labels, values) {
  // If the chart already exists, destroy it
  if (chart) {
    chart.destroy();
  }

  const chartTitle = document.getElementById("chartTitle").value || "Chart";
  const borderColor = document.getElementById("chartBorderColor").value || "#4caf50";
  const borderWidth = document.getElementById("chartBorderWidth").value || 1;
  const hoverColor = document.getElementById("chartHoverColor").value || "#FF6384";

  // Create a new chart with the selected chart type
  const ctx = chartCanvas.getContext("2d");
  chart = new Chart(ctx, {
    type: selectedChartType, // Use the selected chart type
    data: {
      labels: labels,
      datasets: [
        {
          label: chartTitle,
          data: values,
          backgroundColor: [
            "#FF6384",
            "#36A2EB",
            "#FFCE56",
            "#4BC0C0",
            "#9966FF",
          ],
          borderColor: borderColor,
          borderWidth: borderWidth,
          hoverBackgroundColor: hoverColor, // Custom hover color
          hoverOffset: 6, // Ensures hover offset is consistent
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "top",
        },
        tooltip: {
          callbacks: {
            label: function (tooltipItem) {
              let value = tooltipItem.raw;

              // Check if value exceeds a certain limit (e.g., 1000)
              if (value > 1000) {
                return tooltipItem.label + ": " + value; // Show raw value for large values
              }

              // Otherwise, show percentage
              let sum = 0;
              tooltipItem.chart.data.datasets[0].data.forEach((data) => {
                sum += data;
              });
              let percentage = ((value / sum) * 100).toFixed(2) + "%";
              return tooltipItem.label + ": " + percentage;
            },
          },
        },
        datalabels: {
          color: "#fff",
          formatter: function (value, context) {
            let sum = 0;
            let dataArr = context.chart.data.datasets[0].data;
            dataArr.map((data) => {
              sum += data;
            });

            // If value exceeds 1000, show the raw value instead of percentage
            if (value > 1000) {
              return value;
            }

            let percentage = ((value / sum) * 100).toFixed(2) + "%";
            return percentage;
          },
          anchor: "end",
          align: "start",
        },
      },
    },
  });

  // Display the table below the chart
  displayTable(labels, values);
}

// Function to display the table with data
function displayTable(labels, values) {
  let table = document.getElementById("dataTable");
  let tbody = table.querySelector("tbody");
  tbody.innerHTML = ""; // Clear previous rows

  labels.forEach((label, index) => {
    let row = document.createElement("tr");
    let labelCell = document.createElement("td");
    labelCell.textContent = label;
    let valueCell = document.createElement("td");
    valueCell.textContent = values[index];

    row.appendChild(labelCell);
    row.appendChild(valueCell);
    tbody.appendChild(row);
  });

  document.getElementById("tableContainer").style.display = "block"; // Show the table
}

// Function to download the chart as an image
function downloadChartImage() {
  const link = document.createElement("a");
  link.href = chartCanvas.toDataURL("image/png");
  link.download = "chart.png";
  link.click();
}

// Event listener for selecting chart type
document
  .querySelector("#chartTypeSelect")
  .addEventListener("change", (e) => {
    selectedChartType = e.target.value;

    // If chart data exists, update the chart with the selected type
    const labels = chart ? chart.data.labels : [];
    const values = chart ? chart.data.datasets[0].data : [];

    if (labels.length > 0 && values.length > 0) {
      updateChart(labels, values); // Redraw the chart with the new type
    }
  });

// Event listener for the download button
document
  .getElementById("downloadChart")
  .addEventListener("click", downloadChartImage);

let user = {
  message: null,
  file: {
    mime_type: null,
    data: null,
  },
};

// Function to handle the AI response and chart update
async function generateResponse(aiChatBox) {
  let text = aiChatBox.querySelector(".ai-chat-area");

  // Display the dots animation while the AI is processing the response
  text.innerHTML =
    '<div class="dots"><span>.</span><span>.</span><span>.</span><span>.</span><span>.</span></div>';

  let RequestOption = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: user.message },
            user.file.data ? [{ inline_data: user.file }] : [],
          ],
        },
      ],
    }),
  };

  try {
    let response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AIzaSyCgerG7br7y2imduS_lOInYNgrNB_1kudc",
      RequestOption
    );
    let data = await response.json();
    let apiResponse = data.candidates[0].content.parts[0].text
      .replace(/\\(.?)\\*/g, "$1")
      .trim();

    // Replace the dots animation with the actual AI response
    text.innerHTML = apiResponse;

    // Try to parse the JSON data for the chart
    try {
      const jsonData = JSON.parse(apiResponse);
      if (jsonData.labels && jsonData.values) {
        updateChart(jsonData.labels, jsonData.values);
      }
    } catch (e) {
      console.log("No chart data in the response.");
    }
  } catch (error) {
    console.log(error);
    text.innerHTML = "Sorry, something went wrong. Please try again.";
  } finally {
    chatContainer.scrollTo({
      top: chatContainer.scrollHeight,
      behavior: "smooth",
    });
    user.file = {};
  }
}

function createChatBox(html, classes) {
  let div = document.createElement("div");
  div.innerHTML = html;
  div.classList.add(classes);
  return div;
}

function handlechatResponse(userMessage) {
  let queryPayload =
    '\nGenerate data for provided Keyword that visualizes the data from your internal memory. Provide the output in JSON format with the following structure:\n{\n  "labels": ["Label1", "Label2", "Label3", ...],\n  "values": [Value1, Value2, Value3, ...]\n}\nEnsure the labels represent [WHAT_LABELS_REPRESENT] and the values represent [WHAT_VALUES_REPRESENT]. If applicable, ensure the values fall within an appropriate range based on the data. Make sure to not to generate any other text content. Just the JSON Content with absolute in raw form. Don\'t encapsulate the JSON content in code blocks.\n';

  let displayMessage = userMessage; // User's message without the internal payload

  user.message = queryPayload + userMessage; // The full query (including payload) will be sent to the API

  let html = `

          <div class="user-chat-area">
              ${displayMessage}
          </div>
      `;

  prompt.value = ""; // Clear the input field after sending
  let userChatBox = createChatBox(html, "user-chat-box");
  chatContainer.appendChild(userChatBox);

  chatContainer.scrollTo({
    top: chatContainer.scrollHeight,
    behavior: "smooth",
  });

  setTimeout(() => {
    let html = `

              <div class="ai-chat-area">
                  <img src="loading.webp" alt="" class="load" width="50px">
              </div>
          `;
    let aiChatBox = createChatBox(html, "ai-chat-box");
    chatContainer.appendChild(aiChatBox);
    generateResponse(aiChatBox);
  }, 600);
}

prompt.addEventListener("keydown", (e) => {
  if (e.key == "Enter") {
    handlechatResponse(prompt.value);
  }
});

submitbtn.addEventListener("click", () => {
  handlechatResponse(prompt.value);
});
// Array to store downloaded charts
let downloadedCharts = [];

// Function to download the chart as an image
function downloadChartImage() {
  const link = document.createElement("a");
  const imageURL = chartCanvas.toDataURL("image/png");
  link.href = imageURL;
  link.download = "chart.png";
  link.click();

  // Store the image URL in the downloadedCharts array
  downloadedCharts.push(imageURL);
  console.log("Chart downloaded!");

  // Optionally show a notification or alert to indicate the chart was downloaded
  alert("Chart has been downloaded.");

  // Optionally, show all downloaded charts in the gallery
  displayDownloadedCharts();
}

// Function to display all downloaded charts
function displayDownloadedCharts() {
  const downloadedChartsContainer =
    document.getElementById("downloadedCharts");
  downloadedChartsContainer.innerHTML = ""; // Clear previous charts

  // Loop through the downloadedCharts array and add each image to the container
  downloadedCharts.forEach((imageURL) => {
    const img = document.createElement("img");
    img.src = imageURL;
    img.alt = "Downloaded Chart";
    img.style.width = "200px"; // Adjust size as needed
    img.style.borderRadius = "8px";
    downloadedChartsContainer.appendChild(img);
  });

  // Show the container if there are downloaded charts
  document.getElementById("allChartsContainer").style.display = "block";
}

// Event listener for the "Show All Downloaded Charts" button
document.getElementById("showAllCharts").addEventListener("click", () => {
  displayDownloadedCharts();
});
