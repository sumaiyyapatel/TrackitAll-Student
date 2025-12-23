import React, { useState, useEffect } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export const VoiceInput = ({ onResult, buttonText = "Voice Input" }) => {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'en-US';

      recognitionInstance.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        
        // Parse voice input: "I spent 500 on food"
        const amountMatch = transcript.match(/\d+/);
        const categoryMatch = transcript.toLowerCase().match(/food|transport|shopping|entertainment|education|bills|health/);
        
        if (amountMatch) {
          const amount = amountMatch[0];
          const category = categoryMatch ? categoryMatch[0].charAt(0).toUpperCase() + categoryMatch[0].slice(1) : 'Other';
          
          onResult({
            amount,
            category,
            description: transcript
          });
          
          toast.success(`Parsed: ₹${amount} for ${category}`);
        } else {
          toast.error('Could not parse amount from speech');
        }
      };

      recognitionInstance.onerror = (event) => {
        toast.error('Voice input error. Please try again.');
        setIsListening(false);
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
      };

      setRecognition(recognitionInstance);
    }
  }, [onResult]);

  const toggleListening = () => {
    if (!recognition) {
      toast.error('Voice input not supported in your browser');
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
      toast.info('Listening... Say "I spent 500 on food"');
    }
  };

  return (
    <Button
      type="button"
      onClick={toggleListening}
      variant={isListening ? "destructive" : "outline"}
      className={`border-white/10 ${isListening ? 'animate-pulse' : ''}`}
      data-testid="voice-input-button"
    >
      {isListening ? <MicOff className="w-4 h-4 mr-2" /> : <Mic className="w-4 h-4 mr-2" />}
      {isListening ? 'Stop' : buttonText}
    </Button>
  );
};
