
from youtube_transcript_api import YouTubeTranscriptApi, NoTranscriptFound

def extract_transcript(video_url):
  try:
    # Handle both youtube.com and youtu.be URLs
    if 'youtu.be' in video_url:
        video_id = video_url.split('/')[-1].split('?')[0]
    else:
        video_id = video_url.split("=")[1].split("&")[0]
    
    # Create an instance of YouTubeTranscriptApi
    transcript_list = YouTubeTranscriptApi().get_transcript(video_id)
    transcript_text=" "
    for i in transcript_list:
      transcript_text += i['text'] + " "
    print("Transcript:", transcript_text)  # Print the transcript to console
    return transcript_text
  except Exception as e:
    print(f"Error: {str(e)}")
    raise e

if __name__ == "__main__":
    url = "https://youtu.be/HFfXvfFe9F8?si=ASYYUR5y_ZQsuSe1"
    try:
        extract_transcript(url)
    except Exception as e:
        print(f"Failed to extract transcript: {str(e)}")