<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Gemini Node Canvas

A visual node-based editor for creating powerful AI workflows using the Gemini API. Build creative stories, generate images and videos, and bring your ideas to life through an interactive canvas interface.

## Features

### Story Creation Tools
- **Story Expander** - Transform story premises into fully developed narratives
- **Short Story Writer** - Generate complete short stories from prompts
- **Screenplay Writer** - Create screenplays with Tarantino-style QT Mode support
- **Character Portfolio** - Generate comprehensive character profiles and visualizations

### Media Generation
- **Image Generator** - Create images from text prompts with aspect ratio control
- **Image Editor** - Edit images using natural language prompts
- **Image Mixer** - Blend multiple images with AI-powered mixing
- **Video Generator** - Generate videos from text or image prompts with Veo 3.1 resolution, aspect ratio, and duration controls

### Workflow Features
- **Visual Node Canvas** - Intuitive drag-and-drop interface for connecting AI operations
- **Gallery System** - Persistent storage for all generated media with metadata
- **Project Management** - Save and organize multiple creative workflows
- **Template System** - Quick-start templates for common workflows
- **Dark/Light Themes** - Customizable appearance

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- Gemini API key ([Get one here](https://ai.google.dev/))

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Story-node-gemini
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure API key**

   Create a `.env.local` file in the project root:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```

4. **Run the application**
   ```bash
   npm run dev
   ```

   This launches:
   - Frontend server at http://localhost:3000
   - Backend Express server for media storage
   - Generated media saved to `generated/` folder

### Deployment

Build for production:
```bash
npm run build
npm run preview
```

## Usage

1. **Create nodes** - Right-click on the canvas to open the node menu
2. **Connect workflows** - Drag from output handles to input handles to create connections
3. **Configure parameters** - Adjust prompts, settings, and inputs within each node
4. **Generate content** - Click "Generate" on nodes to execute AI operations
5. **View gallery** - Access all generated content through the gallery panel
6. **Save projects** - Store your workflows for later use

## Technology Stack

- **Frontend**: React 19, TypeScript, Vite
- **Backend**: Express.js
- **AI**: Google Gemini 2.5 Flash API
- **UI**: Lucide React icons, custom canvas rendering

## Project Structure

```
├── components/         # React UI components
├── contexts/          # React context providers (theme, preferences)
├── hooks/             # Custom React hooks
├── services/          # API integration (Gemini, gallery, projects)
├── utils/             # Helper functions and configurations
├── server/            # Express backend for media storage
├── generated/         # Generated media files (created at runtime)
├── types.ts           # TypeScript type definitions
└── App.tsx            # Main application component
```

## Recent Updates

- Character Sheets renamed to Character Portfolio with improved layout
- Enhanced safety filter detection and error handling
- Image Mixer supports multiple input formats
- Stable Gemini 2.5 Flash Image API integration
- QT Mode for Tarantino-style screenplays
- Organized node menu with Story Writing and Character Tools categories

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

[Add your license here]

## Links

- [View in AI Studio](https://ai.studio/apps/drive/1h2NVMN1Kj8VkoWwByhLeN5mPMFhGln5M)
- [Gemini API Documentation](https://ai.google.dev/docs)
