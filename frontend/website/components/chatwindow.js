import React, { useState } from "react";


const conversations = [
    { id: 1, title: 'Conversation 1' },
    { id: 2, title: 'Conversation 2' },
    // Add more conversations as needed
];

const ChatWindow = () => {

    const [messages, setMessages] = useState([]);
    const [selectedSource, setSelectedSource] = useState('');


    const handleSendMessage = (message) => {
        if (message.trim() === '') return;
        const newMessage = { id: Date.now(), text: message, sender: 'user', source: 'User Typed' };
        setMessages([...messages, newMessage]);
        setSelectedSource(newMessage.source); // Update to display the source of the new message
        // Here, you'd send the message to your backend/API and get a response, including the source of the response
    };

    // return <><p>Chat Interface here</p></>

    return (

        <div className="flex" style={{ height: '30vh' }}>
            {/* Conversations List */}
            <div className="overflow-auto border-r">
                {conversations.map((conv) => (
                    <div key={conv.id} className="p-2 hover:bg-gray-100 cursor-pointer">
                        {conv.title}
                    </div>
                ))}
            </div>

            {/* Chat Window */}
            <div className="flex-grow p-4 flex flex-col">
                <div className="flex-grow overflow-auto">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`m-2 p-2 rounded ${msg.sender === 'user' ? 'bg-blue-500 text-white self-end' : 'bg-gray-300'}`}
                            onClick={() => setSelectedSource(msg.source)}>
                            {msg.text}
                        </div>
                    ))}
                </div>
                <MessageInput onSendMessage={handleSendMessage} />
            </div>

            {/* Source Panel */}
            <div className="w-1/4 overflow-auto border-l">
                <div className="p-2">
                    <p className="font-bold">Source Submissions:</p>
                    <p>{selectedSource}</p>
                </div>
            </div>
        </div>

    );
}


const MessageInput = ({ onSendMessage }) => {
    const [message, setMessage] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onSendMessage(message);
        setMessage('');
    };

    return (
        <form onSubmit={handleSubmit} className="flex mt-4">
            <input
                type="text"
                className="flex-grow p-2 border"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
            />
            <button type="submit" className="p-2 bg-blue-500 text-white">
                Send
            </button>
        </form>
    );
};

export default ChatWindow;