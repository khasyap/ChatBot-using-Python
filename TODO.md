# TODO: Replace Dialogflow with Google Gemini Chatbot

## Tasks
- [x] Remove Dialogflow integration from templates/index.html
- [x] Add custom chatbot UI to templates/index.html
- [x] Update static/script.js to integrate Google Gemini API for chat responses
- [x] Add API key handling (note: exposing API key in frontend is insecure; consider backend integration)
- [ ] Test the new chatbot functionality

## Details
- Replace df-messenger with a custom chat interface
- Use Google Gemini API via REST endpoint in frontend JavaScript
- API key will be stored in script.js (insecure; recommend moving to backend)
- To add your Gemini API key: Replace 'YOUR_GEMINI_API_KEY_HERE' in static/script.js with your actual key
