import React, { useState } from "react";
import SendIcon from '@mui/icons-material/Send';
import ControlPointDuplicateIcon from '@mui/icons-material/ControlPointDuplicate';
import { Button, IconButton, InputAdornment, InputBase, Paper, TextField } from "@mui/material";

const conversations = [
    { id: 1, title: 'Conversation 1' },
    { id: 2, title: 'Conversation 2' },
    // Add more conversations here
    { id: 3, title: 'Conversation 3' },
    { id: 4, title: 'Conversation 4' },
    { id: 5, title: 'Conversation 5' },
    { id: 6, title: 'Conversation 6' },
    { id: 7, title: 'Conversation 7' },
    { id: 8, title: 'Conversation 8' },
    { id: 9, title: 'Conversation 9' },
    { id: 10, title: 'Conversation 10' },
    { id: 11, title: 'Conversation 11' },
    { id: 12, title: 'Conversation 12' },
    { id: 13, title: 'Conversation 13' },
    { id: 14, title: 'Conversation 14' },
    { id: 15, title: 'Conversation 15' },
    { id: 16, title: 'Conversation 16' },
    { id: 17, title: 'Conversation 17' },
    { id: 18, title: 'Conversation 18' },
    { id: 19, title: 'Conversation 19' },
    { id: 20, title: 'Conversation 20' },
];

const ChatWindow = () => {

    const [messages, setMessages] = useState([]);
    const [selectedSource, setSelectedSource] = useState('');

    const handleButtonClick = () => {
        setSelectedSource('New Chat');
    };

    const handleSendMessage = (message) => {
        if (message.trim() === '') return;
        const newMessage = { id: Date.now(), text: message, sender: 'user', source: 'User Typed' };
        setMessages([...messages, newMessage]);
        setSelectedSource(newMessage.source); // Update to display the source of the new message
    };

    return (

        // <Paper
        //     style={{ width: "60%", height: "50%", padding: "15px", margin: "auto", borderRadius: "20px", }}
        // >
        <div className="flex" style={{ height: '50vh' }}>

            <div className="overflow-auto border-r p-1" >

                <Button
                    className="my-1 bg-blue-500 hover:bg-blue-700 cursor-pointer "
                    variant="contained"
                    onClick={handleButtonClick}
                    startIcon={<ControlPointDuplicateIcon />}
                >
                    New Chat
                </Button>

                <div className="flex flex-col h-full">
                    <div className="flex-grow overflow-auto">
                        {conversations.map((conv) => (
                            <div key={conv.id} className={`p-1 hover:bg-gray-100 cursor-pointer ${selectedSource === conv.title ? 'bg-gray-100' : ''}`} onClick={() => setSelectedSource(conv.title)}>
                                <div className="flex items-center">
                                    <div className="flex-grow font-medium">{conv.title}</div>
                                    <div className="text-gray-500">
                                        <i className="fas fa-chevron-right"></i>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                </div>
            </div>

            <div className="flex-grow p-2 flex flex-col">
                <div className="flex-grow overflow-auto">
                    {messages.map((msg) => (
                        <div key={msg.id}
                            style={{ fontSize: 'small' }}
                            className={`m-2 p-2 rounded ${msg.sender === 'user' ? 'bg-gray-400 text-white self-end' : 'bg-gray-300'}`}
                            onClick={() => setSelectedSource(msg.source)}>
                            {msg.text}
                        </div>
                    ))}
                </div>
                <MessageInput onSendMessage={handleSendMessage} />

            </div>
        </div>
        // </Paper>
    );
}

const MessageInput = ({ onSendMessage }) => {
    const [message, setMessage] = useState('');
    const [selectedOption, setSelectedOption] = useState('');

    const handleSubmit = () => {
        onSendMessage(message, selectedOption);
        setMessage('');
        setSelectedOption('');
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault(); // Prevent form submission
            handleSubmit(); // Call handleSubmit function
        }
    };

    const modes = [
        { id: 1, title: 'Test', value: 'test' },
        { id: 2, title: 'Review', value: 'review' },
        { id: 3, title: 'Chat', value: 'chat' }
    ];

    return (
        <div>
            <div className="flex flex-col">
                <TextField
                    size="small"
                    type="text"
                    className="flex-grow p-2 rounded w-full"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message..."
                    fontSize="small"
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton type="submit" color="primary" onClick={handleSubmit}>
                                    <SendIcon />
                                </IconButton>
                            </InputAdornment>
                        )
                    }}
                    onKeyPress={handleKeyPress} // Call handleKeyPress function on key press so that user can hit enter to submit
                />
            </div>
            <div className="flex justify-center">
                {modes.map((mode) => (
                    <div key={mode.id} className="flex items-center mr-3">
                        <input
                            type="radio"
                            id={mode.value}
                            name="options"
                            value={mode.value}
                            checked={selectedOption === mode.value}
                            onChange={() => setSelectedOption(mode.value)}
                        />
                        <label htmlFor={mode.value} className="ml-1">{mode.title}</label>
                    </div>
                ))}
            </div>


        </div>
    );
};


export default ChatWindow;