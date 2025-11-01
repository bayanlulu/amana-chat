'use client';

import { useEffect, useState, useRef } from 'react';
import Ably from 'ably';

interface Message {
  id: string;
  text: string;
  clientId: string;
  timestamp: number;
}

export default function AmanaChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [username, setUsername] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  
  const ablyRef = useRef<Ably.Realtime | null>(null);
  const channelRef = useRef<Ably.RealtimeChannel | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const connectToAbly = async (name: string) => {
    try {
      const ably = new Ably.Realtime({
        authCallback: async (tokenParams, callback) => {
          try {
            const response = await fetch(`/api/ably-auth?clientId=${encodeURIComponent(name)}`);
            const tokenRequest = await response.json();
            callback(null, tokenRequest);
          } catch (error) {
            callback(error instanceof Error ? error.message : 'Authentication failed', null);
          }
        }
      });

      ablyRef.current = ably;

      ably.connection.on('connected', () => {
        setIsConnected(true);
        console.log('Connected to Ably');
      });

      ably.connection.on('disconnected', () => {
        setIsConnected(false);
        console.log('Disconnected from Ably');
      });

      const channel = ably.channels.get('amana-chat:public');
      channelRef.current = channel;

      // Wait for channel to attach before doing anything
      if (channel.state !== 'attached') {
        await channel.attach();
      }

      // Subscribe to messages
      channel.subscribe('message', (message) => {
        const newMessage: Message = {
          id: message.id || `${Date.now()}-${Math.random()}`,
          text: message.data.text,
          clientId: message.clientId || 'Anonymous',
          timestamp: message.timestamp || Date.now()
        };
        
        setMessages((prev) => [...prev, newMessage]);
      });

      // Subscribe to presence events
      channel.presence.subscribe('enter', (member) => {
        setOnlineUsers((prev) => new Set([...prev, member.clientId]));
      });

      channel.presence.subscribe('leave', (member) => {
        setOnlineUsers((prev) => {
          const updated = new Set(prev);
          updated.delete(member.clientId);
          return updated;
        });
      });

      // Enter presence after channel is attached
      await channel.presence.enter();

      // Get initial presence
      const presenceSet = await channel.presence.get();
      setOnlineUsers(new Set(presenceSet.map((member) => member.clientId)));

    } catch (error) {
      console.error('Failed to connect to Ably:', error);
      alert('Failed to connect to chat. Please check your configuration.');
    }
  };

  const handleJoinChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      setHasJoined(true);
      connectToAbly(username.trim());
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputText.trim() || !channelRef.current) return;

    channelRef.current.publish('message', {
      text: inputText.trim()
    });

    setInputText('');
  };

  const handleLeaveChat = async () => {
    try {
      if (channelRef.current) {
        const state = channelRef.current.state;
        // Leave presence first before detaching
        if (state === 'attached' || state === 'attaching') {
          await channelRef.current.presence.leave();
        }
        channelRef.current.unsubscribe();
        // Don't detach, let close() handle it
      }
      if (ablyRef.current) {
        ablyRef.current.close();
      }
    } catch (error) {
      console.error('Error leaving chat:', error);
    }
    setHasJoined(false);
    setIsConnected(false);
    setMessages([]);
    setOnlineUsers(new Set());
  };

  useEffect(() => {
    return () => {
      const cleanup = async () => {
        try {
          if (channelRef.current) {
            const state = channelRef.current.state;
            if (state === 'attached' || state === 'attaching') {
              await channelRef.current.presence.leave();
            }
            channelRef.current.unsubscribe();
          }
          if (ablyRef.current) {
            ablyRef.current.close();
          }
        } catch (error) {
          console.error('Cleanup error:', error);
        }
      };
      cleanup();
    };
  }, []);

  if (!hasJoined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 flex items-center justify-center p-4">
        <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl p-10 w-full max-w-md border border-white/20">
          <div className="text-center mb-8">
            <div className="inline-block p-4 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl mb-4 shadow-lg">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
              Amana Chat
            </h1>
            <p className="text-gray-600 font-medium">Connect with everyone in real-time</p>
          </div>
          
          <form onSubmit={handleJoinChat} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-2">
                What's your name?
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition text-gray-800 font-medium placeholder-gray-400"
                placeholder="Enter your name"
                maxLength={20}
                required
              />
            </div>
            
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:shadow-xl hover:scale-105 transition-all duration-200 shadow-lg"
            >
              Join Chat Room
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 p-4 flex items-center justify-center">
      <div className="w-full max-w-6xl h-[700px] flex gap-4">
        
        {/* Main Chat Area */}
        <div className="flex-1 bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl flex flex-col border border-white/20 overflow-hidden">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold">Amana Chat</h1>
                <div className="flex items-center gap-2 text-sm text-white/90">
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'} animate-pulse`}></div>
                  <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
                </div>
              </div>
            </div>
            <button
              onClick={handleLeaveChat}
              className="px-6 py-2.5 bg-white/20 hover:bg-white/30 rounded-xl transition font-semibold backdrop-blur-sm"
            >
              Leave Chat
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-gray-50 to-white">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="inline-block p-6 bg-purple-100 rounded-full mb-4">
                    <svg className="w-16 h-16 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-700 mb-2">No messages yet</h3>
                  <p className="text-gray-500">Be the first to start the conversation!</p>
                </div>
              </div>
            ) : (
              messages.map((msg) => {
                const isOwnMessage = msg.clientId === username;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                  >
                    <div className={`max-w-md ${isOwnMessage ? 'text-right' : 'text-left'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        {!isOwnMessage && (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-white font-bold text-sm">
                            {msg.clientId.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="text-xs font-semibold text-gray-600">
                          {msg.clientId}
                        </span>
                        {isOwnMessage && (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                            {msg.clientId.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div
                        className={`px-5 py-3 rounded-2xl shadow-md ${
                          isOwnMessage
                            ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-tr-none'
                            : 'bg-white text-gray-800 rounded-tl-none border border-gray-200'
                        }`}
                      >
                        <p className="break-words leading-relaxed">{msg.text}</p>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 px-2">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 p-5 bg-white">
            <form onSubmit={handleSendMessage} className="flex gap-3">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 px-5 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-gray-800 placeholder-gray-400"
                placeholder="Type your message..."
                disabled={!isConnected}
                maxLength={500}
              />
              <button
                type="submit"
                disabled={!isConnected || !inputText.trim()}
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-bold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
              >
                <span>Send</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </form>
          </div>
        </div>

        {/* Online Users Sidebar */}
        <div className="w-72 bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl p-6 border border-white/20 hidden lg:block">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-lg">Online Users</h3>
              <p className="text-sm text-gray-500">{onlineUsers.size} active</p>
            </div>
          </div>
          
          <div className="space-y-2 max-h-[580px] overflow-y-auto">
            {onlineUsers.size === 0 ? (
              <p className="text-center text-gray-400 text-sm py-8">No users online</p>
            ) : (
              Array.from(onlineUsers).map((user) => (
                <div
                  key={user}
                  className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl hover:shadow-md transition-all"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-white font-bold shadow-md">
                    {user.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 truncate">{user}</p>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-xs text-gray-500">Active now</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}