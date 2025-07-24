# Vocario

Vocario is a cross-platform (iOS/Android/Web) mobile app built with Expo and React Native that helps you record meetings, transcribe them, and generate concise AI-powered summaries (meeting minutes) using Google Gemini. Effortlessly share, organize, and manage your meeting notes—all from your device.

---

## Features

- **Audio Recording**: Record meetings directly from your device.
- **AI Transcription & Summarization**: Automatically transcribe and summarize recordings using Google Gemini (requires API key).
- **Summary Sharing**: Share meeting minutes via email, clipboard, or native share dialog.
- **Import Audio**: Import audio files for transcription and summarization.
- **Edit & Organize**: Rename, delete, and manage your recordings and summaries.
- **Settings**: Configure your Gemini API key and email address.
- **Light/Dark Theme**: Modern, responsive UI with theme support.

---

## Screenshots

*Add screenshots of the main screens here (Recording, Summaries, Settings, etc.)*

---

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (18+ recommended)
- [Yarn](https://yarnpkg.com/) or npm
- [Expo CLI](https://docs.expo.dev/get-started/installation/)

### Installation

1. **Clone the repository:**
   ```sh
   git clone https://github.com/yourusername/ai-meeting-minutes.git
   cd ai-meeting-minutes
   ```
2. **Install dependencies:**
   ```sh
   yarn install
   # or
   npm install
   ```
3. **Start the development server:**
   ```sh
   yarn dev
   # or
   npm run dev
   ```
4. **Run on your device:**
   - Use the Expo Go app or an emulator/simulator.

---

## Configuration

### Google Gemini API Key
To enable AI transcription and summarization, you must provide your own [Google Gemini API key](https://aistudio.google.com/app/apikey):

1. Go to **Settings** in the app.
2. Enter your Gemini API key.
3. Save and start recording meetings!

### Optional: Email Address
You can add your email address in Settings for easier sharing and backup.

---

## Usage

- **Record a Meeting**: Tap the record button to start/stop recording.
- **Generate AI Minutes**: After recording, tap to generate a summary (requires Gemini API key).
- **Share or Copy**: Share summaries via email, clipboard, or native share.
- **Import Audio**: Use the import button to transcribe existing audio files.
- **Edit & Delete**: Rename or delete recordings and summaries as needed.

---

## Project Structure

- `app/` — Main app screens and navigation
- `components/` — Reusable UI components (RecordingButton, SummaryCard, ImportButton, etc.)
- `contexts/` — Theme and global state
- `utils/` — Utility modules (AI integration, storage, audio, markdown)
- `types/` — TypeScript types and interfaces
- `assets/` — Images and icons

---

## Dependencies

- **Expo** (React Native, Expo Router, Expo AV, Expo FileSystem, etc.)
- **Google Gemini** (AI transcription/summarization)
- **Lucide React Native** (icons)
- **AsyncStorage** (local storage)
- **React Native Markdown Display** (summary rendering)

See `package.json` for the full list.

---

## Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

---

## Credits

- Developed by [Brain Station 23](https://brainstation-23.com) and contributors.

---

## Contact

For support or inquiries, please contact the project owner or open an issue on GitHub.



## License

**Vocario** is licensed under the **Polyform Personal Use License 1.0.0 (Customized)**  
This means:

- ✅ Free for personal use
- ❌ No redistribution, hosting, or resale

© 2025 [Brain Station 23](https://brainstation-23.com)

Read the full license [here](./LICENSE.MD).


