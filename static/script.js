// document.getElementById('studentForm').addEventListener('submit', function(e) {
//     e.preventDefault();
//     const student = {
//         name: document.getElementById('name').value,
//         goal: document.getElementById('goal').value,
//         skills: document.getElementById('skills').value,
//         time: document.getElementById('time').value,
//         duration: document.getElementById('duration').value
//     };

//     fetch('/roadmap', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(student)
//     })
//     .then(res => res.json())
//     .then(data => {
//         document.getElementById('successMsg').innerHTML = `<b>Roadmap:</b> ${data.message}`;
//     })
//     .catch(() => {
//         document.getElementById('successMsg').textContent = "Could not generate roadmap.";
//     });
// });




document.getElementById('studentForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const userInput = {
        name: document.getElementById('name').value,
        goal: document.getElementById('goal').value,
        skills: document.getElementById('skills').value,
        time: document.getElementById('time').value,
        duration: document.getElementById('duration').value
    };

    fetch('/roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userInput)
    })
    .then(res => res.json())
    .then(data => {
        document.getElementById('successMsg').innerHTML = `<b>Roadmap:</b> ${data.message}`;
    })
    .catch(() => {
        document.getElementById('successMsg').textContent = "Error generating roadmap.";
    });
});

// Google Gemini API Key - Replace with your actual API key and set the model name below.
// NOTE: It's safer to call the Gemini API from a server to avoid exposing your API key in client code.
const GEMINI_API_KEY = 'AIzaSyAzzYsiW8zdt1fEghEUHYJ1tbSwNLpT3X8'; // <-- Add your API key here (or leave placeholder to use local bot)
// Set GEMINI_MODEL to a supported model name. You can use either the short name (e.g. "gemini-2.5-flash")
// or the full resource name returned by ListModels (e.g. "models/gemini-2.5-flash").
// Example of a valid default from your ListModels output:
const GEMINI_MODEL = 'models/gemini-flash-latest'; // <-- Set the model you want to use (example: gemini-1.0). See ListModels for available models.

async function listAvailableModels() {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`;
    try {
        const res = await fetch(url);
        if (!res.ok) {
            const txt = await res.text();
            console.error('ListModels failed:', res.status, res.statusText, txt);
            return [];
        }
        const data = await res.json();
        if (!data || !data.models) return [];
        return data.models.map(m => m.name || (m.model || m));
    } catch (err) {
        console.error('ListModels error:', err);
        return [];
    }
}

async function sendToGemini(message) {
    const model = GEMINI_MODEL;
    // Build URL robustly: if GEMINI_MODEL already includes the 'models/' prefix use it directly,
    // otherwise use the /models/{model} path.
    const basePath = model.startsWith('models/') ? `v1beta/${model}:generateContent` : `v1beta/models/${model}:generateContent`;
    const url = `https://generativelanguage.googleapis.com/${basePath}?key=${GEMINI_API_KEY}`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: message
                    }]
                }]
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Gemini API Error Details:', {
                status: response.status,
                statusText: response.statusText,
                body: errorText
            });

            // If model is not found or unsupported for generateContent, fetch available models to help the user
            if (response.status === 404 || /not found/i.test(errorText) || /not supported/i.test(errorText)) {
                const available = await listAvailableModels();
                console.warn('Available models:', available);
                throw new Error(`Gemini model "${model}" not found or not supported for generateContent. Available models: ${available.slice(0,20).join(', ') || 'none (see console)'} -- Run ListModels or set GEMINI_MODEL to one of these values (use either the short name like "gemini-2.5-flash" or the full resource "models/..." as returned by ListModels).`);
            }

            throw new Error(`Gemini API Error: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();
        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
            console.error('Unexpected API response:', data);
            throw new Error('Invalid response format from Gemini API');
        }
        return data.candidates[0].content.parts[0].text;
    } catch (err) {
        // Re-throw so caller can handle displaying user-friendly message
        throw err;
    }
}

// Local fallback chatbot (simple rule-based, async to match Gemini usage)
function localBot(message) {
	// Lightweight async rule-based responses for offline/demo mode
	return new Promise((resolve) => {
		const m = (message || '').toLowerCase();
		setTimeout(() => {
			if (/^(hi|hello|hey|hiya)\b/.test(m)) {
				return resolve('Hello! I am AIRA. Tell me your learning goal and I can suggest a roadmap.');
			}
			if (m.includes('roadmap') || m.includes('plan') || m.includes('path')) {
				return resolve('To craft a roadmap, tell me your goal, current skills, time per week, and preferred duration.');
			}
			if (m.includes('skills') || m.includes('experience')) {
				return resolve('Share the specific skills you already know (e.g., HTML, Python), and I will tailor steps.');
			}
			if (m.includes('thank') || m.includes('thanks')) {
				return resolve("You're welcome! Ask for a roadmap any time.");
			}
			// fallback: echo with guidance
			return resolve("I can help with learning roadmaps. Try: 'Create a roadmap to become a frontend developer in 6 months' or ask a specific question.");
		}, 250); // small delay to simulate processing
	});
}

// Chat UI elements and helper (re-added to avoid "sendBtn is not defined" errors)
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');

function addMessage(message, isUser = false) {
	// If the chat container doesn't exist, log and skip rendering to avoid runtime errors.
	if (!chatMessages) {
		console.warn('Chat container not found. Skipping addMessage():', message);
		return;
	}
	const messageDiv = document.createElement('div');
	messageDiv.className = isUser ? 'user-message' : 'bot-message';
	messageDiv.textContent = message;
	chatMessages.appendChild(messageDiv);
	chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Replace direct listener attachments with guarded attachments so missing elements don't throw.
if (sendBtn) {
	sendBtn.addEventListener('click', async () => {
		const message = chatInput ? chatInput.value.trim() : '';
		if (!message) return;

		addMessage(message, true);
		if (chatInput) chatInput.value = '';

		// If no Gemini API key provided, use the local fallback bot
		if (GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
			try {
				const response = await localBot(message);
				addMessage(response);
			} catch (err) {
				addMessage('Sorry, local bot encountered an error. Check console for details.');
				console.error('Local bot error:', err);
			}
			return;
		}

		// Otherwise attempt Gemini
		try {
			const response = await sendToGemini(message);
			addMessage(response);
		} catch (error) {
			// If Gemini fails, fall back to local bot as a graceful fallback
			console.error('Gemini API Error:', error);
			try {
				const fallback = await localBot(message);
				addMessage(fallback + ' (served by local fallback)');
			} catch (err) {
				addMessage('Sorry, I encountered an error. Check console for details and ensure GEMINI_MODEL and API key are correct.');
				console.error('Fallback error:', err);
			}
		}
	});
} else {
	console.warn('send-btn element not found. Chat send button disabled.');
}

if (chatInput) {
	chatInput.addEventListener('keypress', (e) => {
		if (e.key === 'Enter' && sendBtn) {
			sendBtn.click();
		}
	});
} else {
	console.warn('chat-input element not found. Enter key disabled for chat.');
}

// Initial welcome message (only if chat container exists)
if (typeof addMessage === 'function' && chatMessages) {
	addMessage('Hello! I am AIRA, your AI assistant for learning roadmaps. How can I help you today?');
}
