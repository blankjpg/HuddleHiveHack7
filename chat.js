// Import API key from config file
import config from './config.js';
const OPENAI_API_KEY = config.OPENAI_API_KEY;

// DOM elements
const chatToggle = document.getElementById('chat-toggle');
const chatWindow = document.getElementById('chat-window');
const chatClose = document.getElementById('chat-close');
const chatInput = document.getElementById('chat-input');
const chatSend = document.getElementById('chat-send');
const chatMessages = document.getElementById('chat-messages');

// Conversation history
let conversationHistory = [
    {
        role: 'system',
        content: 'You are a helpful AI assistant for HuddleHive. You help users with questions about the application and provide friendly, concise assistance.'
    }
];

// Toggle chat window
chatToggle.addEventListener('click', () => {
    chatWindow.classList.toggle('hidden');
    if (!chatWindow.classList.contains('hidden')) {
        chatInput.focus();
    }
});

// Close chat window
chatClose.addEventListener('click', () => {
    chatWindow.classList.add('hidden');
});

// Send message on button click
chatSend.addEventListener('click', sendMessage);

// Send message on Enter key
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// Main send message function
async function sendMessage() {
    const message = chatInput.value.trim();
    
    if (!message) return;
    
    // Check if API key is set
    if (OPENAI_API_KEY === 'your_openai_api_key_here' || !OPENAI_API_KEY) {
        addMessage('Please set your OpenAI API key in config.js file.', 'bot');
        return;
    }
    
    // Add user message to chat
    addMessage(message, 'user');
    
    // Clear input
    chatInput.value = '';
    
    // Disable input while processing
    chatInput.disabled = true;
    chatSend.disabled = true;
    
    // Show typing indicator
    const typingIndicator = showTypingIndicator();
    
    try {
        // Add user message to conversation history
        conversationHistory.push({
            role: 'user',
            content: message
        });
        
        // Call OpenAI API
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: conversationHistory,
                max_tokens: 500,
                temperature: 0.7
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'API request failed');
        }
        
        const data = await response.json();
        const aiMessage = data.choices[0].message.content;
        
        // Add AI response to conversation history
        conversationHistory.push({
            role: 'assistant',
            content: aiMessage
        });
        
        // Remove typing indicator
        typingIndicator.remove();
        
        // Add AI message to chat
        addMessage(aiMessage, 'bot');
        
    } catch (error) {
        console.error('Error:', error);
        typingIndicator.remove();
        addMessage('Sorry, I encountered an error. Please try again. Error: ' + error.message, 'bot');
    } finally {
        // Re-enable input
        chatInput.disabled = false;
        chatSend.disabled = false;
        chatInput.focus();
    }
}

// Add message to chat
function addMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');
    messageDiv.classList.add(sender === 'user' ? 'user-message' : 'bot-message');
    
    const messageText = document.createElement('p');
    messageText.textContent = text;
    
    messageDiv.appendChild(messageText);
    chatMessages.appendChild(messageDiv);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Show typing indicator
function showTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.classList.add('typing-indicator');
    typingDiv.innerHTML = '<span></span><span></span><span></span>';
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return typingDiv;
}
