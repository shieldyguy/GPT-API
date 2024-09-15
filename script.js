let totalCost = 0; // Initialize total cost
const modelPrices = {}; // Object to store the model pricing details

// Function to fetch available models from the API
async function fetchModels() {
    const apiKey = document.getElementById('apiKey').value; // Get API key from the input
    if (!apiKey) {
        console.log("API key is empty, exiting fetch.");
        return; // Exit if there's no API key
    }

    console.log("Fetching models with API Key:", apiKey);
    
    try {
        const response = await fetch('https://api.openai.com/v1/models', { // Fetch models from OpenAI
            headers: {
                'Authorization': `Bearer ${apiKey}`
            }
        });

        console.log("Response Status:", response.status);
        
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const models = await response.json();
        console.log("Fetched Models:", models);

        // Check the structure of the response and populate the dropdown accordingly
        if (models && Array.isArray(models.data)) {
            populateModelDropdown(models.data); // Populate with the array of models
        } else {
            console.error('No models found or response structure is incorrect.');
        }

        // Optionally store model prices if available
        models.data.forEach(model => {
            modelPrices[model.id] = model.price; // Store price if provided
        });

    } catch (error) {
        console.error('Error fetching models:', error);
    }
}

// Function to populate the model dropdown
function populateModelDropdown(models) {
    const modelDropdown = document.getElementById('model');
    modelDropdown.innerHTML = ''; // Clear existing options
    models.forEach(model => {
        const option = document.createElement('option');
        option.value = model.id; // Assuming each model has an 'id' property
        option.textContent = model.id; // Display the model id or name
        modelDropdown.appendChild(option);
    });
}

async function sendMessage() {
    const apiKey = document.getElementById("apiKey").value;
    let username = document.getElementById("username").value || "User"; // Get custom username
    const model = document.getElementById("model").value;
    const userInput = document.getElementById("userInput").value;
    const chatOutput = document.getElementById("chatOutput");

    if (!apiKey || !userInput) {
        alert("Please enter your API key and query.");
        return;
    }

    console.log("User Input:", userInput);
    chatOutput.innerHTML += `<div class=\"user-message\">${username}: ${userInput}</div>`;
    document.getElementById("userInput").value = "";

    try {
        console.log("Sending request to OpenAI API...");
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: model,
                messages: [{ role: "user", content: userInput }],
            }),
        });

        console.log("Response status:", response.status);
        console.log("Response headers:", response.headers);

        if (!response.ok) {
            throw new Error(`Error: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        console.log("API Result:", result);

        // Get actual tokens used and associated cost
        const tokensUsed = result.usage.total_tokens; // Get total tokens used from API response
        const costPerToken = getCostPerToken(model); // Get dynamic cost per token based on the selected model
        const cost = tokensUsed * costPerToken; // Calculate the total cost based on tokens used
        totalCost += cost; // Update the total cost

        updateCostDisplay(totalCost); // Update the display of total cost

        const assistantResponse = result.choices[0]?.message?.content || "No response received.";
        chatOutput.innerHTML += `<div class=\"gpt-message\">ChatGPT: ${assistantResponse}</div>`;
    } catch (error) {
        console.error("Error during API call:", error);
        chatOutput.innerHTML += `<div>Error: ${error.message}</div>`;
    }
}

// Function to get the cost per token based on the selected model
function getCostPerToken(model) {
    return modelPrices[model] || 0.0001; // Return the price from stored values, or default if not found
}

function updateCostDisplay(cost) {
    const costElement = document.getElementById("apiCost");
    costElement.textContent = `Total Cost: $${cost.toFixed(4)}`;
}

// Initialize model dropdown when API key is provided
const apiKeyInput = document.getElementById("apiKey");
apiKeyInput.addEventListener('input', fetchModels); // Fetch models on input change
apiKeyInput.addEventListener('blur', fetchModels); // Keep fetching on blur as well

document.getElementById("sendButton").addEventListener("click", sendMessage);
