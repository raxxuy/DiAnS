from textblob import TextBlob

def analyze_text(text):
    if not text:
        return 0.0
    
    blob = TextBlob(text)

    return blob.sentiment.polarity