from pydub import AudioSegment
import os

def change_mp3_gain(input_file, output_file, gain_db):
    """
    Changes the volume of an MP3 file and saves it.
    
    :param input_file: Path to the original MP3.
    :param output_file: Path to save the new MP3.
    :param gain_db: Amount of gain in decibels (e.g., +5.0 to increase, -5.0 to decrease).
    """
    
    if not os.path.exists(input_file):
        print(f"Error: The file {input_file} was not found.")
        return

    print(f"Loading '{input_file}'...")
    # Load the MP3 file
    audio = AudioSegment.from_mp3(input_file)
    
    

    print(f"Applying {gain_db}dB of gain...")
    # Add gain (Adding a number increases volume, subtracting decreases it)
    modified_audio = audio[10000:30000]

    print(f"Exporting to '{output_file}'...")
    # Export the modified audio
    # bitrate="192k" ensures the audio quality remains good. You can adjust this.
    modified_audio.export(output_file, format="mp3", bitrate="192k")
    
    print("Done!")

# --- Usage Example ---
if __name__ == "__main__":
    INPUT_FILE = "Papope.mp3"   # Replace with your file name
    OUTPUT_FILE = "Papope_.mp3" # Replace with your desired output name
    
    # Increase volume by 5 decibels
    GAIN_AMOUNT = 0 
    
    change_mp3_gain(INPUT_FILE, OUTPUT_FILE, GAIN_AMOUNT)