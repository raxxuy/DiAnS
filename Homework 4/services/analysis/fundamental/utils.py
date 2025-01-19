from typing import Optional
from textblob import TextBlob

def analyze_text(text: Optional[str]) -> float:
    """Analyze sentiment of text using natural language processing"""
    if not text:
        return 0.0
    
    try:
        # Create TextBlob object for sentiment analysis
        blob = TextBlob(text)
        
        # Return polarity score
        return blob.sentiment.polarity
        
    except Exception as e:
        print(f"Error analyzing text: {str(e)}")
        return 0.0  # Return neutral sentiment on error