import React from 'react';
import { Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full py-4 mt-auto border-t bg-background">
      <div className="container flex items-center justify-center gap-1 text-sm text-muted-foreground">
        <div className="flex items-center">
          <img 
            src="/generated-icon.png" 
            alt="DropStore Logo" 
            className="w-5 h-5 mr-2"
          />
          <span>Dev by Jimmy Marley</span>
          <Heart className="w-3 h-3 ml-1 text-red-500" />
        </div>
      </div>
    </footer>
  );
}